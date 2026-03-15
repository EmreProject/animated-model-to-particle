 in vec3 position;
 in vec2 uv;
 in float vertexId;

out vec2 vUv;
out vec4 vPosition;

uniform float uTextureDimension;


uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
    
  void main() {

    float col = mod(vertexId, uTextureDimension);
    float row = floor(vertexId / uTextureDimension);

    // texel center in [0,1]
    vec2 texelUV = (vec2(col, row) + 0.5) / uTextureDimension;

    // convert to clip space [-1,1]
    float x = texelUV.x * 2.0 - 1.0;
    float y = 1.0 - texelUV.y * 2.0;
    
    gl_Position = vec4(x,y,0.,1.);
  gl_PointSize=1.;
    vUv=uv;
    vPosition= modelMatrix * vec4(position, 1.0);
  }