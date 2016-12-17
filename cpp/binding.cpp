#include <cstdio>
#include <cstdlib>
#include <string>
#include <chrono>
#include "binding.h"
#include "ras.h"
#include "rasQuery.h"

Persistent<Function> CatalogCube::constructor;

void CatalogCube::LoadEvents(const std::string& filename)
{
  FILE *fp = fopen(filename.c_str(), "rb");
  fseek(fp, 0L, SEEK_END);
  size_t sz = ftell(fp);
  fseek(fp, 0L, SEEK_SET);
  
  const int n = sz / sizeof(ras::Event);
  events.resize(n);
  
  fread((void*)events.data(), sizeof(ras::Event), n, fp);
  fclose(fp);
}

void CatalogCube::Init(Local<Object> exports) {
  Isolate *isolate = exports->GetIsolate();
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "catalogCube"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  NODE_SET_PROTOTYPE_METHOD(tpl, "query", Query);
  NODE_SET_PROTOTYPE_METHOD(tpl, "loadRASLog", LoadRASLog);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "catalogCube"), 
      tpl->GetFunction());
}

void CatalogCube::New(const FunctionCallbackInfo<Value>& args) {
  Isolate *isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    CatalogCube *obj = new CatalogCube;
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    const int argc = 1;
    Local<Value> argv[argc] = {args[0]}; 
    Local<Context> context = isolate->GetCurrentContext();
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> result = 
      cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(result);
  }
}

void CatalogCube::LoadRASLog(const FunctionCallbackInfo<Value>& args) {
  Isolate *isolate = args.GetIsolate();
  CatalogCube* obj = ObjectWrap::Unwrap<CatalogCube>(args.Holder());
  
  if (args.Length() < 1) {
    isolate->ThrowException(Exception::TypeError(
          String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  if (!args[0]->IsString()) {
    isolate->ThrowException(Exception::TypeError(
          String::NewFromUtf8(isolate, "Wrong arguments")));
    return;
  }

  String::Utf8Value filename1(args[0]->ToString());
  std::string filename(*filename1);
  obj->LoadEvents(filename);
}

void CatalogCube::Query(const FunctionCallbackInfo<Value>& args) {
  using namespace ras;

  Isolate *isolate = args.GetIsolate();
  CatalogCube* obj = ObjectWrap::Unwrap<CatalogCube>(args.Holder());
 
  const std::vector<ras::Event>& events = obj->events;
  if (args.Length() < 1) {
    isolate->ThrowException(Exception::TypeError(
          String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  if (!args[0]->IsObject()) {
    isolate->ThrowException(Exception::TypeError(
          String::NewFromUtf8(isolate, "Wrong arguments")));
    return;
  }

  Local<Object> input = args[0]->ToObject();

  ras::Query query;

  query.nthreads = input->Get(String::NewFromUtf8(isolate, "nthreads"))->IntegerValue();
  if (query.nthreads == 0) query.nthreads = 1;

  query.top = input->Get(String::NewFromUtf8(isolate, "top"))->IntegerValue();
  if (query.top == 0) query.top = 10;
 
  query.LOD = input->Get(String::NewFromUtf8(isolate, "LOD"))->IntegerValue();
  if (query.LOD == 0) query.LOD = 2;

  query.tg = input->Get(String::NewFromUtf8(isolate, "tg"))->IntegerValue();
  if (query.tg == 0) query.tg = ras::TIME_DAY;

  query.T0 = input->Get(String::NewFromUtf8(isolate, "T0"))->IntegerValue();
  if (query.T0 == 0) query.T0 = 1420070400000;
  query.T1 = input->Get(String::NewFromUtf8(isolate, "T1"))->IntegerValue();
  if (query.T1 == 0) query.T1 = 1451606400000;
  
  query.t0 = input->Get(String::NewFromUtf8(isolate, "t0"))->IntegerValue();
  if (query.t0 == 0) query.t0 = 1420070400000;
  query.t1 = input->Get(String::NewFromUtf8(isolate, "t1"))->IntegerValue();
  if (query.t1 == 0) query.t1 = 1451606400000;

  query.volumeBy = input->Get(String::NewFromUtf8(isolate, "volumeBy"))->IntegerValue();

  // fprintf(stderr, "%llu, %llu, %llu, %llu\n", query.t0, query.t1, query.T0, query.T1);
  
  ras::QueryResults results(query);

  Local<Array> msgID = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "msgID")));
  for (uint32_t i=0; i<msgID->Length(); i++) 
    query.msgID[ msgID->Get(i)->IntegerValue() ] = true;
  if (msgID->Length() == 0) memset(query.msgID, 1, NUM_MSGID);

  Local<Array> component = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "component")));
  for (uint32_t i=0; i<component->Length(); i++) 
    query.component[ component->Get(i)->Uint32Value() ] = true;
  if (component->Length() == 0) memset(query.component, 1, NUM_COMP);
  
  Local<Array> locationType = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "locationType")));
  for (uint32_t i=0; i<locationType->Length(); i++) 
    query.locationType[ locationType->Get(i)->Uint32Value() ] = true;
  if (locationType->Length() == 0) memset(query.locationType, 1, NUM_LOCTYPE);
  
  Local<Array> category = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "category")));
  for (uint32_t i=0; i<category->Length(); i++) 
    query.category[ category->Get(i)->Uint32Value() ] = true;
  if (category->Length() == 0) memset(query.category, 1, NUM_CAT);

  Local<Array> severity = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "severity")));
  for (uint32_t i=0; i<severity->Length(); i++) 
    query.severity[ severity->Get(i)->Uint32Value() ] = true;
  if (severity->Length() == 0) memset(query.severity, 1, NUM_SEV);
  
  Local<Array> location = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "location")));
  for (uint32_t i=0; i<location->Length(); i++) 
    query.location[ location->Get(i)->Uint32Value() ] = true;
  if (location->Length() == 0) memset(query.location, 1, nlocations[query.LOD]);


  typedef std::chrono::high_resolution_clock clock;
  auto t0 = clock::now();
  query.crossfilter(events, results);
  auto t1 = clock::now();
  float elapsed = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count() / 1000000.0; 
  
  Local<Object> jout = Object::New(isolate);

  jout->Set(String::NewFromUtf8(isolate, "queryTime"), Number::New(isolate, elapsed));

  Local<Array> jTimeVolumes = Array::New(isolate);
  for (uint32_t i=0; i<results.nvolumes; i++) {
    Local<Array> jTimeVolume = Array::New(isolate);
    for (uint32_t j=0; j<results.nslots; j++) 
      jTimeVolume->Set(Number::New(isolate, j), Number::New(isolate, results.timeVolumes[i*results.nslots + j]));
    jTimeVolumes->Set(Number::New(isolate, i), jTimeVolume);
  }
  jout->Set(String::NewFromUtf8(isolate, "timeVolumes"), jTimeVolumes); // TODO

