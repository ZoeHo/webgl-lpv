// geometry volume
// geometry volume composite of three parts,
// first geometry volume generaterd from RSM,
// second geometry volume generaterd from geometry buffer
// third geometry volume is selected from two of them.

function blockerData() {
	this.blockerTex;
	this.width;
	this.height;
	this.nearFarPlane = [];
	this.invProj = [];
	this.viewtoGridMatrix = mat4.create();
	this.gridOrig = [];
	this.gridSize = [];
	this.cellArea;
	this.vpl = [];
	this.numVpls;
};

function rsmBlockerData() {
	this.rsmDepth;
	this.rsmNormalx;
	this.rsmNormaly;
	this.width;
	this.height;
	this.cellSizez;
	this.projRsmtogvGrid = [0, 0, 0, 0];
	this.pointWeight;
	this.vpl = [];
	this.numVpls;
}

function selectBlockerData() {
	this.rsmTex;
	this.surfaceTex;
	this.gridDepth;
	this.halfTexelSize;
	this.primcount;
	this.slices;
}

function ngeometryVolume() {
	this._dimx = 0.0;
	this._dimy = 0.0;
	this._dimz = 0.0;

	this._cellSize = [];
	this._bbox = new Boundingbox();

	this.injectBlockerShader;
	this.injectBlocker2Shader;
	this.selectGvShader;

	this.gvTexture0 = [];
	this.gvTexture1 = [];
	this.gvTexture2 = [];
	this._params = new TextureParams();

	this.injectInstanceIDbuffer;
	this.inject2InstanceIDbuffer;
	this.selectGvPosBuffer;

	this.texPos =[];
}

