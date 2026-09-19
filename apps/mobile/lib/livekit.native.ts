export function registerLiveKitGlobals(): void {
  try {
    // Native WebRTC shims. Required before connecting to a room.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@livekit/react-native').registerGlobals();
  } catch {
    // Expo Go does not include native WebRTC. Use an EAS development build for calls.
  }
}
