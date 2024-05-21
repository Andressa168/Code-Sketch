// import the Three.js module:
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module";
import { XRButton } from "three/addons/webxr/XRButton.js";


const overlay = document.getElementById("overlay")

// add a stats view to the page to monitor performance:
const stats = new Stats();
document.body.appendChild(stats.dom);

// create a renderer with better than default quality:
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
// make it fill the page
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
//renderer.shadowMap.enabled = true;
// create and add the <canvas>
document.body.appendChild(renderer.domElement);
document.body.appendChild(XRButton.createButton(renderer));

// create a perspective camera
const camera = new THREE.PerspectiveCamera(
  75, // this camera has a 75 degree field of view in the vertical axis
  window.innerWidth / window.innerHeight, // the aspect ratio matches the size of the window
  0.05, // anything less than 5cm from the eye will not be drawn
  100 // anything more than 100m from the eye will not be drawn
);
// position the camera
// the X axis points to the right
// the Y axis points up from the ground
// the Z axis point out of the screen toward you
camera.position.y = 1.5; // average human eye height is about 1.5m above ground
camera.position.z = 4; // let's stand 2 meters back

const orbitControls = new OrbitControls(camera, renderer.domElement);

// update camera & renderer when page resizes:
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // bugfix: don't resize renderer if in VR
  if (!renderer.xr.isPresenting)
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

const scene = new THREE.Scene();

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

const MAX_NUM_SPHERES = 100
const geometry = new THREE.SphereGeometry( 0.1, 32, 16 ); 
const material = new THREE.MeshStandardMaterial( { color: 0xffffff } ); 
const sphere = new THREE.InstancedMesh( geometry, material, MAX_NUM_SPHERES ); 
scene.add( sphere );

const cube1 = new THREE.BoxGeometry( 1, 1, 1 ); 
const cube1_material = new THREE.MeshNormalMaterial( { color: 0xff0000 } ); 
const cube1_mesh = new THREE.Mesh(cube1, cube1_material);
cube1_mesh.position.y = 1.5;
scene.add(cube1_mesh);

const cube_line = new THREE.Line(cube1, cube1_material);
scene.add(cube_line);

// Create a sphere geometry
const geometrySphere = new THREE.SphereGeometry(1, 32, 16);
const materialSphere = new THREE.MeshStandardMaterial({ color: 0xffffff });
const sphere_mesh = new THREE.Mesh(geometrySphere, materialSphere);
sphere_mesh.position.y = 1.5;
sphere_mesh.position.x = 2.5;
scene.add(sphere_mesh);

const audioListener = new THREE.AudioListener();
camera.add(audioListener);

// Connect the AudioListener to the camera
const audioLoader = new THREE.AudioLoader();
const sound = new THREE.PositionalAudio(audioListener);
audioLoader.load('../public/sounds/Feels.mp3', function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(1);
    // sound.play();
});

// Function to start sound playback and animation loop
function startAudioAndAnimation() {
    sound.play();
}

// Create a torus
const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 32);
const torusMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.y = 1.5;
torus.position.x = -2.5;
scene.add(torus);

sphere.position.set(0, 0, 0);
sphere_mesh.position.set(-2, 1.5, 0);
cube1_mesh.position.set(2.5, 5, -5);
cube_line.position.set(-2.5, 5, -5);
torus.position.set(2, 1.5, 0);

// Create an AudioAnalyser, passing in the sound and desired fftSize
const analyser = new THREE.AudioAnalyser(sound, 32);


// Create a raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // Calculate normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects([sphere_mesh, cube1_mesh, torus]);

    // If the ray intersects with any object, adjust the volume of the sound based on the object clicked
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (clickedObject === sphere_mesh) {

			// Toggle illumination
			if (!sphere_mesh.userData.illuminated) {
				// Make the sphere illuminated
				sphere_mesh.material.emissive.set(0xffffff); // Set emissive color to white
				sphere_mesh.userData.illuminated = true;
			} else {
				// Turn off illumination
				sphere_mesh.material.emissive.set(0x000000); // Set emissive color to black
				sphere_mesh.userData.illuminated = false;
			}
	
			// Change color randomly
			sphere_mesh.material.color.set(Math.random() * 0xffffff);

            // Increase the volume
            sound.setVolume(Math.min(sound.getVolume() + 1.5, 20)); // Increase volume by 1.5 (limit to 20)
        } else if (clickedObject === torus) {

			// Toggle illumination
			if (!torus.userData.illuminated) {
				// Make the torus illuminated
				torus.material.emissive.set(0xffffff); // Set emissive color to white
				torus.userData.illuminated = true;
			} else {
				// Turn off illumination
				torus.material.emissive.set(0x000000); // Set emissive color to black
				torus.userData.illuminated = false;
			}
	
			// Change color randomly
			torus.material.color.set(Math.random() * 0xff0000);

            // Decrease the volume
            sound.setVolume(Math.max(sound.getVolume() - 1.5, 0)); // Decrease volume by 1.5 (limit to 0)
        }

    }
}

