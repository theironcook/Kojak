
// Loads configuration from local storage
Kojak.Config.load();
Kojak.instrumentor = new Kojak.Instrumentor();

switch(Kojak.Config.getAutoStart()){
    case Kojak.Config.AUTO_START_IMMEDIATE:
        console.log('Starting Kojak immediately.  Kojak should have been the last included JavaScript code in the browser for this to work.');
        Kojak.instrumentor.instrument();
        break;
    case Kojak.Config.AUTO_ON_JQUERY_LOAD:
        if(window.jQuery && window.jQuery.ready){
            jQuery(document).ready(function(){
                console.log('Starting Kojak in the jQuery.ready handler.');
                Kojak.instrumentor.instrument();
            });
        }
        else {
            console.log('Kojak autoStart set to Kojak.Config.AUTO_ON_JQUERY_LOAD but jQuery was not found.\nDid you forget to include jQuery?');
        }
        break;
    case Kojak.Config.AUTO_DELAYED:
        setTimeout(function(){
            console.log('Starting Kojak after the auto delay of ' + Kojak.Formatter.millis(Kojak.Config.getAutoStartDelay()) + ' milliseconds.');
            Kojak.instrumentor.instrument();
        }, Kojak.Config.getAutoStartDelay());
        break;
}

// Convenience shortcuts if there are no conflicts
if(!window.K){
    // Do not use these in code - just a convenience for typing in the console
    window.K = Kojak;
    window.K.C = Kojak.Config;
    window.K.I = Kojak.instrumentor;
    window.K.R = Kojak.Report;
}
else {
    console.log('Warning, the window.K variable already existed.  Kojak shortcuts will not exist.');
}



