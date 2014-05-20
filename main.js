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

    //shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    //gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

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

    cubeTexture.image.src = "firefoxlogo.png"; //"empty.png";
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

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

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
    initTexture();
    loadCornellbox();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    tick();
}

window.onload = function() {
    start();
}

window.onresize = function() {
    console.log('resize');
    reshape();
}