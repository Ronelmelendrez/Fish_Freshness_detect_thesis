// Worklets (Software Mansion) transforms `'worklet'`-directive functions,
// powering react-native-vision-camera frame processing on a background runtime.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};