// This is really a functional test, but more useful than strict unit tests
describe('Instrumentor suite', function() {

    beforeEach(function(){
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

        FakeProject.pakage1.ClassA.staticFuncA = function(){};
        FakeProject.pakage1.ClassA.prototype.memberFuncA = function(){};
        // Simple inheritance
        FakeProject.pakage1.ClassB.prototype = new FakeProject.pakage1.ClassA();
        FakeProject.pakage1.ClassB.prototype.memberFuncB = function(){};

        // Treat a Clazz as a Pakage
        FakeProject.pakage1.ClassB.NestedClass = function(){};
        FakeProject.pakage1.ClassB.NestedClass.prototype.nestedFunc = function(){};

        FakeProject.pakage1.ClassB.prototype.memberFuncB = function(){};

        // Duplicate pakage reference
        FakeProject.dupPakageRefA = {};
        FakeProject.dupPakageRefB = FakeProject.dupPakageRefB;

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

        expect(FakeProject.pakage1.ClassB.prototype.memberFuncB._kFProfile).toBeDefined();
    });

});