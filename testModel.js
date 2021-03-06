// This file is create test model,RSM and final shader.

var vertexArray;
var bbox;
var sunLight;
var rsm;
var depthNormalBuffer; // depth normal buffer
var indirectLightBuffer; // indirect light buffer
var grid;
var geometryVolume;
var cam;

function cleanup() {
    // correspond lpv/test_model::cleanup();
    // to do rsm shader clean up
    // to do final shader clean up

    // it is called when program terminal

    if (!vertexArray) {
        vertexArray = null;
    }
}

// modelCreate:
// Load modelData.vertex information and assign to vertex_array
// Use vertex_array to calculate the boundingbox
// Get the model center and translate all the vertex in vertex_array to new coord., which new center is at (0, 0, 0)
// Bind vertex_array to vertexPositionBuffer
function modelCreate() {
    cleanup();

    //loadCornellbox();
    loadCornellbox(function() {
        //bbox = calculateBBox();
        afterModelLoaded();
    });
}

// motion when model complete loaded
function afterModelLoaded() {
    var gridBbox;
    //var lightVolumeDim = [ 16.0, 16.0, 16.0 ];
    var lightVolumeDim = env.lightVolumeTextureDim;

    createShader();
    gridBbox = createGridBoundingBox();

    sunLight = new Light();
    sunLight.createLight(grid_bbox); //now

    var rsmWidth = 512;
    var rsmHeight = 512;

    console.log("Create RSM.");
    createRSM();

    console.log("Inject depth/normal buffer.");
    createDNBuffer();

    console.log("Indirect light buffer.");
    createIndirectLightBuffer();

    console.log("Grid.");
    createGrid( gridBbox, lightVolumeDim, rsmWidth, rsmHeight, sunLight );

    console.log("Geometry volume.");
    createGeometryVolume();

    // call tick() to prompt requestAnimFrame function
    tick();
}

// shader
function createShader() {
    console.log("CreateShader");

    var baseShader = new ShaderResource();
    baseShader.initShaders("baseShader", cubeVertexShader, cubeFragmentShader);
    baseShader.UseProgram();

    shaderList.push(baseShader);

    console.log("Create RSM shader.");
    createRSMshader();

    console.log("Create Final shader.");
    createFinalShader();
}

function createRSMshader() {
    //rsmShader = new ShaderResource();
    //rsmShader.initShaders("rsmShader", rsmVertexShader, rsmFragmentShader);
    var rsmNormalXShader = new ShaderResource();
    rsmNormalXShader.initShaders("rsmNormalXShader", rsmVertexShader, rsmNormalXFragmentShader);
    shaderList.push(rsmNormalXShader);

    var rsmNormalYShader = new ShaderResource();
    rsmNormalYShader.initShaders("rsmNormalYShader", rsmVertexShader, rsmNormalYFragmentShader);
    shaderList.push(rsmNormalYShader);

    var rsmDiffuseShader = new ShaderResource();
    rsmDiffuseShader.initShaders("rsmDiffuseShader", rsmVertexShader, rsmDiffuseFragmentShader);
    shaderList.push(rsmDiffuseShader);

    var rsmDepthShader = new ShaderResource();
    rsmDepthShader.initShaders("rsmDepthShader", rsmVertexShader, rsmDepthFragmentShader);
    shaderList.push(rsmDepthShader);
}

function createFinalShader() {
    var finalILShader = new ShaderResource();
    finalILShader.initShaders("finalIndirectLightShader", finalVertexShader, finalFragmentShader);
    shaderList.push(finalILShader);

    var finalNILShader = new ShaderResource();
    var finalNILVertexShader = "#define NO_INDIRECT_LIGHT\n";
    finalNILVertexShader = finalNILVertexShader.concat(finalVertexShader);
    var finalNILFragmentShader = "#define NO_INDIRECT_LIGHT\n";
    finalNILFragmentShader = finalNILFragmentShader.concat(finalFragmentShader);
    finalNILShader.initShaders("finalNoIndirectLightShader", finalNILVertexShader, finalNILFragmentShader);
    shaderList.push(finalNILShader);
}

