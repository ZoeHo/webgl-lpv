// geometry volume
// geometry volume composite of three parts,
// first geometry volume generaterd from RSM,
// second geometry volume generaterd from geometry buffer
// third geometry volume is selected from two of them.

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
	}
};