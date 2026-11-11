package shop.mzazi.app.ads

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.LoadAdError

/**
 * One banner, anchored below the WebView.
 *
 * A banner unit refreshes itself on the schedule set in AdMob, so this class
 * loads exactly once and then leaves the SDK alone. Everything here exists to
 * prevent the two failure modes that actually happen in production:
 *
 * - duplicate requests, which double the request count and can get the account
 *   flagged for invalid traffic — guarded by [loading] / [loaded] and by owning
 *   a single [AdView] instance;
 * - a permanent blank strip when the first request fails on a flaky network —
 *   retried three times with backoff, then hidden rather than left empty.
 */
class BannerSlot(
    private val activity: Activity,
    private val container: ViewGroup
) {

    private val main = Handler(Looper.getMainLooper())

    private var adView: AdView? = null
    private var loading = false
    private var loaded = false
    private var attempts = 0
    private var paused = false
    private var destroyed = false

    /** Width the current [AdView] was sized for, so a rotation can rebuild it. */
    private var builtForWidthDp = 0

    private val retry = Runnable { load() }

    fun load() {
        val unit = AdUnits.banner ?: return
        if (destroyed || loading || loaded || paused) return
        if (!Ads.isReady) return

        // An adaptive banner is sized from the container's width, which is 0
        // until the first layout pass. Wait for it rather than guessing 320dp
        // and ending up with a banner narrower than the screen.
        if (container.width == 0) {
            container.post { load() }
            return
        }

        val view = adView ?: build(unit)
        loading = true
        view.loadAd(AdRequest.Builder().build())
    }

    private fun build(unit: String): AdView {
        val widthDp = (container.width / activity.resources.displayMetrics.density).toInt()
        builtForWidthDp = widthDp

        // Anchored adaptive: full width, one of Google's fixed heights, so it
        // matches the app's own edge-to-edge layout instead of a floating box.
        val size = if (widthDp >= 200) {
            AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(activity, widthDp)
        } else {
            AdSize.BANNER
        }

        val view = AdView(activity).apply {
            adUnitId = unit
            setAdSize(size)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            )
            adListener = listener
        }
        container.addView(view)
        adView = view
        return view
    }

    private val listener = object : AdListener() {
        override fun onAdLoaded() {
            loading = false
            loaded = true
            attempts = 0
            main.removeCallbacks(retry)
            // Only now does the strip take up space: an empty reserved bar is
            // worse than the layout settling once.
            container.visibility = View.VISIBLE
            Log.i(TAG, "banner loaded")
        }

        override fun onAdFailedToLoad(error: LoadAdError) {
            loading = false
            loaded = false
            container.visibility = View.GONE

            // No fill is a commercial outcome, not a bug; retrying it is
            // pointless and burns requests.
            if (error.code == AdRequest.ERROR_CODE_NO_FILL) {
                Log.i(TAG, "banner: no fill")
                return
            }

            if (attempts >= MAX_ATTEMPTS || !Ads.isReady) {
                Log.w(TAG, "banner gave up: ${error.code} ${error.message}")
                return
            }
            val delay = BACKOFF_MS[attempts.coerceAtMost(BACKOFF_MS.lastIndex)]
            attempts++
            Log.w(TAG, "banner failed (${error.code}); retry ${attempts} in ${delay}ms")
            main.removeCallbacks(retry)
            main.postDelayed(retry, delay)
        }
    }

    /** Rotation changes the usable width, and an adaptive banner cannot be resized. */
    fun onConfigurationChanged() {
        val widthDp = (container.width / activity.resources.displayMetrics.density).toInt()
        if (widthDp == 0 || widthDp == builtForWidthDp) return
        adView?.let {
            container.removeView(it)
            it.destroy()
        }
        adView = null
        loaded = false
        loading = false
        attempts = 0
        load()
    }

    fun pause() {
        paused = true
        main.removeCallbacks(retry)
        adView?.pause()
    }

    fun resume() {
        paused = false
        adView?.resume()
        // Covers the case where the process was backgrounded before the first
        // successful load finished.
        if (!loaded && !loading) load()
    }

    fun destroy() {
        destroyed = true
        main.removeCallbacks(retry)
        adView?.destroy()
        adView = null
        container.removeAllViews()
    }

    private companion object {
        const val TAG = "AdMob"
        const val MAX_ATTEMPTS = 3
        val BACKOFF_MS = longArrayOf(3_000, 10_000, 30_000)
    }
}
