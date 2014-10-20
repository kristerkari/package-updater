var async = require('async');
var fs = require('fs');
var path = require('path');
var utils = require('./utils.js');
var versionManager = require('./version-manager.js');
var npmManager = require('./npm-manager.js');
var prog = null;

function print(message) {
    if ( !prog.silent ) {
        console.log(message);
    }
}

function upgradePackageFile(packageFile, currentDependencies, upgradedDependencies, callback) {
    utils.readPackageFile(packageFile, function(error, packageData) {
        if (error) {
            return callback(error);
        }

        var newPackageData = versionManager.updatePackageData(packageData, currentDependencies, upgradedDependencies);

        utils.writePackageFile(packageFile, newPackageData, function(error) {
            if ( error ) {
                return callback(error);
            }
            callback(null);
        });
    });
}

function upgradePackageDefinitions(currentDependencies, callback) {
    var dependencyList = Object.keys(currentDependencies);

    versionManager.getLatestVersions(dependencyList, function(error, latestVersions) {
        if (error) {
            return callback(error);
        }

        var upgradedDependencies = versionManager.upgradeDependencies(currentDependencies, latestVersions);

        callback(error, upgradedDependencies, latestVersions);
    });
}

function printDependencyUpgrades(currentDependencies, upgradedDependencies, installedVersions, latestVersions) {
    if ( utils.isEmptyObject(upgradedDependencies) ) {
        print('All dependencies match the latest package versions :)');
    } else {
        for ( var dependency in upgradedDependencies ) {
            print('\'' + dependency + '\' can be updated from ' +
                currentDependencies[dependency] + ' to ' + upgradedDependencies[dependency] +
                ' (Installed: ' + (installedVersions[dependency] ? installedVersions[dependency] : 'none') + ', Latest: ' + latestVersions[dependency] + ')');
        }
    }
}

function analyzeGlobalPackages() {
    print('Analyzing global dependencies...');
    npmManager.getInstalledPackages(function(error, globalPackages) {
        if (error) {
            return console.error('There was an error reading the global packages: ');
        }

        upgradePackageDefinitions(globalPackages, function(error, upgradedPackages, latestVersions) {
            if (error) {
                return console.error('There was an error determining the latest package versions: ' + error);
            }

            print('');
            if ( utils.isEmptyObject(upgradedPackages) ) {
                print('All global packages are up to date :)');
            } else {
                for ( var pkg in upgradedPackages ) {
                    print('\'' + pkg + '\' can be updated from ' +
                        globalPackages[pkg] + ' to ' + upgradedPackages[pkg]);
                }
            }
        });
    });
}

function analyzeProjectDependencies(packageFile) {
    print('Analyzing project dependencies...');
    async.series({
        current: function(callback) {
            versionManager.getCurrentDependencies(packageFile, callback);
        },
        installed: function(callback) {
            npmManager.getInstalledPackages(callback);
        }
    }, function(error, results) {
        if ( error ) {
            return console.error('There was an error analyzing the dependencies: ' + error);
        }

        if ( results && results.current ) {
            results.current = versionManager.removePackagesWithoutValidVersions(results.current);
        }

        upgradePackageDefinitions(results.current, function(error, upgradedDependencies, latestVersions) {
            if ( error ) {
                return console.error('There was an error determining the latest package versions: ' + error);
            }

            print('');
            printDependencyUpgrades(results.current, upgradedDependencies, results.installed, latestVersions);

            if ( !utils.isEmptyObject(upgradedDependencies) ) {
                if ( prog.upgrade ) {
                    upgradePackageFile(packageFile, results.current, upgradedDependencies, function(error) {
                        if ( error ) {
                            return console.error('There was an error writing the package.json file: ' + error);
                        }

                        print('\n' + packageFile + ' upgraded');
                    });
                } else {
                    print('\nRun \'package-updater -u\' to upgrade your package.json automatically');
                }
            }
        });
    });
}

function init(program) {
    prog = program;

    npmManager.init(program.global, function() {
        if (program.global) {
            analyzeGlobalPackages();
        } else {
            var packageFile = 'package.json';

            // Check if a file or directory was specified on the command line
            if ( program.args[0] && fs.existsSync(program.args[0]) ) {
                if ( path.basename(program.args[0]) === packageFile ) {
                    packageFile = program.args[0];
                } else if ( fs.statSync(program.args[0]).isDirectory() ) {
                    packageFile = path.join(program.args[0], packageFile);
                }
            } else if ( program.args[0] ) {
                print(program.args[0] + ' is not a valid file or directory');
                process.exit(1);
            }

            if ( !fs.existsSync(packageFile) ) {
                print('package.json not found');
                process.exit(1);
            }

            analyzeProjectDependencies(packageFile);
        }
    });
}

module.exports.init = init;
