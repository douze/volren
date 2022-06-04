import { ArcRotateCamera, AxesViewer, Engine, HemisphericLight, Mesh, RawTexture3D, Scene, ShaderMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import "@babylonjs/inspector";
import './shadersStore';
import './style.css';

class App {

  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;

  private file: String = "bonsai_256x256x256_uint8.raw";

  constructor() {
    const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>('#renderCanvas')!

    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.debugLayer.show();

    this.camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, -2, new Vector3(0.5, 0.5, 0), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.wheelPrecision = 20;

    const light: HemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
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

  private loadVolume(onload: (dataBuffer: Uint8Array) => void): void {
    const request: XMLHttpRequest = new XMLHttpRequest();
    request.open("GET", "http://localhost:8080/" + this.file, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      const response: ArrayBuffer = request.response as ArrayBuffer;
      onload(new Uint8Array(response));
    };
    request.send();
  }

  private createTexture(dataBuffer: Uint8Array, volumeDimensions: number[]): RawTexture3D {
    const texture: RawTexture3D = new RawTexture3D(dataBuffer, volumeDimensions[0], volumeDimensions[1], volumeDimensions[2],
      Engine.TEXTUREFORMAT_R, this.scene, false, false, Texture.BILINEAR_SAMPLINGMODE, Engine.TEXTURETYPE_UNSIGNED_BYTE);
    texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    texture.wrapR = Texture.CLAMP_ADDRESSMODE;
    return texture;
  }

  private createMaterial(texture: RawTexture3D): ShaderMaterial {
    const material: ShaderMaterial = new ShaderMaterial("volumetric", this.scene, { vertex: "volumetric", fragment: "volumetric", },
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
    this.loadVolume((dataBuffer) => {
      new AxesViewer(this.scene, 1.0);
      const box = this.createSimpleBox();

      const volumeDimensions = [256, 256, 256];
      const texture: RawTexture3D = this.createTexture(dataBuffer, volumeDimensions);
      const material: ShaderMaterial = this.createMaterial(texture);

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