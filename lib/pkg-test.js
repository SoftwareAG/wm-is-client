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
