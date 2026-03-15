 in vec3 position;
 in vec2 uv;

out vec2 vUv;
out vec4 vPosition;


uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
    
  void main() {
    
    gl_Position = vec4(position,1.);
  
    vUv=uv;
    vPosition=vec4(position, 1.0);
  }