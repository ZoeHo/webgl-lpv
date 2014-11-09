// vertex shader
// attribute position is pos in world space
// attribute normal is normal in world space
// gl_Position = mvp_matrix * position : transform to RSM
// grid_space_normal = vec2(grid_space3x3 * normal) : transform normal to grid space
// float z = (grid_space3x3 * vec3(position)).z : transform position to grid space
var rsmFragmentShader =
	" precision mediump float;																	\n" +
	" varying vec2 grid_space_normal;															\n" +
	" varying vec2 tc;																			\n" +
	" varying float depth;																		\n" +
	" 																							\n" +
	" uniform sampler2D diffuse_tex;															\n" +
	" uniform vec4 material_color;																\n" +
	" 																							\n" +
	" void main() {																				\n" +
	" 	vec3 diffuse = texture2D(diffuse_tex, tc).rgb * material_color.a + material_color.rgb;	\n" +
	" 	gl_FragData[0].rg = grid_space_normal;													\n" +
	" 	gl_FragData[1].rgb = diffuse;															\n" +
	" 	gl_FragData[2].r = depth;																\n" +
	" }																							\n";

// fragment shader
// color, normal in grid_space, depth in grid space into RSM
var rsmVertexShader =
	" attribute vec4 position;																	\n" +
	" attribute vec3 normal;																	\n" +
	" attribute vec2 texcoord;																	\n" +
	" attribute vec4 color;																		\n" +
	" varying vec4 materialColor;																\n" +
	" 																							\n" +
	" varying vec2 grid_space_normal;															\n" +
	" varying vec2 tc;																			\n" +
	" varying float depth;																		\n" +
	" 																							\n" +
	" uniform mat4 projection_matrix;															\n" +
	" uniform mat4 grid_space;																	\n" +
	" uniform float grid_origin_z;																\n" +
	" 																							\n" +
	" void main() {																				\n" +
	" 	mat4 mvp_matrix = projection_matrix * grid_space;										\n" +
	" 																							\n" +
	" 	gl_Position = mvp_matrix * position;													\n" +
	" 																							\n" +
	" 	mat3 grid_space3x3 = mat3(grid_space);													\n" +
	" 	 																						\n" +
	" 	grid_space_normal = vec2(grid_space3x3 * normal);										\n" +
	" 																							\n" +
	" 	tc = texcoord;																			\n" +
	" 																							\n" +
	" 	float z = (grid_space3x3 * vec3(position)).z;											\n" +
	" 	depth = z - grid_origin_z;																\n" +
	"	materialColor = color;																	\n" +
	" }																							\n";

// Normal shader
var rsmNormalXFragmentShader =
	" precision mediump float;																	\n" +
	" varying vec2 grid_space_normal;															\n" +
	" 																							\n" +
	" float shift_right (float v, float amt) { 													\n" +
	"     v = floor(v) + 0.5; 																	\n" +
	"     return floor(v / exp2(amt)); 															\n" +
	" }																							\n" +
	" float shift_left (float v, float amt) { 													\n" +
	"     return floor(v * exp2(amt) + 0.5); 													\n" +
	" }																							\n" +
	" float mask_last (float v, float bits) { 													\n" +
	"     return mod(v, shift_left(1.0, bits)); 												\n" +
	" }																							\n" +
	" float extract_bits (float num, float from, float to) { 									\n" +
	"     from = floor(from + 0.5); to = floor(to + 0.5); 										\n" +
	"     return mask_last(shift_right(num, from), to - from); 									\n" +
	" }																							\n" +
	" vec4 encode_float (float val) { 															\n" +
	"     if (val == 0.0) return vec4(0, 0, 0, 0); 												\n" +
	"     float sign = val > 0.0 ? 0.0 : 1.0; 													\n" +
	"     val = abs(val); 																		\n" +
	"     float exponent = floor(log2(val)); 													\n" +
	"     float biased_exponent = exponent + 127.0; 											\n" +
	"     float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0; 							\n" +
	"     float t = biased_exponent / 2.0; 														\n" +
	"     float last_bit_of_biased_exponent = fract(t) * 2.0; 									\n" +
	"     float remaining_bits_of_biased_exponent = floor(t); 									\n" +
	"     float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0; 								\n" +
	"     float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0; 								\n" +
	"     float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0; \n" +
	"     float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0; 			\n" +
	"     return vec4(byte4, byte3, byte2, byte1); 												\n" +
	" }																							\n" +
	" 																							\n" +
	" void main() {																				\n" +
	" 	gl_FragData[0] = encode_float(grid_space_normal.x);//vec4(grid_space_normal.x, 1.0, 1.0, 1.0);								\n" +
	" }													 										\n";

