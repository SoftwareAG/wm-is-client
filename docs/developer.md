This document represents the initial development charter to consider when contributing to this package.

# Coding conventions
Using eslint for lint tool with these conventions.
See .eslintrc.json for more details.

* Semicolons Required
TC39 is leaning in this direction

* ES6
use strict ( decl not needed in a module )
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
use classes
use promises
use block scope (let decl)
use as little runtime dependencies as possible
   e.g.
   var msTimeout = (config && config.timeout && config.timeout.read) || 30000;

   instead of 3rd dependency

Use arrow syntax over function( ) to convey proper 'this' context.
e.g.

return new Promise( function( resolve, reject) {
vs.
return new Promise( (resolve, reject) => {

  });


Use named functions for better stack traces
   - e.g.  (this will include 'exec' instead of anonymous)
   let exec = (reject,resolve) => {
      ...
   };

Use method functions instead of Prototype functions
     list(config) {

     }
     Package.prototype.list = function(config) {


# Testing
Using the following
 * Node JS core Assert module
 * Mocha package for a test framework
 * sinon for mocking

# Linting Rules
The following rules are followed.
* Trailing Semicolons are not enforced
* All non-global variables should be declared (exceptions are in ./.eslintrc.json)


# Logging
Bunyan package for logging, but the important point is that we create JSON objects for our
log messages and realize streams will be aggregated elsewhere. e.g. ELK stack

# Tools
1. Editor
   * Visual Studio Code
   * Atom
2. Node Dev Packages
   * ES Lint
   * JS Doc
   * Chai
   * Mocha 


# Run Scripts
We are using npm for build tools and not grunt or gulp. i.e. npm run (script)

[//]: # (Adding css rules for markdown seems a bit much...)

<table border="1">
    <tr>
    <th>script</th>
    <th>description</th>
    </tr>
    <td>build</td>
    <td>Lint, generate doc and test code</td>
    </tr>
    <tr>
    <td>ci-build</td>
    <td>Run build and test-jenkins scripts</td>
    </tr>
    <tr>
    <td>unit-test</td>
    <td>Run mocha unit tests</td>
    </tr>
    <tr>
    <td>lint</td>
    <td>ESLint Validation using ./~eslintrc. See <a href="http://eslint.org/docs/rules/">rules</a></td>
    </tr>
    <tr>
    <td>test</td>
    <td>Run all component tests</td>
    </tr>
    <tr>
    <td>jsdoc</td>
    <td>Produce API JS documentation</td>
    </tr>
    <tr>
    <td>test-jenkins</td>
    <td>Produce XML test report for Jenkins</td>
    </tr>
    <tr>
    <td>conntest</td>
    <td>Connect to a running Integration Server</td>
    </tr>
</table>