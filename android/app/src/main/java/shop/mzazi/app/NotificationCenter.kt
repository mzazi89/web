package shop.mzazi.app

import android.Manifest
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.CookieManager
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Local notifications for account events.
 *
 * The app has no push service (that would mean Firebase credentials in the
 * build), so instead it polls the same feed the dashboard uses —
 * `/api/notifications` — and raises a system notification for anything it has
 * not shown before. Announcements published in the admin portal arrive through
 * the same call, so there is one code path and one place to change.
 *
 * Delivery therefore happens while the app is running or the next time it is
 * opened; it is not instant when the app is closed. That is the honest trade for
 * a dependency-free build.
 */
class NotificationCenter(private val activity: Activity) {

    private val handler = Handler(Looper.getMainLooper())
    private val prefs = activity.getSharedPreferences("mzazi_notifications", Context.MODE_PRIVATE)
    private var polling = false

    fun requestPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
        activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), PERMISSION_REQUEST)
    }

    fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Account activity", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "Payments, service alerts and announcements from MZAZI TECH"
            }
        )
    }

    fun start() {
        if (polling) return
        polling = true
        poll()
        handler.postDelayed(pollLoop, INTERVAL_MS)
    }

    fun stop() {
        polling = false
        handler.removeCallbacksAndMessages(null)
    }

    private val pollLoop = object : Runnable {
        override fun run() {
            if (!polling) return
            poll()
            handler.postDelayed(this, INTERVAL_MS)
        }
    }

    private fun poll() {
        if (activity.isFinishing || activity.isDestroyed) return
        val cookie = CookieManager.getInstance().getCookie(BuildConfig.START_URL) ?: return
        if (!cookie.contains("token=")) return // not signed in yet; nothing to fetch

        Thread {
            try {
                val origin = BuildConfig.START_URL.trimEnd('/')
                val conn = (URL("$origin/api/notifications").openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8000
                    readTimeout = 8000
                    setRequestProperty("Cookie", cookie)
                    setRequestProperty("Accept", "application/json")
                }
                if (conn.responseCode != 200) { conn.disconnect(); return@Thread }
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                conn.disconnect()
                val items = JSONObject(body).optJSONArray("items") ?: return@Thread

                val seen = prefs.getStringSet(KEY_SEEN, emptySet())!!.toMutableSet()
                val fresh = mutableListOf<JSONObject>()
                repeat(items.length()) { i ->
                    val item = items.optJSONObject(i) ?: return@repeat
                    val key = item.optString("key")
                    if (key.isNotEmpty() && key !in seen) fresh.add(item)
                }

                // Persist before showing: a notification must never repeat.
                val next = (seen + fresh.map { it.optString("key") }).toList()
                prefs.edit().putStringSet(KEY_SEEN, (next.takeLast(200)).toSet()).apply()

                // First sync seeds the history instead of firing a dozen alerts.
                if (!prefs.getBoolean(KEY_SEEDED, false)) {
                    prefs.edit().putBoolean(KEY_SEEDED, true).apply()
                    return@Thread
                }

                fresh.take(3).forEachIndexed { index, item ->
                    handler.post { show(item, index) }
                }
            } catch (e: Exception) {
                Log.w(TAG, "notification poll failed: ${e.message}")
            }
        }.start()
    }

    private fun show(item: JSONObject, offset: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return

        val title = item.optString("title").ifEmpty { "MZAZI TECH" }
        val text = item.optString("body")
        val intent = Intent(activity, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pending = PendingIntent.getActivity(
            activity, offset, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.Notification.Builder(activity, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            android.app.Notification.Builder(activity)
        }
            .setSmallIcon(android.R.drawable.stat_notify_more)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(android.app.Notification.BigTextStyle().bigText(text))
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()

        val manager = activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(item.optString("key").hashCode(), notification)
    }

    companion object {
        private const val TAG = "MzaziNotify"
        private const val CHANNEL_ID = "mzazi_account"
        private const val KEY_SEEN = "seen_keys"
        private const val KEY_SEEDED = "seeded"
        private const val INTERVAL_MS = 2 * 60 * 1000L
        const val PERMISSION_REQUEST = 41
    }
}