var rsmNormalYFragmentShader =
	" precision mediump float;																	\n" +
	" varying vec2 grid_space_normal;															\n" +
	" 																							\n" +
	" float shift_right (float v, float amt) { 													\n" +
	"     v = floor(v) + 0.5; 																	\n" +
	"     return floor(v / exp2(amt)); 															\n" +
	" }																							\n" +
	" float shift_left (float v, float amt) { 													\n" +
	"     return floor(v * exp2(amt) + 0.5); 													\n" +
	" }																							\n" +
	" float mask_last (float v, float bits) { 													\n" +
	"     return mod(v, shift_left(1.0, bits)); 												\n" +
	" }																							\n" +
	" float extract_bits (float num, float from, float to) { 									\n" +
	"     from = floor(from + 0.5); to = floor(to + 0.5); 										\n" +
	"     return mask_last(shift_right(num, from), to - from); 									\n" +
	" }																							\n" +
	" vec4 encode_float (float val) { 															\n" +
	"     if (val == 0.0) return vec4(0, 0, 0, 0); 												\n" +
	"     float sign = val > 0.0 ? 0.0 : 1.0; 													\n" +
	"     val = abs(val); 																		\n" +
	"     float exponent = floor(log2(val)); 													\n" +
	"     float biased_exponent = exponent + 127.0; 											\n" +
	"     float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0; 							\n" +
	"     float t = biased_exponent / 2.0; 														\n" +
	"     float last_bit_of_biased_exponent = fract(t) * 2.0; 									\n" +
	"     float remaining_bits_of_biased_exponent = floor(t); 									\n" +
	"     float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0; 								\n" +
	"     float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0; 								\n" +
	"     float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0; \n" +
	"     float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0; 			\n" +
	"     return vec4(byte4, byte3, byte2, byte1); 												\n" +
	" }																							\n" +
	"																							\n" +
	" void main() {																				\n" +
	" 	gl_FragData[0] = encode_float(grid_space_normal.y);//vec4(grid_space_normal.y, 1.0, 1.0, 1.0);								\n" +
	" }													 										\n";

// Diffuse shader
var rsmDiffuseFragmentShader =
	" precision mediump float;																	\n" +
	" varying vec2 tc;																			\n" +
	" varying vec4 materialColor;																\n" +
	" 																							\n" +
	" uniform sampler2D diffuse_tex;															\n" +
	" /*uniform vec4 material_color;*/															\n" +
	" 																							\n" +
	" void main() {																				\n" +
	" 	//vec3 diffuse = texture2D(diffuse_tex, tc).rgb * material_color.a + material_color.rgb;\n" +
	" 	//gl_FragData[0].rgb = diffuse;	 														\n" +
	"	vec3 diffuse = texture2D(diffuse_tex, tc).rgb * materialColor.a + materialColor.rgb;	\n"+
	"	gl_FragData[0] = vec4(materialColor.rgb, 1.0);											\n"+
	" } 																						\n";

// Depth shader
var rsmDepthFragmentShader =
	" precision mediump float;																	\n" +
	" varying float depth;																		\n" +
	" 																							\n" +
	" float shift_right (float v, float amt) { 													\n" +
	"     v = floor(v) + 0.5; 																	\n" +
	"     return floor(v / exp2(amt)); 															\n" +
	" }																							\n" +
	" float shift_left (float v, float amt) { 													\n" +
	"     return floor(v * exp2(amt) + 0.5); 													\n" +
	" }																							\n" +
	" float mask_last (float v, float bits) { 													\n" +
	"     return mod(v, shift_left(1.0, bits)); 												\n" +
	" }																							\n" +
	" float extract_bits (float num, float from, float to) { 									\n" +
	"     from = floor(from + 0.5); to = floor(to + 0.5); 										\n" +
	"     return mask_last(shift_right(num, from), to - from); 									\n" +
	" }																							\n" +
	" vec4 encode_float (float val) { 															\n" +
	"     if (val == 0.0) return vec4(0, 0, 0, 0); 												\n" +
	"     float sign = val > 0.0 ? 0.0 : 1.0; 													\n" +
	"     val = abs(val); 																		\n" +
	"     float exponent = floor(log2(val)); 													\n" +
	"     float biased_exponent = exponent + 127.0; 											\n" +
	"     float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0; 							\n" +
	"     float t = biased_exponent / 2.0; 														\n" +
	"     float last_bit_of_biased_exponent = fract(t) * 2.0; 									\n" +
	"     float remaining_bits_of_biased_exponent = floor(t); 									\n" +
	"     float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0; 								\n" +
	"     float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0; 								\n" +
	"     float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0; \n" +
	"     float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0; 			\n" +
	"     return vec4(byte4, byte3, byte2, byte1); 												\n" +
	" }																							\n" +
	"																							\n" +
	" void main() {																				\n" +
	" 	gl_FragData[0] = encode_float(depth);//vec4(depth, 1.0, 1.0, 1.0);											\n" +
	" }																							\n";	