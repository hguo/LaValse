#include <cstdio>
#include "ras.h"

int main(int argc, char **argv) {
  ras::Event e; 
  
  FILE *fp = fopen("raslog", "a");

  while (scanf("%d %lld %lld %hhu %hhu %hhu %hhu %hhu %hhu",
        &e.recID, &e.msgID, &e.eventTime, 
        &e.locationType, &e.location[0], &e.location[1], &e.location[2], &e.location[3], &e.location[4]) == 9)
  {
    fwrite(&e, sizeof(ras::Event), 1, fp);
    // fprintf(stderr, "%d, %d, %d, %lld\n", e.category(), e.component(), e.severity(), e.eventTime);
  }
  fclose(fp);

  return 0;
}
