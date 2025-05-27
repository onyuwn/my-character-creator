// src/main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const scene = new THREE.Scene();
const clock = new THREE.Clock();

var rendererWScale = 3;
var rendererHScale = 1;
var rendererWidth = window.innerWidth / rendererWScale;
var rendererHeight = window.innerHeight / rendererHScale;
var mouseX = 0;

var bodyTabButton = document.getElementById("body-tab-button");
var eyesTabButton = document.getElementById("eyes-tab-button");
var noseTabButton = document.getElementById("nose-tab-button");
var mouthTabButton = document.getElementById("mouth-tab-button");
var clothesTabButton = document.getElementById("clothes-tab-button");
var sceneTabButton = document.getElementById("scene-tab-button");
var saveTabButton = document.getElementById("save-tab-button");

const baseEyeSize = 0.05;
const baseEyeDistApart = .05;
const baseEyeYPos = -.1;
const baseEyeTilt = 0.0;
const baseNoseYPos = 0.0;
const baseNoseSize = 0.0;
const baseMouthYPos = 0.0;
const baseMouthSize = 0.0;

const camera = new THREE.PerspectiveCamera(
    75, rendererWidth / rendererHeight, 0.1, 1000
  );
camera.position.z = 5;
const defaultPos = new THREE.Vector3(0.0, 0.0, 5.0);
const mouthPos = new THREE.Vector3(0.0, 0.0, 0.0);

