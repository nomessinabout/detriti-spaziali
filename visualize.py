import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Button, TextBox
from matplotlib.animation import FuncAnimation
from matplotlib.animation import PillowWriter
from tkinter import simpledialog, filedialog
import tkinter as tk
# ============================================================
# LOAD DATA
# ============================================================

frames = np.load(
    "L1__2026_07_06__13_42_41__LED155V_lensreduction_rotation_10min_WORKING_mediana.npy"
)

print("Frames shape:", frames.shape)

# ============================================================
# PARAMETERS
# ============================================================

scale_factor = 20

frame_index = 0
selected_pixel = None

start_frame = 0
end_frame = len(frames) - 1

animation_speed = 100

anim = None

# ============================================================
# FIGURES
# ============================================================

fig, ax = plt.subplots(figsize=(9, 9))
plt.subplots_adjust(bottom=0.22, right=0.88)

lc_fig, lc_ax = plt.subplots(figsize=(10, 4))
lc_ax.set_title("Pixel Lightcurve")
lc_ax.set_xlabel("GTU / Frame")
lc_ax.set_ylabel("Photon Count")
lc_ax.grid(True, alpha=0.3)

# ============================================================
# IMAGE
# ============================================================

vmin = np.percentile(frames, 1)
vmax = np.percentile(frames, 99)

img = ax.imshow(
    np.kron(frames[0], np.ones((scale_factor, scale_factor))),
    cmap='viridis',
    origin='lower',
    interpolation='nearest',
    vmin=vmin,
    vmax=vmax
)

cax = plt.axes([0.90, 0.20, 0.03, 0.65])
cbar = fig.colorbar(img, cax=cax)
cbar.set_label("Photon Count")

# ============================================================
# GRID
# ============================================================

ticks = np.arange(0, 16 * scale_factor, scale_factor)
ax.set_xticks(ticks)
ax.set_yticks(ticks)
ax.set_xticklabels(np.arange(16))
ax.set_yticklabels(np.arange(16))
ax.grid(color='white', linestyle='--', linewidth=0.5)

title = ax.set_title("Frame 0")

ax.axvline(8 * scale_factor, color='red', linewidth=2)
ax.axhline(8 * scale_factor, color='red', linewidth=2)

pixel_text = ax.text(
    0.02, 1.02, "",
    transform=ax.transAxes,
    fontsize=10,
    bbox=dict(facecolor='white', alpha=0.8)
)

# ============================================================
# DISPLAY FRAME
# ============================================================

