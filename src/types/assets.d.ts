/** Metro asset module declarations and its ambient `require`. */

declare module '*.tflite' {
  /** Metro resolves `require()` of a bundled asset to a numeric resource id. */
  const assetId: number;
  export default assetId;
}

declare const require: (id: string) => any;