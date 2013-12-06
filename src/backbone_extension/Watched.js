
Kojak.Backbone.Watched = function(obj, type, id){
    Kojak.Core.assert(obj && type && (id || id === 0), 'Watched was not passed good data');

    this._obj = obj;
    this._type = type;
    this._id = id;

    this._startedWatchTime = Date.now();
};
