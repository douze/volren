import './style.css'
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";

class App {
  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')!

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    const camera: ArcRotateCamera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 1.5, -10, Vector3.Zero(), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);

    const light: HemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1;

    MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

    engine.runRenderLoop(() => {
      scene.render();
    });
  }
}
new App();