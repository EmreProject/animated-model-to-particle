    precision highp float;
	precision highp int;



    in vec2 vUv;
    in vec4 vPosition;

   
    uniform float uSubdividedTextureDimension;
    uniform sampler2D uPositionTexture;
    uniform float uPositionTextureDimension;
    uniform sampler2D uIndexTexture;
    uniform float uIndexTextureDimension;
    uniform float uOriginalVertexNumber;
    uniform float uSubdividedVertexNumber;
    uniform float uSubdividedVertexNumberEachTriangle;
    uniform float uSubdivision;

    layout(location = 0) out vec4 vertexPosition;



struct Triangle {
    vec3 pos1;
    vec3 pos2;
    vec3 pos3;
};


    vec2 coordinateToPixel(float x, float y){ //-1 to 1
        
        float positionX= ((x+1.) / 2.) * uSubdividedTextureDimension;
        float positionY= ((y-1.) / -2.) * uSubdividedTextureDimension;

        return vec2(positionX,positionY);

    }

    float pixelId(float x, float y){

        return y*uSubdividedTextureDimension + x;
    }


    vec2 pixelIdToUv(float id, float textureDimension){

       float col = mod(id, textureDimension);
       float row = floor(id / textureDimension);

       vec2 texelUV = (vec2(col, row) + 0.5) / textureDimension;
       texelUV.y = 1.0 - texelUV.y ;

        return texelUV;
    }


    Triangle getOriginalTriangle(vec3 indices) {
             Triangle tri;

             vec2 texUv = pixelIdToUv(indices.x, uPositionTextureDimension);
             tri.pos1 = texture(uPositionTexture, texUv).xyz;

             texUv = pixelIdToUv(indices.y, uPositionTextureDimension);
             tri.pos2 = texture(uPositionTexture, texUv).xyz;

             texUv = pixelIdToUv(indices.z, uPositionTextureDimension);
             tri.pos3 = texture(uPositionTexture, texUv).xyz;

             return tri;
    }

   void chooseChildTriangle(inout Triangle tri, int childIndex) {
    vec3 A = tri.pos1;
    vec3 B = tri.pos2;
    vec3 C = tri.pos3;
    vec3 G = (A + B + C) / 3.0;

    if (childIndex == 0) {
        tri.pos1 = A;
        tri.pos2 = B;
        tri.pos3 = G;
    }
    else if (childIndex == 1) {
        tri.pos1 = B;
        tri.pos2 = C;
        tri.pos3 = G;
    }
    else {
        tri.pos1 = C;
        tri.pos2 = A;
        tri.pos3 = G;
    }
}

vec3 getSubdividedPosition(vec3 triangleIndices, float localIndexFloat) {
    Triangle tri = getOriginalTriangle(triangleIndices);

    int localIndex = int(localIndexFloat);

    // user convention:
    // uSubdivision = 1 -> no subdivision, 0 centroids
    // uSubdivision = 2 -> 1 centroid
    // uSubdivision = 3 -> 1 + 3 centroids
    int centroidLevels = int(uSubdivision) - 1;

    // safety cap for GLSL array/loop limits
    const int MAX_LEVELS = 12;

    if (centroidLevels <= 0) {
        return vec3(0.0); // should not happen if caller checks properly
    }

    // Determine which centroid level this local index belongs to.
    // level = 0 means first centroid level (1 centroid)
    // level = 1 means second centroid level (3 centroids)
    // level = 2 means third centroid level (9 centroids)
    int level = -1;
    int countBefore = 0;
    int countAtLevel = 1;

    for (int l = 0; l < MAX_LEVELS; l++) {
        if (l >= centroidLevels) break;

        if (localIndex < countBefore + countAtLevel) {
            level = l;
            break;
        }

        countBefore += countAtLevel;
        countAtLevel *= 3;
    }

    if (level < 0) {
        return vec3(0.0);
    }

    // index of the triangle inside that level
    int triangleIndexInLevel = localIndex - countBefore;

    // decode path in base-3
    int digits[MAX_LEVELS];
    for (int i = 0; i < MAX_LEVELS; i++) {
        digits[i] = 0;
    }

    int temp = triangleIndexInLevel;
    for (int i = 0; i < MAX_LEVELS; i++) {
        if (i > level) break;
        digits[i] = temp % 3;
        temp /= 3;
    }

    // walk from top level to bottom level
    for (int d = MAX_LEVELS - 1; d >= 0; d--) {
        if (d > level) continue;
        chooseChildTriangle(tri, digits[d]);
    }

    // return centroid of the chosen triangle
    return (tri.pos1 + tri.pos2 + tri.pos3) / 3.0;
}


    void main() {

        vec3 position=vec3(0.,0.5,0.);
         
        float posX=vPosition.x;
        float posY=vPosition.y;

        vec2 pixelCoordinate=coordinateToPixel(posX,posY);
        float pixelId_=pixelId(pixelCoordinate.x,pixelCoordinate.y);


        if(pixelId_ >= uSubdividedVertexNumber && pixelId_ < uSubdividedVertexNumber + uOriginalVertexNumber){

            float index= pixelId_ - uSubdividedVertexNumber;
            vec2 texUv= pixelIdToUv(index,uPositionTextureDimension);
            position = texture(uPositionTexture, texUv).xyz;


        }else if(pixelId_ < uSubdividedVertexNumber){

            float triangleIndex= floor(pixelId_/uSubdividedVertexNumberEachTriangle);

            vec2 texUv= pixelIdToUv(triangleIndex,uIndexTextureDimension);
            vec3 triangleIndices=texture(uIndexTexture,texUv).xyz;

            float localIndex = mod(pixelId_, uSubdividedVertexNumberEachTriangle);

            position = getSubdividedPosition(triangleIndices, localIndex);



        }else{

            discard;
        }


     
        vertexPosition=vec4(position,1.);
    }