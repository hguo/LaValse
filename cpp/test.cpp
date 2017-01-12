#include "rasQuery.h"
#include <vector>
#include <chrono>

int main(int argc, char **argv) {
  FILE *fp = fopen("raslog", "rb");
  fseek(fp, 0L, SEEK_END);
  size_t sz = ftell(fp);
  fseek(fp, 0L, SEEK_SET);
  
  const int n = sz / sizeof(ras::Event) - 1;
  // const int n = 10000000;
  std::vector<ras::Event> events(n);
  
  fread((void*)events.data(), sizeof(ras::Event), n, fp);
  fclose(fp);

  ras::Query query;
  ras::QueryResults results(query);

  query.tg = ras::TIME_DAY;
  // query.t0 = 1436184000000;
  // query.t1 = 1436936400000;
  query.nthreads = 1;
  query.LOD = 2;
  memset(query.msgID, 1, ras::NUM_MSGID);
  memset(query.component, 1, ras::NUM_COMP);
  memset(query.locationType, 1, ras::NUM_LOCTYPE);
  memset(query.category, 1, ras::NUM_CAT);
  memset(query.severity, 1, ras::NUM_SEV);
  // memset(query.location, 1, ras::MAX_NUM_LOC);
  memset(query.location, 0, ras::MAX_NUM_LOC);
  query.location[1] = 1;
  query.controlActions = 0x0002;
  // query.category[ras::CAT_BQC] = true;
  // query.severity[ras::SEV_FATAL] = true;
  // query.severity[ras::SEV_WARN] = true;

  typedef std::chrono::high_resolution_clock clock;
  auto t0 = clock::now();
  query.crossfilter(events, results);
  auto t1 = clock::now();
  float elapsed = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count() / 1000.0; 

#if 0
  fprintf(stderr, "eventTime (hour)\n");
  for (const auto &kv : results.timeVolume) 
    fprintf(stderr, " - %llu: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "msgIDs\n");
  for (const auto &kv : results.msgID) 
    fprintf(stderr, " - %hu: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "components\n");
  for (const auto &kv : results.component) 
    fprintf(stderr, " - %d: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "locationTypes\n");
  for (const auto &kv : results.locationType) 
    fprintf(stderr, " - %d: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "severities\n");
  for (const auto &kv : results.severity) 
    fprintf(stderr, " - %d: %d\n", kv.first, kv.second);
#endif
  
  fprintf(stderr, "N=%d, TIME=%f ms\n", n, elapsed);
}
