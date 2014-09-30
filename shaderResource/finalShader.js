/*// final shader - indirect light shader
// not define NO_INDIRECT_LIGHT	
var finalILFragmentShader = '\
	precision mediump float;\
	uniform sampler2D diffuse_tex;\
	uniform sampler2D indirect_light;\
	\
	uniform sampler2D rsm_depth;\
	uniform vec4 material_color;\
	\
	varying vec2 tc;\
	varying float direct;\
	varying vec3 indirect_light_tc;\
	varying vec3 rsm_pos;\
	\
	void main() {\
		float depth = texture2D(rsm_depth, rsm_pos.xy).r;\
		\
		float shadow = step(depth, rsm_pos.z + 0.5);\
		\
		const float ambient = 0.05;\
		const float one_minus_ambient = 1.0 - ambient;\
		\
		vec3 light = vec3(direct) * shadow + vec3(ambient);\
		vec3 indirect = texture2DProj(indirect_light, indirect_light_tc.xyzz).rgb;\
		light += indirect * one_minus_ambient;\
		\
		vec3 color = texture2D(diffuse_tex, tc).rgb * material_color.a + material_color.rgb;\
		\
		vec3 c = color * light;\
		\
		gl_FragColor.rgb = c;\
	}';

var finalILVertexShader = '\
	attribute vec4 position;\
	attribute vec3 normal;\
	attribute vec2 texcoord;\
	\
	uniform mat4 projection_matrix;\
	uniform mat4 view_matrix;\
	uniform mat4 light_space_matrix;\
	uniform mat4 rsm_matrix;\
	uniform float grid_origin_z;\
	\
	varying vec2 tc;\
	varying float direct;\
	varying vec3 indirect_light_tc;\
	varying vec3 rsm_pos;\
	\
	void main() {\
		mat4 mvp_matrix = projection_matrix * view_matrix;\
		vec4 clip_pos = mvp_matrix * position;\
		gl_Position = clip_pos;\
		\
		indirect_light_tc.xy = 0.5 * (clip_pos.xy + clip_pos.ww);\
		indirect_light_tc.z = clip_pos.w;\
		\
		mat3 grid_space = mat3(light_space_matrix);\
		vec3 light_space_normal = grid_space * normal;\
		\
		direct = clamp(light_space_normal.z * 0.5, 0.0, 1.0);\
		tc = texcoord;\
		\
		rsm_pos.xy - (rsm_matrix * position).xy;\
		rsm_pos.xy = 0.5 * rsm_pos.xy + 0.5;\
		\
		float z = (grid_space * vec3(position)).z;\
		z = z - grid_origin_z;\
		\
		rsm_pos.z = z;\
	}';


var finalNILFragmentShader = '\
	precision mediump float;\
	uniform sampler2D diffuse_tex;\
	uniform sampler2D rsm_depth;\
	\
	uniform vec4 material_color;\
	\
	varying vec2 tc;\
	varying float direct;\
	varying vec3 rsm_pos;\
	\
	void main()\
	{\
		float depth = texture2D(rsm_depth, rsm_pos.xy).r;\
		\
		float shadow = step(depth, rsm_pos.z + 0.5);\
		\
		const float ambient = 0.05;\
		const float one_minus_ambient = 1.0 - ambient;\
		\
		vec3 light = vec3(direct) * shadow + vec3(ambient);\
		\
		vec3 color = texture2D(diffuse_tex, tc).rgb * material_color.a + material_color.rgb;\
		\
		vec3 c = color * light;\
		\
		gl_FragColor.rgb = c;\
	}';

var finalNILVertexShader = '\
	attribute vec4 position;\
	attribute vec3 normal;\
	attribute vec2 texcoord;\
	\
	uniform mat4 projection_matrix;\
	uniform mat4 view_matrix;\
	uniform mat4 light_space_matrix;\
	uniform mat4 rsm_matrix;\
	uniform float grid_origin_z;\
	\
	varying vec2 tc;\
	varying float direct;\
	varying vec3 rsm_pos;\
	\
	void main()\
	{\
	    mat4 mvp_matrix = projection_matrix * view_matrix;\
		\
		vec4 clip_pos = mvp_matrix * position;\
		\
	 	gl_Position = clip_pos;\
	 	\
		mat3 grid_space = mat3(light_space_matrix);\
	 	vec3 light_space_normal = grid_space * normal;\
		direct = clamp(light_space_normal.z * 0.5, 0.0, 1.0);\
	 	tc = texcoord;\
		\
		rsm_pos.xy = (rsm_matrix * position).xy;\
		rsm_pos.xy = 0.5 * rsm_pos.xy + 0.5;\
		\
		float z = (grid_space * vec3(position) ).z;\
		z = z - grid_origin_z;\
		\
		rsm_pos.z = z;\
	}';
*/
var finalVertexShader =
    " precision mediump float;										\n" +
    " attribute vec4 position;										\n" +
    " attribute vec3 normal;										\n" +
    " attribute vec2 texcoord;										\n" +
    " 																\n" +
    " uniform mat4 projection_matrix;								\n" +
    " uniform mat4 view_matrix;										\n" +
    " uniform mat4 light_space_matrix;								\n" +
    " uniform mat4 rsm_matrix;										\n" +
    " uniform float grid_origin_z;									\n" +
    " 																\n" +
    " varying vec2 tc;												\n" +
    " varying float direct;											\n" +
    " # ifndef NO_INDIRECT_LIGHT									\n" +
    " varying vec3 indirect_light_tc;								\n" +
    " # endif														\n" +
    " varying vec3 rsm_pos;											\n" +
    " 																\n" +
    " void main() {													\n" +
    " 	mat4 mvp_matrix = projection_matrix * view_matrix;			\n" +
    " 																\n" +
    " 	vec4 clip_pos = mvp_matrix * position;						\n" +
    " 																\n" +
    " 	gl_Position = clip_pos;										\n" +
    " 																\n" +
    " 	# ifndef NO_INDIRECT_LIGHT									\n" +
    " 																\n" +
    " 	indirect_light_tc.xy = 0.5 * (clip_pos.xy + clip_pos.ww);	\n" +
    " 	indirect_light_tc.z = clip_pos.w;							\n" +
    " 	# endif														\n" +
    " 																\n" +
    " 	mat3 grid_space = mat3(light_space_matrix);					\n" +
    " 	vec3 light_space_normal = grid_space * normal;				\n" +
    " 																\n" +
    " 	direct = clamp(light_space_normal.z * 0.5, 0.0, 1.0);		\n" +
    " 	tc = texcoord;												\n" +
    " 																\n" +
    " 	rsm_pos.xy = (rsm_matrix * position).xy;					\n" +
    " 	rsm_pos.xy = 0.5 * rsm_pos.xy + 0.5;						\n" +
    " 																\n" +
    " 	float z = (grid_space * vec3(position)).z;					\n" +
    " 	z = z - grid_origin_z;										\n" +
    " 																\n" +
    " 	rsm_pos.z = z;												\n" +
    " } 															\n";

