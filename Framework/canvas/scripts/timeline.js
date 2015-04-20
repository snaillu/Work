/*
    author:snail
    date:2015/04/01
    description: This is a model for play to show the time line.

*/

(function (window, undefined) {
    window.timeline = {
        index: 0
    };

    var Line = function (settings) {
        var self = this, config = self.config;
        timeline.index++;
        self.index = timeline.index;
        config.filelist = generateData(settings.hour||config.hour);
        self.config = $.extend({},self.config,settings);

        self.create();
    };

    Line.pt = Line.prototype;

    Line.pt.config = {
        //params for timeline,they can change by create params,if you want to
        filelist: [],//the file data for time line
        scale:1,//set the scale size
        height: 36,//column height
        width: 100,//hour width
        startY: 100,//the start position of timeline
        timeout: 5,//on operate on timeline will move the the progress bar
        left: 0,//canvas left offset

        //params for timeline inner use don't change them
        maxwidth:4000,//max width of canvas
        hour: 72,//file total hour
        seconds: 0,//the start position of the progress bar
        dragging: false,//the drag status of progress bar
        moving: false,//the move status of progress bar
        freetime: 0,//no operate time
        looping: false,//is in loop play mode
        loopstatus:"",//start:loop status    stop:stop loop play
        loop:{left:0,right:0},//loop area, left:start position   right:end position
    };

    //create the container of timeline
    Line.pt.container = function () {
        var self = this, config = self.config;
        var frames = "<div id='flickable" + self.index + "' class='flickable'><canvas id='canvas" +
            self.index + "' width='" + self.canvaswidth + "' height='" + self.canvasheight + "'></canvas></div>",
            btns = '<div id="timeline-btns" class="timeline-btns"><div class="timeline-empty-btn"></div>'
            + '<div id="loopstart" class="timeline-btn"><div class="timeline-btn-center"><img class="timeline-icon" src="images/loopstart.png" />设开始</div></div>' +
            '<div id="loopend" class="timeline-btn timeline-noleft"><div class="timeline-btn-center"><img class="timeline-icon" src="images/loopend.png" />设结束</div></div>' +
            '<div id="loop" class="timeline-btn timeline-noleft"><div class="timeline-btn-center"><img class="timeline-icon" src="images/loopplay.png" />循环播放</div></div>' +
            '<div class="timeline-btn timeline-noleft"><div class="timeline-btn-center"><img class="timeline-icon" src="images/export.png" />导出视频</div></div></div>',
            tips = '<div id="timeline-tips" class="timeline-tips"></div>',
            wrapper = '<div id="timeline-date" class="timeline-date" style="line-height:' + self.canvasheight +
            'px;"></div><div id="timeline-container" class="timeline-container">' + btns + tips + '</div>';

        
        $(self.renderto).append(wrapper);
        self.wrapper = $("#timeline-container");
        $(self.wrapper).append(frames);
        $("#timeline-tips").css({ marginTop: self.canvasheight - $("#timeline-tips").height()});
    };

    //create the container and init event
    Line.pt.create = function () {
        var self = this, config = self.config;
        self.init();
        self.container();
        $("#flickable" + self.index).css({ width: (self.totalhour * config.width) });
        self.flickable = document.getElementById("flickable" + self.index);
        self.canvas = document.getElementById("canvas" + self.index);
        self.context = self.canvas.getContext("2d");
        
        self.callback();
    };

    //inti canvas width and height
    Line.pt.init = function () {
        this.initFileInfo();

        var self = this, config = self.config, filelist = config.filelist;
        var renderTo = typeof config.render == "string" ? $("#" + config.render) : config.render;

        config.width = config.width * config.scale;
        self.renderto = renderTo;
        self.begintime = filelist[0].begintime;
        self.endtime = filelist[filelist.length - 1].endtime;
        self.totalhour = (self.endtime - self.begintime) / (1000 * 3600);
        self.canvaswidth = Math.min(config.maxwidth, (self.totalhour * config.width));
        self.canvasheight = renderTo.height();
    };

    //call back for create the container
    Line.pt.callback = function () {
        var self = this, config = self.config;
        self.wrapper.scroll(function () {
            clearTimeout(self.scrolling);
            self.scrolling = setTimeout(function () {
                self.moveCanvasPos(self.wrapper.scrollLeft());
            }, 200);
        });

        self.draw();
        var progress = setInterval(function () {
            self.moveProgressStep(5*60);
        }, 1000);

        self.addListenEvent();
        self.addLoopListenEvent();
    };

    //while scrollLeft need to reset the canvas position
    Line.pt.moveCanvasPos = function (scrollLeft) {
        var self = this, config = self.config;
        var contentWidth = self.totalhour * config.width;
        if (self.canvaswidth < config.maxwidth)
            return;
        var border = (config.maxwidth - $(self.wrapper).width()) / 2, left = 0;
        if (scrollLeft >= border) {
            left = scrollLeft - border;
        }
        left = Math.min(left, contentWidth - self.canvaswidth);
        $(self.canvas).css({ left: left });
        config.left = left;
        //console.log("scrollLeft=" + scrollLeft + "   left=" + left + "   border=" + border);
        self.draw();
    };

    //init the file info in order to generate full time of the line
    Line.pt.initFileInfo = function () {
        var self = this, config = self.config, filelist = config.filelist, list = new Array(), item = {};
        list.push(filelist[0]);

        for (var i = 1; i < filelist.length; i++) {
            var fileBef = filelist[i-1],fileLast = filelist[i];
            if (!self.equals(fileBef.endtime, fileLast.begintime)) {
                item = fileModel();
                item.fileid = -1;
                item.filename = "kdnvr_none.mp4";
                item.filepath = "D:\\download\\";
                item.begintime = fileBef.endtime;
                item.endtime = fileLast.begintime;
                item.duration = (item.endtime-item.begintime)/1000;
                item.absstatus = 0;
                item.downloadstatus = -1;

                list.push(item);
            }

            list.push(fileLast);
        }

        //console.log("initFileInfo file count=" + list.length);
        config.filelist = list;
        return list;
    };

    //check the time is equal with the deviation of 5
    Line.pt.equals = function (time1,time2) {
        return Math.abs(time1 - time2) <= 5;
    };

    //move the progress button
    Line.pt.moveProgressStep = function (seconds) {
        var self = this, config = self.config,moveCondition=200;
        config.seconds += seconds;
        config.freetime += 1;
        if (config.loopstatus == "start") {
            var loop = config.loop, beginSec = loop.left * 3600 / config.width, endSec = loop.right * 3600 / config.width;
            //console.log("moveProgressStep config.seconds=" + config.seconds + "  beginSec=" + beginSec);
            if (config.seconds >= endSec || config.seconds <= beginSec) {
                config.seconds = beginSec;
            }
        }
        $("#timeline-date").html(new Date(self.begintime+config.seconds*1000).getDate()+"日");
        var progressX = config.width * config.seconds / 3600, rightBorder = self.wrapper.scrollLeft() -
            $(self.wrapper).offset().left + $(self.wrapper).width();
        //console.log("rightBorder=" + rightBorder + "  progressX=" + progressX);
        if (config.freetime > config.timeout) {
            var minus = rightBorder - progressX, scrollLeft = 0;
            //console.log("rightBorder=" + rightBorder + "  progressX=" + progressX + "  minus=" + minus);
            if (minus < 0) {
                scrollLeft = progressX - $(self.wrapper).width() / 3;
            } else if (minus > 0 && minus <= moveCondition) {
                scrollLeft = self.wrapper.scrollLeft() + $(self.wrapper).width() / 3;
            } else if (minus > $(self.wrapper).width()) {
                scrollLeft = progressX - $(self.wrapper).width() / 3;
            }

            scrollLeft = (scrollLeft < 0 ? progressX : scrollLeft);

            if (scrollLeft > 0) {
                self.wrapper.scrollLeft(scrollLeft);
            }
        }
        
        self.draw();
    };

    //add touch event to canvas
    Line.pt.addListenEvent = function () {
        var self = this, config = self.config;
        self.canvas.addEventListener("touchstart", function () { self.touchStart(event);}, false);
        self.canvas.addEventListener("touchmove", function () { self.touchMove(event);}, false);
        self.canvas.addEventListener("touchend", function () { self.touchEnd(event);}, false);
    };

    //get the touch position of timeline
    Line.pt.getTouchPosition = function (event) {
        var self = this, config = self.config,posX = 0;
        var touch = event.targetTouches[0], x = touch.pageX, y = touch.pageY;
        //console.log("getTouchPosition x="+x);
        if (event.x != undefined && event.y != undefined) {
            posX = x;
        } else {
            posX = x + document.body.scrollLeft + document.documentElement.scrollLeft;
        }
        //posx -= self.canvas.offsetLeft;
        //console.log("dragEvent  posx=" + posX);
        //console.log("getTouchPosition x=" + posX);
        return posX;
    };

    //handle the touch start event
    Line.pt.touchStart = function (event) {
        var self = this, config = self.config;
        var progressX = config.width * config.seconds / 3600, touchX = self.getTouchPosition(event) +
            self.wrapper.scrollLeft() - $(self.wrapper).offset().left;
        config.touchX = touchX;
        config.freetime = 0;
        //console.log("touchX=" + touchX);
        if (touchX >= progressX - config.height && touchX <= progressX + config.height) {
            config.dragging = true;
        }

        //handle the touch event for loop operate
        if (config.looping) {
            var loop = config.loop, loopdirection="";
            if (Math.abs(loop.left - touchX) <= config.height) {
                loopdirection = "left";
            } else if (Math.abs(loop.right - touchX) <= config.height) {
                loopdirection = "right";
            }
            //console.log("touchStart   loopdirection=" + loopdirection);
            self.loopdirection = loopdirection;
        }
        
    };

    //handle the touch move event
    Line.pt.touchMove = function (event) {
        var self = this, config = self.config;
        config.moving = true;

        var touchX = Math.max(0, self.getTouchPosition(event) + self.wrapper.scrollLeft() - $(self.wrapper).offset().left);
        //console.log("touchMove   touchX=" + touchX);
        if (config.dragging) {
            config.seconds = touchX * 3600 / config.width;
            $(self.wrapper).css({ overflowX: "hidden" });
            self.draw();
        }

        //handle the touch event for loop operate
        if (config.looping) {
            var loop = config.loop, loopdirection = self.loopdirection;
            if (loopdirection == "left") {
                $(self.wrapper).css({ overflowX: "hidden" });
                loop.left = Math.min(touchX,loop.right);
            } else if (loopdirection == "right") {
                $(self.wrapper).css({ overflowX: "hidden" });
                loop.right = Math.max(touchX, loop.left);;
            }
            config.loop = loop;
            self.draw();
        }
    };

    //handle the touch end event
    Line.pt.touchEnd = function (event) {
        var self = this, config = self.config;
        if (!config.moving) {
            config.seconds = config.touchX * 3600 / config.width;
            self.draw();
        }
        config.dragging = false;
        config.moving = false;
        $(self.wrapper).css({overflowX:"auto"});
    };

    //draw the time line include background,time and file status info.
    Line.pt.draw = function () {
        var self = this, context = self.context;
        self.drawBackground();
        self.drawFileInfo();
        self.drawTimeLine();
        self.drawProgressBar();
        self.drawLoopBar();
        self.drawTips();
    };

    //draw the canvas background and rectangle
    Line.pt.drawBackground = function () {
        var self = this, config = self.config, ctx = self.context, bgColor = "#F5F9FA";
        ctx.clearRect(0, 0, self.canvaswidth, self.canvasheight);

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, config.startY, self.canvaswidth, config.height * 2);

        ctx.strokeStyle = "#d7d7d7";
        ctx.beginPath();
        ctx.rect(0, config.startY, self.canvaswidth, config.height);
        ctx.rect(0, config.startY + config.height, self.canvaswidth, config.height);
        ctx.stroke();
    };

    //draw the tips of file status
    Line.pt.drawTips = function () {
        var self = this, config = self.config, ctx = self.context;
        var width = 25 * config.scale, height = 10 * config.scale, startX = self.wrapper.scrollLeft() - config.left,
            spacing = 15 * config.scale, startY = self.canvasheight - 3 * height;
        var tips = [{ border: "#7ED1FA", fill: "#C2E7F7", text: "有录像"},
                    { border: "#A0AAAE", fill: "#D8D8D8", text: "查询无录像"},
                    { border: "#C63956", fill: "#F46180", text: "下载失败"},
                    { border: "#63BF7D", fill: "#D3ECDB", text: "有摘要"},
                    { border: "#F29677", fill: "#F5DFD8", text: "有目标"},
                    { border: "#62BF7D", fill: "#B6DFC4", text: "摘要中"}];
        
        for (var i = 0; i < tips.length; i++) {
            var tip=tips[i];
            if (i > 0) {
                startX += tips[i - 1].text.length * 20*config.scale + spacing * 4 + width;
            }
            tip.startX = startX;
            tip.startY = startY;
            self.drawTipItem(tip,width,height,spacing);
        }
    };

    //draw tip item by tips info
    Line.pt.drawTipItem = function (info,width,height,spacing) {
        var self = this, config = self.config, ctx = self.context,fontSize=22*config.scale;
        ctx.fillStyle = info.fill;
        ctx.fillRect(info.startX, info.startY, width, height);
        ctx.fillStyle = "#CBD2D8";
        ctx.font = fontSize + "px 微软雅黑";
        ctx.fillText(info.text, info.startX + width + spacing, info.startY + height);
        ctx.beginPath();
        ctx.strokeStyle = info.border;
        ctx.rect(info.startX, info.startY, width, height);
        ctx.closePath();
        ctx.stroke();
    };

    //draw the files time info
    Line.pt.drawTimeLine = function () {
        var self = this, config = self.config,ctx = self.context;
        var filePos = self.getDrawFile(),fontSize = 14*config.scale;
        //console.log("drawTimeLine filePos="+JSON.stringify(filePos));

        ctx.strokeStyle = "#3BA8FB";
        ctx.beginPath();
        ctx.moveTo(0, config.startY);
        ctx.lineTo(self.canvaswidth, config.startY);
        ctx.closePath();
        ctx.stroke();

        //draw hour line
        var startMil = (Math.floor(parseInt(filePos.starttime) / (3600 * 1000)) + 1) * 3600 * 1000,
            startX = config.width * (startMil - filePos.starttime) / (3600 * 1000), startTime = new Date(startMil),
            totalHour = Math.floor((filePos.endtime - filePos.starttime) / (3600 * 1000)),height=5,
            curPos = startX,hourIndex=0,textHeight=10;
        //console.log("drawTimeLine startMil=" + startMil);

        ctx.beginPath();
        for (var i = 0; i < totalHour * 4;i++){
            height = 5;
            if (i % 4 == 0) {
                height = 10;
                var curTime = new Date(startMil + (hourIndex * 3600 * 1000)), hours = curTime.getHours(),
                    shifting = config.width / 8;
                if (hourIndex == totalHour - 1) {
                    shifting = config.width / 3;
                }

                ctx.save();
                ctx.fillStyle = "#828282";
                ctx.font = fontSize+"px 微软雅黑";
                //draw hour info at the line top
                ctx.fillText(hours + self.getNoonDes(hours), curPos - shifting, config.startY - textHeight);
                if (hours == 0) {
                    //draw date info at the line bottom
                    ctx.fillText(curTime.format("date", "/"), curPos - shifting,
                        config.startY + (config.height + textHeight) * 2);
                }
                ctx.restore();
                hourIndex++;
            }
            //draw the vertical line for hours
            ctx.moveTo(curPos, config.startY);
            ctx.lineTo(curPos, config.startY + height);
            curPos += config.width/4;
        }

        //draw the remain vertical line for hours
        while (startX >= 0) {
            height = 5;
            startX -= config.width / 4;
            ctx.moveTo(startX, config.startY);
            ctx.lineTo(startX,config.startY+height);
        }

        ctx.closePath();
        ctx.stroke();
    };

    //draw the files download and abstract info
    //TODO:this method can improve performance
    Line.pt.drawFileInfo = function () {
        var self = this, config = self.config, ctx = self.context;
        var filePos = self.getDrawFile(), filelist = config.filelist, startTime = self.begintime;
        //console.log("drawFileInfo  filePos="+JSON.stringify(filePos));
        for (var i = filePos.startindex; i <= filePos.endindex; i++) {
            var file = filelist[i], color = "black",startX=config.width*(file.begintime-startTime)/(3600*1000)-config.left,
                width = (file.endtime - file.begintime) / (3600 * 1000) * config.width;
            if (file.downloadstatus == 1) {
                self.drawFileProgress("download", file, startX, width);
            } else {
                color = self.getColor("download", parseInt(file.downloadstatus));
                //console.log("drawFileInfo download color="+color);
                ctx.fillStyle = color;
                ctx.fillRect(startX, config.startY, width, config.height);
            }
            //console.log("drawFileInfo   startX=" + startX + "    width=" + width);

            if (file.absstatus == 1) {
                self.drawFileProgress("abs", file, startX, width);
            } else {
                color = self.getColor("abs", parseInt(file.absstatus));
                ctx.fillStyle = color;
                ctx.fillRect(startX, config.startY+config.height, width, config.height);
            }
        }
    };

    //draw the file download or abstract progress info.
    Line.pt.drawFileProgress = function (type,file,startX,filewidth) {
        var self = this, config = self.config, ctx = self.context;
        var status = (type == "download" ? file.downloadstatus : file.absstatus),
            color = self.getColor(type, parseInt(status)), borderColor = (type == "download" ? "#65CEF5" : "#51BE7F"),
            startY = (type == "download" ? config.startY : config.startY + config.height),
            fillColor = (type == "download" ? "#97DCF4" : "#B3E2C5");

        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(startX, startY, filewidth, config.height);
        var progressWidth = (type == "width" ? filewidth * parseInt(file.downloadpercent) / 100 : filewidth * parseInt(file.abspercent) / 100);
        ctx.fillStyle = fillColor;
        ctx.fillRect(startX, startY, progressWidth, config.height);
        ctx.strokeStyle = borderColor;
        ctx.rect(startX, startY, filewidth, config.height);
        ctx.stroke();
        ctx.restore();
    };

    //draw the progress bar.
    Line.pt.drawProgressBar = function () {
        var self = this, config = self.config, ctx = self.context, startX = Math.max(config.width * config.seconds / 3600,config.height/2)-config.left,
            strokeColor = "#60BBFF";
        startX = Math.min(startX, (self.totalhour * config.width - config.height / 2 - config.left));
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(startX, config.startY);
        ctx.lineTo(startX, config.startY + 2 * config.height);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(startX, config.startY + config.height, config.height / 2, 0, 2 * Math.PI, true);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = "#AFDCFD";
        ctx.arc(startX, config.startY + config.height, config.height / 4, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();
        //arc(x, y, radius, 0, 2 * Math.PI, true);
    };
    
    //add listen event to loop button
    Line.pt.addLoopListenEvent = function () {
        var self = this, config = self.config;

        document.getElementById("loopstart").addEventListener("touchstart", function () { self.loopBegin(event); }, false);
        document.getElementById("loopend").addEventListener("touchstart", function () { self.loopEnd(event); }, false);
        document.getElementById("loop").addEventListener("touchstart", function () { self.loopPlay(event); }, false);
    };

    //start loop play
    Line.pt.loopPlay = function (event) {
        var self = this, config = self.config, loop = config.loop;

        if (config.loopstatus == "" || config.loopstatus == "stop") {//start loop
            if (config.looping) {
                config.seconds = loop.left * 3600 / config.width;
                config.loopstatus = "start";
                //$("#loop").text("结束循环");
            }
        } else {//end loop reset all flag
            loop.left = 0;
            loop.right = 0;
            config.loop = loop;
            config.looping = false;
            config.loopstatus = "stop";
            //$("#loop").text("循环播放");
        }
        
    };

    //set the begin position of loop
    Line.pt.loopBegin = function (event) {
        var self = this, config = self.config, ctx = self.context,
            startX = Math.max(config.width * config.seconds / 3600, config.height / 2), loop = config.loop;

        startX = Math.min(startX, (self.totalhour * config.width - config.height / 2));
        var pos = {};
        pos.left = startX;
        pos.right = loop.right;
        if (loop.right <= pos.left) {
            pos.right = pos.left + config.height*2;
        }
        config.loop = pos;
        config.looping = true;
    };

    //set the end position of loop
    Line.pt.loopEnd = function (event) {
        var self = this, config = self.config, ctx = self.context,
            startX = Math.max(config.width * config.seconds / 3600, config.height / 2), loop = config.loop;

        startX = Math.min(startX, (self.totalhour * config.width - config.height / 2));
        var pos = {};
        pos.left = loop.left;
        pos.right = startX;
        if (pos.right <= pos.left) {
            pos.left = Math.max(0, pos.right - config.height * 2);
        }
        config.loop = pos;
        config.looping = true;
    };

    //draw the loop bar
    Line.pt.drawLoopBar = function () {
        var self = this, config = self.config, ctx = self.context, loop = config.loop;
        if (!config.looping) {
            return;
        }
        ctx.beginPath();
        ctx.fillStyle = "rgba(10,10,10,0.5)";
        ctx.fillRect(loop.left-config.left, config.startY, loop.right - loop.left, config.height * 2);
        ctx.fill();
        ctx.closePath();
        self.drawLoopBtn("left", loop.left - config.left);
        self.drawLoopBtn("right", loop.right - config.left);
    };

    //draw loop bar with the params direction and startX
    Line.pt.drawLoopBtn = function (direction, startX) {
        var self = this, config = self.config, ctx = self.context;
        var radiusY = config.startY + config.height, strokeColor = "#60BBFF", radius = config.height / 3, trigle = 10;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(startX, config.startY);
        ctx.lineTo(startX, config.startY + 2 * config.height);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(startX, radiusY, config.height / 2, 0, 2 * Math.PI, true);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = "#B3DCFF";
        if (direction == "left") {
            ctx.moveTo(startX, radiusY);
            ctx.lineTo(startX + Math.sqrt(3) * trigle / 2, radiusY - trigle / 2);
            ctx.lineTo(startX + Math.sqrt(3) * trigle / 2, radiusY + trigle / 2);
            ctx.lineTo(startX, radiusY);
            ctx.moveTo(startX - Math.sqrt(3) * trigle / 2, radiusY);
            ctx.lineTo(startX, radiusY - trigle / 2);
            ctx.lineTo(startX, radiusY + trigle / 2);
            ctx.lineTo(startX - Math.sqrt(3) * trigle / 2, radiusY);
        } else {
            ctx.moveTo(startX, radiusY-trigle/2);
            ctx.lineTo(startX + Math.sqrt(3) * trigle / 2, radiusY);
            ctx.lineTo(startX, radiusY + trigle / 2);
            ctx.lineTo(startX, radiusY - trigle / 2);

            ctx.moveTo(startX, radiusY);
            ctx.lineTo(startX - Math.sqrt(3) * trigle / 2, radiusY - trigle / 2);
            ctx.lineTo(startX - Math.sqrt(3) * trigle / 2, radiusY + trigle / 2);
            ctx.lineTo(startX, radiusY);
        }

        ctx.closePath();
        ctx.fill();
        
    };

    //get the draw color for download status and abstract status.
    Line.pt.getColor = function (type,status) {
        var color;
        if (type == "download") {
            switch (status) {
                case -1://no video
                    color = "#D8D8D8";
                    break;
                case 0://downloading
                    color = "#BCE6F7";
                    break;
                case 1://downloading
                    color = "#BCE6F7";
                    break;
                case 2://downloaded
                    color = "#B9E5F6";
                    break;
                case 3://pause download
                    color = "#BCE6F7";
                    break;
                case 4://fail download
                    color = "#F56080";
                    break;
            }
        } else if (type == "abs") {
            switch (status) {
                case 0://no abs
                    color = "#F5F9FA";
                    break;
                case 1://absing
                    color = "#C8E8D4";
                    break;
                case 2://absed
                    color = "#D1EDDC";
                    break;
                case 3://absing
                    color = "#C8E8D4";
                    break;
                case 4://not need abs
                    break;
            }
        }
        //console.log("getColor type=" + type + "  status=" + status + " color=" + color);
        return color;
    };

    //get the hour description AM or PM
    Line.pt.getNoonDes = function (hour) {
        return (hour > 12 && hour <= 23) ? "PM" : "AM";
    }

    //get the file that we need to draw on the canvas.
    Line.pt.getDrawFile = function () {
        var self = this, config = self.config;
        var beginTime = parseInt(config.filelist[0].begintime),
            startTime = 3600 * 1000 * parseInt(config.left) / config.width + beginTime,
            endTime = startTime + 3600 * 1000 * self.canvaswidth/config.width,
            startIndex = 0, endIndex = 0;
        //console.log("startTime=" + startTime + " ,endTime=" + endTime + "  left=" + $(self.canvas).css("left"));

        for (var i = 0; i < config.filelist.length; i++) {
            var file = config.filelist[i];
            if (self.isFileCoverTime(startTime, file)) {
                startIndex = i;
            }
            if (self.isFileCoverTime(endTime, file)) {
                endIndex = i;
                break;
            }
            if (endTime >= file.begintime && endTime <= file.endtime) {
                endIndex = i;
                break;
            }

            if (i == config.filelist.length - 1 && file.endtime < endTime) {
                endIndex = i;
                break;
            }
        }

        return {startindex:startIndex,endindex:endIndex,starttime:startTime,endtime:endTime};
    };

    //check the time is between the file begintime and endtime.
    Line.pt.isFileCoverTime = function (time, file) {
        return time >= file.begintime && time < file.endtime;
    };

    var fileModel = function () {
        var item = {};
        item.fileid = 0;
        item.filename = "";
        item.filepath = "";
        item.duration = 0;
        item.begintime = 0;
        item.endtime = 0;
        item.absstatus = 2;
        item.downloadstatus = 2;
        item.downloadpercent = random(100);
        item.abspercent = random(100);

        return item;
    };

    var random = function (maxVal) {
        return parseInt(maxVal*Math.random());
    };

    //generate test data
    var generateData = function (hours) {
        var totalHour = hours || 24,duration = 60;
        var end = new Date(), start = new Date(end.getTime() - totalHour * 3600 * 1000);
        var fileList = new Array(), item = {};

        for (var i = 0; i < totalHour * 60 / duration; i++) {
            item = fileModel();
            item.fileid = (i + 1);
            item.filename = "kdnvr" + (i + 1) + ".mp4";
            item.filepath = "D:\\download\\";
            item.begintime = new Date(start.getTime() + i * duration * 60 * 1000).getTime();
            item.endtime = item.begintime + duration * 60 * 1000;
            item.duration = duration * 3600;
            item.absstatus = random(3);
            item.downloadstatus = random(3);
            fileList.push(item);
            //console.log("fileinfo="+JSON.stringify(item));
        }

        //console.log("generateData file count=" + fileList.length);
        var removeCount = Math.min(fileList.length / 8, 5);
        removeCount = 0;
        for (var i = 0; i < removeCount; i++) {
            var index = Math.floor(Math.random() * fileList.length);
            fileList.splice(index,1);
        }
        //console.log("generateData file count=" + fileList.length);
        return fileList;
    };

    var run = function () {
        $ = jQuery;
        $.timeline = function (settings) {
            var line = new Line(settings);
            return line.index;
        };
    };

    run();
})(window);