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

const util = require('util');
const os = require('os');
const path = require('path');
const fs = require('fs');
const LOG_FILE = 'log.json';
const LOG_DIR = path.resolve(os.homedir(),'.wm-is-client');

const bunyan = require('bunyan');
const locale = require('os-locale');
const i18n = require('i18n');

const config = require('../config');

const infoLog = (msg => {
  console.log(msg);
});
var traceEnabled = null;

//e.g. export DEBUG_LOG=wm-is-client,http node lib/index.js  ( to enable node js's trace logging )
const traceLog = util.debuglog('wm-is-client');
// need a boolean check to avoid serializing alot of data...
const isTrace = function() {
  if ( traceEnabled == null) {
    let retBool = false;
    let envVar = process.env.NODE_DEBUG;
    if ( !util.isNullOrUndefined(envVar)) {
        let pkgs = envVar.split(',');
        retBool = pkgs.includes('wm-is-client');
    }
    traceEnabled = retBool;
  }
  return traceEnabled;
};
// initialized in 'getLogger'
var log = null;

// Initialize i18n
i18n.configure({
  locales:['en'], //supported locales (TODO, we could omit this and it will detect directory structure)
  directory: __dirname + '/locales',
  defaultLocale: 'en',
  // watch for changes in json files to reload locale on updates - defaults to false
  // !!  setting this to true prevents the process from exiting, so don't use it.  !!
  autoReload: false,
  // whether to write new locale information to disk - defaults to true
  updateFiles: true
});

/*
Initialize the logger
*/
var getLogger = function() {
  if ( util.isNullOrUndefined(log)) {

    var homeDir = path.resolve( LOG_DIR );
    if ( !fs.existsSync( homeDir )) {
      infoLog(`Creating ${homeDir}`);
      fs.mkdirSync( homeDir );
    }
    
    // file stream and an optional console logger
    let logStreams = [];
    
    
    
    let filePath = null;
    if (util.isNullOrUndefined( config.logger.fileStream )) {
      // we weren't passed a file stream in the configuration object... Let's create the default
      filePath = path.resolve( homeDir, LOG_FILE);
      // touch the file if it doesn't exist...
      if ( !fs.existsSync( filePath)) {
        fs.openSync( filePath, 'a');
      }
      // tell Bunyan to append and not overwrite
      let defaults = {
        flags: 'r+',  
        encoding: 'utf8',
        fd: null,
        mode: 0o666,
        autoClose: true
      };
      config.logger.fileStream = fs.createWriteStream(filePath, defaults);
    
    }
    
    logStreams.push( { 'level': config.logger.level, 'stream': config.logger.fileStream } );
    
    if ( !util.isNullOrUndefined( config.logger.console )) {
      logStreams.push( { 'level': config.logger.level, 'stream': config.logger.console } );
    }
    
    
    traceLog('Creating Bunyan logger');
    log = bunyan.createLogger({
      name: 'wm-is-client',
      streams: logStreams
    });
    
    log.debug(`Logger initialized at ${Date.now()}`);
        
    locale().then(locale => {
      log.debug( i18n.__mf("I0001 {locale}", { locale : locale }) );
    });
    
    log.debug( {'nodeVersions':process.versions});
  }
  return log;
 
};
module.exports = {
  'isTrace' : isTrace,
  'trace' : traceLog,
   // bunyan logger
  'logger' : getLogger
};

