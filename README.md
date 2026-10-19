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
- The 16 × 16 detector is divided into 4 × 4 regions. Each region controls one pattern; the four detector sub-quadrants independently set **Reverb** (top-left, up to 50%), **Volume** (top-right), **Delay** (bottom-left, up to 50%), and **Density** (bottom-right). The UI overlays the 4 × 4 block boundaries and shows current control values.
- Each quadrant’s four samples are normalized against that dataset’s 1st–99th percentile range and clipped to 0–1. Volume spans 5–100%, reverb and delay each span 0–50%, and density spans 20–100% of pattern events.
- While Strudel is running, the active script is re-evaluated at most twice per second with current detector controls. **Apply current frame** immediately applies the currently displayed frame.

The 16 starter patterns are separated into four roles per row: bass (sub, offbeat, walking line, fill), keys/synth (chord stabs, arpeggio, pad, lead), percussion (clap, shaker, tambourine, rim), and drums (kick, snare, hi-hat, tom). Each `$:` line is an independent Strudel pattern, so you can edit each part without needing to combine the instruments yourself.

### Editing the Strudel patterns

Open **Strudel script — edit patterns**. Each line beginning with `$:` is a normal Strudel pattern. Change the notes, sample names, mini-notation, or effects in those expressions. Keep the `{{track.parameter}}` placeholders in place when you want a value to follow its detector quadrant. The app substitutes numbers for those placeholders before handing the code to Strudel; for example:

```js
$: s("bd*4").gain({{kick.volume}}).room({{kick.reverb}}).delay({{kick.delay}}).degradeBy({{kick.sparse}})
```

The bundled Strudel web runtime is loaded from esm.sh at version 1.3.0; its starter drum samples are loaded from the public `tidalcycles/dirt-samples` repository. Starting Strudel therefore requires an internet connection. The editable starter script is in `app.js` as `patternTemplate`; change those patterns if you want the revised arrangement to be the new default. You can also copy the generated script from the browser into <https://strudel.cc/> to experiment there.

## Code layout

- `convert_npy.py` prepares binary data and its JSON manifest.
- `app.js` loads the float32 samples, draws the heatmap and plots, controls playback, maps detector sub-quadrants to pattern parameters, and runs Strudel.
- `index.html` and `style.css` provide the browser UI.
- `visualize.py` is the original Python/Matplotlib implementation.
