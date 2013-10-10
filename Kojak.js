// Kojak Version 0.1.0 
// Last built 2013-10-10
// Distributed Under MIT License

window.Kojak = {};

Kojak.Core = {

    // Enums / constants for non config code
    CLASS: 'CLASS',
    FUNCTION: 'FUNCTION',
    PACKAGE: 'PACKAGE',
    _REGEX_ALPHA: /^[A-Za-z]+$/,

    // Extends obj with {} values. Typically used for creating 'classes'
    extend: function(obj) {
        var args, argCount, arg;

        args = Array.prototype.slice.call(arguments, 1);

        for(argCount = 0; argCount < args.length; argCount++){
            arg = args[argCount];

            if(arg){
                for (var prop in arg) {
                    obj[prop] = arg[prop];
                }
            }
        }

        return obj;
    },

    // Get a context via a name delimited by .s
    getContext: function(contextPath){
        var contextPathItems, count, currentContextPath, context;

        if(Kojak.Core.isString(contextPath)){
            context = window;
            contextPathItems = contextPath.split('.');

            for(count = 0; count < contextPathItems.length; count++){
                currentContextPath = contextPathItems[count];

                if(typeof(context[currentContextPath]) === 'undefined'){
                    return undefined;
                }

                context = context[currentContextPath];
            }

            return context;
        }
    },

    isObject: function(obj) {
        return obj === Object(obj);
    },

    getPropCount: function(obj){
        return Kojak.Core.getKeys(obj).length;
    },

    getKeys: function(obj){
        var keys = [], key;
        Kojak.Core.assert(Kojak.Core.isObject(obj), 'Only use with objects');

        for(key in obj){
            if(obj.hasOwnProperty(key)){
                keys.push(key);
            }
        }

        return keys;
    },

    // only tested with array of strings
    unique: function(arr){
        var i, seen = {}, uq = [];
        Kojak.Core.assert(Kojak.Core.isArray(arr), 'Only use unique with arrays');

        for(i = 0; i < arr.length; i++){
            Kojak.Core.assert(Kojak.Core.isString(arr[i]), 'Only use unique with an array of strings');
            if(!seen[arr[i]]){
                uq.push(arr[i]);
                seen[arr[i]] = true;
            }
        }

        return uq;
    },

    // Kojak types - Class, Function, Package, undefined
    inferKojakType: function(objName, obj){
        var firstChar;

        if(obj && Kojak.Core.isFunction(obj)){
            firstChar = objName.substring(0, 1);
            if(Kojak.Core.isStringOnlyAlphas(firstChar) && firstChar === firstChar.toUpperCase()){
                return Kojak.Core.CLASS;
            }
            else {
                return Kojak.Core.FUNCTION;
            }
        }
        else if(obj && obj.constructor && obj.constructor.prototype === Object.prototype){
            return Kojak.Core.PACKAGE;
        }
        else {
            return undefined;
        }
    },

    isStringOnlyAlphas: function(check){
        Kojak.Core.assert(Kojak.Core.isString(check, 'only use with strings'));
        return check.match(Kojak.Core._REGEX_ALPHA);
    },

    assert: function(test, msg){
        if(!test){
            throw msg;
        }
    }
};

