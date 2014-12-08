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
		var texImage = new Texture(texName, this._params, this._dimx*this._dimz, this._dimy);
		textureList.push(texImage);
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
	injectVpls: function(rsm, geometryVolume) {
		this.geometryTexture = geometryVolume.gvTexture2;
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
		
		// propagate & accumulate
		if( this._iterations > 0 ) {
			// call propagate & accumulate function
			this.propagateAccumulate();
		}
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
	},
	propagateAccumulate: function() {
		// initial light intensity texture
		if(this.intensityTex.length < 9) {
			for(var i = 0; i < 6; i++) {
				var intensity = new Float32Array(this._dimx * this._dimy * this._dimz * 4);
				this.intensityTex.push(intensity);
			}
		}

		var sourceTex = [], destTex = [];
		for( var i = 0; i < 3; i++ ) {
			sourceTex.push(this.intensityTex[i]);
			destTex.push(this.intensityTex[i+3]);
		}
		// test data
		/*sourceTex[0] = initR;
		sourceTex[1] = initG;
		sourceTex[2] = initB;*/
		
		// stage 0 propagate: source = intensity 0, destination = intensity 1
		this.propagate(true, sourceTex, destTex);
		this.swapSourceDest(sourceTex, destTex);
		// stage 0 accumulate : source = intensity 1, destination = intensity 0 
		this.accumulate(sourceTex, destTex);
		
		var lightVolume = [];
		lightVolume = destTex.slice();
		// stage 1 propagate : source = intensity 1, destination = intensity 2
		for(var i = 0; i < 3; i++) {
			destTex[i] = this.intensityTex[i+6];
		}
		
		// test data
		/*sourceTex[0] = propagateR;
		sourceTex[1] = propagateG;
		sourceTex[2] = propagateB;*/

		for(var iteration = 1; iteration < this._iterations; iteration++ ) {
			this.propagate(false, sourceTex, destTex);
			this.accumulate(destTex, lightVolume);
			this.swapSourceDest(sourceTex, destTex);
		}

		this.transIntensityTex(lightVolume);
	},
	swapSourceDest: function(sourceTex, destTex) {
		for( var i = 0; i < 3; i++ ) {
			var temp = sourceTex[i];
			sourceTex[i] = destTex[i];
			destTex[i] = temp;
		}
	},
	propagate: function(firstIteration, sourceTex, destTex) {
		// first iterations propagation : propagates without checking
		// second - eighth iterations : propagates with checking
		// blocking potentials to avoid self shadowing
		var shaderdata = new propagateData();

		if( this._useGeomVolume === false || firstIteration === true) {
			shaderdata.blocking = false; 	// propagation no blocking
		} else {
			shaderdata.blocking = true; 	// propagation
		}
		
		shaderdata.gridDepth = this._dimz;
		shaderdata.invGridSize = [1.0 / this._dimx, 1.0 / this._dimy, 1.0 / this._dimz];
		shaderdata.halfTexelSize = shaderdata.invGridSize[2] * 0.5;

		shaderdata.coeffsRed = sourceTex[0];
		shaderdata.coeffsGreen = sourceTex[1];
		shaderdata.coeffsBlue = sourceTex[2];
		
		if(shaderdata.blocking === true) {
			// use geometry volume which prevents light from being propagated through blocking geometry
			shaderdata.geometryVolumeTexture = this.geometryTexture;

			shaderdata.projGridtoGv[0] = [this._dimx / (this._dimx + 1),
										  this._dimy / (this._dimy + 1),
										  this._dimz / (this._dimz + 1)].slice();
			shaderdata.projGridtoGv[1] = [0.5 / (this._dimx + 1), 
										  0.5 / (this._dimy + 1), 
										  0.5 / (this._dimz + 1)].slice();
		}

		shaderdata.slices = bufferList[1]._data;
		shaderdata.primcount = this._dimz;
		
		// propagate shader start
		this.propagateFS(shaderdata, destTex);
	},
	propagateFS: function(shaderdata, destTex) {
		// propagate shader
		// after inject vpls, we need to propagate the vpls into grid
		// use position of element in texture array as glPosition
		// and let glPosition(x,y,z) divide dim of light grid volume to get texture coordinate.

		// first iteration test data
		/*if(shaderdata.blocking === false) {
			shaderdata.coeffsRed = initR;
			shaderdata.coeffsGreen = initG;
			shaderdata.coeffsBlue = initB;
		} 
		if(shaderdata.blocking === true) {
			shaderdata.geometryVolumeTexture = h;
		}*/

		for(var i = 0; i < this._dimx * this._dimy * this._dimz * 4; i+=4) {
			// calculate texture coordinate position
			var texCoord = this.getTexCoord(i, shaderdata.invGridSize, shaderdata.halfTexelSize);
			
			// calculate SH
			var totalVplRed = [0.0, 0.0, 0.0, 0.0];
			var totalVplGreen = [0.0, 0.0, 0.0, 0.0];
			var totalVplBlue = [0.0, 0.0, 0.0, 0.0];
			var vplRed = [0.0, 0.0, 0.0, 0.0], vplGreen = [0.0, 0.0, 0.0, 0.0], vplBlue = [0.0, 0.0, 0.0, 0.0];
			
			var samplePosNeg = [];
			samplePosNeg[0] = texCoord[0] - shaderdata.invGridSize[0];
			samplePosNeg[1] = texCoord[1] - shaderdata.invGridSize[1];
			samplePosNeg[2] = texCoord[2] - shaderdata.invGridSize[2];

			var samplePosPos = [];
			samplePosPos[0] = texCoord[0] + shaderdata.invGridSize[0];
			samplePosPos[1] = texCoord[1] + shaderdata.invGridSize[1];
			samplePosPos[2] = texCoord[2] + shaderdata.invGridSize[2];
			
			var gridSamplePos = [0.0, 0.0, 0.0];
			var redIn = [0.0, 0.0, 0.0, 0.0], greenIn = [0.0, 0.0, 0.0, 0.0], blueIn = [0.0, 0.0, 0.0, 0.0];
			var sign;
			var lightIn = [], vplRGB = [];
			
			lightIn.push(redIn, greenIn, blueIn);
			vplRGB.push(vplRed, vplGreen, vplBlue);

			// get light intensity sh vectors from the cell left to this cell
			gridSamplePos = [samplePosNeg[0], texCoord[1], texCoord[2]];
			this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);
			
			// #ifndef NO_BLOCKING = propagate with blocking potential
			if(shaderdata.blocking === true) {
				// sample pos of blocking potential is between both cells
				gridSamplePos[0] += shaderdata.halfTexelSize;
				var blockingPotential = this.sampleBPfromLeft(shaderdata.geometryVolumeTexture,
															  shaderdata.projGridtoGv,
															  gridSamplePos);
				this.applyBlockingPotential(blockingPotential, [0.88622689, 0.0, 0.0, -1.0233266],
											lightIn[0], lightIn[1], lightIn[2]);
			}

			// SH parameter
			var shCenteralDir = [];
			var vpl = [];
			var solidAngle = [];

			this.getLightFromLeft(shCenteralDir, vpl, solidAngle);
			this.propagateLight(vplRGB, lightIn, shCenteralDir, vpl, solidAngle);
			(0.0 > samplePosNeg[0]) ? sign = 0 : sign = 1;
			totalVplRed = [vplRGB[0][0] * sign, vplRGB[0][1] * sign, vplRGB[0][2] * sign, vplRGB[0][3] * sign];
			totalVplGreen = [vplRGB[1][0] * sign, vplRGB[1][1] * sign, vplRGB[1][2] * sign, vplRGB[1][3] * sign];
			totalVplBlue = [vplRGB[2][0] * sign, vplRGB[2][1] * sign, vplRGB[2][2] * sign, vplRGB[2][3] * sign]
			// from left cell end.

			// get light intensity sh vectors from the cell right to this cell
			gridSamplePos = [samplePosPos[0], texCoord[1], texCoord[2]];
			this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);
			
			// #ifndef NO_BLOCKING
			if(shaderdata.blocking === true) {
				//sample pos of blocking potential is between both cells
				gridSamplePos[0] -= shaderdata.halfTexelSize;
				blockingPotential = this.sampleBPfromRight(shaderdata.geometryVolumeTexture,
														   shaderdata.projGridtoGv,
														   gridSamplePos);
				this.applyBlockingPotential(blockingPotential, [0.88622689, 0.0, 0.0, 1.0233266],
											lightIn[0], lightIn[1], lightIn[2]);
			}
			// #endif
			this.getLightFromRight(shCenteralDir, vpl, solidAngle);
			this.propagateLight(vplRGB, lightIn, shCenteralDir, vpl, solidAngle);
			
			(samplePosPos[0] > 1.0) ? sign = 0.0 : sign = 1.0;
			var temp = [vplRGB[0][0] * sign, vplRGB[0][1] * sign, vplRGB[0][2] * sign, vplRGB[0][3] * sign];
			totalVplRed[0] += temp[0]; totalVplRed[1] += temp[1]; totalVplRed[2] += temp[2]; totalVplRed[3] += temp[3];	
			
			temp = [vplRGB[1][0] * sign, vplRGB[1][1] * sign, vplRGB[1][2] * sign, vplRGB[1][3] * sign];
			totalVplGreen[0] += temp[0]; totalVplGreen[1] += temp[1]; totalVplGreen[2] += temp[2]; totalVplGreen[3] += temp[3];
			
			temp = [vplRGB[2][0] * sign, vplRGB[2][1] * sign, vplRGB[2][2] * sign, vplRGB[2][3] * sign];
			totalVplBlue[0] += temp[0]; totalVplBlue[1] += temp[1]; totalVplBlue[2] += temp[2]; totalVplBlue[3] += temp[3];
			// from right cell end.
	
			// get light intensity sh vectors from the cell above this cell
			gridSamplePos = [texCoord[0], samplePosPos[1], texCoord[2]];
			this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);		
			
			// #ifndef NO_BLOCKING
			if(shaderdata.blocking === true) {
				gridSamplePos[1] -= shaderdata.halfTexelSize;
				if(gridSamplePos[1] == 1) {
					gridSamplePos[1] -= shaderdata.halfTexelSize;
					this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);
				}
				blockingPotential = this.sampleBPfromAbove(shaderdata.geometryVolumeTexture,
														   shaderdata.projGridtoGv,
														   gridSamplePos);
				this.applyBlockingPotential(blockingPotential, [0.88622689, 0.0, -1.0233266, 0.0],
											lightIn[0], lightIn[1], lightIn[2]);
			}
			// #endif
			this.getLightFromAbove(shCenteralDir, vpl, solidAngle);
			this.propagateLight(vplRGB, lightIn, shCenteralDir, vpl, solidAngle);
		
			(samplePosPos[1] > 1.0) ? sign = 0.0 : sign = 1.0;
			temp = [vplRGB[0][0] * sign, vplRGB[0][1] * sign, vplRGB[0][2] * sign, vplRGB[0][3] * sign];
			totalVplRed[0] += temp[0]; totalVplRed[1] += temp[1]; totalVplRed[2] += temp[2]; totalVplRed[3] += temp[3];	
			
			temp = [vplRGB[1][0] * sign, vplRGB[1][1] * sign, vplRGB[1][2] * sign, vplRGB[1][3] * sign];
			totalVplGreen[0] += temp[0]; totalVplGreen[1] += temp[1]; totalVplGreen[2] += temp[2]; totalVplGreen[3] += temp[3];
			
			temp = [vplRGB[2][0] * sign, vplRGB[2][1] * sign, vplRGB[2][2] * sign, vplRGB[2][3] * sign];
			totalVplBlue[0] += temp[0]; totalVplBlue[1] += temp[1]; totalVplBlue[2] += temp[2]; totalVplBlue[3] += temp[3];
			// from above cell end.

			// get light intensity sh vectors from the cell below this cell
			gridSamplePos = [texCoord[0], samplePosNeg[1], texCoord[2]];
			this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);
			
			// #ifndef NO_BLOCKING
			if(shaderdata.blocking === true) {
				gridSamplePos[1] += shaderdata.halfTexelSize;
				if(gridSamplePos[1] == 0) {
					this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);		
				}
				blockingPotential = this.sampleBPfromBelow(shaderdata.geometryVolumeTexture,
														   shaderdata.projGridtoGv,
														   gridSamplePos);
				this.applyBlockingPotential(blockingPotential, [0.88622689, 0.0, 1.0233266, 0.0],
											lightIn[0], lightIn[1], lightIn[2]);
			}
			// #endif
			this.getLightFromBelow(shCenteralDir, vpl, solidAngle);
			this.propagateLight(vplRGB, lightIn, shCenteralDir, vpl, solidAngle);

			(0.0 >samplePosNeg[1]) ? sign = 0.0 : sign = 1.0;
			temp = [vplRGB[0][0] * sign, vplRGB[0][1] * sign, vplRGB[0][2] * sign, vplRGB[0][3] * sign];
			totalVplRed[0] += temp[0]; totalVplRed[1] += temp[1]; totalVplRed[2] += temp[2]; totalVplRed[3] += temp[3];	
			
			temp = [vplRGB[1][0] * sign, vplRGB[1][1] * sign, vplRGB[1][2] * sign, vplRGB[1][3] * sign];
			totalVplGreen[0] += temp[0]; totalVplGreen[1] += temp[1]; totalVplGreen[2] += temp[2]; totalVplGreen[3] += temp[3];
			
			temp = [vplRGB[2][0] * sign, vplRGB[2][1] * sign, vplRGB[2][2] * sign, vplRGB[2][3] * sign];
			totalVplBlue[0] += temp[0]; totalVplBlue[1] += temp[1]; totalVplBlue[2] += temp[2]; totalVplBlue[3] += temp[3];
			// from below cell end.

			// get light intensity sh vectors from the cell behind this cell
			gridSamplePos = [texCoord[0], texCoord[1], samplePosNeg[2]];
			this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);
			
			//#ifndef NO_BLOCKING
			if(shaderdata.blocking == true) {
				gridSamplePos[2] += shaderdata.halfTexelSize;
				blockingPotential = this.sampleBPfromBehind(shaderdata.geometryVolumeTexture,
														    shaderdata.projGridtoGv,
														    gridSamplePos);
				this.applyBlockingPotential(blockingPotential, [0.88622689, 1.0233266, 0.00000000, -0.00000000],
											lightIn[0], lightIn[1], lightIn[2]);
			}
			// #endif

			this.getLightFromBehind(shCenteralDir, vpl, solidAngle);
			this.propagateLight(vplRGB, lightIn, shCenteralDir, vpl, solidAngle);
			
			(0.0 > samplePosNeg[2]) ? sign = 0.0 : sign = 1.0;
			temp = [vplRGB[0][0] * sign, vplRGB[0][1] * sign, vplRGB[0][2] * sign, vplRGB[0][3] * sign];
			totalVplRed[0] += temp[0]; totalVplRed[1] += temp[1]; totalVplRed[2] += temp[2]; totalVplRed[3] += temp[3];	
			
			temp = [vplRGB[1][0] * sign, vplRGB[1][1] * sign, vplRGB[1][2] * sign, vplRGB[1][3] * sign];
			totalVplGreen[0] += temp[0]; totalVplGreen[1] += temp[1]; totalVplGreen[2] += temp[2]; totalVplGreen[3] += temp[3];
			
			temp = [vplRGB[2][0] * sign, vplRGB[2][1] * sign, vplRGB[2][2] * sign, vplRGB[2][3] * sign];
			totalVplBlue[0] += temp[0]; totalVplBlue[1] += temp[1]; totalVplBlue[2] += temp[2]; totalVplBlue[3] += temp[3];
			// from behind cell end.
			
			// get light intensity sh vectors from the cell in front of this cell
			gridSamplePos = [texCoord[0], texCoord[1], samplePosPos[2]];
			this.getVpls(shaderdata, gridSamplePos, lightIn[0], lightIn[1], lightIn[2]);

			// #ifndef NO_BLOCKING
			if(shaderdata.blocking == true) {
				gridSamplePos[2] -= shaderdata.halfTexelSize;
				if(gridSamplePos[2] == 1) {
					var samplePos = [];
					samplePos.push.apply(samplePos, gridSamplePos);
					samplePos[2] = 0;
					this.getVpls(shaderdata, samplePos, lightIn[0], lightIn[1], lightIn[2]);
				}
				blockingPotential = this.sampleBPfromFront(shaderdata.geometryVolumeTexture,
														    shaderdata.projGridtoGv,
														    gridSamplePos);
				this.applyBlockingPotential(blockingPotential, [0.88622689, -1.0233266, 0.00000000, -0.00000000],
											lightIn[0], lightIn[1], lightIn[2]);
			}
			// #endif

			this.getLightFromFront(shCenteralDir, vpl, solidAngle);
			this.propagateLight(vplRGB, lightIn, shCenteralDir, vpl, solidAngle);
			
			(samplePosPos[2] > 1.0) ? sign = 0.0 : sign = 1.0;
			temp = [vplRGB[0][0] * sign, vplRGB[0][1] * sign, vplRGB[0][2] * sign, vplRGB[0][3] * sign];
			totalVplRed[0] += temp[0]; totalVplRed[1] += temp[1]; totalVplRed[2] += temp[2]; totalVplRed[3] += temp[3];	
			
			temp = [vplRGB[1][0] * sign, vplRGB[1][1] * sign, vplRGB[1][2] * sign, vplRGB[1][3] * sign];
			totalVplGreen[0] += temp[0]; totalVplGreen[1] += temp[1]; totalVplGreen[2] += temp[2]; totalVplGreen[3] += temp[3];
			
			temp = [vplRGB[2][0] * sign, vplRGB[2][1] * sign, vplRGB[2][2] * sign, vplRGB[2][3] * sign];
			totalVplBlue[0] += temp[0]; totalVplBlue[1] += temp[1]; totalVplBlue[2] += temp[2]; totalVplBlue[3] += temp[3];
			// from front cell end.

			// normalize
			totalVplRed = [totalVplRed[0]/Math.PI, totalVplRed[1]/Math.PI, totalVplRed[2]/Math.PI, totalVplRed[3]/Math.PI];
			totalVplGreen = [totalVplGreen[0]/Math.PI, totalVplGreen[1]/Math.PI, totalVplGreen[2]/Math.PI, totalVplGreen[3]/Math.PI];
			totalVplBlue = [totalVplBlue[0]/Math.PI, totalVplBlue[1]/Math.PI, totalVplBlue[2]/Math.PI, totalVplBlue[3]/Math.PI];
			
			// store light intensity as SH vectors
			destTex[0][i] = totalVplRed[0];
			destTex[0][i+1] = totalVplRed[1];
			destTex[0][i+2] = totalVplRed[2];
			destTex[0][i+3] = totalVplRed[3];

			destTex[1][i] = totalVplGreen[0];
			destTex[1][i+1] = totalVplGreen[1];
			destTex[1][i+2] = totalVplGreen[2];
			destTex[1][i+3] = totalVplGreen[3];
			
			destTex[2][i] = totalVplBlue[0];
			destTex[2][i+1] = totalVplBlue[1];
			destTex[2][i+2] = totalVplBlue[2];
			destTex[2][i+3] = totalVplBlue[3];
		}
	},
	getTexCoord: function(instanceID, invGridSize, halfTexelSize) {
		// calculate glPosition
		var posx, posy, posz;
		posz = Math.floor( instanceID / (this._dimx * this._dimy * 4) );
		posy = Math.floor( (instanceID - (posz * this._dimx * this._dimy * 4)) / (this._dimx * 4) );
		posx = Math.floor( (instanceID - (posz * this._dimx * this._dimy * 4) - (posy * this._dimx * 4)) / 4 );
		
		// translate pos in gridCoord.(0, 0) - (15, 15) to texCoord. (0, 0) - (1, 1)
		var texCoord = [];
		texCoord[0] = posx * invGridSize[0] + halfTexelSize;
		texCoord[1] = posy * invGridSize[1] + halfTexelSize;
		texCoord[2] = posz * invGridSize[2];

		texCoord[2] += invGridSize[2] * 0.5;
		return texCoord;
	},
	getVpls: function(shaderdata, sourceCell, red, green, blue) {
		red.splice(0, red.length);
		green.splice(0, green.length);
		blue.splice(0, blue.length);
		var vplColor;

		// read sh vectors storing the light intensity
		vplColor = this.getFloatTexValue(shaderdata.coeffsRed, sourceCell, this._dimx, this._dimy, this._dimz);
		red.push.apply(red, vplColor);
		vplColor = this.getFloatTexValue(shaderdata.coeffsGreen, sourceCell, this._dimx, this._dimy, this._dimz);
		green.push.apply(green, vplColor);
		vplColor = this.getFloatTexValue(shaderdata.coeffsBlue, sourceCell, this._dimx, this._dimy, this._dimz);
		blue.push.apply(blue, vplColor);
	},
	getFloatTexValue: function(texImage, texCoord, width, height, depth) {
		var texValue = [0.0, 0.0, 0.0, 0.0];
		var z = Math.floor(texCoord[2] * depth + 0.00000000000001);
		var y = Math.floor(texCoord[1] * height + 0.00000000000001);
		var x = Math.floor(texCoord[0] * width + 0.00000000000001);
		
		z = z * width * height * 4;
		y = y * width * 4;
		x = x * 4;

		if( ((x+y+z < 0)) || ((x+y+z) >= (width * height * depth * 4)) ) {
			texValue = [0.0, 0.0, 0.0, 0.0];
		} else {
			texValue[0] = texImage[x + y + z + 0];
			texValue[1] = texImage[x + y + z + 1];
			texValue[2] = texImage[x + y + z + 2];
			texValue[3] = texImage[x + y + z + 3];
		}

		return texValue;
	},
	sampleBPfromLeft: function(texImage, projGridtoGv, samplePos) {
		// sample blocking potential from the left cell
		// x non-change; y non-change / next y; z non-change / next z
		var gvSamplePos = [0.0, 0.0, 0.0];
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];

		var blocking = [0.0, 0.0, 0.0, 0.0];
		var temp = [0.0, 0.0, 0.0, 0.0];

		// step 1	x, y+1, z+1
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 2	x, y, z+1
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 3	x, y+1, z
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 4	x, y, z
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// average the value
		blocking = [blocking[0] / 4, blocking[1] / 4, blocking[2] / 4, blocking[3] / 4];
		return blocking;
	},
	sampleBPfromRight: function(texImage, projGridtoGv, samplePos) {
		// sample blocking potential from the right cell
		// next x; y non-change / next y; z non-change / next z	
		var gvSamplePos = [];
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];

		var blocking = [0.0, 0.0, 0.0, 0.0];
		var temp = []; 
		// step 1	x+1, y+1, z+1
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 2	x+1, y, z+1
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);

		// step 3	x+1, y+1, z
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 4	x+1, y, z
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// average the value
		blocking = [blocking[0] / 4, blocking[1] / 4, blocking[2] / 4, blocking[3] / 4];
		return blocking;
	},
	sampleBPfromAbove: function(texImage, projGridtoGv, samplePos) {
		// sample blocking potential from the above cell
		// x non-change / next x; next y; z non-change / next z
		var gvSamplePos = [];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];

		var blocking = [0.0, 0.0, 0.0, 0.0];
		var temp = [];

		// step 1	x+1, y+1, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 2	x, y+1, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 3	x+1, y+1, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 4	x, y+1, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// average the value
		blocking = [blocking[0] / 4, blocking[1] / 4, blocking[2] / 4, blocking[3] / 4];
		return blocking;
	},
	sampleBPfromBelow: function(texImage, projGridtoGv, samplePos) {
		// sample blocking potential from the below cell
		// x non-change / next x; y non-shange; z non-change / next z
		
		var gvSamplePos = [];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		
		var blocking = [0.0, 0.0, 0.0, 0.0];
		var temp = [];
		
		// step 1	x+1, y, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 2	x, y, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 3	x+1, y, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);

		// step 4	x, y, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// average the value
		blocking = [blocking[0] / 4, blocking[1] / 4, blocking[2] / 4, blocking[3] / 4];
		return blocking;
	},
	sampleBPfromBehind: function(texImage, projGridtoGv, samplePos) {
		// sample blocking potential from the behind cell
		// x non-change / next x; y non-shange / next y; z non-change
		var gvSamplePos = [];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2];

		var blocking = [0.0, 0.0, 0.0, 0.0];
		var temp = [];
		
		// step 1	x+1, y+1, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 2	x, y+1, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 3	x+1, y, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 4	x, y, z
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// average the value
		blocking = [blocking[0] / 4, blocking[1] / 4, blocking[2] / 4, blocking[3] / 4];
		return blocking;
	},
	sampleBPfromFront: function (texImage, projGridtoGv, samplePos) {
		// sample blocking potential from the front cell
		// x non-change / next x; y non-shange / next y; next z
		var gvSamplePos = [];
		gvSamplePos[2] = samplePos[2] * projGridtoGv[0][2] + projGridtoGv[1][2];

		if( gvSamplePos[2] == 1 ) {
			gvSamplePos[2] = 0;
		}

		var blocking = [0.0, 0.0, 0.0, 0.0];
		var temp = [];
		
		// step 1	x+1, y+1, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);

		// step 2	x, y+1, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1] + projGridtoGv[1][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 3	x+1, y, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0] + projGridtoGv[1][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// step 4	x, y, z+1
		gvSamplePos[0] = samplePos[0] * projGridtoGv[0][0];
		gvSamplePos[1] = samplePos[1] * projGridtoGv[0][1];
		temp = this.getFloatTexValue(texImage, gvSamplePos, (this._dimx+1), (this._dimy+1), (this._dimz+1));
		this.vplAddContribution(blocking, temp);
		
		// average the value
		blocking = [blocking[0] / 4, blocking[1] / 4, blocking[2] / 4, blocking[3] / 4];
		return blocking;
	},
	vplAddContribution: function(vpl, contribution) {
		// add vpl color and light contribution
		vpl[0] = vpl[0] + contribution[0];
		vpl[1] = vpl[1] + contribution[1];
		vpl[2] = vpl[2] + contribution[2];
		vpl[3] = vpl[3] + contribution[3];
	},
	applyBlockingPotential: function(blockingPotential, light, vplR, vplG, vplB) {
		var blockingMax = 1.83;

		// value depends on direction of light and blocking potential and magnitude of blocking potential
		var bp = Math.max((blockingPotential[0] * light[0] +
						   blockingPotential[1] * light[1] + 
						   blockingPotential[2] * light[2] +
						   blockingPotential[3] * light[3]), 0.0);		
		var weight = 1.0 - (bp / blockingMax);
		for(var i = 0; i <= 3; i++) {
			vplR[i] = vplR[i] * weight;
			vplG[i] = vplG[i] * weight;
			vplB[i] = vplB[i] * weight;
		}
	},
	propagateLight: function(vplRGB, lightIn, shCenteralDir, vpl, solidAngle) {
		// propagate light from adjacent cell to the five faces of this cell
		// lightIn is redIn, greenIn, blueIn, which is vpls of neighbour [in source cell]
		// vplRGB is vpl_r, vpl_g, vpl_b, output vpl [in destination cell]

		// using local variable to do operation, and assign back to lightIn variable after complete the propagate
		var vplRed = [0.0, 0.0, 0.0, 0.0];
		var vplGreen = [0.0, 0.0, 0.0, 0.0];
		var vplBlue = [0.0, 0.0, 0.0, 0.0];
		
		var contributionRed = [0.0, 0.0, 0.0, 0.0];
		var contributionGreen = [0.0, 0.0, 0.0, 0.0];
		var contributionBlue = [0.0, 0.0, 0.0, 0.0];
		
		for(var i =0; i < 5; i++) {
			// create virtual point light pointing towards face 2
			this.createVpl(lightIn, shCenteralDir[i], vpl[i], solidAngle[i], 
						   contributionRed, contributionGreen, contributionBlue);
			this.vplAddContribution(vplRed, contributionRed);
			this.vplAddContribution(vplGreen, contributionGreen);
			this.vplAddContribution(vplBlue, contributionBlue);
		}

		// assign back to vplRGB
		vplRGB[0] = vplRed;
		vplRGB[1] = vplGreen;
		vplRGB[2] = vplBlue;
	},
	createVpl: function(lightIn, shCenteralDir, vpl, solidAngle, contributionRed, contributionGreen, contributionBlue) {
		// calculate avarage light intensity
		var intensity = [];
		intensity[0] = Math.max(0.0, (shCenteralDir[0] * lightIn[0][0] +
									  shCenteralDir[1] * lightIn[0][1] +
									  shCenteralDir[2] * lightIn[0][2] +
									  shCenteralDir[3] * lightIn[0][3]));
		intensity[1] = Math.max(0.0, (shCenteralDir[0] * lightIn[1][0] +
									  shCenteralDir[1] * lightIn[1][1] +
									  shCenteralDir[2] * lightIn[1][2] +
									  shCenteralDir[3] * lightIn[1][3]));
		intensity[2] = Math.max(0.0, (shCenteralDir[0] * lightIn[2][0] +
									  shCenteralDir[1] * lightIn[2][1] +
									  shCenteralDir[2] * lightIn[2][2] +
									  shCenteralDir[3] * lightIn[2][3]));
		
		// multiply by solid angle to calculate the flux
		var flux = [intensity[0] * solidAngle, intensity[1] * solidAngle, intensity[2] * solidAngle];
		// create virtual point light pointing towards the face
		contributionRed[0] = vpl[0] * flux[0];
		contributionRed[1] = vpl[1] * flux[0];
		contributionRed[2] = vpl[2] * flux[0];
		contributionRed[3] = vpl[3] * flux[0];

		contributionGreen[0] = vpl[0] * flux[1];
		contributionGreen[1] = vpl[1] * flux[1];
		contributionGreen[2] = vpl[2] * flux[1];
		contributionGreen[3] = vpl[3] * flux[1];

		contributionBlue[0] = vpl[0] * flux[2];
		contributionBlue[1] = vpl[1] * flux[2];
		contributionBlue[2] = vpl[2] * flux[2];
		contributionBlue[3] = vpl[3] * flux[2];
	},
	vplAddContribution: function(vpl, contribution) {
		// add vpl color and light contribution
		vpl[0] = vpl[0] + contribution[0];
		vpl[1] = vpl[1] + contribution[1];
		vpl[2] = vpl[2] + contribution[2];
		vpl[3] = vpl[3] + contribution[3];
	},
	getLightFromLeft: function(shCenteralDir, vpl, solidAngle) {
		// clear source array
		shCenteralDir.splice(0, shCenteralDir.length);
		vpl.splice(0, vpl.length);
		solidAngle.splice(0, solidAngle.length);
		// 1st set:
		shCenteralDir.push([0.28209481, 0.0, 0.25687355, -0.41563013]);
		vpl.push([0.88622689, 0.0, 1.0233266, 0.0]);
		solidAngle.push(0.42343098);

		// 2nd set:
		shCenteralDir.push([0.28209481, 0.0, -0.25687355, -0.41563013]);
		vpl.push([0.88622689, 0.0, -1.0233266, 0.0]);
		solidAngle.push(0.42343098);
		
		// 3rd set:
		shCenteralDir.push([0.28209481, 0.0, 0.0, -0.48860252]);
		vpl.push([0.88622689, 0.0, 0.0, -1.0233266]);
		solidAngle.push(0.40067077);
		
		// 4th set:
		shCenteralDir.push([0.28209481, 0.25687355, 0.0, -0.41563013]);
		vpl.push([0.88622689, 1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);
		
		// 5th set:
		shCenteralDir.push([0.28209481, -0.25687355, 0.0, -0.41563013]);
		vpl.push([0.88622689, -1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);
	},
	getLightFromRight: function(shCenteralDir, vpl, solidAngle) {
		// clear source array
		shCenteralDir.splice(0, shCenteralDir.length);
		vpl.splice(0, vpl.length);
		solidAngle.splice(0, solidAngle.length);

		// 6th set
		shCenteralDir.push([0.28209481, 0.0, 0.25687355, 0.41563013]);
		vpl.push([0.88622689, 0.0, 1.0233266, 0.0]);
		solidAngle.push(0.42343098);
		
		// 7th set
		shCenteralDir.push([0.28209481, 0.0, -0.25687355, 0.41563013]);
		vpl.push([0.88622689, 0.0, -1.0233266, 0.0]);
		solidAngle.push(0.42343098);
		
		// 8th set
		shCenteralDir.push([0.28209481, 0.0, 0.0, 0.48860252]);
		vpl.push([0.88622689, 0.0, 0.0, 1.0233266]);
		solidAngle.push(0.40067077);
		
		// 9th set
		shCenteralDir.push([0.28209481, 0.25687355, 0.0, 0.41563013]);
		vpl.push([0.88622689, 1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);
		
		// 10th set
		shCenteralDir.push([0.28209481, -0.25687355, 0.0, 0.41563013]);
		vpl.push([0.88622689, -1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);
	},
	getLightFromAbove: function(shCenteralDir, vpl, solidAngle) {
		// clear source array
		shCenteralDir.splice(0, shCenteralDir.length);
		vpl.splice(0, vpl.length);
		solidAngle.splice(0, solidAngle.length);

		// 16th set
		shCenteralDir.push([0.28209481, 0.0, -0.48860252, 0.0]);
		vpl.push([0.88622689, 0.0, -1.0233266, 0.0]);
		solidAngle.push(0.40067077);

		// 17th set
		shCenteralDir.push([0.28209481, 0.0, -0.41563013, -0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, -1.0233266]);
		solidAngle.push(0.42343098);

		// 18th set
		shCenteralDir.push([0.28209481, 0.0, -0.41563013, 0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, 1.0233266]);
		solidAngle.push(0.42343098);

		// 19th set
		shCenteralDir.push([0.28209481, 0.25687355, -0.41563013, 0.0]);
		vpl.push([0.88622689, 1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);

		// 20th set
		shCenteralDir.push([0.28209481, -0.25687355, -0.41563013, 0.0]);
		vpl.push([0.88622689, -1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);
	},
	getLightFromBelow: function(shCenteralDir, vpl, solidAngle) {
		// clear source array
		shCenteralDir.splice(0, shCenteralDir.length);
		vpl.splice(0, vpl.length);
		solidAngle.splice(0, solidAngle.length);

		// 11th set
		shCenteralDir.push([0.28209481, 0.0, 0.48860252, 0.0]);
		vpl.push([0.88622689, 0.0, 1.0233266, 0.0]);
		solidAngle.push(0.40067077);
		
		// 12th set
		shCenteralDir.push([0.28209481, 0.0, 0.41563013, -0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, -1.0233266]);
		solidAngle.push(0.42343098);
		
		// 13th set
		shCenteralDir.push([0.28209481, 0.0, 0.41563013, 0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, 1.0233266]);
		solidAngle.push(0.42343098);

		// 14th set
		shCenteralDir.push([0.28209481, 0.25687355, 0.41563013, 0.0]);
		vpl.push([0.88622689, 1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);

		// 15th set
		shCenteralDir.push([0.28209481, -0.25687355, 0.41563013, 0.0]);
		vpl.push([0.88622689, -1.0233266, 0.0, 0.0]);
		solidAngle.push(0.42343098);
	},
	getLightFromBehind: function(shCenteralDir, vpl, solidAngle) {
		// clear source array
		shCenteralDir.splice(0, shCenteralDir.length);
		vpl.splice(0, vpl.length);
		solidAngle.splice(0, solidAngle.length);

		// 21st set
		shCenteralDir.push([0.28209481, 0.48860252, 0.0, 0.0]);
		vpl.push([0.88622689, 1.0233266, 0.0, 0.0]);
		solidAngle.push(0.40067077);
		
		// 22nd set
		shCenteralDir.push([0.28209481, 0.41563013, 0.25687355, 0.0]);
		vpl.push([0.88622689, 0.0, 1.0233266, 0.0]);
		solidAngle.push(0.42343098);

		// 23rd set
		shCenteralDir.push([0.28209481, 0.41563013, -0.25687355, 0.0]);
		vpl.push([0.88622689, 0.0, -1.0233266, 0.0]);
		solidAngle.push(0.42343098);

		// 24th set
		shCenteralDir.push([0.28209481, 0.41563013, 0.0, 0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, 1.0233266]);
		solidAngle.push(0.42343098);

		// 25th set
		shCenteralDir.push([0.28209481, 0.41563013, 0.0, -0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, -1.0233266]);
		solidAngle.push(0.42343098);
	},
	getLightFromFront: function(shCenteralDir, vpl, solidAngle) {
		// clear source array
		shCenteralDir.splice(0, shCenteralDir.length);
		vpl.splice(0, vpl.length);
		solidAngle.splice(0, solidAngle.length);

		// 26th set
		shCenteralDir.push([0.28209481, -0.48860252, 0.0, 0.0]);
		vpl.push([0.88622689, -1.0233266, 0.0, 0.0]);
		solidAngle.push(0.40067077);

		// 27th set
		shCenteralDir.push([0.28209481, -0.41563013, 0.25687355, 0.0]);
		vpl.push([0.88622689, 0.0, 1.0233266, 0.0]);
		solidAngle.push(0.42343098);

		// 28th set
		shCenteralDir.push([0.28209481, -0.41563013, -0.25687355, 0.0]);
		vpl.push([0.88622689, 0.0, -1.0233266, 0.0]);
		solidAngle.push(0.42343098);

		// 29th set
		shCenteralDir.push([0.28209481, -0.41563013, 0.0, 0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, 1.0233266]);
		solidAngle.push(0.42343098);

		// 30th set
		shCenteralDir.push([0.28209481, -0.41563013, 0.0, -0.25687355]);
		vpl.push([0.88622689, 0.0, 0.0, -1.0233266]);
		solidAngle.push(0.42343098);
	},
	accumulate: function(sourceTex, destTex) {
		// accumulate source texture (result) to destination texture (final grid)
		for( var i = 0; i < 3; i++ ) {
			this.accumulateFS( destTex[i], sourceTex[i] );
		}
	},
	accumulateFS: function(destVolume, sourceVolume) {
		for( var i = 0; i < this._dimx * this._dimy * this._dimz * 4; i++ ) {
			destVolume[i] += sourceVolume[i];
		}
	},
	transIntensityTex: function(lightVolume) {
		// transform indirect light volume sampler texture3D to texuture2D
		var red = new Float32Array(this._dimx * this._dimy * this._dimz * 4);
		var green = new Float32Array(this._dimx * this._dimy * this._dimz * 4);
		var blue = new Float32Array(this._dimx * this._dimy * this._dimz * 4);		
		
		textureList[8].data = this.arrangePixels(lightVolume[0]);
		textureList[9].data = this.arrangePixels(lightVolume[1]);
		textureList[10].data = this.arrangePixels(lightVolume[2]);

	    this.bindTextureData(8);
	    this.bindTextureData(9);
	    this.bindTextureData(10);
	},
	arrangePixels: function(texImage) {
		// arrange square texture pixels to rectangle texture
		var temp = new Float32Array(this._dimx * this._dimy * this._dimz * 4);
		for(var i = 0; i < 16; i++) {
			for(var j = 0; j < 16; j++) {
				for(var k = 0; k < 16; k++) {
					// x = x * 4
					// y = y * 16 * 16 * 4
					// z = z * 16 * 4
					temp[ i*16*4 + j*16*16*4 + k*4 +0 ] = texImage[ i*16*16*4 + j*16*4 + k*4 + 0 ];
					temp[ i*16*4 + j*16*16*4 + k*4 +1 ] = texImage[ i*16*16*4 + j*16*4 + k*4 + 1 ];
					temp[ i*16*4 + j*16*16*4 + k*4 +2 ] = texImage[ i*16*16*4 + j*16*4 + k*4 + 2 ];
					temp[ i*16*4 + j*16*16*4 + k*4 +3 ] = texImage[ i*16*16*4 + j*16*4 + k*4 + 3 ];
				}
			}
		}
		return temp;
	},
	bindTextureData: function(textureID) {
		gl.bindTexture(gl.TEXTURE_2D, textureList[textureID].texture);
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureList[textureID].width, 
	    	textureList[textureID].height, 0, gl.RGBA, gl.FLOAT, textureList[textureID].data );
	    gl.bindTexture(gl.TEXTURE_2D, null);
	},
	bindLightVolumeTexture: function() {
		this._params.magFilter = gl.LINEAR;
		this._params.minFilter = gl.LINEAR;

		// create texture and its texture parameter
		gl.activeTexture(gl.TEXTURE0 + 8);
    	gl.bindTexture(gl.TEXTURE_2D, textureList[8].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, this._params.magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, this._params.minFilter);

		gl.activeTexture(gl.TEXTURE0 + 9);
    	gl.bindTexture(gl.TEXTURE_2D, textureList[9].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, this._params.magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, this._params.minFilter);
		
		gl.activeTexture(gl.TEXTURE0 + 10);
    	gl.bindTexture(gl.TEXTURE_2D, textureList[10].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, this._params.magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, this._params.minFilter);
	},
	unbindLightVolumeTexture: function() {
		this._params.magFilter = gl.NEAREST;
		this._params.minFilter = gl.NEAREST;		
	
		gl.bindTexture(gl.TEXTURE_2D, textureList[8].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, this._params.magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, this._params.minFilter);

    	gl.bindTexture(gl.TEXTURE_2D, textureList[9].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, this._params.magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, this._params.minFilter);
		
    	gl.bindTexture(gl.TEXTURE_2D, textureList[10].texture);
		gl.texParameteri(this._params.target, gl.TEXTURE_MAG_FILTER, this._params.magFilter);
        gl.texParameteri(this._params.target, gl.TEXTURE_MIN_FILTER, this._params.minFilter);
	}
};