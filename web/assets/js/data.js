
const PRO = 'P';
const ACT = 'A';
const LINK = 'L';
const MORE = 'M';

function createProduct(name, actions, isConsumed, parents, hasChilds) {
    obj = {
        TYP: PRO,
        name: name,
        actions: actions,
        isConsumed: isConsumed,
        parents: parents,
        hasChilds: hasChilds
    };
    return obj;
}

function createAction(handler, desc, lon, lat, timestamp, blockNumber) {
    obj = {
        TYP: ACT,
        handler: handler,
        desc: desc,
        lon: lon,
        lat: lat,
        timestamp: timestamp,
        blockNumber: blockNumber
    };
    return obj;
}

function createLink(col, type){
    obj = {
        TYP: LINK,
        col: col,
        type: type
    };
    return obj;
}

function createMore(type){
    obj = {
        TYP: MORE,
        type: type
    };
    return obj;
}

p1 = createProduct('1', [], true, [], true);
p2 = createProduct('2', [], true, [p1], false);
a1 = createAction('H1', 'DESC', 12.1111, 32.1111, 11231231, 12);
p3 = createProduct('3', [a1], true, [p2], false);
p6 = createProduct('6', [], true, [], false);
p4 = createProduct('4', [], true, [p6], false);
p5 = createProduct('5', [], true, [p3,p4], true);

var graph = [];
var cgraph = {};
var vgraph = {};
var start = {};
var end = {};
var cols = [];
var row = 0;
var right = true;
const MOREC = 'MC';
const MORER = 'MR';
const MOREL = 'ML';
const LL = 'L';
const J = 'J';
const I = 'I';
var actcol = '1';
var totallength = 0;

var x = 0;

var prodlist = {}
var parentlist = {}



function prepareData(code) {
    cookParents(code);

    return prodlist[code];
}

var methods = {

    init: function (options) {

        plugin.options = $.extend({}, plugin.defaults, options);
        // iterate and reformat each matched element
        return this.each(function (index) {

            plugin.options = $.meta
                ? $.extend(plugin.options, $(this).data())
                : plugin.options;

            plugin._debug("BEGIN: " + plugin.identity() + " for element " + index);

            plugin._render($(this));

            plugin._debug("END: " + plugin.identity() + " for element " + index);
        });

    },
    drawLine: function (data) {
        plugin._drawLine(data.element, data.scale, data.rows, data.columns, data.color, data.width, data.nodes);
    }
}

