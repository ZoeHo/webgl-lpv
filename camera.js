function camera(pos, rot) {
	this.rot = rot || [0.0, 0.0, 0.0];
	this.pos = pos || [0.0, 0.0, 0.0];
	this.state = "camIdle";
	this.cameraDirty = true;
	this.cachedMatrix = mat4.create();
}

camera.prototype = {
	moveForward: function() {
		this.pos[2] += 0.5;
	},
	moveBackward: function() {
		this.pos[2] -= 0.5;
	},
	moveLeft: function() {
		this.pos[0] += 0.5;
	},
	moveRight: function() {
		this.pos[0] -= 0.5;
	},
	rotateLeft: function() {
		this.rot[1] += 1.0 * Math.PI;
	},
	rotateRight: function() {
		this.rot[1] -= 1.0 * Math.PI;
	},
	rotateUp: function() {
		this.rot[0] += 1.0 * Math.PI;
	},
	rotateDown: function() {
		this.rot[0] -= 1.0 * Math.PI;
	}
};