import com.android.build.gradle.internal.tasks.FinalizeBundleTask
import org.gradle.configurationcache.extensions.capitalized

plugins {
	id("com.android.application")
	id("org.jetbrains.kotlin.android")
	id("kotlin-kapt")
	alias(libs.plugins.kotlin.serialization)
	// FIXME
	id("org.jetbrains.kotlin.plugin.compose") version "2.2.20" // this version matches the Kotlin version
	alias(libs.plugins.tutao.testconvention)
}

group = "de.tutao"

android {
	namespace = "de.tutao.calendar"

	defaultConfig {
		compileSdk = 36
		applicationId = "de.tutao.calendar"
		minSdk = 26
		targetSdk = 35
		versionCode = 226
		versionName = "324.260127.0"

		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

		javaCompileOptions {
			annotationProcessorOptions {
				this.arguments["room.schemaLocation"] = "$projectDir/schemas"
			}
		}
	}

	signingConfigs {
		create("release") {
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
			storeFile = file(System.getenv("APK_SIGN_STORE") ?: "EMPTY")
			storePassword = System.getenv("APK_SIGN_STORE_PASS") ?: "EMPTY"
			keyAlias = System.getenv("APK_SIGN_ALIAS") ?: "EMPTY"
			keyPassword = System.getenv("APK_SIGN_KEY_PASS") ?: "EMPTY"

			enableV1Signing = true
			enableV2Signing = true
		}
	}

	flavorDimensions("releaseType")

	productFlavors {
		create("tutao") {
			signingConfig = signingConfigs.getByName("release")
		}
		create("fdroid") {
		}
	}

	buildTypes {
		debug {
			resValue("string", "package_name", "de.tutao.calendar.debug")
			manifestPlaceholders.clear()
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider.debug"
			applicationIdSuffix = ".debug"
			isJniDebuggable = true
		}
		release {
			manifestPlaceholders += mapOf()
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.calendar")
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider"

		}
		create("releaseTest") {
			initWith(getByName("release"))
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.calendar.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider.test"
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		viewBinding = true
		this.buildConfig = true
		compose = true
	}

	applicationVariants.configureEach {
		val variant = this
		variant.outputs.configureEach {
			val flavor = variant.productFlavors[0].name

			// The cast is needed because outputFileName isn't directly accessible in .kts files
			// And the outputFile.renameTo function runs at the beginning of the build process
			// which will make the build script try to move a file that doesn't exist (yet)
			(this as com.android.build.gradle.internal.api.BaseVariantOutputImpl).outputFileName =
				"calendar-$flavor-${variant.buildType.name}-${variant.versionName}.apk"

			val bundleName = "calendar-$flavor-${variant.buildType.name}-${variant.versionName}.aab"

			val taskName = StringBuilder("sign").run {
				//Add a task to rename the output file
				productFlavors.forEach {
					append(it.name.capitalized())
				}

				append(buildType.name.capitalized())
				append("Bundle")

				toString()
			}

			// Register the task to run at the end of the build
			tasks.named(taskName, FinalizeBundleTask::class.java) {
				val file = finalBundleFile.asFile.get()
				val finalFile = File(file.parentFile, bundleName)
				finalBundleFile.set(finalFile)
			}
		}
	}

	buildTypes.map {
		it.buildConfigField(
			"String",
			"FILE_PROVIDER_AUTHORITY",
			"\"" + it.manifestPlaceholders["contentProviderAuthority"] + "\""
		)
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField("String", "SYS_MODEL_VERSION", "\"126\"")
		it.buildConfigField("String", "TUTANOTA_MODEL_VERSION", "\"86\"")
		it.buildConfigField("String", "RES_ADDRESS", "\"tutanota\"")
	}

	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_17
		targetCompatibility = JavaVersion.VERSION_17
	}

	kotlinOptions {
		jvmTarget = "17"
	}

	packagingOptions {
		resources {
			this.excludes.addAll(listOf("META-INF/LICENSE", "META-INF/ASL2.0"))
		}
	}

	lint {
		this.disable.add("MissingTranslation")
	}

	sourceSets {
		this.getByName("androidTest") {
			assets.srcDirs(files("$projectDir/schemas"))
		}
	}

	ndkVersion = "28.2.13676358"
}

