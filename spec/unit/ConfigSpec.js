describe('Config suite', function() {

    beforeEach(function(){
        localStorage.removeItem(Kojak.Config._LOCAL_STORAGE_KEY);
        localStorage.removeItem(Kojak.Config._LOCAL_STORAGE_BACKUP_KEY);

        spyOn(Kojak.Config, '_createDefaults').andCallThrough();
        spyOn(Kojak.Config, '_save').andCallThrough();
    });

    it('Config basic existence', function() {
        expect(Kojak.Config).toBeDefined();
        expect(Kojak.Config.CURRENT_VERSION).toBeDefined();
        expect(Kojak.Config.AUTO_START_NONE).toBeDefined();
        expect(Kojak.Config.AUTO_START_IMMEDIATE).toBeDefined();
        expect(Kojak.Config.AUTO_ON_JQUERY_LOAD).toBeDefined();
        expect(Kojak.Config.AUTO_START_DELAYED).toBeDefined();
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
        expect(function(){Kojak.Config.setIncludedPakages('a');}).toThrow();
    });

    it('Config.saveBackup with nothing in localStorage', function(){
        expect(Kojak.Config.saveBackup).toThrow();
    });

    it('Config.saveBackup with something in localStorage', function(){
        Kojak.Config.load();
        expect(Kojak.Config.saveBackup).not.toThrow();
    });

    it('Config.restore with nothing in localStorage', function(){
        expect(Kojak.Config.restoreBackup).toThrow();
    });

    it('Config.restoreBackup with something in localStorage', function(){
        Kojak.Config.load();
        Kojak.Config.saveBackup();
        expect(Kojak.Config.saveBackup).not.toThrow();
    });

    it('Config.setAutoStartInstrumentation with bad input', function(){
        expect(function(){Kojak.Config.setAutoStartInstrumentation()}).toThrow();
        expect(function(){Kojak.Config.setAutoStartInstrumentation('string')}).toThrow();
        expect(function(){Kojak.Config.setAutoStartInstrumentation({})}).toThrow();
    });

    it('Config.setAutoStartInstrumentation with good input', function(){
        Kojak.instrumentor = {hasInstrumented: function(){return true;}};
        expect(function(){Kojak.Config.setAutoStartInstrumentation(Kojak.Config.AUTO_START_NONE)}).not.toThrow();
        expect(function(){Kojak.Config.setAutoStartInstrumentation(Kojak.Config.AUTO_START_IMMEDIATE)}).not.toThrow();

        expect(Kojak.Config.getAutoStartDelay()).toBeUndefined();
        expect(Kojak.Config.getAutoStartDelay).toBeDefined();
        expect(function(){Kojak.Config.setAutoStartInstrumentation(Kojak.Config.AUTO_START_DELAYED)}).not.toThrow();
        expect(Kojak.Config.getAutoStartDelay()).toBeDefined();

        expect(function(){Kojak.Config.setAutoStartInstrumentation(Kojak.Config.AUTO_ON_JQUERY_LOAD)}).not.toThrow();
    });

});