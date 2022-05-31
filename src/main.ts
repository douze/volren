import { ArcRotateCamera, Effect, Engine, HemisphericLight, Mesh, MeshBuilder, RawTexture, RawTexture3D, Scene, ShaderMaterial, Texture, Vector3 } from "@babylonjs/core";
import "@babylonjs/inspector";
import './style.css';

class App {
  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')!

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    scene.debugLayer.show({

    });

    const camera: ArcRotateCamera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 1.5, -10, Vector3.Zero(), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);

    const light: HemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const box: Mesh = MeshBuilder.CreateBox("box", { size: 5 }, scene);

     let data = new Float32Array([
      1.0,0.0,0.0,
      1.0,0.0,0.0,
      1.0,0.0,0.0,
      1.0,0.0,0.0,
      
      0.0,0.0,1.0,
      0.0,0.0,1.0,
      0.0,0.0,1.0,
      0.0,0.0,1.0
    ]);

    const texture: RawTexture3D = new RawTexture3D(data, 2, 2, 2, Engine.TEXTUREFORMAT_RGB, scene, true, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT);
  
    Effect.ShadersStore["customVertexShader"] = `
      precision highp float;
  
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 worldViewProjection;

      varying vec2 vUV;

      void main(void) {
        gl_Position = worldViewProjection * vec4(position, 1.0);
        vUV = uv;
      }`;

    Effect.ShadersStore["customFragmentShader"] = `
      precision highp float; 
      precision highp sampler3D;

      varying vec2 vUV; 
      uniform sampler3D textureData;

      void main(void) { 
        gl_FragColor = vec4(vUV, 0, 1);
        gl_FragColor = texture(textureData, vec3(vUV, vUV.x));
      }`;

    const shaderMaterial = new ShaderMaterial(
      "shader",
      scene,
      {
        vertex: "custom",
        fragment: "custom",
      },
      {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "proj_view", "eye_pos", "volume_scale", "textureData"],
      },
    );
    //shaderMaterial.cullBackFaces = false;
    shaderMaterial.setTexture("textureData", texture);

    box.material = shaderMaterial;

    engine.runRenderLoop(() => {
      scene.render();
    });
  }
}
new App();