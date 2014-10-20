var npm = require('npm');
var utils = require('./utils.js');

var npmIsInitialized = false;

/**
 * Get currently installed packages.
 * @param {Function} callback
 */
function getInstalledPackages(callback) {
    npm.commands.list([], true, function(error, results) {

        if ( error ) {
            return callback(error);
        }

        var packageList = results.dependencies;

        if ( !packageList ) {
            return callback(new Error('Unable to retrieve NPM package list'));
        }

        var globalPackages = {};
        for ( var package in packageList ) {
            globalPackages[packageList[package].name] = packageList[package].version;
        }

        callback(error, globalPackages);
    });
}

/**
 * Query the latest version info of a package
 * @param {String} packageName The name of the package to query
 * @param {Function} callback Returns a {package: version} object
 */
function getLatestPackageVersion(packageName, callback) {
    if ( !npmIsInitialized ) {
        throw new Error('initialize must be called before using npm-manager');
    }

    npm.commands.view([packageName, 'dist-tags.latest'], true, function(error, response) {
        if ( error ) {
            return callback(error);
        }

        var versionInfo = {};
        versionInfo[packageName] = Object.keys(response)[0];
        callback(error, versionInfo);
    });
}

/**
 * Initialize npm
 * @param {Object} global
 * @param {Function} callback Called when done
 */
function init(global, callback) {
    npm.load({
        silent: true,
        global: global
    }, function() {
        npmIsInitialized = true;
        callback();
    });
}

module.exports.init = init;
module.exports.getLatestPackageVersion = getLatestPackageVersion;
module.exports.getInstalledPackages = getInstalledPackages;
