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

var textureList;
var bufferList;
var shaderList;

function initList() {
    textureList = [];
    bufferList = [];
    shaderList = [];
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

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var xRot = 0;
var yRot = 0;
var zRot = 0;

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (vertexPositionBuffer == null || vertexIndexBuffer == null) {
        console.log("Return: buffer is empty.");
        return;
    }

    mat4.perspective(45, canvas.width / canvas.height, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0.0, 0.0, -50.0]);

    //mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    //mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    //mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]);

    //

    // buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(baseShader.shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // color
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(baseShader.shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    //setMatrixUniforms();
    baseShader.setMatrixUniforms(baseShader.shaderProgram);
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    //

    // buffer
    /*gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
    //gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // color
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    /*gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);*/

    /*gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    //setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);*/
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
    initList();

    modelCreate();
    //initShaders();
    initTexture();
    //loadCornellbox();

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