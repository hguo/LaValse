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

  // fprintf(stderr, "%llu, %llu, %llu, %llu\n", query.t0, query.t1, query.T0, query.T1);
  
  ras::QueryResults results(query);

  Local<Array> subvolumes = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "subvolumes"))); // TODO
  // for (uint32_t i=0; i<subvolumes.size(); i++)
  //   query.subvolumes

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
  if (locationType->Length() == 0) memset(query.locationType, 1, NUM_LOC);
  
  Local<Array> category = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "category")));
  for (uint32_t i=0; i<category->Length(); i++) 
    query.category[ category->Get(i)->Uint32Value() ] = true;
  if (category->Length() == 0) memset(query.category, 1, NUM_CAT);

  Local<Array> severity = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "severity")));
  for (uint32_t i=0; i<severity->Length(); i++) 
    query.severity[ severity->Get(i)->Uint32Value() ] = true;
  if (severity->Length() == 0) memset(query.severity, 1, NUM_SEV);
  
  Local<Array> RMN = Local<Array>::Cast(input->Get(String::NewFromUtf8(isolate, "RMN")));
  for (uint32_t i=0; i<RMN->Length(); i++) 
    query.RMN[ RMN->Get(i)->Uint32Value() ] = true;
  if (RMN->Length() == 0) memset(query.RMN, 1, NUM_RMN);


  typedef std::chrono::high_resolution_clock clock;
  auto t0 = clock::now();
  query.crossfilter(events, results);
  auto t1 = clock::now();
  float elapsed = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count() / 1000000.0; 
  
  Local<Object> jout = Object::New(isolate);

  jout->Set(String::NewFromUtf8(isolate, "queryTime"), Number::New(isolate, elapsed));

  Local<Object> jTimeVolume = Object::New(isolate);
  for (uint32_t i=0; i<results.slots; i++)
    jTimeVolume->Set(Number::New(isolate, i*query.tg + query.T0), Number::New(isolate, results.timeVolume[i]));
  jout->Set(String::NewFromUtf8(isolate, "timeVolume"), jTimeVolume);

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
  for (int i=0; i<NUM_LOC; i++) 
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
  
  Local<Object> jRMN = Object::New(isolate);
  for (int i=0; i<NUM_RMN; i++) 
    if (results.RMN[i] > 0)
      jRMN->Set(Number::New(isolate, i), Number::New(isolate, results.RMN[i]));
  jout->Set(String::NewFromUtf8(isolate, "RMN"), jRMN);

  args.GetReturnValue().Set(jout);
}

void Init(Local<Object> exports) {
  CatalogCube::Init(exports);
}

NODE_MODULE(catalogCube, Init);
