import { Effect } from "@babylonjs/core";

Effect.ShadersStore["volumeVertexShader"] = `
    precision highp float;

    attribute vec3 position;

    uniform mat4 worldViewProjection;
    uniform vec3 cameraPosition;

    varying vec3 vCameraDirection;

    void main(void) {
      gl_Position = worldViewProjection * vec4(position, 1);
      vCameraDirection = position - cameraPosition;
    }`;

Effect.ShadersStore["volumeFragmentShader"] = `
    precision highp float; 
    precision highp sampler3D;

    uniform sampler3D volumeTexture;
    uniform sampler2D colorMapTexture;
    uniform vec3 cameraPosition;

    varying vec3 vCameraDirection;

    // slab method -- https://tavianator.com/2011/ray_box.html
    vec2 intersectBox(vec3 orig, vec3 dir) {
      const vec3 box_min = vec3(0);
      const vec3 box_max = vec3(1);
      vec3 inv_dir = 1.0 / dir;
      vec3 tmin_tmp = (box_min - orig) * inv_dir;
      vec3 tmax_tmp = (box_max - orig) * inv_dir;
      vec3 tmin = min(tmin_tmp, tmax_tmp);
      vec3 tmax = max(tmin_tmp, tmax_tmp);
      float t0 = max(tmin.x, max(tmin.y, tmin.z));
      float t1 = min(tmax.x, min(tmax.y, tmax.z));
      return vec2(t0, t1);
    }

    // https://observablehq.com/@flimsyhat/webgl-color-maps
    vec3 infernoColormap(float t) {
      const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
      const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
      const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
      const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
      const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
      const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
      const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
      return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    }

    void main(void) { 
      vec4 color;

      vec3 rayDirection = normalize(vCameraDirection);
      vec2 hit = intersectBox(cameraPosition, rayDirection);

      vec3 volumeDimensions = vec3(256);
      vec3 dtVector = 1.0 / (vec3(volumeDimensions) * abs(rayDirection));
      float dt = min(dtVector.x, min(dtVector.y, dtVector.z));

      vec3 point = cameraPosition + (hit.x + dt) * rayDirection;
      for (float t = hit.x; t < hit.y; t += dt) {
        float dataValue = texture(volumeTexture, point).r;
        vec4 pointColor = vec4(texture(colorMapTexture, vec2(dataValue, 0.5)).rgb, dataValue);
        // Front to back blending
        color.rgb += (1.0 - color.a) * pointColor.a * pointColor.rgb;
        color.a += (1.0 - color.a) * pointColor.a;
        point += rayDirection * dt;
      }
      gl_FragColor = color;
    }`;