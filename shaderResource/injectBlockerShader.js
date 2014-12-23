// inject blocker shader
// inject blocker from rsm depth & normal buffer

var injectBlockerFragmentShader =
	" precision mediump float;															\n" +
	" varying vec4 blocking_potential;													\n" +
	"																					\n" +
	" void main() {																		\n" +
	" 	gl_FragColor = blocking_potential;												\n" +
	" }																					\n";

var injectBlockerVertexShader = 
	" //attribute vec2 position;														\n" +
	" attribute float instanceID;														\n" +
	" uniform float width;																\n" +
	" uniform float height;																\n" +
	" uniform vec4 proj_rsm_to_gv_grid;													\n" +
	" uniform sampler2D depth_tex;														\n" +
	" uniform sampler2D normalx_tex; 													\n" +
	" uniform sampler2D normaly_tex; 													\n" +
	" uniform float cell_size_z;														\n" +
	" uniform float point_weight;														\n" +
	" uniform float dimSize; 															\n" +
	" 																					\n" +
	" varying vec4 blocking_potential;													\n" +
	" 																					\n" +
	" vec4 geometryPosition(in vec4 glPositionIn) {										\n" +
	" 	vec4 pos;																		\n" +
	"	float halfGridSize = 1.0 / dimSize * 0.5;										\n" +
	"	pos.x = (glPositionIn.x + floor(glPositionIn.z) + halfGridSize) / (dimSize);	\n" +
	"	//pos.x = pos.x * 2.0 - 1.0 + halfGridSize;										\n" +
	"	pos.x = pos.x * 2.0 - 1.0;														\n" +
	"	pos.y = (glPositionIn.y + halfGridSize) * 2.0 - 1.0;							\n" +
	"	pos.z = 0.0;																	\n" +
	"	pos.w = 1.0;																	\n" +
	"	return pos;																		\n" +
	" }																					\n" +
	" 																					\n" +
	" vec2 instanceID_to_pos(in float instanceID) {										\n" +
	" 	vec2 pos = vec2(mod(instanceID, width), floor(instanceID / width) );			\n" +
	" 	pos /= vec2(width, height);														\n" +
	" 	return pos;																		\n" +
	" }																					\n" +
	" 																					\n" +
	" vec3 rotate_zh_cone_coeff(in vec3 dir) { 											\n" +
	" 	const float zh_second_band = 1.0233266;											\n" +
	" 																					\n" +
	"	vec2 theta12_cs = normalize(dir.xz);											\n" +
	"	vec2 phi12_cs = vec2(sqrt(1.0 - dir.y * dir.y), dir.y); 						\n" +
	" 																					\n" +
	"	vec3 rotated_coeffs;															\n" +
	" 																					\n" +
	"	rotated_coeffs.x = zh_second_band * phi12_cs.x * theta12_cs.y; 					\n" +
	"	rotated_coeffs.y = zh_second_band * phi12_cs.y; 								\n" +
	"	rotated_coeffs.z = -zh_second_band * phi12_cs.x * theta12_cs.x;					\n" +
	" 																					\n" +
	"	return rotated_coeffs; 															\n" +
	" }																					\n" +
	" 																					\n" +
	" vec4 create_blocker(in vec3 normal) {												\n" +
	" 	// clamped cosine function (see jose.pdf page 5)								\n" +
	" 	const float zh_first_band = 0.88622689;											\n" +
	" 	const float zh_second_band = 1.0233266;											\n" +
	" 																					\n" +
	"	return (abs(normal.y) < 0.99) ? vec4(zh_first_band, rotate_zh_cone_coeff(normal) ) : vec4(zh_first_band, 0.0, zh_second_band * sign(normal.y), 0.0); 		\n" +
	" } 																				\n" +
	" 																					\n" +
	" void main() {																		\n" +
	" 	// sample depth and normal from RSM												\n" +
	" 	vec2 sample_pos = instanceID_to_pos(float(instanceID) ) + vec2(0.0, 0.0)/*position*/ + vec2(0.5 / width, 0.5 / height);										\n" +
	" 	float depth = texture2D(depth_tex, sample_pos).r;								\n" +
	" 	vec3 normal;																	\n" +
	" 	//normal.xy = texture2D(normal_tex, sample_pos).xy;								\n" +
	" 	normal.x = texture2D(normalx_tex, sample_pos).x;								\n" +
	" 	normal.y = texture2D(normaly_tex, sample_pos).x;								\n" +
	" 																					\n" +
	"	if (vec2(depth) == vec2(0.0, 0.0) ) {											\n" +
	"		// discard, no geometry here												\n" +
	"		gl_Position = geometryPosition(vec4(-1000.0, -1000.0, 0, 1));				\n" +
	"	} else {																		\n" +
	"		// calculate position in geometry volume									\n" +
	"		vec4 pos = vec4(proj_rsm_to_gv_grid.xy * sample_pos + proj_rsm_to_gv_grid.zw, (depth + cell_size_z / 2.0) / cell_size_z, 1.0); 		\n" +
	"		gl_Position = geometryPosition(pos);										\n" +
	"	}																				\n" +
	"	gl_PointSize = 1.0;																\n" +
	" 																					\n" +
	" 	vec2 n2 = normal.xy * normal.xy;												\n" +
	" 	normal.z = sqrt(1.0 - n2.x - n2.y);												\n" +
	" 	blocking_potential = create_blocker(normal) * point_weight;						\n" +
	" }																					\n";