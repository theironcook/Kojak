
Kojak.NetWatcher = function(){
    Kojak.Core.assert(window.jQuery, 'You can\'t use the NetWatcher unless you have included jQuery.');
    this._hasStarted = false;
    this._netProfiles = {};
};

Kojak.Core.extend(Kojak.NetWatcher.prototype, {

    start: function(){
        Kojak.Core.assert(!this.hasStarted(), 'The Net Watcher has already started.');

        this._hasStarted = true;

        this._onAjaxSend = this._onAjaxSend.bind(this);
        this._onAjaxComplete = this._onAjaxComplete.bind(this);

        jQuery(document).ajaxSend(this._onAjaxSend);
        jQuery(document).ajaxComplete(this._onAjaxComplete);
    },

    hasStarted: function(){
        return this._hasStarted;
    },

    _onAjaxSend: function( event, jqXHR, options) {
        options._kStartTime = Date.now();
    },

    _onAjaxComplete: function( event, jqXHR, options) {
        if(options._kStartTime){
            this.trackNetResponse(options.type, options.url, Date.now() - options._kStartTime, jqXHR.responseText);
        }
        else {
            console.log('Kojak NetWatcher Warning: a web service call was not properly instrumented. (' + options.url + ')');
            console.log('\tThis is probably because the watcher was started in the middle of a call.');
        }
    },

    // You will need to call this from a web worker handler if you want to track web worker network calls
    trackNetResponse: function(httpMethod, url, callTime, responseText){
        var urlParts;

        urlParts = Kojak.NetProfile.parseUrl(httpMethod, url);

        if(!this._netProfiles[urlParts.urlBase]){
            this._netProfiles[urlParts.urlBase] = new Kojak.NetProfile(urlParts.urlBase);
        }

        this._netProfiles[urlParts.urlBase].addCall(urlParts.urlParams, callTime, responseText);
    },

    getNetProfiles: function(){
        return this._netProfiles;
    }
});