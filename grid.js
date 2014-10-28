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

function ngrid() {
	this._iterations = 0;

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
		this.createGridTexture();
		this.createSlices();
		this.createVpls(rsmWidth, rsmHeight);

		this._light = light;
	},
	// propagate iterations
	setIterations: function(iterations) {
		this._iterations = iterations;
	},
	createGridTexture: function() {
		this._params.internalFormat = gl.LUMINANCE;
		this._params.sourceFormat = gl.LUMINANCE;

		this.createSparateChannel("lightIntensityRed", this.lightIntensityRed);
		this.createSparateChannel("lightIntensityGreen", this.lightIntensityGreen);
		this.createSparateChannel("lightIntensityBlue", this.lightIntensityBlue);
	},
	// one light intensity texture has 4 channel - RGBA,
	// texture internal format is gl.LUMINANCE
	createSparateChannel: function(texName, sourceTex) {
		for(var i = 0; i < 4; i++) {
			var name = texName;
			var channel = i;
			name = name.concat(channel);
			
			var texImage = new Texture(name, this._params, this._dimx * this._dimz, this._dimy);
			sourceTex.push(texImage);
		}
		textureList.push(sourceTex);
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
		geometryVolume.selectBlockers(this.slices);
	},
	injectVpls: function(rsm) {
		var injectdata = new injectData();

		// get inject data
		injectdata.width = rsm.getWidth();
		injectdata.height = rsm.getHeight();
		injectdata.lightDir = this._light.getLightDirinGridSpace();
		injectdata.gridSize = this._light.getGridbox().calculateDim();
		injectdata.cellSize = [injectdata.gridSize[0] / this._dimx,
							   injectdata.gridSize[1] / this._dimy,
							   injectdata.gridSize[2] / this._dimz];
		injectdata.rsmNormalx = textureList[0].data;
		injectdata.rsmNormaly = textureList[1].data;
		injectdata.rsmColor = textureList[2].data;
		injectdata.rsmDepth = textureList[3].data;

		var tcells = this._dimx * this._dimy;
		var t = rsm.getWidth() * rsm.getHeight();
		injectdata.pointWeight = tcells / t;
		
		injectdata.vpl = bufferList[2]._data;
		injectdata.numVpls = rsm.getWidth() * rsm.getHeight();
		
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this._dimx, this._dimy);
		
		// inject vertex shader
		this.injectVertexShader(injectdata);
		
		/*
		// propagate & accumulate
		if( iterations ) {
			// call propagate & accumulate function
			propagate_accumulate_cpuBegin();
		}
		*/
	},
	injectVertexShader: function(shaderdata) {
		// test data
		/*var m = [];
		for(var i = 0, j = 0; i < 512*512*3; i+=3, j+=4) {
			m[j] = l[i];
			m[j+1] = l[i+1];
			m[j+2] = l[i+2];
			m[j+3] = 255;
		}
		shaderdata.rsmNormalx = d;
		shaderdata.rsmNormaly = e;
		shaderdata.rsmColor = m;
		shaderdata.rsmDepth = f;*/

		if(this.intensityTex.length < 3) {
			for(var i = 0; i < 3; i++) {
				var intensity = new Float32Array(this._dimx * this._dimy * this._dimz * 4);
				this.intensityTex.push(intensity);
			}
		} else {
			// clear all light intensity texture data
			for(var i = 0; i < this.intensityTex.length; i++) {
				for(var j = 0; j < this._dimx * this._dimy * this._dimz * 4; j++) {
					this.intensityTex[i][j] = 0.0;
				}
			}
		}

		for(var i = 0; i < shaderdata.numVpls; i++) {
			// calc position to sample RSM textures
			var pos = this.instanceIDtoPosition(i, shaderdata.width, shaderdata.height);
			pos[0] += shaderdata.vpl[0] + ( 0.5 / shaderdata.width );
			pos[1] += shaderdata.vpl[1] + ( 0.5 / shaderdata.height );	
	
			var depth = this.getRsmTexValue(shaderdata.rsmDepth, pos, shaderdata.width, shaderdata.height);	
			depth < 0.0 ? depth = 0.0 : depth = depth;
			// calculate position in the grid
			var gridSpacePos = [pos[0] * shaderdata.gridSize[0],
								pos[1] * shaderdata.gridSize[1],
								depth];
			
			// normal in grid space
			var normal = [0.0, 0.0, 0.0];
			normal[0] = this.getRsmTexValue(shaderdata.rsmNormalx, pos, shaderdata.width, shaderdata.height);
			normal[1] = this.getRsmTexValue(shaderdata.rsmNormaly, pos, shaderdata.width, shaderdata.height);
			normal[0] < -1.0 ? normal[0] = 0.0 : normal[0] = normal[0];
			normal[1] < -1.0 ? normal[1] = 0.0 : normal[1] = normal[1];
			
			var n2 = [];
			n2[0] = normal[0] * normal[0];
			n2[1] = normal[1] * normal[1];
			normal[2] = Math.sqrt(1.0 - n2[0] - n2[1]);

			// move a bit away from the surface
			gridSpacePos[0] = gridSpacePos[0] + (normal[0] + ((-1.0) * shaderdata.lightDir[0])) * 0.25 * shaderdata.cellSize[0];
			gridSpacePos[1] = gridSpacePos[1] + (normal[1] + ((-1.0) * shaderdata.lightDir[1])) * 0.25 * shaderdata.cellSize[1];
			gridSpacePos[2] = gridSpacePos[2] + (normal[2] + ((-1.0) * shaderdata.lightDir[2])) * 0.25 * shaderdata.cellSize[2];
			
			// create texture coords (0.0 - 1.0)
			gridSpacePos[0] = gridSpacePos[0] / shaderdata.gridSize[0];
			gridSpacePos[1] = gridSpacePos[1] / shaderdata.gridSize[1];
			
			// create clip space coords (-1.0 - 1.0)
			gridSpacePos[0] = gridSpacePos[0] * 2.0 - 1.0;
			gridSpacePos[1] = gridSpacePos[1] * 2.0 - 1.0;
			// layer (0, 1 ... n)
			gridSpacePos[2] = gridSpacePos[2] / this.cellSize[2];

			var texcoord = pos;
			var glPosition = gridSpacePos;

			// geometry shader here & return texture position
			glPosition = this.injectGeometryShader(glPosition);
			// fragment shader
			this.injectFragmentShader(glPosition, texcoord, normal, shaderdata);
		}
	},
	instanceIDtoPosition: function(instanceID, width, height) {
		// translate instanceID to texture position
		var pos = [];
		pos.push(instanceID % width, Math.floor(instanceID / width));
		pos = [pos[0]/width, pos[1]/height];
		return pos;
	},
	getRsmTexValue: function(texImage, samplePos, width, height) {
		// Use sample position to lookup color from texture
		var texelValue = 0;
		
		// translate pos from (0, 0) - (1, 1) to (0, 0) - (512,512)
		var y = Math.floor(samplePos[1] * height);
		y = y * width;
		var x = Math.floor(samplePos[0] * width);

		// set value range (restriction)
		// depth >= 0; normal in [-1, 1];
		texelValue = texImage[ y + x ];

		return texelValue;
	},
	injectGeometryShader: function(glPositionIn) {
		var glPosition = [];
		// glPositionIn now in [-1, 1]
		var xpos, ypos;
		// into screen coord [(0,0), (16,16)]
		xpos = (glPositionIn[0] + 1) * 0.5 * this._dimx;
		ypos = (glPositionIn[1] + 1) * 0.5 * this._dimy;
		var x, y, layer;
		x = Math.floor(xpos);
		y = Math.floor(ypos);
		layer = Math.floor(glPositionIn[2]);
		glPosition = [x, y, layer];

		return glPosition;
	},
	injectFragmentShader: function(glPosition, texcoord, normal, shaderdata) {
		var negLightDir = [(-1.0) * shaderdata.lightDir[0],
						   (-1.0) * shaderdata.lightDir[1],
						   (-1.0) * shaderdata.lightDir[2]];
		var intensity = Math.max(0.0, (negLightDir[0] * normal[0] + 
									   negLightDir[1] * normal[1] + 
									   negLightDir[2] * normal[2]));
		
		// create virtual point light
		var sh = this.createVplIntesity(normal);
		var texColor = this.getUnsignedTexValue(shaderdata.rsmColor, texcoord, shaderdata.width, shaderdata.height);
		var color = [];
		color[0] = (texColor[0] / 255.0) * intensity * shaderdata.pointWeight;
		color[1] = (texColor[1] / 255.0) * intensity * shaderdata.pointWeight;
		color[2] = (texColor[2] / 255.0) * intensity * shaderdata.pointWeight;
	
		// fill color into texture array
		var x, y, z;
		x = glPosition[0];
		y = glPosition[1];
		z = glPosition[2];
		var pos = (z * this._dimx * this._dimy * 4) + (y * this._dimx * 4) + (x * 4);
	
		// red intensity texture
		this.intensityTex[0][pos + 0] += color[0] * sh[0];
		this.intensityTex[0][pos + 1] += color[0] * sh[1];
		this.intensityTex[0][pos + 2] += color[0] * sh[2];
		this.intensityTex[0][pos + 3] += color[0] * sh[3];

		// green intensity texture
		this.intensityTex[1][pos + 0] += color[1] * sh[0];
		this.intensityTex[1][pos + 1] += color[1] * sh[1];
		this.intensityTex[1][pos + 2] += color[1] * sh[2];
		this.intensityTex[1][pos + 3] += color[1] * sh[3];

		// blue intensity texture
		this.intensityTex[2][pos + 0] += color[2] * sh[0];
		this.intensityTex[2][pos + 1] += color[2] * sh[1];
		this.intensityTex[2][pos + 2] += color[2] * sh[2];
		this.intensityTex[2][pos + 3] += color[2] * sh[3];
	},
	createVplIntesity: function(normal) {
		var vplIntensity = [];
		// clamped cosine function (see jose.pdf page 5)
		var zhFirstBand = 0.88622689;
		var zhSecondBand = 1.0233266;

		var zhCoeff;
		if(Math.abs(normal[1]) < 0.99) {
			zhCoeff = this.rotateZhCoeff(normal);
			vplIntensity = [zhFirstBand, zhCoeff[0], zhCoeff[1], zhCoeff[2]];
		} else {
			var sign;
			if(normal[1] > 0.0) { sign = 1.0; }
			else if(normal[1] == 0.0) { sign = 0.0; }
			else if(normal[1] < 0.0) { sign = -1.0; }
			else { sign = 0.0; } // if normal.y() is NaN, set sign as zero.
			vplIntensity = [zhFirstBand, 0.0, zhSecondBand * sign, 0.0];
		}

		return vplIntensity;
	},
	rotateZhCoeff: function(direction) {
		var zhSecondBand = 1.0233266;
		
		// dir.xz as a new vec2 vector, then normalize this new vector
		var theta12Cs = [];
		var dir = [direction[0], direction[2]];
		var dirLength = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);
		theta12Cs[0] = dir[0] / dirLength;
		theta12Cs[1] = dir[1] / dirLength;
		
		var phi12Cs = [];
		phi12Cs[0] = Math.sqrt(1.0 - direction[1] * direction[1]);
		phi12Cs[1] = direction[1];

		var rotatedCoeffs = [];
		rotatedCoeffs[0] = zhSecondBand * phi12Cs[0] * theta12Cs[1];
		rotatedCoeffs[1] = zhSecondBand * phi12Cs[1];
		rotatedCoeffs[2] = (-1) * zhSecondBand * phi12Cs[0] * theta12Cs[0];
		
		return rotatedCoeffs;
	},
	getUnsignedTexValue: function(texImage, texCoord, width, height) {
		var color = [];
		var y = Math.floor(texCoord[1] * height);
		y = y * width * 4;
		var x = Math.floor(texCoord[0] * width);
		x = x * 4;

		color[0] = texImage[x + y + 0];
		color[1] = texImage[x + y + 1];
		color[2] = texImage[x + y + 2];

		return color;		
	}
};