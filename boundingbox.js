// bounding box
function Boundingbox() {
    this.maxV = [];
    this.minV = [];
}

Boundingbox.prototype = {
    // for calculate bounding box
    // call from loadCornellbox()
    calculateBBox: function(vertexArray) {
        if (vertexArray) {
            this.maxV = this.getMaxValue(this.maxV);
            this.minV = this.getMinValue(this.minV);

            var center = this.calculateCenter(this.maxV, this.minV);
            this.calculateDistance(center); // bbox end
        }
    },

    getMaxValue: function(max) {
        // get max x position
        max[0] = Math.max.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 0;
        }));

        // get max y position
        max[1] = Math.max.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 1;
        }));

        // get max z position
        max[2] = Math.max.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 2;
        }));

        return max;
    },

    getMinValue: function(min) {
        // get min x position
        min[0] = Math.min.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 0;
        }));

        // get min y position
        min[1] = Math.min.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 1;
        }));

        // get min z position
        min[2] = Math.min.apply(null, vertexArray.filter(function(value, key) {
            return key % 3 === 2;
        }));
        return min;
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
    },

    calculateDim: function() {
        var dim = [this.maxV[0] - this.minV[0], this.maxV[1] - this.minV[1], this.maxV[2] - this.minV[2]];
        return dim;
    },

    calculateLength: function(dim) {
        var length = Math.sqrt(dim[0] * dim[0] + dim[1] * dim[1] + dim[2] * dim[2]);
        return length;
    }

};