// shader for blur
// is used after indirect light shader
var blurFragmentShader = 
	" precision mediump float;																	\n" +
	" uniform sampler2D depth_normal_tex;														\n" +
	" uniform sampler2D indirect_light_tex;														\n" +
	" uniform vec2 near_far_plane;																\n" +
	" uniform mat4 view_to_grid_mat;															\n" +
	" uniform vec2 inv_proj;																	\n" +
	" uniform vec2 grid_to_texture_scale;														\n" +
	" uniform vec4 dist_threashold;																\n" +
	"																							\n" +
	" varying vec2 tex_coord;																	\n" +
	" varying vec2 clip_pos;																	\n" +
	"																							\n" +
	" const float weight1 = 0.05449;															\n" +
	" const float weight2 = 0.24420;															\n" +
	" const float center_weight = 0.40262;														\n" +
	"																							\n" +
	" // get depth in view space																\n" +
	" float unpack_depth(in vec2 d) {															\n" +
	"	float depth = d.x + d.y / 255.0;														\n" +
	" 	depth = depth * near_far_plane.y + near_far_plane.x;									\n" +
	" 	return depth;																			\n" +
	" }																							\n" +
	"																							\n" +
	" vec3 unpack_normal(in vec2 n) {															\n" +
	" 	vec3 normal;																			\n" +
	" 	normal.xy = 2.0 * (n - 0.5);															\n" +
	" 	vec2 n2 = normal.xy * normal.xy;														\n" +
	" 	float z2 = abs(1.0 - n2.x - n2.y);														\n" +
	" 	normal.z = sqrt(z2);																	\n" +
	" 	return normal;																			\n" +
	" }																							\n" +
	"																							\n" +
	" // calculate position in view space from view space depth									\n" +
	" vec3 calc_view_pos(in float depth, in vec2 pos) {											\n" +
	" 	vec3 view_pos = vec3(pos, -1.0);														\n" +
	" 	view_pos.xy = view_pos.xy * inv_proj.xy; 												\n" +
	" 	view_pos *= depth;																		\n" +
	" 																							\n" +
	" 	return view_pos;																		\n" +
	" }																							\n" +
	"																							\n" +
	" // read surface normal, position and indirect light										\n" +
	" void get_sample(in vec2 offset, out vec3 pos, out vec3 normal, out vec3 indirect_light) {	\n" +
	" 	vec2 tex_coord2 = offset + tex_coord;													\n" +
	" 	vec4 t = texture2D(depth_normal_tex, tex_coord2);										\n" +
	" 																							\n" +
	" 	vec2 clip_pos2 = tex_coord2 * 2.0 - 1.0;												\n" +
	" 	float depth = unpack_depth(t.rg);														\n" +
	" 	pos = calc_view_pos(depth, clip_pos2);													\n" +
	" 																							\n" +
	" 	indirect_light = texture2D(indirect_light_tex, tex_coord2).rgb;							\n" +
	" 																							\n" +
	" 	normal = unpack_normal(t.ba);															\n" +
	" }																							\n" +
	"																							\n" +
	" vec4 contribution(vec3 center, vec3 pos1, vec3 pos2, vec3 pos3, vec3 pos4, vec3 center_normal, vec3 normal1, vec3 normal2, vec3 normal3, vec3 normal4) {	\n" +
	" 	// check if the neighbour is on the same surface by comparing surface normal and position																\n" +
	" 	const float min_cos = 0.95;																\n" +
	" 																							\n" +
	" 	vec3 v1 = center - pos1;																\n" +
	" 	vec3 v2 = center - pos2;																\n" +
	" 	vec3 v3 = center - pos3;																\n" +
	" 	vec3 v4 = center - pos4;																\n" +
	" 																							\n" +
	" 	vec4 dist = vec4(dot(v1, v1), dot(v2, v2), dot(v3, v3), dot(v4, v4) );					\n" +
	" 	vec4 angle = vec4(dot(center_normal, normal1), dot(center_normal, normal2), dot(center_normal, normal3), dot(center_normal, normal4) );	\n" +
	" 																							\n" +
	" 	// return 0 or 1																		\n" +
	" 	// 1 if neighbour is on the same surface												\n" +
	" 	return step(dist, dist_threashold) * step(min_cos, angle);								\n" +
	" }																							\n" +
	"																							\n" +
	" void main() {																				\n" +
	" 	// use a bilateral filter to blur indirect light values									\n" +
	" 																							\n" +
	" 	// read surface normal and depth														\n" +
	" 	vec4 t = texture2D(depth_normal_tex, tex_coord);										\n" +
	" 	float depth = unpack_depth(t.rg);														\n" +
	" 	vec3 pos = calc_view_pos(depth, clip_pos.xy);											\n" +
	" 	// read corresponding indirect light value												\n" +
	" 	vec3 indirect_light = texture2D(indirect_light_tex, tex_coord).rgb;						\n" +
	" 	vec3 normal = unpack_normal(t.ba);														\n" +
	" 																							\n" +
	" 	// project the distance between cell centers in world space to texture space			\n" +
	" 	vec2 d = grid_to_texture_scale / vec2(depth);											\n" +
	" 																							\n" +
	" 	vec2 sample_pos2 = d * 2.0;																\n" +
	" 	vec2 sample_pos3 = d;																	\n" +
	" 	vec2 sample_pos4 = -sample_pos3;														\n" +
	" 	vec2 sample_pos5 = -sample_pos2;														\n" +
	" 																							\n" +
	" 	// get values of neighbours																\n" +
	" 	vec3 indirect_light2;																	\n" +
	" 	vec3 pos2;																				\n" +
	" 	vec3 normal2;																			\n" +
	" 	get_sample(sample_pos2, pos2, normal2, indirect_light2);								\n" +
	" 																							\n" +
	" 	vec3 indirect_light3;																	\n" +
	" 	vec3 pos3;																				\n" +
	" 	vec3 normal3;																			\n" +
	" 	get_sample(sample_pos3, pos3, normal3, indirect_light3);								\n" +
	" 																							\n" +
	" 	vec3 indirect_light4;																	\n" +
	" 	vec3 pos4;																				\n" +
	" 	vec3 normal4;																			\n" +
	" 	get_sample(sample_pos4, pos4, normal4, indirect_light4);								\n" +
	" 																							\n" +
	" 	vec3 indirect_light5;																	\n" +
	" 	vec3 pos5;																				\n" +
	" 	vec3 normal5;																			\n" +
	" 	get_sample(sample_pos5, pos5, normal5, indirect_light5);								\n" +
	" 																							\n" +
	" 	// blur																					\n" +
	" 																							\n" +
	" 	// center																				\n" +
	" 	vec3 indirect = indirect_light * center_weight;											\n" +
	" 																							\n" +
	" 	// neighbours																			\n" +
	" 	vec4 contribution_values = contribution(pos, pos2, pos3, pos4, pos5, normal, normal2, normal3, normal4, normal5); \n" +
	" 	indirect += mix(indirect_light * weight1, indirect_light2 * weight1, contribution_values.x);			\n" +
	" 	indirect += mix(indirect_light * weight2, indirect_light3 * weight2, contribution_values.y);			\n" +
	" 	indirect += mix(indirect_light * weight2, indirect_light4 * weight2, contribution_values.z);			\n" +
	" 	indirect += mix(indirect_light * weight1, indirect_light5 * weight1, contribution_values.w);			\n" +
	" 																							\n" +
	" 	gl_FragColor.rgb = indirect;															\n" +
	" }																							\n";

var blurVertexShader =
	" attribute vec4 position;							\n" +
	"													\n" +
	" varying vec2 clip_pos;							\n" +
	" varying vec2 tex_coord;							\n" +
	"													\n" +
	" void main() {										\n" +
	" 	gl_Position = position;							\n" +
	" 	clip_pos = position.xy;							\n" +
	"	tex_coord = ( clip_pos * 0.5 ) + vec2( 0.5 );	\n" +
	" }													\n";