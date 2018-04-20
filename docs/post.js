var app = require('wm-is-client');
var stream = require('stream');
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

function postMe() {
    let sRequest = "{\"rowCount\": 4, \"chunkCount\": 2}";
    let reqStream = new stream.PassThrough();
    reqStream.write(sRequest);
    reqStream.end();
    var listener = app.stream( 'pub:DataPump', 'POST', reqStream);

    listener.on(app.CHUNK, (data) => {
    
        let statusCode = data[app.STATUS_CODE];           
        let myBuffer = data[app.RESPONSE];
        if ( myBuffer != null) {
                sResponse = decoder.write( myBuffer);
        }
    
        console.log(`Chunk of response received: ${sResponse}`);
    });

    listener.on(app.END, (data) => {             
        
        let statusCode = data[app.STATUS_CODE];                   
        console.log(`Response completed. (${statusCode})`);
    });

    listener.on(app.ERROR, (data) => {

        console.log('Error received');
        let e = data[app.ERROR];
        let reason = data[app.REASON];
    });
}

app.connect(app.config).then( () => {
    try {
        postMe();
    } finally { 
        app.disconnect();
    }

}).catch( (err) => {
    console.log(err);
});
