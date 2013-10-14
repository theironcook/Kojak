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

            this._hasInstrumented = true;

            this._instrumentConfigPackages();
            this._instrumentConfigClasses();

            this._repairClassReferences();
            console.log('Kojak has completed instrumenting packages.  Run Kojak.Report.instrumentedCode() to see what has been instrumented');
        }
        catch (exception) {
            console.log('Error, Kojak instrument has failed ', exception);
            console.log('Stack:\n', exception.stack);
        }
    },

    _instrumentConfigPackages: function () {
        var packageName, pkg, objName, obj;

        this._curPackageNameStack = Kojak.Config.getIncludedPackages().slice(0);
        console.log('Kojak instrumenting root packages: ', this._curPackageNameStack);

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
                    pkg._kContainerProfile = new Kojak.ContainerProfile(packageName, pkg);
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
            }
        }
    },

    // Useful if you only want to target a few classes, or if you used a class as a namespace but there are conflicts
    // with other classes in the namespace you want to avoid
    _instrumentConfigClasses: function () {
        // todo
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
        var containerProfile;

        containerProfile = this._instrumentClassContainer(kojakPath, className, clazz);
        if(containerProfile){
            this._currentPackageProfile.addChildContainerProfile(containerProfile);
        }

        containerProfile = this._instrumentClassContainer(kojakPath, className + '.prototype', clazz.prototype);
        if(containerProfile){
            this._currentPackageProfile.addChildContainerProfile(containerProfile);
        }
    },

    _instrumentClassContainer: function(kojakPath, className, container){
        var obj;

        if(!this._shouldIgnore(className, container) ){
            container._kContainerProfile = new Kojak.ContainerProfile(kojakPath + '.' + className, container);

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

        if(!this._shouldIgnoreFunction(container, functionName, funkshun)){
            // Sometimes there are multiple references to the same exact function
            if(funkshun.hasOwnProperty('_kOriginal')){
                // In this case, the function has already been profiled so use the already wrapped function
                container[functionName] = funkshun._kOriginal.getWrappedFunction();
            }
            else {
                functionProfile = new Kojak.FunctionProfile(container, functionName, funkshun);
                container[functionName] = functionProfile.getWrappedFunction();
                this._functionProfiles.push(functionProfile);
                container._kContainerProfile.addChildFunctionProfile(functionProfile);
            }
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

    _shouldIgnoreFunction: function(container, functionName, funkshun){
        if(functionName === 'functionName'){
            return true;
        }
        else {
            return Kojak.Config.isPathExcluded(container._kContainerProfile.getKojakPath() + '.' + functionName);
        }
    },

    // Occasionally you might have references to classes and the reference was profiled before the class.  This happens
    // especially with mixins to classes.  In this case, repair the wrapped reference to the class by unwrapping it.
    // You can't use 'new' with a wrapped function / class
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

    takeCheckpoint: function(){
        this._functionProfiles.forEach(function(functionProfile){
            functionProfile.takeCheckpoint();
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