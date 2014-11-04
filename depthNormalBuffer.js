function ndepthNormalBuffer() {
    this._width = 0;
    this._height = 0;
    this._blockerBufferWidth = 0;
    this._blockerBufferHeight = 0;
    this._nearFarPlane = [0.0, 0.0];
    this._depthNormal;
    this._depthBuffer;
    this._blockerDepthNormal;
    this.depthNormalShader;
    this.resampleShader;

    this._invProj = [0.0, 0.0];
    this._fromViewtoGrid = [];

    this._params = [];
}

ndepthNormalBuffer.prototype = {
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
        this.depthNormalShader = new ShaderResource();
        this.depthNormalShader.initShaders("depthNormalShader", depthNormalVertexShader, depthNormalFragmentShader);
        shaderList.push(this.depthNormalShader);

        this.resampleShader = new ShaderResource();
        this.resampleShader.initShaders("resampleShader", resampleVertexShader, resampleFragmentShader);
        shaderList.push(this.resampleShader);
    },
    getBlockerBufferWidth: function() {
        return this._blockerBufferWidth;
    },
    getBlockerBufferHeight: function() {
        return this._blockerBufferHeight;
    },
    getNearFarPlane: function() {
        return this._nearFarPlane;
    },
    getInvProj: function() {
        return this._invProj;
    },
    getViewtoGridMatirx: function() {
        return this._fromViewtoGrid;
    },
    begin: function(viewMatrix, projMatrix, light) {
        // set shader
        var shader = this.depthNormalShader;
        shader.UseProgram();
        shader.setMatrixUniforms("projection_matrix", projMatrix);
        shader.setMatrixUniforms("view_matrix",viewMatrix);

        shader.setUniform2f("near_far_plane", this._nearFarPlane);

        this._invProj[0] = 1.0 / mat4.getXAxis(projMatrix)[0];
        this._invProj[1] = 1.0 / mat4.getYAxis(projMatrix)[1];

        var toWorld = mat4.create();
        mat4.inverse(viewMatrix, toWorld);

        var gridSpaceRotation = light.getGridSpaceRotation();
        mat4.multiply(gridSpaceRotation, toWorld, this._fromViewtoGrid);

        positionBuffer = bufferList[0]._buffer;
        shader.setAttributes(positionBuffer, "position", gl.FLOAT);
        shader.setAttributes(vertexNormalBuffer, "normal", gl.FLOAT);

        gl.viewport(0, 0, this._width, this._height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    draw: function() {
        // draw test_model object
        // needs model position and normal buffer.
        gl.bindTexture(gl.TEXTURE_2D, textureList[4].texture);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[4].params.internalFormat, 0, 0, this._width, this._height, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    },
    resample: function() {
        // dawnsapmle
        // dawnsample depthNormal buffer, this resulting is used to create blocking potentials in view space.
        gl.depthMask(false);
        gl.disable(gl.DEPTH_TEST);

        var shader = this.resampleShader;
        shader.UseProgram();
        /*shader.setUniformSampler("texture", textureList[4].texture);
        shader.activeSampler(textureList[4].texture, 0);*/
        shader.setUniformSampler("texture", 4);
        shader.activeSampler(textureList[4].texture, 4);

        var positionBuffer = this.getScreenPositionBuffer();
        shader.setAttributes(positionBuffer, "position", gl.FLOAT);

        gl.viewport(0, 0, this._blockerBufferWidth, this._blockerBufferHeight);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // draw full screen resample texture
        this.drawResampleTexture();
    },
    getScreenPositionBuffer: function() {
        var positionBuffer;
        for(var i = 0; i < bufferList.length; i++) {
            if(bufferList[i]._name === "fullScreen") {
                positionBuffer = bufferList[i]._buffer;
            }
        }

        if(!positionBuffer) {
            var posArray = [];
            posArray.push( 1.0, -1.0, 0.0);
            posArray.push( 1.0,  1.0, 0.0);
            posArray.push(-1.0,  1.0, 0.0);

            posArray.push( 1.0, -1.0, 0.0);
            posArray.push(-1.0,  1.0, 0.0);
            posArray.push(-1.0, -1.0, 0.0);
            
            var vbuffer = new nbuffer();
            vbuffer.create("fullScreen", posArray, 3);
            bufferList.push(vbuffer);
            positionBuffer = vbuffer._buffer;
        }
        return positionBuffer;
    },
    drawResampleTexture: function(){
        gl.drawArrays(gl.TRIANGLES, 0, bufferList[3]._buffer.numItems);

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindTexture(gl.TEXTURE_2D, textureList[5].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[5].params.internalFormat, 0, 0, this._blockerBufferWidth, this._blockerBufferHeight, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
    }
};