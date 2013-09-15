if (!Detector.webgl) {
  Detctor.addGetWebGLMessage();
}

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var halfWidth = SCREEN_WIDTH / 2;
var halfHeight = SCREEN_HEIGHT / 2;
var VIEW_ANGLE = 45;
var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var camera, scene, renderer, container, stats;
var particleNum, particles, particleSystem;

init();
update();

function init () {
  // set up the base variable
  container = document.getElementById('container');

  renderer = new THREE.WebGLRenderer({clearColor: 0x000001, clearAlpha: 1});
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene = new THREE.Scene();

  camera.position.z = 300;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  container.appendChild(renderer.domElement);

  // stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild(stats.domElement);

  // particles
  particleNum = 1800;
  particles = new THREE.Geometry();
  var textureMap = THREE.ImageUtils.loadTexture("img/particlerain.png");
  var pMaterial = new THREE.ParticleBasicMaterial({color: 0xFFFFFF,
                                                  size: 15,
                                                  map: textureMap,
                                                  blending: THREE.AdditiveBlending,
                                                  transparent: true});
  for (var p = 0; p < particleNum; p++) {
    // create particles with random position
    var pX = Math.random() * SCREEN_WIDTH - halfWidth;
    var pY = Math.random() * SCREEN_HEIGHT - halfHeight;
    var pZ = Math.random() * SCREEN_WIDTH - halfHeight;
    var particle = new THREE.Vector3(pX, pY, pZ);

    particle.velocity = new THREE.Vector3(0, -Math.random(), 0);

    // add particle into geometry
    particles.vertices.push(particle);
  }

  // now create a particle system
  particleSystem = new THREE.ParticleSystem(particles, pMaterial);
  particleSystem.dynamic = true;
  particleSystem.sortParticles = true;

  // add to scene
  scene.add(particleSystem);
}

function update () {
  requestAnimationFrame(update);

  stats.update();

  render();
}

function render () {
  particleSystem.rotation.y += 0.01;
  var pCount = particleNum;
  while (pCount--) {
    var particle = particles.vertices[pCount];

    if (particle.y < -halfHeight) {
      particle.y = halfHeight;
      particle.velocity.y = 0;
    }

    particle.velocity.y -= Math.random() * 0.1;

    particle.add(particle.velocity);

  }

  renderer.render(scene, camera);
}

