function RSM() {
    this.width = 0;
    this.height = 0;
    this.params = [];
    this.normalTexX;
    this.normalTexY;
    this.colorTex;
    this.depthTex;
    this.depthBuffer;
    this.renderTexture;
}

RSM.prototype = {
    create: function(_width, _height) {
        this.width = _width;
        this.height = _height;

        //create normal buffer
        this.params = new TextureParams();
        this.params.magFilter = gl.NEAREST;
        this.params.minFilter = gl.NEAREST;
        this.params.internalFormat = gl.LUMINANCE;
        this.params.sourceFormat = gl.LUMINANCE;
        this.params.type = gl.FLOAT;


        this.normalTexX = new Texture("rsmNormalTexX", this.params, this.width, this.height, null);
        textureList.push(this.normalTexX);

        this.normalTexY = new Texture("rsmNormalTexY", this.params, this.width, this.height, null);
        textureList.push(this.normalTexY);

        // create color buffer
        this.params.internalFormat = gl.RGB;
        this.params.sourceFormat = gl.RGB;
        this.params.type = gl.UNSIGNED_BYTE;
        this.colorTex = new Texture("rsmColorTex", this.params, this.width, this.height, null);
        textureList.push(this.colorTex);

        // create depth buffers
        this.params.internalFormat = gl.LUMINANCE;
        this.params.sourceFormat = gl.LUMINANCE;
        this.params.type = gl.FLOAT;
        this.depthTex = new Texture("rsmDepthTex", this.params, this.width, this.height, null);
        textureList.push(this.depthTex);

        this.depthBuffer = new DepthBuffer();
        this.depthBuffer.params = new DepthBufferParams();
        this.depthBuffer.create(this.depthBuffer.params, _width, _height);
    }
};

function DepthBuffer() {
    this.depthRenderBuffer = 0;
    this.stencil = false;
    this.params = [];
}

DepthBuffer.prototype = {
    create: function(_params, _width, _height) {
        this.params = _params;
        this.stencil = this.params.stencil;

        if (gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) < _width || gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) < _height) {
            console.log("render buffer exeeds max size.");
        }

        this.depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRenderBuffer);

        if (this.params.sample > 1) {
            console.log("multisample render buffer not support.");
        } else {
            gl.renderbufferStorage(gl.RENDERBUFFER, this.params.format, _width, _height);
        }
    },
    ceateDepthBufferParams: function() {
        this.params = new DepthBufferParams();
    }
};

function DepthBufferParams() {
    this.sample = 1;
    this.format = gl.DEPTH_COMPONENT16;
    this.stencil = false;
}