function vec2f() {
	var args = arguments;
	this.x = args[0] || 0;
	this.y = args[1] || 0;
}

vec2f.prototype = {
	create: function(x,y) {
		this.x = x;
		this.y = y;
	}
};

function vec3f() {
	var args = arguments;
	this.x = args[0] || 0;
	this.y = args[1] || 0;
	this.z = args[2] || 0;
}