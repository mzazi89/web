package shop.mzazi.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * The "there is a newer build" prompt.
 *
 * The site publishes `/app-version.json` (written by the release workflow), so
 * announcing a build is a deploy, not an app release. On every launch we fetch
 * it once, compare semver against this build's versionName, and — if the server
 * is ahead — show a blocking dialog with the two choices a person actually has:
 * update now, or skip.
 *
 * Skipping is honoured for ten minutes, then the prompt returns; closing and
 * reopening the app checks immediately again, because a stale install is the
 * problem the prompt exists to fix.
 *
 * Deliberately dependency-free: one thread, one Handler, no coroutines or
 * WorkManager for something that runs once per launch.
 */
class UpdateChecker(private val activity: Activity) {

    private val handler = Handler(Looper.getMainLooper())
    private var dialog: AlertDialog? = null

    fun check() {
        if (activity.isFinishing || activity.isDestroyed) return
        Thread {
            try {
                val endpoint = BuildConfig.UPDATE_URL + "?t=" + System.currentTimeMillis()
                val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8000
                    readTimeout = 8000
                    setRequestProperty("Cache-Control", "no-cache")
                    setRequestProperty("Accept", "application/json")
                }
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                conn.disconnect()

                val json = JSONObject(body)
                val latest = json.optString("version").trim()
                val url = json.optString("url").trim()
                val notes = json.optString("notes").trim()

                if (latest.isNotEmpty() && url.isNotEmpty() && isNewer(latest, BuildConfig.VERSION_NAME)) {
                    handler.post { show(latest, url, notes) }
                }
            } catch (e: Exception) {
                // A failed check must never block the app; the next launch retries.
                Log.w(TAG, "update check failed: ${e.message}")
            }
        }.start()
    }

    private fun show(latest: String, url: String, notes: String) {
        if (activity.isFinishing || activity.isDestroyed) return
        if (dialog?.isShowing == true) return

        val message = buildString {
            append("You are using v")
            append(BuildConfig.VERSION_NAME)
            append(". Version ")
            append(latest)
            append(" is available.")
            if (notes.isNotEmpty()) {
                append("\n\n")
                append(notes)
            }
            // Builds before 1.0.2 were signed with a throwaway CI key, so Android
            // refuses to install over them. Telling the person up front is the
            // difference between a five-second fix and a support message.
            if (isLegacySignature(BuildConfig.VERSION_NAME)) {
                append("\n\nThis install predates v1.0.2 and uses an older signing key. ")
                append("If Android says the app cannot be installed, uninstall it first, ")
                append("then install this download — updates after that install normally.")
            }
        }

        dialog = AlertDialog.Builder(activity)
            .setTitle("Update available")
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("Update") { _, _ ->
                openInstaller(url)
                scheduleRetry()
            }
            .setNegativeButton("Skip") { _, _ ->
                scheduleRetry()
            }
            .show()
    }

    private fun scheduleRetry() {
        handler.postDelayed({
            if (!activity.isFinishing && !activity.isDestroyed) check()
        }, RETRY_MS)
    }

    private fun openInstaller(url: String) {
        try {
            activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (e: Exception) {
            Log.w(TAG, "no browser to open $url: ${e.message}")
        }
    }

    fun dispose() {
        handler.removeCallbacksAndMessages(null)
        dialog?.dismiss()
        dialog = null
    }

    companion object {
        private const val TAG = "MzaziUpdate"
        private const val RETRY_MS = 10 * 60 * 1000L

        /**
         * True for builds published before the project adopted a stable key.
         * The scheme is 1.0.<build>, so anything below 1.0.2 was signed by the
         * per-run CI key and cannot be updated in place.
         */
        fun isLegacySignature(version: String): Boolean {
            val parts = version.trim().removePrefix("v").split(".")
            val minor = parts.getOrNull(1)?.toIntOrNull() ?: 0
            val patch = parts.getOrNull(2)?.toIntOrNull() ?: 0
            return minor == 0 && patch < 2
        }

        /** Semver-ish comparison: 1.0.10 is newer than 1.0.9, not older. */
        fun isNewer(candidate: String, current: String): Boolean {
            fun parts(v: String) = v.trim().removePrefix("v").split(".")
                .map { it.toIntOrNull() ?: 0 }
            val a = parts(candidate)
            val b = parts(current)
            for (i in 0 until maxOf(a.size, b.size)) {
                val x = a.getOrElse(i) { 0 }
                val y = b.getOrElse(i) { 0 }
                if (x != y) return x > y
            }
            return false
        }
    }
}
