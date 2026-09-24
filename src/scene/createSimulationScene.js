import * as THREE from 'three';

import { COLORS, INITIAL_SCENE_STATE } from './config.js';
import { addVehicles } from './vehicles.js';

export function createSimulationScene(canvas) {
  const isCompactViewport = () => window.innerWidth < 850;
  const getViewportSize = () => ({
    width: Math.max(1, Math.round(canvas.clientWidth || window.innerWidth)),
    height: Math.max(1, Math.round(canvas.clientHeight || window.innerHeight))
  });
  const getPixelRatio = () => Math.min(window.devicePixelRatio, isCompactViewport() ? 1 : 1.35);
  const initialViewport = getViewportSize();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(initialViewport.width, initialViewport.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(COLORS.background, 1);
  
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.background, 0.026);
  
  const camera = new THREE.PerspectiveCamera(42, initialViewport.width / initialViewport.height, 0.1, 240);
  camera.position.set(-1.1, 6.8, 14.2);
  camera.lookAt(0.2, 0.7, -29);
  
  scene.add(new THREE.HemisphereLight(0x9fd8bf, COLORS.background, 2.15));
  const sun = new THREE.DirectionalLight(0xe7fff3, 2.6);
  sun.position.set(-8, 18, 10);
  sun.castShadow = true;
  const shadowMapSize = isCompactViewport() ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  scene.add(sun);

  const rimLight = new THREE.DirectionalLight(0xa6e7c9, 0.85);
  rimLight.position.set(12, 9, -28);
  scene.add(rimLight);
  
  const world = new THREE.Group();
  scene.add(world);
  
  // Road
  const roadMat = new THREE.MeshStandardMaterial({
    color: COLORS.road,
    roughness: 0.92,
    metalness: 0.02,
    transparent: true,
    opacity: 0.16
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(26, 120), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -42;
  road.receiveShadow = true;
  world.add(road);
  
  // Side shoulders
  const shoulderMat = new THREE.MeshStandardMaterial({ color: COLORS.shoulder, roughness: 1, transparent: true, opacity: 0 });
  for (const x of [-15, 15]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 120), shoulderMat);
    s.rotation.x = -Math.PI / 2;
    s.position.set(x, 0.012, -42);
    s.receiveShadow = true;
    world.add(s);
  }
  
  // Lane markings. No mint/green double center line is rendered.
  const markMat = new THREE.MeshBasicMaterial({ color: COLORS.lane, transparent: true, opacity: 0 });
  const roadFlowObjects = [];
  for (const x of [-4.25, 4.25]) {
    for (let z = 8; z > -102; z -= 7) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3.2), markMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(x, 0.025, z);
      world.add(mark);
      roadFlowObjects.push(mark);
    }
  }

  // Small roadside reflectors strengthen the sense of speed in the periphery.
  const reflectorGeometry = new THREE.PlaneGeometry(0.13, 0.78);
  const reflectorMaterial = new THREE.MeshBasicMaterial({ color: 0x496157, transparent: true, opacity: 0 });
  for (const x of [-12.35, 12.35]) {
    for (let z = 10; z > -102; z -= 5.6) {
      const reflector = new THREE.Mesh(reflectorGeometry, reflectorMaterial);
      reflector.rotation.x = -Math.PI / 2;
      reflector.position.set(x, 0.028, z);
      world.add(reflector);
      roadFlowObjects.push(reflector);
    }
  }
  
  
  
  const { cars, ready: vehiclesReady } = addVehicles(world);
  cars.forEach(car => {
    car.userData.baseY = car.position.y;
    car.userData.baseScale = car.scale.x;
  });

  // The hero uses one restrained pool of mint light to ground the ego car.
  // It disappears while the rest of the world is revealed.
  const heroGlowMat = new THREE.MeshBasicMaterial({
    color: COLORS.mint,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const heroGlow = new THREE.Mesh(new THREE.CircleGeometry(3.1, 64), heroGlowMat);
  heroGlow.rotation.x = -Math.PI / 2;
  heroGlow.position.set(cars[0].position.x, 0.045, cars[0].position.z);
  world.add(heroGlow);
  
  // Detection boxes — bright inner edge + subtle additive glow.
  const detectionGroup = new THREE.Group();
  world.add(detectionGroup);
  const detectionMaterials = [];
  const detectionGlowMaterials = [];
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const boxW = 3.15 * car.scale.x;
    const boxH = 2.1 * car.scale.y;
    const boxD = 5.75 * car.scale.z;
  
    const glowEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxW * 1.018, boxH * 1.018, boxD * 1.018));
      const glowMat = new THREE.LineBasicMaterial({
        color: 0x78ffb7,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.LineSegments(glowEdges, glowMat);
    glow.position.set(car.position.x, 1.05 * car.scale.y, car.position.z);
    glow.renderOrder = 9;
    detectionGroup.add(glow);
    detectionGlowMaterials.push(glowMat);
  
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxW, boxH, boxD));
      const mat = new THREE.LineBasicMaterial({
        color: 0xe7fff3,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const line = new THREE.LineSegments(edges, mat);
    line.position.set(car.position.x, 1.05 * car.scale.y, car.position.z);
    line.renderOrder = 10;
    detectionGroup.add(line);
    detectionMaterials.push(mat);
  }
  
  // LiDAR returns originate at the ego vehicle and land on the road,
  // road edges and the visible surfaces of surrounding vehicles.
  const lidarOrigin = new THREE.Vector3(cars[0].position.x, 1.72, cars[0].position.z);
  const lidarHalfFov = THREE.MathUtils.degToRad(68);
  const lidarPositions = [];
  const lidarScanPhases = [];
  const rng = (a, b) => a + Math.random() * (b - a);

  function addLidarReturn(x, y, z) {
    const angle = Math.atan2(x - lidarOrigin.x, -(z - lidarOrigin.z));
    if (Math.abs(angle) > lidarHalfFov) return;

    lidarPositions.push(x, y, z);
    lidarScanPhases.push((angle + lidarHalfFov) / (lidarHalfFov * 2));
  }

  for (let i = 0; i < 5200; i++) {
    const angle = rng(-lidarHalfFov, lidarHalfFov);
    const distance = 2 + Math.pow(Math.random(), 0.72) * 80;
    const x = lidarOrigin.x + Math.sin(angle) * distance;
    if (Math.abs(x) > 17) continue;

    addLidarReturn(
      x + rng(-0.025, 0.025),
      rng(0.025, 0.075),
      lidarOrigin.z - Math.cos(angle) * distance
    );
  }

  for (let i = 0; i < 900; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    addLidarReturn(
      side * rng(12.7, 13.2),
      rng(0.04, 0.18),
      rng(-88, -4)
    );
  }

  cars.slice(1).forEach(car => {
    const width = 2.45 * car.scale.x;
    const height = 1.65 * car.scale.y;
    const length = 4.7 * car.scale.z;
    const visibleSide = car.position.x >= lidarOrigin.x ? -1 : 1;

    for (let i = 0; i < 480; i++) {
      const surface = Math.random();
      const verticalLayer = Math.round(rng(2, 20)) / 20;
      const y = car.position.y + 0.2 + verticalLayer * (height - 0.2) + rng(-0.012, 0.012);

      if (surface < 0.5) {
        addLidarReturn(
          car.position.x + rng(-width / 2, width / 2),
          y,
          car.position.z + length / 2 + rng(-0.035, 0.035)
        );
      } else if (surface < 0.84) {
        addLidarReturn(
          car.position.x + visibleSide * width / 2 + rng(-0.025, 0.025),
          y,
          car.position.z + rng(-length / 2, length / 2)
        );
      } else {
        addLidarReturn(
          car.position.x + rng(-width * 0.42, width * 0.42),
          car.position.y + height + rng(-0.025, 0.025),
          car.position.z + rng(-length * 0.34, length * 0.34)
        );
      }
    }
  });

  const lidarGeo = new THREE.BufferGeometry();
  lidarGeo.setAttribute('position', new THREE.Float32BufferAttribute(lidarPositions, 3));
  lidarGeo.setAttribute('scanPhase', new THREE.Float32BufferAttribute(lidarScanPhases, 1));

  const lidarMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(COLORS.mintBright) },
      uOpacity: { value: 0 },
      uPixelRatio: { value: getPixelRatio() },
      uSweep: { value: 0 }
    },
    vertexShader: `
      uniform float uPixelRatio;
      uniform float uSweep;
      attribute float scanPhase;
      varying float vIntensity;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        float phaseDelta = abs(scanPhase - uSweep);
        float scanGlow = exp(-phaseDelta * phaseDelta * 820.0);
        float hasBeenScanned = step(scanPhase, uSweep);
        vIntensity = hasBeenScanned * (0.24 + scanGlow * 0.76);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(
          2.35 * uPixelRatio * (18.0 / max(8.0, -viewPosition.z)),
          1.1,
          4.0
        );
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vIntensity;

      void main() {
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        float pointAlpha = 1.0 - smoothstep(0.32, 0.5, distanceToCenter);
        gl_FragColor = vec4(uColor, uOpacity * vIntensity * pointAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const lidar = new THREE.Points(lidarGeo, lidarMat);
  world.add(lidar);

  const lidarSensorMat = new THREE.MeshBasicMaterial({
    color: COLORS.mintBright,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  });
  const lidarSensor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24),
    lidarSensorMat
  );
  lidarSensor.position.copy(lidarOrigin);
  world.add(lidarSensor);

  const lidarScannerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.018, 8, 32),
    lidarSensorMat
  );
  lidarScannerRing.rotation.x = Math.PI / 2;
  lidarScannerRing.position.copy(lidarOrigin);
  world.add(lidarScannerRing);

  const lidarBeamCount = 9;
  const lidarBeamCenter = (lidarBeamCount - 1) / 2;
  const lidarBeamStep = THREE.MathUtils.degToRad(0.9);
  const lidarBeamPositions = new Float32Array(lidarBeamCount * 2 * 3);
  const lidarBeamColors = new Float32Array(lidarBeamCount * 2 * 3);
  const lidarBeamGeometry = new THREE.BufferGeometry();
  lidarBeamGeometry.setAttribute('position', new THREE.BufferAttribute(lidarBeamPositions, 3));
  lidarBeamGeometry.setAttribute('color', new THREE.BufferAttribute(lidarBeamColors, 3));

  const lidarBeamColor = new THREE.Color(COLORS.mintBright);
  const lidarBeamEdgeColor = new THREE.Color(COLORS.mint).multiplyScalar(0.46);
  const beamColorAttribute = lidarBeamGeometry.attributes.color;
  for (let beamIndex = 0; beamIndex < lidarBeamCount; beamIndex++) {
    const centerWeight = 1 - Math.abs(beamIndex - lidarBeamCenter) / lidarBeamCenter;
    const color = lidarBeamEdgeColor.clone().lerp(lidarBeamColor, centerWeight);
    beamColorAttribute.setXYZ(beamIndex * 2, color.r, color.g, color.b);
    beamColorAttribute.setXYZ(beamIndex * 2 + 1, color.r, color.g, color.b);
  }

  const lidarBeamMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const lidarBeam = new THREE.LineSegments(lidarBeamGeometry, lidarBeamMat);
  lidarBeam.visible = false;
  lidarBeam.frustumCulled = false;
  lidarBeam.renderOrder = 9;
  world.add(lidarBeam);

  const vehicleScanPhases = cars.map(car => {
    const angle = Math.atan2(
      car.position.x - lidarOrigin.x,
      -(car.position.z - lidarOrigin.z)
    );
    return THREE.MathUtils.clamp(
      (angle + lidarHalfFov) / (lidarHalfFov * 2),
      0,
      1
    );
  });
  const scannedVehicles = cars.map(() => false);
  const detectionVisibility = cars.map(() => 0);
  let lidarSweep = 0;
  let lidarWasActive = false;
  
  // Stage 03: the wireless channel is visible around nearby vehicles.
  // Each nearby vehicle gets several concentric ground rings.
  const wirelessCarRingMats = [];
  const wirelessCarRings = [];
  const wirelessVehicleIndices = [0, 1, 2, 3, 4, 5];
  const wirelessRadiusScale = 1.5;
  for (const carIndex of wirelessVehicleIndices) {
    const car = cars[carIndex];
    const baseRadius = carIndex === 0 ? 1.55 : 1.05 + car.scale.x * 0.42;
    for (let r = 0; r < 3; r++) {
      const radius = (baseRadius + r * (carIndex === 0 ? 0.58 : 0.42)) * wirelessRadiusScale;
      const mat = new THREE.MeshBasicMaterial({
        color: 0xb8ffe0,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.045, radius, 64), mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(car.position.x, 0.061 + r * 0.0015, car.position.z);
      ring.userData.phase = r * 0.7 + carIndex * 0.35;
      world.add(ring);
      wirelessCarRings.push(ring);
      wirelessCarRingMats.push(mat);
    }
  }

  // A complete graph between the six nearby vehicles: 6 × 5 / 2 = 15 links.
  const wirelessGraphLinks = [];
  for (let fromIndex = 0; fromIndex < wirelessVehicleIndices.length; fromIndex++) {
    for (let toIndex = fromIndex + 1; toIndex < wirelessVehicleIndices.length; toIndex++) {
      const positions = new Float32Array(6);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: COLORS.mintBright,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(geometry, material);
      line.visible = false;
      line.frustumCulled = false;
      line.renderOrder = 7;
      world.add(line);

      wirelessGraphLinks.push({
        from: cars[wirelessVehicleIndices[fromIndex]],
        to: cars[wirelessVehicleIndices[toIndex]],
        line,
        geometry,
        material,
        phase: wirelessGraphLinks.length * 0.47
      });
    }
  }
  
  // Stage 04: thicker vehicle zones and thinner ground-only inter-vehicle links.
  function makeGroundLink(a, b) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(a.x, 0.075, a.z),
      new THREE.Vector3(a.x * 0.68 + b.x * 0.32, 0.075, a.z * 0.68 + b.z * 0.32),
      new THREE.Vector3(a.x * 0.32 + b.x * 0.68, 0.075, a.z * 0.32 + b.z * 0.68),
      new THREE.Vector3(b.x, 0.075, b.z)
    ]);
    const geo = new THREE.TubeGeometry(curve, 36, 0.045, 10, false);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS.mintBright,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    world.add(mesh);
    return { mat, curve };
  }
  
  const v2xMats = [];
  const v2xLinkCurves = [];
  const v2xRingMats = [];
  const v2xCarDistances = [];
  const ego = new THREE.Vector3(cars[0].position.x, 0.075, cars[0].position.z);
  
  for (let i = 0; i <= 5; i++) {
    const radius = i === 0 ? 2.35 : 1.50 + cars[i].scale.x * 0.55;
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS.mintBright,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    // Intentionally much thicker than the inter-vehicle links.
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.27, radius, 64), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cars[i].position.x, 0.074, cars[i].position.z);
    world.add(ring);
    v2xRingMats.push(mat);
    v2xCarDistances.push(Math.hypot(cars[i].position.x - cars[0].position.x, cars[i].position.z - cars[0].position.z));
  }
  
  for (let i = 1; i <= 5; i++) {
    const target = new THREE.Vector3(cars[i].position.x, 0.075, cars[i].position.z);
    const link = makeGroundLink(ego, target);
    v2xMats.push(link.mat);
    v2xLinkCurves.push(link.curve);
  }
  // Cooperative perception links are flatter / lower than full V2X arcs.
  const copMats = [];
  for (let i = 1; i <= 3; i++) {
    const a = new THREE.Vector3(cars[0].position.x, 1.5, cars[0].position.z);
    const b = new THREE.Vector3(cars[i].position.x, 1.5, cars[i].position.z);
    const mid = a.clone().lerp(b, .5); mid.y += 1.4;
    const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 40, .055, 8, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xa1ffd0, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    world.add(mesh); copMats.push(mat);
  }
  
  // Stage 04: one soft synchronization wave moves across the ground.
  // It does not add another network graph; it activates the existing ground graph as it passes.
  const syncWaveMat = new THREE.MeshBasicMaterial({
    color: 0xaaffd2,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const syncWave = new THREE.Mesh(new THREE.RingGeometry(0.965, 1.0, 128), syncWaveMat);
  syncWave.rotation.x = -Math.PI / 2;
  syncWave.position.set(cars[0].position.x, 0.09, cars[0].position.z);
  syncWave.visible = false;
  world.add(syncWave);
  
  // Small data pulses travel along the final ground links on stage 04.
  const dataPulseGroup = new THREE.Group();
  world.add(dataPulseGroup);
  const dataPulses = [];
  for (let i = 0; i < v2xLinkCurves.length; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xd7ffeb, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), mat);
    pulse.visible = false;
    dataPulseGroup.add(pulse);
    dataPulses.push({ mesh: pulse, mat, curve: v2xLinkCurves[i], phase: i * 0.17 });
  }
  
  // Glow nodes above cars.
  const nodeGroup = new THREE.Group();
  world.add(nodeGroup);
  const nodeMats = [];
  for (let i = 0; i < 6; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.mintBright, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 16), mat);
    mesh.position.set(cars[i].position.x, 3.0, cars[i].position.z);
    nodeGroup.add(mesh); nodeMats.push(mat);
  }
  
  const state = { ...INITIAL_SCENE_STATE };

  function setVehicleReveal(vehicle, reveal) {
    vehicle.visible = reveal > 0.001;
    const scale = vehicle.userData.baseScale * (0.94 + reveal * 0.06);
    vehicle.scale.setScalar(scale);

    vehicle.traverse(object => {
      if (!object.isMesh || !object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];

      materials.forEach(material => {
        if (material.userData.revealBaseOpacity === undefined) {
          material.userData.revealBaseOpacity = material.opacity;
          material.userData.revealBaseTransparent = material.transparent;
        }

        const shouldBeTransparent = material.userData.revealBaseTransparent || reveal < 0.999;
        if (material.transparent !== shouldBeTransparent) {
          material.transparent = shouldBeTransparent;
          material.needsUpdate = true;
        }
        material.opacity = material.userData.revealBaseOpacity * reveal;
      });
    });
  }
  
  function applyState() {
    const worldReveal = THREE.MathUtils.smoothstep(state.worldReveal, 0, 1);
    roadMat.opacity = 0.16 + worldReveal * 0.84;
    shoulderMat.opacity = worldReveal;
    markMat.opacity = worldReveal;
    reflectorMaterial.opacity = worldReveal * 0.82;
    heroGlowMat.opacity = (1 - worldReveal) * 0.16;
    cars.slice(1).forEach((car, index) => {
      const staggeredReveal = THREE.MathUtils.smoothstep(
        worldReveal,
        index * 0.018,
        0.72 + index * 0.025
      );
      setVehicleReveal(car, staggeredReveal);
    });

    lidarMat.uniforms.uOpacity.value = state.lidar * 0.88;
    lidarSensorMat.opacity = state.lidar * 0.9;
    copMats.forEach(m => m.opacity = 0);
  
    // Slide 03 wireless effect: several concentric rings around every nearby vehicle.
    wirelessCarRingMats.forEach((m, i) => {
      const ringInSet = i % 3;
      m.opacity = state.radio * (0.64 - ringInSet * 0.10);
    });
    // Slide 04 integrated graph: stronger vehicle zones + thinner ground links.
    v2xMats.forEach(m => m.opacity = state.v2x * .56);
    v2xRingMats.forEach((m, i) => m.opacity = state.v2x * (i === 0 ? 1.0 : .92));
    nodeMats.forEach(m => m.opacity = 0);
  
    camera.position.x = state.cameraX;
    camera.position.y = state.cameraY;
    camera.position.z = state.cameraZ;
    world.position.x = state.worldX;
    world.rotation.y = state.worldRotY;
    camera.lookAt(state.cameraTargetX, state.cameraTargetY, state.cameraTargetZ);
    camera.rotateZ(state.cameraRoll);
  }
  
  function updateSynchronizationWave(t) {
    const active = state.syncWave;
    if (active <= 0.001) {
      syncWave.visible = false;
      syncWaveMat.opacity = 0;
      return;
    }
  
    // One pulse every 4.4 seconds, expanding from the ego vehicle across the scene.
    const period = 4.4;
    const phase = (t % period) / period;
    const radius = 1.8 + phase * 68.0;
    syncWave.visible = true;
    syncWave.scale.setScalar(radius);
    syncWaveMat.opacity = active * Math.sin(Math.PI * phase) * 0.28;
  
    // Briefly brighten each vehicle ring when the wave reaches it.
    for (let i = 0; i < v2xRingMats.length; i++) {
      const delta = Math.abs(radius - v2xCarDistances[i]);
      const hit = Math.exp(-(delta * delta) / 2.2);
      const base = state.v2x * (i === 0 ? .98 : .88);
      v2xRingMats[i].opacity = Math.min(1, base + active * hit * .7);
    }
  
    // Each ground link receives a softer pulse based on its destination distance.
    for (let i = 0; i < v2xMats.length; i++) {
      const targetDistance = v2xCarDistances[i + 1];
      const delta = Math.abs(radius - targetDistance);
      const hit = Math.exp(-(delta * delta) / 5.0);
      v2xMats[i].opacity = Math.min(.95, state.v2x * .62 + active * hit * .32);
    }
  }
  
  function updateDataPulses(t) {
    const active = state.integrated;
    for (const pulse of dataPulses) {
      if (active <= 0.01) {
        pulse.mesh.visible = false;
        pulse.mat.opacity = 0;
        continue;
      }
      const u = (t * 0.17 + pulse.phase) % 1;
      pulse.mesh.visible = true;
      pulse.mesh.position.copy(pulse.curve.getPointAt(u));
      pulse.mat.opacity = active * (0.35 + 0.45 * Math.sin(Math.PI * u));
    }
  }

  function updateLidar(t, deltaTime) {
    const active = Math.max(state.lidar, state.detect);

    lidarOrigin.set(
      cars[0].position.x,
      cars[0].position.y + 1.62,
      cars[0].position.z
    );
    lidarSensor.position.copy(lidarOrigin);
    lidarScannerRing.position.copy(lidarOrigin);
    lidarScannerRing.scale.setScalar(1 + Math.sin(t * 4.4) * 0.08);

    if (active <= 0.001) {
      lidarWasActive = false;
      lidarSweep = 0;
      scannedVehicles.fill(false);
      detectionVisibility.fill(0);
      detectionMaterials.forEach(material => { material.opacity = 0; });
      detectionGlowMaterials.forEach(material => { material.opacity = 0; });
      lidarBeam.visible = false;
      lidarBeamMat.opacity = 0;
      return;
    }

    if (!lidarWasActive) {
      lidarWasActive = true;
      lidarSweep = 0;
      scannedVehicles.fill(false);
      detectionVisibility.fill(0);
    }

    const previousSweep = lidarSweep;
    lidarSweep = (lidarSweep + deltaTime * 0.32) % 1;
    lidarMat.uniforms.uSweep.value = lidarSweep;

    for (let i = 1; i < vehicleScanPhases.length; i++) {
      const phase = vehicleScanPhases[i];
      const wasCrossed = lidarSweep >= previousSweep
        ? phase > previousSweep && phase <= lidarSweep
        : phase > previousSweep || phase <= lidarSweep;
      if (wasCrossed) scannedVehicles[i] = true;
    }

    detectionVisibility.forEach((visibility, index) => {
      const target = index > 0 && scannedVehicles[index] ? 1 : 0;
      const nextVisibility = THREE.MathUtils.damp(
        visibility,
        target,
        9,
        deltaTime
      );
      detectionVisibility[index] = nextVisibility;
      detectionMaterials[index].opacity = state.detect
        * nextVisibility
        * (index < 6 ? 1 : 0.92);
      detectionGlowMaterials[index].opacity = state.detect
        * nextVisibility
        * (index < 6 ? 0.76 : 0.6);
    });

    const angle = -lidarHalfFov + lidarSweep * lidarHalfFov * 2;
    const beamPosition = lidarBeamGeometry.attributes.position;
    for (let beamIndex = 0; beamIndex < lidarBeamCount; beamIndex++) {
      const distanceFromCenter = Math.abs(beamIndex - lidarBeamCenter) / lidarBeamCenter;
      const beamAngle = angle + (beamIndex - lidarBeamCenter) * lidarBeamStep;
      const lateralDirection = Math.abs(Math.sin(beamAngle));
      const roadLimitedDistance = lateralDirection > 0.001 ? 16.5 / lateralDirection : 82;
      const beamDistance = Math.min(82, roadLimitedDistance) * (1 - distanceFromCenter * 0.045);
      const positionOffset = beamIndex * 2;

      beamPosition.setXYZ(
        positionOffset,
        lidarOrigin.x,
        lidarOrigin.y + (beamIndex - lidarBeamCenter) * 0.008,
        lidarOrigin.z
      );
      beamPosition.setXYZ(
        positionOffset + 1,
        lidarOrigin.x + Math.sin(beamAngle) * beamDistance,
        0.055 + distanceFromCenter * 0.025,
        lidarOrigin.z - Math.cos(beamAngle) * beamDistance
      );
    }
    beamPosition.needsUpdate = true;
    lidarBeam.visible = true;
    const beamPulse = 0.88 + Math.sin(t * 8.4) * 0.12;
    lidarBeamMat.opacity = active * 0.2 * beamPulse;
  }

  function updateWirelessGraph(t) {
    for (const link of wirelessGraphLinks) {
      const active = state.wirelessGraph;
      if (active <= 0.001) {
        link.material.opacity = 0;
        link.line.visible = false;
        continue;
      }

      const position = link.geometry.attributes.position;
      position.setXYZ(0, link.from.position.x, 1.25, link.from.position.z);
      position.setXYZ(1, link.to.position.x, 1.25, link.to.position.z);
      position.needsUpdate = true;

      const pulse = 0.5 + 0.5 * Math.sin(t * 2.25 + link.phase);
      link.material.opacity = active * (0.18 + pulse * 0.34);
      link.line.visible = true;
    }
  }
  
  let animationFrameId = 0;
  let previousFrameTime = 0;

  function updateRoadMotion(t, deltaTime) {
    const roadSpeed = 10.5;
    const loopEnd = 12;
    const loopLength = 114;

    roadFlowObjects.forEach(object => {
      object.position.z += roadSpeed * deltaTime;
      if (object.position.z > loopEnd) object.position.z -= loopLength;
    });

    cars.forEach((car, index) => {
      car.position.y = car.userData.baseY
        + Math.sin(t * 5.2 + index * 0.73) * 0.012;
    });
  }

  function render(time) {
    const t = time * .001;
    const deltaTime = previousFrameTime
      ? Math.min(t - previousFrameTime, 0.05)
      : 0;
    previousFrameTime = t;

    for (const ring of wirelessCarRings) {
      const pulse = 1 + Math.sin(t * 1.45 + ring.userData.phase) * .035;
      ring.scale.setScalar(pulse);
    }
    updateRoadMotion(t, deltaTime);
    applyState();
    updateLidar(t, deltaTime);
    updateWirelessGraph(t);
    updateSynchronizationWave(t);
    updateDataPulses(t);
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(render);
  }
  animationFrameId = requestAnimationFrame(render);

  function resize() {
    const { width, height } = getViewportSize();
    const pixelRatio = getPixelRatio();

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    lidarMat.uniforms.uPixelRatio.value = pixelRatio;
    camera.aspect = width / height;
    camera.fov = width < 600 ? 56 : width < 850 ? 50 : 42;
    camera.updateProjectionMatrix();
  }

  function destroy() {
    cancelAnimationFrame(animationFrameId);
    scene.traverse(object => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach(material => material.dispose());
    });
    renderer.dispose();
  }

  return { state, resize, destroy, ready: vehiclesReady };
}
