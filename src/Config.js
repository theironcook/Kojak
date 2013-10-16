Kojak.Config = {

    // enums / constants
    CURRENT_VERSION: 1,
    AUTO_START_NONE: 'none',
    AUTO_START_IMMEDIATE: 'immediate',
    AUTO_ON_JQUERY_LOAD: 'on_jquery_load',
    AUTO_DELAYED: 'delayed',

    load: function () {
        if (localStorage.getItem('kojak')) {
            this._configValues = this._loadLocalStorage();
        }
        else {
            this._configValues = this._createDefaults();
            this._save();
        }
    },

    saveBackup: function(){
        Kojak.Core.assert(localStorage.getItem('kojak'), 'kojak not defined yet in local storage');
        localStorage.setItem('kojak_backup', localStorage.getItem('kojak'));
    },

    restoreBackup: function(){
        Kojak.Core.assert(localStorage.getItem('kojak_backup'), 'no backup existed in local storage');
        localStorage.setItem('kojak', localStorage.getItem('kojak_backup'));
        this._configValues = this._loadLocalStorage();
    },

    getAutoStartInstrumentation: function(){
        return this._configValues.autoStartInstrumentation;
    },

    setAutoStartInstrumentation: function (val) {
        Kojak.Core.assert([Kojak.Config.AUTO_START_NONE, Kojak.Config.AUTO_START_IMMEDIATE, Kojak.Config.AUTO_ON_JQUERY_LOAD, Kojak.Config.AUTO_DELAYED].indexOf(val) !== -1, 'Invalid auto start option \'' + val + '\'.');

        this._configValues.autoStartInstrumentation = val;
        this._save();

        console.log('autoStartInstrumentation updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change.');
        }

        if(val === Kojak.Config.AUTO_DELAYED && !this._isAutoStartDelayValid(this.getAutoStartDelay())){
            console.log('setting a default auto start delay');
            this.setAutoStartDelay(4000);
        }
    },

    getEnableNetWatcher: function(){
        return this._configValues.enableNetWatcher;
    },

    setEnableNetWatcher: function (val) {
        Kojak.Core.assert(Kojak.Core.isBoolean(val), 'Invalid enableNetWatcher option \'' + val + '\'.');

        this._configValues.enableNetWatcher = val;
        this._save();

        console.log('enableNetWatcher updated');
        console.log('reload your browser to notice the change.');
    },

    // *****************************************************************************************************************
    // Included packages
    addIncludedPackage: function (pkg) {
        Kojak.Core.assert(this._configValues.includedPackages.indexOf(pkg) === -1, 'Package is already included');

        this._configValues.includedPackages.push(pkg);
        this._save();

        console.log('includedPackages updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change');
        }
    },

    setIncludedPackages: function (pks) {
        Kojak.Core.assert(Kojak.Core.isArray(pks), 'Only pass an array of strings for the included package names');

        this._configValues.includedPackages = pks;
        this._save();

        console.log('includedPackages updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change.');
        }
    },

    removeIncludedPackage: function (pkg) {
        var pathIndex = this._configValues.includedPackages.indexOf(pkg);
        Kojak.Core.assert(pathIndex !== -1, 'Package is not currently included.');

        this._configValues.includedPackages.splice(pathIndex, 1);
        this._save();

        console.log('included path removed');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change.');
        }
    },

    getIncludedPackages: function(){
        return this._configValues.includedPackages;
    },
    // Included packages
    // *****************************************************************************************************************

    // *****************************************************************************************************************
    // Excluded paths
    arePathsExcluded: function(){
        var args = Array.prototype.slice.call(arguments), i, path;

        for(i = 0; i < args.length; i++){
            path = args[i];

            if(this.isPathExcluded(path)){
                return true;
            }
        }

        return false;
    },

    isPathExcluded: function(path){
        var i, excludePaths = this._configValues.excludedPaths, isExcluded = false;

        for(i = 0; i < excludePaths.length; i++){
            if(path.contains(excludePaths[i])){
                isExcluded = true;
                break;
            }
        }

        return isExcluded;
    },

    getExcludedPaths: function(){
        return this._configValues.excludedPaths;
    },

    addExcludedPath: function (path) {
        Kojak.Core.assert(this._configValues.excludedPaths.indexOf(path) === -1, 'Path is already excluded');

        this._configValues.excludedPaths.push(path);
        this._save();

        console.log('excluded paths updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change.');
        }
    },

    removeExcludedPath: function (path) {
        var pathIndex = this._configValues.excludedPaths.indexOf(path);
        Kojak.Core.assert(pathIndex !== -1, 'Path is not currently excluded.');

        this._configValues.excludedPaths.splice(pathIndex, 1);
        this._save();

        console.log('excluded paths updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change.');
        }
    },

    setExcludedPaths: function (paths) {
        Kojak.Core.assert(Kojak.Core.isArray(paths), 'Only pass an array of strings for the excluded paths');

        this._configValues.excludedPaths = paths;
        this._save();

        console.log('excludePaths updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change.');
        }
    },
    // Excluded paths
    // *****************************************************************************************************************

    getAutoStartDelay: function(){
        return this._configValues.autoStartDelay;
    },

    _isAutoStartDelayValid: function(delay){
        return delay > 0 && delay < 100000;
    },

    setAutoStartDelay: function (delay) {
        Kojak.Core.assert(this._isAutoStartDelayValid(delay), 'The autoStartDelay option should be a valid number in milliseconds');
        this._configValues.autoStartDelay = delay;
        this._save();

        console.log('set autoStartDelay to ' + delay + ' milliseconds');

        if(this.getAutoStart() !== Kojak.Config.AUTO_DELAYED){
            console.log('warning, the auto start is not current auto delayed.');
        }

        console.log('autoStartDelay updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('reload your browser to notice the change.');
        }
    },

    getRealTimeFunctionLogging: function(){
        return this._configValues.realTimeFunctionLogging;
    },

    setRealTimeFunctionLogging: function(val){
        Kojak.Core.assert(val === true || val === false, 'The realTimeFunctionLogging option should be true or false');

        this._configValues.realTimeFunctionLogging = val;
        this._save();

        console.log('realTimeFunctionLogging updated');
        if(Kojak.instrumentor.hasInstrumented()){
            console.log('changes should be reflected immediately');
        }
    },

    _save: function () {
        localStorage.setItem('kojak', JSON.stringify(this._configValues));
    },

    _loadLocalStorage: function () {
        var storageString = localStorage.getItem('kojak');
        var configValues = JSON.parse(storageString);

        // a simple check to see if the storage item resembles a kojak config item
        Kojak.Core.assert(configValues.version, 'There is no version in the item \'kojak\' in localStorage.  It looks wrong.');

        this._upgradeConfig(configValues);
        return configValues;
    },

    _upgradeConfig: function (configValues) {
        while (configValues.version !== Kojak.Config.CURRENT_VERSION) {
            switch (configValues.version) {
                case 1:
                    // Example
                    // console.log('upgrading Kojak config from v1 to v2');
                    // add config values or modify existing ones
                    // configValues.version = 2;
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
            excludedPaths: [],
            autoStartInstrumentation: Kojak.Config.AUTO_START_NONE,
            enableNetWatcher: false
        };
    }

};