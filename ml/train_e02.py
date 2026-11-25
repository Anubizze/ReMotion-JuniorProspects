"""Extract elbow-angle trajectories and evaluate an E02 cycle classifier.

The dataset's Train and Test folders are kept separate. The model is trained
only on Train, using participant-grouped cross-validation there, and Test is
used once for the final comparison.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import urllib.request
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.metrics import balanced_accuracy_score, confusion_matrix, f1_score
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


EXERCISE_DIR = Path("Exercise/2_Extending the Elbow")
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
)
FLEXED_DEGREES = 115.0
EXTENDED_DEGREES = 155.0
SAMPLE_FPS = 5.0
CURVE_POINTS = 64
LANDMARKS = {"left": (11, 13, 15), "right": (12, 14, 16)}


def participant_id(path: Path) -> str:
    match = re.match(r"^(\d+)_", path.stem)
    if not match:
        raise ValueError(f"Cannot read participant prefix from filename: {path.name}")
    return match.group(1)


def elbow_angle(points: list[Any]) -> float:
    shoulder, elbow, wrist = points
    first = np.array([shoulder.x - elbow.x, shoulder.y - elbow.y], dtype=np.float64)
    second = np.array([wrist.x - elbow.x, wrist.y - elbow.y], dtype=np.float64)
    denom = float(np.linalg.norm(first) * np.linalg.norm(second))
    if denom < 1e-9:
        return math.nan
    cosine = float(np.clip(np.dot(first, second) / denom, -1.0, 1.0))
    return math.degrees(math.acos(cosine))


def point_confidence(point: Any) -> float:
    return min(float(point.visibility), float(point.presence))


def get_landmarker(model_path: Path) -> vision.PoseLandmarker:
    if not model_path.exists():
        model_path.parent.mkdir(parents=True, exist_ok=True)
        print(f"Downloading pose model to {model_path}", flush=True)
        urllib.request.urlretrieve(MODEL_URL, model_path)
    options = vision.PoseLandmarkerOptions(
        # Use bytes: the Windows C++ reader rejects this workspace's Cyrillic path.
        base_options=mp_python.BaseOptions(model_asset_buffer=model_path.read_bytes()),
        running_mode=vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.35,
        min_pose_presence_confidence=0.35,
        min_tracking_confidence=0.35,
    )
    return vision.PoseLandmarker.create_from_options(options)


def extract_video(path: Path, landmarker: vision.PoseLandmarker) -> tuple[np.ndarray, np.ndarray]:
    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        raise ValueError("OpenCV could not open the video")

    fps = float(capture.get(cv2.CAP_PROP_FPS))
    if not math.isfinite(fps) or fps <= 0:
        fps = 25.0
    frame_step = max(1, round(fps / SAMPLE_FPS))
    angles: list[float] = []
    confidences: list[float] = []
    frame_index = 0

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if frame_index % frame_step == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = landmarker.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
                pose = result.pose_landmarks[0] if result.pose_landmarks else None
                if pose is None:
                    angles.append(math.nan)
                    confidences.append(0.0)
                else:
                    candidates = []
                    for side, indices in LANDMARKS.items():
                        points = [pose[index] for index in indices]
                        score = sum(point_confidence(point) for point in points) / 3.0
                        candidates.append((score, side, points))
                    score, _, points = max(candidates, key=lambda item: item[0])
                    angles.append(elbow_angle(points) if score >= 0.4 else math.nan)
                    confidences.append(score)
            frame_index += 1
    finally:
        capture.release()

    values = np.asarray(angles, dtype=np.float64)
    confidence = np.asarray(confidences, dtype=np.float64)
    return values, confidence


def features_from_angles(angles: np.ndarray, confidence: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    valid = np.isfinite(angles) & (confidence >= 0.4)
    valid_ratio = float(valid.mean()) if len(valid) else 0.0
    if valid.any():
        indices = np.flatnonzero(valid)
        clean = np.interp(np.arange(len(angles)), indices, angles[indices])
    else:
        clean = np.full(max(1, len(angles)), 180.0, dtype=np.float64)

    x_old = np.linspace(0.0, 1.0, num=len(clean))
    x_new = np.linspace(0.0, 1.0, num=CURVE_POINTS)
    curve = np.interp(x_new, x_old, clean)
    differences = np.diff(clean) if len(clean) > 1 else np.array([0.0])
    complete_cycles = count_complete_cycles(clean)
    summary = np.array(
        [
            valid_ratio,
            float(np.mean(clean)),
            float(np.std(clean)),
            float(np.min(clean)),
            float(np.max(clean)),
            float(np.percentile(clean, 10)),
            float(np.percentile(clean, 25)),
            float(np.percentile(clean, 50)),
            float(np.percentile(clean, 75)),
            float(np.percentile(clean, 90)),
            float(np.mean(clean <= FLEXED_DEGREES)),
            float(np.mean(clean >= EXTENDED_DEGREES)),
            float(np.mean(np.abs(differences))),
            float(np.mean(differences > 0)),
            float(np.mean(differences < 0)),
            float(complete_cycles),
        ],
        dtype=np.float64,
    )
    return np.concatenate([curve, summary]), clean


def count_complete_cycles(angles: np.ndarray) -> int:
    flexed = False
    cycles = 0
    for angle in angles:
        if not math.isfinite(float(angle)):
            continue
        if angle < FLEXED_DEGREES:
            flexed = True
        elif angle > EXTENDED_DEGREES and flexed:
            cycles += 1
            flexed = False
    return cycles


def feature_names() -> list[str]:
    names = [f"angle_t{index:02d}" for index in range(CURVE_POINTS)]
    return names + [
        "valid_ratio", "mean", "std", "min", "max", "p10", "p25", "p50",
        "p75", "p90", "fraction_flexed", "fraction_extended", "mean_abs_delta",
        "fraction_increasing", "fraction_decreasing", "complete_cycles",
    ]


def make_candidates() -> list[tuple[str, Any]]:
    candidates: list[tuple[str, Any]] = []
    for c in (0.01, 0.1, 1.0):
        candidates.append((
            f"logistic-regression-c{c:g}",
            make_pipeline(StandardScaler(), LogisticRegression(C=c, class_weight="balanced", max_iter=3000, random_state=42)),
        ))
    candidates.extend([
        ("extra-trees-depth2-leaf2", ExtraTreesClassifier(n_estimators=80, max_depth=2, min_samples_leaf=2, class_weight="balanced", random_state=42, n_jobs=-1)),
        ("extra-trees-depth2-leaf5", ExtraTreesClassifier(n_estimators=80, max_depth=2, min_samples_leaf=5, class_weight="balanced", random_state=42, n_jobs=-1)),
        ("extra-trees-depth4-leaf2", ExtraTreesClassifier(n_estimators=80, max_depth=4, min_samples_leaf=2, class_weight="balanced", random_state=42, n_jobs=-1)),
        ("random-forest-depth2-leaf2", RandomForestClassifier(n_estimators=80, max_depth=2, min_samples_leaf=2, class_weight="balanced", random_state=42, n_jobs=-1)),
        ("random-forest-depth4-leaf2", RandomForestClassifier(n_estimators=80, max_depth=4, min_samples_leaf=2, class_weight="balanced", random_state=42, n_jobs=-1)),
    ])
    return candidates


def metrics(labels: np.ndarray, predicted: np.ndarray) -> dict[str, Any]:
    matrix = confusion_matrix(labels, predicted, labels=[0, 1])
    return {
        "balanced_accuracy": float(balanced_accuracy_score(labels, predicted)),
        "f1_complete": float(f1_score(labels, predicted, pos_label=1, zero_division=0)),
        "confusion_matrix": matrix.tolist(),
        "confusion_matrix_labels": ["Incomplete", "Complete"],
    }


def export_model(model: Any, path: Path) -> None:
    payload: dict[str, Any] = {
        "version": 1,
        "labels": {"0": "Incomplete", "1": "Complete"},
        "feature_names": feature_names(),
        "probability_threshold": 0.5,
        "input": {"curve_points": CURVE_POINTS, "sample_fps": SAMPLE_FPS},
    }
    if isinstance(model, (ExtraTreesClassifier, RandomForestClassifier)):
        trees = []
        for estimator in model.estimators_:
            tree = estimator.tree_
            values = tree.value[:, 0, :]
            totals = np.maximum(values.sum(axis=1, keepdims=True), 1e-12)
            trees.append({
                "left": tree.children_left.tolist(), "right": tree.children_right.tolist(),
                "feature": tree.feature.tolist(), "threshold": tree.threshold.tolist(),
                "probabilities": (values / totals).tolist(),
            })
        kind = "extra_trees" if isinstance(model, ExtraTreesClassifier) else "random_forest"
        payload.update({"name": f"e02-elbow-sequence-{kind}", "kind": kind, "trees": trees})
    else:
        scaler = model.named_steps["standardscaler"]
        classifier = model.named_steps["logisticregression"] if "logisticregression" in model.named_steps else None
        if classifier is None:
            raise ValueError("Unsupported model type for JSON export")
        payload.update({
            "name": "e02-elbow-sequence-logistic-regression", "kind": "logistic_regression",
            "scaler_mean": scaler.mean_.tolist(), "scaler_scale": scaler.scale_.tolist(),
            "coefficients": classifier.coef_[0].tolist(), "intercept": float(classifier.intercept_[0]),
        })
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "An upper limb stroke rehabilitation exercise video",
    )
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent / "artifacts")
    parser.add_argument("--model", type=Path, default=Path(__file__).resolve().parent / "models" / "pose_landmarker_lite.task")
    parser.add_argument("--reuse-features", action="store_true", help="Reuse e02_features.csv from the output directory")
    args = parser.parse_args()

    rows: list[dict[str, Any]] = []
    cache_path = args.output / "e02_features.csv"
    args.output.mkdir(parents=True, exist_ok=True)

    train_dir = args.dataset / EXERCISE_DIR
    manifest: list[tuple[Path, str, str, int]] = []
    for label_name, label in (("Incomplete", 0), ("Complete", 1)):
        for split in ("Train", "Test"):
            folder = train_dir / label_name / split
            for path in sorted(folder.glob("*.mp4")):
                manifest.append((path, label_name, split, label))
    if not manifest:
        raise SystemExit(f"No E02 mp4 files found under {train_dir}")

    train_people = {participant_id(path) for path, _, split, _ in manifest if split == "Train"}
    test_people = {participant_id(path) for path, _, split, _ in manifest if split == "Test"}
    overlap = train_people & test_people
    if overlap:
        raise SystemExit(f"Participant leakage between Train and Test: {sorted(overlap)}")

    print(
        f"E02: {sum(split == 'Train' for _, _, split, _ in manifest)} Train / "
        f"{sum(split == 'Test' for _, _, split, _ in manifest)} Test; "
        f"Train participants {sorted(train_people)}, Test participants {sorted(test_people)}",
        flush=True,
    )

    if args.reuse_features and cache_path.exists():
        with cache_path.open(newline="", encoding="utf-8") as handle:
            for record in csv.DictReader(handle):
                rows.append({
                    "file": record["file"], "participant": record["participant"],
                    "split": record["split"], "label": record["label"],
                    "valid_pose_ratio": float(record["valid_pose_ratio"]),
                    "complete_cycles_by_threshold": float(record.get("complete_cycles_by_threshold", record[feature_names()[-1]])),
                    "features": np.asarray([float(record[name]) for name in feature_names()], dtype=np.float64),
                })
    else:
        extraction_errors: list[str] = []
        landmarker = get_landmarker(args.model)
        try:
            for index, (path, label_name, split, _) in enumerate(manifest, start=1):
                try:
                    angles, confidence = extract_video(path, landmarker)
                    vector, clean = features_from_angles(angles, confidence)
                    row = {
                        "file": path.name, "participant": participant_id(path), "split": split,
                        "label": label_name,
                        "valid_pose_ratio": round(float(np.mean(confidence >= 0.4)), 4) if len(confidence) else 0.0,
                        "complete_cycles_by_threshold": count_complete_cycles(clean), "features": vector,
                    }
                    rows.append(row)
                    print(f"[{index}/{len(manifest)}] {split} {label_name} {path.name}", flush=True)
                except Exception as error:
                    extraction_errors.append(path.name)
                    print(f"[{index}/{len(manifest)}] ERROR {path.name}: {error}", flush=True)
        finally:
            landmarker.close()

        if extraction_errors:
            raise SystemExit(
                f"Pose extraction failed for {len(extraction_errors)} videos; "
                "metrics were not calculated to avoid a partial-sample report. "
                f"First failures: {', '.join(extraction_errors[:10])}"
            )
    if not rows:
        raise SystemExit("Pose extraction failed for every video")
    with cache_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["file", "participant", "split", "label", "valid_pose_ratio", "complete_cycles_by_threshold", *feature_names()])
        for row in rows:
            writer.writerow([row["file"], row["participant"], row["split"], row["label"], row["valid_pose_ratio"], row["complete_cycles_by_threshold"], *row["features"].tolist()])

    train_rows = [row for row in rows if row["split"] == "Train"]
    test_rows = [row for row in rows if row["split"] == "Test"]
    x_train = np.stack([row["features"] for row in train_rows])
    y_train = np.asarray([1 if row["label"] == "Complete" else 0 for row in train_rows])
    groups = np.asarray([row["participant"] for row in train_rows])
    x_test = np.stack([row["features"] for row in test_rows])
    y_test = np.asarray([1 if row["label"] == "Complete" else 0 for row in test_rows])

    if set(y_train) != {0, 1} or set(y_test) != {0, 1}:
        raise SystemExit("Both classes must be present in Train and Test")
    if len(np.unique(groups)) < 2:
        raise SystemExit("At least two participants are required for grouped Train cross-validation")

    cv = LeaveOneGroupOut()
    candidates = []
    for name, candidate in make_candidates():
        predicted = np.zeros(len(y_train), dtype=np.int64)
        for train_indices, validation_indices in cv.split(x_train, y_train, groups):
            candidate.fit(x_train[train_indices], y_train[train_indices])
            predicted[validation_indices] = candidate.predict(x_train[validation_indices])
        score = metrics(y_train, predicted)
        candidates.append({"name": name, "model": candidate, "predicted": predicted, "metrics": score})
    candidates.sort(key=lambda item: (item["metrics"]["balanced_accuracy"], item["metrics"]["f1_complete"]), reverse=True)
    selected = candidates[0]
    model = selected["model"]
    cv_predicted = selected["predicted"]
    model.fit(x_train, y_train)
    model_predicted = model.predict(x_test)
    baseline_predicted = np.asarray(
        [1 if row["complete_cycles_by_threshold"] > 0 else 0 for row in test_rows],
        dtype=np.int64,
    )

    for row, predicted, probability in zip(test_rows, model_predicted, model.predict_proba(x_test)[:, 1]):
        row["predicted"] = "Complete" if predicted == 1 else "Incomplete"
        row["probability_complete"] = float(probability)
    with (args.output / "e02_test_predictions.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["file", "participant", "actual", "predicted", "probability_complete", "baseline_prediction", "pose_coverage"])
        writer.writeheader()
        for row, baseline in zip(test_rows, baseline_predicted):
            writer.writerow({
                "file": row["file"], "participant": row["participant"], "actual": row["label"],
                "predicted": row["predicted"], "probability_complete": round(row["probability_complete"], 4),
                "baseline_prediction": "Complete" if baseline == 1 else "Incomplete",
                "pose_coverage": row["valid_pose_ratio"],
            })

    report = {
        "dataset": "An upper limb stroke rehabilitation exercise video",
        "exercise": "2_Extending the Elbow (E02)",
        "label_mapping": {"Incomplete": 0, "Complete": 1},
        "split": {
            "train_videos": len(train_rows), "test_videos": len(test_rows),
            "train_participants": sorted(train_people), "test_participants": sorted(test_people),
            "participant_overlap": sorted(overlap),
            "train_class_counts": {label: sum(row["label"] == label for row in train_rows) for label in ("Incomplete", "Complete")},
            "test_class_counts": {label: sum(row["label"] == label for row in test_rows) for label in ("Incomplete", "Complete")},
        },
        "features": "64-point normalized-time elbow-angle trajectory plus 16 summary features",
        "custom_model": selected["name"],
        "baseline": f"At least one ordered cycle with elbow angle < {FLEXED_DEGREES:g}° followed by > {EXTENDED_DEGREES:g}°",
        "train_grouped_cross_validation": {
            "method": "LeaveOneGroupOut by filename participant prefix",
            **metrics(y_train, cv_predicted),
        },
        "model_selection": {
            "criterion": "highest Train leave-one-participant-out balanced accuracy, then F1",
            "candidates": [{"name": item["name"], **item["metrics"]} for item in candidates],
        },
        "held_out_test": {
            "custom_model": metrics(y_test, model_predicted),
            "threshold_baseline": metrics(y_test, baseline_predicted),
        },
        "limitations": [
            "The held-out test set contains videos from one participant only.",
            "Video labels are used as clip-level labels; this does not prove every movement within a clip has the same quality.",
            "Results are a technical prototype evaluation, not a clinical assessment.",
        ],
    }
    (args.output / "e02_metrics.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    export_model(model, args.output / "e02_model.json")
    frontend_metrics_path = Path(__file__).resolve().parents[1] / "frontend" / "src" / "data" / "e02-evaluation.json"
    frontend_metrics_path.parent.mkdir(parents=True, exist_ok=True)
    frontend_summary = {
        "trainVideos": len(train_rows), "trainParticipants": len(train_people),
        "trainGroupedBalancedAccuracy": report["train_grouped_cross_validation"]["balanced_accuracy"],
        "trainGroupedF1": report["train_grouped_cross_validation"]["f1_complete"],
        "testVideos": len(test_rows), "testParticipants": len(test_people),
        "modelName": selected["name"],
        "modelBalancedAccuracy": report["held_out_test"]["custom_model"]["balanced_accuracy"],
        "modelF1": report["held_out_test"]["custom_model"]["f1_complete"],
        "modelConfusionMatrix": report["held_out_test"]["custom_model"]["confusion_matrix"],
        "baselineBalancedAccuracy": report["held_out_test"]["threshold_baseline"]["balanced_accuracy"],
        "baselineF1": report["held_out_test"]["threshold_baseline"]["f1_complete"],
        "baselineConfusionMatrix": report["held_out_test"]["threshold_baseline"]["confusion_matrix"],
    }
    frontend_metrics_path.write_text(json.dumps(frontend_summary, indent=2), encoding="utf-8")
    print(json.dumps(report["held_out_test"], indent=2), flush=True)
    print(f"Artifacts written to {args.output.resolve()}", flush=True)


if __name__ == "__main__":
    main()
