const elements = {
  dataset: document.querySelector("#dataset"),
  play: document.querySelector("#play"),
  stop: document.querySelector("#stop"),
  frameSlider: document.querySelector("#frame-slider"),
  frameLabel: document.querySelector("#frame-label"),
  patternOverlay: document.querySelector("#pattern-overlay"),
  visualizer: document.querySelector(".visualizer"),
  controls: document.querySelector(".controls"),
  detectorWrap: document.querySelector(".detector-wrap"),
  frameControl: document.querySelector(".frame-slider"),
  status: document.querySelector("#status"),
  audioStatus: document.querySelector("#audio-status"),
  error: document.querySelector("#error"),
  detector: document.querySelector("#detector"),
  detectorTooltip: document.querySelector("#detector-tooltip"),
};

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
const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const defaultQuietThreshold = 0.28;
const quietThresholds = new Map();
const instrumentRows = [
  {
    label: "Keys / synth",
    blockRow: 0,
    tracks: [
      ["keys_chord_left", "Chord L"],
      ["keys_melody_left", "Melody L"],
      ["keys_melody_right", "Melody R"],
      ["keys_chord_right", "Chord R"],
    ],
  },
  {
    label: "Drums",
    blockRow: 1,
    tracks: [
      ["drum_kick_left", "Kick L"],
      ["drum_snare", "Snare"],
      ["drum_tom", "Tom"],
      ["drum_kick_right", "Kick R"],
    ],
  },
  {
    label: "Bass",
    blockRow: 2,
    tracks: [
      ["bass_left", "Bass L"],
      ["bass_run_left", "Run L"],
      ["bass_run_right", "Run R"],
      ["bass_right", "Bass R"],
    ],
  },
  {
    label: "Percussion",
    blockRow: 3,
    tracks: [
      ["perc_shaker_left", "Shaker L"],
      ["perc_tom", "Tom"],
      ["perc_clave", "Rimshot"],
      ["perc_shaker_right", "Shaker R"],
    ],
  },
];
const patternTemplate = `setcps(0.5)

// Keys / synth
$: note("{{keys_chord_left.pattern}}").s("triangle").gain({{keys_chord_left.volume}}).room({{keys_chord_left.reverb}}).delay({{keys_chord_left.delay}}).pan({{keys_chord_left.pan}})
$: note("{{keys_melody_left.pattern}}").s("sine").gain({{keys_melody_left.volume}}).room({{keys_melody_left.reverb}}).delay({{keys_melody_left.delay}}).pan({{keys_melody_left.pan}})
$: note("{{keys_melody_right.pattern}}").s("sine").gain({{keys_melody_right.volume}}).room({{keys_melody_right.reverb}}).delay({{keys_melody_right.delay}}).pan({{keys_melody_right.pan}})
$: note("{{keys_chord_right.pattern}}").s("triangle").gain({{keys_chord_right.volume}}).room({{keys_chord_right.reverb}}).delay({{keys_chord_right.delay}}).pan({{keys_chord_right.pan}})

// Drums
$: stack(s("{{drum_kick_left.pattern}}").speed(0.82), s("hh*8").gain(0.22)).gain({{drum_kick_left.volume}}).room({{drum_kick_left.reverb}}).delay({{drum_kick_left.delay}}).pan({{drum_kick_left.pan}})
$: s("{{drum_snare.pattern}}").gain({{drum_snare.volume}}).room({{drum_snare.reverb}}).delay({{drum_snare.delay}}).pan({{drum_snare.pan}})
$: s("{{drum_tom.pattern}}").gain({{drum_tom.volume}}).room({{drum_tom.reverb}}).delay({{drum_tom.delay}}).pan({{drum_tom.pan}})
$: stack(s("{{drum_kick_right.pattern}}").speed(1.16), s("hh*8").gain(0.22)).gain({{drum_kick_right.volume}}).room({{drum_kick_right.reverb}}).delay({{drum_kick_right.delay}}).pan({{drum_kick_right.pan}})

// Bass
$: note("{{bass_left.pattern}}").s("sawtooth").lpf(180).gain({{bass_left.volume}}).room({{bass_left.reverb}}).delay({{bass_left.delay}}).pan({{bass_left.pan}})
$: note("{{bass_run_left.pattern}}").s("triangle").lpf(520).gain({{bass_run_left.volume}}).room({{bass_run_left.reverb}}).delay({{bass_run_left.delay}}).pan({{bass_run_left.pan}})
$: note("{{bass_run_right.pattern}}").s("triangle").lpf(520).gain({{bass_run_right.volume}}).room({{bass_run_right.reverb}}).delay({{bass_run_right.delay}}).pan({{bass_run_right.pan}})
$: note("{{bass_right.pattern}}").s("sawtooth").lpf(180).gain({{bass_right.volume}}).room({{bass_right.reverb}}).delay({{bass_right.delay}}).pan({{bass_right.pan}})

// Percussion
$: s("{{perc_shaker_left.pattern}}").gain({{perc_shaker_left.volume}}).room({{perc_shaker_left.reverb}}).delay({{perc_shaker_left.delay}}).pan({{perc_shaker_left.pan}})
$: s("{{perc_tom.pattern}}").gain({{perc_tom.volume}}).room({{perc_tom.reverb}}).delay({{perc_tom.delay}}).pan({{perc_tom.pan}})
$: s("{{perc_clave.pattern}}").gain({{perc_clave.volume}}).room({{perc_clave.reverb}}).delay({{perc_clave.delay}}).pan({{perc_clave.pan}})
$: s("{{perc_shaker_right.pattern}}").gain({{perc_shaker_right.volume}}).room({{perc_shaker_right.reverb}}).delay({{perc_shaker_right.delay}}).pan({{perc_shaker_right.pan}})`;
const patternModes = {
  keys_chord_left: {
    quiet: "c5 ~ [eb5 g5] ~ bb5 ~ [g5 eb5] ~",
    full: "<[c3,eb3,g3,bb3] ~ [f3,ab3,c4,eb4] ~>",
  },
  keys_chord_right: {
    quiet: "g5 ~ [bb5 c6] ~ eb6 ~ [c6 bb5] ~",
    full: "<[g3,bb3,c4,eb4] ~ [c4,eb4,f4,ab4] ~>",
  },
  keys_melody_left: {
    quiet: "c5 [~ eb5] ~ [g5 bb5] ~ eb5 ~ [c5 g5]",
    full: "c4 eb4 g4 bb4",
  },
  keys_melody_right: {
    quiet: "g5 [~ bb5] ~ [c6 eb6] ~ bb5 ~ [g5 c6]",
    full: "g4 bb4 c5 eb5",
  },
  drum_kick_left: {
    quiet: "bd [~ bd] ~ ~",
    full: "bd*4",
  },
  drum_kick_right: {
    quiet: "bd [~ bd] ~ ~",
    full: "bd*4",
  },
  drum_snare: {
    quiet: "~ ~ sd ~",
    full: "~ sd ~ sd",
  },
  drum_tom: {
    quiet: "~ ~ ~ lt",
    full: "~ ~ lt [~ lt]",
  },
  bass_left: {
    quiet: "c2 ~ ~ c2",
    full: "c2 ~ c2 ~",
  },
  bass_right: {
    quiet: "c2 ~ ~ c2",
    full: "c2 ~ c2 ~",
  },
  bass_run_left: {
    quiet: "~ [g3 eb3] ~ c3",
    full: "c3 eb3 g3 bb3",
  },
  bass_run_right: {
    quiet: "~ [bb3 g3] ~ eb3",
    full: "g3 bb3 c4 eb4",
  },
  perc_shaker_left: {
    quiet: "hh*4",
    full: "hh*8",
  },
  perc_shaker_right: {
    quiet: "hh*4",
    full: "hh*8",
  },
  perc_tom: {
    quiet: "~ ~ lt ~",
    full: "~ lt ~ [lt lt]",
  },
  perc_clave: {
    quiet: "~ rs ~ ~",
    full: "~ rs ~ rs",
  },
};
const frameIntervalMs = 100;
const interactiveControls = [elements.dataset, elements.play, elements.stop, elements.frameSlider, elements.patternOverlay];
for (const control of interactiveControls) control.disabled = true;

