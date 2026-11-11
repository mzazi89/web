package shop.mzazi.app.ads

import android.app.Activity
import android.util.Log
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import shop.mzazi.app.BuildConfig
import java.util.concurrent.atomic.AtomicBoolean

/**
 * SDK start-up, in the only order that is legal in the EEA:
 *
 *   consent info update → consent form (if required) → canRequestAds? → initialize
 *
 * Requesting an ad before that question is answered is the single most common
 * way a WebView app gets an AdMob policy strike, so nothing in this package
 * loads an ad until [start]'s callback fires with `true`.
 *
 * Initialization is safe to call from every Activity: the work happens once per
 * process, and later callers receive the cached answer immediately.
 */
object Ads {

    private const val TAG = "AdMob"

    private val started = AtomicBoolean(false)
    @Volatile private var ready = false
    @Volatile private var canRequestAds = false

    /** True once the SDK is initialized and consent allows ad requests. */
    val isReady: Boolean get() = ready && canRequestAds

    /**
     * @param onReady main-thread callback; `false` means "this session shows no
     *   ads" — offline, consent refused, or no inventory configured. Callers
     *   must treat that as normal, not as an error to surface.
     */
    fun start(activity: Activity, onReady: (Boolean) -> Unit) {
        if (!AdUnits.enabled) {
            onReady(false)
            return
        }
        if (!started.compareAndSet(false, true)) {
            onReady(isReady)
            return
        }

        val consent: ConsentInformation = UserMessagingPlatform.getConsentInformation(activity)
        val params = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(false)
            // To exercise the form while testing, add:
            //   .setConsentDebugSettings(
            //       ConsentDebugSettings.Builder(activity)
            //           .setDebugGeography(ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA)
            //           .addTestDeviceHashedId("<hashed id from logcat>")
            //           .build())
            .build()

        consent.requestConsentInfoUpdate(
            activity,
            params,
            {
                // The form is only shown when the user's region requires it, so
                // this is a no-op for most launches.
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                    if (formError != null) {
                        Log.w(TAG, "consent form: ${formError.errorCode} ${formError.message}")
                    }
                    if (consent.canRequestAds()) {
                        initialize(activity, onReady)
                    } else {
                        Log.i(TAG, "consent withheld — no ads this session")
                        onReady(false)
                    }
                }
            },
            { requestError ->
                // Usually offline. Fall back to whatever state the SDK cached
                // from the last successful launch instead of blocking start-up.
                Log.w(TAG, "consent update failed: ${requestError.errorCode} ${requestError.message}")
                if (consent.canRequestAds()) {
                    initialize(activity, onReady)
                } else {
                    onReady(false)
                }
            }
        )
    }

    /**
     * Re-opens the consent form so a user can change or withdraw consent.
     *
     * Required in the EEA, and the app needs a visible way in: the natural home
     * is a "Privacy settings" row on the site's Settings page, forwarded to the
     * shell through a JavaScript interface.
     */
    fun showPrivacyOptions(activity: Activity) {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) { error ->
            if (error != null) Log.w(TAG, "privacy options: ${error.errorCode} ${error.message}")
        }
    }

    private fun initialize(activity: Activity, onReady: (Boolean) -> Unit) {
        val configuration = RequestConfiguration.Builder()
            // The app sells hosting and bots; there is no inventory for mature
            // audiences, so cap what can be served.
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_T)
            // A debug build already uses Google's sample units, which serve
            // test creatives on any device. Listed here too so a production ID
            // pasted in for a one-off check still cannot be clicked for real.
            .setTestDeviceIds(if (BuildConfig.DEBUG) listOf("EMULATOR") else emptyList())
            .build()
        MobileAds.setRequestConfiguration(configuration)

        MobileAds.initialize(activity) {
            // The completion listener is not guaranteed to be on the main
            // thread, and every caller of onReady touches views.
            activity.runOnUiThread {
                ready = true
                canRequestAds = true
                Log.i(TAG, "initialized; test inventory=${BuildConfig.TEST_ADS}")
                onReady(true)
            }
        }
    }
}
