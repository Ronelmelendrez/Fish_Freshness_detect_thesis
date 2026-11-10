import { useCameraPermission } from 'react-native-vision-camera';

/** Camera permission gate for the live scan (wraps VisionCamera). */
export function useCameraPermissions() {
  const permission = useCameraPermission();
  return {
    status: permission.status,
    hasPermission: permission.hasPermission,
    canRequest: permission.canRequestPermission,
    request: permission.requestPermission,
  };
}