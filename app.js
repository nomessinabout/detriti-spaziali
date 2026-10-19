const elements = {
  dataset: document.querySelector("#dataset"),
  previous: document.querySelector("#previous"),
  play: document.querySelector("#play"),
  stop: document.querySelector("#stop"),
  next: document.querySelector("#next"),
  frameNumber: document.querySelector("#frame-number"),
  frameSlider: document.querySelector("#frame-slider"),
  startFrame: document.querySelector("#start-frame"),
  endFrame: document.querySelector("#end-frame"),
  speed: document.querySelector("#speed"),
  speedLabel: document.querySelector("#speed-label"),
  allCurves: document.querySelector("#all-curves"),
  exportAnimation: document.querySelector("#export-animation"),
  strudelStart: document.querySelector("#strudel-start"),
  strudelUpdate: document.querySelector("#strudel-update"),
  strudelStop: document.querySelector("#strudel-stop"),
  strudelStatus: document.querySelector("#strudel-status"),
  patternGrid: document.querySelector("#pattern-grid"),
  strudelCode: document.querySelector("#strudel-code"),
  status: document.querySelector("#status"),
  error: document.querySelector("#error"),
  frameTitle: document.querySelector("#frame-title"),
  pixelReadout: document.querySelector("#pixel-readout"),
  scaleMin: document.querySelector("#scale-min"),
  scaleMax: document.querySelector("#scale-max"),
  detector: document.querySelector("#detector"),
  detectorTooltip: document.querySelector("#detector-tooltip"),
  lightcurve: document.querySelector("#lightcurve"),
  allCurvesPanel: document.querySelector("#all-curves-panel"),
  allCurvesChart: document.querySelector("#all-curves-chart"),
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
const defaultQuietThreshold = 0.3;
const quietThresholds = new Map();
const instrumentRows = [
  {
    label: "Keys / synth",
    blockRow: 0,
    tracks: [
      ["keys_chord_left", "Left chord voicing"],
      ["keys_melody_left", "Left melody"],
      ["keys_melody_right", "Right melody"],
      ["keys_chord_right", "Right chord voicing"],
    ],
  },
  {
    label: "Drums",
    blockRow: 1,
    tracks: [
      ["drum_kick_left", "Low kick + hi-hat"],
      ["drum_snare", "Snare"],
      ["drum_tom", "Tom fill"],
      ["drum_kick_right", "High kick + hi-hat"],
    ],
  },
  {
    label: "Bass",
    blockRow: 2,
    tracks: [
      ["bass_left", "Left bass pulse"],
      ["bass_run_left", "Bass run 1"],
      ["bass_run_right", "Bass run 2"],
      ["bass_right", "Right bass pulse"],
    ],
  },
  {
    label: "Percussion",
    blockRow: 3,
    tracks: [
      ["perc_shaker_left", "Left shaker"],
      ["perc_tom", "Tom accents"],
      ["perc_clave", "Clave / rim"],
      ["perc_shaker_right", "Right shaker"],
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
    quiet: "sh*4",
    full: "sh*8",
  },
  perc_shaker_right: {
    quiet: "sh*4",
    full: "sh*8",
  },
  perc_tom: {
    quiet: "~ ~ lt ~",
    full: "~ lt ~ [lt lt]",
  },
  perc_clave: {
    quiet: "~ rim ~ ~",
    full: "~ rim ~ rim",
  },
};
const interactiveControls = [
  elements.dataset,
  elements.previous,
  elements.play,
  elements.stop,
  elements.next,
  elements.frameNumber,
  elements.frameSlider,
  elements.startFrame,
  elements.endFrame,
  elements.speed,
  elements.allCurves,
  elements.exportAnimation,
  elements.strudelStart,
  elements.strudelUpdate,
  elements.strudelStop,
];
for (const control of interactiveControls) control.disabled = true;

let dataset;
let samples;
let frameCount = 0;
let width = 0;
let height = 0;
let frameIndex = 0;
let rangeStart = 0;
let rangeEnd = 0;
let selectedPixel = { x: 8, y: 8 };
let selectedLightcurve = [];
let lightcurveBounds = { min: 0, max: 1 };
let playbackTimer;
let showAllCurves = false;
let strudel;
let strudelLoadPromise;
let strudelLoadFailed = false;
let strudelActive = false;
let strudelUpdateTimer;
let strudelEditTimer;
let strudelInitPromise;
let strudelLastUpdate = "";
let strudelLastErrorTemplate = "";
let strudelApplying = false;

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function clearError() {
  elements.error.textContent = "";
  elements.error.hidden = true;
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

function buildPatternGrid() {
  elements.patternGrid.replaceChildren();
  instrumentRows.forEach((row) => {
    const rowElement = document.createElement("section");
    rowElement.className = "instrument-row";
    const heading = document.createElement("h3");
    heading.className = "instrument-heading";
    heading.textContent = row.label;
    rowElement.append(heading);

    const tracksElement = document.createElement("div");
    tracksElement.className = "pattern-row";
    row.tracks.forEach(([id, label], columnIndex) => {
      const card = document.createElement("article");
      card.className = "pattern-card";
      card.dataset.track = id;
      const title = document.createElement("h4");
      title.textContent = `${columnIndex + 1}. ${label}`;
      const location = document.createElement("p");
      location.className = "pattern-location";
      const sensorBottom = 16 - (row.blockRow + 1) * 4;
      const pan = [0.05, 0.35, 0.65, 0.95][columnIndex];
      const panLabel = pan < 0.5
        ? `L ${Math.round((0.5 - pan) * 200)}%`
        : `R ${Math.round((pan - 0.5) * 200)}%`;
      location.textContent =
        `Detector x=${columnIndex * 4}–${columnIndex * 4 + 3}, y=${sensorBottom}–${sensorBottom + 3} · pan ${panLabel}`;
      card.append(title, location);

      const average = document.createElement("p");
      average.className = "block-average";
      const mode = document.createElement("p");
      mode.className = "pattern-state";
      const thresholdLabel = document.createElement("label");
      thresholdLabel.className = "threshold-control";
      thresholdLabel.textContent = "Quiet threshold";
      const thresholdInput = document.createElement("input");
      thresholdInput.type = "range";
      thresholdInput.min = "0";
      thresholdInput.max = "100";
      thresholdInput.step = "1";
      thresholdInput.value = String(Math.round((quietThresholds.get(id) ?? defaultQuietThreshold) * 100));
      thresholdInput.setAttribute("aria-label", `${label} quiet-mode threshold`);
      const thresholdValue = document.createElement("output");
      thresholdValue.textContent = `${thresholdInput.value}%`;
      thresholdLabel.append(thresholdInput, thresholdValue);

      thresholdInput.addEventListener("input", () => {
        quietThresholds.set(id, Number(thresholdInput.value) / 100);
        thresholdValue.textContent = `${thresholdInput.value}%`;
        refreshPatternGrid();
      });
      thresholdInput.addEventListener("change", () => {
        if (strudelActive) {
          applyStrudelCode().catch((error) => {
            showError(error instanceof Error ? error.message : String(error));
          });
        }
      });
      card.append(average, mode, thresholdLabel);

      const controls = [
        ["reverb", "Reverb"],
        ["volume", "Volume"],
        ["delay", "Delay"],
      ];
      const controlGrid = document.createElement("div");
      controlGrid.className = "pattern-controls";
      controls.forEach(([name, labelText]) => {
        const control = document.createElement("div");
        control.className = "pattern-control";
        control.dataset.control = name;
        const label = document.createElement("span");
        label.textContent = labelText;
        const value = document.createElement("output");
        value.className = "control-value";
        control.append(label, value);
        controlGrid.append(control);
      });
      card.append(controlGrid);
      quietThresholds.set(id, quietThresholds.get(id) ?? defaultQuietThreshold);
      tracksElement.append(card);
    });
    rowElement.append(tracksElement);
    elements.patternGrid.append(rowElement);
  });
}

function refreshPatternGrid() {
  if (!samples) return;
  const values = patternControlValues(frameIndex);
  for (const [id, controls] of Object.entries(values)) {
    const card = elements.patternGrid.querySelector(`[data-track="${id}"]`);
    card.classList.toggle("quiet-mode", controls.quiet);
    card.querySelector(".block-average").textContent =
      `4 × 4 mean: ${controls.average.toPrecision(5)} photons · ${Math.round(controls.normalizedAverage * 100)}% normalized`;
    card.querySelector(".pattern-state").textContent = controls.quiet
      ? "Quiet pattern"
      : "Full pattern";
    const threshold = card.querySelector(".threshold-control");
    threshold.querySelector("input").value = String(Math.round(controls.threshold * 100));
    threshold.querySelector("output").textContent = `${Math.round(controls.threshold * 100)}%`;
    for (const [name, value] of Object.entries(controls)) {
      if (name === "average" || name === "normalizedAverage" || name === "quiet" || name === "threshold" || name === "pan" || name === "pattern") continue;
      const control = card.querySelector(`[data-control="${name}"]`);
      const percent = name === "reverb" || name === "delay"
        ? Math.round(value * 200)
        : name === "volume"
          ? Math.round(value * 100)
          : Math.round((1 - value) * 100);
      control.style.setProperty("--level", `${percent}%`);
      control.querySelector("output").textContent = `${percent}%`;
    }
  }
}

function getEvaluatedStrudelCode() {
  const controls = patternControlValues(frameIndex);
  const code = elements.strudelCode.value.replace(
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
  if (
    code === strudelLastUpdate
    || elements.strudelCode.value === strudelLastErrorTemplate
    || strudelApplying
  ) return;
  strudelApplying = true;
  elements.strudelStatus.textContent = `Applying detector controls from frame ${frameIndex}…`;
  try {
    await strudel.transpiler(code);
    await strudel.evaluate(code, true);
    strudelLastUpdate = code;
    strudelLastErrorTemplate = "";
    elements.strudelStatus.textContent = `Strudel playing · controls last applied from frame ${frameIndex}.`;
  } catch (error) {
    strudelLastErrorTemplate = elements.strudelCode.value;
    throw error;
  } finally {
    strudelApplying = false;
  }
}

function preloadStrudel() {
  if (!strudelLoadPromise) {
    strudelLoadPromise = import("https://esm.sh/@strudel/web@1.3.0");
  }
  return strudelLoadPromise.then((module) => {
    strudel = module;
    strudelLoadFailed = false;
    elements.strudelStatus.textContent = "Strudel is ready. Press Start Strudel to begin.";
    if (samples) elements.strudelStart.disabled = false;
    return module;
  }).catch((error) => {
    strudelLoadPromise = undefined;
    strudelLoadFailed = true;
    throw error;
  });
}

function startStrudel() {
  if (strudelActive) return;
  clearError();
  if (!strudel) {
    elements.strudelStart.disabled = true;
    elements.strudelStatus.textContent = "Loading Strudel. Press Start again when it is ready.";
    preloadStrudel().then(() => {
      elements.strudelStart.disabled = false;
    }).catch((error) => {
      elements.strudelStart.disabled = false;
      elements.strudelStatus.textContent = "Could not load Strudel; check your connection and try again.";
      showError(error instanceof Error ? error.message : String(error));
    });
    return;
  }

  elements.strudelStart.disabled = true;
  elements.strudelStatus.textContent = "Loading Strudel and drum samples…";
  try {
    if (!strudelInitPromise) {
      strudelInitPromise = strudel.initStrudel({
        prebake: () => strudel.samples("github:tidalcycles/dirt-samples"),
      });
    }
  } catch (error) {
    elements.strudelStart.disabled = false;
    elements.strudelStatus.textContent = "Could not start Strudel.";
    showError(error instanceof Error ? error.message : String(error));
    return;
  }

  strudelInitPromise.then(async () => {
    strudelActive = true;
    strudelLastUpdate = "";
    strudelLastErrorTemplate = "";
    await applyStrudelCode();
    strudelUpdateTimer = window.setInterval(() => {
      if (strudelEditTimer !== undefined) return;
      applyStrudelCode().catch((error) => {
        showError(error instanceof Error ? error.message : String(error));
        elements.strudelStatus.textContent = "Pattern update failed; the previous Strudel patterns are still playing.";
      });
    }, 500);
    elements.strudelUpdate.disabled = false;
    elements.strudelStop.disabled = false;
  }).catch((error) => {
    if (strudelActive && strudel) strudel.hush();
    if (!strudelActive) strudelInitPromise = undefined;
    strudelActive = false;
    elements.strudelStatus.textContent = "Could not start Strudel.";
    showError(error instanceof Error ? error.message : String(error));
  }).finally(() => {
    elements.strudelStart.disabled = false;
  });
}

function stopStrudel() {
  if (strudelUpdateTimer !== undefined) {
    window.clearInterval(strudelUpdateTimer);
    strudelUpdateTimer = undefined;
  }
  if (strudelEditTimer !== undefined) {
    window.clearTimeout(strudelEditTimer);
    strudelEditTimer = undefined;
  }
  if (strudel && strudelActive) strudel.hush();
  strudelActive = false;
  strudelLastUpdate = "";
  strudelLastErrorTemplate = "";
  elements.strudelStatus.textContent = "Strudel is not running.";
  elements.strudelUpdate.disabled = true;
  elements.strudelStop.disabled = true;
}

function drawHeatmap() {
  const { context: ctx, width: canvasWidth, height: canvasHeight } = prepareCanvas(elements.detector);
  const left = 38;
  const top = 10;
  const cellSize = Math.min(canvasWidth - left - 8, canvasHeight - top - 34) / width;
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

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
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
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.5;
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
  ctx.strokeStyle = "#ff5252";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left + (width / 2) * cellSize, top);
  ctx.lineTo(left + (width / 2) * cellSize, top + plotSize);
  ctx.moveTo(left, top + (height / 2) * cellSize);
  ctx.lineTo(left + plotSize, top + (height / 2) * cellSize);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    left + selectedPixel.x * cellSize + 1,
    top + (height - 1 - selectedPixel.y) * cellSize + 1,
    cellSize - 2,
    cellSize - 2,
  );
  ctx.fillStyle = "#c6d0dd";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let x = 0; x < width; x += 1) {
    ctx.fillText(String(x), left + (x + 0.5) * cellSize, top + plotSize + 16);
  }
  ctx.textAlign = "right";
  for (let y = 0; y < height; y += 1) {
    ctx.fillText(String(y), left - 7, top + (height - y - 0.5) * cellSize + 4);
  }
  ctx.restore();
}

function drawChartAxes(ctx, canvasWidth, canvasHeight, bounds) {
  const plot = {
    left: 58,
    right: canvasWidth - 14,
    top: 14,
    bottom: canvasHeight - 34,
  };
  const range = bounds.max - bounds.min || 1;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.font = "11px system-ui, sans-serif";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(194, 208, 224, 0.18)";
  ctx.fillStyle = "#aab6c5";
  ctx.textAlign = "right";

  for (let tick = 0; tick <= 4; tick += 1) {
    const fraction = tick / 4;
    const y = plot.bottom - fraction * (plot.bottom - plot.top);
    const value = bounds.min + fraction * range;
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.right, y);
    ctx.stroke();
    ctx.fillText(value.toPrecision(4), plot.left - 7, y + 4);
  }

  ctx.textAlign = "center";
  for (let tick = 0; tick <= 4; tick += 1) {
    const fraction = tick / 4;
    const x = plot.left + fraction * (plot.right - plot.left);
    const frame = Math.round(fraction * (frameCount - 1));
    ctx.beginPath();
    ctx.moveTo(x, plot.top);
    ctx.lineTo(x, plot.bottom);
    ctx.stroke();
    ctx.fillText(String(frame), x, plot.bottom + 18);
  }

  return { plot, range };
}

