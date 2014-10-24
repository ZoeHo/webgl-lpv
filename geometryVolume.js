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
	this.rsmNormal;
	this.width;
	this.height;
	this.cellSizez;
	this.projRsmtogvGrid = [0, 0, 0, 0];
	this.pointWeight;
	this.vpl = [];
	this.numVpls;
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

		/*this.createGvTexture("gvTexture0", this.gvTexture0);
		this.createGvTexture("gvTexture1", this.gvTexture1);
		this.createGvTexture("gvTexture2", this.gvTexture2);*/
		this.gvTexture0 = new Float32Array(this._dimx* this._dimy * this._dimz * 4);
		this.gvTexture1 = new Float32Array(this._dimx* this._dimy * this._dimz * 4);
		this.gvTexture2 = new Float32Array(this._dimx* this._dimy * this._dimz * 4);

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
		this._params.internalFormat = gl.LUMINANCE;
		this._params.sourceFormat = gl.LUMINANCE;
		this._params.type = gl.FLOAT;

		for(var i = 0; i < 4; i++) {
			var name = textureName;
			var channel = i;
			name = name.concat(channel);
			
			var texImage = new Texture(name, this._params, this._dimx * this._dimz, this._dimy);
			sourceTex.push(texImage);
		}
		textureList.push(sourceTex);
	},
	injectBlocker2: function(depthNormalBuffer, vpls) {
		// clear gvTexture0 & texPos
		for(var i = 0; i < this._dimx* this._dimy * this._dimz * 4; i++) {
			this.gvTexture0[i] = 0.0;
			this.texPos[i] = 0;
		}

		var blockerdata = new blockerData();
		// get blocker depth normal texture
		Texture.getUnsignedTexImage(5);
		blockerdata.blockerTex = textureList[5].data;
		// get blocker buffer data
		blockerdata.width = depthNormalBuffer.getBlockerBufferWidth();
		blockerdata.height = depthNormalBuffer.getBlockerBufferHeight();
		blockerdata.nearFarPlane = depthNormalBuffer.getNearFarPlane();
		blockerdata.invProj = depthNormalBuffer.getInvProj();
		blockerdata.viewtoGridMatrix = depthNormalBuffer.getViewtoGridMatirx();
		blockerdata.gridOrig = this._bbox.getMin();
		var bbsize = this._bbox.calculateDim();
		blockerdata.gridSize.push(bbsize[0], bbsize[1], this._cellSize[2]);
		blockerdata.cellArea = this._cellSize[0] * this._cellSize[1];
		blockerdata.vpl = bufferList[2]._data;
		blockerdata.numVpls = depthNormalBuffer.getBlockerBufferWidth() * depthNormalBuffer.getBlockerBufferHeight();

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

		this.vertexShader(blockerdata);
	},
	vertexShader: function(blockerdata) {
		// test data!
		//blockerdata.blockerTex = a;

		// gv0 texture vertex shader
		// set instanceID as blocker_depth_normal texture (size) index
		for(var i = 0; i < blockerdata.numVpls; i++) {
			// sample depth and normal from geometry buffer
			var samplePos = this.instanceIDtoPosition(i, blockerdata.width, blockerdata.height);
			samplePos[0] += blockerdata.vpl[0] + ( 0.5 / blockerdata.width );
			samplePos[1] += blockerdata.vpl[1] + ( 0.5 / blockerdata.height );
			
			var t = this.getTexValue(blockerdata.blockerTex, samplePos, blockerdata.width, blockerdata.height);
			
			// get view space depth
			// exclude non depth value point
			if( (t[0] != 255) || (t[1] != 255) || (t[2] != 255) || (t[3] != 255) ) {
				var depth = t[0] / 255.0 + t[1] / 65025.0;
				var depth2 = depth;
				depth = depth * blockerdata.nearFarPlane[1] + blockerdata.nearFarPlane[0];
				
				// position in view space
				var viewPos = [ 2.0 * samplePos[0] - 1.0, 2.0 * samplePos[1] - 1.0, -1.0 ];
				viewPos[0] = viewPos[0] * blockerdata.invProj[0];
				viewPos[1] = viewPos[1] * blockerdata.invProj[1];
				
				viewPos[0] = viewPos[0] * depth;
				viewPos[1] = viewPos[1] * depth;
				viewPos[2] = viewPos[2] * depth;
				
				// transform to grid space
				var gridPos = [];
				var temp = [];
				mat4.multiplyVec4(blockerdata.viewtoGridMatrix, 
								  [viewPos[0], viewPos[1], viewPos[2], 1.0], temp);
				gridPos = [temp[0], temp[1], temp[2]];
				
				var pos = [];
				pos[0] = (gridPos[0] - blockerdata.gridOrig[0]) / blockerdata.gridSize[0];
				pos[1] = (gridPos[1] - blockerdata.gridOrig[1]) / blockerdata.gridSize[1];
				pos[2] = (gridPos[2] - blockerdata.gridOrig[2]) / blockerdata.gridSize[2];
				
				var glPosition = [];
				if( depth2 == 0.0 ) {
					glPosition = [-1000.0, -1000.0, 0.0, 1.0];
				} else {
					glPosition = [pos[0], pos[1], pos[2], 1.0];
				}

				// blocker depth normal : normal (in [-1,1])
				var viewSpacNormal = [];
				viewSpacNormal[0] = 2.0 * (t[2]/255.0 - 0.5);
				viewSpacNormal[1] = 2.0 * (t[3]/255.0 - 0.5);
				
				var n2 = [];
				n2[0] = viewSpacNormal[0] * viewSpacNormal[0];
				n2[1] = viewSpacNormal[1] * viewSpacNormal[1];
				
				// if normalz < 0, sqrt return NaN.
				var normalz = (1.0 - n2[0] - n2[1]);
				viewSpacNormal[2] = Math.sqrt(normalz);

				// normal in grid space
				var normal = [];
				var tempMat3;
				tempMat3 = mat4.toMat3(blockerdata.viewtoGridMatrix, tempMat3);
				mat3.multiplyVec3(tempMat3, viewSpacNormal, normal);
				
				// surfel size in world space i.e. "unproject pixel" from clip space back to world
				var surfel = [];
				surfel[0] = 2.0 * depth * blockerdata.invProj[0] / blockerdata.width;
				surfel[1] = 2.0 * depth * blockerdata.invProj[1] / blockerdata.height;
				var surfelArea = surfel[0] * surfel[1];

				// point weight = how much of the cell is covered by this surfel
				var pointWeight = surfelArea / blockerdata.cellArea;	
				var blocker = [], blockerNormal;
				blockerNormal = this.createBlocker(normal);
				blocker[0] = blockerNormal[0] * pointWeight;
				blocker[1] = blockerNormal[1] * pointWeight;
				blocker[2] = blockerNormal[2] * pointWeight;
				blocker[3] = blockerNormal[3] * pointWeight;
				
				// geometry shader & fragment shader
				// input blocker & fill color texture.
				this.geometryShader( glPosition, blocker, this.gvTexture0 );
			}
		}
	},
	instanceIDtoPosition: function(instanceID, width, height) {
		// translate instanceID to texture position
		var pos = [];
		pos.push(instanceID % width, Math.floor(instanceID / width));
		pos = [pos[0]/width, pos[1]/height];
		return pos;
	},
	getTexValue: function(texImage, samplePos, width, height) {
		// Use sample position to lookup color from texture
		var texelValue = [0, 0, 0, 0];
		
		// translate pos from (0, 0) - (1, 1) to (0, 0) - (512,288)
		var y = Math.floor(samplePos[1] * height);
		y = y * width * 4;
		var x = Math.floor(samplePos[0] * width);
		x = x * 4;

		texelValue[0] = texImage[ y + x ];
		texelValue[1] = texImage[ y + x + 1 ];
		texelValue[2] = texImage[ y + x + 2 ];
		texelValue[3] = texImage[ y + x + 3 ];

		return texelValue;
	},
	createBlocker: function(normal) {
		var blocker = [];
		// clamped cosine function (see jose.pdf page 5)
		var zhFirstBand = 0.88622689;
		var zhSecondBand = 1.0233266;

		var zhCoeff = [];
		if(Math.abs(normal[1]) < 0.99) {
			zhCoeff = this.rotateZhCoeff(normal);
			blocker = [zhFirstBand, zhCoeff[0], zhCoeff[1], zhCoeff[2]];
		} else {
			var sign;
			if(normal[1] > 0.0) { sign = 1.0; }
			else if(normal[1] == 0.0) { sign = 0.0; }
			else if(normal[1] < 0.0) { sign = -1.0; }
			else { sign = 0.0; } // if normal.y() is NaN, set sign as zero.
			blocker = [zhFirstBand, 0.0, zhSecondBand * sign, 0.0];
		}
		return blocker;
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
	geometryShader: function(glPositionIn, blocker, colorTex) {
		// geometry volume inject blocker from depth normal buffer
		// this is geometry & fragment shader
		// receive blocker to fill the color texture
		var glPosition = [glPositionIn[0] * 2.0 - 1.0,
						  glPositionIn[1] * 2.0 - 1.0,
						  0.0, 1.0];

		// gl_Layer = int(gl_PositionIn[0].z);
		// equal to calcuate floor(glPositionIn.z())
		var layer = Math.floor(glPositionIn[2]);
		
		var blockingPotential = blocker;
		// map to screen view position
		var xpos, ypos, x, y;
		xpos = (glPosition[0] + 1) * this._dimx * 0.5;
		ypos = (glPosition[1] + 1) * this._dimy * 0.5;
		x = Math.floor(xpos);
		y = Math.floor(ypos);

		// add a minimum value, let the point which enough near next x & y point project to its position .
		if(Math.ceil(xpos) - xpos < 0.00196) {
			x = x + 1;
		}
		if(Math.ceil(ypos) - ypos < 0.00196) {
			y = y + 1;
		}		
		
		// store hit position in texture
		var index = (layer* this._dimx * this._dimy * 4) + (y * this._dimx * 4) + (x * 4);
		if(blocker[0] != 0.0) {
			this.texPos[index + 0] += 1.0;
		}
		if(blocker[1] != 0.0) {
			this.texPos[index + 1] += 1.0;
		}
		if(blocker[2] != 0.0) {
			this.texPos[index + 2] += 1.0;
		}
		if(blocker[3] != 0.0) {
			this.texPos[index + 3] += 1.0;
		}
		
		// max blocker accumulated amount in one cell is 2048
		if(this.texPos[index + 0] <= 2048) {
			colorTex[index + 0] += blocker[0];
		}
		if(this.texPos[index + 1] <= 2048) {
			colorTex[index + 1] += blocker[1];
		}
		if(this.texPos[index + 2] <= 2048) {
			colorTex[index + 2] += blocker[2];
		}
		if(this.texPos[index + 3] <= 2048) {
			colorTex[index + 3] += blocker[3];
		}
	},

	// inject2 - inject blocker from rsm
	injectBlocker: function(rsm, vpls) {
		var blockerdata = new rsmBlockerData();

		// get blocker buffer data from rsm
		blockerdata.width = rsm.getWidth();
		blockerdata.height = rsm.getHeight();

		blockerdata.cellSizez = this._cellSize[2];
		
		/*
		// needs to do get rsm depth & normal texture
		// get rsm_depth texture [sampler: depth_tex] ( depth texture is one channel )
		// get rsm_normal texture [sampler: normal_tex] ( normal texture is two channel )
		*/

		// geometry volume grid dimension = light grid dimension - 1
		// projRsmtogvGrid.zw - get texel center
		blockerdata.projRsmtogvGrid[0] = (this._dimx - 1) / this._dimx;
		blockerdata.projRsmtogvGrid[1] = (this._dimy - 1) / this._dimy;
		blockerdata.projRsmtogvGrid[2] = 0.5 / (this._dimx);
		blockerdata.projRsmtogvGrid[3] = 0.5 / (this._dimy);

		// number of cells in one slice of light grid
		var tcells = (this._dimx - 1) * (this._dimy - 1);
		var t = rsm.getWidth() * rsm.getHeight();
		blockerdata.pointWeight = tcells / t;
		blockerdata.vpl = bufferList[2]._data;
		blockerdata.numVpls = rsm.getWidth() * rsm.getHeight();
		
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this._dimx, this._dimy);
        // glEnable(GL_BLEND);
		// glBlendFunc(GL_ONE, GL_ONE);
		

		window.o = blockerdata;
	}
};