let dataset;
let samples;
let frameCount = 0;
let width = 0;
let height = 0;
let frameIndex = 0;
let playbackTimer;
let showPatternOverlay = false;
let strudel;
let strudelLoadPromise;
let strudelActive = false;
let strudelStarting = false;
let strudelUpdateTimer;
let strudelInitPromise;
let strudelLastUpdate = "";
let strudelLastErrorTemplate = "";
let strudelApplying = false;

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
  sizeDetector();
}

function clearError() {
  elements.error.textContent = "";
  elements.error.hidden = true;
  sizeDetector();
}

function sizeDetector() {
  const reservedRows = [
    elements.controls,
    elements.frameControl,
    elements.status,
    elements.audioStatus,
  ];
  if (!elements.error.hidden) reservedRows.push(elements.error);
  const rowGap = Number.parseFloat(getComputedStyle(elements.visualizer).rowGap);
  const reservedHeight = reservedRows.reduce((total, row) => total + row.offsetHeight, 0)
    + rowGap * reservedRows.length;
  const availableHeight = Math.max(0, elements.visualizer.clientHeight - reservedHeight);
  const size = Math.floor(Math.min(elements.visualizer.clientWidth, 920, availableHeight));
  const width = `${size}px`;
  if (elements.detectorWrap.style.width !== width) elements.detectorWrap.style.width = width;
}

