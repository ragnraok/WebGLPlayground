(function () {
  function FrameCube (param) {
    param = param || {};
    this.dummyMul = 100;
    this.size = param.size || 40;
    this.height = param.height || 100;
    this.scaleStep = param.scaleStep * this.dummyMul || 0.04 * this.dummyMul;
    this.wireframeColor = param.wireframeColor || 0x424242;
    this.color =  param.color || 0xC7C7C7;
    this.minScale = param.minScale * this.dummyMul || 0.1 * this.dummyMul;

    this.geometry = new THREE.CubeGeometry(this.size, this.height, this.size);
    this.frameMaterial = new THREE.MeshPhongMaterial({color: this.wireframeColor, ambient: this.wireframeColor, wireframe: true});
    this.colorMaterial = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color});

    this.frameMesh = new THREE.Mesh(this.geometry, this.frameMaterial);
    this.colorMesh = new THREE.Mesh(this.geometry, this.colorMaterial);

    this.isScaleUp = false;
  };

  FrameCube.prototype = {
    addToScene: function (scene, x, y, z) {
      this.frameMesh.position.set(x, y, z);
      this.colorMesh.position.set(x, y, z);

      scene.add(this.frameMesh);
      scene.add(this.colorMesh);
    },

    scale: function () {
      var step = this.scaleStep / this.dummyMul;
      var minScale = this.minScale / this.dummyMul;

      if (!this.isScaleUp) {
        this.frameMesh.scale.y -= step;
        this.colorMesh.scale.y -= step;
        if (this.frameMesh.scale.y <= minScale || this.colorMesh.scale.y <= minScale) {
          this.isScaleUp = true;
        }
      }
      else {
        this.frameMesh.scale.y += step;
        this.colorMesh.scale.y += step;
        if (this.frameMesh.scale.y >= 1 || this.colorMesh.scale.y >= 1) {
          this.isScaleUp = false;
        }
      }
    },

    getScale: function () {
      return this.frameMesh.scale.y;
    }
  };

  // contants
  var SCREEN_WIDTH = window.innerWidth,
      SCREEN_HEIGHT = window.innerHeight,
      NEAR = 0.1,
      FAR = 10000,
      ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
      FOV = 60,
      SCALE_LIMIT = 10,
      CUBE_POS_RANGE = 120,
      CUBE_WIDTH = 40,
      CUBE_ROW = 10,
      CUBE_COL = 5,
      MAX_SCALE_STEP = 0.13;

  // dom element
  var container;

  // renderable objects
  var camera, renderer, scene;
  // cubes
  var cubes = [];

  // lighting
  var ambientLight, pointLight1, pointLight2;

  // stats
  var stats;

  // clock
  var clock = new THREE.Clock(), lastTime = 0;

  // controls
  var control;

  init();
  animate();

  function init() {
    // set up basic variables
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
    camera.position.z = 250;
    camera.position.y = 200;
    camera.position.x = 100;

    control = new THREE.TrackballControls(camera);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(0x424242, 1);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera.lookAt(scene.position);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    container.appendChild(stats.domElement);

    // add lighting
    ambientLight = new THREE.AmbientLight(0xFAFAFA);
    scene.add(ambientLight);

    pointLight1 = new THREE.PointLight(0xFFE4B5);
    pointLight1.position.y = 400;
    scene.add(pointLight1);

    pointLight2 = new THREE.PointLight(0xFFE4B5);
    pointLight2.position.x = 400;
    scene.add(pointLight2);

    //var frameCube = new FrameCube();
    //frameCube.addToScene(scene, 0, 0, 0);
    //cubes.push(frameCube);

    var count = 1;
    for (var i = -CUBE_ROW / 2; i < CUBE_ROW / 2; i++) {
      for (var j = -CUBE_ROW / 2; j < CUBE_COL / 2; j++) {
        var scaleStep = 0.01 * count;
        var frameCube = new FrameCube({size: CUBE_WIDTH, height: 40,
                                      scaleStep: MAX_SCALE_STEP});
        var posX = i * CUBE_WIDTH;
        var posZ = j * CUBE_WIDTH;
        frameCube.addToScene(scene, posX, 0, posZ);
        cubes.push(frameCube);
        count++;
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    stats.update();
    control.update();

    var time = clock.getElapsedTime() * 10;
    var delta = clock.getDelta() * 10000;
    console.log(time)
    // scale the cube
    for (var i = 0; i < cubes.length; i++) {
      if (time >= i) {
        cubes[i].scale();
      }
    }

    render();
  }

  function render() {
    renderer.render(scene, camera);
  }


})();
