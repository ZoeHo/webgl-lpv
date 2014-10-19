// depth normal shader for inject blocker
// store view space normal and depth in an RGBA texture
// which rg = depth & ba = normal
var depthNormalFragmentShader =
    " precision mediump float;										\n" +
    " varying vec3 view_space_normal; 								\n" +
    " varying float view_space_depth; 								\n" +
    "																\n" +
    " void main() { 												\n" +
    "	vec2 packed_depth;											\n" +
    "	packed_depth.r = floor(view_space_depth * 255.0) / 255.0;	\n" +
    "	packed_depth.g = fract(view_space_depth * 255.0);			\n" +
    "																\n" +
    "	vec2 normal = vec2(normalize(view_space_normal) );			\n" +
    "	normal = normal * 0.5 + 0.5;								\n" +
    "																\n" +
    "	gl_FragColor = vec4(packed_depth, normal);	       			\n" +
    " }																\n";

var depthNormalVertexShader =
    " attribute vec4 position;										\n" +
    " attribute vec3 normal;										\n" +
    "																\n" +
    " varying vec3 view_space_normal;								\n" +
    " varying float view_space_depth;								\n" +
    "																\n" +
    " uniform mat4 projection_matrix;								\n" +
    " uniform mat4 view_matrix;										\n" +
    " uniform vec2 near_far_plane;									\n" +
    "																\n" +
    " void main() {													\n" +
    " 	mat4 mv_matrix = view_matrix;								\n" +
    "																\n" +
    " 	mat4 mvp_matrix = projection_matrix * mv_matrix;			\n" +
    "																\n" +
    " 	gl_Position = mvp_matrix * position;						\n" +
    "																\n" +
    "	view_space_normal = mat3(mv_matrix) * normal;				\n" +
    "																\n" +
    "	view_space_depth = ((-(mv_matrix * position).z)				\n" +
    "	- near_far_plane.x) / near_far_plane.y;						\n" +
    " }																\n";