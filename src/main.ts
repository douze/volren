import { ArcRotateCamera, AxesViewer, Engine, HemisphericLight, Mesh, RawTexture3D, Scene, SceneLoader, ShaderMaterial, Vector3, VertexData } from "@babylonjs/core";
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

    // create gradient/rect for colormap

    const colormapHeight = 100;
    const colormapWidth = 400;
    const colormapOrigin = 20;
    var gradient = ctx.createLinearGradient(colormapOrigin, 0, colormapOrigin + colormapWidth, 0);

    let randomColor = () => {
      return "rgb(" + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + ")";
    };

    let colorStops = [
      { offset: 0, color: randomColor() }
    ];

    // https://www.kennethmoreland.com/color-advice/
    colorStops = [ // inferno
      { offset: 0 / 7, color: 'rgb(0,0,4)' },
      { offset: 1 / 7, color: 'rgb(40,11,84)' },
      { offset: 2 / 7, color: 'rgb(101,21,110)' },
      { offset: 3 / 7, color: 'rgb(159,42,99)' },
      { offset: 4 / 7, color: 'rgb(212,72,66)' },
      { offset: 5 / 7, color: 'rgb(245,125,21)' },
      { offset: 6 / 7, color: 'rgb(250,193,39)' },
      { offset: 7 / 7, color: 'rgb(252,255,164)' },
    ];

    console.log(JSON.stringify(colorStops));

    colorStops = [ // test
      { offset: 0/4, color: 'rgb(0,0,0)' },
      { offset: 1/4, color: 'rgb(255,0,0)' },
      { offset: 2/4, color: 'rgb(0,255,0)' },
      { offset: 3/4, color: 'rgb(0,0,255)' },
      { offset: 4/4, color: 'rgb(0,0,0)' },
    ];

    colorStops.forEach(cs => gradient.addColorStop(cs.offset, cs.color));

    colorStops.forEach((cs,idx) => {
      let xorig = colormapOrigin + (cs.offset * colormapWidth);
      // add marker
      ctx.beginPath();
      ctx.moveTo(xorig, colormapOrigin);
      ctx.lineTo(xorig - 5, colormapOrigin - 10);
      ctx.lineTo(xorig + 5, colormapOrigin - 10);
      ctx.closePath();
      ctx.stroke();
    });

    // Set the fill style and draw a rectangle
    ctx.fillStyle = gradient;
    ctx.fillRect(colormapOrigin, colormapOrigin, colormapWidth, colormapHeight);
    ctx.strokeRect(colormapOrigin, colormapOrigin, colormapWidth, colormapHeight);

    let button: HTMLButtonElement = document.querySelector<HTMLButtonElement>('#addMarkerButton')!;
    button.addEventListener("click", () => {
      var gradient = ctx.createLinearGradient(colormapOrigin, 0, colormapOrigin + colormapWidth, 0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      colorStops.push({ offset: 1, color: randomColor() });

      // current length
      let l = colorStops.length;
      let pad = 1 / (l - 1);

      console.log('current length : ' + l);
      console.log('pad between markers : ' + pad);

      colorStops.forEach((val, ind) => val.offset = ind * pad);
      colorStops.forEach(cs => gradient.addColorStop(cs.offset, cs.color));


    colorStops.forEach((cs,idx) => {
      let xorig = colormapOrigin + (cs.offset * colormapWidth);
      // add marker
      ctx.beginPath();
      ctx.moveTo(xorig, colormapOrigin);
      ctx.lineTo(xorig - 5, colormapOrigin - 10);
      ctx.lineTo(xorig + 5, colormapOrigin - 10);
      ctx.closePath();
      ctx.stroke();
    });


     

      console.log(JSON.stringify(colorStops));

      // Set the fill style and draw a rectangle
      ctx.fillStyle = gradient;
      ctx.fillRect(colormapOrigin, colormapOrigin, colormapWidth, colormapHeight);
      ctx.strokeRect(colormapOrigin, colormapOrigin, colormapWidth, colormapHeight);

    });

    // marker

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

    // animate();

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