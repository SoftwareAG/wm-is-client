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

var config = require('./config');

console.log(`List packages from IS server at ${config.http.hostname}:${config.http.port}`);


var Package = require('./internal/package.js');
try {
    var pkg = new Package();

    pkg.list(config).then( (statusCode, pkgList, headers) => {
        var pretty = JSON.stringify(pkgList, null, 4);
        console.log(`$statusCode} ${headers}`);
        console.log(pretty);
    }).catch(function(err) {
        console.log(`err=${err}`);
    });
    

} catch (e) {
    console.log('Package list test failed');
    console.log(e.stack);
}
