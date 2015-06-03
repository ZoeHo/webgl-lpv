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

    this.rsmFramebuffer;
}

RSM.prototype = {
    create: function(_width, _height) {
        this.width = _width;
        this.height = _height;

        //create normal buffer
        var normalParams = new TextureParams();
        normalParams.magFilter = gl.NEAREST;
        normalParams.minFilter = gl.NEAREST;
        normalParams.internalFormat = gl.RGBA;//gl.LUMINANCE;
        normalParams.sourceFormat = gl.RGBA;//gl.LUMINANCE;
        normalParams.type = gl.FLOAT;

        this.normalTexX = new Texture("rsmNormalTexX", normalParams, this.width, this.height, null);
        textureList.push(this.normalTexX);

        this.normalTexY = new Texture("rsmNormalTexY", normalParams, this.width, this.height, null);
        textureList.push(this.normalTexY);

        // create color buffer
        var colorParams = new TextureParams();
        colorParams.magFilter = gl.NEAREST;
        colorParams.minFilter = gl.NEAREST;
        colorParams.internalFormat = gl.RGB;
        colorParams.sourceFormat = gl.RGB;
        colorParams.type = gl.UNSIGNED_BYTE;
        
        this.colorTex = new Texture("rsmColorTex", colorParams, this.width, this.height, null);
        textureList.push(this.colorTex);

        // create depth buffers
        this.depthTex = new Texture("rsmDepthTex", normalParams, this.width, this.height, null);
        textureList.push(this.depthTex);

        this.depthBuffer = new DepthBuffer();
        this.depthBuffer.params = new DepthBufferParams();
        this.depthBuffer.create(this.depthBuffer.params, _width, _height);

        // create framebuffer obj.
        this.rsmFramebuffer = gl.createFramebuffer();
    },
    getWidth: function() {
        return this.width;
    },
    getHeight: function() {
        return this.height;
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