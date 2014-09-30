// store buffer
function nbuffer() {
	this._name;
	this._data = [];
}

nbuffer.prototype = {
	create: function( name, buffer ){
		this._name = name;
		this._data = buffer;
	}
};