
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
const https = require('https');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const _util = require('./util.js');
const i18n = require('i18n');
const fs = require('fs');

var IShost;
var ISport;
var reqOptions;
var httpAgent;
var agentName;
var sessCookie;
var self;
var msConnTimeout;
var msReadTimeout;
var ssnid;
var pendingRequests = 0;
var agentShutdown = false;
var theHttp = http;
var encoding = 'utf8';

const SERVER_LOGOUT_SERVICE = 'wm.server:disconnect';


/**
 * Class representing a facade for invoking Integration Server services.
 * @extends EventEmitter
 */
class Client extends EventEmitter {
	
/**
 * 
 * @constructor
 */	
	constructor() {
		super();
		self = this;
	}
	/**
	 * @property {string} ssnid returned from the Integration Server for an authenticated session
	 */
	get ssnid() {
		return ssnid;
	}
	set ssnid(id) {
		ssnid = id;
	}

	/**
	 * Make a connection to the configured Integration Server
	 * @param {string} config - The configuration object for this package.
	 * @returns {Promise} resolve object contains the session id (ssnid) string on success
	 *    or a JSON response with error object and reason string elements on failure.
	 */
	connect(config) {

		agentShutdown = false;
		if ( util.isNullOrUndefined( config)) {
			throw new Error(i18n.__mf("E0006"));
		}
		this.config = config;

		if ( _util.isTrace() ) {
			_util.trace('wm-is-client connection config: '+JSON.stringify(config, (key, value) => {
				let retValue = null;
				switch( key ) {
					case 'console': // avoid a circular JSON reference
						retValue = key;
						break;
					
					case 'password':
						retValue = 'xxxxxx';
						break;

					// If a fileStream is passed with the logger config, we don't want to dump the 
					// contents!!
					case 'fileStream':
						retValue='<fileStream>';
						break;

					default:
						retValue = value;

				}
				return retValue;
			}));
		}		
		sessCookie = null;
		ssnid = null;
		if ( !util.isNullOrUndefined(config.encoding)) {
			encoding = config.encoding;
		}
		IShost = config.http.hostname;
		ISport = config.http.port;		
		
		// creating agent with current set of agent options
		let agentOptions = Object.assign({}, config.http.agent);
		// these 4 are used to create the agent name
		agentOptions.host = IShost;
		agentOptions.port = ISport;
			//localAddress: <my IP to use when sending requests>
			//family: 4

		// if a cert to trust is provided, let's include it
		let cert = config.tls.trust;
		if ( !util.isNullOrUndefined( cert )) {
			agentOptions.cert = fs.readFileSync( cert );
		}
		
		let ca = config.tls.ca;
		if ( !util.isNullOrUndefined( ca )) {
			agentOptions.ca = [ fs.readFileSync( ca ) ];
		}
		
		let key = config.tls.key;
		if ( !util.isNullOrUndefined( key )) {
			agentOptions.key = fs.readFileSync( key );
		}
		
		let passphrase = config.tls.passphrase;
		if ( !util.isNullOrUndefined(passphrase)) {
			agentOptions.passphrase = passphrase;
		}

		if ( 'https:' === config.http.protocol) {
			theHttp = https;
		} else {
			theHttp = http;
		}
		httpAgent = new theHttp.Agent( agentOptions );
		agentName = httpAgent.getName(agentOptions);

		if ( _util.isTrace() )  _util.trace('Creating connect Promise: ');
		return new Promise( function( resolve, reject) {
			// password only shown for this tracing function ( It's not written to the logs)			
			if ( _util.isTrace() ) {
				_util.trace(`Connecting to: ${config.http.protocol}//${IShost}:${ISport} with user: ${config.auth.basic.username}. Password provided? ${!util.isNullOrUndefined(config.auth.basic.password)}`);
			}
			
			let auth =  'Basic ' + new Buffer(config.auth.basic.username+':'+config.auth.basic.password).toString('base64');

			reqOptions = {
				'protocol' : config.http.protocol,
				'hostname' : IShost,
				'port' : ISport,
				'headers' : {
					'Authorization' : auth,
					'Content-Type' : 'application/x-www-form-urlencoded'
				},
				'timeout' : config.timeout.read

			};
			
			try {
				// shallow copy
				let options = Object.assign({}, reqOptions);
				options.method = 'GET';
				options.path= '/';
				// keep httpAgent out of trace to avoid JSON circular error
				if ( _util.isTrace() ) {
					_util.trace('connect() options: '+JSON.stringify(options, null, 4));
				}
				options.agent = httpAgent;

				if ( !util.isNullOrUndefined( ca )) {
					options.ca = [ fs.readFileSync( ca ) ];
				}
		
				let cookie;
				let req = theHttp.request( options);

				msConnTimeout = (config && config.timeout && config.timeout.connect) || 30000;
				if ( _util.isTrace() ) {
					_util.trace(`msConnTimeout set to ${msConnTimeout} milliseconds`);
				}
				req.setTimeout( msConnTimeout, () => {
					if ( _util.isTrace() ) {
						_util.trace(`Connect Timeout (${msConnTimeout} ms) elapsed....`);
					}
					reject({'error':null, 'reason': i18n.__mf("E0002 {msConnTimeout}", { 'msConnTimeout' : msConnTimeout}) });
				});

				req.on('response', (res) => {
					if ( _util.isTrace() ) {
						_util.trace(`Connect response arriving... (${res.statusCode})`);
					}
					if ( res.headers != null ) {
						cookie = res.headers['set-cookie'];
						sessCookie = cookie;
					}

					if ( res.statusCode > 299) {
						var reason = i18n.__mf("E00010 {statusCode} {message}", 
								{ statusCode : res.statusCode, message : res.message });
						_util.logger().info( reason );
						reject( { 'error' : null, 'reason' : reason });
						return;						
					}

					try {
						ssnid = parsedCookie(cookie)['ssnid'];

					} catch(e) {
						var reason = i18n.__mf("E0005 {reason}", { reason : e.message });
						_util.logger().info( reason );
						reject( { 'error' : e, 'reason' : reason });
						return;
					}
					resolve( ssnid );										
					res.setEncoding('utf8');
					res.on('end', () => {
						if ( _util.isTrace() ) {
							_util.trace(`Connect response received: (${res.statusCode})`);
						}
					});
				});

				req.on('error', (e) => {										
					var reason = i18n.__mf("E0007 {reason}", { reason : e.message });
					_util.logger().debug( reason );
					if ( _util.isTrace() ) _util.trace( e.stack);
					reject( { 'error' : e, 'reason' : reason });
				});

				req.end(); //flushes headers and ensures request is away...
				if ( _util.isTrace() ) _util.trace('Connect request sent.');
			} catch(e) {
				var reason = i18n.__mf("E0008 {reason}", { reason : e.message });
				_util.logger().info( reason );
				_util.trace( e.stack);
				reject( { 'error' : e, 'reason': reason });				
			}	

		}); // close off the Promise() ctor
	} //connect



