import org.gradle.api.tasks.testing.logging.TestExceptionFormat

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
		versionCode = 396586
		versionName = "324.260127.0"

		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

		// https://issuetracker.google.com/issues/181593646
		ksp {
			arg("room.schemaLocation", "$projectDir/schemas".toString())
			arg("room.generateKotlin", "true")
		}
	}
	signingConfigs {
		create("release") {
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
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

	kotlinOptions {
		jvmTarget = "17"
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
	val room_version = "2.6.1"
	val lifecycle_version = "2.8.3"
	val activity_version = "1.9.0"
	val coroutines_version = "1.8.1"

	implementation("de.tutao:tutasdk")
	implementation(project(":tutashared"))

	implementation("commons-io:commons-io:2.20.0")

	implementation("androidx.core:core-ktx:1.17.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.9.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.7")

	implementation("androidx.room:room-ktx:$room_version")
	ksp("androidx.room:room-compiler:$room_version")


	implementation(files("../libs/sqlcipher-android.aar"))


	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.4")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
	implementation("org.jetbrains.kotlin:kotlin-stdlib:$libs.versions.kotlin")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.3")
	implementation("com.squareup.okhttp3:okhttp:5.1.0")

	implementation("net.java.dev.jna:jna:5.18.0@aar")

	testImplementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:${libs.versions.kotlin}")
	testImplementation("androidx.test.ext:junit-ktx:1.3.0")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.16")
	testImplementation("org.mockito.kotlin:mockito-kotlin:6.0.0")
	// JVM-based unit tests (that don't need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("com.linkedin.dexmaker:dexmaker-mockito-inline-extended:2.28.6") {
		exclude(group = "org.mockito'", module = "mockito-core")
	}
	androidTestImplementation("org.mockito:mockito-core:5.20.0")
	androidTestImplementation("org.mockito.kotlin:mockito-kotlin:6.0.0")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
	androidTestImplementation("androidx.test:runner:1.7.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.3.0")
	androidTestImplementation("androidx.test:rules:1.7.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.20.0")
	androidTestImplementation("androidx.room:room-testing:2.8.0")
}