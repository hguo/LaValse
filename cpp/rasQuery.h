#ifndef _RASQUERY_H
#define _RASQUERY_H

#include "ras.h"
#include <cstdlib>
#include <thread>
#include <sched.h>

#ifdef __APPLE__
#include <mach/mach_init.h>
#include <mach/thread_policy.h>
#include <mach/thread_act.h>
#define cpu_set_t thread_affinity_policy_data_t
#define CPU_SET(cpu_id, new_mask) \
        (*(new_mask)).affinity_tag = (cpu_id + 1)
#define CPU_ZERO(new_mask)                 \
        (*(new_mask)).affinity_tag = THREAD_AFFINITY_TAG_NULL
#define GET_AFFINITY(pid, size, mask) \
         (*(mask)).affinity_tag = THREAD_AFFINITY_TAG_NULL
#define SET_AFFINITY(pid, size, mask)       \
        thread_policy_set(mach_thread_self(), THREAD_AFFINITY_POLICY, \
                          (int *)mask, THREAD_AFFINITY_POLICY_COUNT)
#endif


namespace ras {

struct Query;

struct QueryResults {
  uint32_t *timeVolume, *subTimeVolumes[5];
  uint32_t msgID[NUM_MSGID], component[NUM_COMP], locationType[NUM_LOC], 
           category[NUM_CAT], severity[NUM_SEV], RMN[NUM_RMN];
  uint32_t slots; // time slots
  std::vector<uint32_t> topRecIDs;

  explicit QueryResults(const Query& q);
  ~QueryResults();
};

struct Query {
  uint64_t T0 = 1420070400000, T1 = 1451606400000; // time scope
  uint64_t t0 = 1420070400000, t1 = 1451606400000, tg = TIME_HOUR; // tg is time granularity
  uint8_t subvolumes = 0;
  int top = 100; // return top n recIDs
  int nthreads = 1;

  bool msgID[NUM_MSGID], component[NUM_COMP], locationType[NUM_LOC], 
       category[NUM_CAT], severity[NUM_SEV], RMN[NUM_RMN];

  Query()
  {
    memset(msgID, 0, NUM_MSGID);
    memset(component, 0, NUM_COMP);
    memset(locationType, 0, NUM_LOC);
    memset(category, 0, NUM_CAT);
    memset(severity, 0, NUM_SEV);
    memset(RMN, 0, NUM_RMN);
  }

  inline static bool checkTime(uint64_t t, uint64_t t0, uint64_t t1) {
    return (t >= t0 && t <= t1);
  }

  inline static bool check(uint16_t m, bool s[]) {
    return s[m];
  }

  void crossfilter(const std::vector<Event>& events, QueryResults& results) {
    std::vector<std::thread*> threads(nthreads-1);
    std::vector<QueryResults*> results1(nthreads-1);

    for (int i=0; i<nthreads-1; i++) {
      results1[i] = new QueryResults(*this);
      // threads[i] = std::thread(&Query::crossfilter_thread, this, nthreads, i+1, events, std::ref(results));
      threads[i] = new std::thread(&Query::crossfilter_thread, this, nthreads, i+1, events, std::ref(*results1[i]));
    }
    // crossfilter_thread(nthreads, 0, events, results);
    crossfilter_thread(nthreads, 0, events, results);
    
    for (int i=0; i<nthreads-1; i++) {
      threads[i]->join();
      delete threads[i];
      delete results1[i];
    }
  }

  inline void add1(uint32_t& a) {
#if 0
    __sync_fetch_and_add(&a, 1);
#else
    a ++;
#endif
  }

  void crossfilter_thread(int nthreads, int tid, const std::vector<Event>& events, QueryResults& results) {
    typedef std::chrono::high_resolution_clock clock;
    auto t0 = clock::now();
    set_affinity(tid);
    
    const int ndims = 7;
    bool b[ndims], c[ndims];
    int ntop = 0;

    for (size_t i=tid; i<events.size(); i+=nthreads) {
      const Event& e = events[i];
      crossfilter_kernel(e, b, c);
      if (c[0]) {
        uint32_t t = e.aggregateTime(T0, tg); // FIXME
        results.timeVolume[t] ++;
        if (subvolumes) {
          if (b[1]) add1(results.subTimeVolumes[0][t]);
          if (b[2]) add1(results.subTimeVolumes[1][t]);
          if (b[3]) add1(results.subTimeVolumes[2][t]);
          if (b[4]) add1(results.subTimeVolumes[3][t]);
          if (b[5]) add1(results.subTimeVolumes[4][t]);
        }
      }
      if (c[1]) add1(results.msgID[e.msgID]);
      if (c[2]) add1(results.component[e.component()]);
      if (c[3]) add1(results.locationType[e.locationType]);
      if (c[4]) add1(results.category[e.category()]);
      if (c[5]) add1(results.severity[e.severity()]);
      if (c[6]) add1(results.RMN[e.RMN]);

      if (b[0] && c[0] && ntop<top-1) { // all true
        results.topRecIDs.push_back(e.recID);
        ntop ++;
      }
    }
    
    auto t1 = clock::now();
    float elapsed = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count() / 1000.0; 
    // fprintf(stderr, "%f\n", elapsed); 
  }

  void crossfilter_kernel(const Event& e, bool b[], bool c[]) {
    const int ndims = 7; // FIXME
    // fprintf(stderr, "%llu, %llu, %llu, %llu\n", t0, t1, T0, T1);
    if (!checkTime(e.eventTime, T0, T1)) {
      for (int i=0; i<ndims; i++) {
        b[i] = false; 
        c[i] = false;
      }
      return;
    }

    b[0] = checkTime(e.eventTime, t0, t1);
    b[1] = check(e.msgID, msgID);
    b[2] = check(e.component(), component);
    b[3] = check(e.locationType, locationType);
    b[4] = check(e.category(), category);
    b[5] = check(e.severity(), severity);
    b[6] = check(e.RMN, RMN);

    for (int i=0; i<ndims; i++) {
      bool v = true;
      for (int j=0; j<ndims; j++) {
        if (i == j) continue;
        else if (!b[j]) {
          v = false;
          break;
        }
      }
      c[i] = v;
    }
  }
  
  void set_affinity(int processorID) {
    cpu_set_t cpu_set;
    CPU_ZERO(&cpu_set);
    CPU_SET(processorID, &cpu_set); // the 0th CPU is for comm
   
    pthread_t thread = pthread_self();
    // int rtn = pthread_setaffinity_np(thread, sizeof(cpu_set_t), &cpu_set);
    SET_AFFINITY(thread, sizeof(cpu_set_t), &cpu_set);
  }
};

QueryResults::QueryResults(const Query& q)
{
  memset(msgID, 0, NUM_MSGID*4);
  memset(component, 0, NUM_COMP*4);
  memset(locationType, 0, NUM_LOC*4);
  memset(category, 0, NUM_CAT*4);
  memset(severity, 0, NUM_SEV*4);
  memset(RMN, 0, NUM_RMN*4);

  slots = (q.T1 - q.T0) / q.tg;
  timeVolume = (uint32_t*)malloc(4*slots);
  memset(timeVolume, 0, 4*slots);

  for (int i=0; i<5; i++) {
    subTimeVolumes[i] = (uint32_t*)malloc(4*slots);
    memset(subTimeVolumes[i], 0, 4*slots);
  }

  topRecIDs.reserve(q.top);
}

QueryResults::~QueryResults()
{
  free(timeVolume);
  for (int i=0; i<5; i++)
    free(subTimeVolumes[i]);
}

}

#endif
