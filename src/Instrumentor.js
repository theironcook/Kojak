/* jshint -W083 */

// It's possible I might reuse this instance in multiple contexts some day.

Kojak.Instrumentor = function () {
    this._hasInstrumented = false;
    this._lastCheckpointTime = undefined;

    this._origFunctions = {};
    this._functionProfiles = [];
    this._clazzPaths = [];

    this._stackLevel = -1;
    this._stackLevelCumTimes = {};
    this._stackContexts = [];
};

Kojak.Core.extend(Kojak.Instrumentor.prototype, {

    instrument: function () {
        var candidates;

        try {
            if (this._hasInstrumented) {
                throw 'Code already instrumented';
            }

            this._hasInstrumented = true;

            candidates = this._findFunctionCandidates();
            this._processFunctionCandidates(candidates);
            this._findUniqueClazzPaths();

            console.log('Kojak has completed instrumenting.  Run Kojak.Report.instrumentedCode() to see what has been instrumented');
        }
        catch (exception) {
            console.log('Error, Kojak instrument has failed ', exception);
            console.log('Stack:\n', exception.stack);
        }
    },

    hasInstrumented: function(){
        return this._hasInstrumented;
    },

    getClazzPaths: function(){
        return this._clazzPaths;
    },

    // Root through all included pakages and find candidate functions
    // These functions might be clazzes or just plain old functions
    //   Keep track of duplicate function references
    //     When there are duplicates if at least one looks like a clazz then assume they will all be used like a clazz
    //     Clazzes are not wrapped at all - anything that might be invoked with the new operator must not be wrapped
    _findFunctionCandidates: function(){
        var candidates = {},
            curPakageNames,
            pakagePath,
            pakage,
            pakageName,
            childName,
            child,
            childKojakType;

        curPakageNames = Kojak.Config.getIncludedPackages().slice(0);

        while (curPakageNames.length > 0) {
            pakagePath = curPakageNames.pop();
            pakage = Kojak.Core.getContext(pakagePath);

            if(! this._shouldIgnorePakage(pakagePath, pakage)){
                // Now the pakage can be self aware it's own path
                pakage._kPath = pakagePath;

                // Define the _kPath property so that it is not enumerable.
                // Otherwise the _kPath might show up incorrectly in iterators
                Object.defineProperty(pakage, '_kPath', {enumerable: false});

                for (childName in pakage) {
                    if (pakage.hasOwnProperty(childName)) {
                        child = pakage[childName];
                        childKojakType = Kojak.Core.inferKojakType(childName, child);

                        if(childKojakType === Kojak.Core.CLASS || childKojakType === Kojak.Core.FUNCTION ){
                            if(!this._shouldIgnoreFunction(pakagePath, childName)){
                                if(!child._kFid){
                                    child._kFid = Kojak.Core.uniqueId();
                                    // Define the _kPath property so that it is not enumerable.
                                    // Otherwise the _kPath might show up incorrectly in iterators
                                    Object.defineProperty(child, '_kFid', {enumerable: false});

                                    this._origFunctions[child._kFid] = child;
                                    candidates[child._kFid] = [pakagePath + '.' + childName];
                                }
                                else {
                                    // there is a duplicate ref to the same clazz or function
                                    candidates[child._kFid].push(pakagePath + '.' + childName);
                                }
                            }
                        }

                        // A pakage and contain nested pakages or clazzes so recurse on them and check for functions there too
                        if(childKojakType === Kojak.Core.PAKAGE){
                            curPakageNames.push(pakagePath + '.' + childName);
                        }
                        else if(childKojakType === Kojak.Core.CLASS){
                            // Possibly treat a clazz as a possible pakage?
                            curPakageNames.push(pakagePath + '.' + childName);

                            // Check the clazz function's prototype for functions
                            curPakageNames.push(pakagePath + '.' + childName + '.prototype');
                        }
                    }
                }

                // If treating clazzes as a possible pakages we need to check for that here and drill down to the prototype.
                // This only happens when a clazz was passed in as one of the original pakages in Config
                pakageName = Kojak.Core.getObjName(pakagePath);
                if(   Kojak.Core.inferKojakType(pakageName, pakage) === Kojak.Core.CLASS &&
                    ! pakage.prototype._kPath){
                    console.log('---found PACKAGE that is a class ', pakagePath);
                    curPakageNames.push(pakagePath + '.prototype');
                }
            }
        }

        return candidates;
    },

    _shouldIgnorePakage: function(pakagePath, pakage){
        if(!pakage){
            return true;
        }
        else if( Kojak.Core.inferKojakType(pakagePath, pakage) === Kojak.Core.PAKAGE && pakage._kPath){
            console.log('ignored circular/duplicate package reference: ', pakagePath);
            return true;
        }
        else {
            return Kojak.Config.isPathExcluded(pakagePath);
        }
    },

    _shouldIgnoreFunction: function(pakagePath, funcName){
        // not sure if this is important
        //name === 'constructor';
        return Kojak.Config.arePathsExcluded(pakagePath, pakagePath + '.' + funcName, funcName);
    },

    _processFunctionCandidates: function(candidates){
        var kFuncId, origFunc, funcPaths, anyClazzes;

        for(kFuncId in candidates){
            funcPaths = candidates[kFuncId];
            origFunc = this._origFunctions[kFuncId];

            if(funcPaths.length === 1){
                // there are no duplicate references to the same function
                if(!this._isFuncAClazz(funcPaths[0])){
                    this._instrumentFunction(funcPaths[0], origFunc);
                }
            }
            else {
                // figure out if any references look like a clazz reference
                // I cannot wrap any function that people expect to use with the new operator - i.e. clazzes
                // If there is even a single clazz I shouldn't wrap any of the functions
                anyClazzes = false;
                funcPaths.forEach(function(fullFuncPath){
                    if(this._isFuncAClazz(fullFuncPath)){
                        anyClazzes = true;
                    }
                }.bind(this));

                if(!anyClazzes){
                    // Each will have it's own independent wrapper that points to the original function
                    funcPaths.forEach(function(fullFuncPath){
                        this._instrumentFunction(fullFuncPath, origFunc);
                    }.bind(this));
                }
            }
        }
    },

    _isFuncAClazz: function(fullFuncPath){
        var funcName, firstChar;

        funcName = Kojak.Core.getObjName(fullFuncPath);
        firstChar = funcName.substring(0, 1);
        return Kojak.Core.isStringOnlyAlphas(firstChar) && firstChar === firstChar.toUpperCase();
    },

    _instrumentFunction: function(fullFuncPath, origFunc){
        var containerPath, container, funcName, funcProfile;

        containerPath = Kojak.Core.getPath(fullFuncPath);
        funcName = Kojak.Core.getObjName(fullFuncPath);

        container = Kojak.Core.getContext(containerPath);

        if(!container){
            console.log('Kojak error, the function path could not be located: ' + fullFuncPath);
        }
        else{
            funcProfile = new Kojak.FunctionProfile(container, funcName, origFunc);
            container[funcName] = funcProfile.getWrappedFunction();
            this._functionProfiles.push(funcProfile);
        }
    },

    _findUniqueClazzPaths: function(){
        var uniquePaths = {}, functionKPath, clazzPath;

        this._functionProfiles.forEach(function(functionProfile){
            functionKPath = functionProfile.getKPath();
            clazzPath = Kojak.Core.getPath(functionKPath);

            if(!uniquePaths[clazzPath]){
                uniquePaths[clazzPath] = true;
                this._clazzPaths.push(clazzPath);
            }
        }.bind(this));

        this._clazzPaths.sort();
    },

    takeCheckpoint: function(){
        if(!this.hasInstrumented()){
            this.instrument();
        }

        this._lastCheckpointTime = new Date();
        this._functionProfiles.forEach(function(functionProfile){
            functionProfile.takeCheckpoint();
        }.bind(this));
    },

    getLastCheckpointTime: function(){
        return this._lastCheckpointTime;
    },

    // Only should be called from FunctionProfile
    recordStartFunction: function (functionProfile) {
        this._stackLevel++;
        this._stackLevelCumTimes[this._stackLevel] = 0;
        this._stackContexts[this._stackLevel] = functionProfile.getKPath();

        functionProfile.pushStartTime(new Date(), this._stackContexts.join(' > '));

        if (Kojak.Config.getRealTimeFunctionLogging()) {
            console.log(Kojak.Formatter.makeTabs(this._stackLevel) + 'start: ' + functionProfile.getKPath(), Kojak.Formatter.millis(functionProfile.getIsolatedTime()));
        }
    },

    // Only should be called from FunctionProfile
    recordStopFunction: function (functionProfile) {
        var startTime, callTime;

        this._stackLevel--;
        startTime = functionProfile.popStartTime();
        callTime = (new Date()) - startTime;

        functionProfile.addWholeTime(callTime);
        functionProfile.addIsolatedTime(callTime - this._stackLevelCumTimes[this._stackLevel + 1]);
        this._stackLevelCumTimes[this._stackLevel] += callTime;
        this._stackContexts.pop();

        if (Kojak.Config.getRealTimeFunctionLogging()) {
            console.log(Kojak.Formatter.makeTabs(this._stackLevel + 1) + 'stop:  ' + functionProfile.getKPath(), Kojak.Formatter.millis(functionProfile.getIsolatedTime()));
        }
    },

    getPackageProfiles: function(){
        return this._packageProfiles;
    },

    getFunctionProfiles: function(){
        return this._functionProfiles;
    }
});