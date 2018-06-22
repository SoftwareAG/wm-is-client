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

const _util = require('./util.js');
var Client = require('./client.js');

var client = new Client();

class Package {
    constructor() {
    }



    // returns a Promise
    list(config) {

        //_util.trace('pkgList: '+JSON.stringify(config, null, 4));
        var list;
        client.connect(config).then((ssnid) => {
            console.log('ssnid? '+ ssnid);

            _util.info(`Success! ssnid: ${ssnid}` );
            list =  new Promise( (resolve, reject) => {         
                try {
                    // use an ES6 promise to chain to a function when connect completes, so I can verify
                    // the exported ssnid.
                    // success... let's try to invoke a service
                    var jRequest = null;
                    var service = 'wm.server.packages:packageList';
                    //var service = 'aptest.sleepy:SleepService';
                    _util.trace("### Executing");
                    client.serviceExecute( service , 'GET', jRequest).then( (statusCode, response, headers) => {
                        resolve(statusCode, response, headers);
                        
                    }).catch(function(err) {
                        console.log(err.stack);
                        _util.err(`err=${err}`);
                        reject( err );
                    });
        
        
        
                } catch (e) {
                    console.log('Package.list failed');
                    console.log(e.stack);
                    reject( e );
                }            
            }); // close off Promise
        });
        list.then( () => {
            client.disconnect();
            
        });
            
    }; //list
}; //Package class

module.exports = Package;