function drawLightcurve() {
  const { context: ctx, width: canvasWidth, height: canvasHeight } = prepareCanvas(elements.lightcurve);
  const { plot, range } = drawChartAxes(ctx, canvasWidth, canvasHeight, lightcurveBounds);
  const xForFrame = (frame) => plot.left + frame / Math.max(1, frameCount - 1) * (plot.right - plot.left);
  const yForValue = (value) => plot.bottom - (value - lightcurveBounds.min) / range * (plot.bottom - plot.top);

  ctx.strokeStyle = "#60a5fa";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let frame = 0; frame < frameCount; frame += 1) {
    const x = xForFrame(frame);
    const y = yForValue(selectedLightcurve[frame]);
    if (frame === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  drawFrameCursor(ctx, xForFrame, yForValue, selectedLightcurve[frameIndex]);
}

function drawFrameCursor(ctx, xForFrame, yForValue, value) {
  const x = xForFrame(frameIndex);
  ctx.save();
  ctx.strokeStyle = "#ff5252";
  ctx.fillStyle = "#ff5252";
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x, 14);
  ctx.lineTo(x, elements.lightcurve.clientHeight - 34);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, yForValue(value), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAllLightcurves() {
  if (!showAllCurves) return;
  const { context: ctx, width: canvasWidth, height: canvasHeight } = prepareCanvas(elements.allCurvesChart);
  const { plot, range } = drawChartAxes(ctx, canvasWidth, canvasHeight, {
    min: dataset.percentile1,
    max: dataset.percentile99,
  });
  const frameSpan = Math.max(1, frameCount - 1);
  const yForValue = (value) => plot.bottom - (value - dataset.percentile1) / range * (plot.bottom - plot.top);

  ctx.save();
  ctx.lineWidth = 0.65;
  ctx.strokeStyle = "rgba(96, 165, 250, 0.19)";
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      ctx.beginPath();
      for (let frame = 0; frame < frameCount; frame += 1) {
        const px = plot.left + frame / frameSpan * (plot.right - plot.left);
        const py = yForValue(sampleAt(frame, y, x));
        if (frame === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  for (let frame = 0; frame < frameCount; frame += 1) {
    const px = plot.left + frame / frameSpan * (plot.right - plot.left);
    const py = yForValue(sampleAt(frame, selectedPixel.y, selectedPixel.x));
    if (frame === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function updateReadout() {
  const value = sampleAt(frameIndex, selectedPixel.y, selectedPixel.x);
  elements.frameTitle.textContent = `Frame ${frameIndex}`;
  elements.pixelReadout.textContent =
    `Pixel x=${selectedPixel.x}, y=${selectedPixel.y} · ${value.toPrecision(8)} photons`;
  elements.status.textContent =
    `${dataset.label} · ${frameCount.toLocaleString()} frames · ${width} × ${height} · frame ${frameIndex}`;
}

function render() {
  if (!samples) return;
  elements.frameNumber.value = String(frameIndex);
  elements.frameSlider.value = String(frameIndex);
  drawHeatmap();
  drawLightcurve();
  updateReadout();
  refreshPatternGrid();
}

function selectPixel(x, y) {
  selectedPixel = { x, y };
  selectedLightcurve = new Array(frameCount);
  let min = Infinity;
  let max = -Infinity;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const value = sampleAt(frame, y, x);
    selectedLightcurve[frame] = value;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  lightcurveBounds = { min, max };
  render();
  drawAllLightcurves();
}

function setFrame(frame) {
  if (!Number.isFinite(frame)) return;
  frameIndex = Math.max(0, Math.min(frameCount - 1, Math.trunc(frame)));
  render();
}

function advanceFrame() {
  frameIndex = frameIndex >= rangeEnd ? rangeStart : frameIndex + 1;
  render();
}

function schedulePlayback() {
  playbackTimer = window.setInterval(advanceFrame, Number(elements.speed.value));
}

function drawExportFrame(ctx, canvas) {
  ctx.fillStyle = "#10151d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#edf2f7";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillText(`${dataset.label} · frame ${frameIndex}`, 32, 40);
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = "#aab6c5";
  ctx.fillText(
    `Pixel x=${selectedPixel.x}, y=${selectedPixel.y} · ${sampleAt(frameIndex, selectedPixel.y, selectedPixel.x).toPrecision(8)} photons`,
    650,
    86,
  );
  ctx.drawImage(elements.detector, 32, 64, 560, 560);
  ctx.drawImage(elements.lightcurve, 620, 120, 548, 400);
}

function detectorCellFromEvent(event) {
  const bounds = elements.detector.getBoundingClientRect();
  const left = 38;
  const top = 10;
  const cellSize = Math.min(bounds.width - left - 8, bounds.height - top - 34) / width;
  const x = Math.floor((event.clientX - bounds.left - left) / cellSize);
  const displayY = Math.floor((event.clientY - bounds.top - top) / cellSize);
  const y = height - 1 - displayY;
  if (x < 0 || x >= width || y < 0 || y >= height) return undefined;
  return { x, y, cellSize, left, top, bounds };
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

async function exportAnimation() {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error("This browser does not support WebM animation export.");
  }
  if (rangeEnd < rangeStart) {
    throw new Error("End frame must be greater than or equal to start frame.");
  }

  const mimeType = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
  if (!mimeType) throw new Error("This browser cannot encode WebM video.");

  const previousFrame = frameIndex;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 680;
  const ctx = canvas.getContext("2d");
  const stream = canvas.captureStream(60);
  let recorder;

  elements.exportAnimation.disabled = true;
  stopPlayback();
  try {
    recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    const stopped = new Promise((resolve, reject) => {
      recorder.addEventListener("stop", resolve, { once: true });
      recorder.addEventListener("error", (event) => {
        reject(event.error ?? new Error("WebM recording failed."));
      }, { once: true });
    });
    recorder.start();

    const frameTotal = rangeEnd - rangeStart + 1;
    for (let frame = rangeStart; frame <= rangeEnd; frame += 1) {
      setFrame(frame);
      drawExportFrame(ctx, canvas);
      elements.status.textContent = `Exporting frame ${frame - rangeStart + 1} of ${frameTotal}…`;
      await new Promise((resolve) => window.setTimeout(resolve, Number(elements.speed.value)));
    }

    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: recorder.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dataset.source.replace(/\.npy$/i, "")}_frames-${rangeStart}-${rangeEnd}.webm`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    elements.exportAnimation.disabled = false;
    setFrame(previousFrame);
  }
}

function stopPlayback() {
  if (playbackTimer !== undefined) {
    window.clearInterval(playbackTimer);
    playbackTimer = undefined;
  }
}

function startPlayback() {
  if (rangeEnd < rangeStart) {
    throw new Error("End frame must be greater than or equal to start frame.");
  }
  stopPlayback();
  frameIndex = rangeStart;
  render();
  schedulePlayback();
}

function updateRangeInputs() {
  rangeStart = Math.max(0, Math.min(frameCount - 1, Number(elements.startFrame.value)));
  rangeEnd = Math.max(0, Math.min(frameCount - 1, Number(elements.endFrame.value)));
  elements.startFrame.value = String(rangeStart);
  elements.endFrame.value = String(rangeEnd);
  stopPlayback();
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
  rangeStart = 0;
  rangeEnd = frameCount - 1;
  elements.frameNumber.max = String(frameCount - 1);
  elements.frameSlider.max = String(frameCount - 1);
  elements.startFrame.max = String(frameCount - 1);
  elements.endFrame.max = String(frameCount - 1);
  elements.startFrame.value = "0";
  elements.endFrame.value = String(rangeEnd);
  elements.scaleMin.textContent = metadata.percentile1.toPrecision(4);
  elements.scaleMax.textContent = metadata.percentile99.toPrecision(4);
  selectPixel(selectedPixel.x, selectedPixel.y);
  for (const control of interactiveControls) control.disabled = false;
  elements.strudelStart.disabled = !strudel && !strudelLoadFailed;
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
  elements.previous.addEventListener("click", () =>
    setFrame(frameIndex === 0 ? frameCount - 1 : frameIndex - 1));
  elements.next.addEventListener("click", () =>
    setFrame(frameIndex === frameCount - 1 ? 0 : frameIndex + 1));
  elements.play.addEventListener("click", () => {
    try {
      startPlayback();
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
    }
  });
  elements.stop.addEventListener("click", stopPlayback);
  elements.frameNumber.addEventListener("change", () => setFrame(Number(elements.frameNumber.value)));
  elements.frameSlider.addEventListener("input", () => setFrame(Number(elements.frameSlider.value)));
  elements.startFrame.addEventListener("change", updateRangeInputs);
  elements.endFrame.addEventListener("change", updateRangeInputs);
  elements.speed.addEventListener("input", () => {
    elements.speedLabel.value = `${elements.speed.value} ms`;
    if (playbackTimer !== undefined) {
      window.clearInterval(playbackTimer);
      schedulePlayback();
    }
  });
  elements.strudelStart.addEventListener("click", startStrudel);
  elements.strudelUpdate.addEventListener("click", () => {
    applyStrudelCode().catch((error) => {
      showError(error instanceof Error ? error.message : String(error));
    });
  });
  elements.strudelStop.addEventListener("click", stopStrudel);
  elements.strudelCode.addEventListener("input", () => {
    if (strudelActive) {
      strudelLastUpdate = "";
      strudelLastErrorTemplate = "";
      if (strudelEditTimer !== undefined) window.clearTimeout(strudelEditTimer);
      strudelEditTimer = window.setTimeout(() => {
        strudelEditTimer = undefined;
        applyStrudelCode().catch((error) => {
          showError(error instanceof Error ? error.message : String(error));
          elements.strudelStatus.textContent = "Pattern edit failed; the previous Strudel patterns are still playing.";
        });
      }, 400);
    }
  });
  elements.allCurves.addEventListener("click", () => {
    showAllCurves = !showAllCurves;
    elements.allCurves.setAttribute("aria-pressed", String(showAllCurves));
    elements.allCurvesPanel.hidden = !showAllCurves;
    elements.allCurves.textContent = showAllCurves ? "Hide all lightcurves" : "Show all lightcurves";
    drawAllLightcurves();
  });
  elements.exportAnimation.addEventListener("click", async () => {
    clearError();
    try {
      await exportAnimation();
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
    }
  });
  elements.detector.addEventListener("mousemove", showDetectorTooltip);
  elements.detector.addEventListener("mouseleave", () => {
    elements.detectorTooltip.hidden = true;
  });
  elements.detector.addEventListener("click", (event) => {
    const cell = detectorCellFromEvent(event);
    if (cell) selectPixel(cell.x, cell.y);
  });
  elements.lightcurve.addEventListener("click", (event) => {
    const bounds = elements.lightcurve.getBoundingClientRect();
    const plotLeft = 58;
    const plotRight = bounds.width - 14;
    const x = event.clientX - bounds.left;
    if (x < plotLeft || x > plotRight) return;
    const fraction = (x - plotLeft) / (plotRight - plotLeft);
    setFrame(Math.round(fraction * (frameCount - 1)));
  });
  window.addEventListener("resize", render);
}

async function initialize() {
  configureEvents();
  elements.strudelCode.value = patternTemplate;
  buildPatternGrid();
  preloadStrudel().catch((error) => {
    elements.strudelStatus.textContent = "Could not load Strudel; check your connection and try again.";
    showError(error instanceof Error ? error.message : String(error));
    if (samples && strudelLoadFailed) elements.strudelStart.disabled = false;
  });
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
      option.textContent = metadata.label;
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
