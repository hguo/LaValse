#ifndef _RASQUERY_H
#define _RASQUERY_H

#include "ras.h"
#include <cstdlib>
#include <thread>

namespace ras {

struct Query;

struct QueryResults {
#if 0
  std::map<uint16_t, std::map<uint64_t, uint32_t> > timeVolumeByMsgID;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeByComponent;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeByLocationType;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeByCategory;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeBySeverity;
#endif
  // std::vector<uint32_t> timeVolume;
  uint32_t *timeVolume;
  uint32_t msgID[NUM_MSGID], component[NUM_COMP], locationType[NUM_LOC], category[NUM_CAT], severity[NUM_SEV];
  uint32_t slots;

  explicit QueryResults(const Query& q);
  ~QueryResults();
};

struct Query {
  uint64_t T0 = 1420070400000, T1 = 1451606400000; // time scope
  uint64_t t0 = 0, t1 = 0, tg = TIME_HOUR; // tg is time granularity
  uint16_t subvolume = 0;

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
    // const int nthreads = std::thread::hardware_concurrency();
    const int nthreads = 1; 
    std::vector<std::thread> threads(nthreads-1);

    for (int i=0; i<nthreads-1; i++) 
      threads[i] = std::thread(&Query::crossfilter_thread, this, nthreads, i+1, events, std::ref(results));
    crossfilter_thread(nthreads, 0, events, results);

    for (int i=0; i<nthreads-1; i++)
      threads[i].join();
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
#if 0
        if (subvolume & VAR_MSGID && b[1]) results.timeVolumeByMsgID[e.msgID][t] ++;
        if (subvolume & VAR_COMPONENT && b[2]) results.timeVolumeByComponent[e.component()][t] ++;
        if (subvolume & VAR_LOCATIONTYPE && b[3]) results.timeVolumeByLocationType[e.locationType][t] ++;
        if (subvolume & VAR_CATEGORY && b[4]) results.timeVolumeByCategory[e.category()][t] ++;
        if (subvolume & VAR_SEVERITY && b[5]) results.timeVolumeBySeverity[e.severity()][t] ++;
#endif
      }
      if (c[1]) __sync_fetch_and_add(&results.msgID[e.msgID], 1);
      if (c[2]) __sync_fetch_and_add(&results.component[e.component()], 1);
      if (c[3]) __sync_fetch_and_add(&results.locationType[e.locationType], 1);
      if (c[4]) __sync_fetch_and_add(&results.category[e.category()], 1);
      if (c[5]) __sync_fetch_and_add(&results.severity[e.severity()], 1);
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
}

QueryResults::~QueryResults()
{
  free(timeVolume);
}

}

#endif
