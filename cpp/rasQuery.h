#ifndef _RASQUERY_H
#define _RASQUERY_H

#include "ras.h"

namespace ras {

struct QueryResults {
  std::map<uint64_t, uint32_t> timeVolume;
  std::map<uint64_t, uint32_t> msgIDs;
  std::map<uint8_t, uint32_t> components;
  std::map<uint8_t, uint32_t> locationTypes;
  std::map<uint8_t, uint32_t> categories;
  std::map<uint8_t, uint32_t> severities;
};

struct Query {
  uint64_t t0 = 0, t1 = 0, tg = TIME_HOUR; // tg is time granularity
  std::set<uint64_t> msgIDs; 
  std::set<uint8_t> components;
  std::set<uint8_t> locationTypes;
  std::set<uint8_t> categories;
  std::set<uint8_t> severities;

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

    for (int i=0; i<events.size(); i++) {
      const Event& e = events[i];
      crossfilter(e, b, c);
      if (c[0]) results.timeVolume[e.aggregateTime(tg)] ++;
      if (c[1]) results.msgIDs[e.msgID] ++;
      if (c[2]) results.components[e.component()] ++;
      if (c[3]) results.locationTypes[e.locationType] ++;
      if (c[4]) results.categories[e.category()] ++;
      if (c[5]) results.severities[e.severity()] ++;
    }
  }

  void crossfilter(const Event& e, bool b[], bool c[]) {
    const int ndims = 6; // FIXME
    b[0] = checkTime(e.eventTime, t0, t1);
    b[1] = check(e.msgID, msgIDs);
    b[2] = check(e.component(), components);
    b[3] = check(e.locationType, locationTypes);
    b[4] = check(e.category(), categories);
    b[5] = check(e.severity(), severities);

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