function sampleAt(frame, y, x) {
  return samples[frame * width * height + y * width + x];
}

function prepareCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const logicalWidth = Math.max(1, Math.round(canvas.clientWidth));
  const logicalHeight = Math.max(1, Math.round(canvas.clientHeight));
  const pixelWidth = Math.round(logicalWidth * ratio);
  const pixelHeight = Math.round(logicalHeight * ratio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width: logicalWidth, height: logicalHeight };
}

function colorFor(value) {
  const span = dataset.percentile99 - dataset.percentile1;
  const amount = span > 0
    ? Math.max(0, Math.min(1, (value - dataset.percentile1) / span))
    : 0;
  const scaled = amount * (colorStops.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(colorStops.length - 1, lower + 1);
  const blend = scaled - lower;
  const channels = colorStops[lower].map((channel, index) =>
    Math.round(channel + (colorStops[upper][index] - channel) * blend));
  return `rgb(${channels.join(",")})`;
}

function normalizedLight(frame, y, x) {
  const span = dataset.percentile99 - dataset.percentile1;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (sampleAt(frame, y, x) - dataset.percentile1) / span));
}

function averageArea(frame, left, bottom, size) {
  let rawTotal = 0;
  let normalizedTotal = 0;
  for (let y = bottom; y < bottom + size; y += 1) {
    for (let x = left; x < left + size; x += 1) {
      const value = sampleAt(frame, y, x);
      rawTotal += value;
      normalizedTotal += normalizedLight(frame, y, x);
    }
  }
  const sampleCount = size * size;
  return {
    raw: rawTotal / sampleCount,
    normalized: normalizedTotal / sampleCount,
  };
}

function patternControlValues(frame) {
  const values = {};
  instrumentRows.forEach((row) => {
    row.tracks.forEach(([id], columnIndex) => {
      const blockBottom = height - (row.blockRow + 1) * 4;
      const blockLeft = columnIndex * 4;
      const blockAverage = averageArea(frame, blockLeft, blockBottom, 4);
      const reverb = averageArea(frame, blockLeft, blockBottom + 2, 2).normalized;
      const volume = averageArea(frame, blockLeft + 2, blockBottom + 2, 2).normalized;
      const delay = averageArea(frame, blockLeft, blockBottom, 2).normalized;
      const threshold = quietThresholds.get(id) ?? defaultQuietThreshold;
      const quiet = blockAverage.normalized < threshold;
      const volumeScale = id === "drum_snare" ? 0.15 : 1;
      values[id] = {
        average: blockAverage.raw,
        normalizedAverage: blockAverage.normalized,
        quiet,
        threshold,
        reverb: reverb * 0.5,
        volume: (0.05 + volume * 0.95) * (quiet ? 0.18 : 1) * volumeScale,
        delay: delay * 0.5,
        pan: [0.05, 0.35, 0.65, 0.95][columnIndex],
        pattern: patternModes[id][quiet ? "quiet" : "full"],
      };
    });
  });
  return values;
}

function getEvaluatedStrudelCode() {
  const controls = patternControlValues(frameIndex);
  const code = patternTemplate.replace(
    /\{\{([a-z_]+)\.(volume|reverb|delay|pan|pattern)\}\}/g,
    (placeholder, track, parameter) => {
      const value = controls[track]?.[parameter];
      if (value === undefined) {
        throw new Error(`Unknown Strudel control placeholder: ${placeholder}`);
      }
      return parameter === "pattern" ? value : value.toFixed(3);
    },
  );
  const invalidPlaceholder = code.match(/\{\{[^}]*\}\}/);
  if (invalidPlaceholder) {
    throw new Error(`Unrecognized Strudel control placeholder: ${invalidPlaceholder[0]}`);
  }
  return code;
}

