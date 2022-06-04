import { Effect } from "@babylonjs/core";

Effect.ShadersStore["volumetricVertexShader"] = `
    precision highp float;

    attribute vec3 position;

    uniform mat4 worldViewProjection;
    uniform vec3 cameraPosition;

    varying vec3 vCameraDirection;

    void main(void) {
      gl_Position = worldViewProjection * vec4(position, 1);
      vCameraDirection = position - cameraPosition;
    }`;

Effect.ShadersStore["volumetricFragmentShader"] = `
    precision highp float; 
    precision highp sampler3D;

    uniform sampler3D textureData;
    uniform vec3 cameraPosition;

    varying vec3 vCameraDirection;

    // slab method -- https://tavianator.com/2011/ray_box.html
    vec2 intersect_box(vec3 orig, vec3 dir) {
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

    void main(void) { 
      vec4 color;

      vec3 rayDirection = normalize(vCameraDirection);
      vec2 hit = intersect_box(cameraPosition, rayDirection);

      vec3 volume_dims = vec3(256);
      vec3 dt_vec = 1.0 / (vec3(volume_dims) * abs(rayDirection));
      float dt = min(dt_vec.x, min(dt_vec.y, dt_vec.z));

      vec3 point = cameraPosition + (hit.x + dt) * rayDirection;
      for (float t = hit.x; t < hit.y; t += dt) {
        vec4 pointColor = vec4(texture(textureData, point).r);
        color.rgb = (1.0 - color.a) * pointColor.a * pointColor.rgb;
        color.a += (1.0 - color.a) * pointColor.a;
        point += rayDirection * dt;
      }
      gl_FragColor = color;
    }`;