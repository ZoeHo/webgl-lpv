// This file is loading model

//var vertexPositionBuffer;
var vertexNormalBuffer;
var vertexTextureCoordBuffer;
var vertexIndexBuffer;
var vertexColorBuffer;

var model;

function handleLoadedCornellbox(modelData) {
    console.log("LoadModel");
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

    model = modelData;
    // position : vertex
    vertexArray = modelData.vertices;
    bbox = new Boundingbox();
    bbox.calculateBBox(vertexArray);

    var vbuffer = new nbuffer();
    vbuffer.create("testModelVertexBuffer", vertexArray, 3);
    bufferList.push(vbuffer);

    /*vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertices), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = modelData.vertices.length / vertexPositionBuffer.itemSize;*/

    // face : index
    vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    /*modelData.faces = modelData.faces.map(function(v) {
        return v - 1;
    });*/
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelData.faces), gl.STATIC_DRAW);
    vertexIndexBuffer.itemSize = 1;
    vertexIndexBuffer.numItems = modelData.faces.length;

    // color
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = modelData.colors.length / vertexColorBuffer.itemSize;

    // normal
    vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.normals), gl.STATIC_DRAW);
    vertexNormalBuffer.itemSize = 3;
    vertexNormalBuffer.numItems = modelData.normals.length / vertexNormalBuffer.itemSize;
    
    // texture coordinate
    var scaleTexCoord = modelData.uvs;
    for( var i = 0; i < scaleTexCoord.length; i++ ) {
        scaleTexCoord[i] *= 8;
    }
    vertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scaleTexCoord), gl.STATIC_DRAW);
    vertexTextureCoordBuffer.itemSize = 2;
    vertexTextureCoordBuffer.numItems = modelData.uvs.length / vertexTextureCoordBuffer.itemSize;
 
}

function loadCornellbox(callback) {
    //function loadCornellbox() {
    var request = new XMLHttpRequest();
    request.open("GET", "obj/cornellbox2.js");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            handleLoadedCornellbox(JSON.parse(request.responseText));
            // wait for succeed to load model file, go to next function
            callback();
        }
    }
    request.send();
}