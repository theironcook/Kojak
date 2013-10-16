/* jshint -W083 */

Kojak.Report = {

    // Default function options
    _INST_CODE_DEFAULT_OPTS: {},
    _FUNC_PROFILE_DEFAULT_OPTS: {maxRows: 20, sortProperty: 'IsolatedTime'},

    instrumentedCode: function(opts){
        var optsWereEmpty, clazzPaths, report = [], totalClazzes = 0, totalFuncs = 0;

        if(!Kojak.instrumentor.hasInstrumented()){
            console.log('You have not ran Kojak.instrumentor.instrument() yet.');
            return;
        }

        optsWereEmpty = !opts;
        opts = Kojak.Core.extend(opts || {}, Kojak.Report._INST_CODE_DEFAULT_OPTS);

        if(opts && opts.filter){
            Kojak.Core.assert( Kojak.Core.isString(opts.filter) || Kojak.Core.isStringArray(opts.filter),
                               'filter must be a string or an array of strings');
        }

        try {
            console.log('Currently instrumented code in Kojak: ' + (opts.filter ? '(filtered by \'' + opts.filter + '\')' : ''));

            // Report header
            if(opts.verbose){
                report.push(['--Pakage--', '--Clazz--', '--Function--', '--Call Count--']);
            }
            else {
                report.push(['--Pakage--', '--Clazz--', '--Function Count--']);
            }

            // Report body
            clazzPaths = Kojak.instrumentor.getClazzPaths();

            clazzPaths.forEach(function(clazzPath){
                var clazzPackagePath, clazzName, kFuncProfiles, funcCount = 0;

                clazzPackagePath = Kojak.Core.getPakageName(clazzPath);
                clazzName = Kojak.Core.getClazzName(clazzPath);

                if (!opts.filter || this._matchesAnyFilter(opts.filter, clazzPath, clazzPackagePath, clazzName)) {

                    if (opts.verbose) {
                        kFuncProfiles = this._getKFuncProfiles(opts, clazzPath);
                        kFuncProfiles.forEach(function(kFProfile){
                            report.push([clazzPackagePath, clazzName, kFProfile.getFunctionName(), kFProfile.getCallCount()]);
                            funcCount++;
                        }.bind(this));
                    }
                    else {
                        funcCount = this._getFunctionCount(clazzPath);
                        report.push([clazzPackagePath, clazzName, funcCount]);
                    }

                    totalFuncs += funcCount;
                    totalClazzes++;
                }
            }.bind(this));

            Kojak.Formatter.formatReport(report);

            console.log('\n\tNumber of clazzes reported: ' + Kojak.Formatter.millis(totalClazzes));
            console.log('\tNumber of functions reported: ' + Kojak.Formatter.millis(totalFuncs));

            if(opts.filter){
                console.log('\tClazz and function counts are less than what has been instrumented in your application');
                console.log('\tCounts are based off of what has been filtered with \'' + opts.filter + '\'');
            }

            if(optsWereEmpty){
                console.log('\n\tOptions for this command are {filter: \'xxx\', verbose: true}');
            }
        }
        catch(exception){
            console.log('instrumentedCode failed ' + exception.stack);
        }
    },

    _getFunctionCount: function(clazzPath){
        var clazz, childName, child, funcCount = 0;

        clazz = Kojak.Core.getContext(clazzPath);
        Kojak.Core.assert(clazz, 'The clazz could not be found: ' + clazzPath);

        for(childName in clazz){
            if(clazz.hasOwnProperty(childName)){
                child = clazz[childName];

                if(child && child._kFProfile){
                    funcCount++;
                }
            }
        }

        return funcCount;
    },

    _getKFuncProfiles: function(opts, clazzPath){
        var clazz, childName, child, kFuncProfiles = [];

        clazz = Kojak.Core.getContext(clazzPath);
        Kojak.Core.assert(clazz, 'The clazz could not be found: ' + clazzPath);

        for(childName in clazz){
            if(clazz.hasOwnProperty(childName)){
                child = clazz[childName];

                if(child && child._kFProfile){
                    if(! opts.filter || this._matchesAnyFilter(opts.filter, childName, child._kFProfile.getKPath())){
                        kFuncProfiles.push(child._kFProfile);
                    }
                }
            }
        }

        kFuncProfiles = kFuncProfiles.sort(function(a, b){
            return b.getFunctionName() - a.getFunctionName();
        });

        return kFuncProfiles;
    },


    funcPerf: function(opts){
        var optsWereEmpty;

        try {
            optsWereEmpty = !opts;
            opts = Kojak.Core.extend(opts || {}, Kojak.Report._FUNC_PROFILE_DEFAULT_OPTS);

            this._functionProfileProps(opts, ['KPath', 'IsolatedTime', 'WholeTime', 'CallCount']);
        }
        catch(exception){
            console.log('functionProfiles failed ' + exception.stack);
        }
    },

    funcPerfAfterCheckpoint: function(opts){
        var optsWereEmpty;

        try {
            if(!Kojak.instrumentor.getLastCheckpointTime()){
                console.log('You have not taken any checkpoints yet to report on.  First run Kojak.takeCheckpoint() and invoke some of your code to test.');
                return;
            }

            optsWereEmpty = !opts;
            opts = Kojak.Core.extend(opts || {}, Kojak.Report._FUNC_PROFILE_DEFAULT_OPTS);

            this._functionProfileProps(opts, ['KPath', 'IsolatedTime_Checkpoint', 'WholeTime_Checkpoint', 'CallCount_Checkpoint']);
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
    }
};
