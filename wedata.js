// wedata utility for Greasemonkey
// usage
/*
 var DATABASE_URL = 'http://wedata.net/databases/XXX/items.json';
 var database = new Wedata.Database(DATABASE_URL);
 database.get(function(items) {
 items.forEach(function(item) {
    // do something
 });
 });

 // clear cache
 GM_registerMenuCommand('XXX - clear cache', function() {
 database.clearCache();
 });
*/
var Wedata = {};
Wedata.Database = function (urls) {
    this.items = [];
    this.expires = 24 * 60 * 60 * 1000; // 1 day
    this.urlSet = urls;
    this.url = this.urlSet.shift();
};

Wedata.Database.prototype.get = function (callback) {
    var self = this;
    var cacheInfo = Wedata.Cache.get(self.url);
    function getWeData(dataURL) {
        GM_xmlhttpRequest({
            method: "GET",
            url: dataURL,
            onload: function (res) {
                if (res.status === 200) {
                    self.items = JSON.parse(res.responseText);
                    callback(self.items);
                    Wedata.Cache.set(dataURL, self.items, self.expires);
                } else {
                    var rawData = Wedata.Cache.getRawData(dataURL);
                    if(typeof rawData !== "undefined") {
                        self.items = rawData;
                        callback(self.items);
                    }else{
                        self.url = self.urlSet.shift();
                        self.get(callback);
                    }
                }
            },
            onerror: function (res) {
                GM_log(res.status + ":" + res.message);
            }
        });
    }

    if (cacheInfo) {
        self.items = cacheInfo;
        callback(self.items);
    } else {
        getWeData(self.url);
    }
};

Wedata.Database.prototype.clearCache = function () {
    Wedata.Cache.set(this.url, null, 0);
};

Wedata.Cache = {};

Wedata.Cache.set = function (key, value, expire) {
    var expire = new Date().getTime() + expire;
    GM_setValue(key, JSON.stringify({ value: value, expire: expire }));
};

Wedata.Cache.get = function (key) {
    if (!Wedata.Cache.isExpired(key)) {
        return Wedata.Cache.getRawData(key);
    }
};
Wedata.Cache.getRawData = function (key) {
    var cached = JSON.parse(GM_getValue(key, null));
    if (cached) {
        return cached.value;
    } else {
        return null;
    }
};
Wedata.Cache.isExpired = function (key) {
    var cached = JSON.parse(GM_getValue(key, null));
    return !(cached && cached.expire > new Date().getTime());
};