 in vec3 position;
 in vec2 uv;



uniform float uTextureDimension;
uniform float uTotalVertices;
uniform sampler2D uPositionTexture;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
    
  void main() {

  gl_PointSize = 1.0;
    float id = float(gl_VertexID);

    if(id>=uTotalVertices){
        gl_PointSize = 0.0;
    }

    float col = mod(id, uTextureDimension);
    float row = floor(id / uTextureDimension);

    // texel center in [0,1]
    vec2 texelUV = (vec2(col, row) + 0.5) / uTextureDimension;
    texelUV.y= 1. - texelUV.y;

   vec3 position_ = texture(uPositionTexture, texelUV).xyz;
    
    gl_Position = projectionMatrix* viewMatrix *modelMatrix* vec4(position_.xyz,1.);
 
   
  }