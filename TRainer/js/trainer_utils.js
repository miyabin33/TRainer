function zeroFormat(num, length){
    var ret = '' + num;
    while(ret.length < length){ ret = "0" + ret; }
    return ret;
}

function display_resize(gl, id){
    // var dpr = window.devicePixelRatio || 1;
    var dpr = 1.0;
    var c = document.getElementById(id);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    gl.viewport(0, 0, c.width, c.height);
    c.style.width = window.innerWidth + 'px';
    c.style.height = window.innerHeight + 'px';
    // console.log(id + ' display resized to ' + c.width + 'x' + c.height);
}



function create_framebuffer(gl, width, height){
    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    var depthRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
    var fTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
}


//日本の地形データの読み取り＆抜き出しを行う関数
function gmt_parser(file){
    var coord = new Array(), alpha = new Array();
    var xhr = new XMLHttpRequest();
    xhr.open("get", file, false); xhr.send(null);
    var tmpArray = xhr.responseText.split("\n");
    var alpha_frag = false;

//＃や＞の行を飛ばし（無視し）数字だけ抜き取る作業
    for(var i = 0; i < tmpArray.length; i++){
        var word = ' @' + tmpArray[i];
        if(word.indexOf(' @' + '#') != -1){ console.log("gmt_parser() started parsing."); }
        else if(word.indexOf(' @' + '>') != -1){
            //解析が次の＞ Shoreまで行ったときにそこで座標を一旦区切る作業
            //これを行わないとすべてが一筆書きで表示される
            if(coord.length === 0){ continue; }
            coord.push(coord[coord.length - 2], coord[coord.length - 1]);
            alpha.push(0.0);
            alpha_frag = true;
        }else if(tmpArray[i].length === 0){ console.log("gmt_parser() finished parsing."); }
        //数字抜き出し
        else{
            var tmpData = tmpArray[i].split(String.fromCharCode(9));
            if(alpha_frag){
                coord.push(tmpData[0], tmpData[1]);
                alpha.push(0.0);
                alpha_frag = false;
            }
            coord.push(tmpData[0], tmpData[1]);
            alpha.push(1.0);
        }
    }

    var pos = new Array(), col = new Array(), anim = new Array();

    var cnt = 0;
    for(var i = 0; i < coord.length; i += 2){
        if(!coord[i + 1]){ continue; }
        pos.push(coord[i], coord[i + 1], 0.0);
        anim.push(0.1);
        col.push(0.5, 0.5, 0.5, alpha[cnt]);
        cnt++;
    }

    return {p : pos, c : col, a : anim};
}


function meshPlacer(min_lon, max_lon, min_lat, max_lat){
    var pos = new Array(); var idx = new Array(); var tex = new Array(); var col = new Array();
    var meshSize = 0.125;
    var ms = meshSize * 0.25;
    var count = 0;
    for(var x = min_lon; x <= max_lon; ++x){
        for(var y = min_lat; y <= max_lat; ++y){
            var idxOffset = count * 4;
            pos.push(x - ms, y + ms, 0.0); tex.push(0.0, 0.0); col.push(1.0, 1.0, 1.0, 1.0);
            pos.push(x + ms, y + ms, 0.0); tex.push(1.0, 0.0); col.push(1.0, 1.0, 1.0, 1.0);
            pos.push(x + ms, y - ms, 0.0); tex.push(1.0, 1.0); col.push(1.0, 1.0, 1.0, 1.0);
            pos.push(x - ms, y - ms, 0.0); tex.push(0.0, 1.0); col.push(1.0, 1.0, 1.0, 1.0);
            idx.push(0 + idxOffset, 1 + idxOffset, 2 + idxOffset, 2 + idxOffset, 3 + idxOffset, 0 + idxOffset);
            count++;
        }
    }
    return {p : pos, i : idx, t : tex, c : col};
}


