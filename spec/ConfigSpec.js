describe('Config suite', function() {


    beforeEach(function(){
        localStorage.removeItem('kojak');

        spyOn(Kojak.Config, '_createDefaults').andCallThrough();
        spyOn(Kojak.Config, '_save').andCallThrough();
    });

    it('Config basic existence', function() {
        expect(Kojak.Config).toBeDefined();
        expect(Kojak.Config.CURRENT_VERSION).toBeDefined();
        expect(Kojak.Config.AUTO_START_NONE).toBeDefined();
        expect(Kojak.Config.AUTO_START_IMMEDIATE).toBeDefined();
        expect(Kojak.Config.AUTO_ON_JQUERY_LOAD).toBeDefined();
        expect(Kojak.Config.AUTO_DELAYED).toBeDefined();
    });

    it('Config.load with nothing in storage', function(){
        expect(localStorage.getItem('kojak')).toBeNull();
        Kojak.Config.load();
        expect(localStorage.getItem('kojak')).not.toBeNull();
        expect(Kojak.Config._createDefaults.calls.length).toEqual(1);
        expect(Kojak.Config._save.calls.length).toEqual(1);
    });

    it('Config.load with something correct in storage', function(){
        Kojak.Config.load();
        expect(localStorage.getItem('kojak')).not.toBeNull();
        Kojak.Config.load();
        expect(localStorage.getItem('kojak')).not.toBeNull();
    });

    it('Config.load with something bogus in storage', function(){
        localStorage.setItem('kojak', '{}');
        expect(Kojak.Config.load).toThrow();
    });

    it('Config.setIncludePackages with bogus string parameter', function(){
        var callWithString = function(){
            Kojak.Config.setIncludePackages('a');
        };

        expect(callWithString).toThrow();
    });
});