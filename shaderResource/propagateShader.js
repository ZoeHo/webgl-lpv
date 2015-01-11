// propagate with/without blocking potential
// propagation first iteration - no blocking potentials

var propagateFragmentShader = 
	" precision mediump float;																\n" +
	" // light intensity stored as spherical harmonics										\n" +
	" uniform sampler2D coeffs_red;															\n" +
	" uniform sampler2D coeffs_green; 														\n" +
	" uniform sampler2D coeffs_blue; 														\n" +
	" uniform float channel;																\n" +
	" // geometry volume grid																\n" +
	" #ifndef NO_BLOCKING																	\n" +
	" uniform sampler2D geometry_volume;													\n" +
	" #endif																				\n" +
	" 																						\n" +
	" uniform vec3 inv_grid_size;															\n" +
	" #ifndef NO_BLOCKING																	\n" +
	" uniform vec3 proj_grid_to_gv[2];														\n" +
	" uniform float half_texel_size;														\n" +
	" #endif																				\n" +
	" 																						\n" +
	" varying vec3 tex_coord;																\n" +
	" 																						\n" +
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
    "     trans_grid_coords.x = ( tex_coords.x + /*floor*/( tex_coords.z * 16.0 ) ) / 16.0; \n" +
    "     trans_grid_coords.y = tex_coords.y;                                           \n" +
    "     vec4 z0 = texture2D( texImage, trans_grid_coords );                           \n" +
    "                                                                                   \n" +
    "     /*// get vexel color in z1 slice                                                \n" +
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
    "     return mix( z0, z1, zOffset );*/                                                \n" +
    "     return z0;                                                                    \n" +
    " }                                                                                 \n" +
    "                                                                                   \n" +
	" // calculate incident flux for a face of the destination cell							\n" +
	" void create_vpl(in vec4 red, 															\n" +
	" 			    in vec4 green, 															\n" +
	" 			    in vec4 blue, 															\n" +
	" 			    in vec4 central_direction_sh_basis,										\n" +
	" 			    in vec4 vpl,															\n" +
	" 			    in float solid_angle,													\n" +
	" 			    out vec4 contribution_red, 												\n" +
	" 			    out vec4 contribution_green, 											\n" +
	" 			    out vec4 contribution_blue) {											\n" +
	" 	// calculate avarage light intensity												\n" +
	" 	vec3 intensity;																		\n" +
	" 	intensity.r = max(0.0, dot(central_direction_sh_basis, red) );						\n" +
	" 	intensity.g = max(0.0, dot(central_direction_sh_basis, green) );					\n" +
	" 	intensity.b = max(0.0, dot(central_direction_sh_basis, blue) );						\n" +
	" 																						\n" +
	" 	// multiply by solid angle to calculate the flux									\n" +
	" 	vec3 flux = intensity * solid_angle;												\n" +
	" 																						\n" +
	" 	// create virtual point light pointing towards the face								\n" +
	" 	contribution_red = vpl * flux.r;													\n" +
	" 	contribution_green = vpl * flux.g;													\n" +
	" 	contribution_blue = vpl * flux.b;													\n" +
	" }																						\n" +
	" 																						\n" +
	" // read sh vectors storing the light intensity										\n" +
	" void get_vpls(vec3 source_cell, out vec4 red, out vec4 green, out vec4 blue) {		\n" +
	" 	red = sampleAs3DTexture(coeffs_red, source_cell);											\n" +
	" 	green = sampleAs3DTexture(coeffs_green, source_cell);										\n" +
	" 	blue = sampleAs3DTexture(coeffs_blue, source_cell);											\n" +
	" }																						\n" +
	" 																						\n" +
	" #ifndef NO_BLOCKING																	\n" +
	" // read sh vector storing the blocking potential										\n" +
	" vec4 sample_blocking_potential(vec3 sample_pos) {										\n" +
	" 	vec3 gv_sample_pos = sample_pos * proj_grid_to_gv[0].xyz + proj_grid_to_gv[1].xyz;	\n" +
	" 	vec4 blocking_potential = sampleAs3DTexture(geometry_volume, gv_sample_pos);				\n" +
	" 	return blocking_potential;															\n" +
	" }																						\n" +
	" 																						\n" +
	" // apply blocking potential to reduce amout of light being propagated through blockers\n" +
	" void apply_blocking_potential(in vec4 light, in vec3 sample_pos, 						\n" +
	" 							  inout vec4 vpl_r, inout vec4 vpl_g, inout vec4 vpl_b) {	\n" +
	" 	const float blocking_max = 1.83;													\n" +
	" 																						\n" +
	" 	vec4 blocking_potential = sample_blocking_potential(sample_pos);					\n" +
	" 																						\n" +
	" 	// value depends on direction of light and blocking potential and magnitude of blocking potential  \n" +
	" 	float b = max(dot(blocking_potential, light), 0.0);									\n" +
	" 																						\n" +
	" 	float c = 1.0 - b / blocking_max;													\n" +
	" 	vpl_r = vpl_r * c;																	\n" +
	" 	vpl_g = vpl_g * c;																	\n" +
	" 	vpl_b = vpl_b * c;																	\n" +
	" }																						\n" +
	" #endif																				\n" +
	" 																						\n" +
	" // propagate light from neighouring cell to the 5 faces of this cell					\n" +
	" void propagate(in vec4 red, // vpl of neighbour										\n" +
	" 			   in vec4 green, // vpl of neighbour 										\n" +
	" 			   in vec4 blue, // vpl of neighbour										\n" +
	" 																						\n" +
	" 			   in vec4 central_direction_sh_basis1,										\n" +
	" 			   in vec4 vpl1,															\n" +
	" 			   in float solid_angle1,													\n" +
	" 																						\n" +
	" 			   in vec4 central_direction_sh_basis2,										\n" +
	" 			   in vec4 vpl2,															\n" +
	" 			   in float solid_angle2,													\n" +
	" 																						\n" +
	" 			   in vec4 central_direction_sh_basis3,										\n" +
	" 			   in vec4 vpl3,															\n" +
	" 			   in float solid_angle3,													\n" +
	" 																						\n" +
	" 			   in vec4 central_direction_sh_basis4,										\n" +
	" 			   in vec4 vpl4,															\n" +
	" 			   in float solid_angle4,													\n" +
	" 																						\n" +
	" 			   in vec4 central_direction_sh_basis5,										\n" +
	" 			   in vec4 vpl5,															\n" +
	" 			   in float solid_angle5,													\n" +
	" 																						\n" +
	" 			   out vec4 vpl_red, 														\n" +
	" 			   out vec4 vpl_green, 														\n" +
	" 			   out vec4 vpl_blue) {														\n" +
	" 	vpl_red = vec4(0.0);																\n" +
	" 	vpl_green = vec4(0.0);																\n" +
	" 	vpl_blue = vec4(0.0);																\n" +
	" 																						\n" +
	" 	vec4 contribution_red;																\n" +
	" 	vec4 contribution_green;															\n" +
	" 	vec4 contribution_blue;																\n" +
	" 																						\n" +
	" 	// create virtual point light pointing towards face 1								\n" +
	" 	create_vpl(red, green, blue, central_direction_sh_basis1, vpl1, solid_angle1, contribution_red, contribution_green, contribution_blue);	\n" +
	" 	vpl_red += contribution_red;														\n" +
	" 	vpl_green += contribution_green;													\n" +
	" 	vpl_blue += contribution_blue;														\n" +
	" 																						\n" +
	" 	// create virtual point light pointing towards face 2								\n" +
	" 	create_vpl(red, green, blue, central_direction_sh_basis2, vpl2, solid_angle2, contribution_red, contribution_green, contribution_blue);		\n" +
	" 	vpl_red += contribution_red;														\n" +
	" 	vpl_green += contribution_green;													\n" +
	" 	vpl_blue += contribution_blue;														\n" +
	" 																						\n" +
	" 	// create virtual point light pointing towards face 3								\n" +
	" 	create_vpl(red, green, blue, central_direction_sh_basis3, vpl3, solid_angle3, contribution_red, contribution_green, contribution_blue);		\n" +
	" 	vpl_red += contribution_red;														\n" +
	" 	vpl_green += contribution_green;													\n" +
	" 	vpl_blue += contribution_blue;														\n" +
	" 																						\n" +
	" 	// create virtual point light pointing towards face 4								\n" +
	" 	create_vpl(red, green, blue, central_direction_sh_basis4, vpl4, solid_angle4, contribution_red, contribution_green, contribution_blue);		\n" +
	" 	vpl_red += contribution_red;														\n" +
	" 	vpl_green += contribution_green;													\n" +	
	" 	vpl_blue += contribution_blue;														\n" +
	" 																						\n" +
	" 	// create virtual point light pointing towards face 5								\n" +
	" 	create_vpl(red, green, blue, central_direction_sh_basis5, vpl5, solid_angle5, contribution_red, contribution_green, contribution_blue);		\n" +
	" 	vpl_red += contribution_red;														\n" +
	" 	vpl_green += contribution_green;													\n" +
	" 	vpl_blue += contribution_blue;														\n" +
	" }																						\n" +
	" 																						\n" +
	" void main() {																			\n" +
	" 	vec4 total_vpl_r = vec4(0.0);														\n" +
	" 	vec4 vpl_r;																			\n" +
	" 																						\n" +
	" 	vec4 total_vpl_g = vec4(0.0);														\n" +
	" 	vec4 vpl_g;																			\n" +
	" 																						\n" +
	" 	vec4 total_vpl_b = vec4(0.0);														\n" +
	" 	vec4 vpl_b;																			\n" +
	" 																						\n" +
	" 	vec3 sample_pos_neg = tex_coord - inv_grid_size;									\n" +
	" 	vec3 sample_pos_pos = tex_coord + inv_grid_size;									\n" +
	" 																						\n" +
	" 	vec3 grid_sample_pos;																\n" +
	" 	vec4 red_in, green_in, blue_in;														\n" +
	" 	float s;																			\n" +
	" 																						\n" +
	" 	// get light intensity sh vectors from the cell left to this cell					\n" +
	" 	grid_sample_pos = vec3(sample_pos_neg.x, tex_coord.yz);								\n" +
	" 	get_vpls(grid_sample_pos, red_in, green_in, blue_in);								\n" +		
	" 																						\n" +
	" #ifndef NO_BLOCKING																	\n" +
	"	// sample pos of blocking potential is between both cells							\n" +
	" 	grid_sample_pos.x += half_texel_size;												\n" +
	" 	apply_blocking_potential(vec4(0.88622689, 0.0, 0.0, -1.0233266), grid_sample_pos, red_in, green_in, blue_in);	\n" +
	" #endif																				\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir1 = vec4(0.28209481, 0.0, 0.25687355, -0.41563013);	\n" +
	" 	const vec4 vpl1 = vec4(0.88622689, 0.0, 1.0233266, 0.0);							\n" +
	" 	const float solid_angle1 = 0.42343098;												\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir2 = vec4(0.28209481, 0.0, -0.25687355, -0.41563013);	\n" +
	" 	const vec4 vpl2 = vec4(0.88622689, 0.0, -1.0233266, 0.0);							\n" +
	" 	const float solid_angle2 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir3 = vec4(0.28209481, 0.0, 0.0, -0.48860252);			\n" +
	" 	const vec4 vpl3 = vec4(0.88622689, 0.0, 0.0, -1.0233266);							\n" +
	" 	const float solid_angle3 = 0.40067077;												\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir4 = vec4(0.28209481, 0.25687355, 0.0, -0.41563013);	\n" +
	" 	const vec4 vpl4 = vec4(0.88622689, 1.0233266, 0.0, 0.0);							\n" +
	" 	const float solid_angle4 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir5 = vec4(0.28209481, -0.25687355, 0.0, -0.41563013);	\n" +
	" 	const vec4 vpl5 = vec4(0.88622689, -1.0233266, 0.0, 0.0);							\n" +
	" 	const float	solid_angle5 = solid_angle1;											\n" +
	" 																						\n" +
	" 	// propagate light from adjacent cell to the five faces of this cell				\n" +
	" 	propagate(red_in, 																	\n" +
	" 			  green_in, 																\n" +
	" 			  blue_in,																	\n" +
	" 			  sh_basic_central_dir1,													\n" +
	" 			  vpl1,																		\n" +
	" 			  solid_angle1,																\n" +
	" 			  sh_basic_central_dir2,													\n" +
	" 			  vpl2,																		\n" +
	" 			  solid_angle2,																\n" +
	" 			  sh_basic_central_dir3,													\n" +
	" 			  vpl3,																		\n" +
	" 			  solid_angle3,																\n" +
	" 			  sh_basic_central_dir4,													\n" +
	" 			  vpl4,																		\n" +
	" 			  solid_angle4,																\n" +
	" 			  sh_basic_central_dir5,													\n" +
	" 			  vpl5,																		\n" +
	" 			  solid_angle5,																\n" +
	" 			  vpl_r, 																	\n" +
	" 			  vpl_g, 																	\n" +
	" 			  vpl_b);																	\n" +
	" 	s = step(0.0, sample_pos_neg.x);													\n" +
	" 	total_vpl_r = vpl_r * s;															\n" +
	" 	total_vpl_g = vpl_g * s;															\n" +
	" 	total_vpl_b = vpl_b * s;															\n" +
	" 																						\n" +
	" 	// get light intensity sh vectors from the cell right to this cells					\n" +
	" 	grid_sample_pos = vec3(sample_pos_pos.x, tex_coord.yz);								\n" +
	" 	get_vpls(grid_sample_pos, red_in, green_in, blue_in);								\n" +
	" 																						\n" +
	" #ifndef NO_BLOCKING																	\n" +
	"	//sample pos of blocking potential is between both cells							\n" +
	" 	grid_sample_pos.x -= half_texel_size; 												\n" +
	" 	apply_blocking_potential(vec4(0.88622689, 0.0, 0.0, 1.0233266), grid_sample_pos, red_in, green_in, blue_in);\n" +
	" #endif																				\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir6 = vec4(0.28209481, 0.0, 0.25687355, 0.41563013);	\n" +
	" 	const vec4 vpl6 = vpl1;																\n" +
	" 	const float	solid_angle6 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir7 = vec4(0.28209481, 0.0, -0.25687355, 0.41563013);	\n" +
	" 	const vec4 vpl7 = vpl2;																\n" +
	" 	const float solid_angle7 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir8 = vec4(0.28209481, 0.0, 0.0, 0.48860252);			\n" +
	" 	const vec4 vpl8 = vec4(0.88622689, 0.0, 0.0, 1.0233266);							\n" +
	" 	const float solid_angle8 = solid_angle3;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir9 = vec4(0.28209481, 0.25687355, 0.0, 0.41563013);	\n" +
	" 	const vec4 vpl9 = vpl4;																\n" +
	" 	const float solid_angle9 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir10 = vec4(0.28209481, -0.25687355, 0.0, 0.41563013);	\n" +
	" 	const vec4 vpl10 = vpl5;															\n" +
	" 	const float	solid_angle10 =	solid_angle1;											\n" +
	" 																						\n" +
	" 	// propagate light from adjacent cell to the five faces of this cells 				\n" +
	" 	propagate(red_in,																	\n" +
	" 			  green_in, 																\n" +
	" 			  blue_in, 																	\n" +
	" 			  sh_basic_central_dir6,													\n" +
	" 			  vpl6,																		\n" +
	" 			  solid_angle6,																\n" +
	" 			  sh_basic_central_dir7,													\n" +
	" 			  vpl7,																		\n" +
	" 			  solid_angle7,																\n" +
	" 			  sh_basic_central_dir8,													\n" +
	" 			  vpl8,																		\n" +
	" 			  solid_angle8,																\n" +
	" 			  sh_basic_central_dir9,													\n" +
	" 			  vpl9,																		\n" +
	" 			  solid_angle9,																\n" +
	" 			  sh_basic_central_dir10,													\n" +
	" 			  vpl10,																	\n" +
	" 			  solid_angle10, 			   												\n" +
	" 			  vpl_r, 																	\n" +
	" 			  vpl_g, 																	\n" +
	" 			  vpl_b);																	\n" +
	" 																						\n" +
	" 	s = step(sample_pos_pos.x, 1.0);													\n" +
	" 	total_vpl_r += vpl_r * s;															\n" +
	" 	total_vpl_g += vpl_g * s;															\n" +
	" 	total_vpl_b += vpl_b * s;															\n" +
	"																						\n" +
	"	// get light intensity sh vectors from the cell above this cell 					\n" +
	"	grid_sample_pos = vec3(tex_coord.x, sample_pos_pos.y, tex_coord.z); 				\n" +
	"	get_vpls(grid_sample_pos, red_in, green_in, blue_in); 								\n" +
	"																						\n" +
	" #ifndef NO_BLOCKING 																	\n" +
	"	//sample pos of blocking potential is between both cells 							\n" +
	"	grid_sample_pos.y -= half_texel_size; 												\n" +
	"	apply_blocking_potential(vec4(0.88622689, 0.0, -1.0233266, 0.0), grid_sample_pos, red_in, green_in, blue_in); \n" +
	" #endif 																				\n" +
	" 																						\n" +
	"	const vec4 sh_basic_central_dir16 = vec4(0.28209481, 0.0, -0.48860252, 0.0); 		\n" +
	"	const vec4 vpl16 = vpl2; 															\n" +
	"	const float solid_angle16 =	solid_angle3; 											\n" +
	" 																						\n" +
	"	const vec4 sh_basic_central_dir17 = vec4(0.28209481, 0.0, -0.41563013, -0.25687355);\n" +
	"	const vec4 vpl17 = vpl3; 															\n" +
	"	const float	solid_angle17 = solid_angle1; 											\n" +
	" 																						\n" +
	"	const vec4 sh_basic_central_dir18 = vec4(0.28209481, 0.0, -0.41563013, 0.25687355); \n" +
	"	const vec4 vpl18 = vpl8; 															\n" +
	"	const float	solid_angle18 = solid_angle1; 											\n" +
	" 																						\n" +
	"	const vec4 sh_basic_central_dir19 = vec4(0.28209481, 0.25687355, -0.41563013, 0.0); \n" +
	"	const vec4 vpl19 = vpl4; 															\n" +
	"	const float	solid_angle19 =	solid_angle1; 											\n" +
	" 																						\n" +
	"	const vec4 sh_basic_central_dir20 = vec4(0.28209481, -0.25687355, -0.41563013, 0.0);\n" +
	"	const vec4 vpl20 = vpl5; 															\n" +
	"	const float	solid_angle20 = solid_angle1; 											\n" +
	" 																						\n" +
	"	// propagate light from adjacent cell to the five faces of this cell 				\n" +
	"	propagate(red_in,  																	\n" +
	"			  green_in,  																\n" +
	"			  blue_in,  																\n" +
	"			  sh_basic_central_dir16, 													\n" +
	"			  vpl16, 																	\n" +
	"			  solid_angle16, 															\n" +
	"			  sh_basic_central_dir17, 													\n" +
	"			  vpl17, 																	\n" +
	"			  solid_angle17, 															\n" +
	"			  sh_basic_central_dir18, 													\n" +
	"			  vpl18, 																	\n" +
	"			  solid_angle18, 															\n" +
	"			  sh_basic_central_dir19, 													\n" +
	"			  vpl19, 																	\n" +
	"			  solid_angle19, 															\n" +
	"			  sh_basic_central_dir20, 													\n" +
	"			  vpl20, 																	\n" +
	"			  solid_angle20, 															\n" +
	"			  vpl_r,  																	\n" +
	"			  vpl_g,  																	\n" +
	"			  vpl_b);																	\n" +
	" 																						\n" +
	"	s = step(sample_pos_pos.y, 1.0); 													\n" +
	"	total_vpl_r += vpl_r * s; 															\n" +
	"	total_vpl_g += vpl_g * s; 															\n" +
	"	total_vpl_b += vpl_b * s; 															\n" +
	" 																						\n" +
	" 	// get light intensity sh vectors from the cell below this cell 					\n" +
	" 	grid_sample_pos = vec3(tex_coord.x, sample_pos_neg.y, tex_coord.z);					\n" +
	" 	get_vpls(grid_sample_pos, red_in, green_in, blue_in);								\n" +
	" 																						\n" +
	" #ifndef NO_BLOCKING																	\n" +
	" 	//sample pos of blocking potential is between both cells 							\n" +
	" 	grid_sample_pos.y += half_texel_size; 												\n" +
	" 	apply_blocking_potential(vec4(0.88622689, 0.0, 1.0233266, 0.0), grid_sample_pos, red_in, green_in, blue_in);\n" +
	" #endif 																				\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir11 = vec4(0.28209481, 0.0, 0.48860252, 0.0);			\n" +
	" 	const vec4 vpl11 = vpl1;															\n" +
	" 	const float solid_angle11 = solid_angle3;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir12 = vec4(0.28209481, 0.0, 0.41563013, -0.25687355); \n" +
	" 	const vec4 vpl12 = vpl3;															\n" +
	" 	const float solid_angle12 =	solid_angle1;											\n" +
	"																						\n" +
	" 	const vec4 sh_basic_central_dir13 = vec4(0.28209481, 0.0, 0.41563013, 0.25687355);	\n" +
	" 	const vec4 vpl13 = vpl8;															\n" +
	" 	const float solid_angle13 =	solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir14 = vec4(0.28209481, 0.25687355, 0.41563013, 0.0);	\n" +
	" 	const vec4 vpl14 = vpl4;															\n" +
	" 	const float solid_angle14 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir15 = vec4(0.28209481, -0.25687355, 0.41563013, 0.0);	\n" +
	" 	const vec4 vpl15 = vpl5;															\n" +
	" 	const float solid_angle15 = solid_angle1;											\n" +
	" 																						\n" +
	" 	// propagate light from adjacent cell to the five faces of this cell 				\n" +
	" 	propagate(red_in, 																	\n" +
	" 			  green_in, 																\n" +
	" 			  blue_in, 																	\n" +
	" 			  sh_basic_central_dir11,													\n" +
	" 			  vpl11,																	\n" +
	" 			  solid_angle11,															\n" +
	" 			  sh_basic_central_dir12,													\n" +
	" 			  vpl12,																	\n" +
	" 			  solid_angle12,															\n" +
	" 			  sh_basic_central_dir13,													\n" +
	" 			  vpl13,																	\n" +
	" 			  solid_angle13,															\n" +
	" 			  sh_basic_central_dir14,													\n" +
	" 			  vpl14,																	\n" +
	" 			  solid_angle14,															\n" +
	" 			  sh_basic_central_dir15,													\n" +
	" 			  vpl15,																	\n" +
	" 			  solid_angle15,															\n" +
	" 			  vpl_r, 																	\n" +
	" 			  vpl_g, 																	\n" +
	" 			  vpl_b);																	\n" +
	" 																						\n" +
	" 	s = step(0.0, sample_pos_neg.y);													\n" +
	" 	total_vpl_r += vpl_r * s;															\n" +
	" 	total_vpl_g += vpl_g * s;															\n" +
	" 	total_vpl_b += vpl_b * s;															\n" +
	" 																						\n" +
	" 	// get light intensity sh vectors from the cell behind this cell					\n" +
	" 	grid_sample_pos = vec3(tex_coord.xy, sample_pos_neg.z);								\n" +
	" 	get_vpls(grid_sample_pos, red_in, green_in, blue_in);								\n" +
	" 																						\n" +
	" #ifndef NO_BLOCKING																	\n" +
	" 	//sample pos of blocking potential is between both cells							\n" +
	" 	grid_sample_pos.z += half_texel_size;												\n" +
	" 	apply_blocking_potential(vec4(0.88622689, 1.0233266, 0.00000000, -0.00000000), grid_sample_pos, red_in, green_in, blue_in);	\n" +
	" #endif																				\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir21 = vec4(0.28209481, 0.48860252, 0.0, 0.0);			\n" +
	" 	const vec4 vpl21 = vpl4;															\n" +
	" 	const float solid_angle21 =	solid_angle3;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir22 = vec4(0.28209481, 0.41563013, 0.25687355, 0.0);	\n" +
	" 	const vec4 vpl22 = vpl1;															\n" +
	" 	const float solid_angle22 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir23 = vec4(0.28209481, 0.41563013, -0.25687355, 0.0);	\n" +
	" 	const vec4 vpl23 = vpl2;															\n" +
	" 	const float	solid_angle23 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir24 = vec4(0.28209481, 0.41563013, 0.0, 0.25687355);	\n" +
	" 	const vec4 vpl24 = vpl8;															\n" +
	" 	const float	solid_angle24 = solid_angle1;											\n" +
	" 																						\n" +
	" 	const vec4 sh_basic_central_dir25 = vec4(0.28209481, 0.41563013, 0.0, -0.25687355);	\n" +
	" 	const vec4 vpl25 = vpl3;															\n" +
	" 	const float solid_angle25 = solid_angle1;											\n" +
	" 																						\n" +
	" 	// propagate light from adjacent cell to the five faces of this cell				\n" +
	" 	propagate(red_in, 																	\n" +
	" 			  green_in, 																\n" +
	" 			  blue_in, 																	\n" +
	" 			  sh_basic_central_dir21,													\n" +
	" 			  vpl21,																	\n" +
	" 			  solid_angle21,															\n" +
	" 			  sh_basic_central_dir22,													\n" +
	" 			  vpl22,																	\n" +
	" 			  solid_angle22,															\n" +
	" 			  sh_basic_central_dir23,													\n" +
	" 			  vpl23,																	\n" +
	" 			  solid_angle23,															\n" +
	" 			  sh_basic_central_dir24,													\n" +
	" 			  vpl24,																	\n" +
	" 			  solid_angle24,															\n" +
	" 			  sh_basic_central_dir25,													\n" +
	" 			  vpl25,																	\n" +
	" 			  solid_angle25,															\n" +
	" 			  vpl_r, 																	\n" +
	" 			  vpl_g, 																	\n" +
	" 			  vpl_b);																	\n" +
	" 																						\n" +
	" 	s = step(0.0, sample_pos_neg.z);													\n" +
	" 	total_vpl_r += vpl_r * s;															\n" +
	" 	total_vpl_g += vpl_g * s;															\n" +
	" 	total_vpl_b += vpl_b * s;															\n" +
	"	vec4 test = total_vpl_r;	\n" +
	"  																						\n" +
	" 	// get light intensity sh vectors from the cell in front of this cell 				\n" +
	" 	grid_sample_pos = vec3(tex_coord.xy, sample_pos_pos.z); 							\n" +
	" 	get_vpls(grid_sample_pos, red_in, green_in, blue_in); 								\n" +
	"  																						\n" +
	" #ifndef NO_BLOCKING 																	\n" +
	" 	//sample pos of blocking potential is between both cells 							\n" +
	" 	grid_sample_pos.z -= half_texel_size; 												\n" +
	" 	apply_blocking_potential(vec4(0.88622689, -1.0233266, 0.00000000, -0.00000000), grid_sample_pos, red_in, green_in, blue_in); \n" +
	" #endif																				\n" +
	"  																						\n" +
	" 	const vec4 sh_basic_central_dir26 = vec4(0.28209481, -0.48860252, 0.0, 0.0); 		\n" +
	" 	const vec4 vpl26 = vpl5; 															\n" +
	" 	const float	solid_angle26 = solid_angle3; 											\n" +
	" 		 																				\n" +
	" 	const vec4 sh_basic_central_dir27 = vec4(0.28209481, -0.41563013, 0.25687355, 0.0); \n" +
	" 	const vec4 vpl27 = vpl1;	 														\n" +
	" 	const float	solid_angle27 = solid_angle1; 											\n" +
	"  																						\n" +
	" 	const vec4 sh_basic_central_dir28 = vec4(0.28209481, -0.41563013, -0.25687355, 0.0);\n" +
	" 	const vec4 vpl28 = vec4(0.88622689, 0.0, -1.0233266, 0.0); 							\n" +
	" 	const float	solid_angle28 = solid_angle1; 											\n" +
	"  																						\n" +
	" 	const vec4 sh_basic_central_dir29 = vec4(0.28209481, -0.41563013, 0.0, 0.25687355); \n" +
	" 	const vec4 vpl29 = vpl8; 															\n" +
	" 	const float	solid_angle29 = solid_angle1; 											\n" +
	"  																						\n" +
	" 	const vec4 sh_basic_central_dir30 = vec4(0.28209481, -0.41563013, 0.0, -0.25687355);\n" +
	" 	const vec4 vpl30 = vpl3; 															\n" +
	" 	const float	solid_angle30 = solid_angle1; 											\n" +
	" 		 																				\n" +
	" 	// propagate light from adjacent cell to the five faces of this cell 				\n" +
	" 	propagate(red_in,  																	\n" +
	" 			  green_in,  																\n" +
	" 			  blue_in,  																\n" +
	" 			  sh_basic_central_dir26, 													\n" +
	" 			  vpl26, 																	\n" +
	" 			  solid_angle26, 															\n" +	
	" 			  sh_basic_central_dir27, 													\n" +
	" 			  vpl27, 																	\n" +
	" 			  solid_angle27, 															\n" +
	" 			  sh_basic_central_dir28, 													\n" +
	" 			  vpl28, 																	\n" +
	" 			  solid_angle28, 															\n" +
	" 			  sh_basic_central_dir29, 													\n" +
	" 			  vpl29,																	\n" +
	" 			  solid_angle29, 															\n" +
	" 			  sh_basic_central_dir30, 													\n" +
	" 			  vpl30, 																	\n" +
	" 			  solid_angle30, 															\n" +
	" 			  vpl_r,  																	\n" +
	" 				  vpl_g,  																\n" +
	" 			  vpl_b); 																	\n" +
	"  																						\n" +
	" 	s = step(sample_pos_pos.z, 1.0); 													\n" +
	" 	total_vpl_r += vpl_r * s; 															\n" +
	" 	total_vpl_g += vpl_g * s; 															\n" +
	" 	total_vpl_b += vpl_b * s; 															\n" +
	"  																						\n" +
	" 	// normalize 																		\n" +
	" 	const float pi = 3.141592;		 													\n" +
	" 	total_vpl_r /= pi; 																	\n" +
	" 	total_vpl_g /= pi; 																	\n" +
	" 	total_vpl_b /= pi; 																	\n" +
	"  																						\n" +
	" 	/*// store light intensity as SH vectors 												\n" +
	" 	if(channel == 0.0) { gl_FragColor = total_vpl_r; } 								\n" +
	" 	if(channel == 1.0) { gl_FragColor = total_vpl_g; } 								\n" +
	" 	if(channel == 2.0) { gl_FragColor = total_vpl_b; }*/ 								\n" +
	"	gl_FragColor = vec4(test.rgb, 1.0);				\n" +
	" }											 											\n";

