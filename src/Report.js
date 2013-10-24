/* jshint -W083 */

Kojak.Report = {

    // Default function options
    _INST_CODE_DEFAULT_OPTS: {},
    _FUNC_PROFILE_DEFAULT_OPTS: {max: 20, sortBy: 'IsolatedTime'},

    // opts are
    //  filter: a string or an array of strings.  If a function's kPath partially matches any of the filter strings it's included
    //  verbose: true.  If you want to see each individual named function
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

            console.log('\n\tNumber of clazzes reported: ' + Kojak.Formatter.number(totalClazzes));
            console.log('\tNumber of functions reported: ' + Kojak.Formatter.number(totalFuncs));

            if(opts.filter){
                console.log('\tClazz and function counts are less than what has been instrumented in your application');
                console.log('\tCounts are based off of what has been filtered with \'' + opts.filter + '\'');
            }

            if(optsWereEmpty){
                console.log('\n\tOptions for this command are {filter: [\'xxx\', \'yyy\'], verbose: true}');
            }
        }
        catch (exception) {
            console.log('Error, Kojak.Report.instrumentedCode has failed ', exception);
            if(exception.stack){
                console.log('Stack:\n', exception.stack);
            }
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
        this._functionPerfProps(opts, ['KPath', 'IsolatedTime', 'WholeTime', 'CallCount', 'AvgIsolatedTime', 'AvgWholeTime', 'MaxIsolatedTime', 'MaxWholeTime']);
    },

    funcPerfAfterCheckpoint: function(opts){
        if(!Kojak.instrumentor.getLastCheckpointTime()){
            console.log('You have not taken any checkpoints yet to report on.  First run Kojak.takeCheckpoint() and invoke some of your code to test.');
            return;
        }

        if(!opts){
            opts = {sortBy: 'IsolatedTime_Checkpoint'};
        }
        else if(!opts.sortBy){
            opts.sortBy = 'IsolatedTime_Checkpoint';
        }
        else {
            opts.sortyBy += '_Checkpoint';
        }

        console.log('Results since checkpoint taken: ' + Kojak.instrumentor.getLastCheckpointTime().toString('hh:mm:ss tt'));
        this._functionPerfProps(opts, ['KPath', 'IsolatedTime_Checkpoint', 'WholeTime_Checkpoint', 'CallCount_Checkpoint',  'AvgIsolatedTime_Checkpoint', 'AvgWholeTime_Checkpoint', 'MaxIsolatedTime_Checkpoint', 'MaxWholeTime_Checkpoint']);
    },


    // opts are
    //  max: a number - how many rows do you want to show
    //  filter: a string or an array of strings.  If a function's kPath partially matches any of the filter strings it's included
    _functionPerfProps: function(opts, props){
        var profilesWithData = [],
            report = [],
            reportRow,
            profileCount,
            kFProfile,
            fieldCount,
            totals = {},
            totalsRow = ['--Totals across all instrumented functions: '];

        if(!Kojak.instrumentor.hasInstrumented()){
            console.log('You have not ran Kojak.instrumentor.instrument() yet.');
            return;
        }

        try {
            opts = Kojak.Core.extend(Kojak.Report._FUNC_PROFILE_DEFAULT_OPTS, opts);

            if(opts.filter){
                Kojak.Core.assert( Kojak.Core.isString(opts.filter) || Kojak.Core.isStringArray(opts.filter),
                    'filter must be a string or an array of strings');
            }

            if(opts.max){
                Kojak.Core.assert(Kojak.Core.isNumber(opts.max) && opts.max > 0, 'max should be a number greater than 0');
            }

            Kojak.instrumentor.getFunctionProfiles().forEach(function(kFProfile){
                if(!opts.filter || this._matchesAnyFilter(opts.filter, kFProfile.getKPath())){
                    if(kFProfile.getProperty(opts.sortBy)){
                        profilesWithData.push(kFProfile);
                    }
                }
            }.bind(this));

            profilesWithData.sort(function(a, b){
                return b.getProperty(opts.sortBy) - a.getProperty(opts.sortBy);
            });

            reportRow = [];
            props.forEach(function(prop){reportRow.push('--' + prop.replace('_Checkpoint', '') + '--');});
            report.push(reportRow);

            for (profileCount = 0; profileCount < profilesWithData.length && profileCount < opts.max; profileCount++) {
                kFProfile = profilesWithData[profileCount];

                reportRow = [];
                for(fieldCount = 0; fieldCount < props.length; fieldCount++){
                    reportRow.push(kFProfile.getProperty(props[fieldCount]));
                }
                report.push(reportRow);
            }

            // function totals
            Kojak.instrumentor.getFunctionProfiles().forEach(function(kFProfile){
                props.forEach(function(prop){
                    var val;

                    if(prop !== 'KPath'){
                        val = kFProfile.getProperty(prop);

                        if(this._isPropReportInTotals(prop) && Kojak.Core.isNumber(val)){
                            if(!totals[prop]){
                                totals[prop] = 0;
                            }
                            totals[prop] += val;
                        }
                    }
                }.bind(this));
            }.bind(this));

            for(var prop in totals){
                totalsRow.push(totals[prop]);
            }
            report.push(totalsRow);

            console.log('Top ' + opts.max + ' functions displayed sorted by ' + opts.sortBy + (opts.filter ? ' based on your filter: \'' + opts.filter: '\''));
            Kojak.Formatter.formatReport(report);
        }
        catch (exception) {
            console.log('Error, Kojak.Report.funcPerf has failed ', exception);
            if(exception.stack){
                console.log('Stack:\n', exception.stack);
            }
        }
    },

    _isPropReportInTotals: function(prop){
        return prop === 'IsolatedTime' ||
               prop === 'IsolatedTime_Checkpoint' ||
               prop === 'WholeTime' ||
               prop === 'WholeTime_Checkpoint' ||
               prop === 'CallCount' ||
               prop === 'CallCount_Checkpoint';
    },

    callPaths: function(funcPath){
        var funcWrapper, kFProfile, callPaths, callPath, count, sorted = [], pathsReport = [], summaryReport = [];

        if(!Kojak.instrumentor.hasInstrumented()){
            console.log('You have not ran Kojak.instrumentor.instrument() yet.');
            return;
        }

        funcWrapper = Kojak.Core.isString(funcPath) ? Kojak.Core.getContext(funcPath) : funcPath;
        Kojak.Core.assert(funcWrapper, 'Function not found.');
        kFProfile = funcWrapper._kFProfile;
        Kojak.Core.assert(kFProfile, 'Function profile not found.  Are you sure it was included to be profiled?');

        callPaths = kFProfile.getCallPaths();
        for(callPath in callPaths){
            count = callPaths[callPath];
            sorted.push({path: callPath, count: count});
        }

        sorted = sorted.sort(function(a, b){
            return b.count - a.count;
        });

        pathsReport.push(['--Call Count--', '--Call Path--']);
        sorted.forEach(function(item){
            pathsReport.push([item.count, item.path]);
        }.bind(this));

        Kojak.Formatter.formatReport(pathsReport);

        console.log();
        summaryReport.push(['IsolatedTime: ', kFProfile.getIsolatedTime()]);
        summaryReport.push(['WholeTime: ', kFProfile.getWholeTime()]);
        summaryReport.push(['CallCount: ', kFProfile.getCallCount()]);
        Kojak.Formatter.formatReport(summaryReport);

        console.log('\n\tRemember, only profiled functions show up in call paths.');
        console.log('\tAnonymous functions with no references are never profiled.');
    },

    netCalls: function(){
        var netProfiles, urlBase, netProfile, sorted = [], report = [];

        if(!Kojak.netWatcher){
            console.log('The NetWatcher is not loaded.  Have you set Kojak.Config.setEnableNetWatcher(true)?');
            return;
        }

        netProfiles = Kojak.netWatcher.getNetProfiles();
        for(urlBase in netProfiles){
            netProfile = netProfiles[urlBase];
            sorted.push({totalCallTime: netProfile.getTotalCallTime(), netProfile: netProfile});
        }

        sorted = sorted.sort(function(a, b){
            return b.totalCallTime - a.totalCallTime;
        });

        report.push(['--urlBase--', '--urlParameters--', '--When Called--', '--Call Time--', '--Size (bytes)--', '--Obj Count--']);

        sorted.forEach(function(item){
            var addedUrlBase = false;

            item.netProfile.getCallsSortedByDate().forEach(function(netProfileCall){
                var reportLine = [];

                if(!addedUrlBase){
                    reportLine.push(item.netProfile.getUrlBase());
                    addedUrlBase = true;
                }
                else {
                    reportLine.push('');
                }

                reportLine.push(netProfileCall.getUrlParams());
                reportLine.push(netProfileCall.getDate().toString('hh:mm:ss tt'));
                reportLine.push(netProfileCall.getCallTime());
                reportLine.push(netProfileCall.getResponseSize());
                reportLine.push(netProfileCall.getObjCount());

                report.push(reportLine);
            });
        });

        Kojak.Formatter.formatReport(report);
    },

    randomKojakQuote: function(){
        var kojakQuotes = ['Who loves ya, baby?',
                           'Counselor, you tell your client to make his mouth behave, or he\'s a prime candidate for a get well card.',
                           'Greeks don\'t threaten. They utter prophecies.',
                           'Dumb got him killed. Dead is not guts. Dead is dumb.'];
        return kojakQuotes[Math.floor(Math.random() * kojakQuotes.length)];
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
