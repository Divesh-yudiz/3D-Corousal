import * as THREE from "three";
import { fragment, vertex } from "./shaders";

class GLManager {
  constructor(data) {
    // console.log(data);
    this.totalEntries = data.length;
    this.loadedEntries = 0;
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    this.camera.position.z = 5;

    this.scene = new THREE.Scene();
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.render = this.render.bind(this);
    this.textures = data.map((entry, i) =>
      new THREE.TextureLoader().load(
        entry.image,
        this.calculateAspectRatioFactor.bind(this, i)
      )
    );
    this.factors = data.map(d => new THREE.Vector2(1, 1));
    this.currentIndex = 0;
    this.nextIndex = 0;
    this.textureProgress = 0;
    this.camera = this.camera;
    this.scene = this.scene;
    this.renderer = this.renderer;
    this.initialRender = false;
    this.time = 0;
    this.loopRaf = null;
    this.loop = this.loop.bind(this);
  }

  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const viewSize = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    );

    return viewSize;
  }

  getPlaneSize() {
    const viewSize = this.getViewSize();
    return {
      width: viewSize * 1.5,
      height: viewSize
    };
  }

  calculateAspectRatioFactor(index, texture) {
    const plane = this.getPlaneSize();
    const windowRatio = window.innerWidth / window.innerHeight;
    const rectRatio = (plane.width / plane.height) * windowRatio;
    const imageRatio = texture.image.width / texture.image.height;

    let factorX = 1;
    let factorY = 1;
    if (rectRatio > imageRatio) {
      factorX = 1;
      factorY = (1 / rectRatio) * imageRatio;
    } else {
      factorX = (1 * rectRatio) / imageRatio;
      factorY = 1;
    }

    this.factors[index] = new THREE.Vector2(factorX, factorY);
    if (this.currentIndex === index) {
      this.mesh.material.uniforms.u_textureFactor.value = this.factors[index];
      this.mesh.material.uniforms.u_textureFactor.needsUpdate = true;
    }
    if (this.nextIndex === index) {
      this.mesh.material.uniforms.u_texture2Factor.value = this.factors[index];
      this.mesh.material.uniforms.u_texture2Factor.needsUpdate = true;
    }
    if (this.initialRender) {
      this.loadedEntries++;
      if (this.loadedEntries === this.totalEntries) {
        document.body.classList.remove("loading");
      }
      this.render();
    }
  }

  createPlane() {
    const viewSize = this.getViewSize();
    const { width, height } = this.getPlaneSize();

    const segments = 60;
    const geometry = new THREE.PlaneBufferGeometry(
      width,
      height,
      segments,
      segments
    );
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: { type: "t", value: this.textures[this.currentIndex] },
        u_textureFactor: {
          type: "f",
          value: this.factors[this.currentIndex]
        },
        u_texture2: { type: "t", value: this.textures[this.nextIndex] },
        u_texture2Factor: {
          type: "f",
          value: this.factors[this.nextIndex]
        },
        u_textureProgress: { type: "f", value: this.textureProgress },
        u_offset: { type: "f", value: 8 },
        u_progress: { type: "f", value: 0 },
        u_direction: { type: "f", value: 1 },
        u_effect: { type: "f", value: 0 },
        u_time: { type: "f", value: this.time },
        u_waveIntensity: { type: "f", value: 0 },
        u_resolution: {
          type: "v2",
          value: new THREE.Vector2(
            window.innerWidth,
            window.innerHeight
          )
        },
        u_rgbPosition: {
          type: "v2",
          value: new THREE.Vector2(
            window.innerWidth / 2,
            window.innerHeight / 2
          )
        },
        u_rgbVelocity: { type: "v2", value: new THREE.Vector2(0, 0) }
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.mesh = mesh;
  }

  updateTexture(newIndex, progress) {
    let didChange = false;
    if (newIndex != null && this.newIndex !== this.currentIndex) {
      this.currentIndex = this.nextIndex;
      this.nextIndex = newIndex;
      this.textureProgress = 0;
      this.mesh.material.uniforms.u_textureProgress.value = 0;
      this.mesh.material.uniforms.u_texture.value = this.textures[
        this.currentIndex
      ];
      this.mesh.material.uniforms.u_textureFactor.value = this.factors[
        this.currentIndex
      ];
      this.mesh.material.uniforms.u_texture2.value = this.textures[newIndex];

      this.mesh.material.uniforms.u_texture2Factor.value = this.factors[newIndex];

      didChange = true;
    }
    if (progress != null && progress !== this.textureProgress) {
      this.mesh.material.uniforms.u_textureProgress.value = progress;
      this.textureProgress = progress;
      didChange = true;
    }

    if (!this.loopRaf && didChange) {
      this.render();
    }
  }

  updateStickEffect({ progress, direction, waveIntensity }) {
    this.mesh.material.uniforms.u_progress.value = progress;
    this.mesh.material.uniforms.u_direction.value = direction;
    this.mesh.material.uniforms.u_waveIntensity.value = waveIntensity;
    // this.render();
  }

  updateRgbEffect({ position, velocity }) {
    // console.log(position)
    // console.log(velocity)
    this.mesh.material.uniforms.u_rgbPosition.value = new THREE.Vector2(
      position.x,
      position.y
    );
    this.mesh.material.uniforms.u_rgbVelocity.value = new THREE.Vector2(
      velocity.x,
      velocity.y
    );

    if (!this.loopRaf) {
      this.render();
    }
  }

  render() {
    if (!this.initialRender) {
      this.initialRender = true;
    }
    this.renderer.render(this.scene, this.camera);
  }

  mount(container) {
    container.appendChild(this.renderer.domElement);
  }

  unmount() {
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.mesh = null;
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.container = null;
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.mesh.material.uniforms.u_resolution.value = new THREE.Vector2(
      window.innerWidth,
      window.innerHeight
    );
    // this.camera.aspect = window.inenrWidth / window.innerHeight;
    // this.camera.updateProjectionMatrix();
    for (let i = 0; i < this.textures.length; i++) {
      if (this.textures[i].image) {
        this.calculateAspectRatioFactor(i, this.textures[i]);
      }
    }

    this.render();
  }

  scheduleLoop() {
    if (this.loopRaf) return;
    this.loop();
  }

  loop() {
    this.render();
    this.time += 0.1;
    this.mesh.material.uniforms.u_time.value = this.time;

    this.loopRaf = requestAnimationFrame(this.loop);
  }

  cancelLoop() {
    cancelAnimationFrame(this.loopRaf);
    this.loopRaf = null;
  }
}

export { GLManager };
