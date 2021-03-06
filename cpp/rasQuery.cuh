#ifndef _RASQUERY_H
#define _RASQUERY_H

#include "ras.h"
#include <cstdlib>
#include <cstring>

namespace ras {

struct Query;

enum {
  MAX_NUM_LOC = 127603, 
  MAX_EVENTS_PER_SLOT = 20
};

struct QueryResults {
  uint32_t nvolumes;
  uint32_t nslots; // time slots
  uint32_t nmatched = 0;
  uint32_t msgID[NUM_MSGID], component[NUM_COMP], locationType[NUM_LOCTYPE], 
           category[NUM_CAT], severity[NUM_SEV], controlAction[NUM_CTLACT];
  uint32_t *location, *locationRecID; 
  uint32_t *timeVolumes, *timeVolumesRecID;

  std::vector<uint32_t> topRecIDs;

  explicit QueryResults(const Query& q);
  ~QueryResults();
};

struct Query {
  uint64_t T0 = 1420070400000, T1 = 1451606400000; // time scope
  uint64_t t0 = 1420070400000, t1 = 1451606400000, tg = TIME_HOUR; // tg is time granularity
  uint8_t volumeBy = VAR_NONE;
  int LOD = 2;
  int top = 100; // return top n recIDs
  int nthreads = 1;

  bool msgID[NUM_MSGID], component[NUM_COMP], locationType[NUM_LOCTYPE],
       category[NUM_CAT], severity[NUM_SEV], location[MAX_NUM_LOC];
  uint16_t controlActions; // bits

  Query()
  {
  }

  inline static bool checkTime(uint64_t t, uint64_t t0, uint64_t t1) {
    return (t >= t0 && t < t1);
  }
  
  inline static bool checkBits(uint16_t b0, uint16_t b1) {return b0 & b1;}
  inline static bool check(uint32_t m, bool s[]) {return s[m];}

  inline uint32_t add1(uint32_t& a) {
    __sync_fetch_and_add(&a, 1);
    return ++ a;
  }
  
  inline void add1(uint32_t& a, uint32_t slot, uint32_t* recIDs, uint32_t recID) {
    if (a<MAX_EVENTS_PER_SLOT)
      recIDs[slot*MAX_EVENTS_PER_SLOT + a] = recID;
    add1(a);
  }

  inline void add1(uint32_t* timeVolumes, int nslots, int index, int t) {
    add1(timeVolumes[nslots*index+t]);
  }
  
  inline void add1(uint32_t* timeVolumes, uint32_t* timeVolumesRecID, int nslots, int index, int t, int recID) {
    uint32_t &i = timeVolumes[nslots*index+t];
    if (i<MAX_EVENTS_PER_SLOT) timeVolumesRecID[(nslots*index+t)*MAX_EVENTS_PER_SLOT + i] = recID;
    add1(i);
  }

