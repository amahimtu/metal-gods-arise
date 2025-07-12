// COMPUTER VISION TEMPLATE

// This template provides two ml5 wrapped mediapipe models:
// 1. Face Mesh: 478 landmarks for face
// 2. Hand Pose: 21 landmarks per hand 

// SETUP CANVAS

let canvas;
let video;
let canvasWidth, canvasHeight;

// Dynamic sizing - canvas will be 85% of window size
const CANVAS_SCALE = 0.85;

// SETUP MODELS

// ML5 Models
let faceMesh;
let handPose;

// ML5 Results - These arrays contain all the landmark data!
let faces = [];
let hands = [];

// Toggle States
let showFace = false;  // Off by default
let showHands = false; // Off by default
let showVideo = true;  // Video on by default
let showDataStream = false; // Data stream off by default
let showDataOnVisualization = false; // Data on visualization off by default

// Trigger states
let winkTriggerEnabled = false;
let mouthTextTriggerEnabled = false;
let wristCircleTriggerEnabled = false;
let thumbsUpTriggerEnabled = false;
let prayingTriggerEnabled = false;
let handTrailsEnabled = false;

// Mouth text stream variables
// NOTE FOR USERS: Change this quote to whatever text you want to display
let criticalTheoryQuote = "Thunder crashes through the darkness eternal flames rise from the abyss steel warriors march into battle ancient power flows through veins of fire darkness consumes the light above savage winds howl across barren lands metallic gods forge destiny in chaos storm clouds gather over mountain peaks iron hearts beat with primal rage electric energy surges through the void crimson skies burn with unholy light shadow beasts roam the cursed earth";
let quoteWords = [];
let currentWordIndex = 0;
let lastMouthState = false;
let wordDisplayTime = 200; // milliseconds per word

// Thumbs up splash variables
let splashParticles = [];
let lastThumbsUpState = false;
let lastDoubleThumbsUpState = false;

// Random Spanish word variables
let spanishWords = [
    "¡PAPAYA!", "¡CHURROS!", "¡BURRITO!", "¡FIESTA!", "¡PIÑATA!",
    "¡GUACAMOLE!", "¡QUESADILLA!", "¡TACO!", "¡SALSA!", "¡NACHO!",
    "¡MARIACHI!", "¡SOMBRERO!", "¡MACARENA!", "¡JALAPEÑO!", "¡TORTILLA!",
    "¡ENCHILADA!", "¡CHIHUAHUA!", "¡TAMALE!", "¡GAZPACHO!", "¡FRIJOLES!"
];
let spanishWordTimer = 0;
let showSpanishWord = false;
let currentSpanishWord = "";
let spanishWordDisplay = 0;

// Praying hands variables
let concentricCircles = [];
let lastPrayingState = false;

// Hand trails variables
let handTrails = [];

// Wall slime variables
let slimeDrops = [];
let metalLyrics = [
    "STEEL FORGED IN DARKNESS",
    "CHAINS OF ETERNAL TORMENT", 
    "THUNDER SPLITS THE VOID",
    "BLOOD RAIN DESCENDS",
    "IRON WILL NEVER BEND",
    "SHADOWS CONSUME ALL",
    "FIRE BURNS WITHIN",
    "CHAOS REIGNS SUPREME",
    "METAL GODS ARISE",
    "DESTINY CARVED IN STONE",
    "POWER FLOWS THROUGH VEINS",
    "DARKNESS NEVER DIES",
    "RAGE FUELS THE MACHINE",
    "STEEL MEETS FLESH",
    "ANCIENT POWER AWAKENS"
];
let slimeTimer = 0;

// Data stream options
let dataStreamOptions = {
    mouthOpen: false,
    leftEyeOpen: false,
    rightEyeOpen: false,
    noseCenter: false,
    wristPosition: false,
    handOpen: false,
    fingertipPositions: false
};

// BASIC VISUAL SETTINGS - CUSTOMIZE THESE!

// Dynamic gradient colors and glitch settings
let gradientOffset = 0;
let previousPositions = [];
let movementThreshold = 5;
let glitchActive = false;
let glitchTimer = 0;
let glitchDuration = 200; // milliseconds

// Color system for dynamic gradients
function getGradientColor(index, total) {
    let hue = (frameCount * 2 + index * 360 / total) % 360;
    return color(`hsl(${hue}, 80%, 60%)`);
}

function getHandGradientColor(index, total) {
    let hue = (frameCount * 1.5 + index * 360 / total + 180) % 360;
    return color(`hsl(${hue}, 90%, 70%)`);
}

// Original colors kept for compatibility
const COLORS = {
    face: '#00FF00',      // Bright green for face mesh
    hands: '#FF0066'      // Hot pink for hands
};

// Drawing settings
let pointSize = 5;  // Consistent size for all landmarks
let lineThickness = 2;

// P5.JS SETUP FUNCTION - DON'T CHANGE THIS, THIS SETS UP OUR CANVAS AND COMPUTER VISION TOOLSET

function setup() {
    // Calculate dynamic canvas size
    calculateCanvasSize();
    
    // Create canvas with dynamic sizing
    canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('p5-container');
    
    // Set up UI controls
    setupControls();
    
    updateStatus("🚀 Initializing camera...");
    
    // Initialize video capture first
    initializeVideo();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
}

function initializeVideo() {
    // Initialize video capture
    video = createCapture(VIDEO, () => {
        video.size(canvasWidth, canvasHeight);
        video.hide(); // Hide the default video element
    
        updateStatus("📹 Camera ready, checking ML5...");
        console.log("Video ready, checking ML5...");
        console.log("typeof ml5:", typeof ml5);
        console.log("window.ml5:", window.ml5);
        
        // Check for ML5 availability with more thorough detection
        function checkML5() {
            if (typeof ml5 !== 'undefined' && ml5.version) {
                console.log("✅ ML5 found! Version:", ml5.version);
                updateStatus("🤖 ML5 detected, loading models...");
                initializeML5Models();
            } else {
                console.log("❌ ML5 not found, retrying...");
                return false;
            }
            return true;
        }
        
        // Try immediately
        if (!checkML5()) {
            updateStatus("⏳ Waiting for ML5 to load...");
            
            // Try every 500ms for up to 10 seconds
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkInterval = setInterval(() => {
                attempts++;
                console.log(`Attempt ${attempts}/${maxAttempts} to find ML5`);
                
                if (checkML5()) {
                    clearInterval(checkInterval);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    updateStatus("❌ ML5 failed to load. Try refreshing the page.");
                    console.error("ML5 failed to load after", maxAttempts, "attempts");
}
            }, 500);
        }
    });
}

// P5.JS DRAW FUNCTION - MAIN ANIMATION LOOP

