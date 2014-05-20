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
        modelData.colors = modelData.colors.concat(redColor);
    }

    // yellow box
    for (i = 0; i < 8; i++) {
        modelData.colors = modelData.colors.concat(yellowColor);
    }

    for (i = 0; i < 32; i++) {
        modelData.colors = modelData.colors.concat(whiteColor);
    }
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
    /*modelData.faces = modelData.faces.map(function(v) {
        return v - 1;
    });*/
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelData.faces), gl.STATIC_DRAW);
    vertexIndexBuffer.itemSize = 1;
    vertexIndexBuffer.numItems = modelData.faces.length;

    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    /*for (var i = 0; i < 6; i++) {
        modelData.colors = modelData.colors.concat(modelData.colors);
    }*/
    //initColor(modelData);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = modelData.colors.length / vertexColorBuffer.itemSize;

    //document.getElementById("loadingtext").textContent = "";
}

function loadCornellbox() {
    var request = new XMLHttpRequest();
    request.open("GET", "obj/cornellbox2.js");
    //request.open("GET", "obj/Teapot.json");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            handleLoadedCornellbox(JSON.parse(request.responseText));
        }
    }
    request.send();
}