def create_gif(event=None):

    root = tk.Tk()
    root.withdraw()

    start = simpledialog.askinteger(
        "GIF",
        "Frame iniziale:",
        initialvalue=start_frame
    )

    if start is None:
        return

    end = simpledialog.askinteger(
        "GIF",
        "Frame finale:",
        initialvalue=end_frame
    )

    if end is None:
        return

    x = simpledialog.askinteger(
        "GIF",
        "Pixel X (0-15):",
        initialvalue=8
    )

    if x is None:
        return

    y = simpledialog.askinteger(
        "GIF",
        "Pixel Y (0-15):",
        initialvalue=8
    )

    if y is None:
        return

    save_path = filedialog.asksaveasfilename(
        defaultextension=".gif",
        filetypes=[("GIF", "*.gif")]
    )

    if save_path == "":
        return

    # ======================================================
    # FIGURA GIF
    # ======================================================

    gif_fig, (gif_ax, gif_lc_ax) = plt.subplots(
        1, 2,
        figsize=(12, 5)
    )

    frame0 = frames[start]

    gif_img = gif_ax.imshow(
        np.kron(frame0, np.ones((scale_factor, scale_factor))),
        cmap='viridis',
        origin='lower',
        interpolation='nearest',
        vmin=vmin,
        vmax=vmax
    )

    gif_ax.set_title(f"Frame {start}")

    ticks = np.arange(0, 16 * scale_factor, scale_factor)

    gif_ax.set_xticks(ticks)
    gif_ax.set_yticks(ticks)

    gif_ax.set_xticklabels(np.arange(16))
    gif_ax.set_yticklabels(np.arange(16))

    gif_ax.grid(
        color='white',
        linestyle='--',
        linewidth=0.5
    )

    gif_ax.axvline(
        8 * scale_factor,
        color='red'
    )

    gif_ax.axhline(
        8 * scale_factor,
        color='red'
    )

    cbar_gif = gif_fig.colorbar(
        gif_img,
        ax=gif_ax,
        fraction=0.046,
        pad=0.04
    )

    # ======================================================
    # LIGHTCURVE SOLO SULL'INTERVALLO SELEZIONATO
    # ======================================================

    lc = frames[start:end + 1, y, x]
    frame_range = np.arange(start, end + 1)

    gif_lc_ax.plot(
        frame_range,
        lc,
        color='blue'
    )

    current_point, = gif_lc_ax.plot(
        [],
        [],
        'ro'
    )

    cursor = gif_lc_ax.axvline(
        start,
        color='red',
        linestyle='--'
    )

    gif_lc_ax.set_xlim(start, end)

    ymin = np.min(lc)
    ymax = np.max(lc)

    if ymin == ymax:
        ymax += 1e-9

    gif_lc_ax.set_ylim(
        ymin * 0.95,
        ymax * 1.05
    )

    gif_lc_ax.set_title(
        f"Lightcurve (x={x}, y={y}) - Frames {start}-{end}"
    )

    gif_lc_ax.set_xlabel("GTU / Frame")
    gif_lc_ax.set_ylabel("Photon Count")
    gif_lc_ax.grid(True)

    # ======================================================
    # UPDATE
    # ======================================================

    def update_gif(i):

        frame_id = start + i

        frame = frames[frame_id]

        gif_img.set_data(
            np.kron(
                frame,
                np.ones((scale_factor, scale_factor))
            )
        )

        gif_ax.set_title(
            f"Frame {frame_id}"
        )

        frame_min = frame.min()
        frame_max = frame.max()

        cbar_gif.set_ticks([
            vmin,
            (vmin + vmax) / 2,
            vmax
        ])

        cbar_gif.set_ticklabels([
            f"{frame_min:.3f}",
            f"{(frame_min + frame_max)/2:.3f}",
            f"{frame_max:.3f}"
        ])

        cursor.set_xdata([
            frame_id,
            frame_id
        ])

        current_point.set_data(
            [frame_id],
            [lc[frame_id - start]]
        )

        return (
            gif_img,
            current_point,
            cursor
        )

    # ======================================================
    # ANIMAZIONE
    # ======================================================

    anim_gif = FuncAnimation(
        gif_fig,
        update_gif,
        frames=end - start + 1,
        interval=animation_speed,
        blit=False
    )

    print("Saving GIF...")

    anim_gif.save(
        save_path,
        writer=PillowWriter(
            fps=max(
                1,
                int(1000 / animation_speed)
            )
        )
    )

    plt.close(gif_fig)

    print("GIF saved:", save_path)


def display_frame():
    global frame_index, selected_pixel

    frame = frames[frame_index]

    img.set_data(
        np.kron(frame, np.ones((scale_factor, scale_factor)))
    )

    # Aggiorna le etichette della colorbar
    frame_min = frame.min()
    frame_max = frame.max()

    cbar.set_ticks([vmin, (vmin + vmax) / 2, vmax])
    cbar.set_ticklabels([
        f"{frame_min:.3f}",
        f"{(frame_min + frame_max) / 2:.3f}",
        f"{frame_max:.3f}"
    ])

    title.set_text(f"Frame {frame_index}")

    # LIGHTCURVE
    if selected_pixel is not None:
        x, y = selected_pixel
        lc = frames[:, y, x]

        lc_ax.clear()
        lc_ax.plot(lc, color='blue')

        lc_ax.axvline(frame_index, color='red', linestyle='--')
        lc_ax.scatter(frame_index, lc[frame_index], color='red')

        lc_ax.set_title(f"Lightcurve (x={x}, y={y})")
        lc_ax.set_xlabel("GTU / Frame")
        lc_ax.set_ylabel("Photon Count")
        lc_ax.grid(True, alpha=0.3)

        lc_fig.canvas.draw_idle()

    fig.canvas.draw_idle()

# ============================================================
# RESET ANIMATION (IMPORTANT FIX)
# ============================================================

def reset_animation():
    global anim

    if anim is not None:
        anim.event_source.stop()
        anim = None

# ============================================================
# NAVIGATION
# ============================================================

def next_frame(event=None):
    global frame_index
    frame_index = (frame_index + 1) % len(frames)
    display_frame()

def prev_frame(event=None):
    global frame_index
    frame_index = (frame_index - 1) % len(frames)
    display_frame()

def jump_to_frame(text):
    global frame_index
    try:
        frame_index = max(0, min(int(text), len(frames) - 1))
        display_frame()
    except:
        pass

# ============================================================
# ANIMATION
# ============================================================

def update(i):
    global frame_index

    start = max(0, start_frame)
    end = min(len(frames) - 1, end_frame)

    frame_index += 1

    if frame_index > end:
        frame_index = start

    display_frame()

def start(event):
    global anim, frame_index

    reset_animation()

    frame_index = max(0, start_frame)

    anim = FuncAnimation(
        fig,
        update,
        interval=animation_speed
    )

