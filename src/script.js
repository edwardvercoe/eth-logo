import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";

import * as dat from "dat.gui";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
const parameters = {
  color: 0x20202,
};
const debugObject = {};

const loadingManager = new THREE.LoadingManager();

const textureLoader = new THREE.TextureLoader(loadingManager);
const normalTexture = textureLoader.load(
  "/models/ethereum_3d_logo/normal.jpeg"
);
const specMap = textureLoader.load(
  "/models/ethereum_3d_logo/textures/default_specularGlossiness.png"
);

normalTexture.offset.x = 0.5;
normalTexture.offset.y = 0.5;
normalTexture.wrapS = THREE.RepeatWrapping;
normalTexture.wrapT = THREE.RepeatWrapping;
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshPhongMaterial
    ) {
      child.material.envMapIntensity = 10;
      child.material.needsUpdate = true;
    }
  });
};

// Models
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let mixer = null;

let ethModel;

// texure loader

gltfLoader.load(
  "/models/ethereum_3d_logo/scene.gltf",
  (gltf) => {
    ethModel = gltf.scene;
    ethModel.scale.set(0.005, 0.005, 0.005);
    ethModel.position.y = 0.7;

    // Change mesh material of model
    var newMaterial = new THREE.MeshPhongMaterial({
      color: parameters.color,
      shininess: 100,
      specular: 0xffffff,
      specularMap: specMap,
      map: normalTexture,
      flatShading: true,
    });
    ethModel.traverse((o) => {
      if (o.isMesh) {
        o.material = newMaterial;
      }
    });
    // console.log(ethModel);

    //  Change color of ma
    // ethModel.traverse((o) => {
    //   if (o.isMesh) {
    //     // o.material._extraUniforms.specular.value = new THREE.Color(0x000000);
    //     o.material.color = new THREE.Color(0x242526);
    //     // o.material.wireframe = true;
    //   }

    //   console.log(o.material, " <---");
    // });

    scene.add(gltf.scene);
    updateAllMaterials();
    updateGui();
  },
  (progress) => {
    console.log("Loading...");
  }
);

const updateGui = () => {
  ethModel.traverse((o) => {
    if (o.isMesh) {
      gui.addColor(parameters, "color").onChange(() => {
        o.material.color.set(parameters.color);
      });
    }
  });
};

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const plRight = new THREE.PointLight(0xffbf00, 0.35, 30);

plRight.position.set(2, -1.5, 2);
scene.add(plRight);

const plLeft = new THREE.PointLight(0xdbf3fa, 0.35, 30);

plLeft.position.set(-3, 4, 2);
scene.add(plLeft);

const dLightRightHelper = new THREE.PointLightHelper(plRight, 1);
const dLightLeftHelper = new THREE.PointLightHelper(plLeft, 1);

const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0, 0.8, 3);
scene.add(directionalLight);

const dlHelper = new THREE.DirectionalLightHelper(directionalLight, 1);

// add helpers to scene
// scene.add(dLightRightHelper, dLightLeftHelper, dlHelper);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // update  effect composer
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  effectComposer.setSize(sizes.width, sizes.height);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(1, 2, 5);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Post processing
 */

// render target
const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  encoding: THREE.sRGBEncoding,
});
// composer
const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
effectComposer.setSize(sizes.width, sizes.height);

//passes
const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);
const bloomPass = new UnrealBloomPass({ strength: 0.3 });
// bloomPass.enabled = false;
bloomPass.strength = 0.3;
effectComposer.addPass(bloomPass);
gui.add(bloomPass, "strength").min(0).max(1).step(0.01);

const glitchPass = new GlitchPass();
// glitchPass.goWild = true;
// glitchPass.enabled = false;
effectComposer.addPass(glitchPass);

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  if (ethModel) {
    ethModel.rotation.y = 0.5 * elapsedTime;
  }

  // update mixer
  if (mixer) {
    mixer.update(deltaTime);
  }

  // Update controls
  controls.update();

  // Render
  // renderer.render(scene, camera);

  effectComposer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();