// Add mouse click event listener to the document
document.addEventListener('click', onMouseClick, false);

function updateSceneFromServer(shared) {
	let count = Math.min(shared.clients.length, MAX_NUM_SPHERES)

	let mat = new THREE.Matrix4()
	let color = new THREE.Color()
	for (let i=0; i < count; i++) {
		let client = shared.clients[i]

		mat.setPosition((client.x-0.5)*2, (1.5-client.y)*2, 0)
		color.setHSL(client.hue*2, 1, 0.5)

		sphere.setMatrixAt(i, mat)
		sphere.setColorAt(i, color)
	}
	sphere.count = count
	sphere.instanceMatrix.needsUpdate = true;
}

function animate() {
	// monitor our FPS:
	stats.begin();
	
	// get current timing:
	const dt = clock.getDelta();
	const t = clock.getElapsedTime();

	// Get the average frequency of the sound
	const averageFrequency = analyser.getAverageFrequency();

	// Adjust the volume based on the average frequency
    const currentVolume = sound.getVolume();

	// Scale the cube based on the average frequency
	cube1_mesh.scale.y = (averageFrequency / 128) * currentVolume * 5;
	cube1_mesh.scale.x = (averageFrequency / 128) * currentVolume * 5;

	//cube line
	cube_line.rotation.x += 0.01;
	cube_line.rotation.y += 0.01;
	cube_line.scale.y = (averageFrequency / 128) * currentVolume * 5;
	cube_line.scale.x = (averageFrequency / 128) * currentVolume * 5;

	// now draw the scene:
	renderer.render(scene, camera);

	// monitor our FPS:
	stats.end();
}
renderer.setAnimationLoop(animate);

// Event listener for mouse click
document.addEventListener('click', startAudioAndAnimation);
  
/////////////////////////////////////////

// connect to websocket at same location as the web-page host:
const addr = location.origin.replace(/^http/, 'ws')
console.log("connecting to", addr)

// this is how to create a client socket in the browser:
let socket = new WebSocket(addr);
socket.binaryType = 'arraybuffer';

// let's know when it works:
socket.onopen = function() { 
	// or document.write("websocket connected to "+addr); 
	console.log("websocket connected to "+addr); 
}
socket.onerror = function(err) { 
	console.error(err); 
}
socket.onclose = function(e) { 
	console.log("websocket disconnected from "+addr); 

	// a useful trick:
	// if the server disconnects (happens a lot during development!)
	// after 2 seconds, reload the page to try to reconnect:
	setTimeout(() => location.reload(), 2000)
}

document.addEventListener("pointermove", e => {
    // is the socket available?
    if (socket.readyState !== WebSocket.OPEN) return;

	// we can send any old string:
    //socket.send("boo!")
	// or send an object:
	socket.send(JSON.stringify({
		what: "pointermove",
		x: e.clientX / window.innerWidth,
		y: e.clientY / window.innerHeight,
	}))
});

let last_msg_t = clock.getElapsedTime();

socket.onmessage = function(msg) {

	if (msg.data instanceof ArrayBuffer) {

		let t = clock.getElapsedTime();

		let fps = Math.round( 1/(t - last_msg_t) )

		let mbps = ((msg.data.byteLength * 8) * fps) / 1024 / 1024

		overlay.innerText = "ws received arraybuffer of " + msg.data.byteLength + " bytes at " + Math.round( 1/(t - last_msg_t) ) + " fps, which is " + Math.round(mbps) + " mbps \n"
		last_msg_t = t

	} else if (msg.data.toString().substring(0,1) == "{") {
    	//updateSceneFromServer(JSON.parse(msg.data))
	} else {
		console.log("received", msg.data);
	}

}
