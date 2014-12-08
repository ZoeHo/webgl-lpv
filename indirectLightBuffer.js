//indirect light
function nIndirectLightBuffer() {
    this._width = 0;
    this._height = 0;

    this._lightBuffer;
    this._blurBuffer;
    this._depthBuffer;
    this._params = [];
    this._dampen = true;

    this.indirectLightShader;
    this.indirectLightDampenShader;
    this.blurShader;
}

nIndirectLightBuffer.prototype = {
    create: function(width, height) {
        this._width = width;
        this._height = height;

        // create indirect light buffer texture
        this._params = new TextureParams();
        this._params.magFilter = gl.LINEAR;
        this._params.minFilter = gl.LINEAR;
        this._params.internalFormat = gl.RGBA;
        this._params.sourceFormat = gl.RGBA;

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
        this.indirectLightShader = new ShaderResource();
        this.indirectLightShader.initShaders("indirectLightShader", indirectLightVertexShader, indirectLightFragmentShader);
        shaderList.push( this.indirectLightShader );

        // second indirect light shader , define dampen
        this.indirectLightDampenShader = new ShaderResource();
        var indirectDampenLShader = "#define DAMPEN\n";
        indirectDampenLShader = indirectDampenLShader.concat( indirectLightFragmentShader );
        this.indirectLightDampenShader.initShaders( "indirectDampenLShader", indirectLightVertexShader, indirectDampenLShader );
        shaderList.push( this.indirectLightDampenShader );

        this.blurShader = new ShaderResource();
        this.blurShader.initShaders( "blurShader", blurVertexShader, blurFragmentShader );
        shaderList.push(this.blurShader);
    },
    setDampen: function(dampen) {
        this._dampen = dampen;
    },
    selectShader: function() {
        var shader = this.indirectLightDampenShader;
        if(!this._dampen) {
            shader = this.indirectLightShader;
        }

        return shader;
    },
    begin: function(viewMatrix, projMatrix, light, lightTextureDim) {
        // set indirect light shader
        var shader = this.selectShader();
        
        gl.viewport(0, 0, this._width, this._height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        shader.UseProgram();
        shader.setMatrixUniforms("projection_matrix", projMatrix);
        shader.setMatrixUniforms("view_matrix",viewMatrix);

        var gridSpaceRotation = light.getGridSpaceRotation();
        shader.setMatrixUniforms("grid_space_matrix", gridSpaceRotation);
        
        var gridSize = light.getGridbox().calculateDim();
        var invGridSize = [1.0 / gridSize[0], 1.0 / gridSize[1], 1.0 / gridSize[2]];
        shader.setUniform3f("inv_grid_size", invGridSize);
        
        if(this._dampen) {
            var offsetAlongNormal = [1.0 / lightTextureDim[0], 1.0 / lightTextureDim[1], 1.0 / lightTextureDim[2]];
            offsetAlongNormal = [offsetAlongNormal[0] * 0.866, 
                                 offsetAlongNormal[1] * 0.866,
                                 offsetAlongNormal[2] * 0.866];
            shader.setUniform3f("offset_along_normal", offsetAlongNormal);
        }
        
        shader.setUniform3f("grid_origin", light.getGridbox().getMin());
        
        shader.setUniformSampler("incoming_red", 8);
        shader.setUniformSampler("incoming_green", 9);
        shader.setUniformSampler("incoming_blue", 10);
    },
    draw: function() {
        var shader = this.selectShader();
        var positionBuffer = bufferList[0]._buffer;
        shader.setAttributes(positionBuffer, "position", gl.FLOAT);
        shader.setAttributes(vertexNormalBuffer, "normal", gl.FLOAT);

        gl.drawArrays(gl.TRIANGLES, 0, positionBuffer.numItems);

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindTexture(gl.TEXTURE_2D, textureList[6].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[6].params.internalFormat, 0, 0, this._width, this._height, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    },
    blur: function(depthNormalBuffer, lightTextureDim, light) {
        this.blurPassBegin(depthNormalBuffer);
        
        var shader = this.blurShader;
        // active depth normal texture
        shader.activeSampler(textureList[4].texture, 4);
        // vertical blur pass, source: active indirect light buffer texture, target = blur texture
        shader.activeSampler(textureList[6].texture, 6);

        var invProj = depthNormalBuffer.getInvProj();

        this.indirectLightBufferBlur(lightTextureDim, light, [1.0 / invProj[0], 1.0 / invProj[1]], true);
        // draw fullscreen quad
        this.drawBlurPass(7);

        // horizontal blur pass : active blur texture, target texture = indirect light buffer texture
        shader.setUniformSampler("indirect_light_tex", 7);
        shader.activeSampler(textureList[7].texture, 7);
        this.indirectLightBufferBlur(lightTextureDim, light, [1.0 / invProj[0], 1.0 / invProj[1]], false);
        // draw fullscreen quad
        this.drawBlurPass(6);
        this.blurPassEnd();
    },
    blurPassBegin: function(depthNormalBuffer) {
        // set blur shader to blur indirect light buffer
        var shader = this.blurShader;

        gl.depthMask(false);
        gl.disable(gl.DEPTH_TEST);
        gl.viewport(0, 0, this._width, this._height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        shader.UseProgram();
        shader.setUniformSampler("indirect_light_tex", 6);
        shader.setUniformSampler("depth_normal_tex", 4);

        shader.setUniform2f("near_far_plane", depthNormalBuffer.getNearFarPlane());
        shader.setUniform2f("inv_proj", depthNormalBuffer.getInvProj());
    },
    indirectLightBufferBlur: function(lightTextureDim, light, proj, vertical) {
        // blur indirect light buffer
        var shader = this.blurShader;

        var bbox = light.getGridbox();
        // grid size
        var bboxSize = bbox.calculateDim();
        
        var cellSize = bboxSize[0] / lightTextureDim[0];
        var cellSizeScale = 0.5;
        var dist = cellSize * cellSizeScale * 0.5;    
        
        var distThreashold = cellSize * cellSize * 3.0;
        shader.setUniform4f("dist_threashold", [distThreashold, distThreashold, distThreashold, distThreashold]);
        
        var gridtoTextureScale = [];
        if(!vertical) {
            gridtoTextureScale[0] = dist * proj[0] / 2.0;
            gridtoTextureScale[1] = 0.0;
        } else {
            gridtoTextureScale[0] = 0.0;
            gridtoTextureScale[1] = dist * proj[1] / 2.0;
        }
        shader.setUniform2f("grid_to_texture_scale", gridtoTextureScale);
        
        positionBuffer = bufferList[3]._buffer;
        shader.setAttributes(positionBuffer, "position", gl.FLOAT);
    },
    drawBlurPass: function(textureID) {
        gl.drawArrays(gl.TRIANGLES, 0, bufferList[3]._buffer.numItems);

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[textureID].params.internalFormat, 0, 0, this._width, this._height, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    },
    blurPassEnd: function() {
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
    }
};