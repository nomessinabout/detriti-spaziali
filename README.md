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

## Use the viewer and Strudel

- Choose either dataset, navigate frames, and click or drag the frame slider.
- Click a detector cell to select its pixel. The lightcurve follows that pixel; click the lightcurve to seek to a frame.
- Set a start/end frame range and frame interval, then press **Play** to animate the detector.
- Use **Show all lightcurves** to compare all 256 pixels.
- Use **Export range as WebM** to save a silent animation of the heatmap and selected-pixel lightcurve for the selected frame range.
- Press **Start Strudel** to start the live house patterns. Press **Stop Strudel** to silence them. The browser only starts audio after that user gesture.
- Each displayed detector block is 4 × 4 pixels. Its 16 pixel values are averaged to report the block's mean light intensity in photons. The mean is also normalized against that dataset's 1st–99th percentile range and clipped to 0–1 for consistent thresholding across datasets.
- Every pattern block has its own adjustable **Quiet threshold** slider (default 30% of the normalized range). If its block-average light is below the threshold, the quiet version plays; otherwise, the full version plays. A block changing its threshold does not change any other block.
- The 2 × 2 top-left, top-right, and bottom-left sub-quadrants set **Reverb** (up to 50%), **Volume** (5–100%), and **Delay** (up to 50%). Density/sparsity is intentionally not used in the Strudel patterns.
- Pattern columns are panned left-to-right at 90% left, 30% left, 30% right, and 90% right. The outer blocks are therefore strongly separated in stereo; the two middle blocks sit nearer the center.
- Hover over the detector heatmap for the instrument, part, block average, and quiet/full state assigned to that 4 × 4 region.
- Instrument rows follow the detector from top to bottom: keys, drums, bass, percussion. Each uses four distinct parts. The bass has matching left/right low pulses and two higher, complementary runs in the middle; percussion includes stereo shakers, tom accents, and clave/rim.
- While Strudel is running, the active script is re-evaluated at most twice per second with current detector controls. **Apply current frame** immediately applies the currently displayed frame.

There are four patterns per instrument row. The drums put a low kick with hi-hat on the left, snare and tom in the center, and a higher kick with hi-hat on the right. Both kicks share the same quiet heartbeat (`bd [~ bd] ~ ~`) and full four-on-the-floor (`bd*4`) rhythms, with different playback speeds and stereo positions. The snare has an additional 15% gain multiplier to keep it behind the kick. The keys put matching chord progressions with different inversions on the outer blocks and a structurally matching, chord-tone melody across the inner pair. Quiet keys switch to quiet, scattered high-register phrases.

### Editing the Strudel patterns

Open **Strudel script — edit patterns**. Each line beginning with `$:` is a normal Strudel pattern. Change the notes, sample names, mini-notation, or effects in those expressions. Keep the `{{track.parameter}}` placeholders in place when you want a value to follow its detector block. A `{{track.pattern}}` placeholder switches between that track's quiet/full mini-notation patterns, while `volume`, `reverb`, `delay`, and `pan` are replaced by live numbers. For example:

```js
$: stack(s("{{drum_kick_left.pattern}}").speed(0.82), s("hh*8").gain(0.22)).gain({{drum_kick_left.volume}}).room({{drum_kick_left.reverb}}).delay({{drum_kick_left.delay}}).pan({{drum_kick_left.pan}})
```

The bundled Strudel web runtime is loaded from esm.sh at version 1.3.0; its starter drum samples are loaded from the public `tidalcycles/dirt-samples` repository. Starting Strudel therefore requires an internet connection. The editable starter script is in `app.js` as `patternTemplate`; quiet/full note patterns are in `patternModes`. Change those defaults if you want your revised arrangement to be the new starter. You can also copy the generated script from the browser into <https://strudel.cc/> to experiment there.

## Code layout

- `convert_npy.py` prepares binary data and its JSON manifest.
- `app.js` loads the float32 samples, computes block and quadrant averages, draws the heatmap and plots, controls playback, and runs the stereo Strudel patterns.
- `index.html` and `style.css` provide the browser UI.
- `visualize.py` is the original Python/Matplotlib implementation.
