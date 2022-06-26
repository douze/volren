import { ArcRotateCamera, Color4, DynamicTexture, Engine, HemisphericLight, Mesh, RawTexture3D, Scene, SceneLoader, ShaderMaterial, Vector3, VertexData } from "@babylonjs/core";
import "@babylonjs/inspector";
import { ColorMap } from "./colorMap";
import './shadersStore';
import './style.css';
import { VolumeRawSceneLoader } from "./volumeRawSceneLoader";

/**
 * Entry point of the main application.
 */
class App {

  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;

  /**
   * Create the whole rendering pipeline.
   */
  constructor() {
    let canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>('#renderCanvas')!;

    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(1.0, 1.0, 1.0, 1.0);

    SceneLoader.RegisterPlugin(new VolumeRawSceneLoader());

    this.camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, -2, new Vector3(0.5, 0.5, 0), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.wheelPrecision = 120;
    this.camera.minZ = 0.1;

    const light: HemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
  }

  /**
   * Create a simple box without any custom attributes.
   */
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

  /**
   * Create the material for the volume rendering.
   * @param volumeTexture texture to gather volume data
   * @param colorMapTexture texture for transfert function
   */
  private createMaterial(volumeTexture: RawTexture3D, colorMapTexture: DynamicTexture): ShaderMaterial {
    const material: ShaderMaterial = new ShaderMaterial("volume", this.scene, { vertex: "volume", fragment: "volume", },
      {
        attributes: ["position", "normal", "uv"],
        uniforms: ["worldViewProjection", "volumeTexture", "colormapTexture", "cameraPosition"],
      },
    );
    material.cullBackFaces = false;
    material.setTexture("volumeTexture", volumeTexture);
    material.setTexture("colorMapTexture", colorMapTexture);

    return material;
  }

  /**
   * Load the asset then create the full scene.
   */
  public start() {
    const bonsaiFilename: string = "bonsai_256x256x256_uint8.raw";
    SceneLoader.LoadAssetContainer("./", bonsaiFilename, this.scene, (container) => {
      const volumeTexture: RawTexture3D = container.textures[0] as RawTexture3D;
      volumeTexture.name = bonsaiFilename;

      const colorMap: ColorMap = new ColorMap("controlCanvas", 400, 100);
      // inferno 
      colorMap.setColors([
        "#000004",
        "#280b54",
        "#651565",
        "#9f2a63",
        "#d44842",
        "#f57d15",
        "#fac127",
        "#fcffa4"]);

      const colorMapTexture: DynamicTexture = new DynamicTexture("Color map", colorMap.getCanvas());
      colorMap.onUpdate = () => colorMapTexture.update();

      const material: ShaderMaterial = this.createMaterial(volumeTexture, colorMapTexture);

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