// Add the isXXX type checkers
['Arguments', 'Function', 'String', 'Number', 'Array', 'Date', 'RegExp'].forEach(function(name) {
    Kojak.Core['is' + name] = function(o) {
        return Object.prototype.toString.call(o) === '[object ' + name + ']';
    };
});
Kojak.Config = {

    // enums / constants
    CURRENT_VERSION: 1,
    AUTO_START_NONE: 'none',
    AUTO_START_IMMEDIATE: 'immediate',
    AUTO_ON_JQUERY_LOAD: 'on_jquery_load',
    AUTO_DELAYED: 'delayed',

    load: function () {
        if (localStorage.getItem('kojak')) {
            this._values = this._loadLocalStorage();
        }
        else {
            this._values = this._createDefaults();
            this._save();
        }
    },

    getAutoStart: function(){
        return this._values.autoStart;
    },

    setAutoStart: function (val) {
        Kojak.Core.assert([Kojak.Config.AUTO_START_NONE, Kojak.Config.AUTO_START_IMMEDIATE, Kojak.Config.AUTO_ON_JQUERY_LOAD, Kojak.Config.AUTO_DELAYED].indexOf(val) !== -1, 'Invalid auto start option \'' + val + '\'.');

        this._values.autoStart = val;
        this._save();

        if(Kojak.hasStarted()){
            console.log('autoStart updated. Reload your browser to notice the change.');
        }

        if(val === Kojak.Config.AUTO_DELAYED){
            console.log('todo - implement the auto delay functionality');
        }
    },

    addIncludedPackage: function (pk) {
        Kojak.Core.assert(this._values.includedPackages(pk) !== -1, 'Package is already included');

        this._values.includedPackages.push(pk);
        this._save();

        if(Kojak.hasStarted()){
            console.log('includedPackages updated. Reload your browser to notice the change.');
        }
    },

    setIncludedPackages: function (pks) {
        Kojak.Core.assert(Kojak.Core.isArray(pks), 'Only pass an array of strings for the included package names');

        this._values.includedPackages = pks;
        this._save();

        if(Kojak.hasStarted()){
            console.log('includedPackages updated. Reload your browser to notice the change.');
        }
    },

    removeIncludedPath: function (pk) {
        var pathIndex = this._values.includedPackages.indexOf(pk);
        Kojak.Core.assert(pathIndex !== -1, 'Package is not currently included.');

        this._values.includedPackages.splice(pathIndex, 1);
        this._save();

        if(Kojak.hasStarted()){
            console.log('included path removed. Reload your browser to notice the change.');
        }
    },

    getIncludedPackages: function(){
        return this._values.includedPackages;
    },

    isPathExcluded: function(path){
        var i, excludePaths = this._values.excludedPaths, isExcluded = false;

        for(i = 0; i < excludePaths.length; i++){
            if(path.contains(excludePaths[i])){
                isExcluded = true;
                break;
            }
        }

        return isExcluded;
    },

    getExcludedPaths: function(){
        return this._values.excludedPaths;
    },

    addExcludedPath: function (path) {
        Kojak.Core.assert(this._values.excludedPaths.indexOf(path) === -1, 'Path is already excluded');

        this._values.excludedPaths.push(path);
        this._save();

        if(Kojak.hasStarted()){
            console.log('excluded paths updated. Reload your browser to notice the change.');
        }
    },

    removeExcludedPath: function (path) {
        var pathIndex = this._values.excludedPaths.indexOf(path);
        Kojak.Core.assert(pathIndex !== -1, 'Path is not currently excluded.');

        this._values.excludedPaths.splice(pathIndex, 1);
        this._save();

        if(Kojak.hasStarted()){
            console.log('excluded paths updated. Reload your browser to notice the change.');
        }
    },

    setExcludedPaths: function (paths) {
        Kojak.Core.assert(Kojak.Core.isArray(paths), 'Only pass an array of strings for the excluded paths');

        this._values.excludedPaths = paths;
        this._save();

        if(Kojak.hasStarted()){
            console.log('excludePaths updated. Reload your browser to notice the change.');
        }
    },

    getAutoStartDelay: function(){
        return this._values.autoStartDelay;
    },

    _isAutoStartDelayValid: function(delay){
        return delay > 0 && delay < 100000;
    },

    setAutoStartDelay: function (delay) {
        Kojak.Core.assert(this._isAutoStartDelayValid(delay), 'The autoStartDelay option should be true or false');
        this._values.autoStartDelay = delay;
        this._save();

        if(Kojak.hasStarted()){
            console.log('autoStartDelay updated. Reload your browser to notice the change.');
        }
    },

    getRealTimeFunctionLogging: function(){
        return this._values.realTimeFunctionLogging;
    },

    setRealTimeFunctionLogging: function(val){
        Kojak.Core.assert(val === true || val === false, 'The realTimeFunctionLogging option should be true or false');

        this._values.realTimeFunctionLogging = val;
        this._save();

        if(Kojak.hasStarted()){
            console.log('realTimeFunctionLogging updated. Changes should be reflected immediately if Kojak has already started profiling.');
        }

        if(val){
            console.log('WARNING, your browser might get very slow and your console might be overrun with kojak function logging...');
        }
    },

    _save: function () {
        localStorage.setItem('kojak', JSON.stringify(this._values));
    },

    _loadLocalStorage: function () {
        var storageString = localStorage.getItem('kojak');
        var config = JSON.parse(storageString);

        // a simple check to see if the storage item resembles a kojak config item
        Kojak.Core.assert(config.version, 'There is no version in the item \'kojak\' in localStorage.  It looks wrong.');

        this._upgradeConfig(config);
        return config;
    },

    _upgradeConfig: function (config) {
        while (config.version !== Kojak.Config.CURRENT_VERSION) {
            switch (config.version) {
                case 1:
                    // upgrade from v1 to v2
                    break;
                case 2:
                    // upgrade from v2 to v3
                    break;

                default:
                    throw 'Unknown version found in your configuration ' + config.version;
            }
        }
    },

    _createDefaults: function () {
        return {
            version: Kojak.Config.CURRENT_VERSION,
            realTimeFunctionLogging: false,
            includedPackages: [],
            excludePaths: [],
            autoStart: Kojak.Config.AUTO_START_NONE
        };
    }

};

