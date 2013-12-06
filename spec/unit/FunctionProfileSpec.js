describe('FunctionProfile suite', function() {

    var blockThread = function (waitInMillis) {
        var start = Date.now() - 0;
        var stop = start + waitInMillis;

        while ((Date.now() - 0) < stop) {
        }
    };

    // Spoof the instrumentor. there is a close relationship between profiles and the instrumentor
    // assumes tests will not call functions recursively
    Kojak.instrumentor = {
        recordStartFunction: function(fProfile){
            fProfile.pushStartTime(Date.now(), 'parent');
        },
        recordStopFunction: function(fProfile){
            var startTime = fProfile.popStartTime();
            var callTime = Date.now() - startTime;

            fProfile.recordCallMetrics('', callTime, callTime);
        }
    };

    it('FunctionProfile constructor with bad args', function() {
        expect(Kojak.FunctionProfile).toBeDefined();

        expect(function(){new Kojak.FunctionProfile()}).toThrow();
        expect(function(){new Kojak.FunctionProfile({}, 'name', 'not a function')}).toThrow();
        expect(function(){new Kojak.FunctionProfile({}, {}, function(){})}).toThrow();
        expect(function(){new Kojak.FunctionProfile({iHaveNoKPath: ''}, '', function(){})}).toThrow();
    });

    it('FunctionProfile constructor with good args', function() {
        expect(function(){new Kojak.FunctionProfile({_kPath: 'something'}, 'name', function(){})}).not.toThrow();
    });

    it('FunctionProfile kPath set right', function() {
        var functionProfile;

        functionProfile = new Kojak.FunctionProfile({_kPath: 'gParent.parent'}, 'foo', function(){});
        expect(functionProfile.getKPath()).toEqual('gParent.parent.foo');

        functionProfile = new Kojak.FunctionProfile({_kPath: 'gParent.parent'}, 'foo', function(){});
        expect(functionProfile.getKPath()).toEqual('gParent.parent.foo');
    });

    it('FunctionProfile wrapped function', function() {
        var functionProfile, container;

        container = {_kPath: 'parent', func: function(){}};
        functionProfile = new Kojak.FunctionProfile(container, 'foo', container.func);

        expect(functionProfile.getWrappedFunction()).toBeDefined();
        expect(functionProfile.getOrigFunction()).toEqual(container.func);
        expect(functionProfile.getFunctionName()).toEqual('foo');
    });

    it('FunctionProfile accidentally wrapped constructor', function() {
        var functionProfile, container;

        container = {_kPath: 'parent', Const: function(){}};
        functionProfile = new Kojak.FunctionProfile(container, 'Const', container.Const);
        container['Const'] = functionProfile.getWrappedFunction();

        expect(function(){new container.Const()}).toThrow();
    });

    it('FunctionProfile initial call metrics', function() {
        var functionProfile, container;

        container = {_kPath: 'parent', func: function(){}};
        functionProfile = new Kojak.FunctionProfile(container, 'foo', container.func);

        expect(functionProfile.getWholeTime()).toBe(0);
        expect(functionProfile.getWholeTime_Checkpoint()).toBe(0);
        expect(functionProfile.getIsolatedTime()).toBe(0);
        expect(functionProfile.getIsolatedTime_Checkpoint()).toBe(0);
        expect(functionProfile.getCallCount()).toBe(0);
        expect(functionProfile.getCallCount_Checkpoint()).toBe(0);
    });

    it('FunctionProfile metrics after invocation', function() {
        var functionProfile, container, blockWait = 25;

        container = {_kPath: 'parent', func: function(){
            blockThread(blockWait);
        }};

        functionProfile = new Kojak.FunctionProfile(container, 'foo', container.func);
        container['func'] = functionProfile.getWrappedFunction();

        container.func();
        expect(functionProfile.getCallCount()).toBe(1);
        expect(functionProfile.getProperty('CallCount')).toBe(1);
        expect(Math.abs(functionProfile.getIsolatedTime() - blockWait) < 5).toBeTruthy();
        expect(Math.abs(functionProfile.getWholeTime() - blockWait) < 5).toBeTruthy();

        container.func();
        expect(functionProfile.getCallCount()).toBe(2);
        expect(functionProfile.getProperty('CallCount')).toBe(2);

        expect(Math.abs(functionProfile.getIsolatedTime() - (2*blockWait)) < 5).toBeTruthy();
        expect(Math.abs(functionProfile.getWholeTime() - (2*blockWait)) < 5).toBeTruthy();
    });

    it('FunctionProfile checkpoint metrics after invocation', function() {
        var functionProfile, container, blockWait = 10, i;

        container = {_kPath: 'parent', func: function(){
            blockThread(blockWait);
        }};

        functionProfile = new Kojak.FunctionProfile(container, 'foo', container.func);
        container['func'] = functionProfile.getWrappedFunction();

        for(i = 0; i < 10; i++){
            container.func();
        }

        functionProfile.takeCheckpoint();

        expect(functionProfile.getCallCount_Checkpoint()).toBe(0);
        expect(functionProfile.getProperty('CallCount_Checkpoint')).toBe(0);
        expect(functionProfile.getIsolatedTime_Checkpoint()).toBe(0);
        expect(functionProfile.getWholeTime_Checkpoint()).toBe(0);

        for(i = 0; i < 10; i++){
            container.func();
        }

        expect(functionProfile.getCallCount_Checkpoint()).toBe(10);
        expect(functionProfile.getProperty('CallCount_Checkpoint')).toBe(10);
        expect(Math.abs(functionProfile.getIsolatedTime_Checkpoint() - (10*blockWait)) < 5).toBeTruthy();
        expect(Math.abs(functionProfile.getWholeTime_Checkpoint() - (10*blockWait)) < 5).toBeTruthy();
    });
});