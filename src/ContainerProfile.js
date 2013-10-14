
Kojak.ContainerProfile = function(kojakPath, container){
    Kojak.Core.assert(kojakPath, container);

    this._kojakPath = kojakPath;
    this._container = container;

    this._childContainerProfiles = {};
    this._childFunctionProfiles = {};

    // calculate the container type
    if(Kojak.Core.isFunction(container)){
        this._containerType = Kojak.ContainerProfile.CLASS_FUNCTION_CONTAINER;
    }
    else if(Kojak.Core.isObject(container)){
        if(kojakPath.endsWith('.prototype')){
            this._containerType = Kojak.ContainerProfile.CLASS_PROTOTYPE_CONTAINER;
        }
        else {
            this._containerType = Kojak.ContainerProfile.PACKAGE_CONTAINER;
        }
    }
};

// Enums / constants
Kojak.ContainerProfile.PACKAGE_CONTAINER = 'PACKAGE_CONTAINER';
Kojak.ContainerProfile.CLASS_FUNCTION_CONTAINER = 'CLASS_FUNCTION_CONTAINER';
Kojak.ContainerProfile.CLASS_PROTOTYPE_CONTAINER = 'CLASS_PROTOTYPE_CONTAINER';

Kojak.Core.extend(Kojak.ContainerProfile.prototype, {
    getKojakPath: function(){
        return this._kojakPath;
    },

    getContainerType: function(){
        return this._containerType;
    },

    addChildContainerProfile: function(childContainerProfile){
        Kojak.Core.assert(!this._childContainerProfiles[childContainerProfile.getKojakPath()], 'why was the same child container profile added twice');
        this._childContainerProfiles[childContainerProfile.getKojakPath()] = childContainerProfile;
    },

    addChildFunctionProfile: function(childFunctionProfile){
        Kojak.Core.assert(!this._childFunctionProfiles[childFunctionProfile.getKojakPath()], 'why was the same child function profile added twice');
        this._childFunctionProfiles[childFunctionProfile.getKojakPath()] = childFunctionProfile;
    },

    getChildClassContainerProfiles: function(){
        var profiles = [], profilePath, profile;

        for(profilePath in this._childContainerProfiles){
            profile = this._childContainerProfiles[profilePath];

            if( profile.getContainerType() === Kojak.ContainerProfile.CLASS_FUNCTION_CONTAINER ||
                profile.getContainerType() === Kojak.ContainerProfile.CLASS_PROTOTYPE_CONTAINER){
                profiles.push(profile);
            }
        }

        return profiles;
    },

    getChildClassFunctionCount: function(){
        var count = 0, childContainerPath, childContainer;

        for(childContainerPath in this._childContainerProfiles){
            childContainer = this._childContainerProfiles[childContainerPath];

            if(childContainer.getContainerType() === Kojak.ContainerProfile.CLASS_FUNCTION_CONTAINER){
                count++;
            }
        }

        return count;
    },

    getChildFunctions: function(){
        return Kojak.Core.getValues(this._childFunctionProfiles);
    },

    getChildFunctionCount: function(){
        return this.getChildFunctions().length;
    }
});
