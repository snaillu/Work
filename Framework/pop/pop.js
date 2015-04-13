(function (window, undefined) {
    var path = "",
        $,win,ready = {
        getPath: function () {
            var scripts = document.scripts;
            for (var i = 0; i < scripts.length; i++) {
                var src = scripts[i].src, name = src.substring(src.lastIndexOf("/") + 1),
                    path = src.substring(0, src.lastIndexOf("/"));
                if (name == "pop.js")
                    return path;
            }
        },
        type: ["dialog", "tips", "iframe", "page", "loading"]
    };

    window.layer = {
        version: "1.0",
        index: 0,
        path: ready.getPath(),

        loadModule: function (module, callback) {
            var i = 0, head = $("head")[0],module = module.replace(/\s/g,""),
                isCss = /\.css$/.test(module),node = document.createElement(isCss?"link":"script"),
                id = module.replace(/\.|\//g, "");
            if (isCss) {
                node.type = "text/css";
                node.rel = "stylesheet";
            }
            node[isCss ? "href" : "src"] = /^http:\/\//.test(module) ? module : layer.path + module;
            node.id = id;
            if (!$("#" + id)[0]) {
                head.appendChild(node);
            }

            if (callback) {
                if (document.all) {
                    $(node).ready(callback);
                } else {
                    $(node).load(callback);
                }
            }
        },
        /*
            description:alert pop
            config params:
                msg:""          the message you want to show
        */
        alert: function (msg) {
            var conf = {
                dialog: {msg:msg}
            };
            return $.layer(conf);
        },
        /*
            description:confirm pop
            config params:
                shade:[0.3,"#000"]          masking style
                mask:true                   is need mask
                area:["310px","auto"]       main frame width and height
                btns:1                      button number:0 no button,1 one button,2 close and ok button
                msg:""                      the message you want to show
                yes:function(){}            ok callback
                no:function(){}             cancel callback
        */
        confirm: function (setting) {
            var dialog = $.extend({}, setting);
            setting.dialog = dialog;
            return $.layer(setting);
        },
        /*
            description:tips pop
            config params:
                msg:""                                      the message you want to show
                time:0                                      seconds if more than zero autoclose the tips
                position:{left:0,top:0,align:"center"}      if left or top more zero use user postion else use align
        */
        tips: function (setting) {
            var conf = $.extend({ type: 1, mask: false }, setting), tip = { msg: setting.msg || "" };
            conf.tips = tip;

            return $.layer(conf);
        },
        /*
            description:iframe pop
            config params:
                src:                the URI you want to show
                masking:true        is need mask default is true
                maskclose:false     is need close pop by click masking
        */
        iframe: function (setting) {
            var conf = $.extend({ type: 2 }, setting), iframe = { src: setting.src || "" };
            conf.iframe = iframe;

            return $.layer(conf);
        },
        /*
            description:iframe pop
            config params:
                html:""             the dom info you want to show
                maskclose:false     is need close pop by click masking
        */
        html: function (setting) {
            var conf = $.extend({ type: 3 }, setting);

            return $.layer(conf);
        }
    };

    var Pop = function (setings) {
        var self = this, config = self.config;
        layer.index++;
        self.index = layer.index;
        self.config = $.extend({}, config, setings);
        self.config.dialog = $.extend({}, config.dialog, setings.dialog);
        self.config.iframe = $.extend({},config.iframe,setings.iframe);
        self.create();
    };

    Pop.pt = Pop.prototype;

    Pop.pt.config = {
        type: 0,
        shade:[0.3,'#000'],
        area: ["310px", "auto"],
        padding:15,
        time: 0,
        mask: true,
        maskclose:false,
        bgcolor: "#fff",
        zIndex: 1999990191,
        position:{left:0,top:0,align:"center"},
        dialog: {
            btns: 1, btn: ["确认", "取消"], msg: "", yes: function (index) { layer.close(index); },
            no: function (index) { layer.close(index); }},
        tips: { msg: "" },
        iframe: { src: "", scrolling: "no" },
        html:"",
        success: function (layer) { },
        close: function (index) { layer.close(index); },
        destory: function () { }
    };

    Pop.pt.container = function (html) {
        var self = this, html = html || "", times = self.index, config = self.config,
            frames = ['<div class="pop_title"><em>提示</em></div>'
                + '<div class="pop_dialog"><span class="pop_msg pop_text">' + config.dialog.msg + '</span></div>',
            '<div class="pop_dialog"><span class="pop_msg pop_text">' + config.tips.msg + '</span></div>',
            '<iframe src="' + config.iframe.src + '" class="pop_iframe" scrolling="no" width="100%" height="100%" frameborder="0"></iframe>',
            '<div class="pop_html"></div>'], shade = '',
            zIndex = config.zIndex + times;
        if (config.mask) {
            var shadeStyle = "z-index:" + zIndex + ";background-color:" + config.shade[1] + ";opacity:" + config.shade[0] +
                ";filter:alpha(opacity="+config.shade[0]*100+");";
            shade = "<div class='pop_masking' id='pop_masking"+times+"' style='" + shadeStyle + "'></div>";
        }

        return shade+"<div id='pop_main"+times+"' style='z-index:"+zIndex+"' class='pop_main'>"+frames[config.type]+"</div>"
    };

    Pop.pt.create = function () {
        var self = this,config = self.config,dialog = config.dialog,times=self.index,height,
            body = $("body"), render = function (html) {
                var html = html || "";
                body.append(self.container(html));
            };
        render();

        switch (config.type) {
            case 0:
                $(".pop_text").css({ "padding-top": $(".pop_title").height() + config.padding });
                break;
            case 3:
                if (typeof config.html == "string") {
                    $(".pop_html").html(config.html);
                } else {
                    $(".pop_html").append(config.html);
                }
                break;
        }

        var popW = self.popW = $("#pop_main" + times);
        popW.css({ width: config.area[0], height: config.area[1] });
        if (config.type == 0) {
            var configBtn = config.dialog,configType = configBtn.btns,btnHtml="";
            switch (configType) {
                case 1:
                    btnHtml += '<a class="pop_button pop_yes" href="javascript:void(0);" style="margin-left:-39px;">' + configBtn.btn[0] + '</a>';
                    break;
                case 2:
                    btnHtml += '<a class="pop_button pop_yes" href="javascript:void(0);">' + configBtn.btn[0] + '</a>';
                    btnHtml += '<a class="pop_button pop_no" href="javascript:void(0);">' + configBtn.btn[1] + '</a>';
                    break;
            }
            popW.append('<div class="pop_buttons">' + btnHtml + '</div>');
            if (config.area[1] == "auto") {
                height = $(".pop_msg").innerHeight() + $(".pop_button").innerHeight() + config.padding;
                popW.css({ height: height});
            }
        } else if (config.type == 1) {
            height = $(".pop_msg").innerHeight() +  config.padding;
            popW.css({ height: height});
        }
        

        config.time <= 0 || self.autoClose();
        self.autoPostion();
        self.callback();
    };

    Pop.pt.autoPostion = function () {
        //position:{left:0,top:0,align:"middle"},
        var self = this, position = self.config.position, pop = self.popW, padding = self.config.padding;
        if (position.left > 0 || position.top > 0) {
            pop.css({ left: position.left, top: position.top });
        } else {
            switch (position.align) {
                case "center":
                    pop.css({ left: "50%", top: "50%", marginLeft: -pop.innerWidth() / 2, marginTop: -pop.innerHeight() / 2 });
                    break;
                case "rightbottom":
                    pop.css({ left: "100%", top: "100%", marginLeft: -pop.innerWidth() - padding, marginTop: -pop.innerHeight() - padding });
                    break;
            }
        }
    };

    Pop.pt.autoClose = function () {
        var self = this, time = self.config.time, delayLoad = function () {
            time--;
            if (time === 0) {
                layer.close(self.index);
                clearInterval(self.autoDestory);
            }
        };
        self.autoDestory = setInterval(delayLoad,1000);
    };

    Pop.pt.callback = function () {
        var self = this, popW = self.popW,config=self.config;
        popW.find(".pop_yes").on("click", function () {
            config.yes ? config.yes(self.index) : config.dialog.yes(self.index);
            layer.close(self.index);
        });
        popW.find(".pop_no").on("click", function () {
            config.no ? config.no(self.index) : config.dialog.no(self.index);
            layer.close(self.index);
        });
        if (config.maskclose) {
            $("#pop_masking" + self.index).on("click", function () {
                layer.close(self.index);
            });
        }
    };

    layer.close = function (index) {
        var self = this, config=self.config;
        var main = $("#pop_main" + index), masking = $("#pop_masking" + index);
        main.remove();
        if (masking) {
            masking.remove();
        }
    };

    ready.run = function () {
        $ = jQuery;
        win = $(window);
        layer.loadModule("/css/style.css");
        $.layer = function (deliver) {
            var o = new Pop(deliver);
            return o.index;
        }
    };

    if ("function" === typeof define) {
        define(function () {
            ready.run();
            return layer;
        });
    } else {
        ready.run();
    }
})(window);