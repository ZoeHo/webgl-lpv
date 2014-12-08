// inject blocker2 shader
// inject blocker from depth normal buffer

var injectBlocker2FragmentShader =
	" precision mediump float;				\n" +
	" varying vec4 blocking_potential;		\n" +
	"										\n" +
	" void main() {							\n" +
	" 	gl_FragColor = blocking_potential;	\n" +
	" }										\n";

var injectBlocker2VertexShader = 
	" //attribute vec2 position; 																\n" +
	" attribute float instanceID;																\n" +
	"																						\n" +
	" uniform float width;																	\n" +
	" uniform float height;																	\n" +
	" uniform sampler2D depth_normal_tex;													\n" +
	" uniform vec2 near_far_plane;															\n" +
	" uniform vec2 inv_proj;																\n" +
	" uniform mat4 view_to_grid_mat;														\n" +
	" uniform vec3 grid_orig;																\n" +
	" uniform vec3 grid_size;																\n" +
	" uniform float cell_area;																\n" +
	" uniform float dimSize; 																\n" +
	"																							\n" +
	" varying vec4 blocking_potential;														\n" +
	"																						\n" +
	" vec4 geometryPosition(in vec4 glPositionIn) {											\n" +
	" 	vec4 pos;																			\n" +
	"	float halfGridSize = 1.0 / dimSize * 0.5;											\n" +
	"	pos.x = (glPositionIn.x + floor(glPositionIn.z)) / (dimSize);						\n" +
	"	//pos.x = pos.x * 2.0 - 1.0 + halfGridSize;											\n" +
	"	pos.x = pos.x * 2.0 - 1.0;															\n" +
	"	pos.y = glPositionIn.y * 2.0 - 1.0;													\n" +
	"	pos.z = 0.0;																		\n" +
	"	pos.w = 1.0;																		\n" +
	"	return pos;																			\n" +
	" }																						\n" +
	"																						\n" +
	" vec2 instanceID_to_pos(in float instanceID) {											\n" +
	" 	vec2 pos = vec2(mod(instanceID, width), floor(instanceID / width) );				\n" +
	" 	pos /= vec2(width, height);															\n" +
	" 	return pos;																			\n" +
	" }																						\n" +
	"																						\n" +
	" vec3 rotate_zh_cone_coeff(in vec3 dir) { 												\n" +
	" 	const float zh_second_band = 1.0233266;												\n" +
	"																						\n" +
	"	vec2 theta12_cs = normalize(dir.xz);												\n" +
	"	vec2 phi12_cs = vec2(sqrt(1.0 - dir.y * dir.y), dir.y); 							\n" +
	"																						\n" +
	"	vec3 rotated_coeffs; 																\n" +
	"																						\n" +
	"	rotated_coeffs.x = zh_second_band * phi12_cs.x * theta12_cs.y; 						\n" +
	"	rotated_coeffs.y = zh_second_band * phi12_cs.y; 									\n" +
	"	rotated_coeffs.z = -zh_second_band * phi12_cs.x * theta12_cs.x;						\n" +
	"																						\n" +	
	"	return rotated_coeffs;																\n" +
	" }																						\n" +
	"																						\n" +
	" vec4 create_blocker(in vec3 normal) {													\n" +
	" 	// clamped cosine function (see jose.pdf page 5)									\n" +
	" 	const float zh_first_band = 0.88622689;												\n" +
	" 	const float zh_second_band = 1.0233266;												\n" +
	"																						\n" +
	" 	return (abs(normal.y) < 0.99) ? vec4(zh_first_band, rotate_zh_cone_coeff(normal) ) : vec4(zh_first_band, 0.0, zh_second_band * sign(normal.y), 0.0);	\n" +
	" }																						\n" +
	"																						\n" +
	" void main() {																			\n" +
	" 	// sample depth and normal from geometry buffer										\n" +
	" 	vec2 sample_pos = instanceID_to_pos(float(instanceID)) + vec2(0.0, 0.0)/*position*/ + vec2(0.5 / width, 0.5 / height);	\n" +
	" 	vec4 t = texture2D(depth_normal_tex, sample_pos);									\n" +
	"																						\n" +
	"	// get view space depth																\n" +
	"	float depth = t.r + t.g / 255.0;													\n" +
	"																						\n" +
	"	float depth2 = depth;																\n" +
	"																						\n" +
	"	depth = depth * near_far_plane.y + near_far_plane.x;								\n"+
	"																						\n" +
	"	// position in view space															\n" +
	"	vec3 view_pos = vec3(2.0 * sample_pos - 1.0, -1.0);									\n" +
	"	view_pos.xy = view_pos.xy * inv_proj.xy; 											\n" +
	"	view_pos *= depth;																	\n" +
	"																						\n" +
	"	// transform to grid space															\n" +
	"	vec3 grid_pos = vec3(view_to_grid_mat * vec4(view_pos, 1.0) );						\n" +
	"																						\n" +
	"	vec3 pos = (grid_pos - grid_orig) / grid_size;										\n" +
	"																						\n" +
	"	if (depth2 == 0.0) {																\n" +
	"		// discard, no geometry															\n" +
	"		gl_Position = geometryPosition(vec4(-1000.0, -1000.0, 0, 1));					\n" +
	"	} else {																			\n" +
	"		gl_Position = geometryPosition(vec4(pos, 1.0));									\n" +
	"	}																					\n" +	
	"	gl_PointSize = 1.0;																	\n" +
	"																						\n" +
	"	vec3 view_space_normal;																\n" +
	"	view_space_normal.xy = 2.0 * (t.ba - 0.5);											\n" +
	"	vec2 n2 = view_space_normal.xy * view_space_normal.xy;								\n" +
	"	view_space_normal.z = sqrt(1.0 - n2.x - n2.y);										\n" +
	"	// normal in grid space																\n" +
	"	vec3 normal = mat3(view_to_grid_mat) * view_space_normal;							\n" +
	"																						\n" +
	"	// surfel size in world space i.e. unproject pixel from clip space back to world	\n" +
	"	vec2 surfel = vec2(2.0 * depth) * inv_proj.xy / vec2(width, height);				\n" +
	"																						\n" +
	"	float surfel_area = surfel.x * surfel.y;											\n" +
	"																						\n" +
	"	// point weight = how much of the cell is covered by this surfel					\n" +
	"	float point_weight = surfel_area / cell_area;										\n" +
	"																						\n" +
	" 	blocking_potential = create_blocker(normal) * point_weight;							\n" +
	" }																						\n";