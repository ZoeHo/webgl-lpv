// resample shader for inject blocker
// downsample
var resampleFragmentShader =
    " precision mediump float;								\n" +
    " varying vec2 texcoord;								\n" +
    " 														\n" +
    " uniform sampler2D texture;							\n" +
    "														\n" +
    " void main() {											\n" +
    " 	gl_FragColor = texture2D(texture, texcoord);		\n" +
    " }														\n";

var resampleVertexShader =
    " attribute vec4 position;								\n" +
    "														\n" +
    " varying vec2 texcoord;								\n" +
    "														\n" +
    " void main() {											\n" +
    " 	gl_Position = position;								\n" +
    "	texcoord = 0.5 * position.xy + vec2(0.5);			\n" +
    " }														\n";