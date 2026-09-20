package ai.orzu.chat

import android.content.Intent
import android.os.Bundle
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.ExpoFirebaseMessagingService

/**
 * Expo's default FCM path draws a shade notification. Incoming calls must instead
 * post a Full-Screen Intent so the lock screen opens [IncomingCallActivity].
 *
 * Notification-payload messages are stripped to data-only so [onMessageReceived]
 * still runs when the app is killed (otherwise Android would show the shade itself).
 */
class OrzuFirebaseMessagingService : ExpoFirebaseMessagingService() {
  override fun handleIntent(intent: Intent) {
    try {
      val extras = intent.extras
      if (extras != null && looksLikeIncomingCall(extras)) {
        val title = firstExtra(extras, "gcm.n.title", "gcm.notification.title", "title")
        val body = firstExtra(extras, "gcm.n.body", "gcm.notification.body", "message")
        if (!title.isNullOrBlank()) extras.putString("title", title)
        if (!body.isNullOrBlank() && extras.getString("caller_body").isNullOrBlank()) {
          extras.putString("caller_body", body)
        }
        extras.keySet().toList()
          .filter { it.startsWith("gcm.n.") || it.startsWith("gcm.notification.") }
          .forEach { extras.remove(it) }
      }
    } catch (_: Throwable) {
      // fall through to Expo
    }
    super.handleIntent(intent)
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    if (data["type"] == "incoming_call" && !data["call_id"].isNullOrBlank()) {
      val title = remoteMessage.notification?.title
        ?: data["title"]
        ?: "OrzuChat"
      val body = remoteMessage.notification?.body
        ?: data["caller_body"]
        ?: data["body"]
        ?: "Incoming call"
      IncomingCallPresenter.show(this, data, title, body)
      return
    }
    super.onMessageReceived(remoteMessage)
  }

  private fun looksLikeIncomingCall(extras: Bundle): Boolean {
    extras.keySet().forEach { key ->
      val value = extras.getString(key) ?: return@forEach
      if (
        value == "incoming_call" ||
        value == "calls_v2" ||
        value.contains("\"type\":\"incoming_call\"") ||
        value.contains("incoming_call")
      ) {
        return true
      }
    }
    return false
  }

  private fun firstExtra(extras: Bundle, vararg keys: String): String? {
    for (key in keys) {
      val value = extras.getString(key)
      if (!value.isNullOrBlank()) return value
    }
    return null
  }
}