	/**
	 * Execute a service by sending a complete request object and returning a complete response.
	 * If the request or response will be very large, the serviceStream function should be considered as a means
	 * to minimize memory usage.
	 * 
	 * @param {string} service - fully qualified IS service name ( e.g. wm.server:ping). (required)
	 * @param {string}  method - HTTP verb - either 'GET' or 'POST' (required)
	 * @param {string} sRequest - request JSON data in string format (optional)
	 * @param {map} reqHeaders - containing additional request headers not specified with connection (optional)
	 * @returns {Promise} resolves an object containing 3 array elements on success
	 *    or rejects a JSON response with error object and reason string elements on failure.
	 */
	serviceExecute( service, method, sRequest, reqHeaders) {

		if ( theHttp === undefined) {
			Promise.reject( { 'error' : null, 'reason' : i18n.__mf("E0006") });
			return;
		}

		let contentLength = null;
		try {
			let mergedHeaders = null;
			let contentType;
			this.sResponse = null;

			var isGet = 'GET' == method;
			
			if ( isGet ) {
				contentType = 'application/x-www-form-urlencoded';
			} else {
				contentLength = Buffer.byteLength(sRequest);
				contentType = 'application/json';
			}

			//TODO - how expensive is this... ( is shallow good enough?)
			//let options = JSON.parse( JSON.stringify(reqOptions) );
			let options = Object.assign({}, reqOptions);

			if ( util.isNullOrUndefined(reqHeaders)) {
				mergedHeaders = options.headers;
			} else {
				// shallow copy
				mergedHeaders = Object.assign( {}, options.headers, reqHeaders);
			}
			if ( util.isNullOrUndefined( mergedHeaders ) ) {
				mergedHeaders = { };
			} 

			mergedHeaders['Content-Type'] = contentType;
			mergedHeaders['Content-Length'] = contentLength;
			
			if ( util.isNullOrUndefined( mergedHeaders['Accept'])) {
				mergedHeaders['Accept'] = 'application/json';
			}
			mergedHeaders['Cookie'] = sessCookie;

			let invokePath = `/invoke/${service}`;
			options.method = method;
			options.headers = mergedHeaders;
			options.path = invokePath;

			if ( _util.isTrace() ) _util.trace('Executing serviceExecute(): '+invokePath+' on '+IShost+':'+ISport+'\n'+JSON.stringify(options, null, 4));
			// Don't add agent until after trace to avoid circular
			options.agent = httpAgent;

			return new Promise( function( resolve, reject) {

				// TODO streams  here's chaining example using a pipe to a flat file, stdout, etc...
				//var req = theHttp.request(options, (res) => {			

					// pipe it to a text file.
					//var writer = fs.createWriteStream('a.txt');
					//res.pipe( writer);

					// or to stdout
					// res.pipe( process.stdout);
				//});				
				let req = theHttp.request(options);		
				pendingRequests += 1;			

				msReadTimeout = (options && options.timeout) || 30000;
				if ( _util.isTrace() ) _util.trace(`msReadTimeout set to ${msReadTimeout} milliseconds`);
				req.setTimeout( msReadTimeout, () => {
					if ( _util.isTrace() ) _util.trace(`Read Timeout (${msReadTimeout} ms) elapsed....`);
					reject({'error':null, 'reason': i18n.__mf("E00011 {msReadTimeout}", { 'msReadTimeout' : msReadTimeout}) });
				});

				// one event is fired when the response is returned.
				req.on('response', function(res) {
					if ( _util.isTrace() ) _util.trace(`Receiving execute() response... status code: ${res.statusCode}`);


					res.on('data', function(data) {

						var len = ( data === undefined ? 0 : data.length);
						if ( _util.isTrace() ) _util.trace( `on data event. data.length = ${len}`);

						if ( this.sResponse == null ) {
							this.sResponse = data;
						} else {
							this.sResponse += data;
						}

					});

					res.on('end', function() {						
						pendingRequests -= 1;
						if ( _util.isTrace() ) _util.trace(`execute() response received... status code: (${res.statusCode})  Pending request count? ${pendingRequests} Shutdown? ${agentShutdown}`);
						if ( agentShutdown && pendingRequests == 0 ) shutdownAgent();

						if ( this.sResponse == null ) {
							this.sResponse = '';
						}
						try {
							resolve( { 'statusCode' :res.statusCode, 'response': this.sResponse, 'respHeaders' : res.headers } );
						} catch(e) {
							reject( { 'error': e, 'reason': 'Error resolving promise'});
						}
					});

				});
	
				if ( SERVER_LOGOUT_SERVICE === service) {
					// we're ending our session on the server cleanly...
					if ( _util.isTrace() ) _util.trace('Flushing request... Now transition wm-is-client state to shutdown');
					agentShutdown = true;
				} else {
					if ( _util.isTrace() ) _util.trace('Flushing request');
				}
				var len = ( util.isNullOrUndefined(sRequest) ? 0 : sRequest.length);
				if ( _util.isTrace() ) _util.trace(`Sending request...  length: ${len}`);
				if ( len == 0) {
					req.end();
				} else {
					req.end(sRequest,encoding);			
				}
				
			});
		} catch (err) {
			return Promise.reject({ error : err, reason: 'Error sending request'});
		}
	} //close off method

// no promise here, so this runs in the caller's slice and emit's a chunk of data
// or it emits an 'error' (not 200), 'success' (for 200), or 'chunk' for each segment of data returned

// throws an error back to the caller if unable to invoke the request
// the request content in this stream must be a Buffer object - i.e. no content type designated...

