describe('FunctionProfile suite', function() {
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

    it('FunctionProfile call metrics after invocation', function() {
        var functionProfile, container;

        Kojak.instrumentor = {
            recordStartFunction: function(fProfile){},
            recordStopFunction: function(fProfile){fProfile._callCount++;}
        };

        container = {_kPath: 'parent', func: function(){}};
        functionProfile = new Kojak.FunctionProfile(container, 'foo', container.func);
        container['func'] = functionProfile.getWrappedFunction();

        container.func();
        expect(functionProfile.getCallCount()).toBe(1);
        expect(functionProfile.getProperty('CallCount')).toBe(1);
    });
});