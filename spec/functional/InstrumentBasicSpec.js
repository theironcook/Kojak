// This is really a functional test, but more useful than strict unit tests
describe('Instrumentor suite', function() {

    beforeEach(function(){
        var blockThread = function (waitInMillis) {
            var start = new Date() - 0;
            var stop = start + waitInMillis;

            while ((new Date() - 0) < stop) {
            }
        };

        window.FakeProject = {
            pakage1: {
                ClassA: function(){},
                ClassB: function(){},
                funcC: function(){}
            },
            pakage2: {
                pakage3 : {
                    ClassC: function(){},
                    funcD: function(){}
                }
            },
            pakage4: {
                ClassD: function(){}
            }
        };

        FakeProject.pakage1.ClassA.staticFuncA = function(){
            blockThread(10);
            (new FakeProject.pakage1.ClassA()).memberFuncA();
        };
        FakeProject.pakage1.ClassA.prototype.memberFuncA = function(){
            blockThread(10);
            (new FakeProject.pakage1.ClassB()).memberFuncB();
        };

        // Simple inheritance
        FakeProject.pakage1.ClassB.prototype = new FakeProject.pakage1.ClassA();
        FakeProject.pakage1.ClassB.prototype.memberFuncB = function(){
            blockThread(10);
        };

        // Treat a Clazz as a Pakage
        FakeProject.pakage1.ClassB.NestedClass = function(){};
        FakeProject.pakage1.ClassB.NestedClass.prototype.nestedFunc = function(){};

        // Duplicate pakage reference - Kojak should be able to handle this and not die
        FakeProject.dupPakageRefA = {};
        FakeProject.dupPakageRefB = FakeProject.dupPakageRefB;

        window.FakeProject.pakage4.ClassD.prototype.classDFunc = function(){};

        Kojak.instrumentor = new Kojak.Instrumentor();
        // Spoof the config to include the right stuff
        Kojak.Config.load();
        Kojak.Config.setIncludedPakages(['FakeProject']);
    });

    it('Basic instrumentation', function() {
        Kojak.instrumentor.instrument();

        expect(FakeProject).toBeDefined();
        expect(FakeProject._kPath).toBe('FakeProject');
        expect(FakeProject.pakage1).toBeDefined();
        expect(FakeProject.pakage1._kPath).toBe('FakeProject.pakage1');
        expect(FakeProject.pakage2._kPath).toBe('FakeProject.pakage2');
        expect(FakeProject.pakage4._kPath).toBe('FakeProject.pakage4');

        expect(FakeProject.pakage1.ClassA._kPath).toBe('FakeProject.pakage1.ClassA');
        expect(FakeProject.pakage1.ClassA.prototype._kPath).toBe('FakeProject.pakage1.ClassA.prototype');
        expect(FakeProject.pakage1.ClassA._kFProfile).toBeUndefined();
        expect(FakeProject.pakage1.ClassA.prototype._kFProfile).toBeUndefined();
        expect(FakeProject.pakage1.ClassA.prototype.memberFuncA).toBeDefined();
        expect(FakeProject.pakage1.ClassA.staticFuncA).toBeDefined();

        expect(FakeProject.pakage1.ClassB.NestedClass._kPath).toBe('FakeProject.pakage1.ClassB.NestedClass');
        expect(FakeProject.pakage1.ClassB.NestedClass.prototype.nestedFunc._kFProfile).toBeDefined();

        expect(FakeProject.pakage1.ClassB.prototype.memberFuncB._kFProfile).toBeDefined();
        expect(FakeProject.pakage4.ClassD._kPath).toBe('FakeProject.pakage4.ClassD');
//        expect(FakeProject.pakage4.ClassD.prototype.classDFunc._kFProfile).toBeDefined();
    });

    it('Instrumentation exclusion at pakage level', function() {
        Kojak.Config.setExcludedPaths(['FakeProject.pakage4']);
        Kojak.instrumentor.instrument();
        expect(FakeProject.pakage4.ClassD._kPath).toBeUndefined();
        expect(FakeProject.pakage4.ClassD.prototype.classDFunc._kFProfile).toBeUndefined();
    });

    it('Instrumentation exclusion at function level', function() {
        Kojak.Config.setExcludedPaths(['FakeProject.pakage4.ClassD.prototype.classDFunc']);
        Kojak.instrumentor.instrument();
        expect(FakeProject.pakage4.ClassD._kPath).toBe('FakeProject.pakage4.ClassD');
        expect(FakeProject.pakage4.ClassD.prototype.classDFunc._kFProfile).toBeUndefined();
    });

    it('Duplicate function references, one is a Clazz', function() {
        FakeProject.pakage1.dupFuncA = FakeProject.pakage1.ClassA.prototype.memberFuncA;
        FakeProject.pakage1.DupFuncB = FakeProject.pakage1.ClassA.prototype.memberFuncA;

        Kojak.instrumentor.instrument();
        expect(FakeProject.pakage1.ClassA.prototype.memberFuncA._kFProfile).not.toBeDefined();
    });

    it('Duplicate function references, none is a Clazz', function() {
        FakeProject.pakage1.dupFuncA = FakeProject.pakage1.ClassA.prototype.memberFuncA;
        FakeProject.pakage1.dupFuncB = FakeProject.pakage1.ClassA.prototype.memberFuncA;

        Kojak.instrumentor.instrument();
        expect(FakeProject.pakage1.ClassA.prototype.memberFuncA._kFProfile).toBeDefined();

        // Each duplicate function should have it's own unique kFProfile
        expect(FakeProject.pakage1.dupFuncA._kFProfile).not.toEqual(FakeProject.pakage1.dupFuncB._kFProfile);

        // Each duplicate function profile should reference the same original function
        expect(FakeProject.pakage1.dupFuncA._kFProfile.getOrigFunction()).toEqual(FakeProject.pakage1.dupFuncB._kFProfile.getOrigFunction());

        // The call counts etc. should be independent even though they wrap the same function
        FakeProject.pakage1.dupFuncA();
        expect(FakeProject.pakage1.dupFuncA._kFProfile.getCallCount()).toEqual(1);
        expect(FakeProject.pakage1.dupFuncB._kFProfile.getCallCount()).toEqual(0);
    });

    it('Measured times look ok', function(){
        Kojak.instrumentor.instrument();
        FakeProject.pakage1.ClassA.staticFuncA();
        expect(FakeProject.pakage1.ClassA.staticFuncA._kFProfile.getCallCount()).toBe(1);
        expect(Math.abs(30 - FakeProject.pakage1.ClassA.staticFuncA._kFProfile.getWholeTime()) < 5).toBeTruthy();
        expect(Math.abs(10 - FakeProject.pakage1.ClassA.staticFuncA._kFProfile.getIsolatedTime()) < 5).toBeTruthy();
    })
});