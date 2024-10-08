class Cookie {
    static memoryStorage = {};
    
    static prefix() {
        return  `__${pixelFuncName}_`;
    }

    static set(name, value, minutes, path = '/') {
        var now = new Date()
        var ttl = minutes * 60 * 1000;
        var item = {
            value: value,
            expiry: now.getTime() + ttl,
        }
        
        //memorystorage
        try {
            this.memoryStorage[name] = value;
        } catch(e) {
            console.error(e);
        }
        
        //sessionstorage
        if (typeof(sessionStorage) != 'undefined') {
            try {
                sessionStorage.setItem(`${this.prefix()}${name}`, JSON.stringify(item))
            } catch(e) {
                console.error(e);
            }
        }
        
        //localstorage
        if (typeof(localStorage) != 'undefined') {
            try {
                localStorage.setItem(`${this.prefix()}${name}`, JSON.stringify(item))
            } catch(e) {
                console.error(e);
            }
        }
        
        //cookie
        var expires = '';
        if (navigator.cookieEnabled) {
            if (Helper.isPresent(minutes)) {
                var date = new Date();
                date.setTime(date.getTime() + (minutes * 60 * 1000));
                expires = `expires=${date.toGMTString()}; `;
            }
            try {
                document.cookie = `${this.prefix()}${name}=${value}; ${expires}path=${path}; SameSite=Lax`;
            } catch(e) {
                console.error(e);
            }
        }
    }
    
    static getMemoryStorage(name) {
        if (!this.memoryStorage || typeof(this.memoryStorage) != 'object') {
            return null;
        }        
        return this.memoryStorage[name] || null;
    }
    
    static getSessionStorage(name) {
        if (typeof(sessionStorage) == 'undefined') {
            return null;
        }
        
        var name = `${this.prefix()}${name}`;
        var itemStr = sessionStorage.getItem(name)
        if (!itemStr) {
            return null;
        }
        try {
            var item = JSON.parse(itemStr)
        } catch(e) { //not a json backward compatiblity
            sessionStorage.removeItem(name)
            return null;
        }
        const now = new Date()
        if (now.getTime() > item.expiry) {
            sessionStorage.removeItem(name)
            return null;
        }
        return item.value;
    }

    static getLocalStorage(name) {
        if (typeof(localStorage) == 'undefined') {
            return null;
        }
        
        var name = `${this.prefix()}${name}`;
        var itemStr = localStorage.getItem(name)
        if (!itemStr) {
            return null;
        }
        try {
            var item = JSON.parse(itemStr)
        } catch(e) { //not a json backward compatiblity
            localStorage.removeItem(name)
            return null;
        }
        const now = new Date()
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(name)
            return null;
        }
        return item.value;
    }
    
    static getCookie(name) {
        if (!navigator.cookieEnabled) {
            return null;
        }
        
        var name = `${this.prefix()}${name}=`;
        var ca = document.cookie.split(';');
        for (var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return null;
    }
    
    static get(name) {
        return this.getMemoryStorage(name) || this.getSessionStorage(name) || this.getLocalStorage(name) || this.getCookie(name);
    }

    static delete(name) {
        this.set(name,'',-100);
    }

    static exists(name) {
        return Helper.isPresent(this.get(name));
    }

    static setUtms() {
        var utmArray = ['utm_source', 'utm_medium', 'utm_term', 'utm_content', 'utm_campaign', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic'].concat('OPIX_UTM_EXTRAS'.split(','));
        var exists = false;
        for (var i = 0, l = utmArray.length; i < l; i++) {
            if (Helper.isPresent(Url.getParameterByName(utmArray[i]))) {
                exists = true;
                break;
            }
        }
        if (exists) {
            var val, save = {};
            for (var i = 0, l = utmArray.length; i < l; i++) {
                val = Url.getParameterByName(utmArray[i]);
                if (Helper.isPresent(val)) {
                    save[utmArray[i]] = val;
                }
            }
            this.set('utm', JSON.stringify(save));
        }
    }

    static getUtm(name) {
        if (this.exists('utm')) {
            var utms = JSON.parse(this.get('utm'));
            return name in utms ? utms[name] : '';
        }
    }
}
