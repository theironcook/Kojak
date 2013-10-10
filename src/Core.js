window.Kojak = {};

Kojak.Core = {

    // Enums / constants for non config code
    CLASS: 'CLASS',
    FUNCTION: 'FUNCTION',
    PACKAGE: 'PACKAGE',
    _REGEX_ALPHA: /^[A-Za-z]+$/,

    // Extends obj with {} values. Typically used for creating 'classes'
    extend: function(obj) {
        var args, argCount, arg;

        args = Array.prototype.slice.call(arguments, 1);

        for(argCount = 0; argCount < args.length; argCount++){
            arg = args[argCount];

            if(arg){
                for (var prop in arg) {
                    obj[prop] = arg[prop];
                }
            }
        }

        return obj;
    },

    // Get a context via a name delimited by .s
    getContext: function(contextPath){
        var contextPathItems, count, currentContextPath, context;

        if(Kojak.Core.isString(contextPath)){
            context = window;
            contextPathItems = contextPath.split('.');

            for(count = 0; count < contextPathItems.length; count++){
                currentContextPath = contextPathItems[count];

                if(typeof(context[currentContextPath]) === 'undefined'){
                    return undefined;
                }

                context = context[currentContextPath];
            }

            return context;
        }
    },

    isObject: function(obj) {
        return obj === Object(obj);
    },

    getPropCount: function(obj){
        return Kojak.Core.getKeys(obj).length;
    },

    getKeys: function(obj){
        var keys = [], key;
        Kojak.Core.assert(Kojak.Core.isObject(obj), 'Only use with objects');

        for(key in obj){
            if(obj.hasOwnProperty(key)){
                keys.push(key);
            }
        }

        return keys;
    },

    // only tested with array of strings
    unique: function(arr){
        var i, seen = {}, uq = [];
        Kojak.Core.assert(Kojak.Core.isArray(arr), 'Only use unique with arrays');

        for(i = 0; i < arr.length; i++){
            Kojak.Core.assert(Kojak.Core.isString(arr[i]), 'Only use unique with an array of strings');
            if(!seen[arr[i]]){
                uq.push(arr[i]);
                seen[arr[i]] = true;
            }
        }

        return uq;
    },

    // Kojak types - Class, Function, Package, undefined
    inferKojakType: function(objName, obj){
        var firstChar;

        if(obj && Kojak.Core.isFunction(obj)){
            firstChar = objName.substring(0, 1);
            if(Kojak.Core.isStringOnlyAlphas(firstChar) && firstChar === firstChar.toUpperCase()){
                return Kojak.Core.CLASS;
            }
            else {
                return Kojak.Core.FUNCTION;
            }
        }
        else if(obj && obj.constructor && obj.constructor.prototype === Object.prototype){
            return Kojak.Core.PACKAGE;
        }
        else {
            return undefined;
        }
    },

    isStringOnlyAlphas: function(check){
        Kojak.Core.assert(Kojak.Core.isString(check, 'only use with strings'));
        return check.match(Kojak.Core._REGEX_ALPHA);
    },

    assert: function(test, msg){
        if(!test){
            throw msg;
        }
    }
};

// Add the isXXX type checkers
['Arguments', 'Function', 'String', 'Number', 'Array', 'Date', 'RegExp'].forEach(function(name) {
    Kojak.Core['is' + name] = function(o) {
        return Object.prototype.toString.call(o) === '[object ' + name + ']';
    };
});