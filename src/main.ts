import { ArcRotateCamera, Engine, HemisphericLight, Mesh, MeshBuilder, Scene, Vector3, Color3 } from "@babylonjs/core";
import { GradientMaterial } from "@babylonjs/materials";
import './style.css';

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

    const box: Mesh = MeshBuilder.CreateBox("box", { size: 5 }, scene);

    const material = new GradientMaterial("grad", scene);
    material.topColor = Color3.Red(); // Set the gradient top color
    material.bottomColor = Color3.Blue(); // Set the gradient bottom color
    material.offset = 0.5;
    material.cullBackFaces = false;

    box.material = material;

    engine.runRenderLoop(() => {
      scene.render();
    });
  }
}
new App();