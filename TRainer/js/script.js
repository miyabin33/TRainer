//TRainer - Version Alpha
//Coded by Tomoki "FL1NE" SHISHIKURA

onload = function(){
    var time; var startTime = new Date().getTime();
    var c = document.getElementById('canvas');
    var gl = c.getContext('webgl', {antialias:true}) || c.getContext('experimental-webgl', {antialias:true});
    if(!gl) alert('WebGL context initialize failed.\nSeems your web browser or GPU doesn\'t support WebGL.\nUse latest version of Firefox instead.');
    else console.log('WebGL context successfully initialized.\n');

    display_resize(gl, 'canvas');
    console.log('Resolution = ' + c.width + 'x' + c.height);
    console.log('MSAA = ' + gl.getContextAttributes().antialias + '(' + gl.getParameter(gl.SAMPLES) + 'X)');

    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.BLEND);


//Variables
    var m = new matIV();

    var clearColor = [0.0, 0.0, 0.0, 1.0];
    var clearDepth = 1.0;


    //Kanto
    var default_camPosition = [139.766667, 35.681111, 2.0];
    var default_camLookAt = [139.766667, 35.681111, 0.0];
    var defaultcamUp = [0.0, 1.0, 0.0];
    var min_lon = 114.0;
    var max_lon = 166.0;
    var min_lat = 20.0;
    var max_lat = 56.0;
    var min_elev = 0.001;
    var max_elev = 60.0;
    var GMTLine = gmt_parser('gmt/japan.gmt');
    
    var R_flag = true, H_flag = false;
    
    
    var wblue = [0.0, 0.5, 1.0, 1.0];
    var orange = [1.0, 0.3, 0.0, 1.0];
    var ygreen = [0.5, 1.0, 0.0, 1.0];




    // //Japan
    // var default_camPosition = [139.766667, 35.681111, 30.0];
    // var default_camLookAt = [139.766667, 35.681111, 0.0];
    // var defaultcamUp = [0.0, 1.0, 0.0];
    // var min_lon = 114.0;
    // var max_lon = 166.0;
    // var min_lat = 20.0;
    // var max_lat = 56.0;
    // var min_elev = 0.001;
    // var max_elev = 60.0;
    // var GMTLine = gmt_parser('gmt/japan.gmt');




    //Japan 3D
    // var default_camPosition = [139.566667, 34.681111, 0.5];
    // var default_camLookAt = [139.766667, 35.681111, 0.0];
    // var defaultcamUp = [0.0, 0.0, 1.0];
    // var min_lon = 114.0;
    // var max_lon = 166.0;
    // var min_lat = 20.0;
    // var max_lat = 56.0;
    // var min_elev = 0.001;
    // var max_elev = 60.0;
    // var GMTLine = gmt_parser('gmt/japan.gmt');




    // // //World
    // var default_camPosition = [180.0, 0.0, 271.5];
    // var default_camLookAt = [180, 0.0, 0.0];
    // var defaultcamUp = [0.0, 1.0, 0.0];
    // var min_lon = 0.0;
    // var max_lon = 360.0;
    // var min_lat = -90.0;
    // var max_lat = 90.0;
    // var min_elev = 0.001;
    // var max_elev = 360.0;
    // var GMTLine = gmt_parser('gmt/earth.gmt');




    // // //World 3D (Japan)
    // var default_camPosition = [139.566667, 34.681111, 0.5];
    // var default_camLookAt = [139.766667, 35.681111, 0.0];
    // var defaultcamUp = [0.0, 0.0, 1.0];
    // var min_lon = 0.0;
    // var max_lon = 360.0;
    // var min_lat = -90.0;
    // var max_lat = 90.0;
    // var min_elev = 0.001;
    // var max_elev = 360.0;
    // var GMTLine = gmt_parser('gmt/earth.gmt');




    var camPosition = default_camPosition;
    var camLookAt = default_camLookAt;
    var camUp = defaultcamUp;

    var lightPosition = [5.0, 5.0, 3.0];
    var ambientColor = [1.0, 1.0, 1.0, 1.0];









    var blurStrength = 8.0;

    var weight = new Array(10);
    var t = 0.0;
    // var d = eRange.value * eRange.value / 100;
    var d = blurStrength * blurStrength;
    for(i = 0; i < weight.length; i++){
        var r = 1.0 + 2.0 * i;
        var w = Math.exp(-0.5 * (r * r) / d);
        weight[i] = w;
        if(i > 0){w *= 2.0;}
        t += w;
    }
    for(i = 0; i < weight.length; i++) weight[i] /= t;

    var now = window.performance && (
    performance.now ||
    performance.mozNow ||
    performance.msNow ||
    performance.oNow ||
    performance.webkitNow );


    var fps = 0.0;
    var fps_ave = 0.0;
    var fps_min = 0.0;
    var fps_max = 0.0;


    var debug = document.getElementById('debug');



