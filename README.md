# Detector data explorer

This browser-based JavaScript app replaces the Matplotlib viewer in `visualize.py`. It keeps the detector measurements as float32 samples and adds a live Strudel composition driven by the detector.

## Convert the NumPy files

From this folder, run:

```sh
python3 convert_npy.py
```

The converter reads each `.npy` file in the folder and writes:

- `data/<original-name>.f32`: the array samples in little-endian float32 binary, in C order.
- `data/manifest.json`: each array's dimensions, original filename, byte count, and 1st/99th percentile display limits.

The supplied arrays are finite float32 data with shape `[11400, 16, 16]` and `[1000, 16, 16]`. Conversion changes only the byte layout needed by browsers; it does not round, resample, normalize, or otherwise transform the samples. The manifest retains the dimensions that the raw binary file does not carry.

To convert a different file, pass its path explicitly:

```sh
python3 convert_npy.py path/to/another-file.npy
```

The converter requires NumPy, as does the original visualizer.

## Run the app

Serve this folder over HTTP (browsers do not allow the app to fetch its data files reliably from a `file://` URL):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

## 10-minute spatial sonification

Open <http://localhost:8000/sonification.html> for a minimal player that loads only the 10-minute dataset. Press **Play** to animate its 16 × 16 grid and hear four continuous sine tones, one per quadrant; press **Stop** to mute and pause. Click a quadrant to toggle its tone; inactive quadrants appear in grayscale. Hover to highlight a quadrant, or focus the grid and use arrow keys plus Enter/Space to toggle tones.

Each quadrant's mean normalized photon intensity controls its tone's volume. A bright upper half nudges the tone upward, while a bright lower half nudges it downward. Each of the four spatial voices uses a quiet, closely detuned companion sine wave: its frequency separation and level rise with photon activity to create audible beating, then decay slowly when the signal dims. The response has a fast attack and a slower release. The four notes are C3, G3, C4, and G4. Their positions use left/right and front/back HRTF placement, making the quadrant voices easier to distinguish on headphones. Audio begins only after the user presses **Play**.

## Use the viewer and Strudel

- Choose either dataset, drag the frame slider to seek, and press **Play** to start both the detector animation and Strudel audio. **Stop** pauses the animation and silences Strudel. The playback interval is fixed.
- Use **Show pattern controls** to overlay each 4 × 4 pattern block's name, energy mode, volume, reverb, and delay percentages. Teal shading marks the high-energy pattern; amber shading marks the low-energy pattern. Hover a block for its detector region and threshold details.
- The 16 pixel values in each pattern block are averaged. That mean is normalized against the dataset's 1st–99th percentile range and clipped to 0–1. Values below the default 28% threshold select the quiet pattern; other values select the full pattern.
- The upper two rows of patterns are keys and drums; the lower two are bass and percussion. The left/right columns are panned across stereo. The bass uses left/right pulses and complementary runs; percussion includes shakers, toms, and rimshots.
- Strudel's web runtime is loaded from esm.sh at version 1.3.0, and drum samples are loaded from the public `tidalcycles/dirt-samples` repository. Audio playback therefore requires an internet connection. The sample set has no `sh` or `rim` groups: shaker parts use `hh`, and the rim part uses `rs`.
- The starter script is in `app.js` as `patternTemplate`; quiet/full variations are in `patternModes`.

## Code layout

- `convert_npy.py` prepares binary data and its JSON manifest.
- `app.js` loads float32 samples, draws the heatmap and pattern overlay, controls playback, and runs the stereo Strudel patterns.
- `index.html` and `style.css` provide the browser UI.
- `sonification.html`, `sonification.css`, and `sonification.js` provide the minimal 10-minute, four-voice HRTF sonification player.
- `visualize.py` is the original Python/Matplotlib implementation.
