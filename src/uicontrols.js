var bodyTabContent = document.getElementById("body-controls");
var eyesTabContent = document.getElementById("eye-controls");
var noseTabContent = document.getElementById("nose-controls");
var mouthTabContent = document.getElementById("mouth-controls");
var clothesTabContent = document.getElementById("clothes-controls");
var sceneTabContent = document.getElementById("scene-controls");
var saveTabContent = document.getElementById("save-controls");

var bodyTabButton = document.getElementById("body-tab-button");
var eyesTabButton = document.getElementById("eyes-tab-button");
var noseTabButton = document.getElementById("nose-tab-button");
var mouthTabButton = document.getElementById("mouth-tab-button");
var clothesTabButton = document.getElementById("clothes-tab-button");
var sceneTabButton = document.getElementById("scene-tab-button");
var saveTabButton = document.getElementById("save-tab-button");

bodyTabContent.style.display = "flex";
eyesTabContent.style.display = "none";
noseTabContent.style.display = "none";
mouthTabContent.style.display = "none";
clothesTabContent.style.display = "none";
sceneTabContent.style.display = "none";
saveTabContent.style.display = "none";

bodyTabButton.addEventListener('click', function() {
    hideAllTabs();
    bodyTabContent.style.display = "flex";
    bodyTabButton.style.backgroundColor = "red";
});

eyesTabButton.addEventListener('click', function() {
    hideAllTabs();
    eyesTabContent.style.display = "flex";
    eyesTabButton.style.backgroundColor = "red";
});

noseTabButton.addEventListener('click', function() {
    hideAllTabs();
    noseTabContent.style.display = "flex";
    noseTabButton.style.backgroundColor = "red";
});

mouthTabButton.addEventListener('click', function() {
    hideAllTabs();
    mouthTabContent.style.display = "flex";
    mouthTabButton.style.backgroundColor = "red";
});

clothesTabButton.addEventListener('click', function() {
    hideAllTabs();
    clothesTabContent.style.display = "flex";
    clothesTabButton.style.backgroundColor = "red";
});

sceneTabButton.addEventListener('click', function() {
    hideAllTabs();
    sceneTabContent.style.display = "flex";
    sceneTabButton.style.backgroundColor = "red";
});

saveTabButton.addEventListener('click', function() {
    hideAllTabs();
    saveTabContent.style.display = "flex";
    saveTabButton.style.backgroundColor = "red";
});

function hideAllTabs() {
    bodyTabContent.style.display = "none";
    eyesTabContent.style.display = "none";
    noseTabContent.style.display = "none";
    mouthTabContent.style.display = "none";
    clothesTabContent.style.display = "none";
    sceneTabContent.style.display = "none";
    saveTabContent.style.display = "none";

    bodyTabButton.style.background = "none";
    eyesTabButton.style.background = "none";
    noseTabButton.style.background = "none";
    mouthTabButton.style.background = "none";
    clothesTabButton.style.background = "none";
    sceneTabButton.style.background = "none";
    saveTabButton.style.background = "none";
}