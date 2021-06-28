import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import copy from "copy-to-clipboard";
import * as dat from "dat.gui";

if (process.env.NODE_ENV === "development") {
  require("./index.html");
}

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
dat.GUI.toggleHide();
const parameters = {
  color: 0x20202,
};
const debugObject = {};

/**
 * Loaders
 */
const loadingSVG = document.querySelector(".loading-svg");
const loadingLeftElement = document.querySelector(".loading-left");
const loadingRightElement = document.querySelector(".loading-right");
const loadingBorder = document.querySelector(".loading-border");
const modalButton = document.querySelector(".modal-btn");
const modal = document.querySelector(".modal");
const modalOuter = document.querySelector(".modal-outer");
const closeIcon = document.querySelector(".close-icon");
const btnEth = document.querySelector(".btn-eth");

// Canvas
const canvas = document.querySelector("canvas.webgl");

modalButton.addEventListener("click", () => {
  modal.classList.add("active");
});

modalOuter.addEventListener("click", () => {
  modal.classList.remove("active");
});

closeIcon.addEventListener("click", () => {
  modal.classList.remove("active");
});

btnEth.addEventListener("click", (event) => {
  event.preventDefault();
  copy("0xbbed09a7de1be5db5cc0475a501a2bcd069066a8");
  alert("Ethereum address has been copied to your clipboard! (0xbbed09a7de1be5db5cc0475a501a2bcd069066a8)");
});

const loadingManager = new THREE.LoadingManager(
  // loaded
  () => {
    // console.log("loaded");
    loadingLeftElement.classList.add("ended");
    loadingRightElement.classList.add("ended");
    loadingSVG.classList.add("ended");
    loadingBorder.classList.add("ended");
    window.setTimeout(() => {
      dat.GUI.toggleHide();
    }, 2000);
  },
  // progress
  (itemUrl, itemsLoaded, itemsTotal) => {}
);

const textureLoader = new THREE.TextureLoader(loadingManager);
const normalTexture = textureLoader.load("/static/models/ethereum_3d_logo/normal.jpeg");
const specMap = textureLoader.load("/static/models/ethereum_3d_logo/textures/default_specularGlossiness.png");

normalTexture.offset.x = 0.5;
normalTexture.offset.y = 0.5;
normalTexture.wrapS = THREE.RepeatWrapping;
normalTexture.wrapT = THREE.RepeatWrapping;

// Scene
const scene = new THREE.Scene();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
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
  "/static/models/ethereum_3d_logo/scene.gltf",
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

    scene.add(gltf.scene);
    updateAllMaterials();
    updateGui();
  },
  (progress) => {
    // console.log("Loading...");
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(1, 2, 5);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = false;
controls.enablePan = false;
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
glitchPass.enabled = true;
effectComposer.addPass(glitchPass);

gui.add(glitchPass, "enabled").name("Glitch effect");

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
    ethModel.position.y = 0.7 + Math.sin(1 * elapsedTime) * 0.15;
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
