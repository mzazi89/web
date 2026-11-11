package shop.mzazi.app.ads

import shop.mzazi.app.BuildConfig

/**
 * Every piece of ad inventory this app knows about, in one place.
 *
 * Two rules are enforced here rather than left to whatever code requests an ad:
 *
 * 1. An ad unit ID belongs to exactly one ad format. AdMob assigns the format
 *    when the unit is created and rejects a request for a different one with
 *    ERROR_CODE_INVALID_REQUEST, so a banner ID must never be handed to an
 *    interstitial loader. The production IDs for the other formats are
 *    deliberately `null` until separate units exist in the AdMob account.
 *
 * 2. Debug builds use Google's sample units, never the live ones. A developer
 *    tapping a production ad is invalid traffic, and enough of it suspends the
 *    account. Release builds get the real IDs.
 *
 * The AdMob console, not this file, is the source of truth for formats:
 * AdMob → Apps → Ad units shows the format next to each unit ID.
 */
object AdUnits {

    /** The `~` ID from the AdMob app settings. Also in AndroidManifest.xml. */
    const val APP_ID: String = "ca-app-pub-6827095079937073~8191042599"

    // --- Production ------------------------------------------------------
    //
    // The one unit that exists in the account today, created as a BANNER.
    private const val PROD_BANNER = "ca-app-pub-6827095079937073/1497320931"

    // Interstitial, rewarded and app-open inventory needs its own units. Until
    // they are created in AdMob these stay null and the controllers refuse to
    // load, which is the correct failure: silently reusing PROD_BANNER would
    // produce nothing but invalid requests.
    private val PROD_INTERSTITIAL: String? = null
    private val PROD_REWARDED: String? = null
    private val PROD_APP_OPEN: String? = null

    // --- Google's official test units ------------------------------------
    // https://developers.google.com/admob/android/test-ads
    private const val TEST_BANNER = "ca-app-pub-3940256099942544/6300978111"
    private const val TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712"
    private const val TEST_REWARDED = "ca-app-pub-3940256099942544/5224354917"
    private const val TEST_APP_OPEN = "ca-app-pub-3940256099942544/9257395921"

    /** Null when this build has no unit for that format. */
    val banner: String? = if (BuildConfig.TEST_ADS) TEST_BANNER else PROD_BANNER
    val interstitial: String? = if (BuildConfig.TEST_ADS) TEST_INTERSTITIAL else PROD_INTERSTITIAL
    val rewarded: String? = if (BuildConfig.TEST_ADS) TEST_REWARDED else PROD_REWARDED
    val appOpen: String? = if (BuildConfig.TEST_ADS) TEST_APP_OPEN else PROD_APP_OPEN

    /** True when ads are configured at all; a build with nothing to show skips the SDK. */
    val enabled: Boolean = banner != null
}