//Matrixies
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    var invMatrix = m.identity(m.create());


//Mouse things
    var drag = false;
    var down_x = 0;
    var down_y = 0;

    var texture0 = null;
    var texture1 = null;
    var texture2 = null;
    var texture3 = null;
    gl.activeTexture(gl.TEXTURE0);
    create_texture('img/cross.png', 0);


//Frame Buffer
    var bufferWidth  = 512;
    var bufferHeight = 512;

    gl.activeTexture(gl.TEXTURE1);
    var fBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);

    gl.activeTexture(gl.TEXTURE2);
    var bBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);

    gl.activeTexture(gl.TEXTURE3);
    var rBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);

    gl.activeTexture(gl.TEXTURE4);
    var gBuffer1 = create_framebuffer(gl, bufferWidth, bufferHeight);

    gl.activeTexture(gl.TEXTURE5);
    var gBuffer2 = create_framebuffer(gl, bufferWidth, bufferHeight);


    update_framebuffer();





//Callback & Functions

    function update_framebuffer(){ //Support Up to 16K (16384x16384)
        if(c.width <= 512 || c.height <= 512){
            bufferWidth  = 512; bufferHeight = 512;
            fBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            bBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            rBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer1 = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer2 = create_framebuffer(gl, bufferWidth, bufferHeight);
        }

        if((c.width > 512 || c.height > 512) && (c.width <= 1024 || c.height <= 1024)){
            bufferWidth  = 1024; bufferHeight = 1024;
            fBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            bBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            rBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer1 = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer2 = create_framebuffer(gl, bufferWidth, bufferHeight);
        }

        if((c.width > 1024 || c.height > 1024) && (c.width <= 2048 || c.height <= 2048)){
            bufferWidth  = 2048; bufferHeight = 2048;
            fBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            bBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            rBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer1 = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer2 = create_framebuffer(gl, bufferWidth, bufferHeight);
        }

        if((c.width > 2048 || c.height > 2048) && (c.width <= 4096 || c.height <= 4096)){
            bufferWidth  = 4096; bufferHeight = 4096;
            fBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            bBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            rBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer1 = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer2 = create_framebuffer(gl, bufferWidth, bufferHeight);
        }

        if((c.width > 4096 || c.height > 4096) && (c.width <= 8192 || c.height <= 8192)){
            bufferWidth  = 8192; bufferHeight = 8192;
            fBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            bBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            rBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer1 = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer2 = create_framebuffer(gl, bufferWidth, bufferHeight);
        }

        if((c.width > 8192 || c.height > 8192) && (c.width <= 16384 || c.height <= 16384)){
            bufferWidth  = 16384; bufferHeight = 16384;
            fBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            bBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            rBuffer = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer1 = create_framebuffer(gl, bufferWidth, bufferHeight);
            gBuffer2 = create_framebuffer(gl, bufferWidth, bufferHeight);
        }

    }

    window.onresize = function(){
        display_resize(gl, 'canvas');
        update_framebuffer();
    }
    
    var getColor = new Uint8Array(4);

    //マウスを押したときの操作
    c.addEventListener('mousedown' || 'touchstart', function(e){
        e.preventDefault();
        drag = true;
        down_x = e.clientX; down_y = e.clientY;
        // console.log("Down : " + down_x + ', ' + down_y);
    }, true);

    //マウスを離したときの操作
    document.addEventListener('mouseup' || 'touchmove', function(e){drag = false;}, true);

    //マウスを押しながら動かした時の操作
    document.addEventListener('mousemove' || 'touchend', function(e){
        if(drag){
            var cw = c.width; var ch = c.height;
            var wh = 1 / Math.sqrt(cw * cw * ch * ch);
            var ratio = 0.0005;

            var safety =  camPosition[2] / 15.0;        //拡大率によってカメラ移動距離を変える関数

            //移動した距離をそれぞれカメラ座標に減算・加算している
            camPosition[0] = camLookAt[0] - ((-down_x + e.clientX) * safety) * ratio;
            camPosition[1] = camLookAt[1] + ((-down_y + e.clientY) * safety) * ratio;

            //移動距離の制限
            if(camPosition[0] < min_lon){ camPosition[0] = min_lon; document.getElementById('data_field_longitude').style.color = "#ff0000"; }
            else if(camPosition[0] > max_lon){ camPosition[0] = max_lon; document.getElementById('data_field_longitude').style.color = "#ff0000"; }
            else{ document.getElementById('data_field_longitude').style.color = "#2fffff"; }

            if(camPosition[1] < min_lat){ camPosition[1] = min_lat; document.getElementById('data_field_latitude').style.color = "#ff0000"; }
            else if(camPosition[1] > max_lat){ camPosition[1] = max_lat; document.getElementById('data_field_latitude').style.color = "#ff0000"; }
            else{ document.getElementById('data_field_latitude').style.color = "#2fffff"; }

            //カメラの位置の初期化
            camLookAt[0] = camPosition[0];
            camLookAt[1] = camPosition[1];
        }
    }, true);

    //マウスホイール関数の呼び出し
    c.addEventListener('DOMMouseScroll', mousewheel, false);        //Firefoxの場合
    c.addEventListener('mousewheel' || 'gesturechange', mousewheel, true);             //それ以外

    //マウスホイールを回したときの操作
    function mousewheel(e){
        var del = 1.025;
        if (e.shiftKey) del = 1.01;
        var ds = ((e.detail || e.wheelDelta) > 0) ? del : (1 / del);
        camPosition[2] /= ds;
        if(camPosition[2] < min_elev) camPosition[2] = min_elev;
        if(camPosition[2] > max_elev) camPosition[2] = max_elev;
    }

    document.onkeydown = function(e){
        if(e.key == 'g'){
            if(debug.style.visibility == "hidden") debug.style.visibility = "visible";
            else debug.style.visibility = "hidden";
        }
        if(e.key == 'r'){
            R_flag = true;
            H_flag = false;
        }
        if(e.key == 'h'){
            R_flag = false;
            H_flag = true;
        }
    }
    
    document.getElementById("R_flag").onclick = railhundler;
    document.getElementById("H_flag").onclick = highhundler;
    
    function railhundler(e){
        R_flag = true;
        H_flag = false;
    }
    function highhundler(e){
        R_flag = false;
        H_flag = true;
    }
    
    document.getElementById("D1").onclick = function(e){
        window.open("https://www.dendai.ac.jp/about/tdu/campus/tokyo_senju.html");
    }
    document.getElementById("D2").onclick = function(e){
        window.open("http://www.sie.dendai.ac.jp/index.html");
    }
    document.getElementById("D3").onclick = function(e){
        window.open("https://www.dendai.ac.jp/about/tdu/campus/saitama_hatoyama.html");
    }
    
    document.getElementById("S1").onclick = function(e){
        window.open("http://hokuso.ekitan.com/jp/pc/T5?USR=PC&dw=0&slCode=200-12&d=1");
        window.open("http://hokuso.ekitan.com/jp/pc/T5?USR=PC&dw=0&slCode=200-12&d=2");
        window.open("http://hokuso.ekitan.com/jp/pc/T5?USR=PC&dw=1&slCode=200-12&d=1");
        window.open("http://hokuso.ekitan.com/jp/pc/T5?USR=PC&dw=1&slCode=200-12&d=2");
    }
    
    

    function create_texture(source, number){
        var img = new Image();
        img.onload = function(){
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            switch(number){
                case 0:
                    texture0 = tex;
                    break;
                case 1:
                    texture1 = tex;
                    break;
                case 2:
                    texture2 = tex;
                    break;
                case 3:
                    texture3 = tex;
                    break;
                default:
                    break;
            }
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
        img.src = source;
    }



//Shaders

    // var solid_vs = create_shader(gl, 'solid_vs');
    // var solid_fs = create_shader(gl, 'solid_fs');
    // var solid_prg = create_program(gl, solid_vs, solid_fs);
    // var solid_attL = new Array();
    // solid_attL[0] = gl.getAttribLocation(solid_prg, 'position');
    // solid_attL[1] = gl.getAttribLocation(solid_prg, 'normal');
    // solid_attL[2] = gl.getAttribLocation(solid_prg, 'color');
    // var solid_attS = [3, 3, 4];
    // var solid_uniL = new Array();
    // solid_uniL[0] = gl.getUniformLocation(solid_prg, 'mvpMatrix');
    // solid_uniL[1] = gl.getUniformLocation(solid_prg, 'invMatrix');
    // solid_uniL[2] = gl.getUniformLocation(solid_prg, 'lightPosition');
    // solid_uniL[3] = gl.getUniformLocation(solid_prg, 'camPosition');
    // solid_uniL[4] = gl.getUniformLocation(solid_prg, 'ambientColor');
    // solid_uniL[5] = gl.getUniformLocation(solid_prg, 'resolution');
    // solid_uniL[6] = gl.getUniformLocation(solid_prg, 'time');
    
    var point_vs = create_shader(gl, 'point_vs');
    var point_fs = create_shader(gl, 'point_fs');
    var point_prg = create_program(gl, point_vs, point_fs);
    var point_attL = new Array();
    point_attL[0] = gl.getAttribLocation(point_prg, 'position');
    point_attL[1] = gl.getAttribLocation(point_prg, 'color');
    var point_attS = [3, 4];
    var point_uniL = new Array();
    point_uniL[0] = gl.getUniformLocation(point_prg, 'mvpMatrix');
    point_uniL[1] = gl.getUniformLocation(point_prg, 'resolution');
    point_uniL[2] = gl.getUniformLocation(point_prg, 'pointSize');
    point_uniL[3] = gl.getUniformLocation(point_prg, 'time');


    var wire_vs = create_shader(gl, 'wire_vs');
    var wire_fs = create_shader(gl, 'wire_fs');
    var wire_prg = create_program(gl, wire_vs, wire_fs);
    var wire_attL = new Array();
    wire_attL[0] = gl.getAttribLocation(wire_prg, 'position');
    wire_attL[1] = gl.getAttribLocation(wire_prg, 'color');
    wire_attL[2] = gl.getAttribLocation(wire_prg, 'flag');
    var wire_attS = [3, 4, 1];
    var wire_uniL = new Array();
    wire_uniL[0] = gl.getUniformLocation(wire_prg, 'mvpMatrix');
    wire_uniL[1] = gl.getUniformLocation(wire_prg, 'resolution');
    wire_uniL[2] = gl.getUniformLocation(wire_prg, 'time');


    var mesh_vs = create_shader(gl, 'mesh_vs');
    var mesh_fs = create_shader(gl, 'mesh_fs');
    var mesh_prg = create_program(gl, mesh_vs, mesh_fs);
    var mesh_attL = new Array();
    mesh_attL[0] = gl.getAttribLocation(mesh_prg, 'position');
    mesh_attL[1] = gl.getAttribLocation(mesh_prg, 'textureCoord');
    mesh_attL[2] = gl.getAttribLocation(mesh_prg, 'color');
    var mesh_attS = [3, 2, 4];
    var mesh_uniL = new Array();
    mesh_uniL[0] = gl.getUniformLocation(mesh_prg, 'mvpMatrix');
    mesh_uniL[1] = gl.getUniformLocation(mesh_prg, 'texture');
    mesh_uniL[2] = gl.getUniformLocation(mesh_prg, 'resolution');
    mesh_uniL[3] = gl.getUniformLocation(mesh_prg, 'time');


    var mesh_bg_vs = create_shader(gl, 'mesh_bg_vs');
    var mesh_bg_fs = create_shader(gl, 'mesh_bg_fs');
    var mesh_bg_prg = create_program(gl, mesh_bg_vs, mesh_bg_fs);
    var mesh_bg_attL = new Array();
    mesh_bg_attL[0] = gl.getAttribLocation(mesh_bg_prg, 'position');
    mesh_bg_attL[1] = gl.getAttribLocation(mesh_bg_prg, 'textureCoord');
    var mesh_bg_attS = [3, 2];
    var mesh_bg_uniL = new Array();
    mesh_bg_uniL[0] = gl.getUniformLocation(mesh_bg_prg, 'mvpMatrix');
    mesh_bg_uniL[1] = gl.getUniformLocation(mesh_bg_prg, 'time');
    mesh_bg_uniL[2] = gl.getUniformLocation(mesh_bg_prg, 'bg_resolution');
    mesh_bg_uniL[3] = gl.getUniformLocation(mesh_bg_prg, 'type');


    var gauss_vs = create_shader(gl, 'gauss_vs');
    var gauss_fs = create_shader(gl, 'gauss_fs');
    var gauss_prg = create_program(gl, gauss_vs, gauss_fs);
    var gauss_attL = gl.getAttribLocation(gauss_prg, 'position');
    var gauss_attS = 3;
    var gauss_uniL = new Array();
    gauss_uniL[0] = gl.getUniformLocation(gauss_prg, 'resolution');
    gauss_uniL[1] = gl.getUniformLocation(gauss_prg, 'frameBuffer');
    gauss_uniL[2] = gl.getUniformLocation(gauss_prg, 'bufferResolution');
    gauss_uniL[3] = gl.getUniformLocation(gauss_prg, 'horizontal');
    gauss_uniL[4] = gl.getUniformLocation(gauss_prg, 'weight');


    var fx_vs = create_shader(gl, 'fx_vs');
    var fx_fs = create_shader(gl, 'fx_fs');
    var fx_prg = create_program(gl, fx_vs, fx_fs);
    var fx_attL = gl.getAttribLocation(fx_prg, 'position');
    var fx_attS = 3;
    var fx_uniL = new Array();
    fx_uniL[0] = gl.getUniformLocation(fx_prg, 'time');
    fx_uniL[1] = gl.getUniformLocation(fx_prg, 'resolution');
    fx_uniL[2] = gl.getUniformLocation(fx_prg, 'frameBuffer');
    fx_uniL[3] = gl.getUniformLocation(fx_prg, 'bufferResolution');
    fx_uniL[4] = gl.getUniformLocation(fx_prg, 'backbuffer');
    fx_uniL[5] = gl.getUniformLocation(fx_prg, 'blurbuffer');


    var render_vs = create_shader(gl, 'render_vs');
    var render_fs = create_shader(gl, 'render_fs');
    var render_prg = create_program(gl, render_vs, render_fs);
    var render_attL = gl.getAttribLocation(render_prg, 'position');
    var render_attS = 3;
    var render_uniL = new Array();
    render_uniL[0] = gl.getUniformLocation(render_prg, 'resolution');
    render_uniL[1] = gl.getUniformLocation(render_prg, 'frameBuffer');
    render_uniL[2] = gl.getUniformLocation(render_prg, 'bufferResolution');

//Data
    var s_pos = [
        -1.0,  1.0,  0.0,
         1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];

    var s_idx = [
        0, 2, 1,
        1, 2, 3
    ];

    var ssPosition = create_vbo(gl, s_pos);
    var ssIndex = create_ibo(gl, s_idx);




    var bg_offset = -0.5;

    var bg_pos = [
        min_lon, max_lat, bg_offset,
        max_lon, max_lat, bg_offset,
        min_lon, min_lat, bg_offset,
        max_lon, min_lat, bg_offset
    ];

    var bg_pos2 = [
        min_lon, max_lat, bg_offset * 2.0,
        max_lon, max_lat, bg_offset * 2.0,
        min_lon, min_lat, bg_offset * 2.0,
        max_lon, min_lat, bg_offset * 2.0
    ];

    var bg_idx = [
        0, 2, 1,
        1, 2, 3
    ];

    var bg_tex = [
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
    ];

    var bgPosition = create_vbo(gl, bg_pos);
    var bgTexture = create_vbo(gl, bg_tex);
    var bgVBOList = [bgPosition, bgTexture];
    var bgIndex = create_ibo(gl, bg_idx);

    var bgPosition2 = create_vbo(gl, bg_pos2);
    var bgVBOList2 = [bgPosition2, bgTexture];




    var GMTLinePosition = create_vbo(gl, GMTLine.p);
    var GMTLineColor = create_vbo(gl, GMTLine.c);
    var GMTLineAnim = create_vbo(gl, GMTLine.a);
    var GMTLineVBOList = [GMTLinePosition, GMTLineColor, GMTLineAnim];

    var tdu = tducoord(wblue, orange, ygreen);
    var tduPosition = create_vbo(gl, tdu.p);
    var tduColor = create_vbo(gl, tdu.c);
    var tduVBOList = [tduPosition, tduColor];


    // 路線図のデータ解析
    var dataLine = Tdata_parser('data/N02-15.xml');

    Tdata_update(dataLine);

    var dataLinePosition = create_vbo(gl, dataLine.p);
    var dataLineColor = create_vbo(gl, dataLine.c);
    var dataLineAnim = create_vbo(gl, dataLine.a);
    var dataLineVBOList = [dataLinePosition, dataLineColor, dataLineAnim];

    console.log(dataLine);
    
    
    
    
    // 高速道路のデータ解析
    var dataRoad = Hdata_parser('data/N06-15.xml');
    
    //Hdata_update(dataroad);
    
    var dataRoadPosition = create_vbo(gl, dataRoad.p);
    var dataRoadColor = create_vbo(gl, dataRoad.c);
    var dataRoadAnim = create_vbo(gl, dataRoad.a);
    var dataRoadVBOList = [dataRoadPosition, dataRoadColor, dataRoadAnim];
    
    console.log(dataRoad);

    
    
    


    var fieldMesh = meshPlacer(min_lon, max_lon, min_lat, max_lat);
    var meshPosition = create_vbo(gl, fieldMesh.p);
    var meshTexture = create_vbo(gl, fieldMesh.t)
    var meshColor = create_vbo(gl, fieldMesh.c);
    var meshVBOList = [meshPosition, meshTexture, meshColor];
    var meshIndex = create_ibo(gl, fieldMesh.i);


//DOM
    var d_resolution = document.getElementById('d_resolution');
    var d_aspect = document.getElementById('d_aspect');
    var d_time = document.getElementById('d_time');
    var d_camera = document.getElementById('d_camera');
    var d_lookat = document.getElementById('d_lookat');
    var d_camup = document.getElementById('d_camup');
    var data_field_longitude = document.getElementById('data_field_longitude');
    var data_field_latitude = document.getElementById('data_field_latitude');


//MainLoop
    (function(){
        time = (new Date().getTime() - startTime) * 0.001;

//Update DOM
        d_resolution.textContent = 'screen=' + c.width + 'x' + c.height;
        d_aspect.textContent = 'aspect=' + (c.width / c.height).toFixed(3);
        d_ratio.textContent = 'ratio=' + window.devicePixelRatio || 1;
        d_time.textContent = 'timer=' + time.toFixed(3);
        d_camera.textContent = 'camera=[' + camPosition[0].toFixed(3) + ', ' + camPosition[1].toFixed(3) + ', ' + camPosition[2].toFixed(3) + ']';
        d_lookat.textContent = 'lookat=[' + camLookAt[0].toFixed(3) + ', ' + camLookAt[1].toFixed(3) + ', ' + camLookAt[2].toFixed(3) + ']';
        d_camup.textContent = 'camup =[' + camUp[0].toFixed(3) + ', ' + camUp[1].toFixed(3) + ', ' + camUp[2].toFixed(3) + ']';
        data_field_longitude.textContent = camLookAt[0].toFixed(3);
        data_field_latitude.textContent = camLookAt[1].toFixed(3);


//Render to FrameBuffer (1)

        gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);

        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        gl.clearDepth(clearDepth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        m.lookAt(camPosition, camLookAt, camUp, vMatrix);
        m.perspective(45.0, c.width / c.height, 0.001, 1000.0, pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        m.inverse(mMatrix, invMatrix);

        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);


        gl.useProgram(mesh_bg_prg);
        set_attribute(gl, bgVBOList, mesh_bg_attL, mesh_bg_attS);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndex);
        gl.uniformMatrix4fv(mesh_bg_uniL[0], false, mvpMatrix);
        gl.uniform1f(mesh_bg_uniL[1], time);
        gl.uniform2fv(mesh_bg_uniL[2], [(max_lon - min_lon) * 10.0, (max_lat - min_lat) * 10.0]);
        gl.uniform1f(mesh_bg_uniL[3], 0.0);
        gl.drawElements(gl.TRIANGLES, 6,  gl.UNSIGNED_SHORT, 0);

        gl.useProgram(mesh_bg_prg);
        set_attribute(gl, bgVBOList2, mesh_bg_attL, mesh_bg_attS);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndex);
        gl.uniformMatrix4fv(mesh_bg_uniL[0], false, mvpMatrix);
        gl.uniform1f(mesh_bg_uniL[1], time);
        gl.uniform2fv(mesh_bg_uniL[2], [(max_lon - min_lon) * 10.0, (max_lat - min_lat) * 10.0]);
        gl.uniform1f(mesh_bg_uniL[3], 0.1);
        gl.drawElements(gl.TRIANGLES, 6,  gl.UNSIGNED_SHORT, 0);


        gl.useProgram(mesh_prg);
        set_attribute(gl, meshVBOList, mesh_attL, mesh_attS);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshIndex);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.uniformMatrix4fv(mesh_uniL[0], false, mvpMatrix);
        gl.uniform1i(mesh_uniL[1], 0);
        gl.uniform2f(mesh_uniL[2], c.width, c.height);
        gl.uniform1f(mesh_uniL[3], time);
        gl.drawElements(gl.TRIANGLES, fieldMesh.i.length,  gl.UNSIGNED_SHORT, 0);


        gl.useProgram(wire_prg);
        set_attribute(gl, GMTLineVBOList, wire_attL, wire_attS);
        gl.uniformMatrix4fv(wire_uniL[0], false, mvpMatrix);
        gl.uniform2f(wire_uniL[1], c.width, c.height);
        gl.uniform1f(wire_uniL[2], time);
        gl.drawArrays(gl.LINE_STRIP, 0, GMTLine.p.length / 3);
        
        //TDU
        gl.useProgram(point_prg);
        set_attribute(gl, tduVBOList, point_attL, point_attS);
        gl.uniformMatrix4fv(point_uniL[0], false, mvpMatrix);
        gl.uniform2f(point_uniL[1], c.width, c.height);
        gl.uniform1f(point_uniL[2], 12.0);
        gl.uniform1f(point_uniL[3], time);
        gl.drawArrays(gl.POINTS, 0, tdu.p.length / 3);


        // 路線図
        /*gl.useProgram(wire_prg);
        set_attribute(gl, dataLineVBOList, wire_attL, wire_attS);
        gl.uniformMatrix4fv(wire_uniL[0], false, mvpMatrix);
        gl.uniform2f(wire_uniL[1], c.width, c.height);
        gl.uniform1f(wire_uniL[2], time);
        gl.drawArrays(gl.LINE_STRIP, 0, dataLine.p.length / 3);*/
        
        if(R_flag == true){
            gl.useProgram(wire_prg);
            set_attribute(gl, dataLineVBOList, wire_attL, wire_attS);
            gl.uniformMatrix4fv(wire_uniL[0], false, mvpMatrix);
            gl.uniform2f(wire_uniL[1], c.width, c.height);
            gl.uniform1f(wire_uniL[2], time);
            gl.drawArrays(gl.LINE_STRIP, 0, dataLine.p.length / 3);
        }else if(H_flag = true){
            gl.useProgram(wire_prg);
            set_attribute(gl, dataRoadVBOList, wire_attL, wire_attS);
            gl.uniformMatrix4fv(wire_uniL[0], false, mvpMatrix);
            gl.uniform2f(wire_uniL[1], c.width, c.height);
            gl.uniform1f(wire_uniL[2], time);
            gl.drawArrays(gl.LINE_STRIP, 0, dataRoad.p.length / 3);
        }
        
        // 高速道路
        /*gl.useProgram(wire_prg);
        set_attribute(gl, dataRoadVBOList, wire_attL, wire_attS);
        gl.uniformMatrix4fv(wire_uniL[0], false, mvpMatrix);
        gl.uniform2f(wire_uniL[1], c.width, c.height);
        gl.uniform1f(wire_uniL[2], time);
        gl.drawArrays(gl.LINE_STRIP, 0, dataRoad.p.length / 3);*/


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);




