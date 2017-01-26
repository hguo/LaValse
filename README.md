# Visual Analysis Tool for Fault Characterization of Supercomputers

This tool is designed to visualize and analyze large-scale heterogeneous logs on supercomputers, in order to characterize faults.  Currently, the tool provides a user interface to explore logs on Mira.  Three types are involved, including

- RAS (Reliability, Availability, Serviceability) logs
- Cobalt and backend job logs
- Darshan logs (not yet supported)

## Software architecture

The server provides services through node.js.  There are two backend databases: the hand-written C++ data cube engine, and MongoDB.  The data cube provides high performance query interface that responses a data cube query in less than a second.  MongoDB serves as a general data retrieval tool to access logs.  

## Build Guidelines

### Prerequisites

- A decent compiler that supports C++11
- node.js (6.9.4)
- mongodb (3.2.11)

### Data preparation

- MongoDB directory
- The pregenerated data cube file (raslog)

### Installation

Install node.js and node-gyp.  We recommend to install node.js in home directory and set $PATH to the installation path.

```shell
npm install -g node-gyp 
```

Clone the repo and install dependencies with npm

```bash
git clone git@bitbucket.org:hanqiguo/catalogvis.git
cd catalogvis
npm install
```

Build the C++ data cube (you may need to modify binding.gyp to add C++11 arguments)

```bash
cd cpp
node-gyp configure
node-gyp build
```

Start the MongoDB daemon

```shell
cd $your_mongodb_dir
mongod --dbpath=. &> log & 
```

Copy the data (raslog) to the root directory of the project, and then run the server

```shell
node server.js
```

You may need a process manager, such as pm2.js or forever.js to keep the server running.  After the server is started, you can visit the server through

```
http://your_ip:8081
```

### Security

You can limit the access with a preshared key.  Uncomment the line in server.js:

```javascript
app.use(basicAuth("catalog", "catalog1"));
```

You may also need to secure MongoDB to only allow connection from localhost.  
