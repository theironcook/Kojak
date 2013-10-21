// Make sure to include Kojak before including this file

// Add all of the modules you want to instrument here
var modulesToInstrument = ['main'];

require(modulesToInstrument, function(){
    var modules, moduleCount, module;

    modules = Array.prototype.slice.call(arguments);

    // The overall root for Kojak to find all modules
    // Name it whatever you want
    window._myProj = {};

    // Expose all of the modules via the _myProj
    for(moduleCount = 0; moduleCount < modules.length; moduleCount++){
        window._myProj[modulesToInstrument[moduleCount]] = modules[moduleCount];
    }

    // assuming Kojak has already been included, you can call
    kConfig.setIncludedPakages(['_myProj']);

    // You will now need to call kInst.instrument() from the command line
});