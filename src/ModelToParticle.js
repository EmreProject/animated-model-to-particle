import * as THREE from "three"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js" 


import vertex1 from "./shaders/modelLoaderVertex.glsl"
import fragment1 from "./shaders/modelLoaderFragment.glsl"
import vertex2 from "./shaders/subdivisionVertex.glsl"
import fragment2 from "./shaders/subdivisionFragment.glsl"
import vertex3 from "./shaders/skinnedModelLoaderVertex.glsl"
import fragment3 from "./shaders/skinnedModelLoaderFragment.glsl"

const gltfLoader=new GLTFLoader();



class SkinnedPoints extends THREE.Points {
    constructor(geometry, material) {
        super(geometry, material);

        this.isSkinnedMesh = true;
        this.type = 'SkinnedMesh';

        this.bindMatrix = new THREE.Matrix4();
        this.bindMatrixInverse = new THREE.Matrix4();
        this.skeleton = null;
    }
}


class AnimatedModelToParticle{

scene=new THREE.Scene();
root; //gltf.scene
animations; //gltf.animations
currentAnimationIndex;
subdivisionScene=new THREE.Scene();
renderer;
orthoCamera;
subdivision;
initialRenderTarget;
subdividedRenderTarget;
initRenderTargetSize;
subdividedTextureDimension;
indexTexture;
indexDataSize;
indexArray=[];
totalVertices=0;
newVertexNumber;
meshes = [];
points=[];
subdivisionMesh;
material;
skelatalMaterial;
subdivisionMaterial;

//animation
mixer;
action;


constructor(renderer,orthoCamera){
    this.renderer=renderer;
    this.orthoCamera=orthoCamera;
}

async LoadModel(modelLocation){

        this.material = new THREE.RawShaderMaterial({
                    vertexShader: vertex1,
                    fragmentShader: fragment1,
                    side: THREE.DoubleSide,
                    glslVersion:THREE.GLSL3,
                    uniforms:{
                        uTextureDimension:{value:0}
                    }
                })
            

        this.skelatalMaterial = new THREE.ShaderMaterial({
                    vertexShader: vertex3,
                    fragmentShader: fragment3,
                    side: THREE.DoubleSide,
                    glslVersion:THREE.GLSL3,
                    uniforms:{
                        uTextureDimension:{value:0}
                    },

                })
            
        this.subdivisionMaterial= new THREE.RawShaderMaterial({
                    vertexShader: vertex2,
                    fragmentShader: fragment2,
                    side: THREE.DoubleSide,
                    glslVersion:THREE.GLSL3,
                    uniforms:{
                        uSubdividedTextureDimension:{value:0},
                        uPositionTexture:{value:undefined},
                        uPositionTextureDimension:{value:0},
                        uIndexTexture:{value:undefined},
                        uIndexTextureDimension:{value:0},
                        uOriginalVertexNumber:{value:0},
                        uSubdividedVertexNumber:{value:0},
                        uSubdividedVertexNumberEachTriangle:{value:0},
                        uSubdivision:{value: 1}
                    
                    }
                })
            
            
            
                    const gltf = await gltfLoader.loadAsync(modelLocation);
            
            



                      this.root = gltf.scene;
                      this.animations=gltf.animations;
                      this.currentAnimationIndex=0;
                      gltf.scene.updateMatrixWorld(true);
                      this.mixer = new THREE.AnimationMixer(gltf.scene); 
                      this.action = this.mixer.clipAction(gltf.animations[this.currentAnimationIndex])
                      this.action.play()
                      gltf.scene.traverse((child) => {
                    
                          if (child.isMesh) {
                              this.meshes.push(child);
                          }
                      });
                  
                      for (const mesh of this.meshes) {
                      const vertexCount=mesh.geometry.getAttribute("position").count;
                    
                      const ids = new Float32Array(vertexCount);
                    
                      for (let i = 0; i < vertexCount; i++) {
                          ids[i] = i + this.totalVertices;
                      }
                  
                       mesh.geometry.setAttribute( "vertexId", new THREE.BufferAttribute        (ids,1));
                  
                      if(!mesh.geometry.index){
                    
                          const indexArr=[];
                          for(let i=0;i< vertexCount ; i++){
                              indexArr.push(i);
                          }
                      
                          mesh.geometry.setIndex(indexArr);
                      }
                  
                  
                      const indices=mesh.geometry.index.array.map(a=>a+this.totalVertices);
                      this.indexArray.push(...indices);
                      this.totalVertices += vertexCount;
                  
                  
                        let points_;
                        if(mesh.isSkinnedMesh){
                        
                           // mesh.material=this.skelatalMaterial
                              points_ = new SkinnedPoints(mesh.geometry,this.skelatalMaterial);
                              points_.bindMatrix.copy(mesh.bindMatrix);
                              points_.bindMatrixInverse.copy(mesh.bindMatrixInverse);
                              points_.skeleton = mesh.skeleton;
                        
                        }else{
                        
                           // mesh.material=this.material;
                            points_=new THREE.Points(mesh.geometry,this.material)
                        }
                        points_.matrixAutoUpdate = false;
                    
                    
                        this.points.push(points_);
                        this.scene.add(points_);
                }
            
            
            
                //index texture
                const triangleCount= this.indexArray.length/3;
                this.indexDataSize= Math.ceil(Math.sqrt(triangleCount));
                for(let i= 0; i< this.indexDataSize*this.indexDataSize - triangleCount; i++)        {
                    this.indexArray.push(-1,-1,-1);
                }
                const indexData=new Float32Array(this.indexDataSize*this.indexDataSize*4);
                for(let i=0;i<this.indexDataSize*this.indexDataSize;i++){
                    indexData[i*4]=this.indexArray[i*3];
                    indexData[i*4+1]=this.indexArray[i*3 + 1];
                    indexData[i*4+2]=this.indexArray[i*3 + 2];
                    indexData[i*4+3]=-1;
                }
                this.indexTexture=new THREE.DataTexture(indexData,this.indexDataSize,this.      indexDataSize,THREE.RGBAFormat,THREE.FloatType);
                this.indexTexture.minFilter = THREE.NearestFilter;
                this.indexTexture.magFilter = THREE.NearestFilter;
                this.indexTexture.generateMipmaps = false;
                this.indexTexture.needsUpdate = true;
            

                this.initRenderTargetSize= Math.ceil(Math.sqrt(this.totalVertices));
                this.initialRenderTarget= new THREE.WebGLRenderTarget(
                            this.initRenderTargetSize,
                            this.initRenderTargetSize,
                            {
                                count: 1,
                                type: THREE.FloatType,
                                format: THREE.RGBAFormat,
                                minFilter: THREE.NearestFilter,
                                magFilter: THREE.NearestFilter,
                                depthBuffer: false,
                                stencilBuffer: false
                            
                            });
                        
                        
                        
}

