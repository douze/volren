import { ArcRotateCamera, AxesViewer, Engine, HemisphericLight, Mesh, RawTexture3D, Scene, SceneLoader, ShaderMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import { renderableTextureFormatToIndex } from "@babylonjs/core/Engines/WebGPU/webgpuTextureHelper";
import "@babylonjs/inspector";
import './shadersStore';
import './style.css';
import { VolumeRawSceneLoader } from "./volumeRawSceneLoader";

class App {

  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;

  constructor() {
    let canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>('#renderCanvas')!;

    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.debugLayer.show();

    SceneLoader.RegisterPlugin(new VolumeRawSceneLoader());

    this.camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, -2, new Vector3(0.5, 0.5, 0), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.wheelPrecision = 120;

    const light: HemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    /**/

    canvas = document.querySelector<HTMLCanvasElement>('#controlCanvas')!;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let marker = {
      cx: 150,
      cy: 75,
      dragging: false,
      draw: (cx, cy) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + 20);
        ctx.lineTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.closePath();
        ctx.stroke();
      },
      isinpath: (x, y,) => {
        return ctx.isPointInPath(x, y);
      }
    }

    animate();

    canvas.addEventListener("mousemove", (e) => {
      if (marker.dragging) {
        marker.cx = e.offsetX;
        marker.cy = e.offsetY;
      }
    });

    canvas.addEventListener("mousedown", (e) => {
      marker.dragging = marker.isinpath(e.offsetX, e.offsetY);
    });

    canvas.addEventListener("mouseup", (e) => {
      marker.dragging = false;
    });

    function animate() {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      render();
    }

    function render() {
      marker.draw(marker.cx, marker.cy);
    }
  }

  private createSimpleBox(): Mesh {
    const box: Mesh = new Mesh("box", this.scene);

    const positions: number[] = [0, 0, 0,
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,

      0, 0, 1,
      1, 0, 1,
      1, 1, 1,
      0, 1, 1];
    const indices: number[] = [0, 1, 2, 0, 2, 3,
      1, 5, 6, 1, 6, 2,
      5, 4, 7, 5, 7, 6,
      4, 0, 3, 4, 3, 7,
      3, 2, 6, 3, 6, 7,
      4, 5, 1, 4, 1, 0];

    const vertexData: VertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.applyToMesh(box);

    return box;
  }

  private createMaterial(texture: RawTexture3D): ShaderMaterial {
    const material: ShaderMaterial = new ShaderMaterial("volume", this.scene, { vertex: "volume", fragment: "volume", },
      {
        attributes: ["position", "normal", "uv"],
        uniforms: ["worldViewProjection", "textureData", "cameraPosition"],
      },
    );
    material.cullBackFaces = false;
    material.setTexture("textureData", texture);

    return material;
  }

  public start() {
    const bonsaiFilename: string = "bonsai_256x256x256_uint8.raw";
    SceneLoader.LoadAssetContainer("./", bonsaiFilename, this.scene, (container) => {
      const texture: RawTexture3D = container.textures[0] as RawTexture3D;
      texture.name = bonsaiFilename;
      const material: ShaderMaterial = this.createMaterial(texture);

      new AxesViewer(this.scene, 1.0);
      const box = this.createSimpleBox();
      box.material = material;

      this.scene.registerBeforeRender(() => {
        material.setVector3("cameraPosition", this.camera.position);
      });

      this.engine.runRenderLoop(() => {
        this.scene.render();
      });
    });
  }

}
new App().start();