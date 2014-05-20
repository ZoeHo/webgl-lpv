var gl;
var canvas;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl) {
    var fshader, vshader;
    vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, cubeVertexShader);
    gl.compileShader(vshader);
    gl.attachShader(shaderProgram, vshader);

    fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, cubeFragmentShader);
    gl.compileShader(fshader);
    gl.attachShader(shaderProgram, fshader);
}


var shaderProgram;

function initShaders() {
    shaderProgram = gl.createProgram();
    getShader(gl);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }

    gl.useProgram(shaderProgram);

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    // color
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    /*shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);*/

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}


function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


var cubeTexture;

function initTexture() {
    cubeTexture = gl.createTexture();
    cubeTexture.image = new Image();
    cubeTexture.image.onload = function() {
        handleLoadedTexture(cubeTexture)
    }

    cubeTexture.image.src = "empty.png" //"firefoxlogo.png";
}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
var cubeVertexColorBuffer;


/*function initBuffers() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    vertices = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    // color
    cubeVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    var colors = [
        [1.0, 1.0, 1.0, 1.0], // front face: white
        [1.0, 0.0, 0.0, 1.0], // back face: red
        [0.0, 1.0, 0.0, 1.0], // top face: green
        [0.0, 0.0, 1.0, 1.0], // bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // right face: yellow
        [1.0, 0.0, 1.0, 1.0] // left face: purple
    ];

    var generatedColors = [];
    for (j = 0; j < 6; j++) {
        var c = colors[j];
        for (var i = 0; i < 4; i++) {
            generatedColors = generatedColors.concat(c);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);
    cubeVertexColorBuffer.itemSize = 4;
    cubeVertexColorBuffer.numItems = 96;

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3, // Front face
        4, 5, 6, 4, 6, 7, // Back face
        8, 9, 10, 8, 10, 11, // Top face
        12, 13, 14, 12, 14, 15, // Bottom face
        16, 17, 18, 16, 18, 19, // Right face
        20, 21, 22, 20, 22, 23 // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;
}*/

var vertexPositionBuffer;
var vertexNormalBuffer;
var vertexTextureCoordBuffer;
var vertexIndexBuffer;
var vertexColorBuffer;

function initColor(modelData) {
    var whiteColor = [0.8, 0.8, 0.8, 1.0]; // face index = 12, 6
    var yellowColor = [0.8, 0.8, 0.0, 1.0]; // face index = 12
    var blueColor = [0.383844, 0.505843, 0.687189, 1.0]; // face index = 2
    var redColor = [0.800000, 0.265540, 0.232816, 1.0];

    // white box
    for (var i = 0; i < 8; i++) {
        modelData.colors = modelData.colors.concat(whiteColor);
    }

    // yellow box
    for (i = 0; i < 8; i++) {
        modelData.colors = modelData.colors.concat(yellowColor);
    }

    modelData.colors = modelData.colors.concat(whiteColor); // white
    modelData.colors = modelData.colors.concat(blueColor); // blue

    modelData.colors = modelData.colors.concat(redColor); // red
    modelData.colors = modelData.colors.concat(whiteColor); // white
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(blueColor); // blue
    modelData.colors = modelData.colors.concat(redColor); // red

    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor); //

    /*for (i = 0; i < 9; i++) {
        modelData.colors = modelData.colors.concat(whiteColor);
    }*/
    modelData.colors = modelData.colors.concat(blueColor);
    modelData.colors = modelData.colors.concat(redColor);
    modelData.colors = modelData.colors.concat(blueColor);
    modelData.colors = modelData.colors.concat(redColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(blueColor);
    modelData.colors = modelData.colors.concat(redColor); // white
    modelData.colors = modelData.colors.concat(blueColor);
    modelData.colors = modelData.colors.concat(redColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);
    modelData.colors = modelData.colors.concat(whiteColor);


    // white wall (back face)
    /*for (i = 0; i < 2; i++) {
        modelData.colors = modelData.colors.concat(whiteColor);
    }*/

    // blue wall
    /*for (i = 0; i < 1; i++) {
        modelData.colors = modelData.colors.concat(blueColor);
    }*/

    /*for (i = 0; i < 40; i++) {
        modelData.colors = modelData.colors.concat(yellowColor);
    }*/

    window.o = modelData.colors;

}

function handleLoadedCornellbox(modelData) {
    /*vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.normals), gl.STATIC_DRAW);
    vertexNormalBuffer.itemSize = 3;
    vertexNormalBuffer.numItems = modelData.normals.length / vertexNormalBuffer.itemSize;

    vertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.uvs), gl.STATIC_DRAW);
    vertexTextureCoordBuffer.itemSize = 2;
    vertexTextureCoordBuffer.numItems = modelData.uvs.length / vertexTextureCoordBuffer.itemSize;
*/
    /*
    // teapot
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexPositions), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = modelData.vertexPositions.length / 3;

    vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelData.indices), gl.STATIC_DRAW);
    vertexIndexBuffer.itemSize = 1;
    vertexIndexBuffer.numItems = modelData.indices.length;*/

    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = modelData.vertices.length / vertexPositionBuffer.itemSize;

    vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    modelData.faces = modelData.faces.map(function(v) {
        return v - 1;
    });
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelData.faces), gl.STATIC_DRAW);
    vertexIndexBuffer.itemSize = 1;
    vertexIndexBuffer.numItems = modelData.faces.length;

    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    /*for (var i = 0; i < 6; i++) {
        modelData.colors = modelData.colors.concat(modelData.colors);
    }*/
    initColor(modelData);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = modelData.colors.length / vertexColorBuffer.itemSize;

    //document.getElementById("loadingtext").textContent = "";
}

function loadCornellbox() {
    var request = new XMLHttpRequest();
    request.open("GET", "obj/cornellbox.js");
    //request.open("GET", "obj/Teapot.json");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            handleLoadedCornellbox(JSON.parse(request.responseText));
        }
    }
    request.send();
}

var xRot = 0;
var yRot = 0;
var zRot = 0;

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (vertexPositionBuffer == null || vertexIndexBuffer == null) {
        console.log("Return");
        return;
    }

    mat4.perspective(45, canvas.width / canvas.height, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0.0, -10.0, -50.0]);

    //mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    //mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    //mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]);

    // test
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
    //gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // color
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    /*gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);*/

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}


var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        xRot += (90 * elapsed) / 1000.0;
        yRot += (90 * elapsed) / 1000.0;
        zRot += (90 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}


function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
}

function reshape() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

}

function start() {
    canvas = document.getElementById("glcanvas");
    initGL(canvas);
    initShaders();
    //initBuffers();
    initTexture();
    loadCornellbox();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}

window.onload = function() {
    start();
}

window.onresize = function() {
    console.log('resize');
    reshape();
}