async function applyStrudelCode() {
  if (!strudel || !strudelActive) return;
  const code = getEvaluatedStrudelCode();
  if (code === strudelLastUpdate || strudelLastErrorTemplate === code || strudelApplying) return;
  strudelApplying = true;
  try {
    await strudel.transpiler(code);
    await strudel.evaluate(code, true);
    strudelLastUpdate = code;
    strudelLastErrorTemplate = "";
  } catch (error) {
    strudelLastErrorTemplate = code;
    throw error;
  } finally {
    strudelApplying = false;
  }
}

async function preloadStrudel() {
  if (!strudelLoadPromise) {
    strudelLoadPromise = import("https://esm.sh/@strudel/web@1.3.0");
  }
  try {
    strudel = await strudelLoadPromise;
    return strudel;
  } catch (error) {
    strudelLoadPromise = undefined;
    throw error;
  }
}

async function startStrudel() {
  if (strudelActive || strudelStarting) return;
  clearError();
  strudelStarting = true;
  elements.audioStatus.textContent = "Loading Strudel and drum samples…";
  try {
    if (!strudel) await preloadStrudel();
    if (playbackTimer === undefined) return;
    if (!strudelInitPromise) {
      strudelInitPromise = strudel.initStrudel({
        prebake: () => strudel.samples("github:tidalcycles/dirt-samples"),
      });
    }
    await strudelInitPromise;
    if (playbackTimer === undefined) return;
    strudelActive = true;
    strudelLastUpdate = "";
    strudelLastErrorTemplate = "";
    await applyStrudelCode();
    strudelUpdateTimer = window.setInterval(() => {
      applyStrudelCode().catch((error) => {
        showError(error instanceof Error ? error.message : String(error));
      });
    }, 500);
    elements.audioStatus.textContent = "Audio playing with the detector animation.";
  } catch (error) {
    if (strudelActive && strudel) strudel.hush();
    if (!strudelActive) strudelInitPromise = undefined;
    strudelActive = false;
    elements.audioStatus.textContent = "Could not start audio.";
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    strudelStarting = false;
  }
}

function stopStrudel() {
  if (strudelUpdateTimer !== undefined) {
    window.clearInterval(strudelUpdateTimer);
    strudelUpdateTimer = undefined;
  }
  if (strudel && strudelActive) strudel.hush();
  strudelActive = false;
  strudelLastUpdate = "";
  strudelLastErrorTemplate = "";
  elements.audioStatus.textContent = "Audio stopped.";
}

