#include "rasQuery.h"
#include <vector>
#include <chrono>

int main(int argc, char **argv) {
  FILE *fp = fopen("raslog", "rb");
  fseek(fp, 0L, SEEK_END);
  size_t sz = ftell(fp);
  fseek(fp, 0L, SEEK_SET);
  
  // const int n = sz / sizeof(ras::Event) - 1;
  const int n = 10000000;
  std::vector<ras::Event> events(n);
  
  fread((void*)events.data(), sizeof(ras::Event), n, fp);
  fclose(fp);

  ras::Query query;
  ras::QueryResults results;

  query.tg = ras::TIME_DAY;
#if 0
  query.t0 = 1436184000000;
  query.t1 = 1436936400000;
  query.category.insert(ras::CAT_BQC);
  query.severity.insert(ras::SEV_FATAL);
  query.severity.insert(ras::SEV_WARN);
#endif

  typedef std::chrono::high_resolution_clock clock;
  auto t0 = clock::now();
  query.crossfilter(events, results);
  auto t1 = clock::now();
  float elapsed = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count() / 1000.0; 

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
  
  fprintf(stderr, "N=%d, TIME=%f ms\n", n, elapsed);
}
