import * as THREE from 'three/webgpu';
import { float, mx_noise_float, Loop, color, positionLocal, sin, vec2, vec3, mul, time, uniform, Fn, transformNormalToView } from 'three/tsl';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Inspector } from 'three/addons/inspector/Inspector.js';

let camera, scene, renderer, controls;

import {createGrassBlade} from "./grass.js";

init();

function init() {

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 );
  camera.position.set( 1.25, 1.25, 1.25 );

  scene = new THREE.Scene();

  // lights

  const directionalLight = new THREE.DirectionalLight( '#ffffff', 3 );
  directionalLight.position.set( - 4, 2, 0 );
  scene.add( directionalLight );

  // material

  const bladeGeo = createGrassBlade(0.5, 3, 5, 1.5); // width, height, segments, bend

  // Using a gradient-like coloring via vertex colors or a simple green material
  const material = new THREE.MeshBasicNodeMaterial({
    color: 0x44aa44,
    side: THREE.DoubleSide, // Render both sides of the blade
  });

  const grassBlade = new THREE.Mesh(bladeGeo, material);
  scene.add(grassBlade);

  // renderer

  renderer = new THREE.WebGPURenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  renderer.inspector = new Inspector();
  document.body.appendChild( renderer.domElement );

  // controls

  controls = new OrbitControls( camera, renderer.domElement );
  controls.target.y = - 0.25;
  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 50;

  // debug

  // events

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

async function animate() {

  controls.update();

  renderer.render( scene, camera );

}