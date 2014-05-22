// vertex shader
// attribute position is pos in world space
// attribute normal is normal in world space
// gl_Position = mvp_matrix * position : transform to RSM
// grid_space_normal = vec2(grid_space3x3 * normal) : transform normal to grid space
// float z = (grid_space3x3 * vec3(position)).z : transform position to grid space
var rsmFragmentShader = '\
	attribute vec4 position;\
	attribute vec3 normal;\
	attribute vec2 texcoord;\
	\
	varying grid_space_normal;\
	varying vec2 tc;\
	varying float depth;\
	\
	uniform mat4 projection_matrix;\
	uniform mat4 grid_space;\
	uniform float grid_origin_z;\
	\
	void main() {\
		mat4 mvp_matrix = projection_matrix * grid_space;\
		\
		gl_Position = mvp_matrix * position;\
		\
		mat3 grid_space3x3 = mat3(grid_space);\
		\
		grid_space_normal = vec2(grid_space3x3 * normal);\
		\
		tc = texcoord;\
		\
		float z = (grid_space3x3 * vec3(position)).z;\
		depth = z - grid_origin_z;\
	}';

// fragment shader
// color, normal in grid_space, depth in grid space into RSM
var rsmVertexShader = '\
	varying vec2 grid_space_normal;\
	varying vec2 tc;\
	varying float depth;\
	\
	uniform sampler2D diffuse_tex;\
	uniform vec4 material_color;\
	\
	void main() {\
		vec3 diffuse = texture2D(diffuse_tex, tc).rgb * material_color.a + material_color.rgb;\
		gl_FragData[0].rg = grid_space_normal;
		gl_FragData[1].rgb = diffuse;\
		gl_FragData[2].r = depth;\
	}';