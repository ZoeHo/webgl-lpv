// grid for light propagation volume
// grid space is for direction light establish
function injectData() {
	this.width;
	this.height;
	this.lightDir = [];
	this.gridSize = [];
	this.cellSize = [];
	this.pointWeight;
	this.numVpls;
	this.vpl = [];

	this.rsmNormalx;
	this.rsmNormaly;
	this.rsmColor;
	this.rsmDepth;
}

function propagateData() {
	this.blocking;
	this.gridDepth;
	this.invGridSize = [];
	this.halfTexelSize;

	this.coeffsRed;
	this.coeffsGreen;
	this.coeffsBlue;
	this.geometryVolumeTexture;
	this.projGridtoGv = [];

	this.primcount;
	this.slices = [];
}

function ngrid() {
	this._iterations = 0;
	this._useGeomVolume = true;

	this._params = new TextureParams();
	this._params.magFilter = gl.NEAREST;
	this._params.minFilter = gl.NEAREST;
	this._params.internalFormat = gl.RGBA;
	this._params.sourceFormat = gl.RGBA;
	this._params.type = gl.FLOAT;

	this.sourceGrid = 0;
	this.destGrid = 1;
	this.lightVolume = 2;
	this.gridtoShow = 0;

	this._dimx = 0.0;
	this._dimy = 0.0;
	this._dimz = 0.0;

	this.cellSize = [];
	this.gridOrigin = [];

	this.vpl = [];
	this.lightIntensityRed = [];
	this.lightIntensityGreen = [];
	this.lightIntensityBlue = [];
	this.slices = [];
	this._light = [];

	this.propagationNoBlockShader;
	this.accumulateShader;
	this.propagationShader;
	this.injectVplShader;

	this.injectVplPosBuffer;
	this.propagatePosBuffer;

	this.lightFramebuffer;

	this.geometryTexture;
	this.intensityTex;

	this.injectRedTex;
	this.injectGreenTex;
	this.injectBlueTex;
}

