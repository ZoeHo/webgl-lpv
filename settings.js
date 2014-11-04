function Environment() {
    this.projMatrixDirty = false;
    this.Error = false;
    this.cam = [];
    this.znear = 0.0;
    this.zfar = 0.0;
    this.iterations = 0.0;
    this.lightVolumeTextureDim = [];
    this.lightRotation = 0.0;
    this.rotateDir = 0.0;
    this.indirectLightOn = false;
    this.wireFrameMode = false;
    this.rotateLight = false;
    this.useGeomVolume = false;
    this.dampen = false;
    this.lightRotateAxis = false;
}

Environment.prototype = {
    initProjMatrixDirty: function(option) {
        this.projMatrixDirty = option;
    },
    initError: function(option) {
        this.Error = option;
    },
    initCam: function(position, rotate) {
        // need to do.
    },
    initZnear: function(value) {
        this.znear = value;
    },
    initZfar: function(value) {
        this.zfar = value;
    },
    initIteration: function(value) {
        this.iterations = value;
    },
    initLightVolumeTextureDim: function(vector) {
        this.lightVolumeTextureDim = vector;
    },
    initLightRotation: function(value) {
        this.lightRotation = value;
    },
    initRotateDir: function(value) {
        this.rotateDir = value;
    },
    initIndirectLightOn: function(option) {
        this.indirectLightOn = option;
    },
    initWireFrameMode: function(option) {
        this.wireFrameMode = option;
    },
    initRotateLight: function(option) {
        this.rotateLight = option;
    },
    initUseGeomVolume: function(option) {
        this.useGeomVolume = option;
    },
    initDampen: function(option) {
        this.dampen = option;
    },
    initLightRotateAxis: function(option) {
        this.lightRotateAxis = option;
    }
};

function camera() {

}

// glutapp
// test_model
//// gemo obj
//// transformation_controller
//// bounding box
// rsm
//// render buffer
//// depth buffer
// directional light
//// bounding box
//// grid space
// bounding box
// camera
// depth normal buffer
// grid
// indirect light buffer