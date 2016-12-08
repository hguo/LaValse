#include "rasQuery.h"
#include <vector>

int main(int argc, char **argv) {
  FILE *fp = fopen("raslog", "rb");
  fseek(fp, 0L, SEEK_END);
  size_t sz = ftell(fp);
  fseek(fp, 0L, SEEK_SET);
  
  // const int n = sz / sizeof(ras::Event);
  const int n = 10000000;
  std::vector<ras::Event> events(n);
  
  fread((void*)events.data(), sizeof(ras::Event), n, fp);
  fclose(fp);

  ras::Query query;
  ras::QueryResults results;

  query.tg = ras::TIME_DAY;
  query.t0 = 1436184000000;
  query.t1 = 1436936400000;
  query.categories.insert(ras::CAT_BQC);
  query.severities.insert(ras::SEV_FATAL);
  query.severities.insert(ras::SEV_WARN);

  clock_t t0 = clock();
  query.crossfilter(events, results);
  clock_t t1 = clock();

  fprintf(stderr, "eventTime (hour)\n");
  for (const auto &kv : results.timeVolume) 
    fprintf(stderr, " - %llu: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "msgIDs\n");
  for (const auto &kv : results.msgIDs) 
    fprintf(stderr, " - %llu: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "components\n");
  for (const auto &kv : results.components) 
    fprintf(stderr, " - %d: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "locationTypes\n");
  for (const auto &kv : results.locationTypes) 
    fprintf(stderr, " - %d: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "severities\n");
  for (const auto &kv : results.severities) 
    fprintf(stderr, " - %d: %d\n", kv.first, kv.second);
  
  fprintf(stderr, "N=%d, TIME=%f\n", n, (float)(t1-t0)/CLOCKS_PER_SEC);
}
