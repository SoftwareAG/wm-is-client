#!/usr/bin/env node
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

// A client tool for invoking the wm-is-client package.


var util = require('util');
const fs = require('fs');
const process = require('process');
const stream = require('stream');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;
var program = require('commander');

const pkgJsonPath = fs.readFileSync(path.resolve( __dirname, '../package.json'));
const pkgJson = JSON.parse( pkgJsonPath );
var app = require(path.resolve(__dirname,'../lib/index.js'));
var decoder = new StringDecoder('utf8');
var outStream;

// override the default configuration
var config = app.config;
var theService = 'wm.server:ping';

process.on('uncaughtException', (err) => {      
    console.error(`UncaughtException: ${err.message}`);
    if ( program.debug) {
        console.error(err.stack);
    }

});
process.on('unhandledRejection', (err) => {  
    console.error(`UnhandledRejection: ${err.message}`);
    if ( program.debug) {
        console.error(err.stack);
    }
});


program
  .version(pkgJson.version, '-v, --version')
  .description('node lib/cli-test.js [get] | [list] | [post]')
  .option('-c, --console', 'Send log messages to stdout')
  .option('-s, --serverport <serverport>', 'hostname:port')
  .option('-d, --debug', 'Debugging trace messages')
  .option('-u, --user <user>', 'e.g. Administrator')
  .option('-r, --request-file <requestFile>', 'Path to requestFile')
  .option('-o, --output-file <responseFile>', 'Path to responseFile')
  .option('-p, --password <password>', 'e.g. manage')  
  .option('-x, --x-stream', 'eXecute using serviceStream')
  .option('-t, --tls', 'Use TLS encryption')
  .option('-n, --notrust', 'server trust verification disabled');

  
program
  .command('get')
  .arguments('<service>')
  .description("send a GET request the IS server e.g. 'get wm.server.ping'")
  .action( (service) => get(service) );

program
  .command('list')
  .arguments('[pkg_or_service]')
  .description("list packages (e.g. 'list' ), services in a package  (e.g. 'list WmRoot'), or service details (e.g. 'list wm.server:ping')")
  .action( (IS_package) => list(IS_package) );

program
  .command('post')
  .arguments('<service> [request]')
  .description('send a POST request to the IS server')
  .action((service, request) => post( service, request) );

program.parse(process.argv);

if (process.argv.length <= 2) program.help();

function list( pkg_or_service ) {
    
    if ( util.isNullOrUndefined( pkg_or_service )) {
        theService = 'wm.server.packages:packageList';
    } else {
        if ( pkg_or_service.indexOf(':') > 0) {
            theService = 'wm.server.services:serviceInfo?service='+pkg_or_service;
        } else {
            theService = 'wm.server.packages:packageInfo?package='+pkg_or_service;
        }
    }

    get(theService);
}
function get( service ) {

    
    initMe();

    app.connect(config).then((ssnid) => {

        debugLog(`### Connection success! ssnid: ${ssnid}` );
        var jRequest = null;        
                            
        if ( program.xStream ) { //stream
            debugLog('### Invoking app.stream()');

            var listener = app.stream( service , 'GET', jRequest);
            listener.on('chunk', (data) => {
                debugLog(`### Received chunk event: (${data[app.STATUS_CODE]})`);                                                
                out( data[app.RESPONSE]);
            });
            listener.on('end', (data) => {
                debugLog(`### Received end event: (${data[app.STATUS_CODE]})`);                
                var chunk = data[app.RESPONSE];
                if ( !util.isNullOrUndefined(chunk)) {
                    out( chunk);
                }
                closeStream(outStream);
                debugLog(`(${data[app.STATUS_CODE]}) Response headers: ${JSON.stringify(data[app.RESPONSE_HEADERS])}`);            
            });

        } else { // not stream

            debugLog('### Invoking app.execute()');
            app.execute( service , 'GET', jRequest, {'Accept':'application/json'} ).then(function(data) { 
                var response;
                var sResponse;
                response = data[app.RESPONSE];
                if ( data[app.STATUS_CODE] < 299 ) {               
                    try {
                        sResponse = JSON.stringify( JSON.parse( response ), null, 4);
                    } catch (e) {
                        debugLog(`Couldn't parse string as JSON object, so returning as string`);
                        sResponse = response;
                    }            
                } 
                if ( sResponse == null ) {
                    sResponse = `statusCode: (${data[app.STATUS_CODE]}) No response body`;
                }      
                out( sResponse);                     
                debugLog(`(${data[app.STATUS_CODE]}) Response headers: ${JSON.stringify(data[app.RESPONSE_HEADERS])}`);                            
                
            }).catch(function(err) {                  
                errorLog('My error' + err.stack);
                errorLog(`${err[app.REASON]}, ${err[app.ERROR]}`);
            });
        }
    
    }).then( app.disconnect)
    .catch(function(data) {

        if ( data && data[app.REASON]) {
            errorLog(`[Connect failed] ${data[app.REASON]}`);
        }
        if ( program.debug && data[app.ERROR]) {
            errorLog(data[app.ERROR].stack);
        }

        app.disconnect();
    });   

}

