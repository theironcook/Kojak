window.Kojak = {};

Kojak.Core = {

    // Enums / constants for non config code
    CLAZZ: 'CLAZZ',
    FUNCTION: 'FUNCTION',
    PAKAGE: 'PAKAGE',
    _REGEX_ALPHA: /^[A-Za-z]+$/,

    // fields
    _uniqueId: 0,

    // Extends obj with {} values. Typically used for creating 'clazzes'
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

    // Get a context via a name delimited by periods
    getContext: function(contextPath){
        var contextPathItems, count, currentContextPath, context;

        Kojak.Core.assert(Kojak.Core.isString(contextPath), 'getContext can only be called with a string');

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

    getValues: function(obj){
        var values = [], key, value;
        Kojak.Core.assert(Kojak.Core.isObject(obj), 'Only use with objects');

        for(key in obj){
            if(obj.hasOwnProperty(key)){
                values.push(obj[key]);
            }
        }

        return values;
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

    // Kojak types - Clazz, Function, Pakage, undefined
    inferKojakType: function(objName, obj){
        var firstChar;

        if(obj && Kojak.Core.isFunction(obj)){
            firstChar = objName.substring(0, 1);
            if(Kojak.Core.isStringOnlyAlphas(firstChar) && firstChar === firstChar.toUpperCase()){
                return Kojak.Core.CLAZZ;
            }
            else {
                return Kojak.Core.FUNCTION;
            }
        }
        else if(obj && obj.constructor && obj.constructor.prototype === Object.prototype){
            return Kojak.Core.PAKAGE;
        }
        else {
            return undefined;
        }
    },

    getPath: function(kPath){
        Kojak.Core.assert(kPath, 'kPath is not defined');
        if(kPath.length < 3 || ! kPath.contains('.')){
            return kPath;
        }
        else{
            return kPath.substring(0, kPath.lastIndexOf('.'));
        }
    },

    getObjName: function(kPath){
        Kojak.Core.assert(kPath, 'kPath is not defined');
        if(kPath.length < 3 || ! kPath.contains('.')){
            return kPath;
        }
        else{
            return kPath.substring(kPath.lastIndexOf('.') + 1);
        }
    },

    // This will only work with kPaths to clazzes.  If the function name is part of the path this will fail
    // Use with care
    getPakageName: function(kPath){
        var pathParts;
        Kojak.Core.assert(kPath, 'kPath is not defined');
        pathParts = kPath.split('.');
        if(pathParts.length === 1){
            return kPath;
        }
        else {
            if(pathParts[pathParts.length - 1] === 'prototype'){
                pathParts = pathParts.splice(0, pathParts.length - 1);
            }
            pathParts = pathParts.splice(0, pathParts.length - 1);
            return pathParts.join('.');
        }
    },

    // This will only work with kPaths to clazzes.  If the function name is part of the path this will fail
    // Use with care
    getClazzName: function(kPath){
        var pathParts, clazzName = '';
        Kojak.Core.assert(kPath, 'kPath is not defined');
        pathParts = kPath.split('.');
        if(pathParts.length === 1){
            return '';
        }
        else {
            if(pathParts[pathParts.length - 1] === 'prototype'){
                clazzName = '.prototype';
                pathParts = pathParts.splice(0, pathParts.length - 1);
            }
            return pathParts[pathParts.length - 1] + clazzName;
        }
    },

    isStringOnlyAlphas: function(check){
        Kojak.Core.assert(Kojak.Core.isString(check, 'only use with strings'));
        return check.match(Kojak.Core._REGEX_ALPHA);
    },

    isStringArray: function(check){
        var isStringArray = true;

        if(Kojak.Core.isArray(check)){
            check.forEach(function(c){
                if(!Kojak.Core.isString(c)){
                    isStringArray = false;
                }
            });
        }
        else {
            isStringArray = false;
        }

        return isStringArray;
    },

    assert: function(test, msg){
        if(!test){
            throw msg;
        }
    },

    uniqueId: function(){
        return ++Kojak.Core._uniqueId;
    }
};

// Add the isXXX type checkers
['Arguments', 'Function', 'String', 'Number', 'Array', 'Date', 'RegExp', 'Boolean'].forEach(function(name) {
    Kojak.Core['is' + name] = function(o) {
        return Object.prototype.toString.call(o) === '[object ' + name + ']';
    };
});