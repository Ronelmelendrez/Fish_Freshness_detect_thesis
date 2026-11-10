# models/

This folder holds the on-device inference model used by `features/detection`.

## Current state

`fish_freshness_yolov8n.tflite` is a **placeholder** (a few bytes) so the
Metro bundle can resolve the asset. It is **not a valid model** and will fail
if you switch the inference backend to `tflite`.

## How to swap in the real model

1. Export the trained YOLOv8 (or classifier) from your training pipeline to a
   TFLite file (see Implementation Plan Phase 5 / 6).
2. Name it `fish_freshness_yolov8n.tflite` and replace the placeholder here.
3. Confirm the tensor layout matches `src/config/modelConfig.ts`:
   - input: `640 x 640 x 3` RGB normalized `0..1`
   - output tensor 0: per-condition class scores (softmax over the label map
     in `modelConfig.partLabels`); optionally tensor with bounding boxes
4. Set the backend in `src/config/modelConfig.ts` (or `.env.local`):

   ```sh
   EXPO_PUBLIC_MODEL_BACKEND=tflite
   ```

5. Build a development client — the real-time stack is **native-only**:

   ```sh
   npx expo prebuild
   npx expo run:android   # or run:ios on macOS
   ```

   Expo Go does not include vision-camera / Nitro / TFLite native code.

## Real-time stack

- `react-native-vision-camera` v5 (frame output, worklet on a background runtime)
- `react-native-vision-camera-worklets` + `react-native-worklets` (worklet runtime)
- `react-native-nitro-modules` / `react-native-nitro-image` (Nitro)
- `react-native-fast-tflite` v3 (TFLite inference)

The live pipeline lives in `features/detection/services` (`frameProcessor.ts`,
`preprocess.ts`, `postprocess.ts`) and is consumed by
`features/scan/components/LiveCameraView.tsx`.

## Useful links

- Inspect tensor shapes: <https://netron.app>
- VisionCamera v5 frame output docs: <https://react-native-vision-camera.com/docs/frame-output>
- react-native-fast-tflite README inside `node_modules/react-native-fast-tflite/README.md`