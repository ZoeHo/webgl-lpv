var cubeFragmentShader =
	" precision mediump float;												\n" +
    " varying vec4 vColor;													\n" +
    "																		\n" +
	" /*varying vec2 vTextureCoord;											\n" +
	" 																		\n" +
	" uniform sampler2D uSampler;*/											\n" +
	"																		\n" +
    " void main(void) {														\n" +
	"    gl_FragColor = /*texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) **/vColor; \n" +
	" }																		\n";

var cubeVertexShader =
    " attribute vec3 aVertexPosition;										\n" +
    " attribute vec4 aVertexColor;											\n" +
	" /*attribute vec2 aTextureCoord;*/										\n" +
	"																		\n" +
	" uniform mat4 uMVMatrix;												\n" +
	" uniform mat4 uPMatrix;												\n" +
	"																		\n" +
	" varying vec4 vColor;													\n" +
	" /*varying vec2 vTextureCoord;*/										\n" +
	"																		\n" +
	" void main(void) {														\n" +
	"    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);	\n" +
	"	 vColor = aVertexColor;												\n" +
	"    //vColor = uMVMatrix * aVertexColor;	 							\n" +
	"    //vTextureCoord = aTextureCoord;									\n" +
	" }																		\n";

// printf texture shader
var texVertexShader = 
	" attribute vec2 a_position;							\n" +
	" void main() {											\n" +
	"     gl_Position = vec4(a_position, 0, 1);				\n" +
	" }														\n" ;

var texFragmentShader = 
	" precision mediump float;																	\n" +
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
	" precision mediump float;								\n" +
	" uniform vec2 u_resolution;							\n" +
	" uniform sampler2D u_tex;								\n" +
	" void main() {											\n" +
	"     vec2 texCoord = gl_FragCoord.xy / u_resolution;	\n" +
	"     gl_FragColor = texture2D(u_tex, texCoord);		\n" +
	" }														\n" ;

var rgbaTexFragmentShader =
	" precision mediump float;								\n" +
	" uniform vec2 u_resolution;							\n" +
	" uniform sampler2D u_tex;								\n" +
	" void main() {											\n" +
	" 	vec2 texCoord = gl_FragCoord.xy / u_resolution;		\n" +
	"	vec4 color = texture2D(u_tex, texCoord);			\n" +
	"	//if(color.r > 0.0) {color.r = 1.0;} if(color.g > 0.0) {color.g = 1.0;} if(color.b > 0.0) {color.b = 1.0;} \n" +
	"   gl_FragColor = vec4(color.rgb, 1.0);				\n" +
	" }														\n" ; 