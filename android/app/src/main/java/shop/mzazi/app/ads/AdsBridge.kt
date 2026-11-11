package shop.mzazi.app.ads

import android.app.Activity
import android.net.Uri
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView

/**
 * The website's handle on the rewarded ad.
 *
 * A rewarded ad is opt-in by definition: the user taps something that promises
 * a reward, watches, and gets it. The shell owns the ad, the site owns the
 * promise — only the site knows whether a reward is KES 5 of wallet credit or a
 * free day of hosting, and only the server can grant it. So this class exposes
 * the ad and reports the outcome; it does not decide what the reward is.
 *
 * Exposed as `window.MzaziApp`:
 *
 *   MzaziApp.isRewardedReady()   -> boolean, safe to call on load
 *   MzaziApp.showRewarded()      -> boolean, false when nothing is preloaded
 *   window.mzaziRewarded(evt)    -> called with {event, amount, type}
 *
 * `event` is one of:
 *   'earned'      the SDK confirmed the reward; grant it server-side
 *   'closed'      watched to the end or dismissed after the reward
 *   'unavailable' nothing loaded, or the ad failed to present
 *
 * The reward is deliberately reported to the page rather than granted here: an
 * app that mints its own credits is an app a user can patch.
 */
class AdsBridge(
    private val activity: Activity,
    private val web: WebView,
    private val rewarded: RewardedSlot,
    private val allowedHost: String
) {

    @JavascriptInterface
    fun isRewardedReady(): Boolean = onOurHost() && rewarded.isReady

    /**
     * @return true when the request was accepted. The result arrives later via
     *   `window.mzaziRewarded`, because an ad cannot resolve synchronously.
     */
    @JavascriptInterface
    fun showRewarded(): Boolean {
        if (!onOurHost()) {
            Log.w(TAG, "showRewarded refused from ${web.url}")
            return false
        }
        if (!rewarded.isReady) {
            // Warm one up for the next tap instead of leaving the button dead.
            rewarded.preload()
            return false
        }
        activity.runOnUiThread {
            val started = rewarded.show(
                onReward = { amount, type -> report("earned", amount, type) },
                onFinished = { report("closed", 0, "") }
            )
            if (!started) report("unavailable", 0, "")
        }
        return true
    }

    /**
     * Third-party frames inherit a JavaScript interface, so the bridge checks
     * that the *document* is ours before acting. Without this, an embedded
     * iframe could burn the user's rewarded inventory.
     */
    private fun onOurHost(): Boolean {
        val url = web.url ?: return false
        val host = Uri.parse(url).host ?: return false
        return host == allowedHost || host.removePrefix("www.") == allowedHost.removePrefix("www.")
    }

    private fun report(event: String, amount: Int, type: String) {
        val safeType = type.replace("\\", "").replace("'", "").replace("\n", " ")
        val js = "window.mzaziRewarded && window.mzaziRewarded(" +
            "{event:'$event',amount:$amount,type:'$safeType'});"
        web.post { web.evaluateJavascript(js, null) }
    }

    private companion object {
        const val TAG = "AdMob"
    }
}
