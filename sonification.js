const datasetId = "L1__2026_07_06__13_42_41__LED155V_lensreduction_rotation_10min_WORKING_mediana.npy";
const gridSize = 16;
const datasetDurationMs = 10 * 60 * 1000;
const threshold = 0.3;
const maxPitchShiftCents = 24;
const colorStops = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 73, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [108, 206, 90],
  [182, 222, 43],
  [253, 231, 37],
];
const voices = [
  { name: "C3", frequency: 130.8128, left: 0, bottom: 8, x: -0.75, y: 0.25, z: -0.55 },
  { name: "G3", frequency: 195.9977, left: 8, bottom: 8, x: 0.75, y: 0.25, z: -0.55 },
  { name: "C4", frequency: 261.6256, left: 0, bottom: 0, x: -0.75, y: -0.25, z: -0.55 },
  { name: "G4", frequency: 391.9954, left: 8, bottom: 0, x: 0.75, y: -0.25, z: -0.55 },
];
const canvas = document.querySelector("#detector");
const playButton = document.querySelector("#play");
const stopButton = document.querySelector("#stop");
const status = document.querySelector("#status");
const errorMessage = document.querySelector("#error");
const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

let samples;
let frameCount = 0;
let frameIndex = 0;
let percentile1 = 0;
let percentile99 = 1;
let audioContext;
let audioVoices = [];
let playbackTimer;
let playing = false;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  status.textContent = "Could not load or play the sonification.";
}

function normalized(value) {
  const span = percentile99 - percentile1;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (value - percentile1) / span));
}

function sampleAt(frame, y, x) {
  return samples[frame * gridSize * gridSize + y * gridSize + x];
}

function averageArea(frame, left, bottom, width, height) {
  let total = 0;
  for (let y = bottom; y < bottom + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      total += normalized(sampleAt(frame, y, x));
    }
  }
  return total / (width * height);
}

function colorFor(value) {
  const scaled = normalized(value) * (colorStops.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(colorStops.length - 1, lower + 1);
  const blend = scaled - lower;
  const channels = colorStops[lower].map((channel, index) =>
    Math.round(channel + (colorStops[upper][index] - channel) * blend));
  return `rgb(${channels.join(",")})`;
}

function prepareCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const size = Math.max(1, Math.round(canvas.clientWidth));
  const pixelSize = Math.round(size * ratio);
  if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
    canvas.width = pixelSize;
    canvas.height = pixelSize;
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, size };
}

function drawFrame() {
  if (!samples) return;
  const { context: ctx, size } = prepareCanvas();
  const cellSize = size / gridSize;
  ctx.clearRect(0, 0, size, size);
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      ctx.fillStyle = colorFor(sampleAt(frameIndex, y, x));
      ctx.fillRect(x * cellSize, (gridSize - 1 - y) * cellSize, cellSize, cellSize);
    }
  }

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
  ctx.lineWidth = Math.max(0.65, size / 900);
  for (let grid = 0; grid <= gridSize; grid += 1) {
    const position = grid * cellSize;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, size);
    ctx.moveTo(0, position);
    ctx.lineTo(size, position);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(237, 242, 247, 0.9)";
  ctx.lineWidth = Math.max(1.2, size / 420);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();
  ctx.restore();
}

function voiceControls(frame, voice) {
  const lower = averageArea(frame, voice.left, voice.bottom, 8, 4);
  const upper = averageArea(frame, voice.left, voice.bottom + 4, 8, 4);
  const mean = (upper + lower) / 2;
  const upward = Math.max(0, (upper - threshold) / (1 - threshold));
  const downward = Math.max(0, (lower - threshold) / (1 - threshold));
  const cents = (upward - downward) * maxPitchShiftCents;
  return {
    frequency: voice.frequency * 2 ** (cents / 1200),
    gain: mean * 0.12,
  };
}

function updateAudio(frame) {
  if (!audioContext || !audioVoices.length) return;
  const now = audioContext.currentTime;
  voices.forEach((voice, index) => {
    const controls = voiceControls(frame, voice);
    const { oscillator, gain } = audioVoices[index];
    oscillator.frequency.setTargetAtTime(controls.frequency, now, 0.08);
    gain.gain.setTargetAtTime(controls.gain, now, 0.08);
  });
}