//路線図・路線名のデータの読み取り＆抜き出しを行う関数
function Tdata_parser(file){
    var coord = new Array(), alpha = new Array();
    var id = new Array(), pos = new Array(), col = new Array(), anim = new Array();
    var xhr = new XMLHttpRequest();
    xhr.open("get", file, false); xhr.send(null);
    var tmpArray = xhr.responseText.split("\n");
    var tmpID = null;

    var alpha = false;
    var station = false;

    var posList = false;

    var ksj_begin = 0;

    var green = [0.25, 1.0, 0.25, 1.0];
    var yellow = [1.0, 0.725, 0.05, 1.0];
    var red = [1.0, 0.075, 0.05, 1.0];


    console.log("data_parser(): started parsing.");

    //ここからデータ解析
    for(var i = 0; i < tmpArray.length; i++){
        if(tmpArray[i].indexOf('<ksj:Station') != -1){
            ksj_begin = i;
            console.log("data_parser(): ksj_begin = " + i + ",");
            break;
        }
        //抜き出したい情報であるcv_sta１～までは飛ばし、それを発見したらstationフラグをオンにする
        if(tmpArray[i].indexOf('<gml:Curve gml:id="') != -1){
            tmpArray[i] = tmpArray[i].replace(/<gml:Curve gml:id="/g, '');
            tmpID = tmpArray[i].replace(/">/g, '');
            if(tmpID.indexOf('cv_sta') != -1){
                station = true;
            }
            // console.log(tmpID);
        }

        //日本地図と同じように一筆書きにならないようにする
        if(!station){ //without station
            if(tmpArray[i].indexOf('</gml:posList>') != -1){
                posList = false;
                alpha = false;
                id.push(null);
                pos.push(pos[pos.length - 3], pos[pos.length - 2], pos[pos.length - 1]);
                anim.push(0.0); col.push(0.0, 0.0, 0.0, 0.0);
            }

            if(posList){
                tmpArray[i] = tmpArray[i].replace(/\t/g, '');
                var tmpData = tmpArray[i].split(' ');
                if(alpha){
                    id.push(null);
                    pos.push(parseFloat(tmpData[1]), parseFloat(tmpData[0]), 0.0);
                    anim.push(0.0); col.push(0.0, 0.0, 0.0, 0.0);
                    alpha = false;
                }
                id.push(tmpID);
                pos.push(parseFloat(tmpData[1]), parseFloat(tmpData[0]), 0.0);
                anim.push(0.0); col.push(green[0], green[1], green[2], green[3]);
            }

            if(tmpArray[i].indexOf('<gml:posList>') != -1){
                posList = true;
                alpha = true;
            }
        }

        if(tmpArray[i].indexOf('</gml:Curve>') != -1){
            station = false;
        }
    }


    console.log("data_parser(): finished stage1 parsing.");


    var next = ksj_begin;
    var matched = false;
    var name = null;

    //路線名の読み取り＆置き換え保管
    for(var i = 0; i < id.length; i++){
        if(id[i] != null){
            for(var j = next; j < tmpArray.length; j++){
                if(tmpArray[j].indexOf(id[i]) != -1){
                    matched = true;
                    // console.log(id[i]);
                    next = j;
                }else if(matched){
                    if(tmpArray[j].indexOf('<ksj:railwayLineName>') != -1){
                        var temp = tmpArray[j].replace(/\t/g, '');
                        temp = temp.replace(/<ksj:railwayLineName>/g, '');
                        temp = temp.replace(/<\/ksj:railwayLineName>/g, '');
                        name = temp;
                    }else if(tmpArray[j].indexOf('<ksj:operationCompany>') != -1){
                        var temp = tmpArray[j].replace(/\t/g, '');
                        temp = temp.replace(/<ksj:operationCompany>/g, '');
                        temp = temp.replace(/<\/ksj:operationCompany>/g, '');
                        id[i] = name + '-' + temp;
                        // console.log(name);
                        matched = false;
                        break;
                    }
                }
            }
            // console.log(id[i]);
        }
    }
    console.log("data_parser(): finished parsing.");

    return {i : id, p : pos, c : col, a : anim};
}




function Tdata_update(data){
    var green = [0.25, 1.0, 0.25, 1.0];
    var yellow = [1.0, 0.725, 0.05, 1.0];
    var red = [1.0, 0.075, 0.05, 1.0];

    var datafile = [
        ["総武線-東日本旅客鉄道", yellow],
        ["京葉線-東日本旅客鉄道", red],
        ["中央線-東日本旅客鉄道", yellow],
        ["青梅線-東日本旅客鉄道", yellow],
        ["成田空港線-京成電鉄", red],
        ["北総線-北総鉄道", red],
        ["1号線浅草線-東京都", red]
    ];

    //遅延情報読み取り（中断）
    /*var file = ('https://transit.yahoo.co.jp/traininfo/area/4/');
    if(!file){
        console.log("faile");
    }
    var xhr = new XMLHttpRequest();
    xhr.open("get", file, true); xhr.send(null);
    var tmpArray = xhr.responseText.split("\n");
    //console.log(tmpArray);

    for(var i = 0; i < tmpArray.length; i++){
        var word = tmpArray[i], train = new Array(), trash;
        if(word.match('<div class="elmTblLstLine trouble">')){
            if(word.indexOf('<td><a href="https://transit.yahoo.co.jp/traininfo/detail/')){
                train = word.replace(/<td><a href="https:\/\/transit.yahoo.co.jp\/traininfo\/detail\//g, '@');
                train = train.replace(/\/0\/">/g, '-');
                train = train.replace(/<\/a><\/td>/g, '[');
                train = train.substring('-', '[');
                console.log(train);
            }
        }
    }*/

// sample
/*
<div class="elmTblLstLine trouble">
<table>
<tr>
<th>路線</th>
<th>状況</th>
<th>詳細</th>
</tr>
<tr>
<td><a href="https://transit.yahoo.co.jp/traininfo/detail/62/0/">総武本線[千葉～銚子]</a></td>
<td><span class="icnAlert">[!]</span><span class="colTrouble">列車遅延</span></td>
<td>千葉駅で車両点検を行った影響で…</td>
</tr>
<tr>
<td><a href="https://transit.yahoo.co.jp/traininfo/detail/68/0/">成田線[佐倉～成田空港・銚子]</a></td>
<td><span class="icnAlert">[!]</span><span class="colTrouble">列車遅延</span></td>
<td>総武本線内で車両点検を行った影…</td>
</tr>
<tr>
<td><a href="https://transit.yahoo.co.jp/traininfo/detail/185/0/">わたらせ渓谷鐵道線</a></td>
<td><span class="icnAlert">[!]</span><span class="colTrouble">交通障害情報</span></td>
<td>わたらせ渓谷鐵道線は、5月22…</td>
</tr>
</table>
</div><!-- /.elmTblLstLine -->
</div><!-- /#mdStatusTroubleLine -->
*/




    console.log("data_update(): data updating.");

    for(var i = 0; i < data.i.length; i++){
        if(data.i[i] == null) continue;
        for(var j = 0; j < datafile.length; j++){
            if(data.i[i] == datafile[j][0]){
                // console.log(datafile[j][0]); //matched
                //Color change.
                data.c[i * 4] = datafile[j][1][0];
                data.c[i * 4 + 1] = datafile[j][1][1];
                data.c[i * 4 + 2] = datafile[j][1][2];
                data.c[i * 4 + 3] = datafile[j][1][3];

                // console.log(datafile[j][1][0], datafile[j][1][1], datafile[j][1][2], datafile[j][1][3]);
                break;
            }else if(j <= datafile.length){
                data.c[i * 4] = green[0];
                data.c[i * 4 + 1] = green[1];
                data.c[i * 4 + 2] = green[2];
                data.c[i * 4 + 3] = green[3];
                //Back to green.
            }
        }
    }

    // console.log(datafile.length);



    return data;
}


function Hdata_parser(file){
    var coord = new Array(), alpha = new Array();
    var id = new Array(), pos = new Array(), col = new Array(), anim = new Array();
    var xhr = new XMLHttpRequest();
    xhr.open("get", file, false); xhr.send(null);
    var tmpArray = xhr.responseText.split("\n");
    var tmpId = null;

    var alpha  =false;
    var janction = false;

    var posList = false;

    var ksj_begin = 0;

    var green = [0.25, 1.0, 0.25, 1.0];
    var yellow = [1.0, 0.725, 0.05, 1.0];
    var red = [1.0, 0.075, 0.05, 1.0];

    console.log("Hdata_parser(): started parsing.");

    for(var i = 0; i < tmpArray.length; i++){
        if(tmpArray[i].indexOf('<gml:Point gml:id="') != -1){
            tmpArray[i] = tmpArray[i].replace(/<gml:Point gml:id="/g, '');
            tmpID = tmpArray[i].replace(/">/g, '');
            if(tmpID.indexOf('pt') != -1){
                janction = true;
            }
            //console.log(tmpID);
        }
        if(!janction){
            if(tmpArray[i].indexOf('</gml:pos>') != -1){
                posList = false;
                alpha = false;
                id.push(null);
                pos.push(pos[pos.length - 3], pos[pos.length - 2], pos[pos.length - 1]);
                anim.push(0.0);
                col.push(0.0);
            }

            if(posList){
                tmpArray[i] = tmpArray[i].replace(/\t/g, '');
                var tmpData = tmpArray[i].split(' ');
                if(alpha){
                    id.push(null);
                    pos.push(parseFloat(tmpData[1]), parseFloat(tmpData[0]), 0.0);
                    anim.push(0.0);
                    col.push(green[0], green[1], green[2], green[3]);
                    //console.log(pos);
                }
            }

            if(tmpArray[i].indexOf('<gml:pos') != -1){
                posList = true;
                alpha = true;
            }
        }

        if(tmpArray[i].indexOf('</gml:Point') != -1){
            janction = false;
        }
    }

    console.log("Hdata_parser(): finished parsing.");

    return {i : id, p : pos, c : col, a : anim};
}

function tducoord(wblue, orange, ygreen){
    var pos = new Array(), col = new Array(), ani = new Array();
    
    pos.push(parseFloat(140.107883), parseFloat(35.796609), 0.01);
    pos.push(parseFloat(139.806125), parseFloat(35.748079), 0.01);
    pos.push(parseFloat(139.366246), parseFloat(35.981819), 0.01);
    col.push(wblue[0], wblue[1], wblue[2], wblue[3]);
    col.push(orange[0], orange[1], orange[2], orange[3]);
    col.push(ygreen[0], ygreen[1], ygreen[2], ygreen[3]);
    ani.push(0.0);
    
    pos.push(parseFloat(140.116274), parseFloat(35.800133), 0.01);
    col.push(1.0, 0.3, 0.3, 1.0);
    ani.push(0.0);
    
    return{p : pos, c : col, a : ani};
}














