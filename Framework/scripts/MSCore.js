var Basic = {
    ajax: function (params, callback) {
        var self = this;
        $.ajax({
            type: "POST",
            url: params.url,
            data: params,
            dataType: "json",

            success: function (data) {
                callback.call(self, data);
            },
            error: function (data) {
                callback.call(self, data);
            }

        });
    }
};

var Utils = {
    create: function () {
        return function () {
            this.initialize.apply(this, arguments);
        }
    },
    extend: function (destination, source) {
        for (var property in source) {
            destination[property] = source[property];
        }
    },
    bind: function (object, fn) {
        return function () {
            return fn.apply(object, arguments);
        }
    },
    bindEventListener: function (object, fn) {
        return function (event) {
            return fn.call(object, (event || window.event));
        }
    },
    addEventHandler: function (t, e, handler) {
        if (t.addEventListener) {
            t.addEventListener(e, handler, false);
        } else if (t.attachEvent) {
            t.attachEvent("on" + e, handler);
        } else {
            t["on" + e] = handler;
        }
    },
    removeEventHandler: function (t, e, handler) {
        if (t.removeEventListener) {
            t.removeEventListener(e, handler, false);
        } else if (t.detachEvent) {
            t.detachEvent("on" + e, handler);
        } else {
            oTarget["on" + e] = null;
        }
    },
    getPosition: function (e) {
        if (typeof e == "string")
            e = document.getElementById(e);
        var temp = e;
        var t = 0, l = 0, w = temp.offsetWidth, h = temp.offsetHeight;
        do {
            t += temp.offsetTop || 0;
            l += temp.offsetLeft || 0;
            temp = temp.offsetParent;
        } while (temp);

        for (temp = e.parentNode; e && e != document.body; e = e.parentNode) {
            if (e.scrollTop) {
                l -= e.scrollLeft;
                t -= e.scrollTop;
            }
        }

        return { top: t, left: l, width: w, height: h, bottom: t + h, right: l + w };
    },
    //visible windows size
    visibleSize: function () {
        var w = 0, h = 0;

        if (document.documentElement) {
            h = document.documentElement.clientHeight;
            w = document.documentElement.clientWidth;
        } else if (self.innerHeight) {
            h = window.innerHeight;
            w = window.innerWidth;
        } else if (document.body) {
            h = document.body.height;
            w = document.body.width;
        }

        return { width: w, height: h };
    },
    //get scroll top and scroll left
    scrollSize: function () {
        var t = 0, l = 0;
        if (window.pageYOffset) { //all not include ie
            l = window.pageYOffset;
            t = window.pageXOffset;
        } else if (document.documentElement && document.documentElement.scrollTop) {
            l = document.documentElement.scrollTop;
            t = document.documentElement.scrollLeft;
        } else if (document.body) {
            l = document.body.scrollTop;
            t = document.body.scrollLeft;
        }

        return { top: t, left: l };
    },
    stopBubble: function (e) {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        } else {
            window.event.cancelBubble = true;
        }
    },
    isEmpty: function (param) {
        return typeof param == "undefined" || param === null || param === "";
    },
    createElement: function (tagName, className, value,type) {
        var element = document.createElement(tagName);
        if (!this.isEmpty(className))
            element.className = className;
        if (!this.isEmpty(value)) {
            if (typeof value == "object") {
                element.appendChild(value);
            } else if (tagName=="input") {
                element.value = value;
                element.type = type;
            } else if (tagName == "img") {
                element.src = value;
            } else {
                element.innerHTML = value;
            }
        }

        return element;
    },
    getObj: function (id) {
        return typeof id == "string" ? document.getElementById(id) : id;
    },
    
    //json object convert to string
    jsonToString: function (obj) {
        var self = this;
        switch (typeof (obj)) {
            case 'string':
                return '"' + obj.replace(/(["\\])/g, '\\$1') + '"';
            case 'array':
                return '[' + obj.map(self.jsonToString).join(',') + ']';
            case 'object':
                if (obj instanceof Array) {
                    var strArr = [];
                    var len = obj.length;
                    for (var i = 0; i < len; i++) {
                        strArr.push(self.jsonToString(obj[i]));
                    }
                    return '[' + strArr.join(',') + ']';
                } else if (obj == null) {
                    return 'null';

                } else {
                    var string = [];
                    for (var property in obj) string.push(self.jsonToString(property) + ':' + self.jsonToString(obj[property]));
                    return '{' + string.join(',') + '}';
                }
            case 'number':
                return obj;
            case false:
                return obj;
        }
    },

    //string convert to json
    stringToJSON: function (str) {
        return JSON.parse(str);
    },
    //get param value from url
    getUrlParam: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)
            return unescape(r[2]);
        return null;
    }
};

