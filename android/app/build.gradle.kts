plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The address the shell opens (the public site).
//
// Passed in by the Actions workflow (-PappUrl=https://…) so the same commit can
// produce a build for a Vercel preview URL, a custom domain, or a local tunnel
// without editing a resource. The default is the production site.
val appUrl: String = (project.findProperty("appUrl") as String?)
    ?.takeIf { it.isNotBlank() }
    ?: "https://www.mzazi.shop"

// Shown in Settings → Apps. A release build says which panel it targets, which
// matters the moment there is more than one (production, staging, a preview).
val appVersionName: String = (project.findProperty("versionName") as String?)
    ?.takeIf { it.isNotBlank() }
    ?: "1.0.0"

// Android refuses to install an update signed by a different certificate, and
// CI debug keystores are generated per runner. This project therefore signs
// every build — debug included — with one committed key so an in-place update
// actually installs. It is a sideload key, not a Play key.
val appVersionCode: Int = (project.findProperty("appVersionCode") as String?)
    ?.toIntOrNull()
    ?: 1

// Where the app looks for the newest published build. Served by the site, so a
// deploy is enough to announce a release.
val updateUrl: String = appUrl.trimEnd('/') + "/app-version.json"

android {
    namespace = "shop.mzazi.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "shop.mzazi.app"
        minSdk = 26
        targetSdk = 34
        versionCode = appVersionCode
        versionName = appVersionName

        // Quoted once here so the generated BuildConfig constant is a Java
        // string literal, not a bare identifier.
        buildConfigField("String", "START_URL", "\"$appUrl\"")
        buildConfigField("String", "UPDATE_URL", "\"$updateUrl\"")
    }

    signingConfigs {
        create("stable") {
            val store = rootProject.file("keystore/mzazi.p12")
            if (store.exists()) {
                // GitHub Actions materialises an undefined secret as an empty
                // string, not as an absent variable, so `?:` alone is not
                // enough: CI ended up signing with a blank password and
                // failing with "keystore password was incorrect". Blank means
                // "not provided" here.
                fun envOr(name: String, fallback: String): String =
                    System.getenv(name)?.takeIf { it.isNotBlank() } ?: fallback

                storeFile = store
                storeType = "pkcs12"
                storePassword = envOr("MZAZI_KEYSTORE_PASSWORD", "mzazi-android")
                keyAlias = envOr("MZAZI_KEY_ALIAS", "mzazi")
                keyPassword = envOr("MZAZI_KEY_PASSWORD", "mzazi-android")

                // All three schemes, on purpose.
                //
                // AGP signs v2/v3 only when minSdk >= 24, which leaves no
                // META-INF certificate for v1-only parsers to read. Android
                // itself is fine with that, but third-party installers —
                // APKMirror Installer among them — reject the file with "the
                // parser did not find any certificates in the .apk". v1 costs a
                // few kilobytes and removes the whole class of problem.
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("stable")

            // Google's sample ad units, so a debug build can never bill a real
            // advertiser or taint the production account with invalid traffic.
            buildConfigField("boolean", "TEST_ADS", "true")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("stable")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )

            // The real Ad Unit IDs. Only a signed release requests them.
            buildConfigField("boolean", "TEST_ADS", "false")
        }
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.activity:activity-ktx:1.9.0")

    // Google Mobile Ads. 23.6.0 is the newest 23.x release; the 24.x line
    // requires compileSdk 35, and this project builds against 34.
    implementation("com.google.android.gms:play-services-ads:23.6.0")

    // User Messaging Platform — the SDK Google requires for GDPR/EEA consent
    // before any ad may be requested.
    implementation("com.google.android.ump:user-messaging-platform:3.2.0")
}
