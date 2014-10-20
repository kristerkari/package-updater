// package-updater
// Krister Kari (c) 2014
// Tomas Junnonen (c) 2013
//
// Checks a package.json file for updated NPM packages that are *not*
// satisfied by the current package.json dependency declarations.
//
// Example output:
//    Dependency 'express' could be updated to '3.3.x' (latest is 3.3.8)
//
// Optionally automatically upgrades the dependencies in package.json
// while maintaining your existing versioning policy.
//
// Example:
//    Your package.json: 'express': '3.2.x.'
//    Latest version upstream is 3.3.8
//    package.json after upgrade: 'express': '3.3.x'
//

var program = require('commander');
var packageUpdater = require('./package-updater.js');

program
    .version(require('../package').version)
    .usage('[options] <package.json or dir>')
    .option('-g, --global', 'check global packages instead of in the current project')
    .option('-s, --silent', 'don\'t output anything')
    .option('-u, --upgrade', 'upgrade package.json dependencies to match latest versions (maintaining existing policy)')
    .parse(process.argv);

if ( program.global && program.upgrade ) {
    print('package-updater cannot update global packages.');
    print('Run \'npm install -g [package]\' to upgrade a global package.');
    process.exit(1);
}

packageUpdater.init(program);
