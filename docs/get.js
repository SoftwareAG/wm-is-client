var app = require('wm-is-client');

function getMe(ssnid) {
    console.log(`Session connected: (${ssnid})... Executing ping`);
    var promise = app.execute( 'wm.server:ping', 'GET');
    return promise;

}
function dumpResponse(data) {
    console.log( `Response: ${data[app.RESPONSE]}`);
}

app.connect(app.config)
    .then( (ssnid) => getMe(ssnid))    
    .then( (data) => dumpResponse(data))
    .then( () => app.disconnect())
    .then( () => {
        console.log('Session disconnected...');
    }).catch( (err) => {
        console.log(err);
    });
