function DepthNormalBuffer() {
    this._width = 0;
    this._height = 0;
    this._blockerBufferWidth = 0;
    this._blockerBufferHeight = 0;
    this._nearFarPlane = [0.0, 0.0];
    this._depthNormal;
    this._depthBuffer;
    this._blockerDepthNormal;
    this._DNshader;
    this._resampleShader;

    this._params = [];
}

DepthNormalBuffer.prototype = {
    create: function(width, height, nearPlane, farPlane, blockerBufferWidth) {
        this._width = width;
        this._height = height;
        this._nearFarPlane = [nearPlane, farPlane - nearPlane];

        // create depth/normal teture
        // RG = depth in view space & BA = normal.xy in view space
        this._params = new TextureParams();
        this._params.magFilter = gl.NEAREST;
        this._params.minFilter = gl.NEAREST;
        this._params.internalFormat = gl.RGBA;
        this._params.sourceFormat = gl.RGBA;

        this._depthNormal = new Texture("depthNormal", this._params, this._width, this._height, null);
        textureList.push(this._depthNormal);

        // create depth/normal buffer
        this._depthBuffer = new DepthBuffer();
        this._depthBuffer.params = new DepthBufferParams();
        this._depthBuffer.create(this._depthBuffer.params, this._width, this._height);

        // buffer used to downsample the depthNormal buffer
        this._blockerBufferWidth = blockerBufferWidth;
        var aspect = width / height;
        this._blockerBufferHeight = Math.floor(this._blockerBufferWidth / aspect + 0.5);

        // read the view space geometry of the scene
        // then create blocking potentials in the geometry volume
        this._blockerDepthNormal = new Texture("blockerDepthNormal", this._params, this._blockerBufferWidth, this._blockerBufferHeight, null);
        textureList.push(this._blockerDepthNormal);

        // create depth normal & resample shader
        this.createShader();
    },
    createShader: function() {
        var depthNormalShader = new ShaderResource();
        depthNormalShader.initShaders("depthNormalShader", depthNormalVertexShader, depthNormalFragmentShader);
        shaderList.push(depthNormalShader);

        var resampleShader = new ShaderResource();
        resampleShader.initShaders("resampleShader", resampleVertexShader, resampleFragmentShader);
        shaderList.push(resampleShader);
    }
};