 ConvertModelToParticles(subdivision=1){

    this.subdivision=subdivision;

    let result={
        positionTexture:undefined,
        textureDimension:undefined,
        totalVertices:undefined
    }
   
        //initial rendertarget(without subdivision)
    
      for (let i = 0; i < this.meshes.length; i++) {
             this.points[i].matrix.copy(this.meshes[i].matrixWorld);
             this.points[i].matrixWorld.copy(this.meshes[i].matrixWorld);

             if (this.meshes[i].isSkinnedMesh) {
                 this.points[i].bindMatrix.copy(this.meshes[i].bindMatrix);
                 this.points[i].bindMatrixInverse.copy(this.meshes[i].bindMatrixInverse);
                 this.points[i].skeleton = this.meshes[i].skeleton;
             }
      }

        this.material.uniforms.uTextureDimension.value=this.initRenderTargetSize;
        this.skelatalMaterial.uniforms.uTextureDimension.value=this.initRenderTargetSize;
        this.renderer.setRenderTarget(this.initialRenderTarget);
        this.scene.updateMatrixWorld(true);
        this.renderer.render(this.scene,this.orthoCamera);
        
        result.positionTexture=this.initialRenderTarget.textures[0];
        result.textureDimension=this.initRenderTargetSize;
        result.totalVertices=this.totalVertices;


        //if subdivison > 1  3^0 + ... 3^subdiv-2... 
        if(subdivision > 1){

            let newPointEach = 0;
            for(let i=0;i< subdivision-1;i++){

                newPointEach += Math.pow(3,i);
            }


            const totalTriangle = this.indexArray.length / 3;
            this.newVertexNumber= totalTriangle * newPointEach + this.totalVertices;
         
            this.subdividedTextureDimension= Math.ceil(Math.sqrt(this.newVertexNumber));
            const planeGeometry = new THREE.PlaneGeometry(2,2);

            this.subdivisionMaterial.uniforms.uSubdividedTextureDimension.value= this.subdividedTextureDimension;
            this.subdivisionMaterial.uniforms.uPositionTexture.value= this.initialRenderTarget.textures[0];
            this.subdivisionMaterial.uniforms.uPositionTextureDimension.value= this.initRenderTargetSize;
            this.subdivisionMaterial.uniforms.uIndexTexture.value = this.indexTexture;
            this.subdivisionMaterial.uniforms.uIndexTextureDimension.value = this.indexDataSize;
            this.subdivisionMaterial.uniforms.uOriginalVertexNumber.value=this.totalVertices;
            this.subdivisionMaterial.uniforms.uSubdividedVertexNumber.value=totalTriangle * newPointEach;
            this.subdivisionMaterial.uniforms.uSubdividedVertexNumberEachTriangle.value=newPointEach;
            this.subdivisionMaterial.uniforms.uSubdivision.value=subdivision
         

            this.subdivisionMesh=new THREE.Mesh(planeGeometry,this.subdivisionMaterial);
            this.subdivisionScene.add(this.subdivisionMesh);

            this.subdividedRenderTarget= new THREE.WebGLRenderTarget(
                    this.subdividedTextureDimension,
                    this.subdividedTextureDimension,
                    {   count: 1,
                        type: THREE.FloatType,
                        format: THREE.RGBAFormat,
                        minFilter: THREE.NearestFilter,
                        magFilter: THREE.NearestFilter,
                        depthBuffer: false,
                        stencilBuffer: false  
                    });

        this.renderer.setRenderTarget(this.subdividedRenderTarget);
        this.renderer.render(this.subdivisionScene,this.orthoCamera);

        result.positionTexture=this.subdividedRenderTarget.textures[0];
        result.textureDimension=this.subdividedTextureDimension;
        result.totalVertices=this.newVertexNumber;

        }

        
        
      


         this.renderer.setRenderTarget(null);

        


        return result;
 }


