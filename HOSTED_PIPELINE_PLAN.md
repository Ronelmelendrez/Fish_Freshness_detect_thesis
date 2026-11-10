# Hosted Pipeline Plan: Gate, Crop, Grade (Roboflow Workflows)

**Project:** A Mobile Application for Fish Freshness Detection using Deep Learning
**Decision:** replace on-device TFLite inference with a hosted pipeline. The phone captures frames, a server calls Roboflow Workflows, and the app shows the verdict.
**Status legend:** ✅ built and tested here · 🟡 built, untested against the live API · ⬜ you do this

---

## 1. What changes and why

| Before (on-device) | After (hosted) |
|---|---|
| YOLOv8n-seg TFLite runs on the phone, every frame | Phone sends snapshots; Roboflow runs the models |
| One model finds region, freshness and defect together (overlap collapse) | Three small jobs: **gate** (find eye/skin) → **crop** → **grade** (fresh/spoiled) |
| Lag from per-frame inference, worklets, GC | No inference on the phone, so the lag source disappears |
| Works offline | **Needs internet** |
| "Real-time like a QR code" | **Near-real-time polling** (about 1-2 checks per second) |
| Affected-area % from defect masks | Not available unless you keep an optional segmentation block (see 9) |

Why the design is sound: the classifier only ever sees tight crops of the eye or skin, so it cannot be confused by overlapping polygons. The gate stops bad frames from being graded at all.

---

## 2. Architecture

```
 Phone (Expo / VisionCamera)               Your server (FastAPI)               Roboflow (hosted)
 ───────────────────────────               ─────────────────────               ─────────────────
 snapshot @ ~1.5 fps, 640 px ─────────►  /gate
   (one request in flight)                 1. sharpness / brightness check
                                              (rejects blur/dark BEFORE any API call)
                                           2. call GATE workflow  ───────────►  detector (eye, skin)
                                           3. size + confidence rules ◄───────  boxes
 ◄── status + hint ("Move closer") ────
 3 consecutive "ok" responses
 take ONE high-res photo (1600 px) ───►  /grade
                                           1. re-check gate on the big photo
                                           2. call GRADE workflow ───────────►  detector → filter →
                                                                                dynamic crop →
                                                                                eye grader / skin grader
                                           3. combine (severe-wins, low-conf → rescan)
 ◄── verdict + per-part grade + conf ──
```

**Key design choices**
1. **Two workflows, not one.** `fish-gate` (detector only, cheap) is polled. `fish-grade` (detector + crops + classifiers) runs **once per scan**. This cuts API usage and lets grading use a sharp, high-resolution photo. An eye is small in a 640 px frame, and crops of it would be too blurry to grade.
2. **Quality checks run on the server before calling Roboflow.** A blurry or dark frame is rejected for free.
3. **The API key lives only on the server.** The app holds a separate app token.
4. **The server is stateless.** The "3 consecutive frames" stability count lives in the app.

---

## 3. Scan flow (what the user sees)

Keep your current flow so existing data stays valid: **Home → Eye scan → Skin scan → Result.**

- Each scan screen tells the server what it requires: `required=eye` or `required=skin`.
- A future `required=both` mode exists for whole-fish photos (see Section 4, Gap A).
- Species selection becomes optional metadata. The new models are not species-specific. Keep the Home species list only if you still want per-species reporting.

Scan states (same language as the gate rules in the existing plan):

| State | Meaning | Hint shown |
|---|---|---|
| `searching` | nothing usable yet | "Point at the fish's eye" |
| `hint` | found something but a rule failed | "Move closer" / "Hold steady" / "More light" / "Less glare" |
| `detected` | gate passing, counting 1-3 | progress ring fills |
| `locked` | 3 in a row, high-res photo taken | "Grading…" |
| `result` | verdict returned | FRESH / NOT FRESH |
| `rescan` | low confidence | "Not sure, scan again" |
| `offline` | no network / server error | "No connection, try again" |

---

## 4. Data plan (reuse what you have, fill two gaps)

### Reuse: no relabeling
`tools/prepare_datasets.py` ✅ converts your YOLOv8-seg export:
- **Detector dataset** (classes `eye`, `skin`): each whole-region polygon becomes a tight box.
- **Eye crops** and **skin crops**, each as `fresh/` and `spoiled/` folders.
- Defect polygons are ignored.
- The original train/valid/test split is preserved, so augmented copies never leak across splits.
- Degenerate boxes are dropped.

```
python tools/prepare_datasets.py --src <roboflow_export> --out ./prepared --zip
```

Upload `detector.zip` to a new Roboflow **Object Detection** project. Upload `eye_cls.zip` and `skin_cls.zip` to two **Classification** projects.

### Gap A: whole-fish photos (only needed for `required=both`)
Your images are **close-ups** (eye images and skin images are separate). A detector trained only on close-ups will find an eye that fills the frame, but not a small eye on a whole fish. Two options:
- **Recommended: keep the two-step flow** (eye screen then skin screen). It works with your existing data.
- Add 200+ whole-fish side-view photos with both `eye` and `skin` boxes if you want a single-shot scan later.

