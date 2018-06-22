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

var http = require('http');
 
module.exports = {
	get: function(callback) {
		var req = http.request({
			hostname: 'jsonplaceholder.typicode.com',
			path: '/posts/1'
		}, function(response) {
            console.log('get: response.statusCode=' + response.statusCode);
			var data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
 
			response.on('end', function() {
				callback(null, JSON.parse(data));
			});
		});

        req.on('error', function(err) {
		    callback(err);
	    });
 
		req.end();
	},
 
	post: function(data, callback) {
		var req = http.request({
			hostname: 'jsonplaceholder.typicode.com',
			path: '/posts',
			method: 'POST'
		}, function(response) {
            console.log( 'post: statusCode=' + response.statusCode);
			var data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
 
			response.on('end', function() {
				callback(null, JSON.parse(data));
			});
		});
 
		req.write(JSON.stringify(data));
 
		req.end();
	}
};