def stop(event):
    global anim

    if anim is not None:
        anim.event_source.stop()
        anim = None

# ============================================================
# EVENTS
# ============================================================

def on_click(event):
    global selected_pixel

    if event.inaxes != ax:
        return

    if event.xdata is None or event.ydata is None:
        return

    x = int(event.xdata // scale_factor)
    y = int(event.ydata // scale_factor)

    if 0 <= x < 16 and 0 <= y < 16:
        selected_pixel = (x, y)
        display_frame()

def on_lc_click(event):
    global frame_index

    if event.inaxes != lc_ax:
        return

    if event.xdata is None:
        return

    idx = int(event.xdata)

    if 0 <= idx < len(frames):
        frame_index = idx
        display_frame()

def on_move(event):
    if event.inaxes != ax:
        return

    if event.xdata is None or event.ydata is None:
        return

    x = int(event.xdata // scale_factor)
    y = int(event.ydata // scale_factor)

    if 0 <= x < 16 and 0 <= y < 16:
        val = frames[frame_index, y, x]
        pixel_text.set_text(f"x={x}, y={y}, value={val:.3f}")
        fig.canvas.draw_idle()

# ============================================================

def show_all_lightcurves(event=None):

    fig_all, ax_all = plt.subplots(figsize=(12, 6))

    # One different color for each pixel
    colors = plt.cm.turbo(np.linspace(0, 1, 256))

    k = 0
    for y in range(16):
        for x in range(16):

            ax_all.plot(
                frames[:, y, x],
                color=colors[k],
                alpha=0.5,
                linewidth=0.8
            )

            k += 1

    # Highlight the selected pixel, if any
    if selected_pixel is not None:
        x, y = selected_pixel
        ax_all.plot(
            frames[:, y, x],
            color='black',
            linewidth=2.5,
            label=f"Selected ({x},{y})"
        )
        ax_all.legend()

    ax_all.set_title("EC Lightcurves")
    ax_all.set_xlabel("GTU / Frame")
    ax_all.set_ylabel("Photon Count")
    ax_all.grid(True, alpha=0.3)

    plt.show()


# CONNECT EVENTS
# ============================================================

fig.canvas.mpl_connect('button_press_event', on_click)
fig.canvas.mpl_connect('motion_notify_event', on_move)
lc_fig.canvas.mpl_connect('button_press_event', on_lc_click)

# ============================================================
# BUTTONS (KEEP REFERENCES!)
# ============================================================

ax_prev = fig.add_axes([0.08, 0.08, 0.08, 0.05])
ax_next = fig.add_axes([0.18, 0.08, 0.08, 0.05])
ax_play = fig.add_axes([0.32, 0.08, 0.08, 0.05])
ax_stop = fig.add_axes([0.42, 0.08, 0.08, 0.05])
ax_jump = fig.add_axes([0.58, 0.08, 0.10, 0.05])
ax_start = fig.add_axes([0.72, 0.08, 0.08, 0.05])
ax_end = fig.add_axes([0.82, 0.08, 0.08, 0.05])

ax_all = fig.add_axes([0.60, 0.08, 0.08, 0.05])

btn_all = Button(ax_all, "EC_mode")
btn_all.on_clicked(show_all_lightcurves)

btn_prev = Button(ax_prev, 'Prev')
btn_next = Button(ax_next, 'Next')
btn_play = Button(ax_play, 'Play')
btn_stop = Button(ax_stop, 'Stop')

btn_prev.on_clicked(prev_frame)
btn_next.on_clicked(next_frame)
btn_play.on_clicked(start)
btn_stop.on_clicked(stop)

box_jump = TextBox(ax_jump, 'Frame', initial="0")
box_jump.on_submit(jump_to_frame)


ax_gif = fig.add_axes([0.50, 0.08, 0.08, 0.05])

btn_gif = Button(
    ax_gif,
    'GIF'
)

btn_gif.on_clicked(create_gif)
# ============================================================
# START / END (FULLY SYNCHRONIZED FIX)
# ============================================================

def set_start(text):
    global start_frame, frame_index

    try:
        start_frame = max(0, int(text))
        frame_index = start_frame
        display_frame()
        reset_animation()
    except:
         pass

def set_end(text):
    global end_frame

    try:
        end_frame = min(len(frames) - 1, int(text))
        display_frame()
        reset_animation()
    except:
        pass

box_start = TextBox(ax_start, 'Start', initial="0")
box_start.on_submit(set_start)

box_end = TextBox(ax_end, 'End', initial=str(len(frames) - 1))
box_end.on_submit(set_end)

# ============================================================
# INIT
# ============================================================

display_frame()
plt.show()