function draw() {
    // Apply glitch effect to background if active
    if (glitchActive) {
        drawGlitchBackground();
    } else {
        background(0);
    }
    
    // Update glitch timer
    updateGlitchTimer();
    
    // Only draw video if it's loaded and ready AND showVideo is enabled
    if (showVideo && video && video.loadedmetadata) {
        // Draw video feed (mirrored for natural webcam feel)
        push();
        translate(width, 0);
        scale(-1, 1);
        tint(255, 200); // Slightly transparent video
        image(video, 0, 0, width, height);
        noTint();
        pop();
    } else if (!video || !video.loadedmetadata) {
        // Show loading indicator only if video isn't ready
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(24);
        text("Loading camera...", width/2, height/2);
    }
    
    // Check for movement and trigger glitch effects
    checkForMovement();
    
    // Apply glitch transformation if active
    if (glitchActive) {
        push();
        applyGlitchTransform();
    }
    
    // Draw all ML5 detections with extra debugging
    if (showFace) {
        console.log("Attempting to draw faces, count:", faces ? faces.length : 0);
        drawFaceMesh();
    }
    if (showHands) {
        console.log("Attempting to draw hands, count:", hands ? hands.length : 0);
        drawHands();
    }
    
    // Close glitch transformation
    if (glitchActive) {
        pop();
    }
    
    // Draw data stream in right panel if enabled
    if (showDataStream) {
        updateDataStreamPanel();
    }
    
    // Draw data labels on visualization if enabled
    if (showDataOnVisualization) {
        drawDataOnVisualization();
    }
    
    // Draw trigger effects
    if (winkTriggerEnabled) {
        drawWinkEffect();
    }
    
    if (mouthTextTriggerEnabled) {
        drawMouthTextEffect();
    }
    
    if (wristCircleTriggerEnabled) {
        drawWristCircleEffect();
    }
    
    if (thumbsUpTriggerEnabled) {
        drawThumbsUpSplash();
    }
    
    if (prayingTriggerEnabled) {
        drawPrayingHandsEffect();
    }
    
    if (handTrailsEnabled) {
        drawHandTrails();
    }
    
    // Draw wall slime with metal lyrics
    drawWallSlime();
    
    // Draw random Spanish word every 20 seconds
    drawRandomSpanishWord();
    
    // Update detection counts
    updateDetectionCounts();



}

// CANVAS SIZING AND RESPONSIVENESS

function calculateCanvasSize() {
    // Calculate canvas size based on window dimensions
    let maxWidth = windowWidth * CANVAS_SCALE;
    let maxHeight = windowHeight * CANVAS_SCALE;
    
    // Maintain 4:3 aspect ratio for video compatibility
    let aspectRatio = 4/3;
    
    if (maxWidth / aspectRatio <= maxHeight) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
    } else {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
    }
    
    // Ensure minimum size for usability
    canvasWidth = max(canvasWidth, 480);
    canvasHeight = max(canvasHeight, 360);
}

function handleResize() {
    calculateCanvasSize();
    resizeCanvas(canvasWidth, canvasHeight);
    if (video && video.elt) {
        video.size(canvasWidth, canvasHeight);
    }
}

// ML5 MODEL INITIALIZATION

function initializeML5Models() {
    console.log("🚀 Starting ML5 model initialization...");
    updateStatus("🤖 Loading Face Mesh...");
    
    let modelsLoaded = 0;
    const totalModels = 2;
    
    function checkAllModelsLoaded() {
        modelsLoaded++;
        console.log(`✅ Model ${modelsLoaded}/${totalModels} loaded`);
        if (modelsLoaded >= totalModels) {
            updateStatus("🎯 All models ready! Starting predictions...");
            startPredictionLoop();
        }
    }
    
    try {
        // Initialize Face Mesh - v1.2.1 API
        console.log("Initializing Face Mesh...");
        faceMesh = ml5.faceMesh(video, {
            maxFaces: 1,  // Realistic limit - most models optimized for 1 face
            refineLandmarks: true,
            flipHorizontal: true
        }, () => {
            console.log("✅ Face Mesh ready!");
            updateStatus("🤖 Loading Hand Pose...");
            checkAllModelsLoaded();
        });
        
        // Initialize Hand Pose - v1.2.1 API
        console.log("Initializing Hand Pose...");
        handPose = ml5.handPose(video, {
            maxHands: 2,  // Realistic limit - typically 2 hands per person
            flipHorizontal: true
        }, () => {
            console.log("✅ Hand Pose ready!");
            checkAllModelsLoaded();
        });
        
        // Fallback: Start prediction loop after 5 seconds even if not all models load
        setTimeout(() => {
            if (modelsLoaded < totalModels) {
                console.log("⚠️ Not all models loaded, starting anyway...");
                updateStatus("⚠️ Some models failed, starting with available ones...");
                startPredictionLoop();
            }
        }, 5000);
        
    } catch (error) {
        console.error("Error initializing ML5 models:", error);
        updateStatus("❌ Error loading ML5 models. Try refreshing page.");
    }
}

