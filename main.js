var gl;
var canvas;
var env;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.getExtension("OES_texture_float");
        gl.getExtension("OES_texture_half_float");
        gl.getExtension("OES_texture_float_linear");
        //canvas.width = innerWidth;
        //canvas.height = innerHeight;
        canvas.width = 1280;
        canvas.height = 720;
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

function degtoRad(degrees) {
    return degrees * Math.PI / 180.0;
}

var xRot = 0;
var yRot = 0;
var zRot = 0;

function display() {
    // draw scene to RSM
    drawtoRsm(sunLight, rsm);

    var viewMat = mat4.create();
    viewMat = mvMatrix;

    if(env.indirectLightOn){
        // draw scene to the geometry buffer
        depthNormalBuffer.begin(viewMat, pMatrix, sunLight);
        depthNormalBuffer.draw();
        depthNormalBuffer.resample();
        
        // gpu
        // inject blocking potentials into geometry volume
        grid.inject(geometryVolume, depthNormalBuffer);
        // inject blocking potentials from RSM
        grid.inject2(geometryVolume, rsm);
        // select blocking potentials from geometry volume 0 & 1 (based on magnitude)
        grid.selectGrid(geometryVolume);

        // inject & propagate virtual point light
        grid.injectVpls(rsm, geometryVolume);
        
        // cpu
        // inject blocking potentials into geometry volume
        /*grid.inject(geometryVolume, depthNormalBuffer);
        // inject blocking potentials from RSM
        grid.inject2(geometryVolume, rsm);
        //  select blocking potentials from geometry volume 0 & 1 (based on magnitude)
        grid.selectGrid(geometryVolume);
        
        // inject & propagate virtual point light
        grid.injectVpls(rsm, geometryVolume);

        // compute indirect light
        indirectLightBuffer.begin(viewMat, pMatrix, sunLight, env.lightVolumeTextureDim);
        grid.bindLightVolumeTexture();
        indirectLightBuffer.draw();
        grid.unbindLightVolumeTexture();

        // blur indirect light buffer
        indirectLightBuffer.blur(depthNormalBuffer, env.lightVolumeTextureDim, sunLight);*/
    }
    /*var skyColor = (-1.0) * sunLight.getLightDirinWorldSpace()[1];
    skyColor = Math.max(0.0, skyColor);
    skyColor = Math.min(1.0, skyColor);
    gl.clearColor(0.0, 0.0, skyColor, 1.0);*/
    /*gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // render the scene, add direct/indirect light & shadow
    drawModel(viewMat, pMatrix, indirectLightBuffer, sunLight, rsm, env.indirectLightOn);*/
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /*if (vertexPositionBuffer == null || vertexIndexBuffer == null) {
        console.log("Return: buffer is empty.");
        return;
    }*/

    /*mat4.perspective(60.0, canvas.width / canvas.height, 1.0, 200.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, -27.5]);*/
    mat4.perspective(60.0, canvas.width / canvas.height, env.znear, env.zfar, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, cam.pos);
    mat4.rotate(mvMatrix, degtoRad(cam.rot[0]), [1.0, 0.0, 0.0]);
    mat4.rotate(mvMatrix, degtoRad(cam.rot[1]), [0.0, 1.0, 0.0]);

    display();
    
    /*gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    // run base shader
    var baseshader = shaderList[0];
    baseshader.UseProgram();
    baseShaderSet(shaderList[0]);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);*/

    //mat4.rotate(mvMatrix, degtoRad(xRot), [1, 0, 0]);
    //mat4.rotate(mvMatrix, degtoRad(yRot), [0, 1, 0]);
    //mat4.rotate(mvMatrix, degtoRad(zRot), [0, 0, 1]);
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

// set light direction when light rotated
function idleFunction() {
    if(env.rotateLight) {
        // rotate
        if(env.lightRotation > Math.PI) {
            env.rotateDir *= -1.0;
            env.lightRotation = Math.PI;
        } else if(env.lightRotation < 0.0) {
            env.rotateDir *= -1.0;
            env.lightRotation = 0.0;
        }

        var lightDir = [0.0, 0.0, 0.0];
        var rot = mat4.create();

        if(env.lightRotateAxis) {
            // to do - build rotate matrix
            mat4.identity(rot);
            mat4.rotate(rot, (-1.0)*env.lightRotation, [1.0, 0.0, 0.0] );
            mat4.vecTransform(rot, lightDir, [0.0, 0.0, -1.0]);
        } else {
            var axis = [0.0, 0.0, 0.0];
            vec3.normalize( [1.0, 0.0, 1.0], axis );
            mat4.identity(rot);
            mat4.rotate(rot, -(1.0)*env.lightRotation, axis);
            axis[2] *= (-1.0);
            mat4.vecTransform(rot, lightDir, axis);
        }

        env.lightRotation += Math.PI * env.rotateDir * 60 /( 100.0 * 60.0 );
        sunLight.setDir(lightDir);
        sunLight.update();
    }
}

// called in afterModelLoaded function.
function tick() {
    requestAnimFrame(tick);
    idleFunction();
    drawScene();
    animate();
}

function reshape() {
    //canvas.width = innerWidth;
    //canvas.height = innerHeight;
    canvas.width = 1280;
    canvas.height = 720;
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

}

function demoSetting() {
    console.log("Constructor");
    env = new Environment();
    env.initProjMatrixDirty(true);
    env.initError(false);
    env.initCam([0.0, 0.0, -27.5], [0.0, 0.0, 0.0]);
    env.initZnear(1.0);
    env.initZfar(200.0);
    env.initIteration(8);
    env.initLightVolumeTextureDim([16, 16, 16]);
    env.initLightRotation(Math.PI / 2.0);   // pi = 3.141592f;
    env.initRotateDir(1.0);
    env.initIndirectLightOn(true);
    env.initWireFrameMode(false);
    env.initRotateLight(false);
    env.initUseGeomVolume(true);
    env.initDampen(true);
    env.initLightRotateAxis(true);
}

function start() {
    canvas = document.getElementById("glcanvas");
    initGL(canvas);
    demoSetting();
    initList();

    modelCreate();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
}

function keyboardFunc(event) {
    //alert( "keyCode for the key pressed: " + event.keyCode + "\n" );
    if(event.keyCode == 113) { // key F2 - indirect light on/off
        env.indirectLightOn = !env.indirectLightOn;
    } 
    else if(event.keyCode == 118) { // key F7 - light rotate
        env.rotateLight = !env.rotateLight;
    } 
    else if(event.keyCode == 119) { // key F8 - blocking potential on/off
        env.useGeomVolume = !env.useGeomVolume;
        grid.setUseGeometryVolume(env.useGeomVolume);
    } 
    else if(event.keyCode == 120) { // key F9 - dampen on/off
        env.dampen = !env.dampen;
        indirectLightBuffer.setDampen(env.dampen);
    } 
    else if(event.which == 'Z'.charCodeAt(0)) { // key Z - light rotation direction set
        env.lightRotateAxis = true;
        env.lightRotation = Math.PI / 2.0;
        env.rotateDir = 1.0;
    } 
    else if(event.which == 'X'.charCodeAt(0)) { // key X - light rotation direction set
        env.lightRotateAxis = false;
        env.lightRotation = 2.7;
        env.rotateDir = -1.0;
    }
    // rotate scene
    else if(event.keyCode == 37) { // key left
        cam.rotateLeft();
    }
    else if(event.keyCode == 38) { // key up
        cam.rotateUp();
    }
    else if(event.keyCode == 39) { // key right
        cam.rotateRight();
    }
    else if(event.keyCode == 40) { // key down
        cam.rotateDown();
    }
    // move camera position
    else if(event.which == 'A'.charCodeAt(0)) { // key A - translate left
        cam.moveLeft();
    }
    else if(event.which == 'W'.charCodeAt(0)) { // key W - translate up
        cam.moveForward();
    }
    else if(event.which == 'D'.charCodeAt(0)) { // key W - translate right
        cam.moveRight();
    }
    else if(event.which == 'S'.charCodeAt(0)) { // key W - translate backward
        cam.moveBackward();
    }
}

window.onload = function() {
    start();
}

window.onresize = function() {
    console.log('resize');
    reshape();
}