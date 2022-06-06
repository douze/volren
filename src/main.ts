import { ArcRotateCamera, AxesViewer, Engine, HemisphericLight, Mesh, RawTexture3D, Scene, SceneLoader, ShaderMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import "@babylonjs/inspector";
import './shadersStore';
import './style.css';
import { VolumetricRawSceneLoader } from "./volumetricRawSceneLoader";

class App {

  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;

  constructor() {
    const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>('#renderCanvas')!

    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.debugLayer.show();

    SceneLoader.RegisterPlugin(new VolumetricRawSceneLoader());

    this.camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, -2, new Vector3(0.5, 0.5, 0), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.wheelPrecision = 120;

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