/*
version:1.0
author:snail
date:2013-12-21 22:40
description:
this is use for cookie operate.
*/
var Cookie = {
    get: function (name) {
        var cookieName = name + "=",
            cookieStart = document.cookie.indexOf(cookieName),
            cookieValue = null;

        if (cookieStart > -1) {
            var cookieEnd = document.cookie.indexOf(";", cookieStart);
            if (cookieEnd == -1) {
                cookieEnd = document.cookie.length;
            }
            cookieValue = unescape(document.cookie.substring(cookieStart
                            + cookieName.length, cookieEnd));
        }
        return cookieValue;
    },

    set: function (name, value) {
        var exp = new Date();
        var Days = 30;
        exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
        document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString() + ";path=/";
    },

    set: function (name, value, hour) {
        var cookieText = encodeURIComponent(name) + "=" +
                         encodeURIComponent(value),
            expireDate = new Date();

        expireDate.setTime(expireDate.getTime() + hour * 60 * 60 * 1000);

        cookieText += ";expires=" + expireDate.toGMTString();
        document.cookie = cookieText;
    },

    set: function (name, value, expires, path, domain, secure) {
        var cookieText = encodeURIComponent(name) + "=" +
                         encodeURIComponent(value);

        if (expires instanceof Date) {
            cookieText += "; expires=" + expires.toGMTString();
        }

        if (path) {
            cookieText += "; path=" + path;
        }

        if (domain) {
            cookieText += "; domain=" + domain;
        }

        if (secure) {
            cookieText += "; secure";
        }

        document.cookie = cookieText;
    },

    unset: function (name, path, domain, secure) {
        this.set(name, "", new Date(0), path, domain, secure);
    },

    unset: function (name) {
        var expireDate = new Date(),
            value = this.get(name);
        expireDate.setTime(expireDate.getTime() - 1);
        if (value != null) {
            document.cookie = name + "=" + value + "; expires=" + expireDate.toGMTString();
        }
    }
};


Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

/*
    version:1.0
    author:snail
    date:2013-01-25 11:32
    description:
        this is a tool for element drag, so you can move you element with mouse.
*/
var EasyDrag = Utils.create();

EasyDrag.prototype = {
    initialize: function (drag, handler) {
        this.Drag = Utils.getObj(drag);
        this.Handler = Utils.getObj(handler);
        this._lastElemX = this._lastElemY = 0;
        this.Drag.style.position = "absolute";
        this._move = Utils.bindEventListener(this,this.updatePostion);
        this._stop = Utils.bind(this, this.stop);
        
        Utils.addEventHandler(this.Handler, "mousedown", Utils.bindEventListener(this, this.start));
    },

    //initialize drag
    start: function (e) {
        this._lastElemX = e.clientX - this.Drag.offsetLeft;
        this._lastElemY = e.clientY - this.Drag.offsetTop;
        Utils.addEventHandler(document, "mousemove", this._move);
        Utils.addEventHandler(document, "mouseup", this._stop);
    },

    stop: function () {
        Utils.removeEventHandler(document, "mousemove", this._move);
        Utils.removeEventHandler(document, "mouseup", this._stop);
        if (document.all) {
            Utils.removeEventHandler(this.Handler, "losecapture", this._stop);
        } else {
            Utils.removeEventHandler(window, "blur", this._stop);
        }
    },

    getMousePosition: function (e) {
        var posx = 0;
        var posy = 0;

        if (!e) var e = window.event;

        if (e.pageX || e.pageY) {
            posx = e.pageX - this._lastElemX;
            posy = e.pageY - this._lastElemY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - this._lastElemX;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - this._lastElemY;
        }

        return { 'x': posx, 'y': posy };
    },

    updatePostion: function (e) {
        var pos = this.getMousePosition(e);

        this.Drag.style.top = pos.y + "px";
        this.Drag.style.left = pos.x + "px";
    }
}

