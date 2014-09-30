//indirect light
function IndirectLightBuffer() {
    this._width = 0;
    this._height = 0;

    this._lightBuffer;
    this._blurBuffer;
    this._depthBuffer;
    this._params = [];
}

IndirectLightBuffer.prototype = {
    create: function(width, height) {
        this._width = width;
        this._height = height;

        // create indirect light buffer texture
        this._params = new TextureParams();
        this._params.magFilter = gl.LINEAR;
        this._params.minFilter = gl.LINEAR;
        this._params.internalFormat = gl.RGB;
        this._params.sourceFormat = gl.RGB;

        this._lightBuffer = new Texture("indirectLightBuffer", this._params, this._width, this._height, null);
        textureList.push(this._lightBuffer);

        // create the buffer to blur the light buffer
        this._blurBuffer = new Texture("blurBuffer", this._params, this._width, this._height, null);
        textureList.push(this._blurBuffer);

        // create indirect light depth buffer
        this._depthBuffer = new DepthBuffer();
        this._depthBuffer.params = new DepthBufferParams();
        this._depthBuffer.create(this._depthBuffer.params, this._width, this._height);

        // create indirect light & blur shader
        this.createShader();
    },
    createShader: function() {
        // first indirect light shader , not define dampen
        var indirectLightShader = new ShaderResource();
        indirectLightShader.initShaders("indirectLightShader", indirectLightVertexShader, indirectLightFragmentShader);
        shaderList.push( indirectLightShader );

        // second indirect light shader , define dampen
        var indirectLightDampenShader = new ShaderResource();
        var indirectDampenLShader = "#define DAMPEN\n";
        indirectDampenLShader = indirectDampenLShader.concat( indirectLightFragmentShader );
        indirectLightDampenShader.initShaders( "indirectDampenLShader", indirectLightVertexShader, indirectDampenLShader );
        shaderList.push( indirectLightDampenShader );

        var blurShader = new ShaderResource();
        blurShader.initShaders( "blurShader", blurVertexShader, blurFragmentShader );
    }
};