function post(  service, request ) {

    try {
        initMe();

        app.connect(config).then((ssnid) => {
            debugLog(`### Connection success! ssnid: ${ssnid}` );
            try {

                if ( program.xStream ) { //stream
                    debugLog('### Invoking app.stream()');
        
                    var reqStream;

                    if ( !util.isNullOrUndefined(program.requestFile) ) {
                        reqStream = fs.createReadStream(program.requestFile);
                                
                    } else if ( util.isNullOrUndefined(request)) {
                        reqStream = process.stdin;
                    } else {
                        reqStream = new stream.Readable();
                        reqStream.push(request);
                        reqStream.push(null);  
                    }

                    var listener = app.stream( service, 'POST', reqStream);
                    listener.on(app.CHUNK, (data) => {
                        if ( program.debug) {
                            let len = 0;
                            let r = data[app.RESPONSE];
                            if ( !util.isNullOrUndefined( r )) {
                                len = r.length;
                            }
                            errorLog(`### Received chunk event: (${data[app.STATUS_CODE]}) data length: ${len}`);                    
                        }
                        out( data[app.RESPONSE]);
                    });
                    listener.on(app.ERROR, (data) => {
                        if ( program.debug) {
                            let e = data[app.ERROR];
                            if ( !util.isNullOrUndefined( e )) {
                                errorLog(`### Received ERROR event. ${data[app.REASON]}\n${e.message}`);                    
                                
                            } else {
                                errorLog(`### Received ERROR event: ${data[app.REASON]}`);                    
                            }
                        }
                    });

                    listener.on(app.END, (data) => {                
                        if ( program.debug) {
                            let len = 0;
                            let r = data[app.RESPONSE];
                            if ( !util.isNullOrUndefined( r )) {
                                len = r.length;
                            }
                            errorLog(`### Received LAST chunk: (${data[app.STATUS_CODE]}) data length: ${len}`);                    
                        }                    

                        var response = JSON.parse( data[app.RESPONSE] );
                        if ( !util.isNullOrUndefined(response)) {
                            out( response);
                        }                    
                        debugLog(`(${data[app.STATUS_CODE]}) Response headers: ${JSON.stringify(data[app.RESPONSE_HEADERS])}`);            

                    });
                } else { // not streaming mode
                    debugLog('### Invoking app.execute()');
                    

                    if ( !util.isNullOrUndefined(program.requestFile) ) {
                        request = fs.readFileSync(program.requestFile);                        
                                
                    } else if ( util.isNullOrUndefined(request)) {
                        request = process.stdin.read();
                    }
                    let sResponse = null;
                    // verify we can parse this request as valid JSON before sending to the server
                    try {
                        JSON.stringify(JSON.parse(request));
                    } catch (e) {
                        errorLog(`Can't parse request into valid JSON structure. ${e.message}`);
                        return;
                    }
                    app.execute( service , 'POST', request, {'Accept':'application/json'} ).then(function(data) {      
                        let response = data[app.RESPONSE];

                        try {
                            sResponse = JSON.stringify( JSON.parse( response ), null, 4);
                        } catch (e) {
                            debugLog(`Couldn't parse string as JSON object, so returning as string`);
                            sResponse = response;
                        }            
                        
                        if ( sResponse == null ) {
                            sResponse = `No response body`;
                        }      
                        out( sResponse);                     
                        debugLog(`(${data[app.STATUS_CODE]}) Response headers: ${JSON.stringify(data[app.RESPONSE_HEADERS])}`);                            
                    }).catch(function(data) {
                        out( data[app.RESPONSE]);
                    
                    });
                }
            

            } catch (e) {
                errorLog(`Service invocation failed: ${e.message}`);
                debugLog(e.stack);
            }
        }).then(app.disconnect)
        .catch(function(data) {

            if ( data && data[app.REASON]) {
                errorLog(`[Connect failed] ${data[app.REASON]}`);
            }
            if ( program.debug && data[app.ERROR]) {
                errorLog(data[app.ERROR].stack);
            }
            app.disconnect();
        });
    } finally {
        closeStream(outStream);
    }
}        
function initMe() {

    if ( program.console) {
        config.logger.console = process.stdout;
    }


    if ( program.debug ) {
        config.logger.level = 'debug';
    } else {
        config.logger.level = 'info';
    }
    infoLog(`Setting log level to ${config.logger.level}`);        

    if ( !util.isNullOrUndefined(program.outputFile) ) {
        outStream = fs.createWriteStream(program.outputFile);
    }
    if ( util.isNullOrUndefined(outStream)) {
        debugLog('Writing response to stdout');            
        outStream = process.stdout;
    } else {            
        debugLog(`Writing response to ${program.outputFile}`);            
    }

    // https://nodejs.org/api/tls.html#tls_tls_connect_options_callback
    let trustStorePath = null;
    let keyPath = null;
    let passphrase = null;
    let caPath = null;
    
    // IS default...
    trustStorePath = path.resolve(__dirname,'../test/fixtures/pem/ssos-trust.pem');
    keyPath = path.resolve(__dirname,'../test/fixtures/pem/ssos-key.pem');
    passphrase = 'manage';
    caPath = path.resolve(__dirname,'../test/fixtures/pem/ssos-ca.pem');

    config.tls.trust = trustStorePath;
    config.tls.ca = caPath;
    config.tls.key = keyPath;
    config.tls.passphrase = passphrase;

    // uncommenting this will cause this node container to trust all servers regardless...
    // same as exporting env var: process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    // config.http.agent.rejectUnauthorized = false;
    
    if ( program.notrust) {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    }

    if ( program.debug ) {
        infoLog(`Trusted server verification disabled? ${program.notrust}`);
        infoLog(`Override checking server certificate? ${!util.isNullOrUndefined(config.http.agent.checkServerIdentity)}`);
        infoLog(`Using key path: ${keyPath}`);
        infoLog(`Using key passphrase: ${passphrase}`);
        infoLog(`Using certificate authority: ${caPath}`);
        infoLog(`Using trust store: ${trustStorePath}`);
    }

    if ( !util.isNullOrUndefined(program.serverport)) {
        let ar = program.serverport.split(':');
        if ( ar.length == 2 ) {                    
            config.http.hostname = ar[0];
            config.http.port = ar[1];
        }
    }

    if ( !util.isNullOrUndefined(program.user) ) {
        config.auth.basic.user = program.user;
    }
    if ( !util.isNullOrUndefined(program.password) ) {
        config.auth.basic.pass = program.password;
    }
    if ( program.tls) {
        config.http.protocol = 'https:';
    }

}

function closeStream( stream) {
    if ( util.isNullOrUndefined( stream)) {
        try {
            console.error('Closing stream');
            stream.end();
        } catch(e) {
            console.error(e);
            debugLog(`Exception closing stream. ${e.message}  \n ${e.stack}`);
        }
    }
}
/**
 * dump content to the output stream
 * @param {buffer} or {string} data 
 */
function out( data) {
    if ( util.isNullOrUndefined(outStream)) {
        errorLog("Error outputStream for response is undefined.");
        return;
    }
    if ( util.isNullOrUndefined(data)) {
        debugLog('Call to out() with a null data object');
    } else if ( Buffer.isBuffer(data)) {
        outStream.write( decoder.write(data));
    } else {
        outStream.write( data);
    }
}
function infoLog(msg) {
    app.logInfo(msg);
}
function errorLog(msg) {
    console.error(msg);
}
function debugLog(msg) {
    if ( program.debug ) {
        app.logInfo(msg);
    }
}