Kojak.Formatter = {
    makeTabs: function(num){
        var tabs = '';
        for (var level = 0; level < num; level++) {
            tabs += '\t';
        }
        return tabs;
    },

    appendPadding: function(val, paddingLength){
        while(val.length < paddingLength){
            val += ' ';
        }

        return val;
    },

    millis: function(num){
        var numAsString, decimals, integers, integerCount, integersWithCommas = '';
        numAsString = num.toFixed(2);
        decimals =  numAsString.substring(numAsString.indexOf('.'));
        integers = numAsString.replace(decimals, '');
        integers = integers.split('').reverse();

        for(integerCount = 0; integerCount < integers.length; integerCount++){
            integersWithCommas = integers[integerCount] + integersWithCommas;

            if((integerCount+1) < integers.length && (integerCount+1) % 3 === 0){
                integersWithCommas = ',' + integersWithCommas;
            }
        }

        if(decimals === '.00'){
            decimals = '';
        }

        return integersWithCommas + decimals;
    },

    formatReport: function(report){
        var rowCount, row, rowString, fieldCount, fieldVal, fieldWidths = [];

        Kojak.Core.assert(Kojak.Core.isArray(report), 'Reports are simply 2d arrays');

        // First calculate the field widths, format numbers
        for(rowCount = 0; rowCount < report.length; rowCount++){
            row = report[rowCount];

            for(fieldCount = 0; fieldCount < row.length; fieldCount++){
                fieldVal = row[fieldCount];

                if(Kojak.Core.isNumber(fieldVal)){
                    row[fieldCount] = fieldVal = Kojak.Formatter.millis(fieldVal);
                }

                fieldVal += '  ';

                if(!fieldWidths[fieldCount]){
                    fieldWidths[fieldCount] = fieldVal.length;
                }
                else if(fieldVal.length > fieldWidths[fieldCount]){
                    fieldWidths[fieldCount] = fieldVal.length;
                }
            }
        }

        // Now actually render the values with proper padding
        for(rowCount = 0; rowCount < report.length; rowCount++){
            row = report[rowCount];
            rowString = '';

            for(fieldCount = 0; fieldCount < row.length; fieldCount++){
                rowString +=  Kojak.Formatter.appendPadding(row[fieldCount], fieldWidths[fieldCount]);
            }

            console.log(rowString);
        }
    }
};

Kojak.FunctionProfile = function (instrumentor, container, functionName, origFunction) {
    var _this = this;

    this._instrumentor = instrumentor;
    this._container = container;
    this._functionName = functionName;
    this._origFunction = origFunction;
    this._kojakPath = container._kContainerProfile.getKojakPath() + '.' + functionName;

    this._startTimes = [];
    this._callCount = 0;
    this._callPaths = {};
    this._wholeTime = 0;
    this._isolatedTime = 0;

    this._wrappedFunction = function(){
        _this._instrumentor.recordStartFunction(_this);
        var returnValue = origFunction.apply(this, arguments);
        _this._instrumentor.recordStopFunction(_this);

        return returnValue;
    };

    this._wrappedFunction._kFunctionProfile = this;
};

