// It's possible I might reuse this instance in multiple contexts.  Make it a proto class instead of an object with functions

Kojak.Instrumentor = function () {
    this._hasInstrumented = false;
    this._packageProfiles = {};
    this._currentPackageProfile = undefined;
    this._functionProfiles = [];

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

            console.log('Kojak instrumenting root packages: ', Kojak.Config.getIncludedPackages());
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

        this._curPackageNameStack = Kojak.Config.getIncludedPackages().slice(0);

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
                    this._currentPackageProfile = this._packageProfiles[packageName] = pkg._kContainerProfile;

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
            this._functionProfiles.push(functionProfile);
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

        for(i = 0; i < this._functionProfiles.length; i++){
            fProfile = this._functionProfiles[i];
            if(fProfile.getOrigFunction()._kContainerProfile){
                // Restore the original function / class reference that is not wrapped
                fProfile.getContainer()[fProfile.getFunctionName()] = fProfile.getOrigFunction();
                fixedIndexes.push(i);
            }
        }

        fixedIndexes.forEach(function(fixedIndex){
            this._functionProfiles.splice(fixedIndex, 1);
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

    getPackageProfiles: function(){
        return this._packageProfiles;
    },

    getFunctionProfiles: function(){
        return this._functionProfiles;
    }
});