// store buffer
function nbuffer() {
	this._name;
	this._data = [];
	this._buffer;
}

nbuffer.prototype = {
	create: function(name, data, itemSize){
		this._name = name;
		this._data = data;

		this._buffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data), gl.STATIC_DRAW);
	    this._buffer.itemSize = itemSize;
	    this._buffer.numItems = this._data.length / this._buffer.itemSize;
	}
};