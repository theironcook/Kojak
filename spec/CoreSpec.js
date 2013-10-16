describe('Core suite', function() {
    it('Core basic existence', function() {
        expect(Kojak).toBeDefined();
        expect(Kojak.Core).toBeDefined();
        expect(Kojak.Core.CLAZZ).toBeDefined();
        expect(Kojak.Core.FUNCTION).toBeDefined();
        expect(Kojak.Core.PAKAGE).toBeDefined();
    });

    it('Core.extend basics', function() {
        var parentA = {};

        // Basic extend with no conflicts
        expect(Kojak.Core.extend({a: parentA}).a).toBe(parentA);
        expect(Kojak.Core.extend({}, {a: parentA}).a).toBe(parentA);
        expect(Kojak.Core.extend({a: parentA}, {}).a).toBe(parentA);
    });

    it('Core.extend with conflicts', function() {
        var parentA = {}, childA = {};

        // Extend with conflicts, last one wins
        expect(Kojak.Core.extend({a: parentA}, {a: childA}).a).toBe(childA);
        expect(Kojak.Core.extend({a: childA}, {a: parentA}).a).toBe(parentA);
        expect(Kojak.Core.extend({a: parentA}, {a: parentA}, {a: childA}).a).toBe(childA);
    });

    it('Core.getContext with bad input', function() {
        expect(Kojak.Core.getContext()).toBeUndefined();
        expect(Kojak.Core.getContext(null)).toBeUndefined();
        expect(Kojak.Core.getContext({})).toBeUndefined();
    });

    it('Core.getContext with missing context', function() {
        expect(Kojak.Core.getContext('bogus.context')).toBeUndefined();
    });

    it('Core.getContext with simple context', function() {
        window.simple = {context: {}};
        expect(Kojak.Core.getContext('simple.context')).toBe(window.simple.context);
        window.simple = undefined;
    });

    it('Core.getContext with complex context', function() {
        window.complex = {context: function(){}};
        window.complex.context._something = {};
        expect(Kojak.Core.getContext('complex.context._something')).toBe(window.complex.context._something);
        window.complex = undefined;
    });

    it('Core.isObject', function() {
        expect(Kojak.Core.isObject()).toBe(false);
        expect(Kojak.Core.isObject(null)).toBe(false);
        expect(Kojak.Core.isObject(3.14)).toBe(false);
        expect(Kojak.Core.isObject({})).toBe(true);
        expect(Kojak.Core.isObject(function(){})).toBe(true);
    });

    it('Core.getPropCount', function() {
        var Clazz = function(){};
        Clazz.prototype.a = 'a';
        var obj = new Clazz();

        expect(Kojak.Core.getPropCount({})).toBe(0);
        expect(Kojak.Core.getPropCount({x: 'x'})).toBe(1);
        // Check if hasOwnProperty is used
        expect(obj.a).toBe('a');
        expect(Kojak.Core.getPropCount(obj)).toBe(0);
    });

    it('Core.getKeys', function() {
        expect(Kojak.Core.getKeys({})).toEqual([]);
        expect(Kojak.Core.getKeys({a: 'a'})).toEqual(['a']);
        expect(Kojak.Core.getKeys({a: 'a', b: 'b'})).toEqual(['a', 'b']);
    });

    it('Core.inferKojakType', function() {
        expect(Kojak.Core.inferKojakType('func')).toBeUndefined();
        expect(Kojak.Core.inferKojakType('func', 3.14)).toBeUndefined();
        expect(Kojak.Core.inferKojakType('func', 'blah')).toBeUndefined();

        expect(Kojak.Core.inferKojakType('func', function(){})).toBe(Kojak.Core.FUNCTION);
        expect(Kojak.Core.inferKojakType('_func', function(){})).toBe(Kojak.Core.FUNCTION);
        expect(Kojak.Core.inferKojakType('_Func', function(){})).toBe(Kojak.Core.FUNCTION);
        expect(Kojak.Core.inferKojakType('Class', function(){})).toBe(Kojak.Core.CLAZZ);
        expect(Kojak.Core.inferKojakType('whatever', {})).toBe(Kojak.Core.PAKAGE);
    });
});