// shader for indirect light buffer
// store light intensity as SH (spherical harmonics)
var indirectLightFragmentShader =
    " precision mediump float;															\n" +
    " uniform sampler3D incoming_red;													\n" +
    " uniform sampler3D incoming_green;													\n" +
    " uniform sampler3D incoming_blue;													\n" +
    "																					\n" +
    " // offset to sample neighbouring cells											\n" +
    " # ifdef DAMPEN 																	\n" +
    " uniform vec3 offset_along_normal;													\n" +
    " # endif																			\n" +
    " varying vec3 light_space_normal;													\n" +
    " varying vec3 grid_coords;															\n" +
    "																					\n" +
    " vec3 calc_indirect_lighting( in vec3 grid_coords, in vec4 transfer_function) {	\n" +
    " 	vec3 indirect;																	\n" +
    "   // find dampening factor 														\n" +
    "	// based on the directional derivative of the intensity distribution 			\n" +
    "	// to reduce light bleeding through thin walls									\n" +
    "	vec4 red = texture3D(incoming_red, grid_coords);								\n" +
    "	vec4 green = texture3D(incoming_green, grid_coords);							\n" +
    "	vec4 blue = texture3D(incoming_blue, grid_coords);								\n" +
    "																					\n" +
    "	# ifdef DAMPEN 																	\n" +
    "	vec3 offset = light_space_normal * offset_along_normal;							\n" +
    "	vec3 sample_location1 = grid_coords + offset; // in front of the surface		\n" +
    "	vec3 sample_location2 = grid_coords - offset; // behind the surface				\n" +
    "																					\n" +
    "	vec4 neighbour1_red = texture3D(incoming_red, sample_location1);				\n" +
    "	vec4 neighbour1_green = texture3D(incoming_green, sample_location1);			\n" +
    "	vec4 neighbour1_blue = texture3D(incoming_blue, sample_location1);				\n" +
    "	vec4 neighbour2_red = texture3D(incoming_red, sample_location2);				\n" +
    "	vec4 neighbour2_green = texture3D(incoming_green, sample_location2);			\n" +
    "	vec4 neighbour2_blue = texture3D(incoming_blue, sample_location2);				\n" +
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
    " 	dampening = vec3(1.0) - step * sqrt(dampening_mag) / dampening_max;				\n" +
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