ngeometryVolume.prototype = {
	// create gv_texture0
	create: function(cellSize, dimx, dimy, dimz) {
		// dimension of 3D grid to store blocking potentials of scene's geomstry
		this._dimx = dimx;
		this._dimy = dimy;
		this._dimz = dimz;

		this._cellSize = cellSize;
		var maxV = [this._cellSize[0] * this._dimx * 0.5, 
					this._cellSize[1] * this._dimy * 0.5,
					this._cellSize[2] * this._dimz * 0.5];
		var minV = [(-1) * maxV[0], (-1) * maxV[1], (-1) * maxV[2]];

		// bounding box
		this._bbox.maxV = maxV;
		this._bbox.minV = minV;

		this.createGvTexture("gvTexture0", this.gvTexture0);
		this.createGvTexture("gvTexture1", this.gvTexture1);
		this.createGvTexture("gvTexture2", this.gvTexture2);
		// create inject shader & select shader
		this.createShader();
		this.createInstanceIDBuffer();
		/*this.gvTexture0 = new Float32Array(this._dimx* this._dimy * this._dimz * 4);
		this.gvTexture1 = new Float32Array(this._dimx* this._dimy * this._dimz * 4);
		this.gvTexture2 = new Float32Array(this._dimx* this._dimy * this._dimz * 4);*/

		this.texPos = new Uint16Array(this._dimx* this._dimy * this._dimz * 4);
	},
	// one light intensity texture has 4 channel - RGBA,
	// texture internal format is gl.LUMINANCE
	createGvTexture: function(textureName, sourceTex) {
		if(textureName === "gvTexture2") {
			this._params.magFilter = gl.LINEAR;
			this._params.minFilter = gl.LINEAR;
		} else {
			this._params.magFilter = gl.NEAREST;
			this._params.minFilter = gl.NEAREST;
		}
		this._params.internalFormat = gl.RGBA;
		this._params.sourceFormat = gl.RGBA;
		this._params.type = gl.FLOAT;

		/*for(var i = 0; i < 4; i++) {
			var name = textureName;
			var channel = i;
			name = name.concat(channel);
			
			var texImage = new Texture(name, this._params, this._dimx * this._dimz, this._dimy);
			sourceTex.push(texImage);
		}*/
		var texImage = new Texture(textureName, this._params, this._dimx * this._dimz, this._dimy);
		textureList.push(texImage);
	},
	createShader: function() {
        // inject blocker2 shader
        this.injectBlocker2Shader = new ShaderResource();
        this.injectBlocker2Shader.initShaders("injectBlocker2Shader", injectBlocker2VertexShader, injectBlocker2FragmentShader);
		shaderList.push(this.injectBlocker2Shader);

		// inject blocker shader
		this.injectBlockerShader = new ShaderResource();
		this.injectBlockerShader.initShaders("injectBlockerShader", injectBlockerVertexShader, injectBlockerFragmentShader);
		shaderList.push(this.injectBlockerShader);

		// selectGv shader
		this.selectGvShader = new ShaderResource();
		this.selectGvShader.initShaders("selectGvShader", selectGvVertexShader, selectGvFragmentShader);
		shaderList.push(this.selectGvShader);
	},
	createInstanceIDBuffer: function() {
		// inject blocker2
		var bufferSize = depthNormalBuffer.getBlockerBufferWidth() * depthNormalBuffer.getBlockerBufferHeight();
		var posArray = [];

		for(var i = 0; i < bufferSize; i++) {
			posArray.push(i);
		}
		var vbuffer = new nbuffer();
		vbuffer.create("injectBlocker2", posArray, 1);
		this.inject2InstanceIDbuffer = vbuffer;

		// inject blocker
		bufferSize = rsm.getWidth() * rsm.getHeight();
		var posArray2 = [];
		for(var i = 0; i < bufferSize; i++) {
			posArray2.push(i);
		}
		var posbuffer = new nbuffer();
		posbuffer.create("injectBlocker", posArray2, 1);
		this.injectInstanceIDbuffer = posbuffer;

		// selectGv position buffer
		var posArray3 = [
			-1, -1, 1, -1, -1, 1,
         	-1,  1, 1, -1,  1, 1 ];
        var selectPosbuffer = new nbuffer();
        selectPosbuffer.create("selectGv", posArray3, 2);
        this.selectGvPosBuffer = selectPosbuffer;
	},
	injectBlocker2: function(depthNormalBuffer, vpls) {
		// sample view space geometry, inject blocking potentials into geometry volume
		var shader = this.injectBlocker2Shader;
		
		// set shader
		shader.UseProgram();
		// get blocker depth normal texture
		shader.setUniformSampler("depth_normal_tex", 5);
		shader.activeSampler(textureList[5].texture, 5);

		shader.setUniform("width", depthNormalBuffer.getBlockerBufferWidth());
		shader.setUniform("height", depthNormalBuffer.getBlockerBufferHeight());
		
		shader.setUniform2f("near_far_plane", depthNormalBuffer.getNearFarPlane());
		shader.setUniform2f("inv_proj", depthNormalBuffer.getInvProj());
		
		shader.setMatrixUniforms("view_to_grid_mat", depthNormalBuffer.getViewtoGridMatirx());
		shader.setUniform3f("grid_orig", this._bbox.getMin());

		var bbsize = this._bbox.calculateDim();
		// geometry volume bbox
		var gridSize = [bbsize[0], bbsize[1], this._cellSize[2]];
		shader.setUniform3f("grid_size", gridSize);
	
		var cellArea = this._cellSize[0] * this._cellSize[1];
		shader.setUniform("cell_area", cellArea);	
		shader.setUniform("dimSize", this._dimx);
		//var positionBuffer = vpls._buffer;
        //shader.setAttributes(positionBuffer, "position", gl.FLOAT);
        
        shader.setAttributes(this.inject2InstanceIDbuffer._buffer, "instanceID", gl.FLOAT);

        var numVpls = depthNormalBuffer.getBlockerBufferWidth() * depthNormalBuffer.getBlockerBufferHeight();
	
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
		gl.viewport(0, 0, this._dimx * this._dimz, this._dimy);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE);
		
		// sample data from geometry buffer and inject blocking potentials
		gl.drawArrays(gl.POINTS, 0, numVpls);
		gl.bindTexture(gl.TEXTURE_2D, null);
    	
        gl.bindTexture(gl.TEXTURE_2D, textureList[11].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[11].params.internalFormat, 0, 0, 17*17, 17, 0);//this.dimx*this.dimz, this.dimy
        gl.bindTexture(gl.TEXTURE_2D, null);

		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
		shader.unbindSampler();
	},
	injectBlocker: function(rsm, vpls) {
		// sample RSM, inject blocking potentials into geometry volume
		var shader = this.injectBlockerShader;
		
		// set shader
		shader.UseProgram();
		// get rsm depth & normal texture
		shader.setUniformSampler("depth_tex", 3);
		shader.activeSampler(textureList[3].texture, 3);

		shader.setUniformSampler("normalx_tex", 0);
		shader.activeSampler(textureList[0].texture, 0);

		shader.setUniformSampler("normaly_tex", 1);
		shader.activeSampler(textureList[1].texture, 1);

		shader.setUniform("width", rsm.getWidth());
		shader.setUniform("height", rsm.getHeight());

		shader.setUniform("cell_size_z", this._cellSize[2]);
	
		// geometry volume grid dimension = light grid dimension - 1				
		var projRsmtogvGrid = [0.0, 0.0, 0.0, 0.0];
		projRsmtogvGrid[0] = (this._dimx - 1) / (this._dimx);
		projRsmtogvGrid[1] = (this._dimy - 1) / (this._dimy);
		// texel center
		projRsmtogvGrid[2] = 0.5 / (this._dimx);
		projRsmtogvGrid[3] = 0.5 / (this._dimy);
		shader.setUniform4f("proj_rsm_to_gv_grid", projRsmtogvGrid);

		// number of cells in one slice of light grid
		var tcells = (this._dimx - 1) * (this._dimy - 1);
		var t = rsm.getWidth() * rsm.getHeight();
		var pointWeight = tcells / t;
		shader.setUniform("point_weight", pointWeight);
		shader.setUniform("dimSize", this._dimx);

		shader.setAttributes(this.injectInstanceIDbuffer._buffer, "instanceID", gl.FLOAT);

        var numVpls = rsm.getWidth() * rsm.getHeight();

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
		gl.viewport(0, 0, this._dimx * this._dimz, this._dimy);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE);

		// draw this. sample data from RSM and inject blocking potentials
		gl.drawArrays(gl.POINTS, 0, numVpls);
		gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindTexture(gl.TEXTURE_2D, textureList[12].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[12].params.internalFormat, 0, 0, 17*17, 17, 0);//this.dimx*this.dimz, this.dimy
        gl.bindTexture(gl.TEXTURE_2D, null);

		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
		shader.unbindSampler();
	},
	selectBlockers: function(slices) {
		// select blocking potentials based on magnitude
		var shader = this.selectGvShader;
		// set shader
		shader.UseProgram();

		shader.setUniformSampler("gv_from_rsm", 12);
		shader.activeSampler(textureList[12].texture, 12);

		shader.setUniformSampler("gv_from_visible_surface", 11);
		shader.activeSampler(textureList[11].texture, 11);
		
		shader.setAttributes( this.selectGvPosBuffer._buffer, "position", gl.FLOAT);
		
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
		gl.viewport(0, 0, this._dimx * this._dimz, this._dimy);

	    gl.drawArrays(gl.TRIANGLES, 0, this.selectGvPosBuffer._buffer.numItems);
	    gl.bindTexture(gl.TEXTURE_2D, null);

	    gl.bindTexture(gl.TEXTURE_2D, textureList[13].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[13].params.internalFormat, 0, 0, 17*17, 17, 0);//this.dimx*this.dimz, this.dimy
        gl.bindTexture(gl.TEXTURE_2D, null);

		shader.unbindSampler();
	}
};