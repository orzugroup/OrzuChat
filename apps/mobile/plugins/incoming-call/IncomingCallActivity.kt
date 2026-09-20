package ai.orzu.chat

import android.app.Activity
import android.app.KeyguardManager
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import android.graphics.drawable.GradientDrawable

/**
 * Native lock-screen incoming UI. Shown via Full-Screen Intent before React boots.
 * Answer / Decline hand off to the JS overlay through orzuchat://incoming.
 */
class IncomingCallActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    turnScreenOn("lock")
    val launchedAs = intent.getStringExtra(IncomingCallPresenter.EXTRA_ACTION)
    if (launchedAs == "decline" || launchedAs == "accept") {
      handOff(launchedAs)
      return
    }
    setContentView(buildUi())
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    val launchedAs = intent.getStringExtra(IncomingCallPresenter.EXTRA_ACTION)
    if (launchedAs == "decline" || launchedAs == "accept") {
      handOff(launchedAs)
    }
  }

  private fun buildUi(): View {
    val title = intent.getStringExtra(IncomingCallPresenter.EXTRA_TITLE) ?: "OrzuChat"
    val body = intent.getStringExtra(IncomingCallPresenter.EXTRA_BODY) ?: "Incoming call"

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setBackgroundColor(0xFF070B14.toInt())
      setPadding(dp(28), dp(72), dp(28), dp(48))
    }

    val kind = TextView(this).apply {
      text = body
      setTextColor(0xFF8EA0B8.toInt())
      textSize = 14f
      gravity = Gravity.CENTER
    }
    val name = TextView(this).apply {
      text = title
      setTextColor(Color.WHITE)
      textSize = 30f
      setTypeface(typeface, Typeface.BOLD)
      gravity = Gravity.CENTER
      setPadding(0, dp(28), 0, dp(8))
    }

    val spacer = View(this).apply {
      layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
    }

    val row = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
    }
    row.addView(circleButton(0xFFE5484D.toInt(), "Decline") { handOff("decline") })
    row.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dp(72), 1) })
    row.addView(circleButton(0xFF12B886.toInt(), "Answer") { handOff("accept") })

    root.addView(kind)
    root.addView(name)
    root.addView(spacer)
    root.addView(row)
    return root
  }

  private fun circleButton(color: Int, label: String, onClick: () -> Unit): LinearLayout {
    val wrap = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
    }
    val btn = TextView(this).apply {
      text = if (label == "Answer") "▶" else "✕"
      gravity = Gravity.CENTER
      setTextColor(Color.WHITE)
      textSize = 22f
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(color)
      }
      layoutParams = LinearLayout.LayoutParams(dp(72), dp(72))
      setOnClickListener { onClick() }
    }
    val text = TextView(this).apply {
      this.text = label
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
      setPadding(0, dp(10), 0, 0)
    }
    wrap.addView(btn)
    wrap.addView(text)
    return wrap
  }

  private fun handOff(action: String) {
    val callId = intent.getStringExtra(IncomingCallPresenter.EXTRA_CALL_ID).orEmpty()
    val kind = intent.getStringExtra(IncomingCallPresenter.EXTRA_KIND) ?: "video"
    val callerId = intent.getStringExtra(IncomingCallPresenter.EXTRA_CALLER_ID).orEmpty()
    IncomingCallPresenter.dismiss(this, callId)
    if (action == "open" || action == "accept") turnScreenOn("open")
    if (callId.isNotBlank()) {
      val launch = Intent(Intent.ACTION_VIEW, IncomingCallPresenter.appDeepLink(callId, kind, callerId, action)).apply {
        setPackage(packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      }
      try {
        startActivity(launch)
      } catch (_: Throwable) {
        // app scheme not ready
      }
    }
    finish()
  }

  private fun turnScreenOn(action: String = "lock") {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
    )
    if (action == "open" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      val keyguard = getSystemService(KeyguardManager::class.java)
      keyguard?.requestDismissKeyguard(this, null)
    }
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