// grid boundingbox
// set size of grid
// light & grid are fixed, scene are rotated according light direction. 
function createGridBoundingBox() {
    var r = bbox.calculateLength(bbox.calculateDim()) * 0.5;
    grid_bbox = new Boundingbox();
    grid_bbox.maxV = [r, r, r];
    grid_bbox.minV = [-r, -r, -r];

    return grid_bbox;
}

function createRSM() {
    rsm = new RSM();
    rsm.create(512, 512);
}

function normalize(vector) {
    var length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
    vector = [vector[0] / length, vector[1] / length, vector[2] / length];
    return vector;
}

// create depth normal buffer
function createDNBuffer() {
    depthNormalBuffer = new ndepthNormalBuffer();
    depthNormalBuffer.create(canvas.width, canvas.height, env.znear, env.zfar, 512);
}

// create indirect light buffer
function createIndirectLightBuffer() {
    indirectLightBuffer = new nIndirectLightBuffer();
    indirectLightBuffer.create(canvas.width / 2, canvas.height / 2);
}

function createGrid( grid_bbox, lightVolumeDim, rsmWidth, rsmHeight, sunLight ) {
    grid = new ngrid();
    var iterations = 8;
    grid.setIterations( iterations );

    grid.create( grid_bbox, lightVolumeDim[0], lightVolumeDim[1], lightVolumeDim[2], rsmWidth, rsmHeight, sunLight );
}

function createGeometryVolume() {
    geometryVolume = new ngeometryVolume();
    grid.createGeometryVolume(geometryVolume);
}

// call from main.js drawScene();
function baseShaderSet(shaderSource) {
    /*shaderSource.shaderProgram.vertexPositionAttribute = shaderSource.GetAttribute("aVertexPosition");
    gl.enableVertexAttribArray(shaderSource.shaderProgram.vertexPositionAttribute);

    // color
    shaderSource.shaderProgram.vertexColorAttribute = shaderSource.GetAttribute("aVertexColor");
    gl.enableVertexAttribArray(shaderSource.shaderProgram.vertexColorAttribute);*/

    // texture
    //this.shaderProgram.textureCoordAttribute = this.GetAttribute("aTextureCoord");
    //gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

    /*shaderSource.shaderProgram.pMatrixUniform = shaderSource.GetUniform("uPMatrix");
    shaderSource.shaderProgram.mvMatrixUniform = shaderSource.GetUniform("uMVMatrix");
    shaderSource.shaderProgram.samplerUniform = shaderSource.GetUniform("uSampler");*/

    //shaderSource.setMatrixUniforms("uPMatrix", shaderSource.shaderProgram.pMatrixUniform, pMatrix);
    //shaderSource.setMatrixUniforms("uMVMatrix", shaderSource.shaderProgram.mvMatrixUniform, mvMatrix);
    var positionBuffer = bufferList[0]._buffer;
    shaderSource.setAttributes(positionBuffer, "aVertexPosition", gl.FLOAT);
    //shaderSource.setAttributes(vertexPositionBuffer, "aVertexPosition", gl.FLOAT);
    shaderSource.setAttributes(vertexColorBuffer, "aVertexColor", gl.FLOAT);
    // matrix
    shaderSource.setMatrixUniforms("uPMatrix", pMatrix);
    shaderSource.setMatrixUniforms("uMVMatrix", mvMatrix);
}