ngrid.prototype = {
	// clear up grid texture & vertex buffer
	cleanup: function() {
		this.vpl = [];
		this.lightIntensityRed = [];
		this.lightIntensityGreen = [];
		this.lightIntensityBlue = [];
		this.slices = [];

		this.propagationNoBlockShader = [];
		this.accumulateShader = [];
		this.propagationShader = [];
		this.injectVplShader = [];

		this.intensityTex = [];
	},
	create: function(boundingbox, dimx, dimy, dimz, rsmWidth, rsmHeight, light) {
		this.cleanup();

		// light volume dimension
		this._dimx = dimx;
		this._dimy = dimy;
		this._dimz = dimz;

		// boundingbox of scene / dim = cell size
		this.cellSize = boundingbox.calculateDim();
		this.cellSize[0] /= dimx;
		this.cellSize[1] /= dimy;
		this.cellSize[2] /= dimz;
		
		this.gridOrigin = boundingbox.getMin();
		
		// 4 shader
		// propagate shader : propagate light
		// propagate no blocking : propagate without blocking (propagate first iteration)
		// accumulate : accumulate result of each propagate iteration
		// inject : inject vpl into light volume by sampling RSM
		this.createShader();
		this.createInstanceIDBuffer();

		this.createGridTexture();
		this.createSlices();
		this.createVpls(rsmWidth, rsmHeight);

		this.lightFramebuffer = gl.createFramebuffer();

		this._light = light;
	},
	// propagate iterations
	setIterations: function(iterations) {
		this._iterations = iterations;
	},
	setUseGeometryVolume: function(useGeomVolume) {
		this._useGeomVolume = useGeomVolume;
	},
	createShader: function() {
		// inject vpls shader
		this.injectVplShader = new ShaderResource();
		this.injectVplShader.initShaders("injectVplShader", injectVplVertexShader, injectVplFragmentShader);
		shaderList.push(this.injectVplShader);

		// propagate without blocking, define no-blocking
		this.propagationNoBlockShader = new ShaderResource();
		var propagateNoBlockingShader = "#define NO_BLOCKING\n";
		propagateNoBlockingShader = propagateNoBlockingShader.concat(propagateFragmentShader);
		this.propagationNoBlockShader.initShaders("propagateNoBlockingShader", propagateVertexShader, propagateNoBlockingShader); 
		shaderList.push(this.propagationNoBlockShader);

		// propagate with blocking
		this.propagationShader = new ShaderResource();
		this.propagationShader.initShaders("propagateShader", propagateVertexShader, propagateFragmentShader);
		shaderList.push(this.propagationShader);
		
		// accumulate all iterations
		this.accumulateShader = new ShaderResource();
		this.accumulateShader.initShaders("accumulateShader", accumulateVertexShader, accumulateFragmentShader);
		shaderList.push(this.accumulateShader);
	},
	createInstanceIDBuffer: function() {
		// inject vpls
		var bufferSize = rsm.getWidth() * rsm.getHeight();
		var posArray = [];
		for(var i = 0; i < bufferSize; i++) {
			posArray.push(i);
		}
		var vbuffer = new nbuffer();
		vbuffer.create("injectVpls", posArray, 1);
		this.injectVplPosBuffer = vbuffer;

		// propagate
		/*var posArray2 = [
			-1, -1, 1, -1, -1, 1,
         	-1,  1, 1, -1,  1, 1 ];
		var vbuffer2 = new nbuffer();
		vbuffer2.create("propagatePos", posArray2, 2);
		this.propagatePosBuffer = vbuffer2;*/
	},
	createGridTexture: function() {
		this._params.internalFormat = gl.RGBA;
		this._params.sourceFormat = gl.RGBA;

		this.createIntensityTex("lightIntensityRed");
		this.createIntensityTex("lightIntensityGreen");
		this.createIntensityTex("lightIntensityBlue");
	},
	// one light intensity texture has 4 channel - RGBA,
	// texture internal format is gl.LUMINANCE
	createIntensityTex: function(texName) {
		/*for(var i = 0; i < 4; i++) {
			var name = texName;
			var channel = i;
			name = name.concat(channel);
			
			var texImage = new Texture(name, this._params, this._dimx * this._dimz, this._dimy);
			sourceTex.push(texImage);
		}
		textureList.push(sourceTex);*/
		/*var texImage = new Texture(texName, this._params, this._dimx*this._dimz, this._dimy);
		textureList.push(texImage);*/
		for(var i = 0; i <3; i++) {
			var name = texName;
			var channel = i;
			name = name.concat(channel);
			
			var texImage = new Texture(name, this._params, this._dimx * this._dimz, this._dimy);
			textureList.push(texImage);
		}
	},
	createInjectTexture: function() {
		if(textureList.length === 20) {
			this.injectRedTex = new Texture("injectVplsRed", this._params, this._dimx * this._dimz, this._dimy);
			textureList.push(this.injectRedTex);

			this.injectGreenTex = new Texture("injectVplsGreen", this._params, this._dimx * this._dimz, this._dimy);
			textureList.push(this.injectGreenTex);

			this.injectBlueTex = new Texture("injectVplsBlue", this._params, this._dimx * this._dimz, this._dimy);
			textureList.push(this.injectBlueTex);
		}
	},
	// create two vertex buffer - slices & vpls
	createSlices: function() {
		var posArray = [];
		posArray.push(0.0, 0.0);
		posArray.push(1.0, 0.0);
		posArray.push(0.0, 1.0);

		posArray.push(1.0, 0.0);
		posArray.push(1.0, 1.0);
		posArray.push(0.0, 1.0);
		
		var vbuffer = new nbuffer();
		vbuffer.create("slices", posArray, 2);
		this.slices = vbuffer;
		bufferList.push(vbuffer);
	},
	createVpls:function(rsmWidth, rsmHeight) {
		var posArray = [];
		posArray.push(0.0, 0.0);
		var vbuffer = new nbuffer();
		vbuffer.create("vplBuffer", posArray, 2);
		this.vpl = vbuffer;
		bufferList.push(vbuffer);
	},
	createGeometryVolume: function(geometryVolume) {
		geometryVolume.create(this.cellSize, this._dimx + 1, this._dimy + 1, this._dimz + 1);
	},
	inject: function(geometryVolume, depthNormalBuffer) {
		// create blocking potentials from depth normal buffer
		geometryVolume.injectBlocker2(depthNormalBuffer, this.vpl);
	},
	inject2: function(geometryVolume, rsm) {
		// create blocking potentials from RSM depth & normal
		geometryVolume.injectBlocker(rsm, this.vpl);
	},
	selectGrid: function(geometryVolume) {
		// select blocking potentials from gv texture 0 & 1
		geometryVolume.selectBlockers(this.slices);
	},
	injectVpls: function(rsm, geometryVolume) {
		this.createInjectTexture();
		// inject & propagate light
		this.injectVplsLightChannel(rsm, geometryVolume, 0, 8);
		this.injectVplsLightChannel(rsm, geometryVolume, 1, 11);
		this.injectVplsLightChannel(rsm, geometryVolume, 2, 14);
		/*this.injectVplsLightChannel(rsm, geometryVolume, 0, 20);
		this.injectVplsLightChannel(rsm, geometryVolume, 1, 21);
		this.injectVplsLightChannel(rsm, geometryVolume, 2, 22);*/
	},
	injectVplsLightChannel: function(rsm, geometryVolume, channel, textureID) {
		// use channel ID to separate RGB three light intensity texture
		// 0 [red], 1 [green], 2 [blue]
		var shader = this.injectVplShader;

		// set shader
		shader.UseProgram();
		shader.setUniform("width", rsm.getWidth());
		shader.setUniform("height", rsm.getHeight());

		shader.setUniform3f("light_dir", this._light.getLightDirinGridSpace());
		shader.setUniform3f("light_direction", this._light.getLightDirinGridSpace());
		var gridSize = this._light.getGridbox().calculateDim();
		shader.setUniform2f("grid_size", [gridSize[0], gridSize[1]]);

		var cellSize = [gridSize[0] / this._dimx, gridSize[1] / this._dimy, gridSize[2] / this._dimz];
		shader.setUniform3f("cell_size", cellSize);

		// set sampler from RSM
		shader.setUniformSampler("normalx_tex", 0);
		shader.activeSampler(textureList[0].texture, 0);
		shader.setUniformSampler("normaly_tex", 1);
		shader.activeSampler(textureList[1].texture, 1);

		shader.setUniformSampler("color_tex", 2);
		shader.activeSampler(textureList[2].texture, 2);
		shader.setUniformSampler("depth_tex", 3);
		shader.activeSampler(textureList[3].texture, 3);

		var tcells = this._dimx * this._dimy;
		var t = rsm.getWidth() * rsm.getHeight();
		var pointWeight = tcells / t;
		shader.setUniform("point_weight", pointWeight);

		// set attribute: position buffer
		shader.setAttributes(this.injectVplPosBuffer._buffer, "instanceID", gl.FLOAT);
		shader.setUniform("dimSize", this._dimx);
		shader.setUniform("channel", channel);
		var numVpls = rsm.getWidth() * rsm.getHeight();

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, this._dimx * this._dimz, this._dimy);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE);

		// using framebuffer to get shader result. 
		shader.bindTexToFramebuffer(this.lightFramebuffer, textureList[textureID].texture);
		
		// sample data from geometry buffer and inject blocking potentials
		gl.drawArrays(gl.POINTS, 0, numVpls);

		// light intensity red 0
		/*gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[textureID].params.internalFormat, 0, 0, 16*16, 16, 0);//this.dimx*this.dimz, this.dimy
        gl.bindTexture(gl.TEXTURE_2D, null);*/
        shader.unbindFramebuffer();

		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
		shader.unbindSampler();
	},
	propagateAccumulateVpls: function(geometryVolume) {
		// after inject virtual point light, propagate vpls and acumulate them
		this.gridtoShow = this.sourceGrid;

		if(this._iterations) {
			// propagate start
			this.propagateAccumulate(geometryVolume.gvTexture2);

			// needs to do ....gridtoShow , lightVolume swap
			this.gridtoShow = this.lightVolume;
		}
	},
	propagateAccumulate: function(gvTexture) {
		// test data
		/*var redpixels = new Float32Array(256*16*4);
		var value = 1.0 / (16.0*16.0*16.0*4.0);
		for(var i = 0; i < 256*16*4; i+=4) {
			redpixels[i] = inR[i];//initR[i];
			redpixels[i+1] = inR[i+1];//initR[i+1];
			redpixels[i+2] = inR[i+2];//initR[i+2];
			redpixels[i+3] = inR[i+3];//initR[i+3];
		}
		gl.bindTexture(gl.TEXTURE_2D, textureList[8].texture);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 16, 0, gl.RGBA, gl.FLOAT, redpixels );
    	gl.bindTexture(gl.TEXTURE_2D, null);

    	var greenpixels = new Float32Array(256*16*4);
		for(var i = 0; i < 256*16*4; i+=4) {
			greenpixels[i] = initG[i];
			greenpixels[i+1] = initG[i+1];
			greenpixels[i+2] = initG[i+2];
			greenpixels[i+3] = initG[i+3];
		}
		gl.bindTexture(gl.TEXTURE_2D, textureList[11].texture);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 16, 0, gl.RGBA, gl.FLOAT, greenpixels );
    	gl.bindTexture(gl.TEXTURE_2D, null);

    	var bluepixels = new Float32Array(256*16*4);
		for(var i = 0; i < 256*16*4; i+=4) {
			bluepixels[i] = initB[i];
			bluepixels[i+1] = initB[i+1];
			bluepixels[i+2] = initB[i+2];
			bluepixels[i+3] = initB[i+3];
		}
		gl.bindTexture(gl.TEXTURE_2D, textureList[14].texture);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 16, 0, gl.RGBA, gl.FLOAT, bluepixels );
    	gl.bindTexture(gl.TEXTURE_2D, null);
    	
    	var gvpixels = new Float32Array(17*17*17*4);
		for(var i = 0; i < 17*17*17*4; i+=4) {
			gvpixels[i] = h[i];
			gvpixels[i+1] = h[i+1];
			gvpixels[i+2] = h[i+2];
			gvpixels[i+3] = h[i+3];
		}
		gl.bindTexture(gl.TEXTURE_2D, textureList[19].texture);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 17*17, 17, 0, gl.RGBA, gl.FLOAT, gvpixels );
    	gl.bindTexture(gl.TEXTURE_2D, null);
    	// test data*/

		// propagate and accumulate result of each propagation step
		// first vpl propagate, stage 0 propagate: source = intensity 0, destination = intensity 1
		this.propagate(gvTexture, true);
		// first accumulate vpls
		this.accumulate(this.destGrid, this.sourceGrid);
		
		var temp = this.lightVolume;
		this.lightVolume = this.sourceGrid;
		this.sourceGrid = this.destGrid;
		this.destGrid = temp;
		
		for(var iteration = 1; iteration < this._iterations; iteration++) {
			this.propagate(gvTexture, false);
			this.accumulate(this.destGrid, this.lightVolume);
			// need to swap source & dest
			// swap(a,b):  b = [a, a=b][0];
			this.destGrid = [this.sourceGrid, this.sourceGrid = this.destGrid][0];
		}

		// reset source & dest
		this.sourceGrid = 0;
		this.destGrid = 1;
		this.lightVolume = 2;
	},
	propagate: function(gvTexture, firstIteration) {
		// first iteration : propagate without blocking potentials
		// blocking potentials to avoid self shadowing
		this.propagateLightChannel(gvTexture, firstIteration, 0, 8+this.destGrid);
		this.propagateLightChannel(gvTexture, firstIteration, 1, 11+this.destGrid);
		this.propagateLightChannel(gvTexture, firstIteration, 2, 14+this.destGrid);		
	},
	propagateLightChannel: function(gvTexture, firstIteration, channel, textureID) {
		var shader = (!this._useGeomVolume || firstIteration) ? this.propagationNoBlockShader : this.propagationShader;
		// set shader
		shader.UseProgram();

		shader.setUniform("grid_depth", this._dimz);
		var invGridSize = [1.0 / this._dimx, 1.0 / this._dimy, 1.0 / this._dimz];
		shader.setUniform3f("inv_grid_size", invGridSize);
		shader.setUniform("half_texel_size", invGridSize[2] * 0.5);
		shader.setUniform("halfDimSize", invGridSize[2] * 0.5);

		// bind light volume textures - store light intensities
		shader.setUniformSampler("coeffs_red", 0);
		shader.activeSampler(textureList[(8+this.sourceGrid)].texture, 0);
		
		shader.setUniformSampler("coeffs_green", 1);
		shader.activeSampler(textureList[(11+this.sourceGrid)].texture, 1);
		
		shader.setUniformSampler("coeffs_blue", 2);
		shader.activeSampler(textureList[(14+this.sourceGrid)].texture, 2);

		if(shader == this.propagationShader) {		
			// use geometry volume which prevents light from being propagated through blocking geometry
			// set sampler geometry_volume
			shader.setUniformSampler("geometry_volume", 19);
			shader.activeSampler(gvTexture.texture, 19);
			
			// set uniform proj_grid_to_gv
			var projGridtoGvx = [];
			// geometry volume dimension size = light grid volume dimension size + 1
			projGridtoGvx.push(this._dimx/(this._dimx+1), 
							   this._dimy/(this._dimy+1),
							   this._dimz/(this._dimz+1) );
			shader.setUniform3f("proj_grid_to_gvx", projGridtoGvx);

			var projGridtoGvy = [];
			projGridtoGvy.push(0.5/(this._dimx+1), 0.5/(this._dimy+1), 0.5/(this._dimz+1));
			shader.setUniform3f("proj_grid_to_gvy", projGridtoGvy);
		}

		shader.setAttributes(this.slices._buffer, "position", gl.FLOAT);
		shader.setUniform("channel", channel);

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, this._dimx * this._dimz, this._dimy);

		// using framebuffer to get shader result. 
		shader.bindTexToFramebuffer(this.lightFramebuffer, textureList[textureID].texture);

		gl.drawArrays(gl.TRIANGLES, 0, this.slices._buffer.numItems);
		
		/*gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[textureID].params.internalFormat, 0, 0, 16*16, 16, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);*/

        shader.unbindFramebuffer();
		shader.unbindSampler();
	},
	accumulate: function(sourceGrid, destGrid) {
		// add vpls in each propagation step
		this.accumulateLightChannel(sourceGrid, 0, 8+destGrid);
		this.accumulateLightChannel(sourceGrid, 1, 11+destGrid);
		this.accumulateLightChannel(sourceGrid, 2, 14+destGrid);
	},
	accumulateLightChannel: function(sourceGrid, channel, textureID){
		// use channel ID to separate RGB three accumulation texture
		// 0 [red], 1 [green], 2 [blue]
		var shader = this.accumulateShader;

		// set shader
		shader.UseProgram();

		shader.setUniform("grid_depth", this._dimz);
		var invGridSize = [1.0 / this._dimx, 1.0 / this._dimy, 1.0 / this._dimz];
		shader.setUniform("half_texel_size", invGridSize[2] * 0.5);
		shader.setUniform("halfDimSize", invGridSize[2] * 0.5);

		// bind light volume textures - store light intensities
		// source sampler
		shader.setUniformSampler("spectral_coeffs_r", (8+sourceGrid));
		shader.activeSampler(textureList[(8+sourceGrid)].texture, (8+sourceGrid));

		shader.setUniformSampler("spectral_coeffs_g", (11+sourceGrid));
		shader.activeSampler(textureList[(11+sourceGrid)].texture, (11+sourceGrid));
		
		shader.setUniformSampler("spectral_coeffs_b", (14+sourceGrid));
		shader.activeSampler(textureList[(14+sourceGrid)].texture, (14+sourceGrid));

		// set attribute - slices
		shader.setAttributes(this.slices._buffer, "position", gl.FLOAT);
		shader.setUniform("channel", channel);

		// add vpls into light volume
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, this._dimx * this._dimz, this._dimy);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE);

		// using framebuffer to get shader result. 
		shader.bindTexToFramebufferForAdd(this.lightFramebuffer, textureList[textureID].texture);

		gl.drawArrays(gl.TRIANGLES, 0, this.slices._buffer.numItems);

		/*gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[textureID].params.internalFormat, 0, 0, 16*16, 16, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);*/
        shader.unbindFramebuffer();
        
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
        shader.unbindSampler();
	},
	bindLightVolumeTexture: function() {
		// change incoming light volume texture minFilter/magFilter to linear
		var magFilter = gl.LINEAR;
		var minFilter = gl.LINEAR;

		// create texture and its texture parameter
		gl.activeTexture(gl.TEXTURE0 + 8);
    	gl.bindTexture(gl.TEXTURE_2D, textureList[8].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, minFilter);

		gl.activeTexture(gl.TEXTURE0 + 11);
    	gl.bindTexture(gl.TEXTURE_2D, textureList[11].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, minFilter);
		
		gl.activeTexture(gl.TEXTURE0 + 14);
    	gl.bindTexture(gl.TEXTURE_2D, textureList[14].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, minFilter);
	},
	unbindLightVolumeTexture: function() {
		// change incoming light volume texture minFilter/magFilter back to nearest
		var magFilter = gl.NEAREST;
		var minFilter = gl.NEAREST;		
	
		gl.bindTexture(gl.TEXTURE_2D, textureList[8].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, minFilter);

    	gl.bindTexture(gl.TEXTURE_2D, textureList[11].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, minFilter);
		
    	gl.bindTexture(gl.TEXTURE_2D, textureList[14].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, minFilter);
	}
};