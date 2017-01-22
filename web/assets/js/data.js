
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


function getProducts(code){
    getProduct(code, function(err, prod){
        pr = convertProduct(prod);
        prodlist[code] = pr;
        parentlist[code] = pr.parents;
        for(i=0; i< pr.parents.length; i++){
            getProducts(pr.parents[i], ()=>{});
        }
        console.log("Product Added");
    })
}


function convertProduct(prod) {
    return createProduct(prod.name, prod.actions, false, prod.parentProducts, false);
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
