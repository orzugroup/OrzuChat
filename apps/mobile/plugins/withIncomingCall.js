const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const PERMISSIONS = [
  'android.permission.WAKE_LOCK',
  'android.permission.VIBRATE',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.TURN_SCREEN_ON',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MICROPHONE',
  'android.permission.FOREGROUND_SERVICE_CAMERA',
  'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
  'android.permission.MANAGE_OWN_CALLS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
];

const KOTLIN_FILES = [
  'IncomingCallPresenter.kt',
  'IncomingCallActivity.kt',
  'OrzuFirebaseMessagingService.kt',
];

function withIncomingCall(config) {
  config = AndroidConfig.Permissions.withPermissions(config, PERMISSIONS);
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const dest = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'java', 'ai', 'orzu', 'chat');
      fs.mkdirSync(dest, { recursive: true });
      const srcDir = path.join(__dirname, 'incoming-call');
      for (const file of KOTLIN_FILES) {
        fs.copyFileSync(path.join(srcDir, file), path.join(dest, file));
      }
      return mod;
    },
  ]);
  return withAndroidManifest(config, (mod) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    const activities = app.activity ?? [];
    for (const activity of activities) {
      const name = activity.$?.['android:name'] ?? '';
      if (!name.endsWith('MainActivity')) continue;
      activity.$['android:showWhenLocked'] = 'true';
      activity.$['android:turnScreenOn'] = 'true';
      activity.$['android:excludeFromRecents'] = 'false';
    }

    if (!activities.some((item) => item.$?.['android:name'] === 'ai.orzu.chat.IncomingCallActivity')) {
      activities.push({
        $: {
          'android:name': 'ai.orzu.chat.IncomingCallActivity',
          'android:excludeFromRecents': 'true',
          'android:exported': 'false',
          'android:launchMode': 'singleInstance',
          'android:showWhenLocked': 'true',
          'android:turnScreenOn': 'true',
          'android:taskAffinity': '',
          'android:theme': '@android:style/Theme.DeviceDefault.NoActionBar',
        },
      });
      app.activity = activities;
    }

    const services = app.service ?? [];
    let replaced = false;
    for (const service of services) {
      const name = service.$?.['android:name'] ?? '';
      if (!name.includes('ExpoFirebaseMessagingService')) continue;
      service.$['android:name'] = 'ai.orzu.chat.OrzuFirebaseMessagingService';
      replaced = true;
    }
    if (!replaced) {
      services.push({
        $: {
          'android:name': 'ai.orzu.chat.OrzuFirebaseMessagingService',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' } }],
          },
        ],
      });
    }
    app.service = services;
    return mod;
  });
}

module.exports = withIncomingCall;
