// This file is create test model,RSM and final shader.

var vertexArray;
var bbox;
var sunLight;
var rsm;
var dnBuffer; // depth normal buffer
var ilBuffer; // indirect light buffer

var baseShader;
var rsmShader;
var rsmNormalShader;
var rsmDiffuseShader;
var rsmDepthShader;
var finalILShader;
var finalNILShader;

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
    var grid_bbox;

    createShader();
    grid_bbox = createGridBoundingBox();

    sunLight = new Light();
    sunLight.createLight(grid_bbox); //now

    var rsmWidth = 512;
    var rsmHeight = 512;

    console.log("Create RSM.");
    createRSM();

    console.log("Inject depth/normal buffer.");
    createDNBuffer();

    console.log("Indirect light buffer.");
    createILBuffer();
}

// shader
function createShader() {
    console.log("CreateShader");

    baseShader = new ShaderResource();
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
    rsmNormalShader = new ShaderResource();
    rsmNormalShader.initShaders("rsmNormalShader", rsmVertexShader, rsmNormalFragmentShader);
    shaderList.push(rsmNormalShader);

    rsmDiffuseShader = new ShaderResource();
    rsmDiffuseShader.initShaders("rsmDiffuseShader", rsmVertexShader, rsmDiffuseFragmentShader);
    shaderList.push(rsmDiffuseShader);

    rsmDepthShader = new ShaderResource();
    rsmDepthShader.initShaders("rsmDepthShader", rsmVertexShader, rsmDepthFragmentShader);
    shaderList.push(rsmDepthShader);
}

function createFinalShader() {
    finalILShader = new ShaderResource();
    finalILShader.initShaders("finalILShader", finalVertexShader, finalFragmentShader);
    shaderList.push(finalILShader);

    finalNILShader = new ShaderResource();
    var finalNILVertexShader = "#define NO_INDIRECT_LIGHT\n";
    finalNILVertexShader = finalNILVertexShader.concat(finalVertexShader);
    var finalNILFragmentShader = "#define NO_INDIRECT_LIGHT\n";
    finalNILFragmentShader = finalNILFragmentShader.concat(finalFragmentShader);
    finalNILShader.initShaders("finalNILShader", finalNILVertexShader, finalNILFragmentShader);
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

function createDNBuffer() {
    dnBuffer = new DepthNormalBuffer();
    dnBuffer.create(canvas.width, canvas.height, env.znear, env.zfar, 512);
}

function createILBuffer() {
    ilBuffer = new IndirectLightBuffer();
    ilBuffer.create(canvas.width / 2, canvas.height / 2);
}

function IndirectLightBuffer() {
    this._width = 0;
    this._height = 0;

    this._lightBuffer;
    this._blurBuffer;
    this._depthBuffer;
    this._params = [];
}

IndirectLightBuffer.prototype = {
    create: function(width, height) {
        this._width = width;
        this._height = height;

        // create indirect light buffer texture
        this._params = new TextureParams();
        this._params.magFilter = gl.LINEAR;
        this._params.minFilter = gl.LINEAR;
        this._params.internalFormat = gl.RGB;
        this._params.sourceFormat = gl.RGB;

        this._lightBuffer = new Texture("indirectLightBuffer", this._params, this._width, this._height, null);
        textureList.push(this._lightBuffer);

        // create the buffer to blur the light buffer
        this._blurBuffer = new Texture("blurBuffer", this._params, this._width, this._height, null);
        textureList.push(this._blurBuffer);

        // create indirect light depth buffer
        this._depthBuffer = new DepthBuffer();
        this._depthBuffer.params = new DepthBufferParams();
        this._depthBuffer.create(this._depthBuffer.params, this._width, this._height);

        // create indirect light & blur shader
        this.createShader();

        window.o = this;
    },
    createShader: function() {
        // first indirect light shader , not define dampen
        var indirectLightShader = new ShaderResource();
        indirectLightShader.initShaders("indirectLightShader", indirectLightVertexShader, indirectLightFragmentShader);

        // second indirect light shader , define dampen
        var indirectLightDampenShader = new ShaderResource();
    }
};