Date.prototype.format = function (dateStyle, split) {
    split = split || "-";
    dateStyle = dateStyle || "full";

    var fmt = "";
    var o = {
        "y": this.getFullYear() + "",//年
        "M": (this.getMonth() + 1) + "", //月份
        "d": this.getDate() + "", //日
        "h": this.getHours() + "", //小时
        "m": this.getMinutes() + "", //分
        "s": this.getSeconds() + "" //秒
    };

    for (var k in o) {
        if (o[k].length == 1) {
            o[k] = "0" + o[k];
        }
    }

    fmt = o.y + split + o.M + split + o.d + " " + o.h + ":" + o.m + ":" + o.s;
    if (dateStyle == "date") {
        fmt = o.y + split + o.M + split + o.d;
    } else if (dateStyle == "time") {
        fmt = o.h + ":" + o.m + ":" + o.s;
    }

    return fmt;
}