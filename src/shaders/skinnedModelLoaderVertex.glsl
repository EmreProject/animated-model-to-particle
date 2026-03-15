in float vertexId;

uniform float uTextureDimension;


out vec4 vPosition;

#include <common>
#include <skinning_pars_vertex>

void main() {
    
    #include <begin_vertex>
    #include <skinbase_vertex>
    #include <skinning_vertex>

    vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
    vPosition = worldPos;

    float col = mod(vertexId, uTextureDimension);
    float row = floor(vertexId / uTextureDimension);

    // texel center in [0,1]
    vec2 texelUV = (vec2(col, row) + 0.5) / uTextureDimension;

    // convert to clip space [-1,1]
    float x = texelUV.x * 2.0 - 1.0;
    float y = 1.0 - texelUV.y * 2.0;
    
    gl_Position = vec4(x,y,0.,1.);
    gl_PointSize=1.;

}