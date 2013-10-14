/* jshint -W083 */

Kojak.Report = {

    // Default function parameters
    _INST_PACKAGE_DEFAULTS: {},
    _FUNC_PROFILE_DEFAULTS: {maxRows: 20, sortProperty: 'IsolatedTime'},

    instrumentedCode: function(opts){
        var optsWereEmpty, packageProfiles, packageNames, packageProfile, report = [], reportLine;

        optsWereEmpty = !opts;
        opts = Kojak.Core.extend(opts || {}, Kojak.Report._INST_PACKAGE_DEFAULTS);

        if(opts && opts.filter){
            Kojak.Core.assert(Kojak.Core.isString(opts.filter), 'filter must be a string');
        }

        try {
            console.log('Currently instrumented packages in Kojak: ' + (opts && opts.filter ? '(filtered by \'' + opts.filter + '\')' : ''));
            packageProfiles = Kojak.instrumentor.getPackageProfiles();

            // Report header
            if(opts.reallyVerbose){
                report.push(['--Package--', '--Class--', '--Function--', '--Call Count--']);
            }
            else if(opts.verbose){
                report.push(['--Package--', '--Class--', '--Function Count--']);
            }
            else {
                report.push(['--Package--', '--Class Count--']);
            }

            // Report body
            packageNames = Kojak.Core.getKeys(packageProfiles).sort();

            packageNames.forEach(function(packageName){
                reportLine = [packageName];
                packageProfile = packageProfiles[packageName];

                if(! opts.filter || this._matchesAnyFilter(opts.filter, packageName)){
                    if(opts.reallyVerbose){
                        this._packageLinesReallyVerbose(opts, report, packageProfile);
                    }
                    else if(opts.verbose){
                        this._packageLinesVerbose(opts, report, packageProfile);
                    }
                    else {
                        report.push([packageProfile.getKojakPath(), packageProfile.getChildClassFunctionCount()]);
                    }
                }
            }.bind(this));

            report.push(['Total records: ' + Kojak.Formatter.millis(report.length)]);

            Kojak.Formatter.formatReport(report);

            if(optsWereEmpty){
                console.log('\n// options for this command are {filter: \'xxx\', verbose: true, reallyVerbose: true}');
            }
        }
        catch(exception){
            console.log('instrumentedCode failed ' + exception.stack);
        }
    },

    _packageLinesVerbose: function(opts, report, packageProfile){
        var packageKojakPath = packageProfile.getKojakPath();

        if (packageProfile.getChildFunctionCount() > 0) {
            report.push([packageProfile.getKojakPath(), '<package functions>', packageProfile.getChildFunctionCount()]);
        }

        packageProfile.getChildClassContainerProfiles().forEach(function(childContainerProfile){
            var childContainerPath, reportLine;
            childContainerPath = childContainerProfile.getKojakPath();

            if(!opts.filter || this._matchesAnyFilter(opts.filter, packageKojakPath, childContainerPath)){
                reportLine = [ packageKojakPath,
                               childContainerPath.replace(packageKojakPath + '.', ''),
                               childContainerProfile.getChildFunctionCount()];

                report.push(reportLine);
            }
        }.bind(this));
    },

    _packageLinesReallyVerbose: function(opts, report, packageProfile){
        var packageKojakPath = packageProfile.getKojakPath();

        // Check for static utility functions in the package
        packageProfile.getChildFunctions().forEach(function(childFunctionProfile){
            var childFunctionKojakPath = childFunctionProfile.getKojakPath();

            if (!opts.filter || this._matchesAnyFilter(opts.filter, childFunctionKojakPath)) {
                report.push([ packageKojakPath,
                              '<package function>',
                              childFunctionKojakPath.replace(packageKojakPath + '.', ''),
                              childFunctionProfile.getCallCount()]);
            }
        }.bind(this));

        packageProfile.getChildClassContainerProfiles().forEach(function(childContainerProfile){
            var childContainerPath;
            childContainerPath = childContainerProfile.getKojakPath();

            if(!opts.filter || this._matchesAnyFilter(opts.filter, packageKojakPath, childContainerPath)){

                childContainerProfile.getChildFunctions().forEach(function(childFunctionProfile){
                    var childFunctionPath = childFunctionProfile.getKojakPath(), reportLine;

                    if(!opts.filter || this._matchesAnyFilter(opts.filter, packageKojakPath, childContainerPath, childFunctionPath)){
                        reportLine = [ packageKojakPath,
                                       childContainerPath.replace(packageKojakPath + '.', ''),
                                       childFunctionPath.replace(childContainerPath + '.', ''),
                                       childFunctionProfile.getCallCount()];

                        report.push(reportLine);
                    }
                }.bind(this));
            }
        }.bind(this));
    },

    functionPerformance: function(opts){
        var optsWereEmpty;

        try {
            optsWereEmpty = !opts;
            opts = Kojak.Core.extend(opts || {}, Kojak.Report._FUNC_PROFILE_DEFAULTS);

            this._functionProfileProps(opts, ['KojakPath', 'IsolatedTime', 'WholeTime', 'CallCount']);
        }
        catch(exception){
            console.log('functionProfiles failed ' + exception.stack);
        }
    },

    functionPerformanceAfterCheckpoint: function(opts){
        var optsWereEmpty;

        try {
            optsWereEmpty = !opts;
            opts = Kojak.Core.extend(opts || {}, Kojak.Report._FUNC_PROFILE_DEFAULTS);

            this._functionProfileProps(opts, ['KojakPath', 'IsolatedTime_Checkpoint', 'WholeTime_Checkpoint', 'CallCount_Checkpoint']);
        }
        catch(exception){
            console.log('functionProfiles failed ' + exception.stack);
        }
    },

    _functionProfileProps: function(opts, props){
        var profilesWithData = [], report = [], reportRow, profileCount, profile, fieldCount;

        Kojak.instrumentor.getFunctionProfiles().forEach(function(profile){
            if(profile.getProperty(opts.sortProperty)){
                profilesWithData.push(profile);
            }
        });

        profilesWithData.sort(function(a, b){
            return b.getProperty(opts.sortProperty) - a.getProperty(opts.sortProperty);
        });

        report.push(props);

        for (profileCount = 0; profileCount < profilesWithData.length && profileCount < opts.maxRows; profileCount++) {
            profile = profilesWithData[profileCount];

            reportRow = [];
            for(fieldCount = 0; fieldCount < props.length; fieldCount++){
                reportRow.push(profile.getProperty(props[fieldCount]));
            }
            report.push(reportRow);
        }

        Kojak.Formatter.formatReport(report);
    },

    // *****************************************************************************************************************
    // Helper functions
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
                if(c.contains(f)){
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
