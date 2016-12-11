#ifndef _RASQUERY_H
#define _RASQUERY_H

#include "ras.h"

namespace ras {

struct QueryResults {
  std::map<uint64_t, uint32_t> timeVolume;

  std::map<uint16_t, std::map<uint64_t, uint32_t> > timeVolumeByMsgID;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeByComponent;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeByLocationType;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeByCategory;
  std::map<uint8_t, std::map<uint64_t, uint32_t> > timeVolumeBySeverity;

  std::map<uint16_t, uint32_t> msgID;
  std::map<uint8_t, uint32_t> component;
  std::map<uint8_t, uint32_t> locationType;
  std::map<uint8_t, uint32_t> category;
  std::map<uint8_t, uint32_t> severity;
};

struct Query {
  uint64_t t0 = 0, t1 = 0, tg = TIME_HOUR; // tg is time granularity
  uint16_t subvolume = 0;

  std::set<uint16_t> msgID; 
  std::set<uint8_t> component;
  std::set<uint8_t> locationType;
  std::set<uint8_t> category;
  std::set<uint8_t> severity;

  static bool checkTime(uint64_t t, uint64_t t0, uint64_t t1) {
    if (t1 == 0) return true;
    return (t >= t0 && t <= t1);
  }

  template <typename T>
  bool check(const T& m, const std::set<T>& s) {
    if (s.empty()) return true;
    else return s.find(m) != s.end();
  }

  void crossfilter(const std::vector<Event>& events, QueryResults& results) {
    const int ndims = 6;
    bool b[ndims], c[ndims];

    for (size_t i=0; i<events.size(); i++) {
      const Event& e = events[i];
      crossfilter(e, b, c);
      if (c[0]) {
        uint64_t t = e.aggregateTime(tg);
        results.timeVolume[t] ++;
        if (subvolume & VAR_MSGID && b[1]) results.timeVolumeByMsgID[e.msgID][t] ++;
        if (subvolume & VAR_COMPONENT && b[2]) results.timeVolumeByComponent[e.component()][t] ++;
        if (subvolume & VAR_LOCATIONTYPE && b[3]) results.timeVolumeByLocationType[e.locationType][t] ++;
        if (subvolume & VAR_CATEGORY && b[4]) results.timeVolumeByCategory[e.category()][t] ++;
        if (subvolume & VAR_SEVERITY && b[5]) results.timeVolumeBySeverity[e.severity()][t] ++;
      }
      if (c[1]) results.msgID[e.msgID] ++;
      if (c[2]) results.component[e.component()] ++;
      if (c[3]) results.locationType[e.locationType] ++;
      if (c[4]) results.category[e.category()] ++;
      if (c[5]) results.severity[e.severity()] ++;
    }
  }

  void complete(QueryResults& r) {
    for (uint8_t i=0; i<NUM_CAT; i++) 
      r.category[i]; 
    for (uint8_t i=0; i<NUM_COMP; i++) 
      r.component[i]; 
    for (uint8_t i=0; i<NUM_LOC; i++) 
      r.locationType[i];
    for (uint8_t i=0; i<NUM_SEV; i++) 
      r.severity[i]; 
  }

  void crossfilter(const Event& e, bool b[], bool c[]) {
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

}

#endif
