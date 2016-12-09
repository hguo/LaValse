{
  "targets": [
    {
      "target_name": "catalogCube", 
      "sources": [ "binding.cpp" ],
      "include_dirs": [],
      "libraries": [
        "-Wl,-rpath,<!(pwd)/build/Release"
      ],
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS" : [ "-std=c++11", "-stdlib=libc++" ], 
        "OTHER_LDFLAGS": [ "-stdlib=libc++" ],
        "MACOSX_DEPLOYMENT_TARGET": "10.7",
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
      }, 
    }
  ]
}
