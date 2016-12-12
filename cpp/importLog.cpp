#include <cstdio>
#include "ras.h"

int main(int argc, char **argv) {
  ras::Event e; 
  
  FILE *fp = fopen("raslog", "a");

  while (scanf("%d %hu %lld %hhu %hu", 
        &e.recID, &e.msgID, &e.eventTime, &e.locationType, &e.RMN) == 5)
  {
    // fprintf(stderr, "%d, %hu, %lld, %hhu, %hu\n", 
    //     e.recID, e.msgID, e.eventTime, e.locationType, e.RMN);
    fwrite(&e, sizeof(ras::Event), 1, fp);
  }
  fclose(fp);

  return 0;
}
