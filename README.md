
![alt text](docs/images/is_logo_stacked.png "Integration Server")

# Introduction
wm-is-client is a NodeJS package for accessing Software AG's wm Integration Server services natively from node JS using
pure Javascript.

GET invocation example

![alt text](docs/images/ss-1.png "GET ping")


# Revision history

 
| when          | what   |
| ------------- | :------|
| 1.0.17  | Attach license header to source files |
| 1.0.16  | README.md update |
| 1.0.15  | Initial release | 


# Supported Platforms
| when           | what |
| -------------  | ---- |
| Apr 2018       | w64      |
| Apr 2018       | lnxamd64 | 

npm package installation enforces these platforms via the 'os' element.
```js
"os": [
    "linux",
    "win32",
    "!darwin"
  ],
```

# Installation
Globally install the [wm-is-client](https://www.npmjs.com/package/wm-is-client) node package.
```js
 npm install -g wm-is-client
```

No errors? You're ready to use the package's IS demo client  or skip to [API](#api) documentation


# CLI Demo Tool

## Invoke Requests Against a Running Server
This section uses the [is-client](#is-client-doc) demo utility.
 
 
> First, start an Integration Server.  
> Note: This readme may refer to 'Integration Server' as "IS".

```


$ cd /pathToInstallation/profiles/IS_default/bin
$ ./console.sh
.
.
.
```
> Fetch a list of IS packages from the server.
```js
$ is-client -s localhost:5555 -u Administrator -p manage list
{
    "packages": [
        {
            "name": "Default",
            "enabled": "true",
            "loadok": "0",
            "pkgType": "1",
            "loaderr": "0",
            "loadwarning": "0",
            "subsystem": false
        },
        {
            "name": "NodeBench",
            "enabled": "true",
            "loadok": "1",
            "pkgType": "1",
            "loaderr": "0",
            "loadwarning": "0",
            "subsystem": false,
            "zipLastModified": "Mon Mar 19 10:02:11 EDT 2018"
        },

.
.
.
```
> Or if the server is running locally rely on the default settings
```js
$ is-client list
.
.
.
```

> Refer to help for more details.
```
$ is-client -h

  Usage: is-client [options]

  node lib/cli-test.js [get] | [list] | [post]


  Options:

    -v, --version                    output the version number
    -s --serverport <serverport>     hostname:port
    -c --console                     Send log messages to stdout
    -d, --debug                      Additional trace messages
    -u --user <username>             e.g. Administrator
    -r --request-file <requestFile>  Path to requestFile
    -o --output-file <responseFile>  Path to responseFile
    -p --password <password>         e.g. manage
    -x, --x-stream                   eXecute using serviceStream
    -t, --tls                        Use TLS encryption
    -n, --notrust                    server trust verification disabled
    -h, --help                       output usage information
$ 
```


### POST invocation example

This POST example sends a request to the Integration Server to execute an operating system command.

---
#### About executing OS commands from IS <a id="is-os-exec"></a>
> This example requires an additional step for granting permission to run an OS command on the Integration Server.

```
$ cd ~/dev/installs/102apr2018/IntegrationServer/instances/default/packages/WmPublic/config/

$ cat OSCommands.cnf 
allowedOSCommands=ls;uptime;ps
allowedWorkingDirectories=
$ 

```

> After editing the configuration file, you must either reload the WmPublic package or restart the IS server. The server is now authorized to execute these OS commands.
---

![alt text](docs/images/ss-2.png "POST execute")


#### You can also redirect from stdin 

```
$ is-client post pub.utils:executeOSCommand < $testdir/requests/uptime.req
```


#### Or pass a request on the command line argument
```
$ is-client post pub.utils:executeOSCommand "{ \"command\" : \"uptime\" }"
```

#### Windows Example
This example is invoking an OS command on an IS server running on a Windows platform.
```
$ is-client -s my-windows-vm:5555 post pub.utils:executeOSCommand "{ \"command\" : \"cmd /c ver\" }"

```

With IS returning this response.
```
{
    "command": "cmd /c ver",
    "status": "0",
    "outputMessage": "\r\nMicrosoft Windows [Version 6.3.9600]\r\n",
    "errorMessage": ""
}$ 
```

## CLI Demo Tool Documentation <a id="is-client"></a>
Complete details for the 'is-client' command line tool for invoking Integration Server services. Since the pacakge was globally installed, it will be on your path.

e.g.
```
$ is-client --version
1.0.8
```
Three actions are supported: list, get and post.

| functions          | example            | When  |
| ------------- |:-------------| -----:|
| list IS packages    | is-client list | 102apr2018 |
| list IS services in a package  |  is-client list WmPublic | 102apr2018    |
| list IS service details | is-client wm.server:ping | 102apr2018 |
| Execute GET service  | node lib/cli-test.js get wm.serve:ping  | 102apr2018  |
| Execute POST service | node lib/cli-test.js post pub.utils:executeOSCommand -r /home/user/test/fixtures/requests/uptime.req  | 102apr2018    |



## Examples

#### List packages
```js
is-client list
```

#### Execute GET
```js
is-client get wm.server:ping
```

#### Execute POST
This example assumes a relative path to a 'ps.req' file containing the following request:
>{
    "command": "ps",
    "arguments": [ "-ef" ]
}

```js
is-client post pub.utils:executeOSCommand -r test/fixtures/requests/ps.req
```
Note, if you receive an error response containing 'Specified command [ps -ef] is not on the allowed...' See [this section](#is-os-exec) if you have not already added 'ps' to the list of whitelisted OS commands in IntegrationServer/instances/default/packages/WmPublic/config/OSCommands.cnf.


## Stress Test
Install the included sample IS NodeBench package and use the is-client tool to generate load on the server by performing these two steps:

1. Install NodeBench IS package
2. Invoke the package's IS service

#### Install NodeBench IS package
* Copy the 'test/IS/NodeBench.zip' zip archive from the wm-is-client's installation package to the <pathToIntegrationServerInstallation>/IntegrationServer/instances/default/replicated/inbound/ directory.
* Use the IS Administrator web portal to install the package.
* Verify the package has loaded without any errors.

![alt text](docs/images/ss-3.png "Install IS NodeBench package")

#### Invoke service with the is-client tool
```
$ is-client post pub:DataPump -x "{ \"rowCount\": 3, \"chunkCount\" : 3 }"

{ "rows" : [
  { "0": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { "1": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { "2": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" }
  ] 
}
$ 
```

Send the content to an output file when generating lots of data.

This example sets the 'debug' switch to illustrate the streaming functionality.

```
$ is-client post pub:DataPump -d -x -o test.json "{ \"rowCount\": 10000, \"chunkCount\" : 1000 }"
Writing response to test.json
Trusted server verification disabled? undefined
Override checking server certificate? false
Using key path: /home/user/dev/git/njs/wm-is-client/test/fixtures/pem/ssos-key.pem
Using key passphrase: manage
Using certificate authority: /home/user/dev/git/njs/wm-is-client/test/fixtures/pem/ssos-ca.pem
Using trust store: /home/user/dev/git/njs/wm-is-client/test/fixtures/pem/ssos-trust.pem
### Connection success! ssnid: 07b79ad715a9478ba14b82937db35e82
### Invoking app.stream()
### Received chunk event: (200) data length: 16128
### Received chunk event: (200) data length: 65536
### Received chunk event: (200) data length: 65536
### Received chunk event: (200) data length: 65536
### Received chunk event: (200) data length: 65536
### Received chunk event: (200) data length: 65536
### Received chunk event: (200) data length: 65536
### Received chunk event: (200) data length: 65536
### Received chunk event: (200) data length: 64028
### Received LAST chunk: (200) data length: 0
(200) Response headers: {"content-type":"application/json","content-length":"538908"}
$ 
```
Confirming 10,000 rows were created and the json response data is parseable.
```
$ cat test.json | jq '.[]' | jq length
10000
$ 
```


# wm-is-client API <a id="api"></a>

The API is very simple. There are two functions for connecting and disconnecting to/from an Integration Server, and two functions for invoking an IS service.  One function sends and receives String objects containing the entire request and response content. The other function is optimized for very large request or response objects, so it uses [Streams](https://nodejs.org/api/stream.html "Node JS") to send/receive chunks of data as to avoid excessive memory consumption.

| functions          | purpose            | When  |
| :------------- |:-------------| -----:|
| connect    | Connect to the Integration Server | 102apr2018 |
| disconnect  | Disconnect from the Integration Server | 102apr2018    |
| execute  |  Execute an IS service | 102apr2018    |
| stream  |  Execute an IS service with request and response messages delivered/returned in chunks | 102apr2018    |

## connect

connect() is used to create an authenticated session on the Integration Server. Connection details are defined in the config parameter included with the function.

> NOTE: Only basic auth is supported at this time.  

>Please refer to the wm-is-client/lib/config.js source file for more details regarding valid configuration options.

This method returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 


### Request
| in/out|  param | required | contents | example |
| ----- | -------- | ------- |-------- | ------- |
| in    | config | yes |  a config object.  | var config = require('wm-is-client').config |
| out   | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) | - | data varies depending upon whether the response is resolved or rejected | See  'Response' section for more details.

### Response
The format for the Promise's data object.

| success   | contents | example | 
| ------   | -------- | -------- |
| ssnid  | String containing the session id created by IS|  b58f53a9ca3043d6be019c04f556fdd4 |

| failure   | contents | example | 
| ------   | -------- | -------- |
| JSON object with two elements  | Optional javascript [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object and an optional reason string  | -
> There will always be an error object, a reason string, or both.


>See the 'execute' or 'stream' examples for a complete connect() example.

## disconnect

disconnect() ends the session.

This method returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 


### Request
| in/out|  param | required | contents | example |
| ----- | -------- | ------- |-------- | ------- |
| in    | - | - |  -  | - |
| out   | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) | - | data varies depending upon whether the response is resolved or rejected | See  'Response' section for more details.

### Response
The format for the Promise's data object.

| success   | contents | example | 
| ------   | -------- | -------- |
| ssnid  | String containing the session id created by IS|  b58f53a9ca3043d6be019c04f556fdd4 |

| failure   | contents | example | 
| ------   | -------- | -------- |
| JSON object with two elements  | Optional javascript [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object and an optional reason string  | -

> There will always be an error object, a reason string, or both.

>See the 'execute' or 'stream' examples for a complete disconnect() example.

## execute

execute() is the simplest method for interacting with an IS service.

It returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) ( containing a json object with keys defined in API)

> NOTE: IS services that contain request and response elements which do not support the 'application/json' content are unsupported.  In this case, additional steps are required such as writing it an IS service which calls the unsupported service.

The data value returned for a succesful invocation ( i.e. resolve ) or failed invocation (i.e. reject ) are shown below.  In both cases, the object returned by the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) is a Javascript [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) containing key-value pairs. The key names are a fixed part of the API; therefore, they are defined and exported from index.js. 


### Request
| in/out|  param | required | contents | example |
| ----- | -------- | ------- |-------- | ------- |
| in    | service | yes |  fully qualified IS servicename | wm.server:ping |
| in    | method  | yes |  HTTP GET or POST | GET, POST |
| in    | sRequest | no |  request [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | { "rows" : 3, "chunk" : 3} | 
| in    | headers | no |  JSON object of optional additional HTTP request headers | {'Accept':'application/json'} |
| out   | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) | - | data varies depending upon whether the response is resolved or rejected | See  'Response' section for more details.


### Response
The format for the Promise's data object.

| success   | contents | example | 
| ------   | -------- | -------- |
| data[app.STATUS_CODE]  | HTTP numeric response code |  200, 500, etc. |
| data[app.RESPONSE]  | Node.js API [buffer](https://nodejs.org/api/buffer.html) | <Buffer 7b 20 22 72 6f 77 73 22 20 3a 20 5b 0a 20 20 7b 20 22 30 22 3a 20 22 31 32 33 34 35 36 37 38 39 30 41 42 43 44 45 46 47 48 49 4a 4b 4c 4d 4e 4f 50 51 ... >  |
| data[app.RESPONSE_HEADERS] | | |

>NOTE: An object containing buffer data may be converted to a [string] using 
```js
const StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
.
.
.
if ( Buffer.isBuffer(data)) {
  
  var myString = decoder.write(data)); 
}
```

| failure   | contents | example | 
| ------   | -------- | -------- |
| data[app.ERROR]  | Optional javascript [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object | -
| data[app.REASON]  | Optional reason string  | -
> There will always be an error object, a reason string, or both.

GET example ( docs/get.js )
```js
var app = require('wm-is-client');

function getMe(ssnid) {
    console.log(`Session connected: (${ssnid})... Executing ping`);
    var promise = app.execute( 'wm.server:ping', 'GET');
    return promise;

}
function dumpResponse(data) {
    console.log( `Response: ${data[app.RESPONSE]}`);
}

app.connect(app.config)
    .then( (ssnid) => getMe())    
    .then( (data) => dumpResponse(data))
    .then( () => app.disconnect())
    .then( (ssnid) => {
        console.log('Session disconnected... ${ssnid}');
    }).catch( (err) => {
        console.log(err);
    });
```
```bash
$ node docs/get.js
Session connected: (59fccd53de6245be9bf8dce7d71bc40b)... Executing ping
Response: {"date":"Mon Mar 26 11:14:40 EDT 2018"}
Session disconnected...
$ 
```


POST example ( docs/post.js )
```js
var app = require('wm-is-client');
var stream = require('stream');
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

function postMe() {
    let sRequest = "{\"rowCount\": 4, \"chunkCount\": 2}";
    let reqStream = new stream.PassThrough();
    reqStream.write(sRequest);
    reqStream.end();
    var listener = app.stream( 'pub:DataPump', 'POST', reqStream);

    listener.on(app.CHUNK, (data) => {
    
        let statusCode = data[app.STATUS_CODE];           
        let myBuffer = data[app.RESPONSE];
        if ( myBuffer != null) {
                sResponse = decoder.write( myBuffer);
        }
        
        console.log(`Chunk of response received: ${sResponse}`);
    });

    listener.on(app.END, (data) => {             
        
        let statusCode = data[app.STATUS_CODE];                   
        console.log(`Response completed. (${statusCode})`);
    });

    listener.on(app.ERROR, (data) => {

        console.log('Error received');
        let e = data[app.ERROR];
        let reason = data[app.REASON];
    });
}

app.connect(app.config).then( () => {
    try {
        postMe();
    } finally { 
        app.disconnect();
    }

}).catch( (err) => {
    console.log(err);
});

```
```bash
$ node docs/post.js
Chunk of response received: { "rows" : [
  { "0": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { "1": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { "2": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { "3": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" }
  ]
}

Response completed. (200)
$ 
```

## stream
Use the stream() function if the size of the request or response is so large that too much memory would be consumed if all the data exists in memory.

It returns a Node.js [event](https://nodejs.org/api/events.html) emitter which may be used to receive events containing data (or error) as it becomes available.

> IS services that contain request and response elements which do not support the 'application/json' content are unsupported.  In this case, additional steps are required such as writing it an IS service which calls the unsupported service.


```js
var listener = app.stream( service, 'POST', reqStream);
listener.on(app.CHUNK, (data) => {
    let statusCode = data[app.STATUS_CODE];           
    let myBuffer = data[app.RESPONSE]);
    .
    .
    .
});
listener.on(app.END, (data) => {             
    let statusCode = data[app.STATUS_CODE];           
    let myBuffer = data[app.RESPONSE]);
    .
    .
    .
});
listener.on(app.ERROR, (data) => {

    let e = data[app.ERROR];
    let reason = data[app.REASON];
});
```

### Request

| in/out | param | required | contents | example |
| -----  | ----- | -------- | -------  | ------- |
| in     | service | yes    | fully qualified IS servicename | wm.server:ping |
| in     | method | yes | HTTP GET or POST | GET, POST |
| in     | reqStream | no | request [stream](https://nodejs.org/api/stream.html) | See POST example below | 
| in     | headers | no | JSON object of optional additional HTTP request headers | {'Accept':'application/json'} |
| out    | listener | - | [event](https://nodejs.org/api/events.html) emitter to listen for response events.| See  'Response' section for more details.


### Response
The format for the promise's data object.

| event type   | contents | example | 
| ------   | -------- | -------- |
|  data[app.RESPONSE] | A chunk of Node.js API [buffer](https://nodejs.org/api/buffer.html) | <Buffer 7b 20 22 72 6f 77 73 22 20 3a 20 5b 0a 20 20 7b 20 22 30 22 3a 20 22 31 32 33 34 35 36 37 38 39 30 41 42 43 44 45 46 47 48 49 4a 4b 4c 4d 4e 4f 50 51 ... > |
| data[app.END] | Signals the last chunk of data has arrived for the response. (This chunk does not have to contain data.) | -
| data[app.ERROR] | Contains a JSON object with two keys: app.ERROR key to a javascript [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object and app.REASON key to an optional reason string | { "error" : err object, "reason": "An optional message"}

 
POST example
```js
POST example
```js
var app = require('wm-is-client');
var stream = require('stream');
  .
  .
  .

let sRequest = "{\"row\": 2000000, \"chunk\": 100}";
let reqStream = new stream.PassThrough();
reqStream.write(sRequest);
reqStream.end();
var listener = app.stream( 'pub:DataPump', 'POST', reqStream);
listener.on(app.CHUNK, (data) => {
    console.log('Chunk of response received');
    let statusCode = data[app.STATUS_CODE];           
    let myBuffer = data[app.RESPONSE]);
    .
    .
    .
});
listener.on(app.END, (data) => {             
    console.log('Response received');
    let statusCode = data[app.STATUS_CODE];           
    let myBuffer = data[app.RESPONSE]);
    .
    .
    .
});
listener.on(app.ERROR, (data) => {

    let e = data[app.ERROR];
    let reason = data[app.REASON];
});

        var jResponse = JSON.parse( data[app.RESPONSE] );

}).catch(function(err) {
    console.log(`Execute err: ${err[app.ERROR]}`);
    console.log(`Reason? ${err[app.REASON]}`);
});  

```

> Refer to the bin/cli-test.js source for a more complete example that writes the chunks of data to a text file.

# TroubleShooting

Questions may be submitted via email to npm-cirrus@softwareag.com.
## Logging
wm-is-client supports two loggers in its configuration.

1. console
2. file path

By default, nothing is written to the console log and information is written to a 'log.json' file in a .wm-is-client folder in the user's home directory.
```js
  'logger' : {    
      'level' : 'info',  // info, debug
      // skipped if null, or set to process.stdout or process.stderr
      'console' : null,
      // if null, the default is to ~/.wm-is-client/log.json when logger is created
      'path' : null 
  },
```
> (Windows example)
```
 C:\>dir %USERPROFILE%\.wm-is-client\log.json
 Volume in drive C is SYS
 Volume Serial Number is 7431-F125

 Directory of C:\Users\usawco\.wm-is-client

03/24/2018  04:51 PM               372 log.json
               1 File(s)            372 bytes
```

## Node.js trace facility
The node tracing functionality is supported. The following example demonstrates trace logging for this package as well as Node's core HTTP module.

Note: wm-is-client does not display the password included with the config object passed to its connect function.

```
$ NODE_DEBUG=http,wm-is-client is-client post pub:DataPump -x "{ \"rowCount\": 3, \"chunkCount\" : 3 }"

WM-IS-CLIENT 28754: wm-is-client client.js Config: {
    "logger": {
        "level": "info",
        "path": "/home/user/dev/git/njs/wm-is-client/logs/wm-is-client.log"
    },
    "timeout": {
        "connect": 30000,
        "read": 30000
    },
    "auth": {
        "basic": {
            "user": "Administrator",
            "pass": "xxxxxxx"
        }
    },
    "tls": {
        "ca": "/home/user/dev/git/njs/wm-is-client/test/fixtures/pem/ssos-ca.pem",
        "trust": "/home/user/dev/git/njs/wm-is-client/test/fixtures/pem/ssos-trust.pem",
        "key": "/home/user/dev/git/njs/wm-is-client/test/fixtures/pem/ssos-key.pem",
        "passphrase": "manage"
    },
    "http": {
        "agent": {
            "keepAlive": true,
            "keepAliveMsecs": 1000,
            "maxSockets": 256,
            "maxFreeSockets": 256
        },
        "protocol": "http:",
        "hostname": "localhost",
        "headers": {
            "Accept": "application/json"
        },
        "port": "5555"
    }
}
WM-IS-CLIENT 28754: Creating connect Promise: 
WM-IS-CLIENT 28754: Connecting to: http://localhost:5555 with user: Administrator. Password provided? true
WM-IS-CLIENT 28754: connect() options: {
    "protocol": "http:",
    "hostname": "localhost",
    "port": "5555",
    "headers": {
        "Authorization": "Basic QWRtaW5pc3RyYXRvcjptYW5hZ2U=",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    "timeout": 30000,
    "method": "GET",
    "path": "/"
}
HTTP 28754: call onSocket 0 0
HTTP 28754: createConnection localhost:5555: { servername: 'localhost',
  passphrase: 'manage',
  key: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 52 53 41 20 50 52 49 56 41 54 45 20 4b 45 59 2d 2d 2d 2d 2d 0d 0a 50 72 6f 63 2d 54 79 70 65 3a 20 34 2c 45 4e 43 52 ... >,
  cert: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... >,
  maxFreeSockets: 256,
  maxSockets: 256,
  keepAliveMsecs: 1000,
  keepAlive: true,
  ca: 
   [ <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... > ],
  agent: 
   Agent {
     domain: null,
     _events: { free: [Function] },
     _eventsCount: 1,
     _maxListeners: undefined,
     defaultPort: 80,
     protocol: 'http:',
     options: 
      { passphrase: 'manage',
        key: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 52 53 41 20 50 52 49 56 41 54 45 20 4b 45 59 2d 2d 2d 2d 2d 0d 0a 50 72 6f 63 2d 54 79 70 65 3a 20 34 2c 45 4e 43 52 ... >,
        ca: [Array],
        cert: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... >,
        port: '5555',
        host: 'localhost',
        maxFreeSockets: 256,
        maxSockets: 256,
        keepAliveMsecs: 1000,
        keepAlive: true,
        path: null },
     requests: {},
     sockets: { 'localhost:5555:': [] },
     freeSockets: {},
     keepAliveMsecs: 1000,
     keepAlive: true,
     maxSockets: 256,
     maxFreeSockets: 256 },
  path: null,
  method: 'GET',
  timeout: 30000,
  headers: 
   { Authorization: 'Basic QWRtaW5pc3RyYXRvcjptYW5hZ2U=',
     'Content-Type': 'application/x-www-form-urlencoded' },
  port: '5555',
  hostname: 'localhost',
  protocol: 'http:',
  host: 'localhost',
  _agentKey: 'localhost:5555:' }
HTTP 28754: sockets localhost:5555: 1
WM-IS-CLIENT 28754: msConnTimeout set to 30000 milliseconds
HTTP 28754: outgoing message end.
WM-IS-CLIENT 28754: Request sent.
HTTP 28754: AGENT incoming response!
HTTP 28754: AGENT isHeadResponse false
WM-IS-CLIENT 28754: Response arriving... (200)
WM-IS-CLIENT 28754: cookie: ssnid=4b22108c1daf41afa2d4fd8d1acc7607; path=/; HttpOnly
WM-IS-CLIENT 28754: Executing serviceStream: pub:DataPump on localhost:5555
WM-IS-CLIENT 28754: Executing serviceExecute: /invoke/pub:DataPump on localhost:5555
WM-IS-CLIENT 28754: (inPromise)serviceExecute: {
    "protocol": "http:",
    "hostname": "localhost",
    "port": "5555",
    "headers": {
        "Authorization": "Basic QWRtaW5pc3RyYXRvcjptYW5hZ2U=",
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
        "Accept": "application/json",
        "Cookie": [
            "ssnid=4b22108c1daf41afa2d4fd8d1acc7607; path=/; HttpOnly"
        ]
    },
    "timeout": 30000,
    "method": "POST",
    "path": "/invoke/pub:DataPump"
}
HTTP 28754: call onSocket 1 0
HTTP 28754: createConnection localhost:5555: { servername: 'localhost',
  passphrase: 'manage',
  key: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 52 53 41 20 50 52 49 56 41 54 45 20 4b 45 59 2d 2d 2d 2d 2d 0d 0a 50 72 6f 63 2d 54 79 70 65 3a 20 34 2c 45 4e 43 52 ... >,
  ca: 
   [ <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... > ],
  cert: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... >,
  maxFreeSockets: 256,
  maxSockets: 256,
  keepAliveMsecs: 1000,
  keepAlive: true,
  agent: 
   Agent {
     domain: null,
     _events: { free: [Function] },
     _eventsCount: 1,
     _maxListeners: undefined,
     defaultPort: 80,
     protocol: 'http:',
     options: 
      { passphrase: 'manage',
        key: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 52 53 41 20 50 52 49 56 41 54 45 20 4b 45 59 2d 2d 2d 2d 2d 0d 0a 50 72 6f 63 2d 54 79 70 65 3a 20 34 2c 45 4e 43 52 ... >,
        ca: [Array],
        cert: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... >,
        port: '5555',
        host: 'localhost',
        maxFreeSockets: 256,
        maxSockets: 256,
        keepAliveMsecs: 1000,
        keepAlive: true,
        path: null },
     requests: {},
     sockets: { 'localhost:5555:': [Array] },
     freeSockets: {},
     keepAliveMsecs: 1000,
     keepAlive: true,
     maxSockets: 256,
     maxFreeSockets: 256 },
  path: null,
  method: 'POST',
  timeout: 30000,
  headers: 
   { Authorization: 'Basic QWRtaW5pc3RyYXRvcjptYW5hZ2U=',
     'Content-Type': 'application/json',
     'Transfer-Encoding': 'chunked',
     Accept: 'application/json',
     Cookie: [ 'ssnid=4b22108c1daf41afa2d4fd8d1acc7607; path=/; HttpOnly' ] },
  port: '5555',
  hostname: 'localhost',
  protocol: 'http:',
  host: 'localhost',
  _agentKey: 'localhost:5555:' }
HTTP 28754: sockets localhost:5555: 2
WM-IS-CLIENT 28754: msReadTimeout set to 30000 milliseconds
WM-IS-CLIENT 28754: Creating disconnect Promise chain to gracefully ask server to shutdown this session
WM-IS-CLIENT 28754: Executing serviceExecute: /invoke/wm.server:disconnect on localhost:5555
WM-IS-CLIENT 28754: (inPromise)serviceExecute: {
    "protocol": "http:",
    "hostname": "localhost",
    "port": "5555",
    "headers": {
        "0": "a",
        "1": "p",
        "2": "p",
        "3": "l",
        "4": "i",
        "5": "c",
        "6": "a",
        "7": "t",
        "8": "i",
        "9": "o",
        "10": "n",
        "11": "/",
        "12": "j",
        "13": "s",
        "14": "o",
        "15": "n",
        "Authorization": "Basic QWRtaW5pc3RyYXRvcjptYW5hZ2U=",
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
        "Accept": "application/json",
        "Cookie": [
            "ssnid=4b22108c1daf41afa2d4fd8d1acc7607; path=/; HttpOnly"
        ]
    },
    "timeout": 30000,
    "method": "GET",
    "path": "/invoke/wm.server:disconnect"
}
HTTP 28754: call onSocket 2 0
HTTP 28754: createConnection localhost:5555: { servername: 'localhost',
  passphrase: 'manage',
  key: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 52 53 41 20 50 52 49 56 41 54 45 20 4b 45 59 2d 2d 2d 2d 2d 0d 0a 50 72 6f 63 2d 54 79 70 65 3a 20 34 2c 45 4e 43 52 ... >,
  ca: 
   [ <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... > ],
  cert: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... >,
  maxFreeSockets: 256,
  maxSockets: 256,
  keepAliveMsecs: 1000,
  keepAlive: true,
  agent: 
   Agent {
     domain: null,
     _events: { free: [Function] },
     _eventsCount: 1,
     _maxListeners: undefined,
     defaultPort: 80,
     protocol: 'http:',
     options: 
      { passphrase: 'manage',
        key: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 52 53 41 20 50 52 49 56 41 54 45 20 4b 45 59 2d 2d 2d 2d 2d 0d 0a 50 72 6f 63 2d 54 79 70 65 3a 20 34 2c 45 4e 43 52 ... >,
        ca: [Array],
        cert: <Buffer 2d 2d 2d 2d 2d 42 45 47 49 4e 20 43 45 52 54 49 46 49 43 41 54 45 2d 2d 2d 2d 2d 0d 0a 4d 49 49 44 62 7a 43 43 41 6c 65 67 41 77 49 42 41 67 49 45 42 ... >,
        port: '5555',
        host: 'localhost',
        maxFreeSockets: 256,
        maxSockets: 256,
        keepAliveMsecs: 1000,
        keepAlive: true,
        path: null },
     requests: {},
     sockets: { 'localhost:5555:': [Array] },
     freeSockets: {},
     keepAliveMsecs: 1000,
     keepAlive: true,
     maxSockets: 256,
     maxFreeSockets: 256 },
  path: null,
  method: 'GET',
  timeout: 30000,
  headers: 
   { '0': 'a',
     '1': 'p',
     '2': 'p',
     '3': 'l',
     '4': 'i',
     '5': 'c',
     '6': 'a',
     '7': 't',
     '8': 'i',
     '9': 'o',
     '10': 'n',
     '11': '/',
     '12': 'j',
     '13': 's',
     '14': 'o',
     '15': 'n',
     Authorization: 'Basic QWRtaW5pc3RyYXRvcjptYW5hZ2U=',
     'Content-Type': 'application/json',
     'Transfer-Encoding': 'chunked',
     Accept: 'application/json',
     Cookie: [ 'ssnid=4b22108c1daf41afa2d4fd8d1acc7607; path=/; HttpOnly' ] },
  port: '5555',
  hostname: 'localhost',
  protocol: 'http:',
  host: 'localhost',
  _agentKey: 'localhost:5555:' }
HTTP 28754: sockets localhost:5555: 3
WM-IS-CLIENT 28754: msReadTimeout set to 30000 milliseconds
WM-IS-CLIENT 28754: Flushing request... Now transition wm-is-client state to shutdown
HTTP 28754: outgoing message end.
WM-IS-CLIENT 28754: ### stream() sending request chunks
HTTP 28754: write ret = false
WM-IS-CLIENT 28754: ##### Drain event fired from stream()
WM-IS-CLIENT 28754: ### stream() completed sending request
HTTP 28754: outgoing message end.
HTTP 28754: AGENT incoming response!
HTTP 28754: AGENT isHeadResponse false
WM-IS-CLIENT 28754: Receiving response... status code: 200
WM-IS-CLIENT 28754: on data event. data.length = 16
HTTP 28754: AGENT socket keep-alive
WM-IS-CLIENT 28754: Response received... status code: (200)  Pending request count? 1 Shutdown? true
HTTP 28754: CLIENT socket onFree
HTTP 28754: agent.on(free) localhost:5555:
HTTP 28754: removeSocket localhost:5555: writable: true
HTTP 28754: AGENT incoming response!
HTTP 28754: AGENT isHeadResponse false
WM-IS-CLIENT 28754: Response status code:200
WM-IS-CLIENT 28754: Received 'on' data event. data.length = 171
{ "rows" : [
  { "0": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { "1": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { "2": "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" }
  ]
}
HTTP 28754: AGENT socket keep-alive
WM-IS-CLIENT 28754: Received 'end' data event. Pending requests count: 0
WM-IS-CLIENT 28754: shutdownAgent() cleanup to close agent: localhost:5555:
HTTP 28754: CLIENT socket onFree
HTTP 28754: agent.on(free) localhost:5555:
HTTP 28754: CLIENT socket onClose
HTTP 28754: removeSocket localhost:5555: writable: false
HTTP 28754: CLIENT socket onClose
HTTP 28754: removeSocket localhost:5555: writable: false
HTTP 28754: HTTP socket close
HTTP 28754: CLIENT socket onClose
HTTP 28754: removeSocket localhost:5555: writable: false
$ 
```

## Configuration
A configuration object is included in the API and is defined by config.js contents. This object should only hold static content that will not change while a connection is made to an Integration Server. 
> Modifying a connected configuration will lead to unpredictable results.




# License
Apache-2.0
https://www.apache.org/licenses/LICENSE-2.0


# Miscellaneous

## Authentication
Only Basic Auth is supported at this time.

## i18n
Basic message translation is supported using 'i18n' and 'os-locale' packages. 

## logging
Using the 'bunyan' package, but this is not exposed in the API.


## Error Response <a id="error_resp"/>

The API functions return a json object containing two elements

* error - optional Javascript [Error object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error "JS Reference")
* reason - optional string object


  data[app.ERR] - exception object if available
  data[app.REASON] - reason if available

_____________________
 
These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.

_____________________
 
For more information you can Ask a Question in the [TECHcommunity Forums](https://tech.forums.softwareag.com/tags/c/forum/1/webMethods).

You can find additional information in the [Software AG TECHcommunity](https://tech.forums.softwareag.com/tag/webmethods).