function createAudio() {
  audioContext = new AudioContext();
  audioVoices = voices.map((voice) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const panner = audioContext.createPanner();
    oscillator.type = "sine";
    oscillator.frequency.value = voice.frequency;
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1;
    panner.maxDistance = 1;
    panner.rolloffFactor = 0;
    panner.positionX.value = voice.x;
    panner.positionY.value = voice.y;
    panner.positionZ.value = voice.z;
    gain.gain.value = 0;
    oscillator.connect(gain).connect(panner).connect(audioContext.destination);
    oscillator.start();
    return { oscillator, gain };
  });
  updateAudio(frameIndex);
}

function advanceFrame() {
  frameIndex = (frameIndex + 1) % frameCount;
  drawFrame();
  updateAudio(frameIndex);
  status.textContent = `Frame ${frameIndex + 1} of ${frameCount.toLocaleString()}`;
}

async function startPlayback() {
  if (playing) return;
  errorMessage.hidden = true;
  playButton.disabled = true;
  try {
    if (!audioContext) createAudio();
    await audioContext.resume();
    playing = true;
    updateAudio(frameIndex);
    playbackTimer = window.setInterval(advanceFrame, datasetDurationMs / frameCount);
    stopButton.disabled = false;
    status.textContent = `Playing · frame ${frameIndex + 1} of ${frameCount.toLocaleString()}`;
  } catch (error) {
    stopPlayback();
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    playButton.disabled = false;
  }
}

function stopPlayback() {
  if (playbackTimer !== undefined) {
    window.clearInterval(playbackTimer);
    playbackTimer = undefined;
  }
  playing = false;
  if (audioContext && audioVoices.length) {
    const now = audioContext.currentTime;
    for (const { gain } of audioVoices) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.035);
    }
  }
  stopButton.disabled = true;
  playButton.disabled = !samples;
  if (samples && !errorMessage.hidden) return;
  if (samples) status.textContent = `Stopped · frame ${frameIndex + 1} of ${frameCount.toLocaleString()}`;
}

function loadSamples(buffer, metadata) {
  if (buffer.byteLength !== metadata.byteLength) {
    throw new Error(
      `Binary data size mismatch: expected ${metadata.byteLength} bytes, got ${buffer.byteLength}.`,
    );
  }
  if (buffer.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) {
    throw new Error("Dataset is not aligned to float32 samples.");
  }
  if (littleEndian) return new Float32Array(buffer);
  const view = new DataView(buffer);
  const result = new Float32Array(buffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
  for (let index = 0; index < result.length; index += 1) {
    result[index] = view.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true);
  }
  return result;
}

async function initialize() {
  try {
    const manifestResponse = await fetch("data/manifest.json");
    if (!manifestResponse.ok) {
      throw new Error(`Could not load data/manifest.json (HTTP ${manifestResponse.status}).`);
    }
    const manifest = await manifestResponse.json();
    const metadata = manifest.datasets?.find((entry) => entry.id === datasetId);
    if (!metadata) throw new Error("The 10-minute dataset is missing from the manifest.");
    if (metadata.shape?.length !== 3 || metadata.shape[1] !== gridSize || metadata.shape[2] !== gridSize) {
      throw new Error(`Expected [frames, ${gridSize}, ${gridSize}] data.`);
    }
    const response = await fetch(metadata.dataFile);
    if (!response.ok) {
      throw new Error(`Could not load ${metadata.dataFile} (HTTP ${response.status}).`);
    }
    const nextSamples = loadSamples(await response.arrayBuffer(), metadata);
    frameCount = metadata.shape[0];
    if (nextSamples.length !== frameCount * gridSize * gridSize) {
      throw new Error("Sample count does not match the dataset manifest.");
    }
    samples = nextSamples;
    percentile1 = metadata.percentile1;
    percentile99 = metadata.percentile99;
    drawFrame();
    playButton.disabled = false;
    status.textContent = `${frameCount.toLocaleString()} frames · 16 × 16 grid`;
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
}

playButton.addEventListener("click", startPlayback);
stopButton.addEventListener("click", stopPlayback);
window.addEventListener("resize", drawFrame);
window.addEventListener("pagehide", stopPlayback);
initialize();
