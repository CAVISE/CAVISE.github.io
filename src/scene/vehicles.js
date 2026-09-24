import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { COLORS } from './config.js';

const MODEL_BASE = `${import.meta.env.BASE_URL}assets/models/optimized/`;
const VEHICLE_MODELS = {
  sedan: `${MODEL_BASE}generic-sedan.glb`,
  suv: `${MODEL_BASE}generic-small-suv.glb`
};

const VEHICLE_SPECS = [
  { x: 0, y: 0.1, z: -2, role: 'sedan', color: COLORS.charcoal, scale: 1, targetLength: 4.95 },
  { x: -8.1, y: 0.1, z: -13, role: 'suv', color: COLORS.charcoal, scale: 1.03, targetLength: 4.65 },
  { x: 8, y: 0.1, z: -18, role: 'sedan', color: COLORS.charcoal, scale: 0.98, targetLength: 4.7 },
  { x: -8.4, y: 0.1, z: -29, role: 'sedan', color: COLORS.charcoal, scale: 0.97, targetLength: 4.55 },
  { x: 8.3, y: 0.1, z: -35, role: 'suv', color: COLORS.charcoal, scale: 1.02, targetLength: 4.8 },
  { x: -0.25, y: 0.1, z: -45, role: 'sedan', color: COLORS.charcoal, scale: 0.98, targetLength: 4.55 },
  { x: 8.1, y: 0.1, z: -55, role: 'sedan', color: COLORS.charcoal, scale: 1, targetLength: 4.72 },
  { x: -8.2, y: 0.1, z: -61, role: 'suv', color: COLORS.charcoal, scale: 1.01, targetLength: 4.45 },
  { x: 0.25, y: 0.1, z: -70, role: 'sedan', color: COLORS.charcoal, scale: 0.97, targetLength: 4.55 }
];

const loader = new GLTFLoader();
const assetCache = new Map();

function loadAsset(url) {
  if (!assetCache.has(url)) {
    assetCache.set(url, new Promise((resolve, reject) => {
      loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
    }));
  }

  return assetCache.get(url);
}

function prepareMaterials(root) {
  root.traverse(object => {
    if (!object.isMesh) return;

    object.castShadow = true;
    object.receiveShadow = true;

    if (!object.material) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const cloned = source.map(material => {
      const nextMaterial = material.clone();
      const materialName = (nextMaterial.name || '').toLowerCase();
      const isGlass = materialName.includes('glass');
      const isTire = materialName.includes('tire') || materialName.includes('rubber');
      const isInterior = /interior|engine|chassis|bottom|plastic|grill/.test(materialName);
      const isRedLight = /red|tail/.test(materialName);
      const isFrontLight = /headlight|headligth/.test(materialName);
      const isMetal = /metal|chrome|wheel|brake/.test(materialName);

      // A controlled clay-render palette hides inconsistent or low-resolution
      // textures while preserving the model silhouette and surface normals.
      nextMaterial.map = null;
      nextMaterial.roughnessMap = null;
      nextMaterial.metalnessMap = null;
      nextMaterial.aoMap = null;

      if (nextMaterial.normalScale) {
        nextMaterial.normalScale.multiplyScalar(isGlass ? 0 : 0.45);
      }

      if (isRedLight && nextMaterial.color) {
        nextMaterial.color.setHex(0xff655c);
        if (nextMaterial.emissive) {
          nextMaterial.emissive.setHex(0x7a120e);
          nextMaterial.emissiveIntensity = 0.7;
        }
        nextMaterial.roughness = 0.32;
        nextMaterial.metalness = 0.08;
      } else if (isFrontLight && nextMaterial.color) {
        nextMaterial.color.setHex(0xdfffee);
        if (nextMaterial.emissive) {
          nextMaterial.emissive.setHex(0x4f8a70);
          nextMaterial.emissiveIntensity = 0.5;
        }
        nextMaterial.roughness = 0.25;
        nextMaterial.metalness = 0.1;
      } else if (isGlass && nextMaterial.color) {
        nextMaterial.color.setHex(0x17231f);
        nextMaterial.transparent = true;
        nextMaterial.opacity = 0.72;
        nextMaterial.depthWrite = true;
        nextMaterial.side = THREE.DoubleSide;
        nextMaterial.roughness = 0.12;
        nextMaterial.metalness = 0.04;
      } else if ((isTire || isInterior) && nextMaterial.color) {
        nextMaterial.color.setHex(0x090f0d);
        nextMaterial.roughness = 0.82;
        nextMaterial.metalness = 0.04;
      } else if (isMetal && nextMaterial.color) {
        nextMaterial.color.setHex(0x2a3832);
        nextMaterial.roughness = 0.38;
        nextMaterial.metalness = 0.55;
      } else {
        if ('roughness' in nextMaterial) nextMaterial.roughness = 0.55;
        if ('metalness' in nextMaterial) nextMaterial.metalness = 0.2;
      }

      nextMaterial.needsUpdate = true;
      return nextMaterial;
    });
    object.material = Array.isArray(object.material) ? cloned : cloned[0];
  });
}

function tintVehicle(root, color) {
  root.traverse(object => {
    if (!object.isMesh || !object.material) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      const materialName = (material.name || '').toLowerCase();
      const isBodyMaterial = materialName.includes('paint') || materialName === 'body';
      if (!isBodyMaterial) return;

      material.map = null;
      material.color.setHex(color);
      material.roughness = 0.34;
      material.metalness = 0.3;
      material.roughnessMap = null;
      material.metalnessMap = null;
      if (material.normalScale) material.normalScale.setScalar(0.7);
      material.needsUpdate = true;
    });
  });
}

function normalizeVehicle(root, targetLength) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (size.x > size.z) {
    root.rotation.y += Math.PI / 2;
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    box.getSize(size);
  }

  root.scale.multiplyScalar(targetLength / Math.max(size.z, 0.001));
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  root.position.y -= box.min.y;
}

function createVehicle({ role, color, scale, targetLength }) {
  const holder = new THREE.Group();
  const ready = loadAsset(VEHICLE_MODELS[role] || VEHICLE_MODELS.sedan)
    .then(template => {
      const model = template.clone(true);
      prepareMaterials(model);
      normalizeVehicle(model, targetLength);
      model.rotation.y += Math.PI;
      tintVehicle(model, color);
      holder.add(model);
    })
    .catch(error => {
      console.error(`Vehicle model "${role}" could not be loaded.`, error);
    });

  holder.scale.setScalar(scale);
  return { holder, ready };
}

export function addVehicles(world) {
  const entries = VEHICLE_SPECS.map(spec => {
    const { holder: vehicle, ready } = createVehicle(spec);
    vehicle.position.set(spec.x, spec.y, spec.z);
    world.add(vehicle);
    return { vehicle, ready };
  });

  return {
    cars: entries.map(entry => entry.vehicle),
    ready: Promise.all(entries.map(entry => entry.ready))
  };
}
