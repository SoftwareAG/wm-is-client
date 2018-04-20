// all configuration options for this client module are defined in this file
// anything in here can be over-ridden by the client packages that use this module.

var config = {

  // NOTE: additional trace information is written to the console.log( ) if NODE_DEBUG is appropriately set.
  // e.g. NODE_DEBUG=wm-is-client,http  // dumps trace info for this module as well as Node's http module.
  'logger' : {    
      'level' : 'info',  // info, debug
      // skipped if 'null'.  Or set to process.stdout or process.stderr
      // This must be a stream object
      'console' : null,
      // if null, the default is to ~/.wm-is-client/log.json when logger is created
      // This must be a stream object
      'path' : null 
  },
  'timeout' : {
      'connect' : 30000,
      'read' : 30000
  },
  'auth' : {
    // only basic is supported at this time
    'basic' : {
      'username' : 'Administrator',
      // We do not dump the value for any key named password in the trace logger (See client.connect() function)
      'password' : 'manage'
    }
  },
  'tls' : {
    'ca' : null,
    'trust' : null,
    'key' : null,
    'passphrase' : null
  },
  // options for our http connection
  'http' : {  
    // default options
    encoding: 'utf8',
    'agent' : { 
      keepAlive: true,       	
      keepAliveMsecs: 1000,  //milliseconds (only if keepAlive: true)
      //maxSockets: Infinity,
      maxSockets: 256,
      maxFreeSockets: 256,
      // if false, the server cert is trusted regardless (dangerous)
      // rejectUnauthorized: false      
    },

    protocol : 'http:', // or https:

    hostname: 'localhost',
    // default request headers
    headers: {
            'Accept': 'application/json',
    },
    port : 5555,
  }          
};

module.exports = config;
