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
	this.accumulationShader;
	this.propagationShader;
	this.injectVplShader;

	this.injectVplPosBuffer;

	this.geometryTexture;
	this.intensityTex;
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
		this.accumulationShader = [];
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

		// propagate without blocking
		// propagate with blocking
		// accumulate all iterations
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
	},
	createGridTexture: function() {
		this._params.internalFormat = gl.RGBA;
		this._params.sourceFormat = gl.RGBA;

		this.createIntensityTex("lightIntensityRed", this.lightIntensityRed);
		this.createIntensityTex("lightIntensityGreen", this.lightIntensityGreen);
		this.createIntensityTex("lightIntensityBlue", this.lightIntensityBlue);
	},
	// one light intensity texture has 4 channel - RGBA,
	// texture internal format is gl.LUMINANCE
	createIntensityTex: function(texName, sourceTex) {
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
		// inject & propagate light
		this.injectVplsLightChannel(rsm, geometryVolume, 0, 8);
		this.injectVplsLightChannel(rsm, geometryVolume, 1, 11);
		this.injectVplsLightChannel(rsm, geometryVolume, 2, 14);

		
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
		
		// sample data from geometry buffer and inject blocking potentials
		gl.drawArrays(gl.POINTS, 0, numVpls);

		// light intensity red 0
		gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, textureList[textureID].params.internalFormat, 0, 0, 16*16, 16, 0);//this.dimx*this.dimz, this.dimy
        gl.bindTexture(gl.TEXTURE_2D, null);

		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
		shader.unbindSampler();
	}
};