// src/main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { vertexColor } from 'three/tsl';

const scene = new THREE.Scene();
const shirtDesignerScene = new THREE.Scene();
const clock = new THREE.Clock();

var rendererWScale = 3;
var rendererHScale = 1;
var rendererWidth = window.innerWidth / rendererWScale;
var rendererHeight = window.innerHeight / rendererHScale;
var mouseX = 0;
var mouseY = 0;

var bodyTabButton = document.getElementById("body-tab-button");
var eyesTabButton = document.getElementById("eyes-tab-button");
var noseTabButton = document.getElementById("nose-tab-button");
var mouthTabButton = document.getElementById("mouth-tab-button");
var clothesTabButton = document.getElementById("clothes-tab-button");
var sceneTabButton = document.getElementById("scene-tab-button");
var saveTabButton = document.getElementById("save-tab-button");

var clothesFrontSideButton = document.getElementById("clothesFrontButton");
var clothesBackSideButton = document.getElementById("clothesBackButton");

clothesFrontSideButton.children[0].style.backgroundColor = "red";


const baseEyeSize = 0.05;
const baseEyeDistApart = .05;
const baseEyeYPos = 0;
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
var shirtDesignerRendererCanvas = document.getElementById("shirtDesigner");
const renderer = new THREE.WebGLRenderer({ antialias: false, canvas: rendererCanvas });
const designerRenderer = new THREE.WebGLRenderer({antialias: false, canvas: shirtDesignerRendererCanvas});
//designerRenderer.alpha
renderer.setSize(rendererWidth, rendererHeight);

designerRenderer.setSize(shirtDesignerRendererCanvas.clientWidth, shirtDesignerRendererCanvas.clientHeight);

const shirtCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -.2, 10);
var appContainer = document.getElementById("app-container");

const geometry = new THREE.PlaneGeometry();
const shirtDesignerGeometry = new THREE.PlaneGeometry(2,2);
shirtDesignerGeometry.setAttribute('uv1', geometry.getAttribute('uv').clone());
const smileyTx = new THREE.TextureLoader().load('planetx1.png');
const mouthTx = new THREE.TextureLoader().load('mouthtx1.png');
const noseTx = new THREE.TextureLoader().load('nose1.png');
const paintBucketTx = new THREE.TextureLoader().load('paintbucket.png');
const smileyMat = new THREE.MeshStandardMaterial({ map: smileyTx, transparent: true, side: THREE.DoubleSide });
const mouthMat = new THREE.MeshStandardMaterial({ map: mouthTx, transparent: true, side: THREE.DoubleSide });
const noseMat = new THREE.MeshStandardMaterial({ map: noseTx, transparent: true, side: THREE.DoubleSide });
const eyeLeft = new THREE.Mesh(geometry, smileyMat);
const eyeRight = new THREE.Mesh(geometry, smileyMat);
const mouth = new THREE.Mesh(geometry, mouthMat);
const nose = new THREE.Mesh(geometry, noseMat);
var trackingMouse = false;
var designerTrackingMouse = false;
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
var shirtModel = undefined;
var designerShirtModel = undefined;
var personEyesPosition = new THREE.Vector3();
var personShirtPosition = new THREE.Vector3();
var personMouthPosition = new THREE.Vector3();
var personNosePosition = new THREE.Vector3();

var eyeSizeSlider = document.getElementById("eyeSizeInput");
var eyeDistSlider = document.getElementById("eyeDistApartInput");
var eyesYSlider = document.getElementById("eyesYInput");
var eyeTiltSlider = document.getElementById("eyeTiltInput");

var mouthSizeSlider = document.getElementById("mouthSizeInput");
var mouthYSlider = document.getElementById("mouthYInput");

var noseSizeSlider = document.getElementById("noseSizeInput");
var noseYSlider = document.getElementById("noseYInput");

var uniforms = {
    bodyRColor: { value: 0.1 },
    bodyGColor: { value: 0.2 },
    bodyBColor: { value: 0.4 },
}

function updateBodyColor(event) {
    let bodyColorHex = event.target.value.replace("#", "0x");
    const bodyColorFromHex = new THREE.Color().setHex(bodyColorHex);
    const bodyColor = new THREE.Vector3(bodyColorFromHex.r, bodyColorFromHex.g, bodyColorFromHex.b);
    uniforms.bodyRColor.value = bodyColorFromHex.r;
    uniforms.bodyGColor.value = bodyColorFromHex.g;
    uniforms.bodyBColor.value = bodyColorFromHex.b;
}

