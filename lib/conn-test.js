var app = require('./index.js');


infoLog('Connection test to IS server');



var jRequest;
var service = 'wm.server.packages:packageList';

// set/override connection details here if desired
var config = app.config;

app.connect(config).then( (ssnid) => {
    infoLog(`Success! ssnid: ${ssnid}` );

    app.execute( service , 'GET', jRequest, {'Accept':'application/json'}).then(function(data) {
        var jResponse = JSON.parse( data[app.RESPONSE] );
        infoLog(`IS Server contains ${jResponse.packages.length} packages`);
        infoLog(`StatusCode: ${data[app.STATUS_CODE]}, headers? ${JSON.stringify(data[app.RESPONSE_HEADERS],null,4)}`);


    }).catch(function(err) {
        infoLog(`Execute err=${err}`);
    });
}).then( ()=> {

    infoLog('Calling disconnect');
    app.disconnect().then( function() {
        infoLog('Logoff successful');

    }).catch( function(err) {
        infoLog( 'logoff err: '+err );
    });


}).catch(function(err){
    infoLog(`Connect err=${err}`);
});



function infoLog(msg) {
    console.log(msg);
}