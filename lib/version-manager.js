var readJson = require('read-package-json');
var async = require('async');
var semver = require('semver');
var utils = require('./utils.js');
var npmManager = require('./npm-manager.js');

/**
 * Remove packages that don't have a version.
 * @param {Object} currentDependencies
 * @return {Object} new dependencies
 */
function removePackagesWithoutValidVersions(currentDependencies) {
    var newDependencies = {};
    for ( var value in currentDependencies ) {
        if ( utils.isAVersion(currentDependencies[value]) ) {
            newDependencies[value] = currentDependencies[value];
        }
    }
    return newDependencies;
}

/**
 * Compare two version digits (e.g. the x from x.y.z)
 * @param {String} digit1 First component
 * @param {String} digit2 Second component
 * @returns {Number} 1 if d1 is greater, 0 if equal (or either is a wildcard), -1 if lesser
 */
function compareVersionDigits(digit1, digit2) {
    if ( parseInt(digit1, 10) > parseInt(digit2, 10) ) {
        return 1;
    } else if ( digit1 === digit2 || utils.isWildDigit(digit1) || utils.isWildDigit(digit2) ) {
        return 0;
    } else {
        return -1;
    }
}

/**
 * @param  {Object} declaration
 * @return {String} constraints
 */
function getVersionConstraints(declaration) {
    var constraints = '';

    for ( var i in declaration ) {
        if ( isNaN(declaration[i]) ) {
            constraints += declaration[i];
        } else {
            break;
        }
    }

    return constraints;
}

/**
 * Upgrade an existing dependency declaration to satisfy the latest version
 * @param {String} declaration Current version declaration (e.g. "1.2.x")
 * @param {String} latestVersion Latest version (e.g "1.3.2")
 * @returns {String} The upgraded dependency declaration (e.g. "1.3.x")
 */
function upgradeDependencyDeclaration(declaration, latestVersion) {
    var newDeclaration = '';
    var versionBumped = false;

    // Maintain constraints
    newDeclaration += getVersionConstraints(declaration);
    declaration = declaration.substr(newDeclaration.length, declaration.length);

    var currentComponents = declaration.split('.');
    var latestComponents = latestVersion.split('.');
    var proposedComponents = [];

    for ( var i in currentComponents ) {
        var currentDigit = currentComponents[i];
        var newDigit = latestComponents[i];

        if ( utils.isWildDigit(currentDigit) ) { // Maintain existing policy
            proposedComponents.push(currentDigit);
            continue;
        }

        var comparison = compareVersionDigits(currentDigit, newDigit);

        if ( comparison < 0 ) { // Bump digit to match latest version
            proposedComponents.push(newDigit);
            versionBumped = true;
        } else if ( comparison > 0 && !versionBumped ) {
            // Unusual, but the version dependend on is larger than the currently latest version
            proposedComponents.push(newDigit);
        } else {
            if ( versionBumped ) { // A bump causes subsequent non-wild version digits to revert to the latest version's
                proposedComponents.push(newDigit);
            } else { // Maintain existing declaration digit, as greater than or equal to new version
                proposedComponents.push(currentDigit);
            }
        }
    }

    newDeclaration += proposedComponents.join('.');
    return newDeclaration;
}

/**
 * Upgrade a dependencies collection based on latest available versions
 * @param {Object} currentDependencies current dependencies collection object
 * @param {Object} latestVersions latest available versions collection object
 * @returns {Object} upgraded dependency collection object
 */
function upgradeDependencies(currentDependencies, latestVersions) {
    var upgradedDependencies = {};

    for ( var dependency in currentDependencies ) {
        var latestVersion = latestVersions[dependency];
        var currentVersion = currentDependencies[dependency];

        // Unconstrain the dependency, to allow upgrades of the form: '>1.2.x' -> '>2.0.x'
        var unconstrainedCurrentVersion = currentVersion.substr(getVersionConstraints(currentVersion).length, currentVersion.length);
        var isLatestVersion = semver.satisfies(latestVersion, unconstrainedCurrentVersion);

        if ( !isLatestVersion ) {
            var upgradedDependencyString = upgradeDependencyDeclaration(currentVersion, latestVersion);
            upgradedDependencies[dependency] = upgradedDependencyString;
        }
    }

    return upgradedDependencies;
}

/**
 * Upgrade the dependency declarations in the package data
 * @param {String} data The package.json data, as utf8 text
 * @param {Object} oldDependencies Object of old dependencies {package: version}
 * @param {Object} newDependencies Object of old dependencies {package: version}
 * @returns {String} The updated package data, as utf8 text
 */
function updatePackageData(data, oldDependencies, newDependencies) {

    for ( var dependency in newDependencies ) {
        var expression = '"' + dependency + '".*:.*"' + utils.escapeRegexp(oldDependencies[dependency] + '"');
        var regExp = new RegExp(expression, 'g');
        data = data.replace(regExp, '"' + dependency + '": ' + '"' + newDependencies[dependency] + '"');
    }

    return data;
}

/**
 * Get the current dependencies from the package file
 * @param {String} packageFile path to package.json
 * @param {Function} callback Called with (error, {dependencyName: version} collection)
 */
function getCurrentDependencies(packageFile, callback) {
    readJson(packageFile, null, false, function(error, json) {
        var allDependencies = json ? utils.mergeObjects(json.dependencies, json.devDependencies) : null;
        callback(error, allDependencies);
    });
}

/**
 * Get the latest versions from the NPM repository
 * @param {Array} packageList A list of package names to query
 * @param {Function} callback Called with (error, {packageName: version} collection)
 */
function getLatestVersions(packageList, callback) {
    async.map(packageList, npmManager.getLatestPackageVersion, function(error, latestVersions) {
        if ( error ) {
            return callback(error);
        }

        // Merge the array of versions into one object, for easier lookups
        var latestDependencies = utils.arrayToObject(latestVersions);
        callback(error, latestDependencies);
    });
}

exports.upgradeDependencyDeclaration = upgradeDependencyDeclaration;
exports.removePackagesWithoutValidVersions = removePackagesWithoutValidVersions;
exports.getCurrentDependencies = getCurrentDependencies;
exports.getLatestVersions = getLatestVersions;
exports.upgradeDependencies = upgradeDependencies;
exports.updatePackageData = updatePackageData;
