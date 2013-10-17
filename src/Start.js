
// See if the Browser can support the features that Kojak needs
if(!Object && Object.defineProperty){
    throw('Kojak requires the function Object.defineProperty');
}
// todo - other feature detection


// Loads configuration from local storage
Kojak.Config.load();
Kojak.instrumentor = new Kojak.Instrumentor();

switch(Kojak.Config.getAutoStartInstrumentation()){
    case Kojak.Config.AUTO_START_IMMEDIATE:
        console.log('Running Kojak.instrumentor.instrument() immediately.  Kojak should have been the last included JavaScript code in the browser for this to work.');
        Kojak.instrumentor.instrument();
        break;
    case Kojak.Config.AUTO_ON_JQUERY_LOAD:
        if(window.jQuery && window.jQuery.ready){
            jQuery(document).ready(function(){
                console.log('Running Kojak.instrumentor.instrument() in the jQuery.ready handler.');
                Kojak.instrumentor.instrument();
            });
        }
        else {
            console.log('Kojak autoStart set to Kojak.Config.AUTO_ON_JQUERY_LOAD but jQuery was not found.\nDid you forget to include jQuery?');
        }
        break;
    case Kojak.Config.AUTO_START_DELAYED:
        setTimeout(function(){
            console.log('Running Kojak.instrumentor.instrument() after the auto delay of ' + Kojak.Formatter.number(Kojak.Config.getAutoStartDelay()) + ' milliseconds.');
            Kojak.instrumentor.instrument();
        }, Kojak.Config.getAutoStartDelay());
        break;
}

if(Kojak.Config.getEnableNetWatcher()){
    Kojak.netWatcher = new Kojak.NetWatcher();
    // For now, just start watching network traffic immediately
    Kojak.netWatcher.start();
}

// Convenience shortcuts if there are no conflicts
// Do not use these in code - just a convenience for typing in the console
if(!window.kConfig){
    window.kConfig = Kojak.Config;
}
else {
    console.log('Warning, the window.kConfig variable already existed.  Kojak shortcut will not exist.');
}

if(!window.kInst){
    window.kInst = Kojak.instrumentor;
}
else {
    console.log('Warning, the window.kInst variable already existed.  Kojak shortcut will not exist.');
}

if(!window.kRep){
    window.kRep = Kojak.Report;
}
else {
    console.log('Warning, the window.kRep variable already existed.  Kojak shortcut will not exist.');
}


