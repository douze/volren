import { ISceneLoaderPlugin, Scene, AbstractMesh, IParticleSystem, Skeleton, RawTexture3D, Engine, Texture, AssetContainer, ISceneLoaderPluginExtensions } from "@babylonjs/core";

export class VolumetricRawSceneLoader implements ISceneLoaderPlugin {

  public name = "Volumetric .raw scene loader";
  public extensions: ISceneLoaderPluginExtensions = { ".raw": { isBinary: true } }

  importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], onError?: (message: string, exception?: any) => void): boolean {
    throw new Error("Method not implemented.");
  }

  load(scene: Scene, data: any, rootUrl: string, onError?: (message: string, exception?: any) => void): boolean {
    this.createTexture3D(scene, data);
    return true;
  }

  loadAssetContainer(scene: Scene, data: any, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer {
    const container = new AssetContainer(scene);
    container.textures.push(this.createTexture3D(scene, data));
    return container;
  }

  private createTexture3D(scene: Scene, data: ArrayBuffer): RawTexture3D {
    const volumeDimensions: number[] = [256, 256, 256];

    const texture: RawTexture3D = new RawTexture3D(new Uint8Array(data), volumeDimensions[0], volumeDimensions[1], volumeDimensions[2],
      Engine.TEXTUREFORMAT_R, scene, false, false, Texture.BILINEAR_SAMPLINGMODE, Engine.TEXTURETYPE_UNSIGNED_BYTE);
    texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    texture.wrapR = Texture.CLAMP_ADDRESSMODE;

    return texture;
  }


}