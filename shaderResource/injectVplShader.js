// inject vpls shader
// inject virtual point lights to light volume

var injectVplFragmentShader = 
	" precision mediump float;															\n" +
	" varying vec2 texcoord;															\n" +
	" varying vec3 normal;																\n" +
	" 																					\n" +
	" uniform sampler2D color_tex;														\n" +
	" uniform float point_weight;														\n" +
	" uniform vec3 light_direction;															\n" +
	" uniform float channel;															\n" +
	" 																					\n" +
	" vec3 rotate_zh_cone_coeff(in vec3 dir) { 											\n" +
	" 	const float zh_second_band = 1.0233266;											\n" +
	" 																					\n" +
	" 	vec2 theta12_cs = normalize(dir.xz);											\n" +
	" 	vec2 phi12_cs = vec2(sqrt(1.0 - dir.y * dir.y), dir.y); 						\n" +
	" 																					\n" +
	" 	vec3 rotated_coeffs;															\n" +
	" 																					\n" +
	" 	rotated_coeffs.x = zh_second_band * phi12_cs.x * theta12_cs.y; 					\n" +
	" 	rotated_coeffs.y = zh_second_band * phi12_cs.y; 								\n" +
	" 	rotated_coeffs.z = -zh_second_band * phi12_cs.x * theta12_cs.x;					\n" +
	" 																					\n" +
	" 	return rotated_coeffs;															\n" +
	" }																					\n" +
	" 																					\n" +
	" vec4 create_vpl(in vec3 normal) {													\n" +
	" 	// clamped cosine function (see jose.pdf page 5)								\n" +
	" 	const float zh_first_band = 0.88622689;											\n" +
	" 	const float zh_second_band = 1.0233266;											\n" +
	" 																					\n" +
	" 	return (abs(normal.y) < 0.99) ? vec4(zh_first_band, rotate_zh_cone_coeff(normal) ) : vec4(zh_first_band, 0.0, zh_second_band * sign(normal.y), 0.0);	\n" +
	" }																					\n" +
	" 																					\n" +
	" void main() {																		\n" +
	" 	float intensity = max(0.0, dot(-light_direction, normal) );						\n" +
	" 																					\n" +
	" 	// create virtual point light													\n" +
	" 	vec4 sh = create_vpl(normal);													\n" +
	" 	vec3 color = texture2D(color_tex, texcoord).rgb * intensity * point_weight;		\n" +
	" 																					\n" +
	" 	if(channel == 0.0) { gl_FragColor = color.r * sh; }								\n" +
	" 	if(channel == 1.0) { gl_FragColor = color.g * sh; }								\n" +
	" 	if(channel == 2.0) { gl_FragColor = color.b * sh; }								\n" +
	" }																					\n" ;


var injectVplVertexShader = 
	" //attribute vec2 position;														\n" +
	" attribute float instanceID;														\n" +
	" 																					\n" +
	" uniform sampler2D depth_tex;														\n" +
	" //uniform sampler2D normal_tex;													\n" +
	" uniform sampler2D normalx_tex;													\n" +
	" uniform sampler2D normaly_tex;													\n" +
	" 																					\n" +
	" uniform float width;																\n" +
	" uniform float height;																\n" +
	" uniform vec2 grid_size;															\n" +
	" uniform vec3 light_dir;															\n" +
	" uniform vec3 cell_size;															\n" +
	" uniform float dimSize;															\n" +
	" 																					\n" +
	" varying vec2 texcoord;															\n" +
	" varying vec3 normal;																\n" +
	" 																					\n" +
	" vec4 geometryPosition(in vec4 glPositionIn) {										\n" +
	" 	vec4 pos;																		\n" +
	"	float halfGridSize = 1.0 / dimSize * 0.5;										\n" +
	"	pos.x = (glPositionIn.x + floor(glPositionIn.z) /*+ halfGridSize*/) / (dimSize);	\n" +
	"	//pos.x = pos.x * 2.0 - 1.0 + halfGridSize;										\n" +
	"	pos.x = pos.x * 2.0 - 1.0;														\n" +
	"	pos.y = (glPositionIn.y /*+ halfGridSize*/) * 2.0 - 1.0;							\n" +
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
	" void main() {																		\n" +
	" 	// calc position to sample RSM textures											\n" +
	" 	vec2 pos = instanceID_to_pos(float(instanceID) ) + vec2(0.0, 0.0) + vec2(0.5 / width, 0.5 / height);	\n" +
	" 	float depth = texture2D(depth_tex, pos).r;										\n" +
	" 																					\n" +
	" 	// calculate position in the grid												\n" +
	" 	vec3 grid_space_pos = vec3(pos * grid_size, depth);								\n" +
	" 																					\n" +
	" 	// normal in grid space															\n" +
	" 	//norm.xy = vec2(texture2D(normal_tex, pos) );									\n" +
	"	vec3 norm;																		\n" +
	" 	norm.x = vec2(texture2D(normalx_tex, pos) ).r;									\n" +
	" 	norm.y = vec2(texture2D(normaly_tex, pos) ).r;									\n" +
	" 	vec2 n2 = norm.xy * norm.xy;													\n" +
	" 	norm.z = sqrt(1.0 - n2.x - n2.y);												\n" +
	" 																					\n" +
	" 	// move a bit away from the surface												\n" +
	" 	grid_space_pos = grid_space_pos + (norm + (-light_dir) ) * 0.25 * cell_size;	\n" +
	" 																					\n" +
	" 	grid_space_pos.xy /= grid_size; // create texture coords (0.0 - 1.0)			\n" +
	" 																					\n" +
	" 	// create clip space coords (-1.0 - 1.0)										\n" +
	" 	//grid_space_pos.xy = grid_space_pos.xy * 2.0 - 1.0;							\n" +
	"	// layer (0, 1 ... n)															\n" +
	" 	grid_space_pos.z = grid_space_pos.z / cell_size.z;								\n" +
	" 																					\n" +
	" 	texcoord = pos;																	\n" +
	" 	normal = norm;																	\n" +
	" 	gl_Position = geometryPosition(vec4(grid_space_pos, 1.0));						\n" +
	"	gl_PointSize = 1.0;																\n" +
	" }																					\n";