tasks.register("itest") {
	dependsOn("testDeviceFdroidDebugAndroidTest")
}

dependencies {
	implementation(libs.androidx.appcompat)
	val room_version = "2.8.0"
	val lifecycle_version = "2.9.4"
	val activity_version = "1.11.0"
	val coroutines_version = "1.10.2"

	implementation(libs.tutasdk)
	implementation(project(":tutashared"))

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation(libs.commons.io)

	implementation(libs.androidx.core.ktx)
	implementation(libs.androidx.activity.ktx)
	implementation(libs.androidx.browser)
	implementation(libs.androidx.biometric)
	implementation(libs.androidx.splashscreen)
	implementation(libs.androidx.datastore.preferences)

	implementation(libs.androidx.room.runtime)
	// For Kotlin use kapt instead of annotationProcessor. we should migrate to ksp
	kapt(libs.androidx.room.compiler)


	implementation(files("../libs/sqlcipher-android.aar"))

	implementation(libs.androidx.lifecycle.runtime.ktx)

	implementation(libs.kotlin.stdlib)
	implementation(libs.kotlinx.serlization.json)
	implementation(libs.kotlinx.coroutines.android)

	// TLS1.3 backwards compatibility for Android < 10
	implementation(libs.conscrypt.android)
	implementation(libs.okhttp)

	implementation(libs.jna) {
		artifact { type = "aar" }
	}

	testImplementation(libs.kotlin.stdlib.jdk8)
	testImplementation(libs.androidx.test.junit.ktx)
	testImplementation(libs.junit)
	testImplementation(libs.robolectric)
	testImplementation(libs.mockito.kotlin)
	testImplementation(libs.kotlinx.coroutines.test)

	androidTestImplementation(libs.mockito.inline) {
		exclude(group = "org.mockito", module = "mockito-core")
	}
	androidTestImplementation(libs.mockito.kotlin)
	androidTestImplementation(libs.mockito.core)
	androidTestImplementation(libs.androidx.test.espresso.core)
	androidTestImplementation(libs.androidx.test.runner)
	androidTestImplementation(libs.androidx.test.junit.ktx)
	androidTestImplementation(libs.androidx.test.rules)
	androidTestImplementation(libs.jackson.databind)
	androidTestImplementation(libs.androidx.room.testing)

	// Setup for Jetpack Compose
	val composeBom = platform(libs.androidx.compose.bom)
	implementation(composeBom)
	androidTestImplementation(composeBom)
	implementation(libs.androidx.compose.m3)

	// Android Studio Preview support
	implementation(libs.androidx.compose.ui.preview)
	debugImplementation(libs.androidx.compose.ui.tooling)

	// UI Tests
	androidTestImplementation(libs.androidx.compose.ui.junit)
	debugImplementation(libs.androidx.compose.ui.test.manifest)

	// Optional - Icons
	implementation(libs.androidx.compose.material.icons.core)
	// Optional - Add full set of material icons
	implementation(libs.androidx.compose.material.icons.ext)

	// Optional - Integration with activities
	implementation(libs.androidx.compose.activity)
	// Optional - Integration with ViewModels
	implementation(libs.androidx.lifecycle.viewmodel.compose)

	// Jetpack WorkManager for background sync
	implementation(libs.androidx.work.runtime.ktx)


	// For interop APIs with Material 3
	implementation(libs.androidx.glance.m3)

	// For AppWidgets support and preview
	implementation(libs.androidx.glance)
	implementation(libs.androidx.glance.appwidget)
	implementation(libs.androidx.glance.appwidget.preview)
	implementation(libs.androidx.glance.preview)
}