//Render to gauss1

        gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer1.f);

        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        gl.clearDepth(clearDepth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(gauss_prg);
        gl.bindBuffer(gl.ARRAY_BUFFER, ssPosition);
        gl.enableVertexAttribArray(gauss_attL);
        gl.vertexAttribPointer(gauss_attL, gauss_attS, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ssIndex);
        gl.uniform2fv(gauss_uniL[0], [c.width, c.height]);
        gl.uniform1i(gauss_uniL[1], 1);
        gl.uniform2fv(gauss_uniL[2], [bufferWidth, bufferHeight]);
        gl.uniform1i(gauss_uniL[3], false);
        gl.uniform1fv(gauss_uniL[4], weight);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, gBuffer1.t);


//Render to gauss2

        gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer2.f);

        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        gl.clearDepth(clearDepth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(gauss_prg);
        gl.bindBuffer(gl.ARRAY_BUFFER, ssPosition);
        gl.enableVertexAttribArray(gauss_attL);
        gl.vertexAttribPointer(gauss_attL, gauss_attS, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ssIndex);
        gl.uniform2fv(gauss_uniL[0], [c.width, c.height]);
        gl.uniform1i(gauss_uniL[1], 4);
        gl.uniform2fv(gauss_uniL[2], [bufferWidth, bufferHeight]);
        gl.uniform1i(gauss_uniL[3], true);
        gl.uniform1fv(gauss_uniL[4], weight);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, gBuffer2.t);




