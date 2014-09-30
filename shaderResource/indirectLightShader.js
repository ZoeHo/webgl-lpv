// shader for indirect light buffer
// store light intensity as SH (spherical harmonics)
var indirectLightFragmentShader =
    " precision mediump float;															\n" +
    " uniform sampler2D incoming_red;													\n" +
    " uniform sampler2D incoming_green;													\n" +
    " uniform sampler2D incoming_blue;  												\n" +
    "																					\n" +
    " // offset to sample neighbouring cells											\n" +
    " # ifdef DAMPEN 																	\n" +
    " uniform vec3 offset_along_normal;													\n" +
    " # endif																			\n" +
    " varying vec3 light_space_normal;													\n" +
    " varying vec3 grid_coords;															\n" +
    "																					\n" +
    " vec4 sampleAs3DTexture( sampler2D texImage, vec3 grid_coords ) {                  \n" +
    "     // light volume dim = 16                                                      \n" +
    "     float half_texel_size = 0.0625 * 0.5;                                         \n" +
    "     grid_coords.z -= half_texel_size;                                             \n" +
    "     vec3 tex_coords = grid_coords;                                                \n" +
    "     vec2 trans_grid_coords;                                                       \n" +
    "                                                                                   \n" +
    "     // get vexel color in z0 slice                                                \n" +
    "     if( grid_coords.z >= 1.0 ) {                                                  \n" +
    "         tex_coords.z = fract( grid_coords.z );                                    \n" +
    "     }                                                                             \n" +
    "     if( grid_coords.z < 0.0 ) {                                                   \n" +
    "         tex_coords.z = 1.0 - 0.0625;                                              \n" +
    "     }                                                                             \n" +
    "                                                                                   \n" +
    "     trans_grid_coords.x = ( tex_coords.x + floor( tex_coords.z * 16.0 ) ) / 16.0; \n" +
    "     trans_grid_coords.y = tex_coords.y;                                           \n" +
    "     vec4 z0 = texture2D( texImage, trans_grid_coords );                           \n" +
    "                                                                                   \n" +
    "     // get vexel color in z1 slice                                                \n" +
    "     if( grid_coords.z < 0.0 || grid_coords.z >= ( 1.0 - 0.0625*0.5 ) ) {          \n" +
    "         tex_coords.z = 0.0;                                                       \n" +
    "         trans_grid_coords.x = ( tex_coords.x + floor( tex_coords.z * 16.0 ) ) / 16.0; \n" +
    "     } else {                                                                          \n" +
    "         trans_grid_coords.x = ( tex_coords.x + floor( tex_coords.z * 16.0 )+ 1.0) / 16.0;\n" +
    "     }                                                                             \n" +
    "     trans_grid_coords.y = tex_coords.y;                                           \n" +
    "     vec4 z1 = texture2D( texImage, trans_grid_coords );                           \n" +
    "                                                                                   \n" +
    "     // calculate real z position between z0 and z1 slices                         \n" +
    "     float zOffset = mod( grid_coords.z * 16.0, 1.0 );                             \n" +
    "                                                                                   \n" +
    "     // do linear interpolation to get real z vexel color                          \n" +
    "     return mix( z0, z1, zOffset );                                                \n" +
    " }                                                                                 \n" +
    "                                                                                   \n" +
    " vec3 calc_indirect_lighting( in vec3 grid_coords, in vec4 transfer_function) {	\n" +
    " 	vec3 indirect;																	\n" +
    "   // find dampening factor 														\n" +
    "	// based on the directional derivative of the intensity distribution 			\n" +
    "	// to reduce light bleeding through thin walls									\n" +
    "	vec4 red = sampleAs3DTexture(incoming_red, grid_coords);						\n" +
    "	vec4 green = sampleAs3DTexture(incoming_green, grid_coords);					\n" +
    "	vec4 blue = sampleAs3DTexture(incoming_blue, grid_coords);						\n" +
    "																					\n" +
    "	# ifdef DAMPEN 																	\n" +
    "	vec3 offset = light_space_normal * offset_along_normal;							\n" +
    "	vec3 sample_location1 = grid_coords + offset; // in front of the surface		\n" +
    "	vec3 sample_location2 = grid_coords - offset; // behind the surface				\n" +
    "																					\n" +
    "	vec4 neighbour1_red = sampleAs3DTexture(incoming_red, sample_location1);		\n" +
    "	vec4 neighbour1_green = sampleAs3DTexture(incoming_green, sample_location1);	\n" +
    "	vec4 neighbour1_blue = sampleAs3DTexture(incoming_blue, sample_location1);		\n" +
    "	vec4 neighbour2_red = sampleAs3DTexture(incoming_red, sample_location2);		\n" +
    "	vec4 neighbour2_green = sampleAs3DTexture(incoming_green, sample_location2);	\n" +
    "	vec4 neighbour2_blue = sampleAs3DTexture(incoming_blue, sample_location2);		\n" +
    "																					\n" +
    "	vec4 diff_red = (neighbour1_red - neighbour2_red);								\n" +
    "	vec4 diff_green = (neighbour1_green - neighbour2_green);						\n" +
    "	vec4 diff_blue = (neighbour1_blue - neighbour2_blue);							\n" +
    "																					\n" +
    "	// supposed to indicate if light comes from behind the wall 	 				\n" +
    "	vec3 sh_diff = vec3(dot(diff_red, red), 										\n" +
    "						dot(diff_green, green), 									\n" +
    "						dot(diff_blue, blue)); 										\n" +
    "																					\n" +
    "	const vec3 dampening_max = vec3(1.0);											\n" +
    "																					\n" +
    "	vec3 step = vec3(1.0) - step(vec3(0.0), sh_diff);								\n" +
    "																					\n" +
    "	// how much light comes from behind the wall?									\n" +
    "	vec3 dampening_mag = vec3(dot(diff_red, diff_red), 								\n" +
    "							  dot(diff_green, diff_green), 							\n" +
    "							  dot(diff_blue, diff_blue));							\n" +
    "																					\n" +
    "	// reduce indirect light thus removing the light from behind the wall 			\n" +
    " 	vec3 dampening = vec3(1.0) - step * sqrt(dampening_mag) / dampening_max;		\n" +
    "																					\n" +
    "	dampening = max(dampening, 0.2);												\n" +
    "																					\n" +
    "	// calculate amount of indirect light reaching this surface point 				\n" +
    "	indirect.r = dot(red * dampening.r, transfer_function);							\n" +
    "	indirect.g = dot(green * dampening.g, transfer_function);						\n" +
    "	indirect.b = dot(blue * dampening.b, transfer_function);						\n" +
    " 	# else																			\n" +
    "	indirect.r = dot(red, transfer_function);										\n" +
    "	indirect.g = dot(green, transfer_function);										\n" +
    "	indirect.b = dot(blue, transfer_function);										\n" +
    " 	# endif																			\n" +
    "	indirect = max(indirect, 0.0);													\n" +
    "																					\n" +
    "	return indirect;																\n" +
    " }																					\n" +
    "																					\n" +
    " vec3 rotate_zh_cone_coeff( in vec3 dir) {											\n" +
    "   const float zh_second_band = 1.0233266;											\n" +
    "																					\n" +
    "   vec2 theta12_cs = normalize(dir.xz);											\n" +
    "   vec2 phi12_cs = vec2(sqrt(1.0 - dir.y * dir.y), dir.y);							\n" +
    "																					\n" +
    "   vec3 rotated_coeffs;															\n" +
    "																					\n" +
    "   rotated_coeffs.x = zh_second_band * phi12_cs.x * theta12_cs.y;					\n" +
    "   rotated_coeffs.y = zh_second_band * phi12_cs.y;									\n" +
    "   rotated_coeffs.z = -zh_second_band * phi12_cs.x * theta12_cs.x;					\n" +
    "																					\n" +
    "   return rotated_coeffs;															\n" +
    " }																					\n" +
    "																					\n" +
    " vec4 create_vpl(in vec3 normal) {													\n" +
    " 	// clamped cosine function (see jose.pdf page 5)								\n" +
    " 	const float zh_first_band = 0.88622689;											\n" +
    " 	const float zh_second_band = 1.0233266;											\n" +
    "																					\n" +
    " 	return (abs(normal.y) < 0.99) ? 												\n" +
    "		vec4(zh_first_band, rotate_zh_cone_coeff(normal)) : 						\n" +
    "		vec4(zh_first_band, 0.0, zh_second_band * sign(normal.y), 0.0); 			\n" +
    " }																					\n" +
    "																					\n" +
    " void main() {																		\n" +
    " 	vec4 transfer_function = create_vpl(-light_space_normal);						\n" +
    "																					\n" +
    "   vec3 indirect = calc_indirect_lighting(grid_coords, transfer_function);			\n" +
    "																					\n" +
    "	gl_FragColor.rgb = indirect;													\n" +
    " }																					\n";

var indirectLightVertexShader =
    " attribute vec4 position;											\n" +
    " attribute vec3 normal;											\n" +
    "																	\n" +
    " uniform mat4 projection_matrix;									\n" +
    " uniform mat4 view_matrix;											\n" +
    " uniform mat4 grid_space_matrix;									\n" +
    " uniform vec3 inv_grid_size;										\n" +
    " uniform vec3 grid_origin;											\n" +
    " 																	\n" +
    " varying vec3 light_space_normal;									\n" +
    " varying vec3 grid_coords;											\n" +
    " 																	\n" +
    " void main() {														\n" +
    " 	mat4 mvp_matrix = projection_matrix * view_matrix;				\n" +
    "																	\n" +
    "   gl_Position = mvp_matrix * position;							\n" +
    "																	\n" +
    "   // transform normal from world space to grid space				\n" +
    "   light_space_normal = mat3(grid_space_matrix) * normal;			\n" +
    "																	\n" +
    "   vec3 grid_pos = mat3(grid_space_matrix) * vec3(position);		\n" +
    "																	\n" +
    "   grid_coords = grid_pos - grid_origin;							\n" +
    "   grid_coords *= inv_grid_size;									\n" +
    " }																	\n";