var finalFragmentShader =
    " precision mediump float;																\n" +
    " uniform sampler2D diffuse_tex;														\n" +
    " # ifndef NO_INDIRECT_LIGHT															\n" +
    " uniform sampler2D indirect_light;														\n" +
    " # endif																				\n" +
    " 																						\n" +
    " uniform sampler2D rsm_depth;															\n" +
    " 																						\n" +
    " uniform vec4 material_color;															\n" +
    " 																						\n" +
    " varying vec2 tc;																		\n" +
    " varying float direct;																	\n" +
    " # ifndef NO_INDIRECT_LIGHT															\n" +
    " varying vec3 indirect_light_tc;														\n" +
    " # endif																				\n" +
    " varying vec3 rsm_pos;																	\n" +
    " 																						\n" +
    " void main() {																			\n" +
    " 	float depth = texture2D(rsm_depth, rsm_pos.xy).r;									\n" +
    " 																						\n" +
    " 	float shadow = step(depth, rsm_pos.z + 0.5);										\n" +
    " 																						\n" +
    " 	const float ambient = 0.05;															\n" +
    " 	const float one_minus_ambient = 1.0 - ambient;										\n" +
    " 																						\n" +
    " 	vec3 light = vec3(direct) * shadow + vec3(ambient);									\n" +
    " 	# ifndef NO_INDIRECT_LIGHT															\n" +
    " 	vec3 indirect = texture2DProj(indirect_light, indirect_light_tc.xyzz).rgb;			\n" +
    " 	light += indirect * one_minus_ambient;												\n" +
    " 	# endif																				\n" +
    " 																						\n" +
    " 	vec3 color = texture2D(diffuse_tex, tc).rgb * material_color.a + material_color.rgb;\n" +
    " 																						\n" +
    " 	vec3 c = color * light;																\n" +
    " 																						\n" +
    " 	gl_FragColor.rgb = c;																\n" +
    " }																						\n";