	/**
	 * Execute a service by sending a complete request object and returning a complete response.
	 * If the request or response will be very large, the stream function should be considered as a means
	 * to minimize memory usage.
	 * 
	 * @param {string} service - fully qualified IS service name ( e.g. wm.server:ping). (required)
	 * @param {string}  method - HTTP verb - either 'GET' or 'POST' (required)
	 * @param {stream} reqStream - A node API stream containing the request body (optional)
	 * @param {map} reqHeaders - containing additional request headers not specified with connection (optional)
	 * @returns {eventEmitter} - A node API event emitter callers can use to listen for events.
	 *    The event names are part of the wm-is-client API (see index.js)
	 */

	serviceStream( service, method, reqStream, reqHeaders) {


		let mergedHeaders = null;



		if ( ssnid === undefined) {
			self.emit( { 'error' : null, 'reason' : i18n.__mf("E0006") });
			return self;
		}
				
		let options = Object.assign({}, reqOptions);

		if ( util.isNullOrUndefined(reqHeaders)) {
			mergedHeaders = options.headers;
		} else {
			// shallow copy
			mergedHeaders = Object.assign( {}, options.headers, reqHeaders);
		}
	
		let isGet = 'GET' == method;
		let contentType = null;
		
		if ( isGet ) {
			contentType = 'application/x-www-form-urlencoded';
		} else {
			contentType = 'application/json';
		}


		mergedHeaders['Content-Type'] = contentType;

		if ( util.isNullOrUndefined(mergedHeaders['Transfer-Encoding'] )) {
			mergedHeaders['Transfer-Encoding'] = 'chunked';
		}
		
		if ( util.isNullOrUndefined( mergedHeaders['Accept'])) {
			mergedHeaders['Accept'] = 'application/json';
		}
		mergedHeaders['Cookie'] = sessCookie;

		let invokePath = `/invoke/${service}`;

		options.method = method;
		options.headers = mergedHeaders;
		options.path = invokePath;

		if ( _util.isTrace() ) {
			_util.trace('Executing serviceStream(): '+invokePath+' on '+IShost+':'+ISport+'\n'+JSON.stringify(options, null, 4));
		}
		// Don't add agent until after trace to avoid circular JSON error.
		options.agent = httpAgent;	

		/*
			var req = theHttp.request(options, (res) => {

				// pipe it to a text file.
				//var writer = fs.createWriteStream('a.txt');
				//res.pipe( writer);

				// or to stdout
				// res.pipe( process.stdout);
			});
		*/
		var req = theHttp.request(options);
		pendingRequests +=1;
				
		msReadTimeout = (options && options.timeout) || 30000;
		if ( _util.isTrace() ) {
			_util.trace(`msReadTimeout set to ${msReadTimeout} milliseconds`);
		}
		req.setTimeout( msReadTimeout, () => {
			_util.trace(`Read Timeout (${msReadTimeout} ms) elapsed....`);
			self.emit({'error':null, 'reason': i18n.__mf("E00011 {msReadTimeout}", { 'msReadTimeout' : msReadTimeout}) });
		});


		// one event is fired when the response is returned.
		req.on('response', function(res) {

			if ( _util.isTrace() ) _util.trace('stream() response status code:'+res.statusCode);
			res.on('data', function(data) {
				var len = ( data === undefined ? 0 : data.length);
				if ( _util.isTrace() ) _util.trace( `Received 'data' event. data.length = ${len}`);
				self.emit('chunk', { 'statusCode' : res.statusCode, 'response' : data, 'respHeaders' : res.headers});
			});

			res.on('end', function() {
				self.emit( 'end', { 'statusCode' : res.statusCode, 'response' : null, 'respHeaders' : res.headers});
				pendingRequests -= 1;
				if ( _util.isTrace() ) _util.trace(`Received stream() 'end' data event. Pending requests count: ${pendingRequests}`);
				if ( agentShutdown && pendingRequests == 0 ) shutdownAgent();
			});

			res.on('error', function(e) {
				if ( _util.isTrace() ) _util.trace( `Received stream() 'error' data event: = ${e.message}\n${e.stack}`);
				self.emit('error', { 'error' : e, 'reason' : e.message, 'respHeaders' : res.headers});

			});

		});

		if ( !isGet && !util.isNullOrUndefined(reqStream) ) {
			// don't overrun the server's capacity
			sendData( reqStream, req);

		} else {
			req.end();
		}
		
			

		// return a reference to the EventEmitter
		return self;

	} //close off method

