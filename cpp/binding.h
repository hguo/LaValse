#include <node.h>
#include <node_object_wrap.h>
#include "ras.h"

using namespace v8;

class CatalogCube : public node::ObjectWrap {
public:
  static void Init(Local<Object> exports);

private:
  explicit CatalogCube() {};
  ~CatalogCube() {};

  static void New(const FunctionCallbackInfo<Value>& args);
  static void LoadRASLog(const FunctionCallbackInfo<Value>& args);
  static void Query(const FunctionCallbackInfo<Value>& args);

  static Persistent<Function> constructor;

private:
  void LoadEvents(const std::string& filename);
  
  std::vector<ras::Event> events;
};