var bodyColorPicker = document.getElementById("bodyColorPicker");
bodyColorPicker.addEventListener("input", updateBodyColor);
bodyColorPicker.addEventListener("change", updateBodyColor);

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

var shirtTexture = undefined;
var shirtBackTexture = undefined;
var shirtBackData = undefined;
var shirtData = undefined;

function initShirt() {
    shirtData = new Float32Array(4 * shirtDesignerRendererCanvas.clientHeight * shirtDesignerRendererCanvas.clientWidth);
    shirtBackData = new Float32Array(4 * shirtDesignerRendererCanvas.clientHeight * shirtDesignerRendererCanvas.clientWidth);
    
    for(let i = 0; i < shirtDesignerRendererCanvas.clientWidth * shirtDesignerRendererCanvas.clientHeight; i++) {
        shirtData[i * 4 + 0] = 1.0; // R
        shirtData[i * 4 + 1] = 1.0; // G
        shirtData[i * 4 + 2] = 1.0; // B
        shirtData[i * 4 + 3] = 1.0; // A
    
        shirtBackData[i * 4 + 0] = 1.0; // R
        shirtBackData[i * 4 + 1] = 1.0; // G
        shirtBackData[i * 4 + 2] = 1.0; // B
        shirtBackData[i * 4 + 3] = 1.0; // A
    }
    
    shirtTexture = new THREE.DataTexture(
        shirtData,
        shirtDesignerRendererCanvas.clientWidth,
        shirtDesignerRendererCanvas.clientHeight,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    
    shirtBackTexture = new THREE.DataTexture(
        shirtBackData,
        shirtDesignerRendererCanvas.clientWidth,
        shirtDesignerRendererCanvas.clientHeight,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    
    shirtTexture.minFilter = THREE.NearestFilter;
    shirtTexture.magFilter = THREE.NearestFilter;
    shirtTexture.generateMipmaps = false;
    shirtTexture.wrapS = THREE.ClampToEdgeWrapping;
    shirtTexture.wrapT = THREE.ClampToEdgeWrapping;
    shirtTexture.needsUpdate = true;
    
    shirtBackTexture.minFilter = THREE.NearestFilter;
    shirtBackTexture.magFilter = THREE.NearestFilter;
    shirtBackTexture.generateMipmaps = false;
    shirtBackTexture.wrapS = THREE.ClampToEdgeWrapping;
    shirtBackTexture.wrapT = THREE.ClampToEdgeWrapping;
    shirtBackTexture.needsUpdate = true;
}
initShirt();

var activeShirtSide = "FRONT";

var shirtUniforms = { 
    shirtTx: { value: shirtTexture },
    shirtBackTx: { value: shirtBackTexture },
    canvasW: { value: shirtDesignerRendererCanvas.clientWidth },
    canvasH: { value: shirtDesignerRendererCanvas.clientHeight },
    activeSide: { value: 0 },
    mouseX: { value: 0 },
    mouseY: { value: 0 },
    brushSize: { value: 0 },
    brushColor: { value: new THREE.Vector3() }
};

const shirtMat = new THREE.ShaderMaterial({
    uniforms:shirtUniforms,
    vertexShader: `
        varying vec2 vUv;
        attribute vec2 uv1;
        varying vec2 vUv2;

        void main() {
            vUv = uv;
            vUv2 = uv1;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        precision highp float;

        uniform sampler2D shirtTx;
        uniform sampler2D shirtBackTx;
        varying vec2 vUv;
        varying vec2 vUv2;

        void main() {
            if(vUv.x <= 0.0 && vUv.y <= 0.0) {
                vec3 color = texture2D(shirtBackTx, vUv2).rgb;
                gl_FragColor = vec4(color, 1.0);
            } else {
                vec3 color = texture2D(shirtTx, vUv).rgb;
                gl_FragColor = texture2D(shirtTx, vUv);
            }
        }
    `,
});

const shirtDesignerMat = new THREE.ShaderMaterial({
    uniforms:shirtUniforms,
    vertexShader: `
        varying vec2 vUv;
        attribute vec2 uv1;
        varying vec2 vUv2;

        void main() {
            vUv = uv;
            vUv2 = uv1;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        precision highp float;

        uniform sampler2D shirtTx;
        uniform sampler2D shirtBackTx;
        varying vec2 vUv;
        varying vec2 vUv2;
        uniform vec3 brushColor;
        uniform int activeSide;
        uniform float mouseX;
        uniform float mouseY;
        uniform float brushSize;
        uniform int canvasW;
        uniform int canvasH;

        void main() {
            vec3 color = vec3(0.0);
            if(activeSide == 1) {
                color = texture2D(shirtBackTx, vUv2).rgb;
                gl_FragColor = vec4(color, 1.0);
            } else {
                color = texture2D(shirtTx, vUv).rgb;
                gl_FragColor = texture2D(shirtTx, vUv);
            }

            float dMouse = abs(distance(gl_FragCoord.xy, vec2(mouseX, mouseY)));

            if(dMouse < brushSize && dMouse > brushSize - 2.0)
            {
                gl_FragColor = vec4(brushColor, 1.0);
            }
        }
    `,
});

const paintBucketUniforms = {
    paintBucketTx: { value: paintBucketTx },
    brushColor: { value: new THREE.Vector3() }
}

console.warn(paintBucketTx);

const paintBucketMat = new THREE.ShaderMaterial({
    transparent:true,
    uniforms: paintBucketUniforms,
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D paintBucketTx;
        uniform vec3 brushColor;

        void main() {
            vec3 color = texture2D(paintBucketTx, vUv).rgb;
            if(color.r > 100.0 / 255.0 && color.g < .5 && color.b < .5)
            {
                gl_FragColor = vec4(brushColor, 1.0);
            }
            else if(color.r > .8 && color.g > .8 && color.b > .8) {
                gl_FragColor = vec4(0.0);
            }
            else
            {
                gl_FragColor = vec4(color, 1.0);
            }
        }
    `,
});


const paintBucket = new THREE.Mesh(geometry, paintBucketMat);
shirtDesignerScene.add(paintBucket);
paintBucket.position.x = -.75;
paintBucket.position.y = -.75;
paintBucket.position.z = .2;
paintBucket.scale.set(.5,.5,.5)

var shirtDesignMesh = new THREE.Mesh(shirtDesignerGeometry, shirtDesignerMat);
shirtDesignerScene.add(shirtDesignMesh);
shirtDesignMesh.rotation.y = THREE.MathUtils.degToRad(0);

clothesBackSideButton.addEventListener("click", function() {
    activeShirtSide = "BACK";
    clothesBackSideButton.children[0].style.backgroundColor = "red";
    clothesFrontSideButton.children[0].style.background = "rgb(229, 255, 0)";
    shirtDesignerMat.uniforms.activeSide.value = 1;
});

clothesFrontSideButton.addEventListener("click", function() {
    activeShirtSide = "FRONT";
    clothesFrontSideButton.children[0].style.backgroundColor = "red";
    clothesBackSideButton.children[0].style.background = "rgb(229, 255, 0)";
    shirtDesignerMat.uniforms.activeSide.value = 0;
});

function updateShirtTx(x, y, color, radius) {
    //console.warn(`updating shirt @ ${x}, ${y} (${color.x}, ${color.y}, ${color.z})`);
    var width = shirtDesignerRendererCanvas.clientWidth;
    var height = shirtDesignerRendererCanvas.clientHeight;
    var flippedY = shirtDesignerRendererCanvas.clientHeight - y - 1;

    const startX = Math.max(1, x - radius);
    const endX = Math.min(width - 1, x + radius);
    const startY = Math.max(1, flippedY - radius);
    const endY = Math.min(height - 1, flippedY + radius);
    
    const rSquared = radius * radius;

    for (let py = startY; py <= endY; py++) {
        for (let px = startX; px <= endX; px++) {
            const dx = px - x;
            const dy = py - flippedY;

            if (dx * dx + dy * dy <= rSquared) {
                const index = (py * width + px) * 4;

                // if(dy % 2 == 0 || dx %2 == 0) {
                //     continue;
                // } // airbrush?

                // var alpha = 1 - (((dx * dx + dy * dy) / 2) / radius);
                // alpha += .5;
                if(activeShirtSide == "FRONT") {
                    shirtData[index + 0] = color.x;
                    shirtData[index + 1] = color.y;
                    shirtData[index + 2] = color.z;
                    shirtData[index + 3] = 1.0;
                    shirtTexture.needsUpdate = true;
                } else {
                    shirtBackData[index + 0] = color.x;
                    shirtBackData[index + 1] = color.y;
                    shirtBackData[index + 2] = color.z;
                    shirtBackData[index + 3] = 1.0;
                    shirtBackTexture.needsUpdate = true;
                }
            }
        }
    }

}

eyeSizeSlider.oninput = function() {
    if(eyeLeft && eyeRight) {
        var newScale = baseEyeSize + (this.value * .01);
        eyeLeft.scale.set(newScale, newScale, newScale);
        eyeRight.scale.set(newScale, newScale, newScale);
        document.getElementById("eye-size-value").innerHTML = newScale;
    }
}

eyeDistSlider.oninput = function() {
    if(eyeLeft && eyeRight) {
        var newDist = baseEyeDistApart + (this.value * .1);
        eyeLeft.position.z = (newDist / 2);
        eyeRight.position.z = -(newDist / 2);
        document.getElementById("eye-dist-apart-value").innerHTML = newDist;
    }
}

eyesYSlider.oninput = function() {
    if(eyeLeft && eyeRight) {
        var newHeight = (this.value * .05);
        eyeLeft.position.y = newHeight;
        eyeRight.position.y = newHeight;
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
    var newHeight = baseMouthYPos + (this.value * .05);
    mouth.position.y = newHeight;
    document.getElementById("mouth-y-value").innerHTML = newHeight;
});

noseSizeSlider.addEventListener('input', function() {
    var newSize = baseNoseSize + (this.value * .01);
    nose.scale.set(newSize, newSize, newSize);
    document.getElementById("nose-size-value").innerHTML = newSize;
});

noseYSlider.addEventListener('input', function() {
    var newHeight = baseNoseYPos + (this.value * .05)
    nose.position.y = newHeight;
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

var lastMouseX = null;
var lastMouseY = null;
var drawing = false;

shirtDesignerRendererCanvas.addEventListener('mousedown', function() {
    drawing = true;
    lastMouseX = null;
    lastMouseY = null;
});

shirtDesignerRendererCanvas.addEventListener('mouseup', function() {
    drawing = false;
});

shirtDesignerRendererCanvas.addEventListener('mouseenter', function() {
    designerTrackingMouse = true;
});

shirtDesignerRendererCanvas.addEventListener('mouseleave', function() {
    designerTrackingMouse = false;
    lastMouseX = null;
    lastMouseY = null;
});

var brushRadius = 6;
var brushSizeInput = document.getElementById("brushSizeInput");
var designerClearButton = document.getElementById("designerClearButton");

designerClearButton.addEventListener("click", function() {
    var curActiveSide = shirtDesignerMat.uniforms.activeSide.value;
    shirtDesignerMat.uniforms.activeSide.value = 0;
    updateShirtTx(0, 0, new THREE.Vector3(1.0, 1.0, 1.0), 1000);
    shirtDesignerMat.uniforms.activeSide.value = 1;
    updateShirtTx(0, 0, new THREE.Vector3(1.0, 1.0, 1.0), 1000);
    shirtDesignerMat.uniforms.activeSide.value = curActiveSide;

    //initShirt();
});

brushSizeInput.oninput = function() {
    brushRadius = this.value;
}

brushColorInput.addEventListener("input", updateBrushColor);
brushColorInput.addEventListener("change", updateBrushColor);

var brushColorHex = "";

function updateBrushColor(event) {
    brushColorHex = event.target.value.replace("#", "0x");
}

document.addEventListener('mousemove', function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    var rect = shirtDesignerRendererCanvas.getBoundingClientRect();
    var x = Math.floor(mouseX - rect.left);
    var y = Math.floor(mouseY - rect.top);

    shirtDesignerMat.uniforms.mouseX.value = x;
    shirtDesignerMat.uniforms.mouseY.value = rect.height - y;
    shirtDesignerMat.uniforms.brushSize.value = brushRadius;
    const brushColorFromHex = new THREE.Color().setHex(brushColorHex);
    const brushColor = new THREE.Vector3(brushColorFromHex.r, brushColorFromHex.g, brushColorFromHex.b);
    shirtDesignerMat.uniforms.brushColor.value = brushColor;
    paintBucketMat.uniforms.brushColor.value = brushColor;

    if(designerTrackingMouse == true && drawing == true) {

        if(lastMouseX !== null && lastMouseY !== null) {
            var dx = x - lastMouseX;
            var dy = y - lastMouseY;
            var dist = Math.sqrt(dx * dx, dy * dy);
            var steps = Math.ceil(dist);

            for(let i = 0; i <= steps; i++) {
                var t = i / steps;
                var interpX = Math.round(lastMouseX + t * dx);
                var interpY = Math.round(lastMouseY + t * dy);

                updateShirtTx(interpX, interpY, brushColor, brushRadius);
            }
        }
        else
        {
            updateShirtTx(x, y, brushColor, brushRadius);
        }

        lastMouseX = x;
        lastMouseY = y;
    }
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

        var personEyeLPosition = new THREE.Vector3();
        var personEyeRPosition = new THREE.Vector3();

        personModel.traverse((child) => {
            if(child.isMesh) {
                child.material = personShaderMaterial;
            }
            if(child.name == 'eyerightcontainer') {
                child.getWorldPosition(personEyeRPosition);
                child.attach(eyeRight);
                eyeRight.position.set(0,0,0);
                // eyeLeft.position.set(personEyesPosition.x - (baseEyeDistApart / 2), personEyesPosition.y - .1, personEyesPosition.z + .1);
                // eyeRight.position.set(personEyesPosition.x + (baseEyeDistApart / 2), personEyesPosition.y - .1, personEyesPosition.z + .1);
            }
            else if(child.name == 'eyeleftcontainer') {
                child.getWorldPosition(personEyeLPosition);
                child.attach(eyeLeft);
                eyeLeft.position.set(0,0,0);
            }
            else if(child.name == 'shirtcontainer') {
                child.getWorldPosition(personShirtPosition);
                modelLoader.load(
                    'shirt2.glb',
                    (shirtGltf)=>  {
                        shirtGltf.scene.traverse((shirtChild) => {
                            console.warn(shirtGltf)
                            if(shirtChild.isMesh == true) {
                                shirtModel = shirtChild;
                                scene.add(shirtModel);
                                child.attach(shirtModel);
                                shirtModel.position.set(0,0,0);
                                shirtModel.scale.x *=.3;
                                shirtModel.scale.y *=.25;
                                shirtModel.scale.z *=.25;
                                shirtModel.position.z-= .075;
                                shirtModel.rotation.y = THREE.MathUtils.degToRad(0);
                                shirtModel.material = shirtMat;

                                designerShirtModel = shirtModel.clone();
                                shirtDesignerScene.add(designerShirtModel);
                                designerShirtModel.position.set(0,0,0);
                                designerShirtModel.rotation.y = THREE.MathUtils.degToRad(-90);
                                designerShirtModel.material = new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(1.0,0,0)});
                                designerShirtModel.scale.set(.75,.75,1);
                                designerShirtModel.position.y -= .25;
                            }
                        })
                    }
                )     
            }
            else if(child.name == 'mouthcontainer') {
                child.getWorldPosition(personMouthPosition);
                //mouth.position.set(personMouthPosition.x, personMouthPosition.y, personMouthPosition.z +.1);
                mouth.scale.set(.1, .1, .1);
                child.attach(mouth);
                mouth.position.set(0,0,0);
            }
            else if(child.name == 'nosecontainer') {
                child.getWorldPosition(personNosePosition);
                //nose.position.set(personNosePosition.x, personNosePosition.y, personNosePosition.z + .1);
                nose.scale.set(.1, .1, .1);
                child.attach(nose);
                nose.position.set(0,0,0);
            }
        });
        personEyesPosition = new THREE.Vector3((personEyeLPosition.x + personEyeRPosition.x) / 2, personEyeLPosition.y, (personEyeLPosition.z + personEyeRPosition.z) / 2);
        scene.add(gltf.scene);
        eyeLeft.material = smileyMat;
        eyeRight.material = smileyMat;
        mouth.material = mouthMat;
        nose.material = noseMat;
    },
    undefined,
    (error) => {
        console.error(error);
    }
)
var cameraMoving = false;
var t = 0;
var posFrom = undefined;
var posTo = undefined;

// Animate
function animate() {
    requestAnimationFrame(animate);

    if(trackingMouse == true) {
        personModel.rotation.y = THREE.MathUtils.degToRad(mouseX);
    }

    if(cameraMoving == true) {
        t += 0.01;
        if (t >= 1) {
            t = 1;
            cameraMoving = false;
        }
        camera.position.lerpVectors(posFrom, posTo, t);
    }

    if(designerTrackingMouse == true) {
        //pixels.[mouseX.floor * M](new THREE.Vector3(mouseX, mouseY, 0));
    }

    renderer.render(scene, camera);
    designerRenderer.render(shirtDesignerScene, shirtCamera);
}
animate();

window.addEventListener('resize', () => {
    var rendererWidth = window.innerWidth / rendererWScale;
    var rendererHeight = window.innerHeight / rendererHScale;
    camera.aspect = rendererWidth / rendererHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(rendererWidth, rendererHeight);

    shirtCamera.aspect = shirtDesignerRendererCanvas.clientWidth / shirtDesignerRendererCanvas.clientHeight;
    shirtCamera.updateProjectionMatrix();
    designerRenderer.setSize(shirtDesignerRendererCanvas.clientWidth, shirtDesignerRendererCanvas.clientHeight)
});

bodyTabButton.addEventListener("click",  function() {
    // camera.position.x = defaultPos.x;
    // camera.position.y = defaultPos.y;
    // camera.position.z = defaultPos.z;
    t = 0;
    cameraMoving = true;
    posFrom = camera.position;
    posTo = new THREE.Vector3(defaultPos.x, defaultPos.y, defaultPos.z + 1.0);
});

eyesTabButton.addEventListener("click",  function() {
    // camera.position.x = personEyesPosition.x;
    // camera.position.y = personEyesPosition.y;
    // camera.position.z = personEyesPosition.z + 1;
    t = 0;
    cameraMoving = true;
    posFrom = camera.position;
    posTo = new THREE.Vector3(personEyesPosition.x, personEyesPosition.y, personEyesPosition.z + 1.0);
});

mouthTabButton.addEventListener("click",  function() {
    t = 0;
    cameraMoving = true;
    posFrom = camera.position;
    posTo = new THREE.Vector3(personEyesPosition.x, personEyesPosition.y, personEyesPosition.z + 1.0);
});

noseTabButton.addEventListener("click",  function() {
    t = 0;
    cameraMoving = true;
    posFrom = camera.position;
    posTo = new THREE.Vector3(personEyesPosition.x, personEyesPosition.y, personEyesPosition.z + 1.0);
});

clothesTabButton.addEventListener("click",  function() {
    t = 0;
    cameraMoving = true;
    posFrom = camera.position;
    posTo = new THREE.Vector3(personShirtPosition.x, personShirtPosition.y, personShirtPosition.z + 1.0);
});

const updateTexture = (bodyPart, txPath) => {
    var newTexture = new THREE.TextureLoader().load(txPath);
    
    if(bodyPart == 'eyes') {
        smileyMat.map = newTexture;
    } else if(bodyPart == 'nose') {
        noseMat.map = newTexture;
    } else if(bodyPart == 'mouth') {
        mouthMat.map = newTexture;
    }
}

function updateBrush(brushType) {
    console.warn(brushType);
}

document.querySelectorAll('.eyeTextureOption').forEach(el => {
    el.addEventListener('click', () => {
        const textureFile = el.querySelector('img').getAttribute('src').replace('/', '../');
        updateTexture('eyes', textureFile);
        document.querySelectorAll('.eyeTextureOption').forEach(el2 => {
            el2.classList.remove("selected");
        });
        el.classList.add("selected");
    });
});

document.querySelectorAll('.noseTextureOption').forEach(el => {
    el.addEventListener('click', () => {
        const textureFile = el.querySelector('img').getAttribute('src').replace('/', '../');
        updateTexture('nose', textureFile);
        document.querySelectorAll('.noseTextureOption').forEach(el2 => {
            el2.classList.remove("selected");
        });
        el.classList.add("selected");
    });
});

document.querySelectorAll('.mouthTextureOption').forEach(el => {
    el.addEventListener('click', () => {
        const textureFile = el.querySelector('img').getAttribute('src').replace('/', '../');
        updateTexture('mouth', textureFile);
        document.querySelectorAll('.mouthTextureOption').forEach(el2 => {
            el2.classList.remove("selected");
        });
        el.classList.add("selected");
    });
});

document.querySelectorAll('.designerToolButton').forEach(el => {
    el.addEventListener('click', () => {
        const selectedToolName = el.getAttribute('data-tool-name')
        updateBrush(selectedToolName);
        document.querySelectorAll('.designerToolButton').forEach(el2 => {
            el2.classList.remove("selected");
        });
        el.classList.add("selected");
    });
});