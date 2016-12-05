#include <cstdio>
#include "ras.h"

int main(int argc, char **argv) {
  ras::Event e; 
  
  FILE *fp = fopen("raslog", "a");

  while (scanf("%d %lld %lld", &e.recID, &e.msgID, &e.eventTime) == 3) {
    fwrite(&e, sizeof(ras::Event), 1, fp);
    // fprintf(stderr, "%d, %d, %d, %lld\n", e.category(), e.component(), e.severity(), e.eventTime);
  }
  fclose(fp);

  return 0;
}
