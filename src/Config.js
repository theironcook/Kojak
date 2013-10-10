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
            excludedPaths: [],
            autoStart: Kojak.Config.AUTO_START_NONE
        };
    }

};