var rendererCanvas = document.getElementById("renderer-canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: rendererCanvas });
renderer.setSize(rendererWidth, rendererHeight);
var appContainer = document.getElementById("app-container");
//appContainer.insertBefore(renderer.domElement, appContainer.firstChild);

// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

const geometry = new THREE.PlaneGeometry();
const smileyTx = new THREE.TextureLoader().load('planetx1.png');
const mouthTx = new THREE.TextureLoader().load('mouthtx1.png');
const noseTx = new THREE.TextureLoader().load('nose1.png');
const smileyMat = new THREE.MeshStandardMaterial({ map: smileyTx, transparent: true, side: THREE.DoubleSide });
const mouthMat = new THREE.MeshStandardMaterial({ map: mouthTx, transparent: true, size: THREE.DoubleSide });
const noseMat = new THREE.MeshStandardMaterial({ map: noseTx, transparent: true, size: THREE.DoubleSide });
const eyeLeft = new THREE.Mesh(geometry, smileyMat);
const eyeRight = new THREE.Mesh(geometry, smileyMat);
const mouth = new THREE.Mesh(geometry, mouthMat);
const nose = new THREE.Mesh(geometry, noseMat);
var trackingMouse = false;
eyeLeft.rotation.y = THREE.MathUtils.degToRad(180)
scene.add(eyeLeft);
scene.add(eyeRight);
scene.add(mouth);
scene.add(nose);

eyeLeft.scale.set(baseEyeSize, baseEyeSize, baseEyeSize);
eyeRight.scale.set(baseEyeSize, baseEyeSize, baseEyeSize);

scene.background = new THREE.Color().setRGB( 0, 0, 1.0 );

// Light
const light = new THREE.RectAreaLight(0xffffff, 5, 100, 100);
light.position.set(1, 1, 1).normalize();

scene.add(light);

var bgSceneModel = undefined;
var personModel = undefined;
var personEyesPosition = new THREE.Vector3();
var personShirtPosition = new THREE.Vector3();
var personMouthPosition = new THREE.Vector3();
var personNosePosition = new THREE.Vector3();

var bodyColorRSlider = document.getElementById("bodyColorR");
var bodyColorGSlider = document.getElementById("bodyColorG");
var bodyColorBSlider = document.getElementById("bodyColorB");

var eyeSizeSlider = document.getElementById("eyeSizeInput");
var eyeDistSlider = document.getElementById("eyeDistApartInput");
var eyesYSlider = document.getElementById("eyesYInput");
var eyeTiltSlider = document.getElementById("eyeTiltInput");

var mouthSizeSlider = document.getElementById("mouthSizeInput");
var mouthYSlider = document.getElementById("mouthYInput");

var noseSizeSlider = document.getElementById("noseSizeInput");
var noseYSlider = document.getElementById("noseYInput");

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
            vec4 uvColo2 = vec4(vUv, 1.0, 1.0);
            gl_FragColor = vec4(bodyRColor, bodyGColor, bodyBColor, 1.0) * uvColo2;
        }
    `,
});

bodyColorRSlider.oninput = function() {
    if(personModel) {
        personShaderMaterial.uniforms.bodyRColor.value = (this.value / 100.0);
        document.getElementById("body-color-r-value").innerHTML = personShaderMaterial.uniforms.bodyRColor.value;
    }
}

bodyColorGSlider.oninput = function() {
    if(personModel) {
        personShaderMaterial.uniforms.bodyGColor.value = (this.value / 100.0);
        document.getElementById("body-color-g-value").innerHTML = personShaderMaterial.uniforms.bodyGColor.value;
    }
}

bodyColorBSlider.oninput = function() {
    if(personModel) {
        personShaderMaterial.uniforms.bodyBColor.value = (this.value / 100.0);
        document.getElementById("body-color-b-value").innerHTML = personShaderMaterial.uniforms.bodyBColor.value;
    }
}

eyeSizeSlider.oninput = function() {
    if(eyeLeft && eyeRight) {
        var newScale = baseEyeSize + (this.value * .005);
        eyeLeft.scale.set(newScale, newScale, newScale);
        eyeRight.scale.set(newScale, newScale, newScale);
        document.getElementById("eye-size-value").innerHTML = newScale;
    }
}

eyeDistSlider.oninput = function() {
    if(eyeLeft && eyeRight) {
        var newDist = baseEyeDistApart + (this.value * .01);
        eyeLeft.position.x =  personEyesPosition.x - (newDist / 2);
        eyeRight.position.x = personEyesPosition.x + (newDist / 2);
        document.getElementById("eye-dist-apart-value").innerHTML = newDist;
    }
}

eyesYSlider.oninput = function() {
    if(eyeLeft && eyeRight) {
        var newHeight = baseEyeYPos + (this.value * .01);
        eyeLeft.position.y = personEyesPosition.y + newHeight;
        eyeRight.position.y = personEyesPosition.y +  newHeight;
        document.getElementById("eye-y-value").innerHTML = newHeight;
    }
}

eyeTiltSlider.oninput = function() {
    if(personModel) {
        var newTilt = baseEyeTilt + (this.value);
        eyeLeft.rotation.z = THREE.MathUtils.degToRad(newTilt);
        eyeRight.rotation.z = THREE.MathUtils.degToRad(newTilt);
        document.getElementById("eye-tilt-value").innerHTML = newTilt;
    }
}

mouthSizeSlider.addEventListener('input', function() {
    var newSize = baseMouthSize + (this.value * .01);
    mouth.scale.set(newSize, newSize, newSize);
    document.getElementById("mouth-size-value").innerHTML = newSize;
});

mouthYSlider.addEventListener('input', function() {
    var newHeight = baseMouthYPos + (this.value * .01);
    mouth.position.y = personMouthPosition.y + newHeight;
    document.getElementById("mouth-y-value").innerHTML = newHeight;
});

noseSizeSlider.addEventListener('input', function() {
    var newSize = baseNoseSize + (this.value * .01);
    nose.scale.set(newSize, newSize, newSize);
    document.getElementById("nose-size-value").innerHTML = newSize;
});

noseYSlider.addEventListener('input', function() {
    var newHeight = baseNoseYPos + (this.value * .01)
    nose.position.y = personNosePosition.y + newHeight;
    document.getElementById("nose-y-value").innerHTML = newHeight;
});

rendererCanvas.addEventListener('mouseenter', function() {
    // personModel.attach(nose);
    // personModel.attach(eyeLeft);
    // personModel.attach(eyeRight);
    // personModel.attach(mouth);
    trackingMouse = true;
});

rendererCanvas.addEventListener('mouseleave', function() {
    trackingMouse = false;
    personModel.rotation.y = THREE.MathUtils.degToRad(-90);
});

document.addEventListener('mousemove', function(event) {
    mouseX = event.clientX;
});

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
        personModel.rotation.y = THREE.MathUtils.degToRad(-90);
        personModel.scale.x *=.25;
        personModel.scale.y *=.25;
        personModel.scale.z *=.25;

        light.lookAt(personModel.position);

        personModel.traverse((child) => {
            console.warn(child);
            if(child.isMesh) {
                child.material = personShaderMaterial;
            }
            if(child.name == 'eyescontainer') {
                child.getWorldPosition(personEyesPosition);
                eyeLeft.position.set(personEyesPosition.x - (baseEyeDistApart / 2), personEyesPosition.y - .1, personEyesPosition.z + .1);
                eyeRight.position.set(personEyesPosition.x + (baseEyeDistApart / 2), personEyesPosition.y - .1, personEyesPosition.z + .1);
            }
            if(child.name == 'shirtcontainer') {
                child.getWorldPosition(personShirtPosition);
            }
            if(child.name == 'mouthcontainer') {
                child.getWorldPosition(personMouthPosition);
                mouth.position.set(personMouthPosition.x, personMouthPosition.y, personMouthPosition.z +.1);
                mouth.scale.set(.1, .1, .1);
            }
            if(child.name == 'nosecontainer') {
                child.getWorldPosition(personNosePosition);
                nose.position.set(personNosePosition.x, personNosePosition.y, personNosePosition.z + .1);
                nose.scale.set(.1, .1, .1);
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

    if(trackingMouse == true) {
        personModel.rotation.y = THREE.MathUtils.degToRad(mouseX);
    }

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

bodyTabButton.addEventListener("click",  function() {
    camera.position.x = defaultPos.x;
    camera.position.y = defaultPos.y;
    camera.position.z = defaultPos.z;
});

eyesTabButton.addEventListener("click",  function() {
    camera.position.x = personEyesPosition.x;
    camera.position.y = personEyesPosition.y;
    camera.position.z = personEyesPosition.z + 1;
});

mouthTabButton.addEventListener("click",  function() {
    camera.position.x = personEyesPosition.x;
    camera.position.y = personEyesPosition.y;
    camera.position.z = personEyesPosition.z + 1;
});

noseTabButton.addEventListener("click",  function() {
    camera.position.x = personEyesPosition.x;
    camera.position.y = personEyesPosition.y;
    camera.position.z = personEyesPosition.z + 1;
});

clothesTabButton.addEventListener("click",  function() {
    camera.position.x = personShirtPosition.x;
    camera.position.y = personShirtPosition.y;
    camera.position.z = personShirtPosition.z + 3.5;
});

const updateTexture = (bodyPart, txPath) => {
    var newTexture = new THREE.TextureLoader().load(txPath);
    
    if(bodyPart == 'eyes') {
        smileyMat.map = newTexture;
    }
}

document.querySelectorAll('.eyeTextureOption').forEach(el => {
    el.addEventListener('click', () => {
      const textureFile = el.querySelector('img').getAttribute('src').replace('/', '');
      updateTexture('eyes', textureFile);
    });
  });