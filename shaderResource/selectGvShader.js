// select geometry volume blocker shader
// select blocker from inject blocker(rsm) & inject blocker2(depth normal)

var selectGvFragmentShader =
	" precision mediump float;																	\n" +
	" uniform sampler2D gv_from_rsm; 															\n" +
	" uniform sampler2D gv_from_visible_surface;												\n" +
	" 																							\n" +
	" varying vec2 tex_coord;																	\n" +
	" 																							\n" +
	" void main() {																				\n" +
	" 	// if we have two blocking potentials in the same cell we have to select one			\n" +
	" 																							\n" +
	" 	// select based on magnitude															\n" +
	" 	vec4 rsm_blocker = texture2D(gv_from_rsm, tex_coord);									\n" +
	" 	float rsm_blocker_mag = dot(rsm_blocker, rsm_blocker);									\n" +
	" 																							\n" +
	" 	vec4 surface_blocker = texture2D(gv_from_visible_surface, tex_coord);					\n" +
	" 	float surface_blocker_mag = dot(surface_blocker, surface_blocker);						\n" +
	" 																							\n" +
	" 	// check if rsm blocker is visible, surface blocker is visible because it comes from a surface in view space	\n" +
	" 	float angle = dot(rsm_blocker, surface_blocker);										\n" +
	" 																							\n" +
	" 	vec4 blocker = rsm_blocker_mag > surface_blocker_mag ? rsm_blocker : surface_blocker;	\n" +
	" 	blocker = angle > 0.0 ? blocker : surface_blocker;										\n" +
	" 																							\n" +
	"	gl_FragColor = blocker;																	\n" +
	" }																							\n";


var selectGvVertexShader = 
	" attribute vec2 position;						\n" +
	" 												\n" +
	" varying vec2 tex_coord;						\n" +
	" 												\n" +
	" void main() {									\n" +
	"  	gl_Position = vec4(position, 0, 1);			\n" +
	"	vec2 clipPos = gl_Position.xy;				\n" +
	" 	tex_coord = (clipPos * 0.5) + vec2(0.5);	\n" +
	" }												\n";