var ViewUtils = {
    createPopWindow: function (options) {
        var top = (Utils.visibleSize().height - options.height) / 2 + Utils.scrollSize().top,
            left = (Utils.visibleSize().width - options.width) / 2 + Utils.scrollSize().left;
        var fragment = document.createDocumentFragment();
        
        var popwrapper = Utils.createElement("div", "popwinwrapper"),
            popinner = Utils.createElement("div", "popinner"),
            titlewrapper = Utils.createElement("div", "titlewrapper"),
            close = Utils.createElement("a", "close"),
            popcontain = Utils.createElement("div", "popcontain"),
            btnWrapper = Utils.createElement("div","btnwrapper");
        popwrapper.style.top = top + "px";
        popwrapper.style.left = left + "px";
        popwrapper.id = "popwinwrapper";
        popwrapper.appendChild(popcontain);

        popcontain.style.width = options.width + "px";
        popcontain.style.height = options.height + "px";
        popinner.style.width = (options.width - 12) + "px";
        popinner.style.height = (options.height - 12) + "px";

        close.onclick = function () {
            $("#CoverBody").remove();
            $(".popwinwrapper").remove();
            options.close();
        };

        titlewrapper.id = "titlewrapper";
        titlewrapper.appendChild(Utils.createElement("div", "titleinfo", options.title));
        titlewrapper.appendChild(close);

        popinner.appendChild(titlewrapper);
        var cnt = Utils.createElement("div", "content");
        if (!Utils.isEmpty(options.url)) {
            iframe = document.createElement("iframe")
            iframe.src = options.url;
            iframe.style.width = (options.width-12)+"px";
            iframe.style.height = (options.height-12)+"px";
            iframe.frameborder = "0";
            iframe.border = "0";
            iframe.scrolling = "no";
            iframe.setAttribute("frameborder", "0", 0);
            cnt.appendChild(iframe);
        } else if (typeof options.content == "object") {
            cnt.appendChild(options.content);
        } else {
            cnt.innerHTML = options.content;
        }
        popinner.appendChild(cnt);

        //bottom btns
        if (options.isshowbtn) {
            var okbtn = Utils.createElement("input", null, "确定", "button"),
                cancelbtn = Utils.createElement("input", null, "取消", "button");

            okbtn.onclick = function () {
                if (!options.ok()) {
                    return;
                }
                $("#CoverBody").remove();
                $(".popwinwrapper").remove();
            };
            cancelbtn.onclick = function () {
                $("#CoverBody").remove();
                $(".popwinwrapper").remove();
                options.close();
            };
            btnWrapper.appendChild(okbtn);
            btnWrapper.appendChild(cancelbtn);
            popinner.appendChild(btnWrapper);
        }
        
        popwrapper.appendChild(popinner);
        fragment.appendChild(popwrapper)
        document.body.appendChild(fragment);
        new EasyDrag("popwinwrapper", "titlewrapper");
    }
};
var View = {
    PopWindow: function (options) {
        var def = {
            title: "CLOSE",
            url:null,
            content: "Content",
            iscoverbg: true,//is cover background
            isshowbtn:false,//is show botton at the bottom of window
            width: 415,
            height:315,
            close: function () { },
            ok: function () { }
        };

        Utils.extend(def, options || {});

        $("#CoverBody").remove();
        $(".popwinwrapper").remove();

        if (def.iscoverbg) {
            //get document height
            var documentHeight = $(document).height();

            //cover document
            $("body").append("<div id='CoverBody'></div>");
            $("#CoverBody").css({
                "opacity": "0.3", "height": documentHeight + 60,
                "width": "100%", "left": "0", "top": "0", "background-color": "gray",
                "position": "absolute", "z-index": "1000"
            });
        }

        ViewUtils.createPopWindow(def);
        
    },
    test: function (config) {
        var fn = null;
        fn = function () {
            config.close();
        }

        fn();
    }
};

var Progress = {
    updateProgress: function (percent) {
        var self = this;
        $(this).children(".process-wave").css({ width: percent + "%" });
        $(this).children(".process-info").text(percent + "%");
    },
    show: function (options) {
        var def = {
            height: 25,
            width: 160,
            id: null
        };

        Utils.extend(def, options || {});

        var progresswrapper = Utils.createElement("div", "progresswrapper", Utils.createElement("div", "process-wave", null)),
            processinfo = Utils.createElement("div", "process-info", null), self = this;
        $(progresswrapper).css({ height: def.height, width: def.width });
        processinfo.style.lineHeight = def.height + "px";
        progresswrapper.appendChild(processinfo)

        this.pgwrapper = progresswrapper;
        $("#" + def.id).html(progresswrapper);

        progresswrapper.updateProgress = function (percent) {
            var self = this;
            $(this).children(".process-wave").css({ width: percent + "%" });
            $(this).children(".process-info").text(percent + "%");
        }
        return progresswrapper;
    }
};