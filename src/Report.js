/* jshint -W083 */

Kojak.Report = {

    instrumentedPackages: function(opts){
        var packageProfiles, packageNames, packageName, packageProfile, report = [], reportLine;

        if(opts && opts.filter){
            Kojak.Core.assert(Kojak.Core.isString(opts.filter), 'filter must be a string');
        }

        try {
            console.log('Currently instrumented packages in Kojak: ' + (opts && opts.filter ? '(filtered by \'' + opts.filter + '\')' : ''));
            packageProfiles = Kojak._instrumentor.getInstrumentedPackageProfiles();

            // Report header
            if(opts && opts.reallyVerbose){
                report.push(['--Package--', '--Class--', '--Function--', '--Call Count--']);
            }
            else if(opts && opts.verbose){
                report.push(['--Package--', '--Classes--', '--Function Count--']);
            }
            else {
                report.push(['--Package--', '--Immediate Class Count--']);
            }

            // Report body
            packageNames = Kojak.Core.getKeys(packageProfiles).sort();

            packageNames.forEach(function(packageName){
                reportLine = [packageName];
                packageProfile = packageProfiles[packageName];

                if(opts && opts.reallyVerbose){
                    this._packageLinesReallyVerbose(opts, report, packageName, packageProfile);
                }
                else if(opts && opts.verbose){
                    this._packageLinesVerbose(opts, report, packageName, packageProfile);
                }
                else {
                    this._packageLineDefault(opts, report, packageName, packageProfile);
                }
            }.bind(this));

            Kojak.Formatter.formatReport(report);

            if(!opts){
                console.log('\n// options for this command are {filter: \'xxx\', verbose: true, reallyVerbose: true}');
            }
        }
        catch(exception){
            console.log('instrumentedPackages failed ' + exception.stack);
        }
    },

    _packageLineDefault: function(opts, report, packageName, packageProfile){
        if(!opts || ! opts.filter || this._matchesAnyFilter(opts.filter, packageName)){
            report.push([packageName, Kojak.Core.getPropCount(packageProfile.getClassFunctionProfiles())]);
        }
    },

    _packageLinesVerbose: function(opts, report, packageName, packageProfile){
        var classPaths, classPathCount, classPath, reportLine, classFunctionProfile, classProtoProfile;

        classPaths = packageProfile.getClassFunctionKojakPaths().sort();

        for(classPathCount = 0; classPathCount < classPaths.length; classPathCount++){
            classPath = classPaths[classPathCount];

            if(opts && opts.filter && ! this._matchesAnyFilter(opts.filter, packageName, classPath)){
                continue;
            }

            reportLine = [packageName, classPath.replace(packageName + '.', ''), 0];

            // Locate the classes and calculate their function counts
            classFunctionProfile = Kojak.Core.getContext(classPath)._kContainerProfile;
            classProtoProfile = Kojak.Core.getContext(classPath + '.prototype')._kContainerProfile;

            reportLine[2] += classFunctionProfile.getImmediateFunctionCount();
            reportLine[2] += classProtoProfile.getImmediateFunctionCount();

            report.push(reportLine);
        }

        // Check for static utility functions in the package
        if(!opts || !opts.filter || this._matchesAnyFilter(opts, packageName, classPath)){
            if(packageProfile.getImmediateFunctionCount() > 0){
                report.push([packageName, '<package>', packageProfile.getImmediateFunctionCount()]);
            }
        }
    },

    _packageLinesReallyVerbose: function(opts, report, packageName, packageProfile){
        var classPaths, classPathCount, classPath, classHolderProfile, profileKojakPaths, functionKojakPaths = [], reportLine;

        classPaths = packageProfile.getAllClassKojakPaths().sort();

        for(classPathCount = 0; classPathCount < classPaths.length; classPathCount++){
            classPath = classPaths[classPathCount];

            if(opts && opts.filter && ! this._matchesAnyFilter(opts.filter, packageName, classPath)){
                continue;
            }

            classHolderProfile = Kojak.Core.getContext(classPath)._kContainerProfile;
            profileKojakPaths = classHolderProfile.getFunctionProfileKojakPaths().sort();

            profileKojakPaths.forEach(function(functionKojakPath){
                if(!opts || !opts.filter || this._matchesAnyFilter(opts.filter, functionKojakPath)){
                    functionKojakPaths.push(functionKojakPath);
                }
            }.bind(this));
        }

        // Check for static utility functions in the package
        profileKojakPaths = packageProfile.getFunctionProfileKojakPaths().sort();
        profileKojakPaths.forEach(function(functionKojakPath){
            if(!opts || !opts.filter || this._matchesAnyFilter(opts.filter, functionKojakPath)){
                functionKojakPaths.push(functionKojakPath);
            }
        }.bind(this));

        functionKojakPaths.forEach(function(functionKojakPath){
            var functionProfile = Kojak.Core.getContext(functionKojakPath + '._kFunctionProfile');
            var classPath = functionKojakPath.substring(0, functionKojakPath.lastIndexOf('.'));

            if(packageName === classPath){
                classPath = '<package>';
            }

            reportLine = [
                packageName,
                this._getLastPathValue(classPath),
                this._getLastPathValue(functionKojakPath),
                functionProfile.getCallCount()
            ];

            report.push(reportLine);
        }.bind(this));


    },

    functionProfiles: function(options){

    },

    // filter can be a string or an array of strings
    // remaining parameters are compared with strings in the filter.
    _matchesAnyFilter: function(filter){
        var anyMatches, checks;

        anyMatches = false;
        checks = Array.prototype.slice.call(arguments, 1);

        if(Kojak.Core.isString(filter)){
            filter = [filter];
        }

        Kojak.Core.assert(Kojak.Core.isArray(filter), 'filter should be a string or an array of strings');

        filter.forEach(function(f){
            checks.forEach(function(c){
                if(c.indexOf(f) !== -1){
                    anyMatches = true;
                }
            });
        });

        return anyMatches;
    },

    _getLastPathValue: function(path){
        if(path.endsWith('prototype')){
            path = path.replace('.prototype', '');
            return path.substring(path.lastIndexOf('.') + 1) + '.prototype';
        }
        else {
            return path.substring(path.lastIndexOf('.') + 1);
        }
    }
};
