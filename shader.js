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

function ShaderResource() {
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

ShaderResource.prototype.initShaders = function(name, vs, fs) {
    this.name = name;
    this.shaderProgram = gl.createProgram();
    this.GetShader(gl, vs, fs);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }
};

ShaderResource.prototype.GetShader = function(gl, vshaderName, fshaderName) {
    var fshader, vshader;
    vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, vshaderName);
    gl.compileShader(vshader);
    gl.attachShader(this.shaderProgram, vshader);

    // Check the compile status, return an error if failed
    if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
        console.log("VertexShader " + gl.getShaderInfoLog(vshader));
    }

    fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, fshaderName);
    gl.compileShader(fshader);
    gl.attachShader(this.shaderProgram, fshader);

    // Check the compile status, return an error if failed
    if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
        console.log("FragmentShader " + gl.getShaderInfoLog(fshader));
    }
};

ShaderResource.prototype.UseProgram = function() {
    gl.useProgram(this.shaderProgram);
}

ShaderResource.prototype.GetAttribute = function(attributeName) {
    return gl.getAttribLocation(this.shaderProgram, attributeName);
};

ShaderResource.prototype.GetUniform = function(uniformName) {
    return gl.getUniformLocation(this.shaderProgram, uniformName);
};

ShaderResource.prototype.setMatrixUniforms = function(uniformName, matrix) {
    var matrixUnifrom;
    matrixUnifrom = this.GetUniform(uniformName);
    gl.uniformMatrix4fv(matrixUnifrom, false, matrix);
};

ShaderResource.prototype.setUniform = function(uniformName, variable) {
    var uniformLocation;
    uniformLocation = this.GetUniform(uniformName);
    gl.uniform1f(uniformLocation, variable);
};

ShaderResource.prototype.setUniform2f = function(uniformName, variable) {
    var uniformLocation;
    uniformLocation = this.GetUniform(uniformName);
    gl.uniform2f(uniformLocation, variable[0], variable[1]);
};

ShaderResource.prototype.setUniform3f = function(uniformName, variable) {
    var uniformLocation;
    uniformLocation = this.GetUniform(uniformName);
    gl.uniform3f(uniformLocation, variable[0], variable[1], variable[2]);
};

ShaderResource.prototype.setUniform4f = function(uniformName, variable) {
    var uniformLocation;
    uniformLocation = this.GetUniform(uniformName);
    gl.uniform4f(uniformLocation, variable[0], variable[1], variable[2], variable[3]);
};

ShaderResource.prototype.setUniformBuffer = function(uniformName, buffer) {
    var uniformLocation;
    uniformLocation = this.GetUniform(uniformName);
    gl.uniform1fv(uniformLocation, buffer);
};

ShaderResource.prototype.setUniform3fv = function(uniformName, buffer) {
    var uniformLocation;
    uniformLocation = this.GetUniform(uniformName);
    gl.uniform3fv(uniformLocation, buffer);
};

ShaderResource.prototype.setUniformSampler = function(uniformName, value) {
    // If location is a texture sampler, then value refers to an offset into the array of active textures.
    var uniformLocation;
    uniformLocation = this.GetUniform(uniformName);
    gl.uniform1i(uniformLocation, value);
};

ShaderResource.prototype.activeSampler = function(texture, activeID) {
    gl.activeTexture(gl.TEXTURE0 + activeID);
    gl.bindTexture(gl.TEXTURE_2D, texture);
};

ShaderResource.prototype.unbindSampler = function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

ShaderResource.prototype.bindTexToFramebuffer = function(fb, rb, texture) {
    // attach texture to the framebuffer, drawing shader result to it.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texture.width, texture.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

ShaderResource.prototype.bindTexToFramebufferForAdd = function(fb, texture) {
    // attach texture to the framebuffer, drawing shader result to it.
    // Not clear the color and depth, texture is shader input to accumulate color.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture,0);   
};

ShaderResource.prototype.unbindFramebuffer = function() {
    // switch main framebuffer
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

ShaderResource.prototype.setAttributes = function(buffer, attributeName, type) {
    var attributeLocation;
    attributeLocation = this.GetAttribute(attributeName);
    gl.enableVertexAttribArray(attributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.getAttribLocation(this.shaderProgram, attributeName);
    gl.vertexAttribPointer(attributeLocation, buffer.itemSize, type, false, 0, 0);
};