// test model 
// setup RSM and shader to draw the scene to RSM
// first : normalx, second : normaly
// third : rsm color
// fourth : rsm depth
// accept shaderID & textureID, render the data to texture
function renderRsmTex(light, rsm, shaderID, textureID) {
    var gridSpaceRotation = light.getGridSpaceRotation();
    var gridSpaceTranslation = light.getGridSpaceTranslation();
    var gridSpace = mat4.create();

    mat4.multiply(gridSpaceTranslation, gridSpaceRotation, gridSpace);
    var projection = light.getGridSpaceProjection();
    
    // rsm bind
    gl.viewport(0, 0, rsm.getWidth(), rsm.getHeight());
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var rsmShader = shaderList[shaderID];
    rsmShader.UseProgram();
    rsmShader.setMatrixUniforms("projection_matrix", projection);
    rsmShader.setMatrixUniforms("grid_space", gridSpace);

    var gridOrigin = light.getGridbox().getMin();
    rsmShader.setUniform("grid_origin_z", gridOrigin[2]);

    var positionBuffer = bufferList[0]._buffer;
    rsmShader.setAttributes(positionBuffer, "position", gl.FLOAT);
    rsmShader.setAttributes(vertexNormalBuffer, "normal", gl.FLOAT);
    rsmShader.setAttributes(vertexTextureCoordBuffer, "texcoord", gl.FLOAT);
    rsmShader.setAttributes(vertexColorBuffer, "color", gl.FLOAT);

    // using framebuffer to get shader result. 
    rsmShader.bindTexToFramebuffer(rsm.rsmFramebuffer, rsm.rsmRenderbuffer, textureList[textureID]);

    drawTextureElement(textureID);
    rsmShader.unbindFramebuffer();
    // Create a framebuffer and attach the texture.
    /*var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureList[0].texture, 0);*/
}

function drawTextureElement(textureID) {
    //gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    //gl.drawArrays(gl.TRIANGLES, 0, 234);
    
    /*gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[textureID].params.internalFormat, 0, 0, textureList[textureID].width, textureList[textureID].height, 0);
    if(textureList[textureID].params.type === gl.FLOAT) {
        Texture.getFloatTexImage(textureID);
    } else if(textureList[textureID].params.type === gl.UNSIGNED_BYTE) {
        Texture.getUnsignedTexImage(textureID);
    }*/

    gl.bindTexture(gl.TEXTURE_2D, null);
    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// draw the scene to RSM
function drawtoRsm(light, rsm) {
    // draw to rsm normal (x,y) texture
    renderRsmTex(light, rsm, 1, 0);
    renderRsmTex(light, rsm, 2, 1);
    // drawtoRsmColor
    renderRsmTex(light, rsm, 3, 2);
    // drawtoRsmDepth
    renderRsmTex(light, rsm, 4, 3);

    //drawRGBTexture(rsm.getWidth(), rsm.getHeight(), 3);
}

function drawModel(viewMatrix, projMatrix, indirectLightBuffer, light, rsm, indirectLight) {
    // draw the scene with direct/indirect light and shadows
    // choose with/without indirect light shader
    var shader;
    indirectLight ? shader = shaderList[5] : shader = shaderList[6];

    shader.UseProgram();
    shader.setMatrixUniforms("projection_matrix", projMatrix);
    shader.setMatrixUniforms("view_matrix",viewMatrix);

    var gridSpaceRotation = light.getGridSpaceRotation();
    
    // grid space - use RSM texture as shadow map
    shader.setMatrixUniforms("light_space_matrix", gridSpaceRotation);

    if(indirectLight) {
        // active : indirect light buffer texture
        shader.setUniformSampler("indirect_light", 6);
        shader.activeSampler(textureList[6].texture, 6);
    }
    shader.setUniform("grid_origin_z", light.getGridbox().getMin()[2]);
    
    // RSM : data required for the shadow
    var projection = light.getGridSpaceProjection();
    var rsmMatrix = mat4.create();
    mat4.multiply(projection, gridSpaceRotation, rsmMatrix);
    shader.setMatrixUniforms("rsm_matrix", rsmMatrix);

    shader.setUniformSampler("rsm_depth", 3);
    shader.activeSampler(textureList[3].texture, 3);

    var positionBuffer = bufferList[0]._buffer;
    shader.setAttributes(positionBuffer, "position", gl.FLOAT);
    shader.setAttributes(vertexNormalBuffer, "normal", gl.FLOAT);
    shader.setAttributes(vertexTextureCoordBuffer, "texcoord", gl.FLOAT);
    shader.setAttributes(vertexColorBuffer, "mcolor", gl.FLOAT);

    gl.drawArrays(gl.TRIANGLES, 0, positionBuffer.numItems);
    gl.bindTexture(gl.TEXTURE_2D, null);
}