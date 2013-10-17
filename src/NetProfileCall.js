
Kojak.NetProfileCall = function(urlParams, callTime, responseText){
    Kojak.Core.assert((urlParams || urlParams === '') && (callTime || callTime === 0), 'Parameters to NetProfile not set correctly');
    this._date = new Date();
    this._urlParams = urlParams;
    this._callTime = callTime;

    this._responseSize = (responseText && responseText.length) ? (2*responseText.length) : 0;

    try {
        this._objCount = Kojak.Core.getKeys(JSON.parse(responseText)).length;
    } catch(e) {
        this._objCount = 1;
    }
};

Kojak.Core.extend(Kojak.NetProfileCall.prototype, {

    getCallTime: function(){
        return this._callTime;
    },

    getDate: function(){
        return this._date;
    },

    getUrlParams: function(){
        return this._urlParams;
    },

    getResponseSize: function(){
        return this._responseSize;
    },

    getObjCount: function(){
        return this._objCount;
    }

});
