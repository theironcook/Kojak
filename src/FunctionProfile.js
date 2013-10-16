
Kojak.FunctionProfile = function (container, functionName, origFunction) {
    var _this = this;

    this._container = container;
    this._functionName = functionName;
    this._origFunction = origFunction;
    this._kPath = container._kPath + '.' + functionName;

    this._startTimes = [];
    this._callCount = 0;
    this._callPaths = {};
    this._wholeTime = 0;
    this._isolatedTime = 0;

    this._wrappedFunction = function(){
        Kojak.instrumentor.recordStartFunction(_this);
        var returnValue = origFunction.apply(this, arguments);
        Kojak.instrumentor.recordStopFunction(_this);

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
        return this._kPath;
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

    getProperty: function(propName){
        return this['get' + propName]();
    },

    getWholeTime: function(){
        return this._wholeTime;
    },

    getCallCount: function(){
        return this._callCount;
    },

    getIsolatedTime: function(){
        return this._isolatedTime;
    },

    takeCheckpoint: function(){
        this._callCount_checkpoint = this._callCount;
        this._wholeTime_checkpoint = this._wholeTime;
        this._isolatedTime_checkpoint = this._isolatedTime;
    },

    getCallCount_Checkpoint: function(){
        return this._callCount - this._callCount_checkpoint;
    },

    getWholeTime_Checkpoint: function(){
        return this._wholeTime - this._wholeTime_checkpoint;
    },

    getIsolatedTime_Checkpoint: function(){
        return this._isolatedTime - this._isolatedTime_checkpoint;
    }
});
