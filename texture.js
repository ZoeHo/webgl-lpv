/*var cubeTexture;

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture() {
    cubeTexture = gl.createTexture();
    cubeTexture.image = new Image();
    cubeTexture.image.onload = function() {
        handleLoadedTexture(cubeTexture)
    }

    cubeTexture.image.src = "firefoxlogo.png";
}*/

function Texture(_name, _params, _width, _height, _data) {
    this.name = _name;
    this.params = _params;
    this.width = _width;
    this.height = _height;
    this.data = _data;
    this.texture = null;
    this.pixels = null;

    this.initTexture();
}

Texture.prototype = {
    initTexture: function() {
        this.texture = gl.createTexture();
        this.handleLoadedTexture(this.texture);
    },
    handleLoadedTexture: function(texture) {
        gl.bindTexture(this.params.target, texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        gl.texParameteri(this.params.target, gl.TEXTURE_WRAP_S, this.params.warpS);
        gl.texParameteri(this.params.target, gl.TEXTURE_WRAP_T, this.params.warpT);
        gl.texParameteri(this.params.target, gl.TEXTURE_MAG_FILTER, this.params.magFilter);
        gl.texParameteri(this.params.target, gl.TEXTURE_MIN_FILTER, this.params.minFilter);

        if (this.params.anisotropyDegree > 1) {
            var ext = (
                gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
                gl.getExtension("EXT_texture_filter_anisotropic")
            );
            gl.texParameteri(this.params.target, ext.TEXTURE_MAX_ANISOTROPY_EXT, this.params.anisotropyDegree);
        }

        gl.texImage2D(this.params.target, 0, this.params.internalFormat, this.width, this.height, 0, this.params.sourceFormat, this.params.type, this.data);

        if (this.params.minFilter === gl.LINEAR_MIPMAP_LINEAR ||
            this.params.minFilter === gl.NEAREST_MIPMAP_NEAREST ||
            this.params.minFilter === gl.LINEAR_MIPMAP_NEAREST ||
            this.params.minFilter === gl.NEAREST_MIPMAP_LINEAR) {
            gl.generateMipmap(this.params.target);
        }
        gl.bindTexture(this.params.target, null);
    },
};

Texture.getUnsignedTexImage = function(textureID) {
    /*var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureList[textureID].texture, 0);
    */
    // Read the contents of the framebuffer (data stores the pixel data)
    if( !textureList[textureID].data ){
        textureList[textureID].data = new Uint8Array(textureList[textureID].width * textureList[textureID].height * 4);
    }
    gl.readPixels(0, 0, textureList[textureID].width, textureList[textureID].height, gl.RGBA, gl.UNSIGNED_BYTE, textureList[textureID].data);

    //gl.deleteFramebuffer(framebuffer);
};

Texture.getFloatTexImage = function(textureID) {
    // Read the contents of the framebuffer (data stores the pixel data)
    var width = textureList[textureID].width;
    var height = textureList[textureID].height;
    var format = textureList[textureID].params.sourceFormat;
    var sourceType = textureList[textureID].params.type;
    if( textureList[textureID].data ){
        textureList[textureID].data = [];
    }
    if( !textureList[textureID].pixels ) {
        textureList[textureID].pixels = new Uint8Array(width * height * 4);
    }
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, textureList[textureID].pixels);
    textureList[textureID].data = new Float32Array(textureList[textureID].pixels.buffer);

    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 512, 512, 0, gl.LUMINANCE, gl.FLOAT, textureList[textureID].data );
    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, sourceType, textureList[textureID].data );
}

function TextureParams() {
    this.target = gl.TEXTURE_2D;
    this.warpS = gl.CLAMP_TO_EDGE;
    this.warpT = gl.CLAMP_TO_EDGE;
    this.magFilter = gl.LINEAR;
    this.minFilter = gl.LINEAR;
    this.sourceFormat = gl.RGB;
    this.internalFormat = gl.RGB;
    this.type = gl.UNSIGNED_BYTE;
    this.anisotropyDegree = 0;
}

// Test drawing RGB texture 
function drawRGBTexture(width, height, textureID) {
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    texShader = new ShaderResource();
    texShader.initShaders("textureShader", texVertexShader, texFragmentShader);
    texShader.UseProgram();

    var positionLocation;
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         -1, -1, 1, -1, -1, 1,
         -1,  1, 1, -1,  1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    buffer.itemSize = 2;
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    texShader.setAttributes( buffer, "a_position", gl.FLOAT);
    texShader.setUniform("channel", 0.0);
    var resolutionLocation = gl.getUniformLocation(texShader.shaderProgram, "u_resolution");
    gl.uniform2f(resolutionLocation, width, height);
    
    gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 512, 512, 0, gl.LUMINANCE, gl.FLOAT, pixels );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

// Test drawing RGBA texture which format is gl.FLOAT 
// call rgbaTexFragmentShader to set alpha = 1.0 and show this texture.
function drawRGBATexture(width, height, textureID) {
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    texShader = new ShaderResource();
    texShader.initShaders("textureShader", texVertexShader, rgbaTexFragmentShader);
    texShader.UseProgram();

    var positionLocation;
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         -1, -1, 1, -1, -1, 1,
         -1,  1, 1, -1,  1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    buffer.itemSize = 2;
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    texShader.setAttributes( buffer, "a_position", gl.FLOAT);
    texShader.setUniform("channel", 0.0);
    var resolutionLocation = gl.getUniformLocation(texShader.shaderProgram, "u_resolution");
    gl.uniform2f(resolutionLocation, width, height);
    
    gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 512, 512, 0, gl.LUMINANCE, gl.FLOAT, pixels );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindTexture(gl.TEXTURE_2D, null);
}