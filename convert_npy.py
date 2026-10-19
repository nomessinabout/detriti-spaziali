import argparse
import json
import math
from pathlib import Path

import numpy as np


def convert_file(source: Path, output_dir: Path) -> dict:
    frames = np.load(source, mmap_mode="r")
    if frames.ndim != 3 or frames.dtype.kind != "f" or frames.dtype.itemsize != 4:
        raise ValueError(f"{source} must contain a three-dimensional float32 array")

    data_name = f"{source.stem}.f32"
    data_path = output_dir / data_name
    little_endian = np.asarray(frames, dtype="<f4", order="C")
    little_endian.tofile(data_path)

    expected_bytes = math.prod(frames.shape) * np.dtype("<f4").itemsize
    if data_path.stat().st_size != expected_bytes:
        raise OSError(f"Unexpected output size for {data_path}")

    return {
        "id": source.name,
        "label": source.name,
        "source": source.name,
        "dataFile": f"data/{data_name}",
        "shape": list(frames.shape),
        "dtype": "float32",
        "byteOrder": "little-endian",
        "byteLength": expected_bytes,
        "percentile1": float(np.percentile(frames, 1)),
        "percentile99": float(np.percentile(frames, 99)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert float32 NumPy frame arrays into browser-readable binary data."
    )
    parser.add_argument(
        "inputs",
        nargs="*",
        type=Path,
        help="Input .npy files (defaults to every .npy file in the current directory).",
    )
    args = parser.parse_args()

    inputs = args.inputs or sorted(Path(".").glob("*.npy"))
    if not inputs:
        parser.error("No .npy files found; provide one or more input files.")

    output_dir = Path("data")
    output_dir.mkdir(parents=True, exist_ok=True)
    datasets = [convert_file(source, output_dir) for source in inputs]
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps({"datasets": datasets}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Converted {len(datasets)} dataset(s); wrote {manifest_path}")


if __name__ == "__main__":
    main()
