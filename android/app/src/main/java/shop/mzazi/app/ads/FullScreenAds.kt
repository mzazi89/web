package shop.mzazi.app.ads

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.appopen.AppOpenAd
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

/**
 * Full-screen formats: architecture only.
 *
 * None of these are placed yet, and that is deliberate rather than unfinished.
 * The app is a single-Activity shell around the site, so there is no natural
 * break between screens to put an interstitial in — the honest options are
 * "interrupt someone mid-form" or "show nothing". The same is true of rewarded
 * ads: they need an explicit opt-in ("watch this, get X"), and inventing one in
 * a WebView would be inventing product behaviour.
 *
 * So each controller is complete, correct and inert: it will preload and show
 * once [AdUnits] holds a real unit ID for its format. Wire one up by creating
 * the matching ad unit in AdMob, pasting its ID in [AdUnits], and calling
 * `preload()` early plus `show()` at the chosen moment.
 *
 * Each class keeps its own single in-flight request, so repeated calls from
 * lifecycle events cannot duplicate loads.
 */

/** Interstitial: preload, then show at a break the app chooses. */
class InterstitialSlot(private val activity: Activity) {

    private var ad: InterstitialAd? = null
    private var loading = false
    private var failures = 0
    private var lastShownAt = 0L
    private val main = Handler(Looper.getMainLooper())

    val isReady: Boolean get() = ad != null

    fun preload() {
        val unit = AdUnits.interstitial ?: return
        if (!Ads.isReady || loading || ad != null) return
        loading = true
        InterstitialAd.load(
            activity,
            unit,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(loaded: InterstitialAd) {
                    loading = false
                    failures = 0
                    ad = loaded
                    Log.i(TAG, "interstitial ready")
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    loading = false
                    ad = null
                    if (error.code == AdRequest.ERROR_CODE_NO_FILL || failures >= 2) return
                    failures++
                    main.postDelayed({ preload() }, RETRY_MS * failures)
                }
            }
        )
    }

    /** @return false when there is nothing to show, so the caller can carry on. */
    fun show(onClosed: () -> Unit = {}): Boolean {
        val current = ad ?: return false
        val now = System.currentTimeMillis()
        if (now - lastShownAt < MIN_GAP_MS) return false

        ad = null
        lastShownAt = now
        current.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                preload()
                onClosed()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                Log.w(TAG, "interstitial show failed: ${error.message}")
                preload()
                onClosed()
            }
        }
        current.show(activity)
        return true
    }

    private companion object {
        const val RETRY_MS = 30_000L
        const val MIN_GAP_MS = 3 * 60 * 1000L
    }
}

/** Rewarded: the user opts in, and only then is the reward granted. */
class RewardedSlot(private val activity: Activity) {

    private var ad: RewardedAd? = null
    private var loading = false
    private val main = Handler(Looper.getMainLooper())

    val isReady: Boolean get() = ad != null

    fun preload() {
        val unit = AdUnits.rewarded ?: return
        if (!Ads.isReady || loading || ad != null) return
        loading = true
        RewardedAd.load(
            activity,
            unit,
            AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(loaded: RewardedAd) {
                    loading = false
                    ad = loaded
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    loading = false
                    ad = null
                    if (error.code == AdRequest.ERROR_CODE_NO_FILL) return
                    main.postDelayed({ preload() }, 30_000L)
                }
            }
        )
    }

    /**
     * @param onReward invoked only when the SDK confirms the reward was earned.
     * @param onFinished invoked on dismissal or failure; use it to re-enable UI.
     */
    fun show(onReward: (amount: Int, type: String) -> Unit, onFinished: () -> Unit = {}): Boolean {
        val current = ad ?: return false
        ad = null
        current.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                preload()
                onFinished()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                preload()
                onFinished()
            }
        }
        return try {
            current.show(activity) { reward ->
                onReward(reward.amount, reward.type)
            }
            true
        } catch (e: Exception) {
            // show() throws if the Activity is finishing or the ad was already
            // presented. Neither is worth a crash on a JS-triggered path.
            Log.w(TAG, "rewarded show threw: ${e.message}")
            ad = null
            preload()
            onFinished()
            false
        }
    }
}

/**
 * App Open: the cold-start ad, which is the format that actually fits a shell
 * like this one. It waits for the first page to finish loading so the user never
 * stares at an ad over a blank WebView.
 */
class AppOpenSlot(private val context: Context) {

    private var ad: AppOpenAd? = null
    private var loading = false
    private var lastShownAt = 0L
    private val prefs = context.getSharedPreferences("admob", Context.MODE_PRIVATE)
    private val main = Handler(Looper.getMainLooper())

    /** A cold start within this window of the previous one skips the ad. */
    private val minGapMs = 4 * 60 * 60 * 1000L

    fun preload() {
        val unit = AdUnits.appOpen ?: return
        if (!Ads.isReady || loading || ad != null) return
        loading = true
        AppOpenAd.load(
            context,
            unit,
            AdRequest.Builder().build(),
            object : AppOpenAd.AppOpenAdLoadCallback() {
                override fun onAdLoaded(loaded: AppOpenAd) {
                    loading = false
                    ad = loaded
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    loading = false
                    ad = null
                    Log.i(TAG, "app open: ${error.code} ${error.message}")
                }
            }
        )
    }

    fun showIfAvailable(activity: Activity): Boolean {
        val current = ad ?: return false
        val now = System.currentTimeMillis()
        if (now - prefs.getLong(KEY_LAST_SHOWN, 0L) < minGapMs) return false

        ad = null
        lastShownAt = now
        prefs.edit().putLong(KEY_LAST_SHOWN, now).apply()

        current.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                preload()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                Log.w(TAG, "app open show failed: ${error.message}")
                preload()
            }
        }
        current.show(activity)
        return true
    }

    private companion object {
        const val KEY_LAST_SHOWN = "last_app_open_shown"
    }
}

private const val TAG = "AdMob"
