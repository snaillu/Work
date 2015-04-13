(function (window, undefined) {
    var path = "",
        $,win,ready = {
        getPath: function () {
            var scripts = document.scripts, srcPath = scripts[0].src;

            return path?path:srcPath.substring(0,srcPath.lastIndexOf("/")+1);
        },
        type:["dialog","page","iframe","loading","tips"]
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
        test: function () {
            this.loadModule("../css/style.css", function () {
                alert("ok");
            });
        },
        alert: function (msg) {
            var conf = {
                dialog: {msg:msg}
            };
            return $.layer(conf);
        }
    };

    var Pop = function (setings) {
        var self = this, config = self.config;
        layer.index++;
        self.index = layer.index;
    };

    Pop.pt = Pop.prototype;

    Pop.pt.config = {
        type: 0,
        shade:[0.3,'#000'],
        area: ["310px", "auto"],
        closeBtn: [0, true],
        time: 0,
        mask:true,
        bgcolor: "#fff",
        zIndex: 1999990191,
        dialog: {
            btns: 1, btn: ["确认", "取消"], msg: "", yes: function (index) { layer.close(index); },
            no: function (index) { layer.close(index);}},
        success: function (layer) { },
        close: function (index) { layer.close(index); },
        destory: function () { }
    };

    Pop.pt.container = function (html) {
        var self = this, html = html || "", times = self.index, config = self.config,
            frames = ['<div class="pop_title"><em>提示</em></div>'
                + '<div class="pop_dialog"><span class="pop_msg pop_text">' + config.dialog.msg + '</span></div>'], shade = '',
            zIndex = config.zIndex + times;
        if (config.mask) {
            var shadeStyle = "z-index:" + zIndex + ";background-color:" + config.shade[1] + ";opacity:" + config.shade[0] +
                ";filter:alpha(opacity="+config.shade[0]*100+");";
            shade = "<div class='pop_masking' style='" + shadeStyle + "'></div>";
        }

        return shade+"<div id='pop_main"+times+"' class='pop_main'>"+frames[config.type]+"</div>"
    };

    Pop.pt.create = function () {
        var self = this,config = self.config,dialog = config.dialog,times=self.index,
            body = $("body"), render = function (html) {
                var html = html || "";
                body.append(self.container(html));
            };
        render();

        var popW = self.popW = $("#pop_main"+times)
    };

    ready.run = function () {
        $ = jQuery;
        win = $(window);
        layer.loadModule("../css/style.css");
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