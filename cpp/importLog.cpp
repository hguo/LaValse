#include <cstdio>
#include "ras.h"

int main(int argc, char **argv) {
  ras::Event e; 
  
  FILE *fp = fopen("raslog", "a");

  int count = 0;
  while (scanf("%d %hu %lld %u %hhu %hu %hhu %hhu %hhu %u %u %u %u %u",
        &e.recID, &e.msgID, &e.eventTime, &e.cobaltJobID, &e.maintenance, &e.user, &e.proj,
        &e.midplane, &e.locationType, 
        &e.location[0], &e.location[1], &e.location[2], &e.location[3], &e.location[4]) == 14)
  {
    // fprintf(stderr, "%d, %hu, %lld, %hhu, %hu\n", 
    //     e.recID, e.msgID, e.eventTime, e.locationType, e.RMN);
    fwrite(&e, sizeof(ras::Event), 1, fp);
    count ++;
  }
  fclose(fp);

  fprintf(stderr, "imported %d logs\n", count);

  return 0;
}