Kojak.Core.extend(Kojak.FunctionProfile.prototype, {
    getContainer: function(){
        return this._container;
    },

    getFunctionName: function(){
        return this._functionName;
    },

    getOrigFunction: function(){
        return this._origFunction;
    },

    getWrappedFunction: function(){
        return this._wrappedFunction;
    },

    getKojakPath: function(){
        return this._kojakPath;
    },

    pushStartTime: function(startTime, callPath){
        this._startTimes.push(startTime);
        this._callCount++;

        if(!this._callPaths[callPath]){
            this._callPaths[callPath] = 1;
        }
        else {
            this._callPaths[callPath]++;
        }
    },

    popStartTime: function(){
        return this._startTimes.pop();
    },

    addWholeTime: function(addMe){
        this._wholeTime += addMe;
    },

    addIsolatedTime: function(addMe){
        this._isolatedTime += addMe;
    },

    getWholeTime: function(){
        return this._wholeTime;
    },

    getCallCount: function(){
        return this._callCount;
    },

    getIsolatedTime: function(){
        return this._isolatedTime;
    }
});

Kojak.ContainerProfile = function(kojakPath){
    Kojak.Core.assert(kojakPath);
    this._kojakPath = kojakPath;
    this._packageProfiles = {};
    this._classFunctionProfiles = {};
    this._classProtoProfiles = {};
    this._allClassProfiles = {};
    this._functionProfiles = {};
};

Kojak.Core.extend(Kojak.ContainerProfile.prototype, {
    getKojakPath: function(){
        return this._kojakPath;
    },

    addPackageProfile: function(packageProfile){
        Kojak.Core.assert(!this._packageProfiles[packageProfile.getKojakPath()], 'why was the same package profile added twice');
        this._packageProfiles[packageProfile.getKojakPath()] = packageProfile;
    },

    getPackageProfiles: function(){
        return this._packageProfiles;
    },

    addClassFunctionProfile: function(classFunctionProfile){
        Kojak.Core.assert(!this._classFunctionProfiles[classFunctionProfile.getKojakPath()], 'why was the same class function profile added twice');
        this._classFunctionProfiles[classFunctionProfile.getKojakPath()] = classFunctionProfile;
        this._allClassProfiles[classFunctionProfile.getKojakPath()] = classFunctionProfile;
    },

    getClassFunctionProfiles: function(){
        return this._classFunctionProfiles;
    },

    addClassProtoProfile: function(classProtoProfile){
        Kojak.Core.assert(!this._classProtoProfiles[classProtoProfile.getKojakPath()], 'why was the same class proto profile added twice');
        this._classProtoProfiles[classProtoProfile.getKojakPath()] = classProtoProfile;
        this._allClassProfiles[classProtoProfile.getKojakPath()] = classProtoProfile;
    },

    getClassFunctionKojakPaths: function(){
        return Kojak.Core.getKeys(this._classFunctionProfiles);
    },

    getClassProtoKojakPaths: function(){
        return Kojak.Core.getKeys(this._classProtoProfiles);
    },

    getAllClassKojakPaths: function(){
        return this.getClassFunctionKojakPaths().concat(this.getClassProtoKojakPaths());
    },

    addFunctionProfile: function(functionProfile){
        Kojak.Core.assert(!this._functionProfiles[functionProfile.getKojakPath()], 'why was the same function profile added twice');
        this._functionProfiles[functionProfile.getKojakPath()] = functionProfile;
    },

    getFunctionProfiles: function(){
        return this._functionProfiles;
    },

    getFunctionProfileKojakPaths: function(){
        return Kojak.Core.getKeys(this._functionProfiles);
    },

    getAllClassProfiles: function(){
        return this._allClassProfiles;
    },

    getImmediateFunctionCount: function(){
        return Kojak.Core.getPropCount(this._functionProfiles);
    }
});

