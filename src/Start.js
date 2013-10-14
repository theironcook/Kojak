
Kojak._hasStarted = false;

Kojak.hasStarted = function(){
    return Kojak._hasStarted;
};

// Loads configuration from local storage
Kojak.Config.load();
Kojak.instrumentor = new Kojak.Instrumentor();

Kojak.start = function(){
    console.log('starting Kojak now');
    Kojak.instrumentor.instrument();
    Kojak._hasStarted = true;
};

Kojak.takeCheckpoint = function(){
    if(!Kojak.hasStarted()){
        Kojak.start();
    }

    Kojak.instrumentor.takeCheckpoint();
};

switch(Kojak.Config.getAutoStart()){
    case Kojak.Config.AUTO_START_IMMEDIATE:
        Kojak.start();
        break;
    case Kojak.Config.AUTO_ON_JQUERY_LOAD:
        if(window.jQuery && window.jQuery.ready){
            jQuery(document).ready(function(){
                Kojak.start();
            });
        }
        else {
            console.log('Kojak autoStart set to Kojak.Config.AUTO_ON_JQUERY_LOAD but jQuery was not found.\nDid you forget to include jQuery?');
        }
        break;
    case Kojak.Config.AUTO_DELAYED:
        setTimeout(function(){
            Kojak.start();
        }, Kojak.Config.getAutoStartDelay());
        break;
}

// Shortcuts if there are no conflicts
if(!window.K){
    window.K = Kojak;
}