 ChangeAnimationIndex(index){

    if(index!= this.currentAnimationIndex){
        this.currentAnimationIndex=index;
        this.action.stop();
        this.action=this.mixer.clipAction(this.animations[index]);
        this.action.play();
    }

 }

 UpdateAnimation(deltaTime){
    if(this.mixer)
    {
        this.mixer.update(deltaTime)
        this.root.updateMatrixWorld(true);
    }

    let result={
        positionTexture:undefined,
        textureDimension:undefined,
        totalVertices:undefined
    }
   
        //initial rendertarget(without subdivision)
    
      for (let i = 0; i < this.meshes.length; i++) {
             this.points[i].matrix.copy(this.meshes[i].matrixWorld);
             this.points[i].matrixWorld.copy(this.meshes[i].matrixWorld);
          
           
             if (this.meshes[i].isSkinnedMesh) {
                 this.points[i].bindMatrix.copy(this.meshes[i].bindMatrix);
                 this.points[i].bindMatrixInverse.copy(this.meshes[i].bindMatrixInverse);
                 this.points[i].skeleton = this.meshes[i].skeleton;
             }
      }

        this.material.uniforms.uTextureDimension.value=this.initRenderTargetSize;
        this.skelatalMaterial.uniforms.uTextureDimension.value=this.initRenderTargetSize;
        this.renderer.setRenderTarget(this.initialRenderTarget);
        this.scene.updateMatrixWorld(true);
        this.renderer.render(this.scene,this.orthoCamera);
        
        result.positionTexture=this.initialRenderTarget.textures[0];
        result.textureDimension=this.initRenderTargetSize;
        result.totalVertices=this.totalVertices;

        if(this.subdivision>1){


        this.renderer.setRenderTarget(this.subdividedRenderTarget);
        this.renderer.render(this.subdivisionScene,this.orthoCamera);

        result.positionTexture=this.subdividedRenderTarget.textures[0];
        result.textureDimension=this.subdividedTextureDimension;
        result.totalVertices=this.newVertexNumber;

        }
        this.renderer.setRenderTarget(null);

        return result

    
 }





}


 export {AnimatedModelToParticle}