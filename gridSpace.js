// grid space
function gridSpace() {
    this.rotation = mat4.identity([]);
    this.projection = mat4.identity([]);
    this.translation = mat4.identity([]);

    // light direction in grid space is fixed
    this.lightDir = [0.0, 0.0, -1.0];
}

gridSpace.prototype = {
    create: function(worldDir, grid_bbox) {
        // use light direction to create rotation matrix in world space
        var dir = [worldDir[0], worldDir[1], worldDir[2]];
        var mdir = [-1 * dir[0], -1 * dir[1], -1 * dir[2]];
        this.rotation = mat4.identity([]);
        this.rotation = mat4.setZAxis(this.rotation, mdir);

        // find x & y axis which are perendicular to z axis
        var xAxis = [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0]
        ];
        var yAxis = [];

        for (var i = 0; i < xAxis.length; i++) {
            vec3.cross(mat4.getZAxis(this.rotation), xAxis[i], yAxis);
            if (vec3.dot(yAxis, yAxis) > Number.MIN_VALUE * 10.0) {
                break;
            }
        }

        if (i == xAxis.length) {
            console.log("grid_space create failed.");
        }

        vec3.normalize(yAxis, yAxis);
        var x = [];
        vec3.cross(yAxis, mat4.getZAxis(this.rotation), x);
        vec3.normalize(x, x);

        this.rotation = mat4.setXAxis(this.rotation, x);
        this.rotation = mat4.setYAxis(this.rotation, yAxis);

        // translation & projection matrix to draw RSM
        var gridMaxZvalue = grid_bbox.maxV[2];
        mat4.buildTranslation(this.translation, [0, 0, (-1) * gridMaxZvalue]);

        var range = grid_bbox.calculateDim();
        var zrange = range[2];
        var w2 = range[0] / 2.0;
        var h2 = range[1] / 2.0;
        mat4.buildOrthoProjection(this.projection, (-1) * w2, w2, h2, (-1) * h2, 0.0, zrange);
    },
    getRotation: function() {
        return this.rotation;
    },
    getTranslation: function() {
        return this.translation;
    },
    getProjection: function() {
        return this.projection;
    },
    getLightDir: function() {
        return this.lightDir;
    }
};