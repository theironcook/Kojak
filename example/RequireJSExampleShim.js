
// This is a very simple example of
require(['main'], function(main){
    window._myProj = {};
    window._myProj.main = main;

    // assuming Kojak has already been included
    kConfig.setIncludedPakages(['_myProj']);
});