//Render to Renderbuffer with fx_prg

        gl.bindFramebuffer(gl.FRAMEBUFFER, rBuffer.f);

        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        gl.clearDepth(clearDepth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(fx_prg);
        gl.bindBuffer(gl.ARRAY_BUFFER, ssPosition);
        gl.enableVertexAttribArray(fx_attL);
        gl.vertexAttribPointer(fx_attL, fx_attS, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ssIndex);
        gl.uniform1f(fx_uniL[0], time);
        gl.uniform2fv(fx_uniL[1], [c.width, c.height]);
        gl.uniform1i(fx_uniL[2], 1);
        gl.uniform2fv(fx_uniL[3], [bufferWidth, bufferHeight]);
        gl.uniform1i(fx_uniL[4], 2);
        gl.uniform1i(fx_uniL[5], 5);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, rBuffer.t);




//Render to backBuffer

        gl.bindFramebuffer(gl.FRAMEBUFFER, bBuffer.f);

        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        gl.clearDepth(clearDepth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(render_prg);
        gl.bindBuffer(gl.ARRAY_BUFFER, ssPosition);
        gl.enableVertexAttribArray(render_attL);
        gl.vertexAttribPointer(render_attL, render_attS, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ssIndex);
        gl.uniform2fv(render_uniL[0], [c.width, c.height]);
        gl.uniform1i(render_uniL[1], 3);
        gl.uniform2fv(render_uniL[2], [bufferWidth, bufferHeight]);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, bBuffer.t);


//Render to Screen

        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        gl.clearDepth(clearDepth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(render_prg);
        gl.bindBuffer(gl.ARRAY_BUFFER, ssPosition);
        gl.enableVertexAttribArray(render_attL);
        gl.vertexAttribPointer(render_attL, render_attS, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ssIndex);
        gl.uniform2fv(render_uniL[0], [c.width, c.height]);
        gl.uniform1i(render_uniL[1], 3);
        gl.uniform2fv(render_uniL[2], [bufferWidth, bufferHeight]);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);





        gl.flush();
        requestAnimationFrame(arguments.callee); // <- This shit was awesome.
    })(); //End of MainLoop




};

