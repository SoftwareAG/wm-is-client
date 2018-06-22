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

const http = require('http');
const assert = require('assert');
const util = require('util');
var sinon = require('sinon');
const PassThrough = require('stream').PassThrough;

const app = require('../lib/index.js');
assert(app);

app.logInfo('Starting test-connect tests');

process.on('unhandledRejection', (reason) => {          
  //console.log(`unhandled rejection Reason: ${reason}`);
  if ( util.isNullOrUndefined(reason) ) {
    assert.fail( 'unhandled rejection with no reason');
  } else {
    assert.ok("We got the expected rejection");  
  }
  
});

process.on('uncaughtException', (reason) => {  
  //console.log(`uncaught exception: ${reason}`);
  if ( util.isNullOrUndefined(reason) ) {
    assert.fail( 'unhandled rejection with no error');
  } else {
    assert.ok("We got the expected rejection");  
  }
});


/**
 * These tests use a sinon mocked HTTP request object that returns a fabricated (expected) response.
 */
describe('"connect" tests using a stubbed HTTP request', function () {
  var sandbox;

	beforeEach('desc', function() {
    sandbox = sinon.sandbox.create();
		this.stubRequest = sandbox.stub(http, 'request');
	});
 
	afterEach('desc', function() {
    sandbox.restore();
	});


  /**
   * Successful connection 
   */
  it('[Test Connect Success]', function () {

      var expected = { };
      var response = new PassThrough();
      response.statusCode = 200; 
      var expect_ssnid = "b58f53a9ca3043d6be019c04f556fdd4";      
      response.headers = { 'set-cookie' : [ `ssnid=${expect_ssnid}; path=/; HttpOnly` ]};
      response.write(JSON.stringify(expected));
      response.end();
  
      var request = new PassThrough();
      request.constructor.prototype.setTimeout = function( to) {
          assert(to > 0);
      };
      this.stubRequest.returns(request);

    var config = require('../lib/config');
    config.http.port = 123;

    
    var p = app.connect(config);            
    assert( p != null);

    request.emit('response',response);  // simulate the server returning a response
  
  
    p.then(ssnid => {
        assert( expect_ssnid === ssnid, "Unexpected! ${ssnid}");
    });
    // !Important
    // mocha can assert successful promises which are resolved by simply returning it.
    // (For rejection handling used to assert failures, see the next test case)
    return p;
    
  });

  /**
   * Failed connection where the server returns a 500 statusCode
   */
  it('[Test Connect Failure]', function () {

    var expected = { };
    var response = new PassThrough();
    response.statusCode = 500; 
    var expect_ssnid = "b58f53a9ca3043d6be019c04f556fdd4";      
    response.headers = { 'set-cookie' : [ `ssnid=${expect_ssnid}; path=/; HttpOnly` ]};
    response.write(JSON.stringify(expected));
    response.end();

    var request = new PassThrough();
    request.constructor.prototype.setTimeout = function( to) {
        assert(to > 0);
    };
    this.stubRequest.returns(request);

    var config = require('../lib/config');
    config.http.port = 123;

  
    var p = app.connect(config);            
    assert( p != null);

    request.emit('response',response);  // simulate the server returning a response
  
    // if a test case expects to raise an exception, we cannot return the promise to Mocha - it just fails.
    // So this bit of magic is needed which seems very inconsistent to me. :(
    p.then( (data) => {
        throw new Error(`Expected error object from the rejected promise: ${data}`);        
    }).catch( (e) => {
      assert( e && e.reason );
      var idx =  e.reason.indexOf('500');
      assert( idx > 0, "Unexpected! ${e.reason}" );      
    });
  
  });

});

/**
 * These tests assert failure cases using a live (unmocked) Node.JS http request.
 */
describe('"connect" tests using a real HTTP request', function () {
  const app = require('../lib/index.js');
  

	beforeEach('desc', function() {    
	});
 
	afterEach('desc', function() {
	});


  /**
   *  If the server is unknown, we should expect to see an ENOTFOUND error
   */
  it('[Test Unknown Host]', function () {

    var config = require('../lib/config');
      // http package's 'options'
    config.http = {          
        protocol: 'http:',	
        keepAlive: true,
        hostname: 'localhostThatDoesNotExist',
        port: 5555,
        method: 'GET',
        path: '/',
    };
      
    var p = app.connect(config);
    p.then( (data) => {
      throw new Error(`Expected error object from the rejected promise: ${data}`);        
    }).catch( (e) => {
      assert( e && e.reason );
      var idx =  e.reason.indexOf('ENOTFOUND');  
      assert( idx > 0, "Unexpected! ${e.reason}" );      
    });
  });

  
  /**
   *  If the server is down, we should expect to see an ECONNREFUSED error
   */
  it('[Test Server is Down]', function () {

    var config = require('../lib/config');
      // http package's 'options'
    config.http = {          
        protocol: 'http:',	
        keepAlive: true,
        hostname: 'localhost',
        port: 63209, //assume this port is not open
        method: 'GET',
        path: '/',
    };
      
    var p = app.connect(config);
    p.then( (data) => {
      throw new Error(`Expected error object from the rejected promise: ${data}`);        
    }).catch( (e) => {
      assert( e && e.reason );
      var idx =  e.reason.indexOf('ECONNREFUSED');  
      assert( idx > 0, "Unexpected! ${e.reason}" );      
    });
  });  
});


/**
 * These tests assert failure cases using a mostly live (unmocked) Node.JS http request.
 */
describe('"connect" tests using a HTTP request stub', function () {
  const app = require('../lib/index.js');
  assert(app);
  
  var sandbox;

	beforeEach('desc', function() {   
    sandbox = sinon.sandbox.create();
    this.stubRequest = sandbox.stub(http, 'request');     
    //this.stubRequest = sandbox.spy(http, 'request');     
	});
 
	afterEach('desc', function() {
    sandbox.restore();
	});


  /**
   *  If the server doesn't return in the expected connection time, we should fail
   */
  it.skip('[Test Connection Timeout]', function (done) {

    var request = new PassThrough();
    request.constructor.prototype.setTimeout = function( to) {
        assert(to > 0);
    };
    
   this.stubRequest.returns(request);


    var config = require('../lib/config');
      // http package's 'options'
    config.http = {          
        protocol: 'http:',	
        keepAlive: true,
        hostname: 'localhost',
        port: 63209, //assume this port is not open
        method: 'GET',
        path: '/',
    };
    
    
    this.stubRequest.callsFake( () => {
    
      setTimeout( () => {
        // call the real method
        this.stubRequest.callThrough();
        done();
      }, 3000);
      return request;
    });
  

    var p = app.connect(config);

    // we do not want to simulate the server returning a response
    //request.emit('response',response);  

    p.then( (data) => {
      throw new Error(`Expected error object from the rejected promise: ${data}`);        
    }).catch( (e) => {
      assert( e && e.reason );
      var idx =  e.reason.indexOf('ECONNREFUSED');  
      assert( idx > 0, "Unexpected! ${e.reason}" );      
    });
  });    
});
