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
	"    vColor = aVertexColor;												\n" +
	"    /*vTextureCoord = aTextureCoord;*/									\n" +
	" }																		\n";