function drawHeatmap() {
  const { context: ctx, width: canvasWidth, height: canvasHeight } = prepareCanvas(elements.detector);
  const cellSize = Math.min(canvasWidth / width, canvasHeight / height);
  const left = (canvasWidth - cellSize * width) / 2;
  const top = (canvasHeight - cellSize * height) / 2;
  const plotSize = cellSize * width;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#111923";
  ctx.fillRect(left, top, plotSize, plotSize);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      ctx.fillStyle = colorFor(sampleAt(frameIndex, y, x));
      ctx.fillRect(left + x * cellSize, top + (height - 1 - y) * cellSize, cellSize, cellSize);
    }
  }

  if (showPatternOverlay) drawPatternOverlay(ctx, left, top, cellSize);

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
  ctx.lineWidth = Math.max(0.5, cellSize * 0.025);
  for (let x = 0; x <= width; x += 1) {
    const position = left + x * cellSize;
    ctx.beginPath();
    ctx.moveTo(position, top);
    ctx.lineTo(position, top + plotSize);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 1) {
    const position = top + y * cellSize;
    ctx.beginPath();
    ctx.moveTo(left, position);
    ctx.lineTo(left + plotSize, position);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = Math.max(1, cellSize * 0.06);
  for (let block = 0; block <= width; block += 4) {
    const x = left + block * cellSize;
    const y = top + block * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + plotSize);
    ctx.moveTo(left, y);
    ctx.lineTo(left + plotSize, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPatternOverlay(ctx, left, top, cellSize) {
  const blockSize = cellSize * 4;
  const fontSize = Math.max(7, Math.min(13, blockSize * 0.075));
  const values = patternControlValues(frameIndex);
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  instrumentRows.forEach((row) => {
    row.tracks.forEach(([id, label], column) => {
      const controls = values[id];
      const x = left + column * blockSize;
      const y = top + row.blockRow * blockSize;
      const padding = Math.max(3, blockSize * 0.06);
      ctx.fillStyle = controls.quiet ? "rgba(112, 67, 31, 0.66)" : "rgba(12, 88, 78, 0.54)";
      ctx.fillRect(x, y, blockSize, blockSize);
      ctx.strokeStyle = controls.quiet ? "#f2bd6b" : "#5eead4";
      ctx.lineWidth = Math.max(1, blockSize * 0.012);
      ctx.strokeRect(x + 1, y + 1, blockSize - 2, blockSize - 2);

      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.fillText(label, x + padding, y + padding, blockSize - padding * 2);
      ctx.fillStyle = controls.quiet ? "#ffe0ad" : "#c8fff4";
      ctx.font = `${fontSize * 0.88}px system-ui, sans-serif`;
      const lineHeight = fontSize * 1.2;
      const lines = [
        controls.quiet ? "Low energy" : "High energy",
        `Vol ${Math.round(controls.volume * 100)}%`,
        `Reverb ${Math.round(controls.reverb * 100)}%`,
        `Delay ${Math.round(controls.delay * 100)}%`,
      ];
      lines.forEach((line, index) => {
        ctx.fillText(line, x + padding, y + padding + fontSize * 1.25 + index * lineHeight, blockSize - padding * 2);
      });
    });
  });
  ctx.restore();
}

function render() {
  if (!samples) return;
  elements.frameSlider.value = String(frameIndex);
  elements.frameLabel.textContent = `Frame ${frameIndex + 1} / ${frameCount.toLocaleString()}`;
  elements.status.textContent = `${frameCount.toLocaleString()} frames · ${width} × ${height}`;
  drawHeatmap();
}

function setFrame(frame) {
  if (!Number.isFinite(frame)) return;
  frameIndex = Math.max(0, Math.min(frameCount - 1, Math.trunc(frame)));
  render();
}

function advanceFrame() {
  frameIndex = (frameIndex + 1) % frameCount;
  render();
}

function schedulePlayback() {
  playbackTimer = window.setInterval(advanceFrame, frameIntervalMs);
}

function detectorCellFromEvent(event) {
  const bounds = elements.detector.getBoundingClientRect();
  const cellSize = Math.min(bounds.width / width, bounds.height / height);
  const left = (bounds.width - cellSize * width) / 2;
  const top = (bounds.height - cellSize * height) / 2;
  const x = Math.floor((event.clientX - bounds.left - left) / cellSize);
  const displayY = Math.floor((event.clientY - bounds.top - top) / cellSize);
  const y = height - 1 - displayY;
  if (x < 0 || x >= width || y < 0 || y >= height) return undefined;
  return { x, y, cellSize, left, top };
}

function showDetectorTooltip(event) {
  const cell = detectorCellFromEvent(event);
  if (!cell) {
    elements.detectorTooltip.hidden = true;
    return;
  }
  const blockRow = Math.floor((height - 1 - cell.y) / 4);
  const blockColumn = Math.floor(cell.x / 4);
  const instrument = instrumentRows.find((row) => row.blockRow === blockRow);
  if (!instrument) {
    elements.detectorTooltip.textContent = `Pixel x=${cell.x}, y=${cell.y} · no instrument assigned`;
  } else {
    const [trackId, trackLabel] = instrument.tracks[blockColumn];
    const controls = patternControlValues(frameIndex)[trackId];
    elements.detectorTooltip.textContent =
      `${instrument.label} · ${trackLabel} · block mean ${controls.average.toPrecision(5)} photons · ${controls.quiet ? "quiet" : "full"} pattern · threshold ${Math.round(controls.threshold * 100)}%`;
  }
  const wrapperBounds = elements.detectorTooltip.parentElement.getBoundingClientRect();
  const cellCenterX = cell.left + (blockColumn * 4 + 2) * cell.cellSize;
  const cellCenterY = cell.top + (blockRow * 4 + 2) * cell.cellSize;
  elements.detectorTooltip.style.left =
    `${Math.max(4, Math.min(wrapperBounds.width - 260, cellCenterX))}px`;
  elements.detectorTooltip.style.top = `${Math.max(4, cellCenterY)}px`;
  elements.detectorTooltip.hidden = false;
}

function stopPlayback() {
  if (playbackTimer !== undefined) {
    window.clearInterval(playbackTimer);
    playbackTimer = undefined;
  }
  elements.play.disabled = !samples;
  elements.stop.disabled = true;
  stopStrudel();
}

function startPlayback() {
  if (!samples || playbackTimer !== undefined) return;
  if (frameIndex >= frameCount - 1) frameIndex = 0;
  render();
  schedulePlayback();
  elements.play.disabled = true;
  elements.stop.disabled = false;
  startStrudel();
}

function loadSamples(buffer, metadata) {
  if (buffer.byteLength !== metadata.byteLength) {
    throw new Error(
      `Binary data size mismatch for ${metadata.label}: expected ${metadata.byteLength} bytes, got ${buffer.byteLength}.`,
    );
  }
  if (buffer.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) {
    throw new Error(`Binary data for ${metadata.label} is not aligned to float32 samples.`);
  }
  if (littleEndian) return new Float32Array(buffer);
  const view = new DataView(buffer);
  const result = new Float32Array(buffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
  for (let index = 0; index < result.length; index += 1) {
    result[index] = view.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true);
  }
  return result;
}

async function loadDataset(metadata) {
  stopPlayback();
  clearError();
  elements.status.textContent = `Loading ${metadata.label}…`;
  const response = await fetch(metadata.dataFile);
  if (!response.ok) {
    throw new Error(`Could not load ${metadata.dataFile} (HTTP ${response.status}).`);
  }
  const buffer = await response.arrayBuffer();
  const nextSamples = loadSamples(buffer, metadata);
  if (metadata.shape.length !== 3 || metadata.shape[1] !== 16 || metadata.shape[2] !== 16) {
    throw new Error(`Expected [frames, 16, 16] data; received [${metadata.shape.join(", ")}].`);
  }
  if (nextSamples.length !== metadata.shape[0] * metadata.shape[1] * metadata.shape[2]) {
    throw new Error(`Sample count does not match the manifest for ${metadata.label}.`);
  }

  dataset = metadata;
  samples = nextSamples;
  [frameCount, height, width] = metadata.shape;
  frameIndex = 0;
  elements.frameSlider.max = String(frameCount - 1);
  for (const control of interactiveControls) control.disabled = false;
  elements.stop.disabled = true;
  elements.audioStatus.textContent = "Audio ready · press Play to begin.";
  render();
  sizeDetector();
}

function configureEvents() {
  elements.dataset.addEventListener("change", async () => {
    const metadata = JSON.parse(elements.dataset.selectedOptions[0].dataset.metadata);
    try {
      await loadDataset(metadata);
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
      elements.status.textContent = "Dataset could not be loaded.";
    }
  });
  elements.play.addEventListener("click", startPlayback);
  elements.stop.addEventListener("click", stopPlayback);
  elements.frameSlider.addEventListener("input", () => {
    setFrame(Number(elements.frameSlider.value));
    if (strudelActive) {
      applyStrudelCode().catch((error) => {
        showError(error instanceof Error ? error.message : String(error));
      });
    }
  });
  elements.patternOverlay.addEventListener("click", () => {
    showPatternOverlay = !showPatternOverlay;
    elements.patternOverlay.setAttribute("aria-pressed", String(showPatternOverlay));
    elements.patternOverlay.textContent = showPatternOverlay ? "Hide pattern controls" : "Show pattern controls";
    drawHeatmap();
  });
  elements.detector.addEventListener("pointermove", showDetectorTooltip);
  elements.detector.addEventListener("mouseleave", () => {
    elements.detectorTooltip.hidden = true;
  });
  window.addEventListener("resize", () => {
    sizeDetector();
    render();
  });
}

async function initialize() {
  configureEvents();
  sizeDetector();
  try {
    const response = await fetch("data/manifest.json");
    if (!response.ok) throw new Error(`Could not load data/manifest.json (HTTP ${response.status}).`);
    const manifest = await response.json();
    if (!Array.isArray(manifest.datasets) || manifest.datasets.length === 0) {
      throw new Error("The dataset manifest does not contain any datasets.");
    }
    for (const metadata of manifest.datasets) {
      const option = document.createElement("option");
      option.value = metadata.id;
      option.textContent = metadata.id.toLowerCase().includes("meteor") ? "Meteor" : "Space debris";
      option.dataset.metadata = JSON.stringify(metadata);
      elements.dataset.append(option);
    }
    await loadDataset(manifest.datasets[0]);
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
    elements.status.textContent = "Could not initialize the data explorer.";
  }
}

initialize();
