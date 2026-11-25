# E02 movement classifier

`train_e02.py` evaluates elbow-extension clips from the supplied dataset. It extracts elbow-angle sequences with MediaPipe Pose Landmarker, selects a small sequence classifier using participant-grouped cross-validation on normalized-time angle features, and compares it with the live app's fixed-angle cycle rule.

The script reads only `Exercise/2_Extending the Elbow/{Complete,Incomplete}/{Train,Test}`. It checks that filename participant prefixes do not overlap between the supplied splits, uses leave-one-participant-out cross-validation within `Train`, and evaluates the fitted model and threshold baseline on `Test` once. If any video cannot be processed, it stops without writing evaluation metrics for a partial sample.

## Run on Windows

From the repository root, in PowerShell:

```powershell
python -m venv ml/.venv
ml/.venv/Scripts/python.exe -m pip install -r ml/requirements.txt
ml/.venv/Scripts/python.exe ml/train_e02.py
```

The first run downloads Google's MediaPipe Pose Landmarker Lite task model to `ml/models/`. Keep the dataset at the repository root, or pass its directory explicitly:

```powershell
ml/.venv/Scripts/python.exe ml/train_e02.py --dataset "D:\data\An upper limb stroke rehabilitation exercise video"
```

Generated files go to the ignored `ml/artifacts/` directory:

- `e02_metrics.json` — grouped training CV and held-out Test metrics, participant IDs, class counts and limitations.
- `e02_test_predictions.csv` — per-video test predictions for both approaches.
- `e02_features.csv` — extracted feature rows for reproducibility.
- `e02_model.json` — selected model parameters in a portable JSON format for a later frontend inference adapter.
- `frontend/src/data/e02-evaluation.json` — the compact evaluation summary shown on the technology page.

To rerun model selection using existing extracted features without decoding the videos again, pass `--reuse-features`.

The first filename field is treated as the participant ID. For this E02 split, Train has prefixes `01`–`05` and Test has prefix `08`. This is participant-disjoint, but Test covers only one participant and 20 clips, so metrics are preliminary. The video-level Complete/Incomplete labels also do not establish that every movement inside a clip has the same quality. This is a technical prototype, not a clinical assessment.

The current held-out result is intentionally shown as a warning: the selected Extra Trees model scores 0.30 balanced accuracy / 0.36 F1, while the angle-threshold baseline scores 0.45 / 0.62. The trained model is not enabled in live sessions because it did not beat the baseline on the held-out participant.
