
Kojak.NetProfile = function(urlBase){
    Kojak.Core.assert(urlBase, 'Parameters to NetProfile not set correctly');
    this._urlBase = urlBase;
    this._calls = [];
};

Kojak.Core.extend(Kojak.NetProfile.prototype, {
    addCall: function(urlParams, callTime, responseText){
        this._calls.push(new Kojak.NetProfileCall(urlParams, callTime, responseText));
    },

    getTotalCallTime: function(){
        var total = 0;

        this._calls.forEach(function(profileCall){
            total += profileCall.getCallTime();
        });

        return total;
    },

    getUrlBase: function(){
        return this._urlBase;
    },

    getCallsSortedByDate: function(){
        return this._calls.sort(function(a, b){
            return b.getDate() - a.getDate();
        });
    }
});

Kojak.NetProfile.parseUrl = function(httpMethod, url){
    var urlBase, urlParams, id, urlBaseParts;

    Kojak.Core.assert(url, 'UrlBase was not defined');

    if(url.contains('?')){
        urlBase = url.substring(0, url.indexOf('?'));
        urlParams = url.substring(url.indexOf('?'));
    }
    else {
        urlBase = url;
        urlParams = '';
    }

    // Rest style urls will probably have an id at the end, in this case, remove that id from the url base
    urlBaseParts = urlBase.split('/');

    if(!isNaN(parseInt(urlBaseParts[urlBaseParts.length - 1], 10))){
        id = parseInt(urlBaseParts[urlBaseParts.length - 1], 10);
        urlParams = '/' + id + urlParams;
        urlBase = urlBase.replace(id, '');
    }

    urlBase += ' [' + httpMethod + ']';

    return {urlBase: urlBase, urlParams: urlParams};
};

