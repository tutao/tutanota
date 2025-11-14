import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
	id("com.android.application")
	id("kotlin-android")
	alias(libs.plugins.kotlin.serialization)
	alias(libs.plugins.google.ksp)
	alias(libs.plugins.tutao.testconvention)
}

group = "de.tutao"

android {
	namespace = "de.tutao.tutanota"

	defaultConfig {
		compileSdk = 36
		applicationId = "de.tutao.tutanota"
		minSdk = 26
		targetSdk = 35
		versionCode = 396557
		versionName = "314.251114.0"

		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

		// https://issuetracker.google.com/issues/181593646
		ksp {
			arg("room.schemaLocation", "$projectDir/schemas")
			arg("room.generateKotlin", "true")
		}
	}
	signingConfigs {
		create("release") {
			// Provide non-empty placeholders because otherwise configuration will break even in debug.
			// for local dev builds, you can use the keystore that's deployed automatically to dev systems.
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
			resValue("string", "package_name", "de.tutao.tutanota.debug")
			resValue("string", "account_type", "de.tutao.tutanota.debug")
			manifestPlaceholders.clear()
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider.debug"
			applicationIdSuffix = ".debug"
			isJniDebuggable = true
		}
		release {
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota")
			resValue("string", "account_type", "de.tutao.tutanota")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider"
		}
		create("releaseTest") {
			initWith(getByName("release"))
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota.test")
			resValue("string", "account_type", "de.tutao.tutanota.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider.test"
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		buildConfig = true
	}

	applicationVariants.configureEach {
		val variant = this
		variant.outputs.configureEach {
			val flavor = variant.productFlavors[0].name
			// The cast is needed because outputFileName isn't directly accessible in .kts files
			// And the outputFile.renameTo function runs at the beginning of the build process
			// which will make the build script try to move a file that doesn't exist (yet)
			(this as com.android.build.gradle.internal.api.BaseVariantOutputImpl).outputFileName =
				"tutanota-app-$flavor-${variant.buildType.name}-${variant.versionName}.apk"
		}
	}

	buildTypes.forEach {
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

	packaging {
		resources {
			excludes += listOf("META-INF/LICENSE", "META-INF/ASL2.0")
		}
	}

	lint {
		this.disable.add("MissingTranslation")
	}
	ndkVersion = "28.2.13676358"
}

kotlin {
	compilerOptions {
		jvmTarget = JvmTarget.JVM_17
	}
}

tasks.withType<Test>().configureEach {
	testLogging {
		exceptionFormat = TestExceptionFormat.FULL
		events("started", "skipped", "passed", "failed")
		showStandardStreams = true
	}
}

tasks.register("itest") {
	dependsOn("testDeviceFdroidDebugAndroidTest")
}

dependencies {
	implementation(libs.tutasdk)
	implementation(project(":tutashared"))

	implementation(libs.commons.io)

	implementation(libs.androidx.core.ktx)
	implementation(libs.androidx.activity.ktx)
	implementation(libs.androidx.browser)
	implementation(libs.androidx.biometric)
	implementation(libs.androidx.splashscreen)
	implementation(libs.androidx.datastore.preferences)

	implementation(libs.androidx.room.ktx)
	ksp(libs.androidx.room.compiler)


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
		exclude(group = "org.mockito'", module = "mockito-core")
	}
	androidTestImplementation(libs.mockito.core)
	androidTestImplementation(libs.mockito.kotlin)
	androidTestImplementation(libs.androidx.test.espresso.core)
	androidTestImplementation(libs.androidx.test.runner)
	androidTestImplementation(libs.androidx.test.junit.ktx)
	androidTestImplementation(libs.androidx.test.rules)
	androidTestImplementation(libs.jackson.databind)
	androidTestImplementation(libs.androidx.room.testing)
}