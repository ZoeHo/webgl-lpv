// accumulate virtual point light after each propagation step

var accumulateFragmentShader = 
	" precision mediump float;															\n" +
	" uniform sampler2D spectral_coeffs_r; 												\n" +
	" uniform sampler2D spectral_coeffs_g; 												\n" +
	" uniform sampler2D spectral_coeffs_b; 												\n" +
	" 																					\n" +
	" uniform sampler2D dest_coeffs_r; 													\n" +
	" uniform sampler2D dest_coeffs_g; 													\n" +
	" uniform sampler2D dest_coeffs_b; 													\n" +
	" uniform float channel;															\n" +
	" 																					\n" +
	" varying vec3 tex_coord;															\n" +
	" 																					\n" +
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
    "     trans_grid_coords.x = ( tex_coords.x + ( tex_coords.z * 16.0 ) ) / 16.0; 		\n" +
    "     trans_grid_coords.y = tex_coords.y;                                           \n" +
    "     vec4 z0 = texture2D( texImage, trans_grid_coords );                           \n" +
    "                                                                                   \n" +
    "     return z0;                                                                    \n" +
    " }                                                                                 \n" +
    "                                                                                   \n" +
	" vec4 accumulateCoeff( float channel ) {											\n" +
	" 	vec4 specColor, destColor;														\n" +
	" 	if(channel == 0.0) {															\n" +
	" 		specColor = sampleAs3DTexture(spectral_coeffs_r, tex_coord);				\n" +
	" 		destColor = sampleAs3DTexture(dest_coeffs_r, tex_coord);					\n" +
	" 	}																				\n" +
	" 	if(channel == 1.0) {															\n" +
	" 		specColor = sampleAs3DTexture(spectral_coeffs_g, tex_coord);				\n" +
	" 		destColor = sampleAs3DTexture(dest_coeffs_g, tex_coord);					\n" +
	" 	}																				\n" +
	" 	if(channel == 2.0) {															\n" +
	" 		specColor = sampleAs3DTexture(spectral_coeffs_b, tex_coord);				\n" +
	" 		destColor = sampleAs3DTexture(dest_coeffs_b, tex_coord);					\n" +
	" 	}																				\n" +
	" 																					\n" +
	" 	destColor = destColor + specColor;												\n" +
	" 	return destColor;																\n" +
	" }																					\n" +
	"                                                                                   \n" +
	" void main() {																		\n" +
	"	gl_FragColor = accumulateCoeff(channel);										\n" +
	" }																					\n" ;

var accumulateVertexShader = 
	" attribute vec2 position;															\n" +
	" 																					\n" +
	" uniform float grid_depth;															\n" +
	" uniform float halfDimSize;														\n" +
	" 																					\n" +
	" varying vec3 tex_coord;															\n" +
	" 																					\n" +
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
	" }																					\n" +
	" 																					\n" +
	" vec3 transTexturePos(in vec2 clipPos) { 											\n" +
	"	// input : clipPos in [0, 1]													\n" +
	"	// output: transTexCoord in [0, 1]												\n" +
	" 	vec3 transTexCoord; 															\n" +
	"	float zpos = clipPos.x;															\n" +
	" 	transTexCoord.z = floor(zpos * grid_depth); 									\n" +
	" 	transTexCoord.xy = clipPos; 													\n" +
	"  																					\n" +
	" 	transTexCoord.z /= grid_depth; 													\n" +
	" 	transTexCoord.z += halfDimSize; 												\n" +
	"  																					\n" +
	" 	return transTexCoord; 															\n" +
	" } 																				\n" +
	" 																					\n" +
	" void main() {																		\n" +
	" 	// position in [0,1] 															\n" +
	" 	// create texture coord in [0,1], get texture coordinate z axis 				\n" +
	" 	vec2 clipPos = position; 														\n" +
	" 	tex_coord = transTexturePos(clipPos); 											\n" +
	" 	 																				\n" +
	" 	// arrange 16 slices, xy in [0, 1], z is layer in [0, 15] 						\n" +
	" 	vec2 glPositionIn = position * 2.0 - 1.0; 										\n" +
	" 	gl_Position = geometryPosition(vec4(tex_coord, 1.0)); 							\n" +
	" }																					\n";