(function () {
  var scene, renderer, camera, particles, particleSystem;

  var row = 30;
  var col = 30;
  var cap = 0.5;
  var defaultHeigt = 2;
  var controls;

  var context;
  var buffer;
  var analyser;
  var samples = 2048;
  var isLoad = false;
  var limit = 80;
  var stats;

  init();
  animate();

  function init() {
    initAudio();
    var container = document.getElementById('container');
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x121212, 1);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 10;
    camera.position.y = 10;
    camera.lookAt(scene.position);
    scene.add(camera);

    controls = new THREEx.DragPanControls(camera);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    var material = new THREE.ParticleBasicMaterial({
      map: THREE.ImageUtils.loadTexture('img/particle.png'),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      size: 2.0
    });

    particles = new THREE.Geometry();

    for (var i = -col / 2; i < col / 2; i++) {
      for (var j = -row / 2; j < row / 2; j++) {
        x = i * cap;
        z = j * cap;
        particles.vertices.push(new THREE.Vector3(x, defaultHeigt, z));
      }
    }

    particleSystem = new THREE.ParticleSystem(particles, material);
    particleSystem.sortParticles = true;
    particleSystem.dynamic = true;

    scene.add(particleSystem);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();

    render();
  }

  function render() {
    if (isLoad) {
      var data = new Uint8Array(samples);
      analyser.getByteFrequencyData(data);
      //console.log(data.length); // 2048
      var index = 0;
      var offset = 80;
      for (var i = 0, il = row * col; i < il; i++) {
        var height = data[index] / 50 - 1;
        particles.vertices[i].y = height;
        index += (index < il ? 1 : 0);
      }
    }


    renderer.render(scene, camera);
  }

  function initAudio() {
    var container = document.getElementById('container');
    container.style.display = 'none';

    context = new AudioContext();
    var req = new XMLHttpRequest();
    req.open('GET', 'assets/titan.mp3', true);
    req.responseType = "arraybuffer";
    req.onload = function() {
      context.decodeAudioData(req.response, function(_buffer) {
        buffer = _buffer;
        play();
      });
    }
    req.send();
  }

  function play() {
    var source = context.createBufferSource();
    source.buffer = buffer;

    analyser = context.createAnalyser();
    analyser.smoothTimeConstant = 0.3;
    analyser.fftSize = samples;

    source.connect(analyser);
    source.connect(context.destination);;

    source.start();

    // source.noteOn(0);
    isLoad = true;

    var loading = document.getElementById('loading');
    loading.style.display = 'none';

    var container = document.getElementById('container');
    container.style.display = 'inline';

    console.log('finished load');
  }
})()
