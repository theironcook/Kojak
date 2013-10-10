
/*
all packages, classFunctions and classProtos will have a _kContainerProfile

The _kContainerProfile will have
  _package profiles
  _classFunction profiles
  _classProto profiles
  _function profiles
 */

Kojak.ContainerProfile = function(kojakPath){
    Kojak.Core.assert(kojakPath);
    this._kojakPath = kojakPath;
    this._packageProfiles = {};
    this._classFunctionProfiles = {};
    this._classProtoProfiles = {};
    this._allClassProfiles = {};
    this._functionProfiles = {};
};

Kojak.Core.extend(Kojak.ContainerProfile.prototype, {
    getKojakPath: function(){
        return this._kojakPath;
    },

    addPackageProfile: function(packageProfile){
        Kojak.Core.assert(!this._packageProfiles[packageProfile.getKojakPath()], 'why was the same package profile added twice');
        this._packageProfiles[packageProfile.getKojakPath()] = packageProfile;
    },

    getPackageProfiles: function(){
        return this._packageProfiles;
    },

    addClassFunctionProfile: function(classFunctionProfile){
        Kojak.Core.assert(!this._classFunctionProfiles[classFunctionProfile.getKojakPath()], 'why was the same class function profile added twice');
        this._classFunctionProfiles[classFunctionProfile.getKojakPath()] = classFunctionProfile;
        this._allClassProfiles[classFunctionProfile.getKojakPath()] = classFunctionProfile;
    },

    getClassFunctionProfiles: function(){
        return this._classFunctionProfiles;
    },

    addClassProtoProfile: function(classProtoProfile){
        Kojak.Core.assert(!this._classProtoProfiles[classProtoProfile.getKojakPath()], 'why was the same class proto profile added twice');
        this._classProtoProfiles[classProtoProfile.getKojakPath()] = classProtoProfile;
        this._allClassProfiles[classProtoProfile.getKojakPath()] = classProtoProfile;
    },

    getClassFunctionKojakPaths: function(){
        return Kojak.Core.getKeys(this._classFunctionProfiles);
    },

    getClassProtoKojakPaths: function(){
        return Kojak.Core.getKeys(this._classProtoProfiles);
    },

    getAllClassKojakPaths: function(){
        return this.getClassFunctionKojakPaths().concat(this.getClassProtoKojakPaths());
    },

    addFunctionProfile: function(functionProfile){
        Kojak.Core.assert(!this._functionProfiles[functionProfile.getKojakPath()], 'why was the same function profile added twice');
        this._functionProfiles[functionProfile.getKojakPath()] = functionProfile;
    },

    getFunctionProfiles: function(){
        return this._functionProfiles;
    },

    getFunctionProfileKojakPaths: function(){
        return Kojak.Core.getKeys(this._functionProfiles);
    },

    getAllClassProfiles: function(){
        return this._allClassProfiles;
    },

    getImmediateFunctionCount: function(){
        return Kojak.Core.getPropCount(this._functionProfiles);
    }
});
