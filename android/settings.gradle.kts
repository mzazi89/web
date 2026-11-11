pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

// WebView shell around https://www.mzazi.shop. Lives in the same repository as
// the site so a change to the site and the app that shows it are one commit.
rootProject.name = "MzaziTech"
include(":app")
