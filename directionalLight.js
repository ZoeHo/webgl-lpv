// directional light
function Light() {
    this.dir = [0, -1, -1];
    this.grid_bbox = [];
    this.grid_space = [];
}

Light.prototype = {
    createLight: function(box) {
        console.log("Create sun light.");
        this.grid_bbox = box;
        this.dir = normalize(this.dir);
        this.update();
    },

    update: function() {
        this.createLightSpaceMatrix();
    },

    createLightSpaceMatrix: function() {
        this.grid_space = new gridSpace();

        // create grid space based on light direction, and rotate scene within the grid.
        // light space direction in grid space is set to (0, 0, -1)
        this.grid_space.create(this.dir, this.grid_bbox);
    },
    setDir: function(dir) {
        this.dir = dir;
    },
    getGridSpaceRotation: function() {
        return this.grid_space.getRotation();
    },
    getGridSpaceTranslation: function() {
        return this.grid_space.getTranslation();
    },
    getGridSpaceProjection: function() {
        return this.grid_space.getProjection();
    },
    getGridbox: function() {
        return this.grid_bbox;
    }
};