#ifndef _RASQUERY_H
#define _RASQUERY_H

#include "ras.h"
#include <cstdlib>
#include <thread>

namespace ras {

struct Query;

struct QueryResults {
  uint32_t *timeVolume, *subTimeVolumes[5];
  uint32_t msgID[NUM_MSGID], component[NUM_COMP], locationType[NUM_LOC], category[NUM_CAT], severity[NUM_SEV];
  uint32_t slots;

  explicit QueryResults(const Query& q);
  ~QueryResults();
};

struct Query {
  uint64_t T0 = 1420070400000, T1 = 1451606400000; // time scope
  uint64_t t0 = 0, t1 = 0, tg = TIME_HOUR; // tg is time granularity
  uint16_t subvolume = 0;
  int nthreads = 1;

  bool msgID[NUM_MSGID], component[NUM_COMP], locationType[NUM_LOC], category[NUM_CAT], severity[NUM_SEV];

  Query()
  {
    memset(msgID, 0, NUM_MSGID);
    memset(component, 0, NUM_COMP);
    memset(locationType, 0, NUM_LOC);
    memset(category, 0, NUM_CAT);
    memset(severity, 0, NUM_SEV);
  }

  static bool checkTime(uint64_t t, uint64_t t0, uint64_t t1) {
    if (t1 == 0) return true;
    return (t >= t0 && t <= t1);
  }

  static bool check(uint16_t m, bool s[]) {
    return s[m];
  }

  void crossfilter(const std::vector<Event>& events, QueryResults& results) {
    std::vector<std::thread> threads(nthreads-1);

    for (int i=0; i<nthreads-1; i++) 
      threads[i] = std::thread(&Query::crossfilter_thread, this, nthreads, i+1, events, std::ref(results));
    crossfilter_thread(nthreads, 0, events, results);

    for (int i=0; i<nthreads-1; i++)
      threads[i].join();
  }

  void add1(uint32_t& a) {
#if 0
    __sync_fetch_and_add(&a, 1);
#else
    a ++;
#endif
  }

  void crossfilter_thread(int nthreads, int tid, const std::vector<Event>& events, QueryResults& results) {
    const int ndims = 6;
    bool b[ndims], c[ndims];

    for (size_t i=tid; i<events.size(); i+=nthreads) {
      const Event& e = events[i];
      crossfilter_kernel(e, b, c);
      if (c[0]) {
        uint32_t t = e.aggregateTime(T0, tg); // FIXME
        results.timeVolume[t] ++;
        if (subvolume) {
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
    }
  }

  void crossfilter_kernel(const Event& e, bool b[], bool c[]) {
    const int ndims = 6; // FIXME
    b[0] = checkTime(e.eventTime, t0, t1);
    b[1] = check(e.msgID, msgID);
    b[2] = check(e.component(), component);
    b[3] = check(e.locationType, locationType);
    b[4] = check(e.category(), category);
    b[5] = check(e.severity(), severity);

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
};

QueryResults::QueryResults(const Query& q)
{
  memset(msgID, 0, NUM_MSGID*4);
  memset(component, 0, NUM_COMP*4);
  memset(locationType, 0, NUM_LOC*4);
  memset(category, 0, NUM_CAT*4);
  memset(severity, 0, NUM_SEV*4);

  slots = (q.T1 - q.T0) / q.tg;
  timeVolume = (uint32_t*)malloc(4*slots);
  memset(timeVolume, 0, 4*slots);

  for (int i=0; i<5; i++) {
    subTimeVolumes[i] = (uint32_t*)malloc(4*slots);
    memset(subTimeVolumes[i], 0, 4*slots);
  }
}

QueryResults::~QueryResults()
{
  free(timeVolume);
  for (int i=0; i<5; i++)
    free(subTimeVolumes[i]);
}

}

#endif
