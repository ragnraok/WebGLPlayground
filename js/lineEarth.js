(function () {
  var container;

  var camera, scene, renderer;
  var composer;

  var time = 0, oldTime = 0, delta;
  var world;
  var array = [];
  var coverMesh;
  var colorData;
  var mouseX = 0;
  var mouseY = 0;
  var imageW, imageH;

  document.addEventListener('mousemove', onDocumentMouseMove, false);

  loadColor();

  function loadColor() {
    var img = new Image();
    img.onload = function() {
      var imgCanvas = document.createElement('canvas');
      imgCanvas.width = this.width;
      imgCanvas.height = this.height;

      var context = imgCanvas.getContext('2d');
      context.drawImage(this, 0, 0);

      imageW = imgCanvas.width;
      imageH = imgCanvas.height;

      colorData = context.getImageData(0, 0, imageW, imageH).data;

      loadHeight();
    };
    img.src = 'img/day_medium.jpg'
  }

  function loadHeight() {
    var img = new Image();
    img.onload = function() {
      var imgCanvas = document.createElement('canvas');
      imgCanvas.width = this.width;
      imgCanvas.height = this.height;

      var context = imgCanvas.getContext('2d');
      context.drawImage(this, 0, 0);

      imageW = imgCanvas.width;
      imageH = imgCanvas.height;

      var pixels = context.getImageData(0, 0, imageW, imageH).data;
      var index = 0;

      for (var x = 0; x < imageW; x++) {
        for (var y = 0; y < imageH; y++) {
          var r = pixels[index];
          var g = pixels[index + 1];
          var b = pixels[index + 2];
          var a = pixels[index + 3];

          var color = new THREE.Color();
          color.setRGB(
            colorData[index] / 255, colorData[index + 1] / 255, colorData[index + 2] / 255
          );
          index = (x * 4) + y * (4 * imageW);

          var sum = r + g + b;

          var value = {x: x - imageW / 2, y: y - imageH / 2, scale: sum, color: color};
          array.push(value);
        }
      }

      init();
      animate();
    };
    img.src = 'img/bump_medium2.jpg';

  }

  function init() {
    container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x030303, 100, 200);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = -200;
    camera.lookAt(scene.position);
    scene.add(camera);

    world = new THREE.Object3D();
    world.rotation.y = Math.PI - 0.4;
    scene.add(world);

    var worldContainer = new THREE.Object3D();
    worldContainer.rotation.x = -Math.PI / 2;
    world.add(worldContainer);

    var radius = 100;

    var geometry = new THREE.Geometry();
    var colors = [];

    var w_step = Math.PI * 2 / imageW;
    var h_step = Math.PI / imageH;

    for (i = 0; i < array.length; i++) {
      // transfer coordinate in the map to latitude and longtitude
      var x = array[i].x * w_step; // -180 ~ 180
      var y = (array[i].y) * h_step; // -90 ~ 90
      var s = array[i].scale / (255 * 3);
      var color = array[i].color;

      // transfer latitude and longtitude to real xyz coordinate
      var vertex1 = new THREE.Vector3();
      vertex1.x = radius * Math.cos(y) * Math.cos(x);
      vertex1.y = radius * Math.cos(y) * Math.sin(x);
      vertex1.z = radius * -Math.sin(y);

      var vertex2 = vertex1.clone();
      vertex2.multiplyScalar(1 + s / 6);

      geometry.vertices.push(vertex1);
      geometry.vertices.push(vertex2);

      colors.push(color);
      colors.push(color);
    }

    geometry.colors = colors;

    var material = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1.0, vertexColors: THREE.VertexColors});

    var line = new THREE.Line(geometry, material, THREE.LinePieces);
    worldContainer.add(line);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);

    container.appendChild(renderer.domElement);
  }

  function onDocumentMouseMove(event) {
    var windowHalfX = window.innerWidth >> 1;
    var windowHalfY = window.innerHeight >> 1;

    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    time = new Date().getTime();
    delta = time - oldTime;
    oldTimte = time;

    if (isNaN(delta) || delta > 1000 || delta == 0) {
      delta = 1000 / 60;
    }
    camera.position.y += (-150 * Math.sin(mouseY / 500) - camera.position.y) / 10;
    camera.lookAt(scene.position);

    world.rotation.y -= mouseX / 20000;

    renderer.render(scene, camera);
  }

})();
