(function () {
  RippleRound = function(param) {
    param = param || {};
    this.radius = param.radius || 1;
    this.geometry = param.geometry || null;
    if (!this.geometry) {
      throw "geometry can not be null";
    }
    this.y = param.y || 1;
    //this.startVertexIndex = param.startVertexIndex;
    //if (this.startVertexIndex === undefined) {
    //  throw "startVertexIndex can not be null";
    //}

    this.startVertexIndex = this.geometry.vertices.length;

    this.particleNum = 256;
    this.angleGap = 360 / this.particleNum;
    this.endVertexIndex = this.startVertexIndex;

    this.init();
  }

  RippleRound.getParticleNum = function() {
    return 256;
  }

  RippleRound.prototype = {
    init: function() {
      if (this.geometry) {
        var rippleColor = new THREE.Color();
        rippleColor.setRGB(Math.random(), Math.random(), Math.random());
        for (var i = this.startVertexIndex, il = this.startVertexIndex + this.particleNum;
             i < il; i++) {
          var angle = 2 * Math.PI / 360 * i * this.angleGap;
          var x = this.radius * Math.cos(angle);
          var z = this.radius * Math.sin(angle);
          this.geometry.vertices.push(new THREE.Vector3(x, this.y, z));
          //this.geometry.colors.push(rippleColor);
        }
        this.endVertexIndex = this.geometry.vertices.length;
      }
    },

    getEndVertexIndex: function() {
      return this.endVertexIndex;
    },

    getInitRadius: function() {
      return this.initRadius;
    },

    getRadius: function() {
      return this.radius;
    },

    shake: function(timeDomainData) {
      for (var i = this.startVertexIndex, j = 0; i < this.endVertexIndex; i++, j++) {
        this.geometry.vertices[i].y = timeDomainData[j];
      }
    }

  }

  AudioProcessor = function(filename) {
    this.context = new webkitAudioContext();
    this.isFinishLoaded = false;
    this.samples = 1024;
    this.isEnd = false;

    this.loadMusic(filename);

    this.prompt = document.getElementById('loading');
    this.container = document.getElementById('container');
    container.style.display = 'none'
  }

  AudioProcessor.prototype = {
    loadMusic: function(filename) {
      var req = new XMLHttpRequest();
      req.open('GET', filename, true);
      req.responseType = "arraybuffer";
      var _this = this;
      req.onload = function() {
        _this.context.decodeAudioData(req.response, function(_buffer) {

          _this.buffer = _buffer;
          _this.play();
        })
      }
      req.send();
    },

    play: function() {
      if (this.buffer) {
        var source = this.context.createBufferSource();
        _this = this;
        // this method not supported yet
        source.onended = function() {
          console.log(onended);
          _this.isEnd = true;
        }
        source.buffer = this.buffer;

        this.analyser = this.context.createAnalyser();
        this.analyser.smoothTimeConstant = 0.1;
        this.analyser.fftSize = this.samples;

        source.connect(this.analyser);
        source.connect(this.context.destination);

        source.noteOn(0);

        console.log('finished load');
        this.isFinishLoaded = true;

        this.prompt.style.display = 'none';
        this.container.style.display = 'inline';
      }
    },

    getAvgVolume: function() {
      var data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);

      var sum = 0;

      for (var i = 0, il = data.length; i < il; i++) {
        sum += data[i];
      }

      return sum / data.length;
    },

    getTimeData: function() {
      var data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteTimeDomainData(data);

      return data;
    },

    isLoaded: function() {
      return this.isFinishLoaded;
    },

    isEnded: function() {
      return this.getAvgVolume() == 0;
    },

    getBinCount: function() {
      return this.analyser.frequencyBinCount;
    }
  }

  Ripple = function(audioProcessor) {
    this.audioProcessor = audioProcessor;
    this.ROUND_NUM = 20;
    this.ROUND_GAP = 0.2;
    this.rounds = [];
    this.particleSize = 0.5;
    this.initRadius = 1.0;

    // audio stuff
    this.levels = [];
    this.waves = [];

    this.init();
  }

  Ripple.prototype = {
    init: function() {
      this.geometry = new THREE.Geometry();
      this.geometry.verticesNeedUpdate = true;
      this.geometry.colors = [];
      this.geometry.vertices = [];

      this.material = new THREE.ParticleBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/particle01.png'),
        blending: THREE.AdditiveBlending,
        depthTest: false,
        size: this.particleSize,
        transparent: true,
        //vertexColors: true
        color: 0x404040
      })

      var emptyBinData = [];
      for (var i = 0; i < RippleRound.getParticleNum(); i++) {
        emptyBinData.push(0);
      }
      // add all rounds
      for (var i = 0; i < this.ROUND_NUM; i++) {
        var r = new RippleRound({radius: this.initRadius + this.ROUND_GAP * i,
                                geometry: this.geometry});
        this.rounds.push(r);

        this.waves.push(emptyBinData);
      }

      this.mesh = new THREE.ParticleSystem(this.geometry, this.material);
      //this.mesh.dynamic = true;
      this.mesh.sortParticles = true;
    },

    addToScene: function(scene) {
      scene.add(this.mesh);
    },

    updateMusicData: function() {
      if (this.audioProcessor.isLoaded()) {
        this.levels.push(this.audioProcessor.getAvgVolume());

        var timeData = this.processTimeData(this.audioProcessor.getTimeData());
        this.waves.push(timeData);

        this.levels.shift(1);
        this.waves.shift(1);
      }
    },

    processTimeData: function(rawTimeData) {
      // compress rawTimeData into a smaller array
      var rawSize = this.audioProcessor.getBinCount();
      var particleNum = RippleRound.getParticleNum();

      var ratio = Math.floor(rawSize / particleNum);
      var result = [];

      for (var i = 0; i < particleNum; i++) {
        var t = rawTimeData[i];
        t = t / 120;
        result.push(t);
      }

      return result;
    },

    update: function() {
      this.updateMusicData();

      for (var i = 0, j = this.waves.length - 1; i < this.ROUND_NUM, j >= 0; i++, j--) {
        this.rounds[i].shake(this.waves[j])
      }
    }

  }

  var renderer, camera, scene;
  var controls, stats;
  var audioProcessor, ripple;

  init();
  animate();

  function init() {
    audioProcessor = new AudioProcessor('assets/talkToRain.mp3');

    var container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x242424, 1);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 7, 5);
    camera.lookAt(scene.position);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);

    ripple = new Ripple(audioProcessor);
    ripple.addToScene(scene);
  }

  function animate() {
    requestAnimationFrame(animate);

    if (audioProcessor.isLoaded()) {
      controls.update();
      stats.update();

      update();
      render();
    }
  }

  function render() {
    renderer.render(scene, camera);
  }

  function update() {
    ripple.update();
  }


}) ();
