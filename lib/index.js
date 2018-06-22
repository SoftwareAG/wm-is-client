/* 
* Copyright © 2018 Software AG, Darmstadt, Germany and/or its licensors 
* 
* SPDX-License-Identifier: Apache-2.0 
* 
* Licensed under the Apache License, Version 2.0 (the "License"); 
* you may not use this file except in compliance with the License. 
* You may obtain a copy of the License at 
* 
* http://www.apache.org/licenses/LICENSE-2.0 
* 
* Unless required by applicable law or agreed to in writing, software 
* distributed under the License is distributed on an "AS IS" BASIS, 
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
* See the License for the specific language governing permissions and 
* limitations under the License. 
* 
*/ 

/** @module wm-is-client */

const config = require('./config');
const _util = require('./internal/util.js');



// is-service module's index.js which defines our public API
// This executes when callers 'require' our module.

var Client = require('./internal/client.js');

// this causes ctor function in client.js to execute
//---var Package = require('./lib/internal/package.js');

var client = new Client();

var logInfo = function(msg) {
    // by the time this is called, the client should have updated the config object in the API if necessary
  _util.logger().info(msg);
};

// API to the outside world
module.exports = {
  //constants 
    /** 
     * a constant to access the http response code from the execute function's resolved promise. 
    */
    'STATUS_CODE' : 'statusCode',

    /** 
     * a constant to access the http response body from the execute function's resolved promise. 
    */
    'RESPONSE' : 'response',

    /** 
     * a constant to access the http response headers from the execute and stream function's resolved promise. 
    */    
    'RESPONSE_HEADERS' : 'respHeaders',

    /**
     * a constant to access the current chunk of data received from the stream listener
     */
    'CHUNK' : 'chunk',
    
    /** 
     * a constant to listen for the event fired when the last chunk of a stream() function's response has been received.
    */
    'END' : 'end',

    /** 
     * a constant to access the http response code from the execute function's resolved promise. 
    */
    'SUCCESS' : 'success',

    /** 
     * a constant to access the 'error' object from connect(), execute() or disconnect() function's rejected promise.
    */
    'ERROR' : 'error',

    /** 
     * a constant to access the 'reason' string from connect(), execute() or disconnect() function's rejected promise.
    */
    'REASON' : 'reason',

  //functions
    'connect': client.connect,
    'execute': client.serviceExecute,
    'stream': client.serviceStream,
    'disconnect': client.disconnect,
    // We do not expose Bunyan in the API, so there is no version conflicts with calling applications
    'logInfo' : logInfo,
  //objects
    'config': config
};
