import * as THREE from 'three/webgpu'
import { vec4, lessThan, normalize, mix, oneMinus,length, atan, pow, smoothstep, mod, Fn, mul, div, add, sub, vec3, vec2, dot, floor, step, min, max, float, abs, positionLocal, uv, texture , time, cos, sin, depth} from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// import('@dimforge/rapier3d')

import GUI from 'lil-gui'

const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader();
const noise = textureLoader.load( './128x128.png' );
noise.wrapS = THREE.RepeatWrapping;
noise.wrapT = THREE.RepeatWrapping;

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.load(
    'hot-air-balloon.glb',
    (gltf) =>
    {
        scene.add(gltf.scene)
        let colors = [vec4(1, 0, 0, 1), vec4(0, 1, 0, 1), vec4(0, 0, 1, 1), vec4(1, 1, 0, 1)]
        let i = 0
        gltf.scene.traverse((child) =>
        {
            console.log(child)
            if (child.isMesh)
            {
                child.material = new THREE.MeshStandardNodeMaterial()
                child.material.colorNode = colors[i]
                console.log(colors[i])
                i++
            }
            
        })
    
    }
)


/**
 * Test
 */
const material = new THREE.MeshStandardNodeMaterial()

material.positionNode = positionLocal
material.colorNode = vec4(positionLocal.y, 0, 1, 1)

const geometry = new THREE.SphereGeometry(1, 32, 32)
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)


// Create geometry by rotating this profile
const flameGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 64, 1)
const flameMaterial = new THREE.MeshStandardNodeMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
})
const createTeardropShape = Fn(([position]) => {
    // Calculate angle around y-axis
    const angle = atan(position.z, position.x);
    
    // Normalize height from 0 (bottom) to 1 (top)
    const heightPercent = div(add(position.y, 1.0), 2.0); // assuming cylinder is from -1 to 1
    
    // Base radius calculation for teardrop shape
    let radius = mul(1.0, sub(1.0, pow(heightPercent, 2.5)));
    
    // Add slight bulge in lower part
    const bulge = mul(sin(mul(heightPercent, 2.0)), 0.15);
    radius = add(radius, mul(bulge, sub(1.0, heightPercent)));
    radius = mul(radius, add(1.0, mul(sin(mul(time,  2.0)), 0.1)));
    
    // Bottom and top constraints
    radius = max(radius, mul(0.05, sub(1.0, heightPercent))); // prevent top from becoming too pointy
    radius = max(radius, 0.05); // prevent complete pinching
    
    // Construct new position
    return vec3(
        mul(cos(angle), radius),
        position.y, // Keep original height
        mul(sin(angle), radius)
    );
});

const createFlameColor = Fn(() => {
    // alpha

    const alphaNoiseUv = uv().mul( vec2( 0.5, 0.3 ) ).add( vec2( 0, time.mul( 0.3 ).negate() ) );
    const alpha = mul(

        // pattern
        texture( noise, alphaNoiseUv ).r.smoothstep( 0.5, 1 ),

        // edges fade
        smoothstep( 0, 0.1, uv().x ),
        smoothstep( 0, 0.1, oneMinus( uv().x ) ),
        smoothstep( 0, 0.1, uv().y ),
        smoothstep( 0, 0.1, oneMinus( uv().y ) )

    );
    const height = div(add(positionLocal.y, 1.0), 2.0);
    let alph = mul(smoothstep(0.0, 4.0, height), alpha);


    // color

    const finalColor = mix( vec3(255, 0, 0 ), vec3( 255, 50, 0 ), uv().y );

    return vec4( finalColor, alph );
    })
flameMaterial.positionNode = createTeardropShape(positionLocal)
flameMaterial.colorNode = createFlameColor()


const flameMesh = new THREE.Mesh(flameGeometry, flameMaterial)
flameMesh.position.set(0, 2, 0)
scene.add(flameMesh)
/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
scene.add(ambientLight)

// Directional light
const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5)
directionalLight.position.set(4, 2, 0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 2, 5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGPURenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#000000')

/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.renderAsync(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()