var plugin = {

    defaults: {
        debug: false,
        grid: false
    },

    options: {
    },

    identity: function (type) {
        if (type === undefined) type = "name";

        switch (type.toLowerCase()) {
            case "version": return "1.0.0"; break;
            default: return "subwayMap Plugin"; break;
        }
    },
    _debug: function (s) {
        if (this.options.debug)
            this._log(s);
    },
    _log: function () {
        if (window.console && window.console.log)
            window.console.log('[subwayMap] ' + Array.prototype.join.call(arguments, ' '));
    },
    _supportsCanvas: function () {
        var canvas = $("<canvas></canvas>");
        if (canvas[0].getContext)
            return true;
        else
            return false;
    },
    _getCanvasLayer: function (el, overlay) {
        this.layer++;
        var canvas = $("<canvas style='position:absolute;z-Index:" + ((overlay ? 2000 : 1000) + this.layer) + "' width='" + this.options.pixelWidth + "' height='" + this.options.pixelHeight + "'></canvas>");
        el.append(canvas);
        return (canvas[0].getContext("2d"));
    },
    _render: function (el) {

        this.layer = -1;
        var rows = el.attr("data-rows");
        if (rows === undefined)
            rows = 10;
        else
            rows = parseInt(rows);

        var columns = el.attr("data-columns");
        if (columns === undefined)
            columns = 10;
        else
            columns = parseInt(columns);

        $(el).height(rows*80)
        $(el).width(columns*80)

        var scale = el.attr("data-cellSize");
        if (scale === undefined)
            scale = 100;
        else
            scale = parseInt(scale);

        var lineWidth = el.attr("data-lineWidth");
        if (lineWidth === undefined)
            lineWidth = 10;
        else
            lineWidth = parseInt(lineWidth);

        var textClass = el.attr("data-textClass");
        if (textClass === undefined) textClass = "";

        var grid = el.attr("data-grid");
        if ((grid === undefined) || (grid.toLowerCase() == "false"))
            grid = false;
        else
            grid = true;

        var legendId = el.attr("data-legendId");
        if (legendId === undefined) legendId = "";

        var gridNumbers = el.attr("data-gridNumbers");
        if ((gridNumbers === undefined) || (gridNumbers.toLowerCase() == "false"))
            gridNumbers = false;
        else
            gridNumbers = true;

        var reverseMarkers = el.attr("data-reverseMarkers");
        if ((reverseMarkers === undefined) || (reverseMarkers.toLowerCase() == "false"))
            reverseMarkers = false;
        else
            reverseMarkers = true;


        this.options.pixelWidth = columns * scale;
        this.options.pixelHeight = rows * scale;

        //el.css("width", this.options.pixelWidth);
        //el.css("height", this.options.pixelHeight);
        self = this;
        var lineLabels = [];
        var supportsCanvas = $("<canvas></canvas>")[0].getContext;
        if (supportsCanvas) {

            if (grid) this._drawGrid(el, scale, gridNumbers);
            $(el).children("line").each(function (index) {
                var ul = $(this);

                var color = $(ul).attr("data-color");
                if (color === undefined) color = "#000000";

                var lineTextClass = $(ul).attr("data-textClass");
                if (lineTextClass === undefined) lineTextClass = "";

                var shiftCoords = $(ul).attr("data-shiftCoords");
                if (shiftCoords === undefined) shiftCoords = "";

                var shiftX = 0.00;
                var shiftY = 0.00;
                if (shiftCoords.indexOf(",") > -1) {
                    shiftX = parseInt(shiftCoords.split(",")[0]) * lineWidth/scale;
                    shiftY = parseInt(shiftCoords.split(",")[1]) * lineWidth/scale;
                }

                var lineLabel = $(ul).attr("data-label");
                if (lineLabel === undefined)
                    lineLabel = "Line " + index;

                lineLabels[lineLabels.length] = {label: lineLabel, color: color};

                var nodes = [];
                $(ul).children("point").each(function () {

                    var coords = $(this).attr("data-coords");
                    if (coords === undefined) coords = "";

                    var dir = $(this).attr("data-dir");
                    if (dir === undefined) dir = "";

                    var labelPos = $(this).attr("data-labelPos");
                    if (labelPos === undefined) labelPos = "s";

                    var marker = $(this).attr("data-marker");
                    if (marker == undefined) marker = "";

                    var markerInfo = $(this).attr("data-markerInfo");
                    if (markerInfo == undefined) markerInfo = "";

                    var anchor = $(this).children("a:first-child");
                    var label = $(this).text();
                    if (label === undefined) label = "";

                    var link = "";
                    var title = "";
                    if (anchor != undefined) {
                        link = $(anchor).attr("href");
                        if (link === undefined) link = "";
                        title = $(anchor).attr("title");
                        if (title === undefined) title = "";
                    }

                    self._debug("Coords=" + coords + "; Dir=" + dir + "; Link=" + link + "; Label=" + label + "; labelPos=" + labelPos + "; Marker=" + marker);

                    var x = "";
                    var y = "";
                    if (coords.indexOf(",") > -1) {
                        x = Number(coords.split(",")[0]) + (marker.indexOf("interchange") > -1 ? 0 : shiftX);
                        y = Number(coords.split(",")[1]) + (marker.indexOf("interchange") > -1 ? 0 : shiftY);
                    }
                    nodes[nodes.length] = { x: x, y:y, direction: dir, marker: marker, markerInfo: markerInfo, link: link, title: title, label: label, labelPos: labelPos};
                });
                if (nodes.length > 0)
                    self._drawLine(el, scale, rows, columns, color, (lineTextClass != "" ? lineTextClass : textClass), lineWidth, nodes, reverseMarkers);
                $(ul).remove();
            });
            if ((lineLabels.length > 0) && (legendId != ""))
            {
                var legend = $("#" + legendId);

                for(var line=0; line<lineLabels.length; line++)
                    legend.append("<div><span style='float:left;width:100px;height:" + lineWidth + "px;background-color:" + lineLabels[line].color + "'></span>" + lineLabels[line].label + "</div>");
            }

        }
    },
    _drawLine: function (el, scale, rows, columns, color, textClass, width, nodes, reverseMarkers) {

        var ctx = this._getCanvasLayer(el, false);
        ctx.beginPath();
        ctx.moveTo(nodes[0].x * scale, nodes[0].y * scale);
        var markers = [];
        var lineNodes = [];
        var node;
        for(node = 0; node < nodes.length; node++)
        {
            if (nodes[node].marker.indexOf("@") != 0)
                lineNodes[lineNodes.length] = nodes[node];
        }
        for (var lineNode = 0; lineNode < lineNodes.length; lineNode++) {
            if (lineNode < (lineNodes.length - 1)) {
                var nextNode = lineNodes[lineNode + 1];
                var currNode = lineNodes[lineNode];

                // Correction for edges so lines are not running off campus
                var xCorr = 0;
                var yCorr = 0;
                if (nextNode.x == 0) xCorr = width / 2;
                if (nextNode.x == columns) xCorr = -1 * width / 2;
                if (nextNode.y == 0) yCorr = width / 2;
                if (nextNode.y == rows) yCorr = -1 * width / 2;

                var xVal = 0;
                var yVal = 0;
                var direction = "";

                var xDiff = Math.round(Math.abs(currNode.x - nextNode.x));
                var yDiff = Math.round(Math.abs(currNode.y - nextNode.y));
                if ((xDiff == 0) || (yDiff == 0)) {
                    // Horizontal or Vertical
                    ctx.lineTo((nextNode.x * scale) + xCorr, (nextNode.y * scale) + yCorr);
                }
                else if ((xDiff == 1) && (yDiff == 1)) {
                    // 90 degree turn
                    if (nextNode.direction != "")
                        direction = nextNode.direction.toLowerCase();
                    switch (direction) {
                        case "s": xVal = 0; yVal = scale; break;
                        case "e": xVal = scale; yVal = 0; break;
                        case "w": xVal = -1 * scale; yVal = 0; break;
                        default: xVal = 0; yVal = -1 * scale; break;
                    }
                    ctx.quadraticCurveTo((currNode.x * scale) + xVal, (currNode.y * scale) + yVal,
                        (nextNode.x * scale) + xCorr, (nextNode.y * scale) + yCorr);
                }
                else if (xDiff == yDiff) {
                    // Symmetric, angular with curves at both ends
                    if (nextNode.x < currNode.x) {
                        if (nextNode.y < currNode.y)
                            direction = "nw";
                        else
                            direction = "sw";
                    }
                    else {
                        if (nextNode.y < currNode.y)
                            direction = "ne";
                        else
                            direction = "se";
                    }
                    var dirVal = 1;
                    switch (direction) {
                        case "nw": xVal = -1 * (scale / 2); yVal = 1; dirVal = 1; break;
                        case "sw": xVal = -1 * (scale / 2); yVal = -1; dirVal = 1; break;
                        case "se": xVal = (scale / 2); yVal = -1; dirVal = -1; break;
                        case "ne": xVal = (scale / 2); yVal = 1; dirVal = -1; break;
                    }
                    this._debug((currNode.x * scale) + xVal + ", " + (currNode.y * scale) + "; " + (nextNode.x + (dirVal * xDiff / 2)) * scale + ", " +
                        (nextNode.y + (yVal * xDiff / 2)) * scale);
                    ctx.bezierCurveTo(
                        (currNode.x * scale) + xVal, (currNode.y * scale),
                        (currNode.x * scale) + xVal, (currNode.y * scale),
                        (nextNode.x + (dirVal * xDiff / 2)) * scale, (nextNode.y + (yVal * xDiff / 2)) * scale);
                    ctx.bezierCurveTo(
                        (nextNode.x * scale) + (dirVal * scale / 2), (nextNode.y) * scale,
                        (nextNode.x * scale) + (dirVal * scale / 2), (nextNode.y) * scale,
                        nextNode.x * scale, nextNode.y * scale);
                }
                else
                    ctx.lineTo(nextNode.x * scale, nextNode.y * scale);
            }
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        ctx = this._getCanvasLayer(el, true);
        for (node = 0; node < nodes.length; node++) {
            this._drawMarker(el, ctx, scale, color, textClass, width, nodes[node], reverseMarkers);
        }


    },
    _drawMarker: function (el, ctx, scale, color, textClass, width, data, reverseMarkers) {

        if (data.label == "") return;
        if (data.marker == "") data.marker = "bubble";

        // Scale coordinates for rendering
        var x = data.x * scale;
        var y = data.y * scale;

        // Keep it simple -- black on white, or white on black
        var fgColor = "#000000";
        var bgColor = "#5c90d2";
        if (reverseMarkers)
        {
            fgColor = "#ffffff";
            bgColor = "#000000";
        }

        // Render station and interchange icons
        ctx.strokeStyle = color;
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        switch(data.marker.toLowerCase())
        {
            case "small":
            case "@small":
                ctx.fillStyle = "#ffffff";
                ctx.lineWidth = width*1.3;
                if (data.markerInfo == "")
                    ctx.arc(x, y, width * 1.3, 0, Math.PI * 2, true);
                else
                {
                    var mDir = data.markerInfo.substr(0,1).toLowerCase();
                    var mSize = parseInt(data.markerInfo.substr(1,10));
                    if (((mDir == "v") || (mDir == "h")) && (mSize > 1))
                    {
                        if (mDir == "v")
                        {
                            ctx.arc(x, y, width * 1.5,290 * Math.PI/180, 250 * Math.PI/180, false);
                            ctx.arc(x, y-(width*mSize), width * 0.7,110 * Math.PI/180, 70 * Math.PI/180, false);
                        }
                        else
                        {
                            ctx.arc(x, y, width * 1.5,20 * Math.PI/180, 340 * Math.PI/180, false);
                            ctx.arc(x+(width*mSize), y, width * 0.7,200 * Math.PI/180, 160 * Math.PI/180, false);
                        }
                    }
                    else
                        ctx.arc(x, y, width * 1.5, 0, Math.PI * 2, true);
                }
                break;
            case "bubble":
            case "@bubble":
                ctx.lineWidth = 0;
                ctx.arc(x, y, width*4.5, 0, Math.PI * 2, true);
                break;
            case "lower-end":
                ctx.lineWidth = width;
                ctx.moveTo(x,y+5);
                ctx.lineTo(x,y+15);
                ctx.moveTo(x,y+20);
                ctx.lineTo(x,y+25);
                break;
            case "upper-end":
                ctx.lineWidth = width;
                ctx.moveTo(x,y-5);
                ctx.lineTo(x,y-15);
                ctx.moveTo(x,y-20);
                ctx.lineTo(x,y-25);
                break;
            case "right-end":
                ctx.lineWidth = width;
                ctx.moveTo(x+5,y);
                ctx.lineTo(x+15,y);
                ctx.moveTo(x+20,y);
                ctx.lineTo(x+25,y);
                break;
            case "left-end":
                ctx.lineWidth = width;
                ctx.moveTo(x-5,y);
                ctx.lineTo(x-15,y);
                ctx.moveTo(x-20,y);
                ctx.lineTo(x-25,y);
                break;

        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // Render text labels and hyperlinks
        var pos = "";
        var offset = width + 4;
        var topOffset = 0;
        var centerOffset = "-50px";
        switch(data.labelPos.toLowerCase())
        {
            case "n":
                pos = "text-align: center; margin: 0 0 " + offset + "px " + centerOffset;
                topOffset = offset * 2;
                break;
            case "w":
                pos = "text-align: right; margin:0 " + offset + "px 0 -" + (100 + offset) + "px";
                topOffset = offset;
                break;
            case "e":
                pos = "text-align: left; margin:0 0 0 " + offset + "px";
                topOffset = offset;
                break;
            case "s":
                pos = "text-align: center; margin:" + offset + "px 0 0 " + centerOffset;
                break;
            case "se":
                pos = "text-align: left; margin:" + offset + "px 0 0 " + offset + "px";
                break;
            case "ne":
                pos = "text-align: left; padding-left: " + offset + "px; margin: 0 0 " + offset + "px 0";
                topOffset = offset * 2;
                break;
            case "sw":
                pos = "text-align: right; margin:" + offset + "px 0 0 -" + (100 + offset) + "px";
                topOffset = offset;
                break;
            case "nw":
                pos = "text-align: right; margin: -" + offset + "px 0 0 -" + (100 + offset) + "px";
                topOffset = offset;
                break;
            default:
                pos = "text-align: center; margin: -10px 0 0 " + centerOffset;
                topOffset = 0;
                break;
        }
        var style = (textClass != "" ? "class='" + textClass + "' " : "") + "style='" + (textClass == "" ? "font-size:8pt;font-family:Verdana,Arial,Helvetica,Sans Serif;text-decoration:none;" : "") + "width:100px;" + (pos != "" ? pos : "") + ";position:absolute;top:" + (68+y) + "px;left:" + (x + 35) + "px;z-index:3000;'";
        if (data.link != "")
            $("<a " + style + " title='" + data.title.replace(/\\n/g,"<br />") + "' href='" + data.link + "' target='_new'>" + data.label.replace(/\\n/g,"<br />") + "</span>").appendTo(el);
        else
        //$("<span " + style + ">" + data.label.replace(/\\n/g,"<br />") + "</span>").appendTo(el);
            $("<span " + style + "><i style='font-size: large; color: white' class='" + data.label.replace(/\\n/g,"<br />") + "'></i></span>").appendTo(el);

    },
    _drawGrid: function (el, scale, gridNumbers) {

        var ctx = this._getCanvasLayer(el, false);
        ctx.fillStyle = "#000";
        ctx.beginPath();
        var counter = 0;
        for (var x = 0.5; x < this.options.pixelWidth; x += scale) {
            if (gridNumbers)
            {
                ctx.moveTo(x, 0);
                ctx.fillText(counter++, x-15, 10);
            }
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.options.pixelHeight);
        }
        ctx.moveTo(this.options.pixelWidth - 0.5, 0);
        ctx.lineTo(this.options.pixelWidth - 0.5, this.options.pixelHeight);

        counter = 0;
        for (var y = 0.5; y < this.options.pixelHeight; y += scale) {
            if (gridNumbers)
            {
                ctx.moveTo(0, y);
                ctx.fillText(counter++, 0, y-15);
            }
            ctx.moveTo(0, y);
            ctx.lineTo(this.options.pixelWidth, y);
        }
        ctx.moveTo(0, this.options.pixelHeight - 0.5);
        ctx.lineTo(this.options.pixelWidth, this.options.pixelHeight - 0.5);
        ctx.strokeStyle = "#eee";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fill();
        ctx.closePath();

    }
};
function getProducts(code, callback){
    getProduct(code, function(err, prod){
        pr = convertProduct(prod);
        prodlist[code] = pr;
        parentlist[code] = pr.parents;

        if (pr.parents.length == 0) callback();
        else {
            for(i=0; i< pr.parents.length; i++){
                if (i == pr.parents.length - 1)getProducts(pr.parents[i], function(){            callback();
                });
                else getProducts(pr.parents[i], function(){});
            }
        }
        console.log("Product Added");
    })
}

function subwaymap(method, element) {
        if (methods[method]) {
            return methods[method].apply(element, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(element, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tooltip');
        }
}

function convertProduct(prod) {
    return createProduct(web3.toAscii(prod.name).replace(/[^\w\s]/gi, ''), prod.actions, false, prod.parentProducts, false);
}


function cookParents(code){
    prodlist[code].parents = [];
    for(pcode in parentlist[code]){
        prodlist[code].parents.push(prodlist[parentlist[code][pcode]]);
        cookParents(parentlist[code][pcode]);
    }
}


function generateVgraph(){
    vgraph =  $.extend({}, cgraph);
    maxnum=0;
    for(i=0; i<cols.length;i++){
        maxnum=maxnum > cgraph[cols[i]].length ? maxnum : cgraph[cols[i]].length;
    }
    prev = 0
    for(i=0; i<maxnum; i++){
        for(j=0; j<cols.length;j++){
            done = false;
            for(k=0; k<cols.length; k++) {
                if (cgraph[cols[j]][i] && cgraph[cols[k]][i]) {

                    if ((cgraph[cols[j]][i].TYP == PRO || cgraph[cols[j]][i].TYP == ACT) && (cgraph[cols[k]][i].TYP == PRO || cgraph[cols[k]][i].TYP == ACT) && j != k) {
                        done = true;
                        vgraph[cols[k]].splice(i, 0, createLink(cols[k], I));
                    }
                }
            }
            if(done){
                vgraph[cols[j]].splice(i+1,0,createLink(cols[j], I));
            }
        }
    }
}

function getTextList(){
    list = [];
    for(i=totallength-1;i>=0;i--){
        done = false;
        for(j=0;j<cols.length;j++){
            if (vgraph[cols[j]][i]) {
                if (vgraph[cols[j]][i].TYP == PRO){
                    list.push('<div style="height: 80px; line-height: 80px;" class="listitem"><div  style="display:inline-block;padding: 0 20px;width: '+width*80+'px;"><span class="label label-default">'+i+'</span></div> <p style="display: inline">'+vgraph[cols[j]][i].name+'</p> </div>')
                    done=true;
                    break;
                } else if (vgraph[cols[j]][i].TYP == ACT) {
                    list.push('<div style="height: 80px; line-height: 80px;" class="listitem" ><div style="display:inline-block;padding: 0 20px;width: '+width*80+'px;"><span class="label label-default">'+i+'</span></div> <p style="display: inline">'+vgraph[cols[j]][i].desc+'</p> </div>')
                    done=true;
                    break;
                }
            }
        }
        if(!done){
            list.push('<div style="height: 80px;"></div>')
        }
    }
    return list;
}

function generateMap(p){
    createGraph(p);
    generateVgraph();
    maxnum=0;
    for(i=0; i<cols.length;i++){
        maxnum=maxnum > vgraph[cols[i]].length ? maxnum : vgraph[cols[i]].length;
    }
    totallength=maxnum
    length = maxnum+1;
    width = cols.length+1;

    $('#subway-map').attr('data-columns', width);
    $('#subway-map').attr('data-rows', length);
    $('#subway-map').empty();

    $('#item-list').empty();



    for(i=0; i<cols.length; i++){
        $('#subway-map').append('<line data-color="#AFAFAF" id="col-'+cols[i]+'"></line>')
        for (j=0; j<vgraph[cols[i]].length; j++){
            draw(vgraph[cols[i]][j], cols[i], j);
        }
    }

    textlist = getTextList();
    for(i=0; i<totallength; i++){
        $('#item-list').append(textlist[i]);
    }


}

function draw(object, col, row){
    icol = cols.indexOf(col)+1;
    irow = totallength - row;
    if(object){
        switch(object.TYP){
            case PRO:
                $('#col-'+col).prepend('<point data-coords="'+icol+','+irow+'" data-labelpos="c">si si-check fa-2x</point>');
                break;
            case ACT:
                $('#col-'+col).prepend('<point data-coords="'+icol+','+irow+'" data-marker="small"> </point>');
                break;
            case LINK:
                if(object.type==LL)
                    $('#col-'+col).prepend('<point data-coords="'+(icol+1)+','+irow+'" data-dir="S"><a>   </a></point>');
                else if(object.type==J)
                    $('#col-'+col).prepend('<point data-coords="'+(icol-1)+','+irow+'" data-dir="S"><a>   </a></point>');
                else
                    $('#col-'+col).prepend('<point data-coords="'+icol+','+irow+'"></point>');
                break;
            case MORE:
                if(object.type==MOREC)
                    $('#col-'+col).prepend('<point data-coords="'+icol+','+irow+'" data-marker="lower-end"><a>   </a></point>');
                else if(object.type=MOREL)
                    $('#col-'+col).prepend('');
                else
                    $('#col-'+col).prepend('');
                break;
        }
    }

}

function createGraph(product) {

    ghparents = processProduct(product, row, actcol);

    for(j=0; j<ghparents.length; j++){
        moreparents = processProduct(ghparents[j].parent, ghparents[j].row, ghparents[j].col);
        if (moreparents.length > 0){
            ghparents.push(moreparents);
        }
    }

}

function processProduct(product, startrow, startcol) {
    row = startrow;
    col = startcol;
    if (graph.length == 0) {
        col = actcol;
        cols.push(actcol);
        start[actcol] = row;
        cgraph[actcol] = [];

        if(product.hasChilds){
            dict = {};
            dict[col] = createMore(MOREC);
            graph.push(dict);
            cgraph[col][row] = createMore(MOREC);
            row++;
            totallength++;
        }
    }

    dict = {};

    for(i=product.actions.length-1; i>=0; i--){
        cgraph[col][row]=product.actions[i];
        row++;
        totallength++;
    }

    dict = {};
    dict[col] = product;
    cgraph[col][row] = product;
    totallength++;

    parents = [];

    if(product.parents.length > 1) {

        totallength -= product.parents.length;

        for(i=0, b=false; i<product.parents.length; i++,b=!b){
            actcol+=1;
            if(b)
                cols.splice(cols.indexOf(col)+1,0,actcol);
            else
                cols.splice(cols.indexOf(col),0,actcol);

            dict[actcol] = b ? createLink(col,J):createLink(col,LL);
            cgraph[actcol] = [];
            cgraph[actcol][row] = b ? createLink(col,J):createLink(col,LL);
            newrow = row+1;
            parents.push({parent:product.parents[i], row:newrow, col: actcol});
        }

        end[col] = row;

    } else if (product.parents.length == 1){
        row++;
        totallength++;
        parents = processProduct(product.parents[0], row, col);

    } else {
        end[col] = row;
    }
    row++;

    graph.push(dict);

    return parents;

}