// Correct prediction approach for ML5 v1.2.1
function startPredictionLoop() {
    console.log("🔄 Starting prediction loop with detectMedia...");
    
    // First, let's inspect what's actually available
    function inspectModels() {
        console.log("=== MODEL INSPECTION ===");
        
        if (faceMesh) {
            console.log("FaceMesh object:", faceMesh);
            console.log("FaceMesh.detectMedia type:", typeof faceMesh.detectMedia);
            console.log("FaceMesh.detect type:", typeof faceMesh.detect);
            console.log("FaceMesh.predict type:", typeof faceMesh.predict);
            console.log("FaceMesh.ready:", faceMesh.ready);
        }
        
        if (handPose) {
            console.log("HandPose object:", handPose);
            console.log("HandPose.detectMedia type:", typeof handPose.detectMedia);
            console.log("HandPose.detect type:", typeof handPose.detect);
            console.log("HandPose.predict type:", typeof handPose.predict);
            console.log("HandPose.ready:", handPose.ready);
        }
        
        console.log("Video element:", video);
        console.log("Video.elt:", video.elt);
        console.log("=== END INSPECTION ===");
    }
    
    function runDetections() {
        console.log("🔄 Running detection cycle...");
        
        // Inspect models first time
        if (!runDetections.inspected) {
            inspectModels();
            runDetections.inspected = true;
        }
        
        // Try multiple detection methods for Face Mesh
        if (faceMesh) {
            console.log("Trying face detection...");
            
            // Method 1: detectMedia
            if (typeof faceMesh.detectMedia === 'function' && video.elt) {
                console.log("Trying detectMedia...");
                try {
                    faceMesh.detectMedia(video.elt, (results) => {
                        console.log("Face detectMedia callback:", results);
                        if (results && results.length > 0) {
                            faces = results;
                            console.log("✅ Face results via detectMedia:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Face detectMedia error:", error);
                }
            }
            
            // Method 2: detect
            else if (typeof faceMesh.detect === 'function' && video.elt) {
                console.log("Trying detect...");
                try {
                    faceMesh.detect(video.elt, (results) => {
                        console.log("Face detect callback:", results);
                        if (results && results.length > 0) {
                            faces = results;
                            console.log("✅ Face results via detect:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Face detect error:", error);
                }
            }
            
            // Method 3: predict
            else if (typeof faceMesh.predict === 'function' && video.elt) {
                console.log("Trying predict...");
                try {
                    faceMesh.predict(video.elt, (results) => {
                        console.log("Face predict callback:", results);
                        if (results && results.length > 0) {
                            faces = results;
                            console.log("✅ Face results via predict:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Face predict error:", error);
                }
            }
            
            else {
                console.log("No working face detection method found");
            }
        }
        
        // Try multiple detection methods for Hand Pose
        if (handPose) {
            console.log("Trying hand detection...");
            
            if (typeof handPose.detectMedia === 'function' && video.elt) {
                try {
                    handPose.detectMedia(video.elt, (results) => {
                        if (results && results.length > 0) {
                            hands = results;
                            console.log("✅ Hand results via detectMedia:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Hand detectMedia error:", error);
                }
            }
            else if (typeof handPose.detect === 'function' && video.elt) {
                try {
                    handPose.detect(video.elt, (results) => {
                        if (results && results.length > 0) {
                            hands = results;
                            console.log("✅ Hand results via detect:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Hand detect error:", error);
                }
            }
            else if (typeof handPose.predict === 'function' && video.elt) {
                try {
                    handPose.predict(video.elt, (results) => {
                        if (results && results.length > 0) {
                            hands = results;
                            console.log("✅ Hand results via predict:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Hand predict error:", error);
                }
            }
            else {
                console.log("No working hand detection method found");
            }
        }
        
        // Continue the loop after a delay
        setTimeout(runDetections, 100); // Much faster - 10 FPS detection
    }
    
    // Add a small delay before starting to ensure video is ready
    setTimeout(() => {
        console.log("🎬 Starting detection loop...");
        runDetections();
    }, 2000);
}

// ML5 DRAWING FUNCTIONS

function drawFaceMesh() {
    if (!faces || faces.length === 0) return;
    
    console.log("Drawing", faces.length, "faces, structure:", faces[0]);
    
    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
        let face = faces[faceIndex];
        console.log("Face object keys:", Object.keys(face));
        
        // Try different possible keypoint locations
        let keypoints = face.keypoints || face.landmarks || face.points || face.vertices;
        
        if (keypoints && keypoints.length > 0) {
            console.log("Found keypoints:", keypoints.length, "first point:", keypoints[0]);
            
            // Draw demonic face mesh with red/black color scheme
            for (let i = 0; i < keypoints.length; i++) {
                let point = keypoints[i];
                let x, y;
                
                // Handle different data structures - ML5 already handles flipping
                if (point.x !== undefined && point.y !== undefined) {
                    x = point.x; // ML5 flipHorizontal: true already flipped these
                    y = point.y;
                } else if (Array.isArray(point) && point.length >= 2) {
                    x = point[0]; // ML5 flipHorizontal: true already flipped these
                    y = point[1];
                } else {
                    continue; // Skip this point if we can't understand it
                }
                
                // Demonic color scheme - reds and blacks with pulsing effect
                let pulse = sin(frameCount * 0.05 + i * 0.1) * 0.5 + 0.5;
                let red = 255 * pulse + 100;
                let green = 50 * pulse;
                let blue = 0;
                
                // Add flickering effect
                let flicker = random(0.7, 1.0);
                red *= flicker;
                green *= flicker;
                
                fill(red, green, blue, 200);
                noStroke();
                
                // Slightly larger, more menacing points
                ellipse(x, y, pointSize * 1.5, pointSize * 1.5);
                
                // Add glowing effect for certain points (eyes, mouth area)
                if (i < 50 || (i > 100 && i < 150) || i > 400) {
                    fill(255, 0, 0, 100);
                    ellipse(x, y, pointSize * 3, pointSize * 3);
                }
            }
            
            // Draw connecting lines for a more demonic mesh effect
            stroke(150, 0, 0, 80);
            strokeWeight(1);
            
            // Connect some key facial points to create a web-like effect
            for (let i = 0; i < keypoints.length - 1; i += 10) {
                if (keypoints[i] && keypoints[i + 5]) {
                    let p1 = keypoints[i];
                    let p2 = keypoints[i + 5];
                    
                    if (p1.x !== undefined && p2.x !== undefined) {
                        line(p1.x, p1.y, p2.x, p2.y);
                    }
                }
            }
            
        } else {
            console.log("No keypoints found in face object");
        }
    }
}

function drawHands() {
    if (!hands || hands.length === 0) return;
    
    console.log("Drawing", hands.length, "hands");
    
    for (let handIndex = 0; handIndex < hands.length; handIndex++) {
        let hand = hands[handIndex];
        if (hand.keypoints && hand.keypoints.length > 0) {
            console.log("Hand has", hand.keypoints.length, "keypoints");
            
            // Draw hand landmarks with dynamic gradient colors
            noStroke();
            
            for (let i = 0; i < hand.keypoints.length; i++) {
                let keypoint = hand.keypoints[i];
                let x = keypoint.x; // ML5 flipHorizontal: true already flipped these
                let y = keypoint.y;
                
                // Set dynamic gradient color for each point
                fill(getHandGradientColor(i + handIndex * 21, hand.keypoints.length));
                
                // Draw consistent sized dots for hand landmarks
                ellipse(x, y, pointSize, pointSize);
            }
            
            // Draw hand connections with gradient color
            let connectionColor = getHandGradientColor(handIndex * 10, 2);
            stroke(connectionColor);
            strokeWeight(lineThickness);
            drawHandConnections(hand.keypoints);
            
            // Draw hand label with gradient color
            if (hand.keypoints[0]) {
                fill(connectionColor);
                noStroke();
                textAlign(CENTER);
                textSize(12);
                text(hand.label || "Hand", 
                     hand.keypoints[0].x, 
                     hand.keypoints[0].y - 20);
            }
        }
    }
}

// DATA STREAM FUNCTIONS

function updateDataStreamPanel() {
    let contentHtml = '';
    
    // Extract and display data based on enabled options
    if (dataStreamOptions.mouthOpen) {
        let mouthOpen = isMouthOpen();
        contentHtml += `<div class="data-item"><strong>Mouth Open:</strong> ${mouthOpen}</div>`;
    }
    
    if (dataStreamOptions.leftEyeOpen) {
        let leftEyeOpen = isLeftEyeOpen();
        contentHtml += `<div class="data-item"><strong>Left Eye Open:</strong> ${leftEyeOpen}</div>`;
    }
    
    if (dataStreamOptions.rightEyeOpen) {
        let rightEyeOpen = isRightEyeOpen();
        contentHtml += `<div class="data-item"><strong>Right Eye Open:</strong> ${rightEyeOpen}</div>`;
    }
    
    if (dataStreamOptions.noseCenter) {
        let nosePos = getNoseCenter();
        if (nosePos) {
            contentHtml += `<div class="data-item"><strong>Nose Center:</strong> (${nosePos.x.toFixed(1)}, ${nosePos.y.toFixed(1)})</div>`;
        } else {
            contentHtml += `<div class="data-item"><strong>Nose Center:</strong> Not detected</div>`;
        }
    }
    
    if (dataStreamOptions.wristPosition) {
        let wrists = getWristPositions();
        for (let i = 0; i < wrists.length; i++) {
            if (wrists[i]) {
                contentHtml += `<div class="data-item"><strong>Wrist ${i + 1}:</strong> (${wrists[i].x.toFixed(1)}, ${wrists[i].y.toFixed(1)})</div>`;
            } else {
                contentHtml += `<div class="data-item"><strong>Wrist ${i + 1}:</strong> Not detected</div>`;
            }
        }
    }
    
    if (dataStreamOptions.handOpen) {
        let handsOpen = getHandsOpenStatus();
        for (let i = 0; i < handsOpen.length; i++) {
            contentHtml += `<div class="data-item"><strong>Hand ${i + 1} Open:</strong> ${handsOpen[i]}</div>`;
        }
    }
    
    if (dataStreamOptions.fingertipPositions) {
        let fingertips = getAllFingertipPositions();
        for (let handIndex = 0; handIndex < fingertips.length; handIndex++) {
            let handTips = fingertips[handIndex];
            if (handTips) {
                contentHtml += `<div class="data-section"><strong>Hand ${handIndex + 1} Fingertips:</strong></div>`;
                const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
                for (let i = 0; i < handTips.length; i++) {
                    if (handTips[i]) {
                        contentHtml += `<div class="data-subitem">${fingerNames[i]}: (${handTips[i].x.toFixed(1)}, ${handTips[i].y.toFixed(1)})</div>`;
                    }
                }
            }
        }
    }
    
    // Update the HTML content
    document.getElementById('dataStreamContent').innerHTML = contentHtml || '<div class="data-item">No data options selected</div>';
}

function drawDataOnVisualization() {
    // Set text style for visualization labels
    textAlign(LEFT);
    textSize(11);
    fill(255, 255, 0); // Yellow text for visibility
    stroke(0);
    strokeWeight(1);
    
    // Draw mouth status near mouth area
    if (dataStreamOptions.mouthOpen) {
        if (faces.length > 0 && faces[0].keypoints && faces[0].keypoints.length > 14) {
            let face = faces[0];
            let mouthOpen = isMouthOpen();
            let mouthPos = face.keypoints[14]; // Lower lip area
            if (mouthPos) {
                text(`Mouth: ${mouthOpen ? "Open" : "Closed"}`, mouthPos.x + 10, mouthPos.y + 20);
            }
        }
    }
    
    // Draw left eye status near left eye
    if (dataStreamOptions.leftEyeOpen) {
        if (faces.length > 0 && faces[0].keypoints && faces[0].keypoints.length > 133) {
            let face = faces[0];
            let leftEyeOpen = isLeftEyeOpen();
            let leftEyePos = face.keypoints[133]; // Left eye center (subject's left = viewer's right)
            if (leftEyePos) {
                text(`L Eye: ${leftEyeOpen ? "Open" : "Closed"}`, leftEyePos.x + 15, leftEyePos.y - 10);
            }
        }
    }
    
    // Draw right eye status near right eye
    if (dataStreamOptions.rightEyeOpen) {
        if (faces.length > 0 && faces[0].keypoints && faces[0].keypoints.length > 362) {
            let face = faces[0];
            let rightEyeOpen = isRightEyeOpen();
            let rightEyePos = face.keypoints[362]; // Right eye center (subject's right = viewer's left)
            if (rightEyePos) {
                text(`R Eye: ${rightEyeOpen ? "Open" : "Closed"}`, rightEyePos.x - 60, rightEyePos.y - 10);
            }
        }
    }
    
    // Draw nose coordinates near nose
    if (dataStreamOptions.noseCenter) {
        let nosePos = getNoseCenter();
        if (nosePos) {
            text(`(${nosePos.x.toFixed(0)}, ${nosePos.y.toFixed(0)})`, nosePos.x + 10, nosePos.y - 10);
        }
    }
    
    // Draw wrist coordinates near each wrist
    if (dataStreamOptions.wristPosition) {
        let wrists = getWristPositions();
        for (let i = 0; i < wrists.length; i++) {
            if (wrists[i]) {
                text(`W${i + 1}: (${wrists[i].x.toFixed(0)}, ${wrists[i].y.toFixed(0)})`, 
                     wrists[i].x + 10, wrists[i].y - 10);
            }
        }
    }
    
    // Draw hand open/closed status near palm
    if (dataStreamOptions.handOpen) {
        let handsOpen = getHandsOpenStatus();
        for (let i = 0; i < hands.length; i++) {
            if (hands[i] && hands[i].keypoints && hands[i].keypoints[9]) { // Middle finger base (palm area)
                let palmPos = hands[i].keypoints[9];
                text(`${handsOpen[i] ? "Open" : "Closed"}`, palmPos.x + 10, palmPos.y + 20);
            }
        }
    }
    
    // Draw fingertip coordinates near each fingertip
    if (dataStreamOptions.fingertipPositions) {
        let fingertips = getAllFingertipPositions();
        const fingerNames = ['T', 'I', 'M', 'R', 'P']; // Abbreviated names
        for (let handIndex = 0; handIndex < fingertips.length; handIndex++) {
            let handTips = fingertips[handIndex];
            if (handTips) {
                for (let i = 0; i < handTips.length; i++) {
                    if (handTips[i]) {
                        text(`${fingerNames[i]}:(${handTips[i].x.toFixed(0)},${handTips[i].y.toFixed(0)})`, 
                             handTips[i].x + 8, handTips[i].y - 8);
                    }
                }
            }
        }
    }
    
    noStroke(); // Reset stroke
}

// TRIGGER EFFECT FUNCTIONS

function drawWinkEffect() {
    // Check if exactly one eye is closed
    let leftEyeOpen = isLeftEyeOpen();
    let rightEyeOpen = isRightEyeOpen();
    
    if ((leftEyeOpen && !rightEyeOpen) || (!leftEyeOpen && rightEyeOpen)) {
        // Array of encouraging wink messages
        let winkMessages = [
            "YOUR WINK WILL CHANGE THE WORLD",
            "THAT WINK COULD START A REVOLUTION",
            "YOUR WINK IS PURE MAGIC",
            "ONE WINK TO RULE THEM ALL",
            "YOUR WINK SPARKS JOY EVERYWHERE",
            "THAT WINK JUST SAVED THE DAY",
            "YOUR WINK IS LEGENDARY",
            "WORLD'S MOST POWERFUL WINK",
            "YOUR WINK BREAKS THE INTERNET",
            "THAT WINK IS UNIVERSE-CHANGING",
            "YOUR WINK INSPIRES NATIONS",
            "EPIC WINK OF DESTINY",
            "YOUR WINK CONQUERS HEARTS",
            "SUPERNATURAL WINK DETECTED",
            "YOUR WINK BENDS REALITY"
        ];
        
        // Pick a random message based on frame count (changes slowly)
        let messageIndex = Math.floor(frameCount / 45) % winkMessages.length;
        let encouragingMessage = winkMessages[messageIndex];
        
        // Draw encouraging text in cute pink
        push();
        fill(255, 20, 147); // Deep pink
        textAlign(CENTER, CENTER);
        textSize(36); // Smaller to fit longer messages
        textStyle(BOLD);
        
        // Add some fun styling
        stroke(255);
        strokeWeight(2);
        
        text(encouragingMessage, width / 2, height / 2);
        pop();
    }
}

function drawMouthTextEffect() {
    let mouthOpen = isMouthOpen();
    
    // Reset when mouth closes
    if (!mouthOpen && lastMouthState) {
        currentWordIndex = 0;
    }
    
    lastMouthState = mouthOpen;
    
    if (mouthOpen && quoteWords.length > 0) {
        // Display words progressively
        let wordsToShow = Math.floor((millis() % (quoteWords.length * wordDisplayTime)) / wordDisplayTime);
        wordsToShow = Math.min(wordsToShow, quoteWords.length - 1);
        
        let textToDisplay = quoteWords.slice(0, wordsToShow + 1).join(' ');
        
        if (textToDisplay) {
            push();
            fill(255, 255, 0); // Yellow text
            stroke(0);
            strokeWeight(2);
            textAlign(CENTER, TOP);
            textSize(24);
            textStyle(NORMAL);
            
            // Word wrap for long text
            let lines = textToDisplay.split(' ');
            let currentLine = '';
            let lineHeight = 30;
            let yPos = 50;
            
            for (let word of lines) {
                let testLine = currentLine + word + ' ';
                if (textWidth(testLine) > width - 40 && currentLine.length > 0) {
                    text(currentLine, width / 2, yPos);
                    currentLine = word + ' ';
                    yPos += lineHeight;
                } else {
                    currentLine = testLine;
                }
            }
            
            if (currentLine.length > 0) {
                text(currentLine, width / 2, yPos);
            }
            
            pop();
        }
    }
}

function drawWristCircleEffect() {
    let wrists = getWristPositions();
    
    if (wrists.length >= 2 && wrists[0] && wrists[1]) {
        // Calculate center point between wrists
        let centerX = (wrists[0].x + wrists[1].x) / 2;
        let centerY = (wrists[0].y + wrists[1].y) / 2;
        
        // Calculate distance between wrists
        let distance = getLandmarkDistance(wrists[0], wrists[1]);
        
        // Map distance to circle size (adjust these values as needed)
        let circleSize = map(distance, 50, 400, 20, 200);
        circleSize = constrain(circleSize, 20, 200);
        
        // Draw white circle with no stroke
        push();
        fill(255);
        noStroke();
        ellipse(centerX, centerY, circleSize, circleSize);
        pop();
    }
}

function drawThumbsUpSplash() {
    let thumbsUp = isThumbsUp();
    let doubleThumbsUp = isDoubleThumbsUp();
    
    // Check for double thumbs up first (super splash)
    if (doubleThumbsUp && !lastDoubleThumbsUpState) {
        createSuperSplash();
    }
    // Single thumbs up (but not when double is active)
    else if (thumbsUp && !lastThumbsUpState && !doubleThumbsUp) {
        createSplash();
    }
    
    lastThumbsUpState = thumbsUp;
    lastDoubleThumbsUpState = doubleThumbsUp;
    
    // Update and draw existing particles
    for (let i = splashParticles.length - 1; i >= 0; i--) {
        let particle = splashParticles[i];
        
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // gravity
        particle.life -= 2;
        particle.size *= 0.98;
        
        // Draw particle
        push();
        fill(particle.color.levels[0], particle.color.levels[1], particle.color.levels[2], particle.life);
        noStroke();
        ellipse(particle.x, particle.y, particle.size, particle.size);
        pop();
        
        // Remove dead particles
        if (particle.life <= 0 || particle.size < 1) {
            splashParticles.splice(i, 1);
        }
    }
}

function createSplash() {
    // Get thumbs up position for splash origin
    let thumbPosition = getThumbPosition();
    if (!thumbPosition) return;
    
    // Create 30-50 particles
    let numParticles = random(30, 50);
    
    for (let i = 0; i < numParticles; i++) {
        let particle = {
            x: thumbPosition.x,
            y: thumbPosition.y,
            vx: random(-8, 8),
            vy: random(-12, -3),
            life: 255,
            size: random(8, 20),
            color: color(random(100, 255), random(150, 255), random(200, 255))
        };
        splashParticles.push(particle);
    }
}

function createSuperSplash() {
    // Get both thumb positions
    let thumbPositions = getAllThumbPositions();
    
    // Create massive explosion from center of screen
    let centerX = width / 2;
    let centerY = height / 2;
    
    // Create way more particles for super splash
    let numParticles = random(150, 200);
    
    for (let i = 0; i < numParticles; i++) {
        let particle = {
            x: centerX + random(-50, 50),
            y: centerY + random(-50, 50),
            vx: random(-15, 15),
            vy: random(-20, -5),
            life: 300, // Longer lasting
            size: random(15, 35), // Bigger particles
            color: color(random(200, 255), random(100, 255), random(50, 255))
        };
        splashParticles.push(particle);
    }
    
    // Add extra particles from each thumb position
    for (let thumbPos of thumbPositions) {
        if (thumbPos) {
            for (let i = 0; i < 30; i++) {
                let particle = {
                    x: thumbPos.x,
                    y: thumbPos.y,
                    vx: random(-12, 12),
                    vy: random(-15, -5),
                    life: 250,
                    size: random(10, 25),
                    color: color(255, random(150, 255), random(100, 255))
                };
                splashParticles.push(particle);
            }
        }
    }
}

function isThumbsUp() {
    if (hands.length === 0) return false;
    
    for (let hand of hands) {
        if (hand.keypoints && hand.keypoints.length >= 21) {
            // Check if thumb is extended and other fingers are down
            let thumbTip = hand.keypoints[4];
            let thumbBase = hand.keypoints[2];
            let indexTip = hand.keypoints[8];
            let indexBase = hand.keypoints[5];
            let wrist = hand.keypoints[0];
            
            if (thumbTip && thumbBase && indexTip && indexBase && wrist) {
                // Thumb should be above its base (extended upward)
                let thumbExtended = thumbTip.y < thumbBase.y - 20;
                
                // Index finger should be curled (tip closer to base than extended)
                let indexDistance = dist(indexTip.x, indexTip.y, wrist.x, wrist.y);
                let indexBaseDistance = dist(indexBase.x, indexBase.y, wrist.x, wrist.y);
                let indexCurled = indexDistance < indexBaseDistance + 30;
                
                if (thumbExtended && indexCurled) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isDoubleThumbsUp() {
    if (hands.length < 2) return false;
    
    let thumbsUpCount = 0;
    
    for (let hand of hands) {
        if (hand.keypoints && hand.keypoints.length >= 21) {
            // Check if thumb is extended and other fingers are down
            let thumbTip = hand.keypoints[4];
            let thumbBase = hand.keypoints[2];
            let indexTip = hand.keypoints[8];
            let indexBase = hand.keypoints[5];
            let wrist = hand.keypoints[0];
            
            if (thumbTip && thumbBase && indexTip && indexBase && wrist) {
                // Thumb should be above its base (extended upward)
                let thumbExtended = thumbTip.y < thumbBase.y - 20;
                
                // Index finger should be curled (tip closer to base than extended)
                let indexDistance = dist(indexTip.x, indexTip.y, wrist.x, wrist.y);
                let indexBaseDistance = dist(indexBase.x, indexBase.y, wrist.x, wrist.y);
                let indexCurled = indexDistance < indexBaseDistance + 30;
                
                if (thumbExtended && indexCurled) {
                    thumbsUpCount++;
                }
            }
        }
    }
    
    return thumbsUpCount >= 2;
}

function getThumbPosition() {
    if (hands.length === 0) return null;
    
    for (let hand of hands) {
        if (hand.keypoints && hand.keypoints[4]) {
            return hand.keypoints[4]; // Thumb tip
        }
    }
    return null;
}

function getAllThumbPositions() {
    let thumbPositions = [];
    
    for (let hand of hands) {
        if (hand.keypoints && hand.keypoints[4]) {
            thumbPositions.push(hand.keypoints[4]); // Thumb tip
        }
    }
    
    return thumbPositions;
}

function drawPrayingHandsEffect() {
    let praying = isPrayingHands();
    
    // Create new concentric circles when praying starts
    if (praying && !lastPrayingState) {
        let centerPos = getPrayingHandsCenter();
        if (centerPos) {
            // Add multiple circles at once for immediate effect
            for (let i = 0; i < 5; i++) {
                concentricCircles.push({
                    x: centerPos.x,
                    y: centerPos.y,
                    radius: 10 + i * 5,
                    maxRadius: random(100, 200),
                    alpha: 255,
                    color: color(random(150, 255), random(100, 255), random(200, 255)),
                    speed: random(1, 3)
                });
            }
        }
    }
    
    // Continuously add circles while praying
    if (praying && frameCount % 10 === 0) {
        let centerPos = getPrayingHandsCenter();
        if (centerPos) {
            concentricCircles.push({
                x: centerPos.x,
                y: centerPos.y,
                radius: 5,
                maxRadius: random(80, 150),
                alpha: 200,
                color: color(random(100, 255), random(150, 255), random(180, 255)),
                speed: random(0.5, 2)
            });
        }
    }
    
    lastPrayingState = praying;
    
    // Update and draw all concentric circles
    for (let i = concentricCircles.length - 1; i >= 0; i--) {
        let circle = concentricCircles[i];
        
        // Update circle
        circle.radius += circle.speed;
        circle.alpha -= 2;
        
        // Draw circle
        push();
        stroke(circle.color.levels[0], circle.color.levels[1], circle.color.levels[2], circle.alpha);
        strokeWeight(2);
        noFill();
        ellipse(circle.x, circle.y, circle.radius * 2, circle.radius * 2);
        pop();
        
        // Remove circles that are too big or faded
        if (circle.radius > circle.maxRadius || circle.alpha <= 0) {
            concentricCircles.splice(i, 1);
        }
    }
}

function isPrayingHands() {
    if (hands.length < 2) {
        console.log("Not enough hands detected:", hands.length);
        return false;
    }
    
    let hand1 = hands[0];
    let hand2 = hands[1];
    
    if (!hand1.keypoints || !hand2.keypoints) {
        console.log("Missing keypoints");
        return false;
    }
    
    // Use wrists as a more reliable reference point
    let wrist1 = hand1.keypoints[0];
    let wrist2 = hand2.keypoints[0];
    
    if (!wrist1 || !wrist2) {
        console.log("Missing wrist keypoints");
        return false;
    }
    
    // Calculate distance between wrists
    let wristDistance = dist(wrist1.x, wrist1.y, wrist2.x, wrist2.y);
    console.log("Wrist distance:", wristDistance);
    
    // Much more lenient detection - just check if hands are reasonably close
    let isClose = wristDistance < 150 && wristDistance > 20;
    
    if (isClose) {
        console.log("Praying hands detected! Distance:", wristDistance);
    }
    
    return isClose;
}

function getPrayingHandsCenter() {
    if (hands.length < 2) return null;
    
    let hand1 = hands[0];
    let hand2 = hands[1];
    
    if (!hand1.keypoints || !hand2.keypoints) return null;
    
    // Use wrists for center calculation
    let wrist1 = hand1.keypoints[0];
    let wrist2 = hand2.keypoints[0];
    
    if (!wrist1 || !wrist2) return null;
    
    return {
        x: (wrist1.x + wrist2.x) / 2,
        y: (wrist1.y + wrist2.y) / 2
    };
}

function drawHandTrails() {
    // Add new trail points for each detected hand
    if (hands.length > 0) {
        for (let i = 0; i < hands.length; i++) {
            let hand = hands[i];
            if (hand.keypoints && hand.keypoints[9]) { // Middle finger base (palm center)
                let palmPos = hand.keypoints[9];
                
                // Add new trail point
                handTrails.push({
                    x: palmPos.x,
                    y: palmPos.y,
                    life: 100,
                    maxLife: 100,
                    size: random(20, 40),
                    handIndex: i,
                    color: color(random(150, 255), random(100, 255), random(180, 255))
                });
            }
        }
    }
    
    // Update and draw all trail circles
    for (let i = handTrails.length - 1; i >= 0; i--) {
        let trail = handTrails[i];
        
        // Update trail
        trail.life -= 1.5;
        trail.size *= 0.98; // Gradually shrink
        
        // Calculate alpha based on remaining life
        let alpha = map(trail.life, 0, trail.maxLife, 0, 80);
        
        // Draw soft circle
        push();
        fill(trail.color.levels[0], trail.color.levels[1], trail.color.levels[2], alpha);
        noStroke();
        ellipse(trail.x, trail.y, trail.size, trail.size);
        
        // Add subtle glow effect
        fill(255, alpha * 0.3);
        ellipse(trail.x, trail.y, trail.size * 0.6, trail.size * 0.6);
        pop();
        
        // Remove dead trails
        if (trail.life <= 0 || trail.size < 5) {
            handTrails.splice(i, 1);
        }
    }
    
    // Limit total number of trail points for performance
    if (handTrails.length > 200) {
        handTrails.splice(0, handTrails.length - 200);
    }
}

function drawWallSlime() {
    // Create new slime drops randomly from the walls
    if (millis() - slimeTimer > random(800, 2000)) {
        // Random wall (0=top, 1=right, 2=bottom, 3=left)
        let wall = Math.floor(random(4));
        let x, y, vx, vy;
        
        switch(wall) {
            case 0: // Top wall
                x = random(width);
                y = 0;
                vx = random(-1, 1);
                vy = random(0.5, 2);
                break;
            case 1: // Right wall
                x = width;
                y = random(height);
                vx = random(-2, -0.5);
                vy = random(-1, 1);
                break;
            case 2: // Bottom wall
                x = random(width);
                y = height;
                vx = random(-1, 1);
                vy = random(-2, -0.5);
                break;
            case 3: // Left wall
                x = 0;
                y = random(height);
                vx = random(0.5, 2);
                vy = random(-1, 1);
                break;
        }
        
        slimeDrops.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            size: random(15, 35),
            life: 255,
            color: color(random(50, 120), random(80, 150), random(20, 80)),
            lyric: metalLyrics[Math.floor(random(metalLyrics.length))],
            showLyric: random() < 0.3 // 30% chance to show lyric
        });
        
        slimeTimer = millis();
    }
    
    // Update and draw slime drops
    for (let i = slimeDrops.length - 1; i >= 0; i--) {
        let drop = slimeDrops[i];
        
        // Update position
        drop.x += drop.vx;
        drop.y += drop.vy;
        drop.vy += 0.05; // gravity
        drop.life -= 1;
        
        // Draw slime drop
        push();
        fill(drop.color.levels[0], drop.color.levels[1], drop.color.levels[2], drop.life);
        noStroke();
        
        // Main blob
        ellipse(drop.x, drop.y, drop.size, drop.size);
        
        // Drippy effect
        ellipse(drop.x, drop.y + drop.size/3, drop.size * 0.7, drop.size * 1.2);
        ellipse(drop.x, drop.y + drop.size/2, drop.size * 0.4, drop.size * 0.8);
        
        // Slime trail
        for (let j = 1; j < 4; j++) {
            let trailAlpha = drop.life * (0.3 / j);
            fill(drop.color.levels[0], drop.color.levels[1], drop.color.levels[2], trailAlpha);
            ellipse(drop.x - drop.vx * j * 3, drop.y - drop.vy * j * 3, drop.size * (0.8 / j), drop.size * (0.8 / j));
        }
        
        // Show metal lyric if enabled for this drop
        if (drop.showLyric && drop.life > 100) {
            fill(200, 255, 200, drop.life * 0.8);
            stroke(0, 100, 0);
            strokeWeight(1);
            textAlign(CENTER);
            textSize(12);
            textStyle(BOLD);
            text(drop.lyric, drop.x, drop.y - drop.size);
        }
        
        pop();
        
        // Remove dead drops or ones that went off screen
        if (drop.life <= 0 || drop.x < -50 || drop.x > width + 50 || drop.y < -50 || drop.y > height + 50) {
            slimeDrops.splice(i, 1);
        }
    }
}

function drawRandomSpanishWord() {
    // Check if 20 seconds have passed (20000 milliseconds)
    if (millis() - spanishWordTimer > 20000) {
        // Pick a random Spanish word
        currentSpanishWord = spanishWords[Math.floor(random(spanishWords.length))];
        showSpanishWord = true;
        spanishWordDisplay = millis();
        spanishWordTimer = millis();
    }
    
    // Show the word for 3 seconds
    if (showSpanishWord && millis() - spanishWordDisplay < 3000) {
        push();
        
        // Subtle, elegant text
        let fadeTime = millis() - spanishWordDisplay;
        let opacity;
        
        // Fade in and out
        if (fadeTime < 500) {
            opacity = map(fadeTime, 0, 500, 0, 120);
        } else if (fadeTime > 2500) {
            opacity = map(fadeTime, 2500, 3000, 120, 0);
        } else {
            opacity = 120;
        }
        
        fill(255, 255, 255, opacity);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(24); // Much smaller
        textStyle(NORMAL); // Not bold
        
        // Gentle float animation
        let float = sin(frameCount * 0.1) * 3;
        
        // Position in top right corner area
        let wordX = width * 0.75;
        let wordY = height * 0.15 + float;
        
        text(currentSpanishWord, wordX, wordY);
        pop();
    } else if (showSpanishWord) {
        showSpanishWord = false;
    }
}

// Data extraction functions
function isMouthOpen() {
    if (faces.length === 0 || !faces[0].keypoints) return false;
    let face = faces[0];
    
    // Face mesh landmarks: upper lip center (13) and lower lip center (14)
    // These are approximate - actual face mesh has 478 points
    if (face.keypoints.length >= 478) {
        let upperLip = face.keypoints[13];
        let lowerLip = face.keypoints[14];
        if (upperLip && lowerLip) {
            let distance = getLandmarkDistance(upperLip, lowerLip);
            return distance > 15; // Threshold for mouth open
        }
    }
    return false;
}

function isLeftEyeOpen() {
    if (faces.length === 0 || !faces[0].keypoints) return false;
    let face = faces[0];
    
    // MediaPipe face mesh left eye landmarks (subject's left = viewer's right)
    if (face.keypoints.length >= 478) {
        let upperEyelid = face.keypoints[159]; // Left eye upper eyelid
        let lowerEyelid = face.keypoints[145]; // Left eye lower eyelid
        if (upperEyelid && lowerEyelid) {
            let distance = getLandmarkDistance(upperEyelid, lowerEyelid);
            return distance > 8; // Threshold for eye open (adjust as needed)
        }
    }
    return true; // Default to open if landmarks not available
}

function isRightEyeOpen() {
    if (faces.length === 0 || !faces[0].keypoints) return false;
    let face = faces[0];
    
    // MediaPipe face mesh right eye landmarks (subject's right = viewer's left)
    if (face.keypoints.length >= 478) {
        let upperEyelid = face.keypoints[386]; // Right eye upper eyelid
        let lowerEyelid = face.keypoints[374]; // Right eye lower eyelid
        if (upperEyelid && lowerEyelid) {
            let distance = getLandmarkDistance(upperEyelid, lowerEyelid);
            return distance > 8; // Threshold for eye open (adjust as needed)
        }
    }
    return true; // Default to open if landmarks not available
}

function getNoseCenter() {
    if (faces.length === 0 || !faces[0].keypoints) return null;
    let face = faces[0];
    
    // Face mesh nose tip is typically around index 1 or 2
    if (face.keypoints.length > 2) {
        return face.keypoints[1]; // Approximate nose tip
    }
    return null;
}

function getWristPositions() {
    let wrists = [];
    for (let hand of hands) {
        if (hand.keypoints && hand.keypoints[0]) {
            wrists.push(hand.keypoints[0]); // Wrist is index 0
        } else {
            wrists.push(null);
        }
    }
    return wrists;
}

function getHandsOpenStatus() {
    let handsOpen = [];
    for (let hand of hands) {
        handsOpen.push(!isHandFist(hand)); // Inverse of fist detection
    }
    return handsOpen;
}

function getAllFingertipPositions() {
    let allFingertips = [];
    for (let hand of hands) {
        if (hand.keypoints) {
            let fingertips = [
                hand.keypoints[4],  // Thumb tip
                hand.keypoints[8],  // Index finger tip
                hand.keypoints[12], // Middle finger tip
                hand.keypoints[16], // Ring finger tip
                hand.keypoints[20]  // Pinky tip
            ];
            allFingertips.push(fingertips);
        } else {
            allFingertips.push(null);
        }
    }
    return allFingertips;
}


// CONNECTION DRAWING HELPERS

function drawHandConnections(keypoints) {
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],     // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],     // Index finger
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17]           // Palm connections
    ];
    
    for (let connection of connections) {
        let a = keypoints[connection[0]];
        let b = keypoints[connection[1]];
        if (a && b) {
            line(a.x, a.y, b.x, b.y);
        }
    }
}

// USER INTERFACE AND CONTROLS

function setupControls() {
    // Video and detection toggles
    document.getElementById('videoToggle').addEventListener('change', function() {
        showVideo = this.checked;
    });
    
    document.getElementById('faceToggle').addEventListener('change', function() {
        showFace = this.checked;
    });
    
    document.getElementById('handToggle').addEventListener('change', function() {
        showHands = this.checked;
    });
    
    // Data stream toggle
    document.getElementById('dataStreamToggle').addEventListener('change', function() {
        showDataStream = this.checked;
        let dataOptions = document.getElementById('dataOptions');
        let dataPanel = document.getElementById('dataPanel');
        dataOptions.style.display = this.checked ? 'block' : 'none';
        dataPanel.style.display = this.checked ? 'block' : 'none';
    });
    
    // Data on visualization toggle
    document.getElementById('dataOnVisualizationToggle').addEventListener('change', function() {
        showDataOnVisualization = this.checked;
    });
    
    // Data stream option toggles
    document.getElementById('mouthOpenOption').addEventListener('change', function() {
        dataStreamOptions.mouthOpen = this.checked;
    });
    
    document.getElementById('leftEyeOpenOption').addEventListener('change', function() {
        dataStreamOptions.leftEyeOpen = this.checked;
    });
    
    document.getElementById('rightEyeOpenOption').addEventListener('change', function() {
        dataStreamOptions.rightEyeOpen = this.checked;
    });
    
    document.getElementById('noseCenterOption').addEventListener('change', function() {
        dataStreamOptions.noseCenter = this.checked;
    });
    
    document.getElementById('wristPositionOption').addEventListener('change', function() {
        dataStreamOptions.wristPosition = this.checked;
    });
    
    document.getElementById('handOpenOption').addEventListener('change', function() {
        dataStreamOptions.handOpen = this.checked;
    });
    
    document.getElementById('fingertipPositionsOption').addEventListener('change', function() {
        dataStreamOptions.fingertipPositions = this.checked;
    });
    
    // Trigger toggles
    document.getElementById('winkTrigger').addEventListener('change', function() {
        winkTriggerEnabled = this.checked;
    });
    
    document.getElementById('mouthTextTrigger').addEventListener('change', function() {
        mouthTextTriggerEnabled = this.checked;
        if (this.checked) {
            // Initialize text when enabled
            quoteWords = criticalTheoryQuote.split(' ');
            currentWordIndex = 0;
        }
    });
    
    document.getElementById('wristCircleTrigger').addEventListener('change', function() {
        wristCircleTriggerEnabled = this.checked;
    });
    
    document.getElementById('thumbsUpTrigger').addEventListener('change', function() {
        thumbsUpTriggerEnabled = this.checked;
    });
    
    document.getElementById('prayingTrigger').addEventListener('change', function() {
        prayingTriggerEnabled = this.checked;
    });
    
    document.getElementById('handTrailsToggle').addEventListener('change', function() {
        handTrailsEnabled = this.checked;
    });
}

function updateStatus(message) {
    document.getElementById('status').innerHTML = message;
}

function updateDetectionCounts() {
    // Update total detection count
    let totalCount = faces.length + hands.length;
    document.getElementById('detectionCount').textContent = totalCount;
}

// BEGINNER-FRIENDLY HELPER FUNCTIONS

// Note: Since maxFaces is 1, faces[0] is the only possible face

// Get distance between two landmarks
function getLandmarkDistance(landmark1, landmark2) {
    if (landmark1 && landmark2) {
        return dist(landmark1.x, landmark1.y, landmark2.x, landmark2.y);
    }
    return 0;
}

// Check if hand is making a fist
function isHandFist(hand) {
    if (!hand || !hand.keypoints) return false;
    
    // Simple fist detection: check if fingertips are close to palm
    let palmCenter = hand.keypoints[0]; // Wrist
    let fingertips = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky tips
    
    let closedFingers = 0;
    for (let tipIndex of fingertips) {
        if (hand.keypoints[tipIndex]) {
            let distance = getLandmarkDistance(palmCenter, hand.keypoints[tipIndex]);
            if (distance < 100) closedFingers++;
        }
    }
    
    return closedFingers >= 3;
}

// GLITCH EFFECT FUNCTIONS

function checkForMovement() {
    let currentPositions = [];
    
    // Collect current positions from faces and hands
    if (faces.length > 0 && faces[0].keypoints) {
        for (let point of faces[0].keypoints) {
            if (point.x !== undefined && point.y !== undefined) {
                currentPositions.push({x: point.x, y: point.y});
            }
        }
    }
    
    if (hands.length > 0) {
        for (let hand of hands) {
            if (hand.keypoints) {
                for (let point of hand.keypoints) {
                    currentPositions.push({x: point.x, y: point.y});
                }
            }
        }
    }
    
    // Check movement if we have previous positions
    if (previousPositions.length > 0 && currentPositions.length > 0) {
        let totalMovement = 0;
        let minLength = Math.min(previousPositions.length, currentPositions.length);
        
        for (let i = 0; i < minLength; i++) {
            let distance = dist(previousPositions[i].x, previousPositions[i].y, 
                              currentPositions[i].x, currentPositions[i].y);
            totalMovement += distance;
        }
        
        let averageMovement = totalMovement / minLength;
        
        // Trigger glitch if movement exceeds threshold
        if (averageMovement > movementThreshold) {
            triggerGlitch();
        }
    }
    
    // Store current positions for next frame
    previousPositions = currentPositions;
}

function triggerGlitch() {
    glitchActive = true;
    glitchTimer = millis();
}

function updateGlitchTimer() {
    if (glitchActive && millis() - glitchTimer > glitchDuration) {
        glitchActive = false;
    }
}

function drawGlitchBackground() {
    // Create subtle RGB shift effect
    for (let i = 0; i < 3; i++) {
        push();
        translate(random(-2, 2), random(-1, 1));
        
        if (i === 0) {
            fill(20, 0, 0, 60); // Red channel
        } else if (i === 1) {
            fill(0, 20, 0, 60); // Green channel
        } else {
            fill(0, 0, 20, 60); // Blue channel
        }
        
        noStroke();
        rect(0, 0, width, height);
        pop();
    }
    
    // Add random noise lines
    stroke(255, 100);
    strokeWeight(1);
    for (let i = 0; i < 5; i++) {
        let y = random(height);
        line(0, y, width, y);
    }
}

function applyGlitchTransform() {
    // Subtle random displacement
    translate(random(-3, 3), random(-2, 2));
    
    // Slight rotation
    rotate(random(-0.02, 0.02));
    
    // Minor scale variation
    scale(random(0.98, 1.02));
}

// CREATIVE CODING SPACE FOR BEGINNERS

/*
BEGINNER TIPS:

1. Access detected landmarks:
   - Face: faces[0] - Single face with 478 keypoints (maxFaces: 1)
   - Hands: Loop through hands array - up to 2 hands with 21 keypoints each

2. Create interactive effects:
   - Use landmark positions to control visuals
   - Check distances between points with getLandmarkDistance()
   - Detect gestures like fists with isHandFist()
   - Detect eye states with isLeftEyeOpen() and isRightEyeOpen()

3. Customize colors:
   - Change values in the COLORS object above
   - Use color(red, green, blue) for custom colors

4. Add your own drawings:
   - Use the draw() function to add custom visuals
   - Draw shapes based on landmark positions
   - Create particle systems that follow movements

5. Interactive triggers (see TRIGGERS section):
   - Wink detection: Shows "WINK" text when one eye is closed
   - Mouth text stream: Displays text word-by-word when mouth is open
   - Wrist circle: White circle between wrists that changes size with distance
   
NOTE: To change the mouth text, edit the 'criticalTheoryQuote' variable above.
*/