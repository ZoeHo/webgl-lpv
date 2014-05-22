// This file is create test model,RSM and final shader.

var vertexArray;
var bbox;

var baseShader;
var rsmShader;

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

    // texture coordinate need to add?
    loadCornellbox();
    /*loadCornellbox(function() {
        bbox = calculateBBox();
    });*/
    createShader();
}

// for calculate bounding box
// call from loadCornellbox()
function calculateBBox() {
    bbox = new boundingbox();
    if (vertexArray) {
        bbox.getMaxValue();
        bbox.getMinValue();

        var center = bbox.calculateCenter(bbox.maxV, bbox.minV);
        bbox.calculateDistance(center); // bbox end
    }
}

function boundingbox() {
    this.maxV = [];
    this.minV = [];
}

boundingbox.prototype = {
    getMaxValue: function() {
        // get max x position
        this.maxV[0] = Math.max.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 0;
        }));

        // get max y position
        this.maxV[1] = Math.max.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 1;
        }));

        // get max z position
        this.maxV[2] = Math.max.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 2;
        }));
    },

    getMinValue: function() {
        // get min x position
        this.minV[0] = Math.min.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 0;
        }));

        // get min y position
        this.minV[1] = Math.min.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 1;
        }));

        // get min z position
        this.minV[2] = Math.min.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 2;
        }));
    },

    // calculate the center of bounding box
    calculateCenter: function(max, min) {
        var center = [max[0] + min[0], max[1] + min[1], max[2] + min[2]];
        for (var i = 0; i < 3; i++) {
            center[i] *= 0.5;
        }
        return center;
    },

    // translate all vertex to new position which center at (0, 0, 0)
    calculateDistance: function(center) {
        for (var i = 0; i < vertexArray.length; i += 3) {
            vertexArray[i] = vertexArray[i] - center[0];
            vertexArray[i + 1] = vertexArray[i + 1] - center[1];
            vertexArray[i + 2] = vertexArray[i + 2] - center[2];
        }
    }

};

function createShader() {
    console.log("CreateShader");

    var shlist = shaderList;
    baseShader = new shaderResource();
    baseShader.initShaders("baseShader", cubeVertexShader, cubeFragmentShader);
    baseShader.UseProgram();

    shlist.push(baseShader);

    console.log("Create RSM shader.");

}