// It's possible I might reuse this instance in multiple contexts.  Make it a proto class instead of an object with functions

Kojak.Instrumentor = function () {
    this._hasInstrumented = false;
    this._instrumentedPackageProfiles = {};
    this._currentPackageProfile = undefined;
    this._instrumentedFunctionProfiles = [];

    this._stackLevel = -1;
    this._stackLevelCumTimes = {};
    this._stackContexts = [];
};

Kojak.Core.extend(Kojak.Instrumentor.prototype, {

    instrument: function () {
        try {
            if (this._hasInstrumented) {
                throw 'Code already instrumented';
            }

            console.log('Kojak instrumenting root packages: ', Kojak.Config.getIncludePackages());
            this._hasInstrumented = true;
            this._instrumentPackages();
            this._repairClassReferences();
            console.log('Kojak has completed instrumenting packages.  Run Kojak.Report.instrumentedPackages() to see what has been instrumented');
        }
        catch (exception) {
            console.log('Error, Kojak instrument has failed ', exception);
            console.log('Stack:\n', exception.stack);
        }
    },

    _instrumentPackages: function () {
        var packageName, pkg, objName, obj;

        this._curPackageNameStack = Kojak.Config.getIncludePackages().slice(0);

        // go through each packages children
        while (this._curPackageNameStack.length > 0) {
            packageName = this._curPackageNameStack.pop();
            pkg = Kojak.Core.getContext(packageName);

            if(this._shouldIgnore(packageName, pkg)){
                continue;
            }

            if (!pkg) {
                console.log('The package \'' + packageName + '\' could not be found.');
            }
            else {
                // Check if the package has already been instrumented, this is possible if there are multiple references to the same class
                if (!pkg.hasOwnProperty('_kContainerProfile')) {
                    pkg._kContainerProfile = new Kojak.ContainerProfile(packageName);
                    this._currentPackageProfile = this._instrumentedPackageProfiles[packageName] = pkg._kContainerProfile;

                    // Locate the package's Classes, Functions or nested Packages
                    for (objName in pkg) {
                        if (pkg.hasOwnProperty(objName)) {

                            obj = pkg[objName];

                            // Make sure the value is actually defined
                            if (obj) {
                                this._instrumentObj(pkg, objName, obj);
                            }
                        }
                    }
                }
                else {
//                    console.log('skipping duplicate package ', packageName);
                }
            }
        }
    },

    _instrumentObj: function(parent, objName, obj){
        var objKojakType = Kojak.Core.inferKojakType(objName, obj), parentKojakType;

        if(objName !== '_kContainerProfile'){
            switch (objKojakType) {
                case Kojak.Core.CLASS:
                    this._instrumentClass(parent._kContainerProfile.getKojakPath(), objName, obj);
                    break;

                case Kojak.Core.FUNCTION:
                    this._instrumentFunction(parent, objName, obj);
                    break;

                case Kojak.Core.PACKAGE:
                    parentKojakType = Kojak.Core.inferKojakType(parent._kContainerProfile.getKojakPath(), parent);

                    // Only recurse down nested packages if the parent is also a package
                    if(parentKojakType === Kojak.Core.PACKAGE){
                        this._curPackageNameStack.push(parent._kContainerProfile.getKojakPath() + '.' + objName);
                    }
                    break;
            }
        }
    },

    _instrumentClass: function (kojakPath, className, clazz) {
        var classFuncProfile, classProtoProfile;

        classFuncProfile = this._instrumentClassContainer(kojakPath, className, clazz);
        if(classFuncProfile){
            this._currentPackageProfile.addClassFunctionProfile(classFuncProfile);
        }

        classProtoProfile = this._instrumentClassContainer(kojakPath, className + '.prototype', clazz.prototype);
        if(classProtoProfile){
            this._currentPackageProfile.addClassProtoProfile(classProtoProfile);
        }
    },

    _instrumentClassContainer: function(kojakPath, className, container){
        var obj;

        if(!this._shouldIgnore(className, container) ){
            container._kContainerProfile = new Kojak.ContainerProfile(kojakPath + '.' + className);

            for(var objName in container){
                if (container.hasOwnProperty(objName)) {
                    obj = container[objName];

                    if(obj){
                        this._instrumentObj(container, objName, obj);
                    }
                }
            }

            return container._kContainerProfile;
        }
    },

    _instrumentFunction: function(container, functionName, funkshun){
        var functionProfile;

        if(!this._shouldIgnore(container._kContainerProfile.getKojakPath() + '.' + functionName, funkshun)){
            functionProfile = new Kojak.FunctionProfile(this, container, functionName, funkshun);
            container[functionName] = functionProfile.getWrappedFunction();
            this._instrumentedFunctionProfiles.push(functionProfile);
            container._kContainerProfile.addFunctionProfile(functionProfile);
        }
        else {
//            console.log('Skipping duplicate function', container._kojakPath + '.' + functionName);
        }
    },

    _shouldIgnore: function(path, container){
        var shouldIgnore = false;

        if(path === 'constructor'){
            shouldIgnore = true;
        }

        if(!shouldIgnore && container.hasOwnProperty){
            shouldIgnore = container.hasOwnProperty('_kContainerProfile') || container.hasOwnProperty('_kFunctionProfile');
        }

        if(!shouldIgnore){
            shouldIgnore = Kojak.Config.isPathExcluded(path);
        }

        return shouldIgnore;
    },

    // Occasionally you might have references to classes and the reference was profiled before the class.  This happens
    // especially with mixins to classes.  In this case, repair the wrapped reference to the class by unwrapping it.
    _repairClassReferences: function(){
        var i, fProfile, fixedIndexes = [];

        for(i = 0; i < this._instrumentedFunctionProfiles.length; i++){
            fProfile = this._instrumentedFunctionProfiles[i];
            if(fProfile.getOrigFunction()._kContainerProfile){
                // Restore the original function / class reference that is not wrapped
                fProfile.getContainer()[fProfile.getFunctionName()] = fProfile.getOrigFunction();
                fixedIndexes.push(i);
            }
        }

        fixedIndexes.forEach(function(fixedIndex){
            this._instrumentedFunctionProfiles.splice(fixedIndex, 1);
        }.bind(this));
    },

    // Only should be called from FunctionProfile
    recordStartFunction: function (functionProfile) {
        this._stackLevel++;
        this._stackLevelCumTimes[this._stackLevel] = 0;
        this._stackContexts[this._stackLevel] = functionProfile.getKojakPath();

        functionProfile.pushStartTime(new Date(), this._stackContexts.join(' > '));

        if (Kojak.Config.getRealTimeFunctionLogging()) {
            console.log(Kojak.Formatter.makeTabs(this._stackLevel) + 'start: ' + functionProfile.getKojakPath(), Kojak.Formatter.millis(functionProfile.getIsolatedTime()));
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
            console.log(Kojak.Formatter.makeTabs(this._stackLevel + 1) + 'stop:  ' + functionProfile.getKojakPath(), Kojak.Formatter.millis(functionProfile.getIsolatedTime()));
        }
    },

    getInstrumentedPackageProfiles: function(){
        return this._instrumentedPackageProfiles;
    }
});
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


Kojak._hasStarted = false;

Kojak.hasStarted = function(){
    return Kojak._hasStarted;
};

// Loads configuration from local storage
Kojak.Config.load();
Kojak._instrumentor = new Kojak.Instrumentor();

Kojak.start = function(){
    console.log('starting Kojak now');
    Kojak._instrumentor.instrument();
    Kojak._hasStarted = true;
};

switch(Kojak.Config.getAutoStart()){
    case Kojak.Config.AUTO_START_IMMEDIATE:
        Kojak.start();
        break;
    case Kojak.Config.AUTO_ON_JQUERY_LOAD:
        if(!window.$ || !window.$.ready){
            $.ready(function(){
                Kojak.start();
            });
        }
        else {
            console.log('Kojak autoStart set to ' + Kojak.Config.AUTO_ON_JQUERY_LOAD + ' but JQuery not found.');
        }
        break;
    case Kojak.Config.AUTO_DELAYED:
        setTimeout(function(){
            Kojak.start();
        }, Kojak.Config.getAutoStartDelay());
        break;
}