  void crossfilter_thread(int nthreads, int tid, const std::vector<Event>& events, QueryResults& results) {
    // typedef std::chrono::high_resolution_clock clock;
    // auto t0 = clock::now();
    // set_affinity(tid);
    
    const int ndims = 8;
    const int nslots = results.nslots;
    bool b[ndims], c[ndims];
    int ntop = 0;

    for (size_t i=tid; i<events.size(); i+=nthreads) {
      const Event& e = events[i];
      crossfilter_kernel(e, b, c);
      if (c[0]) {
        uint32_t t = e.aggregateTime(T0, tg); 
        switch (volumeBy) {
#if 0
        case VAR_NONE: add1(results.timeVolumes[t]); break;
        case VAR_MSGID: add1(results.timeVolumes, nslots, e.msgID, t); break;
        case VAR_COMP: add1(results.timeVolumes, nslots, e.component(), t); break;
        case VAR_LOC: add1(results.timeVolumes, nslots, e.locationType, t); break;
        case VAR_CAT: add1(results.timeVolumes, nslots, e.category(), t); break;
        case VAR_SEV: add1(results.timeVolumes, nslots, e.severity(), t); break;
#else
        case VAR_NONE: add1(results.timeVolumes[t], t, results.timeVolumesRecID, e.recID); break;
        case VAR_MSGID: add1(results.timeVolumes, results.timeVolumesRecID, nslots, e.msgID, t, e.recID); break;
        case VAR_COMP: add1(results.timeVolumes, results.timeVolumesRecID, nslots, e.component(), t, e.recID); break;
        case VAR_LOC: add1(results.timeVolumes, results.timeVolumesRecID, nslots, e.locationType, t, e.recID); break;
        case VAR_CAT: add1(results.timeVolumes, results.timeVolumesRecID, nslots, e.category(), t, e.recID); break;
        case VAR_SEV: add1(results.timeVolumes, results.timeVolumesRecID, nslots, e.severity(), t, e.recID); break;
#endif
        default: break;
        }
      }
      if (c[1]) add1(results.msgID[e.msgID]);
      if (c[2]) add1(results.component[e.component()]);
      if (c[3]) add1(results.locationType[e.locationType]);
      if (c[4]) add1(results.category[e.category()]);
      if (c[5]) add1(results.severity[e.severity()]);
      if (c[6]) add1(results.location[e.location[LOD]]);
      if (c[7]) {
        uint16_t a = e.controlActions();
        if (a & 32768) add1(results.controlAction[9]); // no control actions
        else {
          if (a & 1) add1(results.controlAction[0]);
          if (a & 2) add1(results.controlAction[1]);
          if (a & 4) add1(results.controlAction[2]);
          if (a & 8) add1(results.controlAction[3]);
          if (a & 16) add1(results.controlAction[4]);
          if (a & 32) add1(results.controlAction[5]);
          if (a & 64) add1(results.controlAction[6]);
          if (a & 128) add1(results.controlAction[7]);
          if (a & 256) add1(results.controlAction[8]);
        }
      }

      if (b[0] && c[0]) { // all true
        results.nmatched ++; 
        if (ntop<top) {
          results.topRecIDs.push_back(e.recID);
          ntop ++;
        }
      }
    }
    
    // auto t1 = clock::now();
    // float elapsed = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count() / 1000.0; 
    // fprintf(stderr, "%f\n", elapsed); 
  }

  void crossfilter_kernel(const Event& e, bool b[], bool c[]) {
    const int ndims = 8; // FIXME
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
    b[6] = check(e.location[LOD], location);
    b[7] = checkBits(e.controlActions(), controlActions);

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
  nslots = (q.T1 - q.T0) / q.tg;
  nvolumes = ras::nvolumes[q.volumeBy];
  
  timeVolumes = (uint32_t*)malloc(nslots*nvolumes*4);
  timeVolumesRecID = (uint32_t*)malloc(nslots*nvolumes*MAX_EVENTS_PER_SLOT*4);
  memset(timeVolumes, 0, nslots*nvolumes*4);
  // memset(timeVolumesRecID, 0, nslots*nvolumes*MAX_EVENTS_PER_SLOT*4);
  
  location = (uint32_t*)malloc(nlocations[q.LOD]*4);
  locationRecID = (uint32_t*)malloc(nlocations[q.LOD]*MAX_EVENTS_PER_SLOT*4);
  memset(location, 0, nlocations[q.LOD]*4);

  memset(msgID, 0, NUM_MSGID*4);
  memset(component, 0, NUM_COMP*4);
  memset(locationType, 0, NUM_LOCTYPE*4);
  memset(category, 0, NUM_CAT*4);
  memset(severity, 0, NUM_SEV*4);
  memset(controlAction, 0, NUM_CTLACT*4);
  
  topRecIDs.reserve(q.top);
}

QueryResults::~QueryResults()
{
  free(timeVolumes);
  free(timeVolumesRecID);
  free(location);
  free(locationRecID);
}

}

#endif
