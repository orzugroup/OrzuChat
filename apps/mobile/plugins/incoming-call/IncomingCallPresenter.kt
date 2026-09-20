package ai.orzu.chat

import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Posts the ongoing incoming-call notification with a Full-Screen Intent.
 * Android then launches [IncomingCallActivity] over the lock screen (WhatsApp-style).
 */
object IncomingCallPresenter {
  const val CHANNEL_ID = "calls_v2"
  const val EXTRA_CALL_ID = "call_id"
  const val EXTRA_KIND = "kind"
  const val EXTRA_CALLER_ID = "caller_id"
  const val EXTRA_TITLE = "caller_title"
  const val EXTRA_BODY = "caller_body"
  const val EXTRA_ACTION = "call_action"

  private const val TAG = "incoming_call"

  fun show(context: Context, data: Map<String, String>, title: String, body: String) {
    val callId = data["call_id"] ?: return
    ensureChannel(context)

    val open = activityIntent(context, data, title, body, "open")
    val accept = activityIntent(context, data, title, body, "accept")
    val decline = activityIntent(context, data, title, body, "decline")
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val openPi = PendingIntent.getActivity(context, callId.hashCode(), open, flags)
    val acceptPi = PendingIntent.getActivity(context, callId.hashCode() + 2, accept, flags)
    val declinePi = PendingIntent.getActivity(context, callId.hashCode() + 1, decline, flags)

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(resolveSmallIcon(context))
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setTimeoutAfter(45_000)
      .setContentIntent(openPi)
      .setFullScreenIntent(openPi, true)
      .addAction(0, "Decline", declinePi)
      .addAction(0, "Answer", acceptPi)

    try {
      NotificationManagerCompat.from(context).notify(TAG, notificationId(callId), builder.build())
    } catch (_: SecurityException) {
      return
    }

    // Foreground: Android suppresses FSI, so start the incoming activity ourselves.
    if (isAppForeground(context)) {
      try {
        context.startActivity(open)
      } catch (_: Throwable) {
        // FSI on the notification is the fallback.
      }
    }
  }

  fun dismiss(context: Context, callId: String? = null) {
    val manager = NotificationManagerCompat.from(context)
    if (callId.isNullOrBlank()) {
      manager.cancel(TAG, 71001)
      return
    }
    manager.cancel(TAG, notificationId(callId))
  }

  fun activityIntent(
    context: Context,
    data: Map<String, String>,
    title: String,
    body: String,
    action: String,
  ): Intent {
    return Intent(context, IncomingCallActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra(EXTRA_CALL_ID, data["call_id"])
      putExtra(EXTRA_KIND, data["kind"] ?: "video")
      putExtra(EXTRA_CALLER_ID, data["caller_id"] ?: "")
      putExtra(EXTRA_TITLE, title)
      putExtra(EXTRA_BODY, body)
      putExtra(EXTRA_ACTION, action)
    }
  }

  fun appDeepLink(callId: String, kind: String, callerId: String, action: String): Uri {
    return Uri.parse(
      "orzuchat://incoming?call_id=${Uri.encode(callId)}&kind=${Uri.encode(kind)}&caller_id=${Uri.encode(callerId)}&action=${Uri.encode(action)}",
    )
  }

  private fun notificationId(callId: String): Int {
    val hashed = callId.hashCode()
    return if (hashed == 0) 71001 else hashed
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val sound = Uri.parse("android.resource://${context.packageName}/raw/ringtone")
    val channel = NotificationChannel(CHANNEL_ID, "Calls", NotificationManager.IMPORTANCE_MAX).apply {
      description = "Incoming calls"
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setBypassDnd(true)
      enableVibration(true)
      enableLights(true)
      setSound(
        sound,
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build(),
      )
    }
    manager.createNotificationChannel(channel)
  }

  private fun isAppForeground(context: Context): Boolean {
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager ?: return false
    val processes = manager.runningAppProcesses ?: return false
    return processes.any {
      it.processName == context.packageName &&
        it.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
    }
  }

  private fun resolveSmallIcon(context: Context): Int {
    val names = arrayOf("notification_icon", "ic_launcher", "ic_stat_name")
    for (name in names) {
      val id = context.resources.getIdentifier(name, "drawable", context.packageName)
      if (id != 0) return id
    }
    return android.R.drawable.stat_sys_phone_call
  }
}
