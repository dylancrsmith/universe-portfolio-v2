import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";


export function createSun(scene) {
  // Sun core
  const sunGeo = new THREE.SphereGeometry(90, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xb34700,
    emissive: 0xff6600,
    emissiveIntensity: 2.0,
    roughness: 0.5,
    metalness: 0.2,
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(0, 0, -4000);
  scene.add(sun);

  // Corona shader
  const coronaGeo = new THREE.SphereGeometry(120, 64, 64);
  const coronaMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      glowColor: { value: new THREE.Color(0xffa500) },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 glowColor;
      varying vec3 vNormal;

      void main() {
        float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        float pulse = 0.6 + 0.4 * sin(time * 2.0 + length(vNormal) * 3.0);
        vec3 color = glowColor * intensity * pulse;
        gl_FragColor = vec4(color, intensity * 2.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });

  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  sun.add(corona);

  // Plasma sparks
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 80;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = 120 + Math.random() * 40;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  particleGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );

  const particleMat = new THREE.PointsMaterial({
    color: 0xffaa33,
    size: 10,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const plasma = new THREE.Points(particleGeo, particleMat);
  sun.add(plasma);

  // Sun light
  const light = new THREE.PointLight(0xffaa33, 3, 10000);
  light.position.copy(sun.position);
  scene.add(light);

  // Store refs for animation
  sun.userData.corona = corona;
  sun.userData.plasma = plasma;

  return sun;
}
