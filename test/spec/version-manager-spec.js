var expect = require('chai').expect;
var versionManager = require('../../lib/version-manager.js');
var path = require('path');

describe('Version manager', function() {

    describe('getCurrentDependencies method', function() {

        it('should be a function', function() {
            expect(typeof versionManager.getCurrentDependencies).to.equal('function');
        });

        describe('when called with a package.json', function() {
            var deps;

            beforeEach(function(done) {
                versionManager.getCurrentDependencies(path.resolve(__dirname, '../fixtures/test-package.json'), function(err, allDeps) {
                    deps = allDeps;
                    done();
                });
            });

            it('should have returned dependencies correctly', function() {
                expect(deps).to.have.property('npm');
                expect(deps).to.have.property('commander');
            });

            it('should have returned dev-dependencies correctly', function() {
                expect(deps).to.have.property('chai');
                expect(deps).to.have.property('gulp');
            });

        });

    });

    describe('upgradeDependencyDeclaration method', function() {

        it('should be a function', function() {
            expect(typeof versionManager.upgradeDependencyDeclaration).to.equal('function');
        });

        it('should be able to update a patch version 1.2.1 -> 1.2.3', function() {
            expect(versionManager.upgradeDependencyDeclaration('1.2.1', '1.2.3')).to.equal('1.2.3');
        });

        it('should not update a patch version if 1.2.X is used', function() {
            expect(versionManager.upgradeDependencyDeclaration('1.2.x', '1.2.3')).to.equal('1.2.x');
        });

        it('should be able to update minor version 1.2.1 -> 1.3.4', function() {
            expect(versionManager.upgradeDependencyDeclaration('1.2.1', '1.3.4')).to.equal('1.3.4');
        });

        it('should be able to update major version 1.2.1 -> 2.3.4', function() {
            expect(versionManager.upgradeDependencyDeclaration('1.2.1', '2.3.4')).to.equal('2.3.4');
        });

        it('should not update versiom if 1.2.* is used', function() {
            expect(versionManager.upgradeDependencyDeclaration('1.2.*', '1.2.3')).to.equal('1.2.*');
        });

        it('should not update version if it is bigger than the latest', function() {
            expect(versionManager.upgradeDependencyDeclaration('2.5.7', '2.4.6')).to.equal('2.4.6');
        });

    });

    describe('upgradeDependencies method', function() {

        it('should be a function', function() {
            expect(typeof versionManager.upgradeDependencies).to.equal('function');
        });

        it('should upgrade only updated dependencies to new ones', function() {

            expect(versionManager.upgradeDependencies(                 {
                    csso: '~1.3.7',
                    'grunt-lib-contrib': '~0.6.1',
                    'grunt-contrib-clean': '~0.4.0',
                    'grunt-contrib-nodeunit': '~0.1.2',
                    grunt: '~0.4.1'
                }, {
                    csso: '1.3.11',
                    'grunt-lib-contrib': '0.7.1',
                    'grunt-contrib-clean': '0.6.0',
                    'grunt-contrib-nodeunit': '0.4.1',
                    grunt: '0.4.1'
            })).to.deep.equal({
                csso: '~1.3.11',
                'grunt-lib-contrib': '~0.7.1',
                'grunt-contrib-clean': '~0.6.0',
                'grunt-contrib-nodeunit': '~0.4.1'
            });
        });

    });

    describe('updatePackageData method', function() {

        it('should be a function', function() {
            expect(typeof versionManager.updatePackageData).to.equal('function');
        });

        it('should not overwrite another package version that starts with the same name ("grunt-contrib-nodeunit" vs "grunt") and that has the same updated version ("grunt-contrib-nodeunit", ~0.4.1) that the update tries to target ("grunt", ~0.4.1)', function() {
            expect(versionManager.updatePackageData('{"dependencies": {"csso": "~1.3.7","grunt-lib-contrib": "~0.6.1"},"devDependencies": {"grunt-contrib-clean": "~0.4.0","grunt-contrib-nodeunit": "~0.1.2","grunt": "~0.4.1"}}',
                 {
                    csso: '~1.3.7',
                    'grunt-lib-contrib': '~0.6.1',
                    'grunt-contrib-clean': '~0.4.0',
                    'grunt-contrib-nodeunit': '~0.1.2',
                    grunt: '~0.4.1'
                },
                {
                    csso: '~1.3.11',
                    'grunt-lib-contrib': '~0.7.1',
                    'grunt-contrib-clean': '~0.6.0',
                    'grunt-contrib-nodeunit': '~0.4.1',
                    grunt: '~0.4.5'
                })).to.equal('{"dependencies": {"csso": "~1.3.11","grunt-lib-contrib": "~0.7.1"},"devDependencies": {"grunt-contrib-clean": "~0.6.0","grunt-contrib-nodeunit": "~0.4.1","grunt": "~0.4.5"}}');
        });

    });

    describe('removePackagesWithoutValidVersions method', function() {

        it('should be a function', function() {
            expect(typeof versionManager.removePackagesWithoutValidVersions).to.equal('function');
        });

        describe('when called with packages', function() {
            var result;

            beforeEach(function() {
                result = versionManager.removePackagesWithoutValidVersions({
                    dep1: '2.0.1',
                    dep2: '1.2',
                    dep3: '1.2.x',
                    dep4: '1.x',
                    dep5: '>0.2.x',
                    dep6: '>=1.0.0',
                    dep7: '^1.0.1',
                    dep8: '~2.0.1',
                    'dep9_with_space': '~2.0.1 ',
                    dep10: 'git+https://git@github.com/repo/test.git',
                    dep11: 'git+ssh://git@github.com/repo/test.git',
                    dep12: 'http://git@github.com/repo/test.git',
                    dep13: 'git://git@github.com/repo/test.git',
                    dep14: '^0.0.3-beta',
                    dep15: '1.x.x',
                    dep16: '1.2.*',
                    dep17: '0',
                    dep18: '3.4.5-alpha.9',
                    dep19: '<=1.2.7',
                    dep20: '=1.2.7',
                    dep21: '<1.2.*',
                    dep22: '*'
                });
            });

            it('should keep versions that are valid', function() {
                expect(result).to.have.property('dep1');
                expect(result).to.have.property('dep2');
                expect(result).to.have.property('dep3');
                expect(result).to.have.property('dep4');
                expect(result).to.have.property('dep5');
                expect(result).to.have.property('dep6');
                expect(result).to.have.property('dep7');
                expect(result).to.have.property('dep8');
                expect(result).to.have.property('dep9_with_space');
                expect(result).to.have.property('dep14');
                expect(result).to.have.property('dep15');
                expect(result).to.have.property('dep16');
                expect(result).to.have.property('dep17');
                expect(result).to.have.property('dep18');
                expect(result).to.have.property('dep19');
                expect(result).to.have.property('dep20');
                expect(result).to.have.property('dep21');
                expect(result).to.have.property('dep22');
            });

            it('should remove packages that do not have versions to check against', function() {
                expect(result).not.to.have.property('dep10');
                expect(result).not.to.have.property('dep11');
                expect(result).not.to.have.property('dep12');
                expect(result).not.to.have.property('dep13');
            });

        });

    });

});
