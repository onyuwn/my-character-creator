// src/main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const scene = new THREE.Scene();
const clock = new THREE.Clock();

var rendererWScale = 3;
var rendererHScale = 1;
var rendererWidth = window.innerWidth / rendererWScale;
var rendererHeight = window.innerHeight / rendererHScale;

const camera = new THREE.PerspectiveCamera(
    75, rendererWidth / rendererHeight, 0.1, 1000
  );
  camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(rendererWidth, rendererHeight);
var appContainer = document.getElementById("app-container");
appContainer.insertBefore(renderer.domElement, appContainer.firstChild);

// Cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

var bgSceneModel = undefined;
var personModel = undefined;

var bodyColorRSlider = document.getElementById("bodyColorR");
var bodyColorGSlider = document.getElementById("bodyColorG");
var bodyColorBSlider = document.getElementById("bodyColorB");

var uniforms = {
    bodyRColor: { value: 0.0 },
    bodyGColor: { value: 0.0 },
    bodyBColor: { value: 0.0 },
}

var personShaderMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float bodyRColor;
        uniform float bodyGColor;
        uniform float bodyBColor;
        void main() {
            vec4 uvColor = vec4(vUv, 0.5 + 0.5 * sin(vUv.x * 10.0), 1.0);
            gl_FragColor = vec4(bodyRColor, bodyGColor, bodyBColor, 1.0);
        }
    `,
});

bodyColorRSlider.oninput = function() {
    if(personModel) {
        personShaderMaterial.uniforms.bodyRColor.value = (this.value / 100.0) * 255.0;
    }
}

bodyColorBSlider.oninput = function() {
    if(personModel) {
        personShaderMaterial.uniforms.bodyGColor.value = (this.value / 100.0) * 255.0;
    }
}

bodyColorGSlider.oninput = function() {
    if(personModel) {
        personShaderMaterial.uniforms.bodyBColor.value = (this.value / 100.0) * 255.0;
    }
}

const modelLoader = new GLTFLoader();
modelLoader.load(
    'woodbg1.glb',
    (gltf) => {
        scene.add(gltf.scene)
        bgSceneModel = gltf.scene;
        bgSceneModel.rotation.y -= 3.14 / 2;
        bgSceneModel.position.z = 3;
        bgSceneModel.position.y = -1;
        bgSceneModel.position.x = -1;
    },
    undefined,
    (error) => {
        console.error(error);
    }
);

modelLoader.load(
    'basicperson1.glb',
    (gltf) => {
        personModel = gltf.scene;
        personModel.position.y = -1;
        personModel.position.z = 3;
        personModel.rotation.y = THREE.MathUtils.degToRad(90);
        personModel.scale.x *=.25;
        personModel.scale.y *=.25;
        personModel.scale.z *=.25;

        personModel.traverse((child) => {
            if(child.isMesh) {
                child.material = personShaderMaterial;
            }
        });

        scene.add(gltf.scene);
    },
    undefined,
    (error) => {
        console.error(error);
    }
)

// Animate
function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    var rendererWidth = window.innerWidth / rendererWScale;
    var rendererHeight = window.innerHeight / rendererHScale;
    camera.aspect = rendererWidth / rendererHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(rendererWidth, rendererHeight);
});