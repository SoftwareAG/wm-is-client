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

const http = require( 'http' );
const assert = require( 'assert');
const util = require('util');
const sinon = require('sinon');
const PassThrough = require('stream').PassThrough;
const StringDecoder = require('string_decoder').StringDecoder;

const app = require('../lib/index.js');
assert(app);

app.logInfo('Starting test-execute tests');

process.on('unhandledRejection', (err) => {  
  //console.log(`unhandled rejection Reason: ${reason}`);
  if ( util.isNullOrUndefined(err) ) {
    assert.fail( 'unhandled rejection with no error');
  } else {
    assert.ok("We got the expected rejection");  
  }
  
});

process.on('uncaughtException', (err) => {  
  //console.log(`uncaught exception: ${reason}`);
  if ( util.isNullOrUndefined(err) ) {
    assert.fail( 'unhandled rejection with no error');
  } else {
    assert.ok("We got the expected rejection");  
  }
});


/**
 * Verify client.js serviceExecute( ) function.
 */


var sandbox;
var stubRequest;

const expect_ssnid = "c9432d23a63f4e3f920f95b99bf6273d";

describe('"execute" tests with stubbed HTTP request', function () {

  //var app = require('../lib/index.js');
  //assert(app);


	beforeEach('desc', function() {
    sandbox = sinon.createSandbox();
    //sandbox = sinon.createSandbox(sinon.defaultConfig);
    /*
    sandbox = sinon.createSandbox( {
      useFakeTimers: true,
      useFakeServer: true
    });
    */

    stubRequest = sandbox.stub(http, 'request');
    sandbox.stub( app, 'connect');
    app.ssnid = expect_ssnid;    
  
	});
 
	afterEach('desc', function() {
    sandbox.restore();

  });


  describe('GET tests', function () {
    function pingMe(data) {
      //buffer
      var buf = data[app.RESPONSE];
      var decoder = new StringDecoder('utf8');
      var msg = decoder.write(buf);         
      console.log( `in pingMe: ${msg}`);
      var obj = JSON.parse( msg);   
      assert.equal(obj.date, 'Wed Feb 07 12:02:20 EST 2018', 'Expected a ping response');
    }


    it('[Test execute wm.server:ping ok]', (done) => {

      var expected = { date: 'Wed Feb 07 12:02:20 EST 2018' };
      var response = new PassThrough();
      
      var cookie = `ssnid=${expect_ssnid}; path=/; HttpOnly`;
      response.statusCode = 200; 
      response.headers = {'set-cookie':[cookie]};
      response.write(JSON.stringify(expected));
      response.end();
  
      var request = new PassThrough();
      request.constructor.prototype.setTimeout = function( to) {
          assert(to >= 0);
      };
      stubRequest.returns(request);

  
      var p = app.execute('wm.server:ping','GET');
      
      request.emit('response',response);  // simulate the server returning a response

      p.then( data => {
        pingMe(data); 
        done();       
      })      
      .catch( data => {  
        var e;
        if ( data && data.stack && data.message) {
          e = data;
        } else {
          console.log( data[app.REASON]);
          e = data[app.ERROR];
        }
        if ( e && e.stack && e.message) {
            console.log( e.message);
            console.log( e.stack);
            done(e);
        } else {
            var msg = data[app.REASON];
            console.log(msg);
            done(new Error(data[app.REASON]));
        }
      });
    });
  });
});