### Gap B: negative images
The gate must say "nothing here". Add 100-200 photos **without** a fish part (hands, ice, trays, tables, other fish) to the detector project as null images. Without them the gate will fire on random objects.

### Collection checklist
Wet and dry fish, glare, hands in frame, shade and sun, at least 3 different phones, market backgrounds. Do not train only on lab-clean photos.

---

## 5. Roboflow setup

### 5.1 Train three models
| Model | Type | Classes | Data |
|---|---|---|---|
| Gate | Object detection | `eye`, `skin` (optional: `fish`, `gill`) | `detector.zip` + negatives |
| Eye grader | Classification | `fresh`, `spoiled` | `eye_cls.zip` |
| Skin grader | Classification | `fresh`, `spoiled` | `skin_cls.zip` |

- Use only the labels you actually have: `fresh` and `spoiled`. There is no "moderate" class in your data, so do not add one.
- Note the dataset **version** of each model for Chapter 3.
- Label rule for `skin`: keep your current region definition. Consistency matters more than which rule you pick.

### 5.2 Workflow `fish-gate`
Input image → Object Detection Model (gate) → Detections Filter (keep `eye`/`skin`, confidence ≥ 0.6) → Output `predictions`.

### 5.3 Workflow `fish-grade`
Input image → Object Detection Model (gate) → Detections Filter (confidence ≥ 0.6), then two branches:
- Filter `eye` → Dynamic Crop → Classification (eye grader) → Output `eye_grade`
- Filter `skin` → Dynamic Crop → Classification (skin grader) → Output `skin_grade`
- Also output `predictions`.

Block names can differ slightly in the current editor. Check what is listed. Name your outputs to match `.env` (`GATE_OUTPUT_KEY`, `EYE_GRADE_KEY`, `SKIN_GRADE_KEY`).

### 5.4 Test before wiring the app
Run both workflows in Roboflow's web preview with real market photos, including bad ones (blurry, dark, no fish).

---

## 6. Backend (`server/`) 🟡

FastAPI. The Roboflow SDK call is the only part not testable offline.

| Endpoint | Purpose |
|---|---|
| `GET /health` | liveness |
| `POST /gate` | image + `required` → `{status, message, parts, quality}` |
| `POST /grade` | high-res image + `required` → `{status, verdict, parts{grade, confidence}, note}` |

**Gate rules** (all configurable by environment variable)

| Rule | Default |
|---|---|
| Required part(s) detected with confidence ≥ | 0.6 |
| Eye box width ≥ fraction of image width | 0.08 (tune; see risk R4) |
| Skin box width ≥ fraction of image width | 0.20 |
| Sharpness (Laplacian variance at 640 px) ≥ | 60 |
| Mean brightness between | 55 and 225 |
| Stability (app side) | 3 consecutive OK |

**Combine rule** (binary, severe-wins)
- All required parts fresh → **FRESH**
- Any part spoiled → **NOT FRESH**; if eye and skin disagree, the note says so
- Any grade confidence below 0.6 → status `rescan` ("Not sure, scan again")
- Failed or low-confidence frames can be saved to `REVIEW_LOG_DIR` for labeling and retraining.

**Security**
- `ROBOFLOW_API_KEY` is read from the environment, never in the app or the repo.
- App requests carry `X-App-Token`. A simple rate limit is built in.
- This is enough for a thesis demo, not for a public app store release.

**Hosting options** (check current free tiers and pricing yourself): a small cloud app host, a cheap VPS, or your laptop with a tunnel for the defense demo. Pick one early because the phone needs a stable URL.

---

## 7. App changes (`app/`) 🟡

Replace the on-device frame-processor path with a remote scan loop.

| Module | Role |
|---|---|
| `remote/api.ts` | typed `gate()` and `grade()` calls with timeout and error mapping |
| `remote/stability.ts` | N-in-a-row tracker, resets on any non-OK |
| `remote/useRemoteScan.ts` | the loop: snapshot → resize → upload (one in flight) → state machine |
| existing `combineResults.ts` | still usable for display |

Behavior rules
- **Only one request in flight.** Never queue frames.
- Snapshots: resize to about 640 px for polling. The final grading photo is about 1600 px.
- Back off after errors (1 s, 2 s, 4 s, capped) and show the offline state.
- Stop polling when the screen is not focused. Stop after a long idle ("Still searching, check lighting").
- Remove: TFLite model loading, `react-native-fast-tflite`, the resize plugin and worklets from the scan path. This removes the whole lag investigation.

---

## 8. Phases