#if 0 // old code
  Local<Object> jTimeVolume = Object::New(isolate);
  for (uint32_t i=0; i<results.nslots; i++)
    jTimeVolume->Set(Number::New(isolate, i*query.tg + query.T0), Number::New(isolate, results.timeVolumes[i]));
  jout->Set(String::NewFromUtf8(isolate, "timeVolume"), jTimeVolume); // TODO
#endif

  Local<Object> jMsgID = Object::New(isolate);
  for (int i=0; i<NUM_MSGID; i++)
    if (results.msgID[i] > 0)
      jMsgID->Set(Number::New(isolate, i), Number::New(isolate, results.msgID[i]));
  jout->Set(String::NewFromUtf8(isolate, "msgID"), jMsgID);

  Local<Object> jComponent = Object::New(isolate);
  for (int i=0; i<NUM_COMP; i++) 
    if (results.component[i] > 0)
      jComponent->Set(Number::New(isolate, i), Number::New(isolate, results.component[i]));
  jout->Set(String::NewFromUtf8(isolate, "component"), jComponent);
  
  Local<Object> jLocationType = Object::New(isolate);
  for (int i=0; i<NUM_LOCTYPE; i++) 
    if (results.locationType[i] > 0)
      jLocationType->Set(Number::New(isolate, i), Number::New(isolate, results.locationType[i]));
  jout->Set(String::NewFromUtf8(isolate, "locationType"), jLocationType);
  
  Local<Object> jCategory = Object::New(isolate);
  for (int i=0; i<NUM_CAT; i++) 
    if (results.category[i] > 0)
      jCategory->Set(Number::New(isolate, i), Number::New(isolate, results.category[i]));
  jout->Set(String::NewFromUtf8(isolate, "category"), jCategory);
  
  Local<Object> jSeverity = Object::New(isolate);
  for (int i=0; i<NUM_SEV; i++) 
    if (results.severity[i] > 0)
      jSeverity->Set(Number::New(isolate, i), Number::New(isolate, results.severity[i]));
  jout->Set(String::NewFromUtf8(isolate, "severity"), jSeverity);
  
  Local<Object> jLocation = Object::New(isolate);
  for (size_t i=0; i<nlocations[query.LOD]; i++) 
    if (results.location[i] > 0)
      jLocation->Set(Number::New(isolate, i), Number::New(isolate, results.location[i]));
  jout->Set(String::NewFromUtf8(isolate, "location"), jLocation);

  Local<Array> jTop = Array::New(isolate); 
  for (size_t i=0; i<results.topRecIDs.size(); i++) 
    jTop->Set(Number::New(isolate, i), Number::New(isolate, results.topRecIDs[i]));
  jout->Set(String::NewFromUtf8(isolate, "top"), jTop);

  args.GetReturnValue().Set(jout);
}

void Init(Local<Object> exports) {
  CatalogCube::Init(exports);
}

NODE_MODULE(catalogCube, Init);
