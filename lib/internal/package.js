
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
