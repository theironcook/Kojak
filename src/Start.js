
Kojak._hasStarted = false;

Kojak.hasStarted = function(){
    return Kojak._hasStarted;
};

// Loads configuration from local storage
Kojak.Config.load();
Kojak._instrumentor = new Kojak.Instrumentor();

Kojak.start = function(){
    console.log('starting Kojak now');
    Kojak._instrumentor.instrument();
    Kojak._hasStarted = true;
};

switch(Kojak.Config.getAutoStart()){
    case Kojak.Config.AUTO_START_IMMEDIATE:
        Kojak.start();
        break;
    case Kojak.Config.AUTO_ON_JQUERY_LOAD:
        if(!window.$ || !window.$.ready){
            $.ready(function(){
                Kojak.start();
            });
        }
        else {
            console.log('Kojak autoStart set to ' + Kojak.Config.AUTO_ON_JQUERY_LOAD + ' but JQuery not found.');
        }
        break;
    case Kojak.Config.AUTO_DELAYED:
        setTimeout(function(){
            Kojak.start();
        }, Kojak.Config.getAutoStartDelay());
        break;
}



