/* Optional GPU point batch. Only visible positions enter this bounded buffer.
 * p5 still owns the application canvas. Failure/context loss uses Canvas2D.
 */
class MemorialPoints {
  constructor(grid, { lod = MemorialLOD, ink = MemorialInk } = {}) {
    this.grid = grid;
    this.lod = lod; this.ink = ink;
    this.canvas = document.createElement('canvas');
    this.positions = new Float32Array(262144 * 3); // 3 MiB, bounded visible exact/aggregate batch.
    this.collect = (id, x, y) => {
      if (this.count >= this.positions.length / 3) { this.overflow = true; return; }
      this.positions[this.count * 3] = x;
      this.positions[this.count * 3 + 1] = y;
      this.positions[this.count * 3 + 2] = grid.isRed(id) ? 1 : 0;
      this.count++;
    };
    this.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this.ready = false; });
    this.canvas.addEventListener('webglcontextrestored', () => this.initialize());
    this.initialize();
  }
  initialize() {
    try {
      const gl = this.gl || this.canvas.getContext('webgl2', {
        alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false
      });
      if (!gl) return;
      this.gl = gl;
      const shader = (type, source) => {
        const result = gl.createShader(type);
        gl.shaderSource(result, source); gl.compileShader(result);
        if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
        return result;
      };
      const vertex = shader(gl.VERTEX_SHADER, `#version 300 es
        in vec3 aPosition;
        flat out vec3 vColor;
        uniform vec2 uCenter;
        uniform vec2 uViewport;
        uniform float uZoom;
        uniform float uPointPixels;
        uniform vec3 uRed;
        uniform vec3 uGrey;
        void main() {
          vec2 screen = (aPosition.xy - uCenter) * uZoom;
          vColor = mix(uGrey, uRed, aPosition.z);
          gl_Position = vec4(screen.x / (uViewport.x * 0.5), -screen.y / (uViewport.y * 0.5), 0., 1.);
          gl_PointSize = uPointPixels + 2.;
        }`);
      const fragment = shader(gl.FRAGMENT_SHADER, `#version 300 es
        precision highp float;
        flat in vec3 vColor;
        uniform float uPointPixels;
        uniform float uOpacity;
        out vec4 outColor;
        void main() {
          float distanceToCenter = length((gl_PointCoord - vec2(0.5)) * (uPointPixels + 2.));
          float alpha = clamp(uPointPixels * 0.5 - distanceToCenter + 0.5, 0., 1.) * uOpacity;
          outColor = vec4(vColor * alpha, alpha);
        }`);
      const program = gl.createProgram();
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      this.program = program;
      gl.useProgram(program);
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.positions.byteLength, gl.DYNAMIC_DRAW);
      const location = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
      this.uniforms = {};
      for (const name of ['uCenter', 'uViewport', 'uZoom', 'uPointPixels', 'uRed', 'uGrey', 'uOpacity']) this.uniforms[name] = gl.getUniformLocation(program, name);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this.ready = true;
    } catch { this.ready = false; }
  }
  draw(ctx, camera, bounds, stride = 1) {
    if (!this.ready || this.gl.isContextLost()) return -1;
    this.count = 0;
    this.overflow = false;
    this.lod.visit(this.grid, bounds, stride, this.collect);
    if (this.overflow) return -1;
    const gl = this.gl;
    const mobile = matchMedia('(max-width: 650px)').matches;
    const density = Math.min(mobile ? 1.5 : 2, ctx.canvas.width / camera.width);
    const width = Math.round(camera.width * density), height = Math.round(camera.height * density);
    if (width < 1 || height < 1) return -1;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    // Source offset/length avoids allocating a typed-array view each frame.
    if (this.count) gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions, 0, this.count * 3);
    gl.uniform2f(this.uniforms.uCenter, camera.x, camera.y);
    gl.uniform2f(this.uniforms.uViewport, camera.width, camera.height);
    gl.uniform1f(this.uniforms.uZoom, camera.zoom);
    gl.uniform1f(this.uniforms.uPointPixels, this.lod.diameter(this.grid, stride) * camera.zoom * density);
    gl.uniform3fv(this.uniforms.uRed, this.ink.redRGB);
    gl.uniform3fv(this.uniforms.uGrey, this.ink.greyRGB);
    gl.uniform1f(this.uniforms.uOpacity, this.ink.opacity);
    gl.drawArrays(gl.POINTS, 0, this.count);
    if (gl.isContextLost() || !this.canvas.width || !this.canvas.height) return -1;
    ctx.drawImage(this.canvas, 0, 0, camera.width, camera.height);
    return this.count;
  }
  dispose() {
    if (this.gl) {
      this.gl.deleteBuffer(this.buffer);
      this.gl.deleteProgram(this.program);
    }
  }
}
