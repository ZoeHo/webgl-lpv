/*var shaderProgram;

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function getShader(gl) {
    var fshader, vshader;
    vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, cubeVertexShader);
    gl.compileShader(vshader);
    gl.attachShader(shaderProgram, vshader);

    fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, cubeFragmentShader);
    gl.compileShader(fshader);
    gl.attachShader(shaderProgram, fshader);
}

function initShaders() {
    shaderProgram = gl.createProgram();
    getShader(gl);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    // color
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    //shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    //gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}*/

function shaderResource() {
    this.name = null;
    this.shaderProgram = {
        vertexPositionAttribute: null,
        vertexColorAttribute: null,
        textureCoordAttribute: null,
        pMatrixUniform: null,
        mvMatrixUniform: null,
        samplerUniform: null
    };
}

shaderResource.prototype.initShaders = function(name, vs, fs) {
    this.name = name;
    this.shaderProgram = gl.createProgram();
    this.GetShader(gl, vs, fs);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }
};

shaderResource.prototype.GetShader = function(gl, vshaderName, fshaderName) {
    var fshader, vshader;
    vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, vshaderName);
    gl.compileShader(vshader);
    gl.attachShader(this.shaderProgram, vshader);

    fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, fshaderName);
    gl.compileShader(fshader);
    gl.attachShader(this.shaderProgram, fshader);
};

shaderResource.prototype.UseProgram = function() {
    gl.useProgram(this.shaderProgram);

    gl.useProgram(this.shaderProgram);

    this.shaderProgram.vertexPositionAttribute = this.GetAttribute("aVertexPosition");
    gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

    // color
    this.shaderProgram.vertexColorAttribute = this.GetAttribute("aVertexColor");
    gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);

    //shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    //gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    this.shaderProgram.pMatrixUniform = this.GetUniform("uPMatrix");
    this.shaderProgram.mvMatrixUniform = this.GetUniform("uMVMatrix");
    this.shaderProgram.samplerUniform = this.GetUniform("uSampler");
}

shaderResource.prototype.GetAttribute = function(attributeName) {
    return gl.getAttribLocation(this.shaderProgram, attributeName);
};

shaderResource.prototype.GetUniform = function(uniformName) {
    return gl.getUniformLocation(this.shaderProgram, uniformName);
};

shaderResource.prototype.setMatrixUniforms = function(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}