	/**
	 * Disconnect client from the Integration Server. This function will invoke an IS service to destroy the session on the server
	 * before it closes down the http agent.
	 * 
	 * @returns {Promise} resolves an object containing the ssnid of the destroyed session
	 *    or rejects a JSON response with error object and reason string elements on failure.
	 */
	
	disconnect() {
		if (!util.isNullOrUndefined(ssnid)) {
			if ( _util.isTrace() ) {
				_util.trace('Creating disconnect Promise chain to gracefully ask server to shutdown this session');
			}
			return self.serviceExecute( 'wm.server:disconnect', 'GET', null, 'application/json');
		} else {
			if ( _util.isTrace() ) _util.trace('No shutdown request sent to server since no session exists.');
			try {
				return Promise.resolve(shutdownAgent());
			} catch(e) {
				Promise.reject({'error': e, 'reason':'Unexpected error shutting down http agent'});
			}
		}
		
	} 
}; //close off class definition



var shutdownAgent = function() {
	if ( _util.isTrace() ) _util.trace(`shutdownAgent() cleanup to close agent: ${agentName}`);	
	let ssnid = this.ssnid;			

	try {
		// node.js container won't shutdown if our sockets remain open...	
		httpAgent.destroy();	
	} catch (e) {
		_util.isTrace('httpAgent.destroy() error: ${e}');
	} finally {

		agentName = null;
		sessCookie = null;
		ssnid = null;
		reqOptions = null;	
		httpAgent = null;
		theHttp = null;
		_util.isTrace('shutdown complete');
	}
	return ssnid;
	

	

};
// return a map of cookie values
var parsedCookie = function(cookie) {
	var cookies = {};
	if ( _util.isTrace() )  _util.trace(`cookie: ${cookie}`);
	if ( cookie != null ) {		
		cookie.toString().split(';').forEach(function(crumb) {
			var parts = crumb.match(/(.*?)=(.*)$/);			
			if ( parts != null && Array.isArray(parts)) {
				cookies[ parts[1].trim() ] = (parts[2] || '').trim();
			}
		});
	}
	return cookies;
};

// helper function to ensure we do not overrun the server's capacity to consume our request.
var sendData = function(inStream, outStream) {
	
	if ( !util.isNullOrUndefined(inStream)) {
		inStream.on('readable', function () {
			var chunk;
			if ( _util.isTrace() ) _util.trace('### stream() sending request chunks');		
			while (null !== (chunk = inStream.read())) {
				// this is a Buffer - not a string, so there is no encoding type...
				// (Use executeService to send strings)
				var ok = outStream.write( chunk);
				if ( !ok ) {
					// one-time event listener
					// (buffer full.... let the IS server catch its breath.)
					if ( _util.isTrace() ) _util.trace('### Drain event fired from stream()');
					outStream.once('drain', sendData);
				} 
			}
		});

		inStream.on('end', function () {
			if ( _util.isTrace() ) _util.trace('### stream() completed sending request');
			outStream.end();
		});			
	}
};

module.exports = Client;

