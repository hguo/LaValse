#include "rasQuery.cuh"

using namespace ras;

static Event* d_events;

__device__
bool checkTime(uint64_t t, uint64_t t0, uint64_t t1) {
  return (t >= t0 && t < t1);
}

__device__
bool checkBits(uint16_t b0, uint16_t b1) {return b0 & b1;}

__device__
bool check(uint32_t m, const bool s[]) {return s[m];}

__device__
void crossfilter_kernel(const Event& e, const Query& q, bool b[], bool c[])
{
  const int ndims = 8; // FIXME
  if (!checkTime(e.eventTime, q.T0, q.T1)) {
    for (int i=0; i<ndims; i++) {
      b[i] = false; 
      c[i] = false;
    }
    return;
  }

  b[0] = checkTime(e.eventTime, q.t0, q.t1);
  b[1] = check(e.msgID, q.msgID);
  b[2] = check(e.component(), q.component);
  b[3] = check(e.locationType, q.locationType);
  b[4] = check(e.category(), q.category);
  b[5] = check(e.severity(), q.severity);
  b[6] = check(e.location[q.LOD], q.location);
  b[7] = checkBits(e.controlActions(), q.controlActions);

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

void uploadEvents(const std::vector<Event>& events) {
  cudaMalloc((void**)&d_events, sizeof(Event)*events.size());
  cudaMemcpy(d_events, events.data(), sizeof(Event)*events.size(), cudaMemcpyHostToDevice);
}
