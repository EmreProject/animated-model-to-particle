import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import  {AnimatedModelToParticle} from "./ModelToParticle.js";


import vertex from "./shaders/particleVertex.glsl"
import fragment from "./shaders/particleFragment.glsl"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Renderer
 */

const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
 renderer.setSize(window.innerWidth,window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



let renderScene;
let orthoCamera,perspectiveCamera;


//gui
const gui = new dat.GUI()

// Scene
renderScene = new THREE.Scene()


//Oamera
orthoCamera = new THREE.OrthographicCamera( - 1000, 1000, 1000, - 1000, -1000, 1000 );
orthoCamera.position.z=-1;
orthoCamera.lookAt(new THREE.Vector3(0,0,0));

perspectiveCamera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 500 );
perspectiveCamera.position.z = -3;
perspectiveCamera.lookAt(new THREE.Vector3(0,0,0));

//for debug real model
let model=null;
let modelAnimations=null;
let mixer = null
let action=null;

const modelLocation="./models/imperial_guard/scene.gltf";

let modelToParticle, particles;
const subdivision=1;
const startScale=0.005; //whale:0.02 - warrior: 0.1 - buster_drone: 5 - chest knight:0.8 - imperial_guard:0.005
const initParticle=async function() {


         modelToParticle=new  AnimatedModelToParticle(renderer,orthoCamera);
    
        await modelToParticle.LoadModel(modelLocation);
        modelToParticle.root.scale.set(startScale,startScale,startScale);
        modelToParticle.root.position.y=5;
        modelToParticle.root.updateMatrixWorld(true);

        const particleInfo=modelToParticle.ConvertModelToParticles(subdivision);
        const planeGeometry=new THREE.PlaneGeometry(2,2,particleInfo.textureDimension-1, particleInfo.textureDimension-1);
        const particleMaterial=new THREE.RawShaderMaterial({
        
            vertexShader:vertex,
            fragmentShader:fragment,
            glslVersion:THREE.GLSL3,
            uniforms:{
            
                uTextureDimension:{value:particleInfo.textureDimension},
                uTotalVertices:{value:particleInfo.totalVertices},
                uPositionTexture:{value:particleInfo.positionTexture},
            }
        })

      
        particles=new THREE.Points(planeGeometry,particleMaterial)
        //particles.scale.set(startScale,startScale,startScale) //warrior
        //particles.position.y=-0.5;
        renderScene.add(particles)


        //For Debug Purpose
        const guiParameters={
            animation:modelToParticle.currentAnimationIndex,
            scale:startScale
        };

        const options=[];
        for(let i=0;i<modelToParticle.animations.length;i++){
            options.push(i);
        }
        gui.add(guiParameters,"animation").options(options).onChange(()=>{
           modelToParticle.ChangeAnimationIndex(guiParameters.animation)

            if(action && mixer && model){
                action.stop();
                action=mixer.clipAction(modelAnimations[guiParameters.animation]);
                action.play();
            }
        });

        gui.add(guiParameters,"scale").min(startScale/20).max(startScale*20).step(0.0001).onChange(()=>{

           // particles.scale.set(guiParameters.scale,guiParameters.scale,guiParameters.scale)
           modelToParticle.root.scale.set(guiParameters.scale,guiParameters.scale,guiParameters.scale);

            if(model){
                  model.scene.scale.set(guiParameters.scale,guiParameters.scale,guiParameters.scale);
            }

        })

}
initParticle();

//debug

const gltfLoader=new GLTFLoader();
gltfLoader.load(modelLocation,(gltf)=>{

    model=gltf;
     gltf.scene.updateMatrixWorld(true);
     modelAnimations=gltf.animations
     model.scene.scale.set(startScale,startScale,startScale)
    model.scene.position.y=-10;
     gltf.scene.traverse((child)=>{
        if(child.isMesh){
            child.material.depthWrite=true;
              child.material.depthTest=true;
          
        }
     })
     renderScene.add(model.scene)
  
     
    mixer= new THREE.AnimationMixer(gltf.scene); 
    action=mixer.clipAction(gltf.animations[0]);
    action.play();
    
})


const ambientLight=new THREE.AmbientLight("white",1);
const dirLight=new THREE.DirectionalLight("white",10);
dirLight.lookAt(new THREE.Vector3(0,0,0));
dirLight.position.set(0,10,-10)
renderScene.add(dirLight)
renderScene.add(ambientLight)



window.addEventListener('resize', () =>
{

    // Update camera
    perspectiveCamera.aspect = window.innerWidth/ window.innerHeight
    perspectiveCamera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})



// Controls
const controls = new OrbitControls(perspectiveCamera, canvas)
controls.enableDamping = true




/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{


      const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Model animation
    if(mixer)
    {
        mixer.update(deltaTime)
    }
    

    if(particles &&  modelToParticle){

       const particleInfo=  modelToParticle.UpdateAnimation(deltaTime);
  
        particles.material.uniforms.uTextureDimension.value=particleInfo.textureDimension;
        particles.material.uniforms.uTotalVertices.value=particleInfo.totalVertices;
        particles.material.uniforms.uPositionTexture.value=particleInfo.positionTexture;

    }

    // Update controls
    controls.update()

    // Render
    renderer.render(renderScene, perspectiveCamera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()