var propagateVertexShader = 
	" attribute vec2 position;						\n" +
	" 												\n" +
	" uniform float grid_depth;						\n" +
	" uniform float halfDimSize;					\n" +
	" 												\n" +
	" varying vec3 tex_coord;						\n" +
	" 												\n" +
	" vec4 geometryPosition(in vec4 glPositionIn) {										\n" +
	" 	vec4 pos;																		\n" +
	"	glPositionIn.z *= grid_depth;													\n" +
	"	float halfGridSize = 1.0 / grid_depth * 0.5;									\n" +
	"	pos.x = (glPositionIn.x + floor(glPositionIn.z) + halfGridSize) / (grid_depth);	\n" +
	"	pos.x = pos.x * 2.0 - 1.0;														\n" +
	"	pos.y = (glPositionIn.y + halfGridSize) * 2.0 - 1.0;							\n" +
	"	pos.z = 0.0;																	\n" +
	"	pos.w = 1.0;																	\n" +
	"	return pos;																		\n" +
	" 																					\n" +
	" 	/*vec4 pos;																		\n" +
	"	float halfGridSize = 1.0 / grid_depth * 0.5;									\n" +
	"	pos.x = (glPositionIn.x + floor(glPositionIn.z) + halfGridSize) / (grid_depth);	\n" +
	"	pos.x = pos.x * 2.0 - 1.0;														\n" +
	"	pos.y = (glPositionIn.y + halfGridSize) * 2.0 - 1.0;							\n" +
	"	pos.z = 0.0;																	\n" +
	"	pos.w = 1.0;																	\n" +
	"	return pos;*/																		\n" +
	" }																					\n" +
	" 												\n" +
	" vec3 transTexturePos(in vec2 clipPos) { 		\n" +
	"	// input : clipPos in [0, 1]				\n" +
	"	// output: transTexCoord in [0, 1]			\n" +
	" 	vec3 transTexCoord; 						\n" +
	"	float zpos = clipPos.x;						\n" +
	" 	transTexCoord.z = floor(zpos * grid_depth); \n" +
	" 	transTexCoord.xy = clipPos; 				\n" +
	"  												\n" +
	" 	transTexCoord.z /= grid_depth; 				\n" +
	" 	transTexCoord.z += halfDimSize; 			\n" +
	"  												\n" +
	" 	return transTexCoord; 						\n" +
	" } 											\n" +
	" 												\n" +
	" vec2 geom(vec3 grid_coords) {	\n" +
	"     // light volume dim = 16                                                      \n" +
    "     float half_texel_size = 0.0625 * 0.5;                                         \n" +
    "     grid_coords.z -= half_texel_size;                                             \n" +
    "     vec3 tex_coords = grid_coords;                                                \n" +
    "     vec2 trans_grid_coords;                                                       \n" +
    "                                                                                   \n" +
    "     // get vexel color in z0 slice                                                \n" +
    "     if( grid_coords.z > 1.0 ) {                                                   \n" +
    "         tex_coords.z = fract( grid_coords.z );                                    \n" +
    "     }                                                                             \n" +
    "     if( grid_coords.z < 0.0 ) {                                                   \n" +
    "         tex_coords.z = 1.0 - 0.0625;                                              \n" +
    "     }                                                                             \n" +
    "                                                                                   \n" +
    "     trans_grid_coords.x = ( tex_coords.x + floor( tex_coords.z * 16.0 ) ) / 16.0; \n" +
    "     trans_grid_coords.y = tex_coords.y;                                           \n" +
	" 	  return trans_grid_coords;	\n" +
	" } \n" +
	" void main() {									\n" +
	" 	// position in [0,1] 											\n" +
	" 	// create texture coord in [0,1], get texture coordinate z axis \n" +
	" 	vec2 clipPos = position; 										\n" +
	" 	tex_coord = transTexturePos(clipPos); 							\n" +
	" 	 																\n" +
	" 	// arrange 16 slices, xy in [0, 1], z is layer in [0, 15] 		\n" +
	" 	vec2 glPositionIn = position * 2.0 - 1.0; 						\n" +
	" 	gl_Position = geometryPosition(vec4(tex_coord, 1.0)); 					\n" +
	"	//tex_coord = vec3(geom(tex_coord), 0.0);	\n" +
	" 												\n" +
	"	/*vec2 glPositionIn = position * 2.0 - 1.0;	\n" +
	"  	//gl_Position = vec4(glPositionIn, 0, 1);	\n" +
	" 												\n" +
	"	vec2 clipPos = glPositionIn;				\n" +
	"	tex_coord = transTexturePos(clipPos); 		\n" +
	" 	//tex_coord = (clipPos * 0.5) + vec2(0.5);	\n" +
	" 	vec3 tex = tex_coord;\n" +
	" 	gl_Position = geometryPosition(vec4(tex_coord.xy, floor(position.x * grid_depth), 1.0));*/ \n" +
	" }												\n";