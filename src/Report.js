/* jshint -W083 */

Kojak.Report = {

    // opts are
    //  filter: a string or an array of strings.  If a function's kPath partially matches any of the filter strings it's included
    //  verbose: true.  If you want to see each individual named function
    instrumentedCode: function(opts){
        var optsWereEmpty, clazzPaths, report = [], totalClazzes = 0, totalFuncs = 0;

        if(!Kojak.instrumentor.hasInstrumented()){
            console.warn('You have not ran Kojak.instrumentor.instrument() yet.');
            return;
        }

        optsWereEmpty = !opts;
        opts = opts || {};

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
            console.error('Error, Kojak.Report.instrumentedCode has failed ', exception);
            if(exception.stack){
                console.error('Stack:\n', exception.stack);
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
        var props, totalProps;

        props = ['KPath', 'IsolatedTime', 'WholeTime', 'CallCount', 'AvgIsolatedTime', 'AvgWholeTime', 'MaxIsolatedTime', 'MaxWholeTime'];
        totalProps = ['IsolatedTime', 'CallCount'];

        if(!opts){
            opts = {};
        }

        if(!opts.sortBy){
            opts.sortBy = 'IsolatedTime';
        }

        if(!opts.max){
            opts.max = 20;
        }

        this._functionPerfProps(opts, props, totalProps);
    },

    funcPerfAfterCheckpoint: function(opts){
        var props, totalProps;

        props = ['KPath', 'IsolatedTime_Checkpoint', 'WholeTime_Checkpoint', 'CallCount_Checkpoint',  'AvgIsolatedTime_Checkpoint', 'AvgWholeTime_Checkpoint', 'MaxIsolatedTime_Checkpoint', 'MaxWholeTime_Checkpoint'];
        totalProps = ['IsolatedTime_Checkpoint', 'CallCount_Checkpoint'];

        if(!Kojak.instrumentor.getLastCheckpointTime()){
            console.warn('You have not taken any checkpoints yet to report on.  First run Kojak.takeCheckpoint() and invoke some of your code to test.');
            return;
        }

        if(!opts){
            opts = {};
        }

        if(!opts.sortBy){
            opts.sortBy = 'IsolatedTime_Checkpoint';
        }

        if(!opts.max){
            opts.max = 20;
        }

        console.log('Results since checkpoint taken: ' + (new Date(Kojak.instrumentor.getLastCheckpointTime())).toString('hh:mm:ss tt'));
        this._functionPerfProps(opts, props, totalProps);
    },


    // opts are
    //  max: a number - how many rows do you want to show
    //  filter: a string or an array of strings.  If a function's kPath partially matches any of the filter strings it's included
    _functionPerfProps: function(opts, props, totalProps){
        var sortedProfiles = [],
            report = [],
            reportRow,
            profileCount,
            kFProfile,
            fieldCount,
            totals = {},
            totalsRow = [];

        if(!Kojak.instrumentor.hasInstrumented()){
            console.warn('You have not ran Kojak.instrumentor.instrument() yet.');
            return;
        }

        try {
            if(opts.filter){
                Kojak.Core.assert( Kojak.Core.isString(opts.filter) || Kojak.Core.isStringArray(opts.filter),
                    'filter must be a string or an array of strings');
            }

            if(opts.max){
                Kojak.Core.assert(Kojak.Core.isNumber(opts.max) && opts.max > 0, 'max should be a number greater than 0');
            }

            // First filter
            Kojak.instrumentor.getFunctionProfiles().forEach(function(kFProfile){
                if(!opts.filter || this._matchesAnyFilter(opts.filter, kFProfile.getKPath())){
                    sortedProfiles.push(kFProfile);
                }
            }.bind(this));

            // Then sort
            sortedProfiles.sort(function(a, b){
                return b.getProperty(opts.sortBy) - a.getProperty(opts.sortBy);
            });

            reportRow = [];
            props.forEach(function(prop){reportRow.push('--' + prop.replace('_Checkpoint', '') + '--');});
            report.push(reportRow);

            for (profileCount = 0; profileCount < sortedProfiles.length && profileCount < opts.max; profileCount++) {
                kFProfile = sortedProfiles[profileCount];

                reportRow = [];
                for(fieldCount = 0; fieldCount < props.length; fieldCount++){
                    reportRow.push(kFProfile.getProperty(props[fieldCount]));
                }
                report.push(reportRow);
            }

            // function totals
            Kojak.instrumentor.getFunctionProfiles().forEach(function(kFProfile){
                totalProps.forEach(function(totalProp){
                    var val = kFProfile.getProperty(totalProp);

                    if(Kojak.Core.isNumber(val)){
                        if(!totals[totalProp]){
                            totals[totalProp] = 0;
                        }
                        totals[totalProp] += val;
                    }
                }.bind(this));
            }.bind(this));

            props.forEach(function(prop){
                if(prop === 'KPath'){
                    totalsRow.push('--Totals across all instrumented functions: ');
                }
                else if(totals[prop]){
                    totalsRow.push(totals[prop]);
                }
                else {
                    totalsRow.push('-');
                }
            });

            report.push(totalsRow);

            console.log('Top ' + opts.max + ' functions displayed sorted by ' + opts.sortBy + (opts.filter ? ' based on your filter: \'' + opts.filter: '\''));
            Kojak.Formatter.formatReport(report);
        }
        catch (exception) {
            console.error('Error, Kojak.Report.funcPerf has failed ', exception);
            if(exception.stack){
                console.error('Stack:\n', exception.stack);
            }
        }
    },

    callPaths: function(funcPath){
        var funcWrapper, kFProfile, callPaths, callPath, count, sorted = [], pathsReport = [], summaryReport = [];

        if(!Kojak.instrumentor.hasInstrumented()){
            console.warn('You have not ran Kojak.instrumentor.instrument() yet.');
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
        this._netCalls(Kojak.netWatcher.getNetProfiles());
    },

    netCallsAfterCheckpoint: function(){
        this._netCalls(Kojak.netWatcher.getNetProfiles_Checkpoint());
    },

    _netCalls: function(netProfiles){
        var urlBase, netProfile, sorted = [], report = [];

        if(!Kojak.netWatcher){
            console.warn('The NetWatcher is not loaded.  Have you set Kojak.Config.setEnableNetWatcher(true)?');
            return;
        }

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
                reportLine.push((new Date(netProfileCall.getDate())).toString('hh:mm:ss tt'));
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