| # | Phase | Output | Who |
|---|---|---|---|
| 1 | Convert datasets | detector.zip, eye_cls.zip, skin_cls.zip | ✅ script ready, you run it |
| 2 | Collect negatives (+ whole-fish if wanted) | 100-200 null images | ⬜ you |
| 3 | Train 3 models in Roboflow | gate, eye grader, skin grader | ⬜ you |
| 4 | Build both workflows, test in the web preview | `fish-gate`, `fish-grade` | ⬜ you |
| 5 | Deploy backend, set `.env` | public URL | ⬜ you + 🟡 code |
| 6 | First live call, read the raw response, set output keys | working `/gate` | ⬜ you |
| 7 | App integration | scan screens use the hook | 🟡 code, ⬜ wiring |
| 8 | Tune thresholds on real photos | final `.env` | ⬜ you |
| 9 | Field test and Chapter 4 evaluation | metrics (Section 10) | ⬜ you |

---

## 9. Optional: keep the affected-area percentage

Roboflow Workflows can also run an **instance-segmentation** model. If you want "% cloudy area" and "% discolored area" in the report, add a segmentation block on the crops and compute the area ratio server-side. It reuses your defect polygons. This is optional. The binary verdict does not need it.

---

## 10. Evaluation for Chapter 4

| Item | How |
|---|---|
| Detector | mAP50, per-class P/R on the test split, plus a no-fish set to measure false triggers |
| Graders | accuracy, precision, recall, F1, confusion matrix, per part, on crops of the test split |
| **End-to-end** | real fish scanned through the app vs. a reference label; report accuracy, rescan rate, "uncertain" rate |
| Latency | time to first lock and time to verdict on your real network (median and worst) |
| Stability | no verdict flicker across repeated scans of the same fish |

**Important:** grader metrics on ground-truth crops are optimistic. Also report grader accuracy on crops **produced by the detector**, since that is what runs in production.

---

## 11. Thesis impact (decide and document)

Update Chapters 1-3, because the system changes materially:
- **Statement of the problem and objectives:** now "a mobile application that uses a hosted deep-learning pipeline"; remove claims of on-device or offline operation, if present.
- **Scope and limitations:** needs internet; near-real-time, not frame-by-frame; verdict is binary; accuracy depends on lighting and phone camera.
- **Methodology:** detector + crop + classifier architecture; dataset conversion from polygons; train/valid/test split preserved; record Roboflow versions.
- **Framework figure:** replace the on-device diagram with Section 2.
- **Also reconcile:** the 70/15/15 vs 80/10/10 split, the duplicate "3.9" numbering, and the 4,800 images / about 12,000 augmented total (not 24,000).
- **Narrative worth keeping:** the first design (one 14-class segmenter) failed on `*_spoiled` classes because of overlapping polygons, which motivated this design. This is a legitimate finding.

Ask your adviser before committing. Moving inference off the device changes what the project claims.

---

## 12. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | No internet at the market or the defense venue | Friendly offline state; test on mobile data; keep a recorded demo as backup |
| R2 | Latency or API cost (credits) | Poll only after quality passes; grade once; confirm Roboflow limits for your plan |
| R3 | Detector fires on non-fish things | Negative images (Gap B); raise `DET_CONF_MIN` |
| R4 | Eye too small in the frame for the size rule | The 8% default may be strict for whole-fish shots; with close-ups it is fine. Tune on real photos |
| R5 | Grader trained on perfect crops fails on detector crops | Retrain on detector-produced crops after the first field test |
| R6 | Workflow output shape differs from what the parser expects | First call: use `DEBUG=1` to see the raw response; set the output keys; the parser accepts several shapes |
| R7 | Server downtime during the demo | Deploy early; health check; fallback laptop server |
| R8 | API key leak | Key only on server; rotate if exposed; never commit `.env` |
| R9 | Eye and skin disagree | Severe-wins rule plus a note on the result screen |
| R10 | Privacy: market photos leave the phone | State it in the consent text; do not log images unless `REVIEW_LOG_DIR` is set |

---

## 13. Test checklist

**Backend (offline, mocked Roboflow)**
- Sharp, blurry, dark, bright images produce the right hint
- Missing part, low confidence, small box produce the right status
- Combine rule: agree, disagree, low confidence
- Auth and size limits

**Live (needs your key)**
1. Raw `/gate` response read once with `DEBUG=1`, output keys set
2. Good eye photo → `ok`; blurry → `hold_steady`; no fish → `searching`
3. `/grade` on known fresh and known spoiled fish; 20 each
4. Airplane mode → offline state, no crash, polling resumes
5. Screen leaves focus → polling stops
6. Phone locked or app backgrounded → no stuck requests

**Done when:** 3 consecutive OK reliably triggers a grade; the verdict matches reference on your field set at the accuracy you report; and offline and error states are all designed.

---

## 14. What is in the package

```
hosted/
  tools/prepare_datasets.py     ✅ tested on a synthetic dataset
  server/                       🟡 FastAPI + gate/grade logic + tests (mocked Roboflow)
  app/src/features/scan/remote/ 🟡 api / stability / useRemoteScan
  Hosted_Pipeline_Plan.md       this file
```

Not testable from here: the live Roboflow call and the real output shapes, device behavior of the camera loop, and the thresholds on real market photos.