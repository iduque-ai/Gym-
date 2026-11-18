import * as THREE from 'three';

/**
 * Generates a high-detail biomechanical calibration gym floor texture (SRGBColorSpace).
 */
export function createGymFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base deep rubber slate
  ctx.fillStyle = '#0d1320';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle EPDM rubber speckles
  for (let i = 0; i < 4200; i++) {
    const x = (i * 73) % 1024;
    const y = (i * 139) % 1024;
    const size = (i % 3) + 1;
    ctx.fillStyle = i % 7 === 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(148, 163, 184, 0.06)';
    ctx.fillRect(x, y, size, size);
  }

  // Sub-grid (10cm intervals)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
  ctx.lineWidth = 1;
  const stepMinor = 64;
  for (let i = 0; i <= 1024; i += stepMinor) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Major tile seams (50cm intervals)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 2.5;
  const stepMajor = 256;
  for (let i = 0; i <= 1024; i += stepMajor) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();

    // Crosshair calibration ticks at intersections
    for (let j = 0; j <= 1024; j += stepMajor) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i - 10, j);
      ctx.lineTo(i + 10, j);
      ctx.moveTo(i, j - 10);
      ctx.lineTo(i, j + 10);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a linear grayscale micro-relief bump/roughness texture for gym rubber & upholstery.
 */
export function createRubberBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 2) {
    for (let x = 0; x < 256; x += 2) {
      const n = ((x * 37 + y * 91) % 50) + 100;
      ctx.fillStyle = `rgb(${n},${n},${n})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a linear diamond-knurling bump map for Olympic barbell shafts and dumbbell handles.
 */
export function createKnurlingBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#707070';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 2;
  const step = 16;
  for (let i = -256; i < 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i + 256, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates an Oak/Maple lifting platform center wood grain texture with biomechanical stance markings.
 */
export function createPlatformWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark smoked walnut/maple base so it harmonizes with the dark athletic lab
  ctx.fillStyle = '#1e1916';
  ctx.fillRect(0, 0, 1024, 1024);

  // Plank vertical dividers
  const plankCount = 16;
  const plankWidth = 1024 / plankCount;
  for (let p = 0; p < plankCount; p++) {
    const x0 = p * plankWidth;
    ctx.fillStyle = p % 2 === 0 ? 'rgba(255, 210, 160, 0.03)' : 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(x0, 0, plankWidth, 1024);

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0, 1024);
    ctx.stroke();
  }

  // Biomechanical foot-stance and center-of-mass calibration dial
  const cx = 512;
  const cy = 512;

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 340, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(cx, cy, 240, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Mid-foot coronal axis line (barbell vertical plumb projection)
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 380, cy);
  ctx.lineTo(cx + 380, cy);
  ctx.stroke();

  // Sagittal symmetry line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 380);
  ctx.lineTo(cx, cy + 380);
  ctx.stroke();

  // Stance width markers
  ctx.fillStyle = 'rgba(248, 250, 252, 0.55)';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EJE SAGITAL 0°', cx, cy - 352);
  ctx.fillText('PLOMADA MEDIOPIÉ', cx + 235, cy - 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a soft radial contact shadow texture to ground 3D equipment and athlete feet.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
