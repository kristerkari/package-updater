var fs = require('fs');
var path = require('path');

var RE_IS_VERSION = /^(>|<|>=|<=|=|\^|~)?(\d+\.)?(\d+\.)?(\*|\d+|x).*$/;
var RE_ESCAPE_REGEX = /[-\/\\^$*+?.()|[\]{}]/g;

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex/6969486#6969486
//
// Referring to the table here:
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
// these characters should be escaped
// \ ^ $ * + ? . ( ) | { } [ ]
// These characters only have special meaning inside of brackets
// they do not need to be escaped, but they MAY be escaped
// without any adverse effects (to the best of my knowledge and casual testing)
// : ! , =
// my test "~!@#$%^&*(){}[]`/=?+\|-_;:'\",<.>".match(/[\#]/g)
function escapeRegexp(str) {
    return str.replace(RE_ESCAPE_REGEX, '\\$&');
}

function arrayToObject(a) {
    var o = {};
    for ( var i in a ) {
        if ( a.hasOwnProperty(i) ) {
            for ( var key in a[i] ) {
                if ( a[i].hasOwnProperty(key) ) {
                    o[key] = a[i][key];
                }
            }
        }
    }
    return o;
}

function startsWith(string, prefix) {
    return string.indexOf(prefix) === 0;
}

function mergeObjects(o1, o2) {
    var newObject = {};

    for ( var property in o1 ) {
        if ( o1.hasOwnProperty(property) ) {
            newObject[property] = o1[property];
        }
    }
    for ( property in o2 ) {
        if ( o2.hasOwnProperty(property) ) {
            newObject[property] = o2[property];
        }
    }

    return newObject;
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

function readPackageFile(fileName, callback) {
    fs.readFile(fileName, {
        encoding: 'utf8'
    }, callback);
}

function writePackageFile(fileName, data, callback) {
    fs.writeFile(fileName, data, callback);
}

function isAVersion(str) {
    return RE_IS_VERSION.test(str.trim());
}

// Convenience function to match a "wild" version digit
function isWildDigit(digit) {
    return digit === 'x' || digit === '*';
}

module.exports.escapeRegexp = escapeRegexp;
module.exports.arrayToObject = arrayToObject;
module.exports.startsWith = startsWith;
module.exports.mergeObjects = mergeObjects;
module.exports.isEmptyObject = isEmptyObject;
module.exports.readPackageFile = readPackageFile;
module.exports.writePackageFile = writePackageFile;
module.exports.isAVersion = isAVersion;
module.exports.isWildDigit = isWildDigit;
