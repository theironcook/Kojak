
Kojak.Backbone.ObjWatcher = function(){
    this._watched = {};
};

Kojak.Config.extend(Kojak.Backbone.ObjWatcher.prototype, {

    startWatch: function(obj, type, id){

        if(!obj._kPath){
            console.log('Kojak warning, an object did not have a kPath.  Have you instrumented the code?');
        }

        if(!this._watched[type]){
            this._watched[type] = {};
        }

        if(this._watched[type][id]){
            console.log('Kojak warning, why did you start watching the same object twice? ', obj, type, id);
        }
        else {
            this._watched[type][id] = new Kojak.Backbone.Watched(obj, type, id);
        }
    },

    stopWatch: function(obj, type, id){
        if(!this._watched[type] || !this._watched[type][id]){
            console.log('Kojak warning, you tried to stop watching something that was not being watched. ', obj, type, id);
        }
        else {
            delete this._watched[type][id];
        }
    }

});