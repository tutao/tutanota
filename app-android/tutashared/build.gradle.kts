plugins {
	id("com.android.library")
	id("org.jetbrains.kotlin.android")
	id("com.google.devtools.ksp")
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
	id("kotlin-android")
}

group = "de.tutao"

android {
	namespace = "de.tutao.tutashared"
	compileSdk = 34



	defaultConfig {
		minSdk = 26
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

		// Proguard rules that are passed on to the users of the library
		// See https://developer.android.com/studio/projects/android-library#Considerations
		consumerProguardFiles("consumer-rules.pro")
		// https://issuetracker.google.com/issues/181593646
		ksp {
			arg("room.schemaLocation", "$projectDir/schemas".toString())
			arg("room.generateKotlin", "true")
		}
	}

	lint {
		this.disable.add("MissingTranslation")
	}

	buildFeatures {
		buildConfig = true
	}

	buildTypes {
		debug {
			resValue("string", "package_name", "de.tutao.tutashared.debug")
			manifestPlaceholders.clear()
			manifestPlaceholders += mapOf("contentProviderAuthority" to "de.tutao.fileprovider.debug")
			isJniDebuggable = true
		}
		release {
			isMinifyEnabled = false
			manifestPlaceholders.clear()
			manifestPlaceholders += mapOf("contentProviderAuthority" to "de.tutao.fileprovider")
			resValue("string", "package_name", "de.tutao.tutashared")

		}
		create("releaseTest") {
			isMinifyEnabled = false
			manifestPlaceholders.clear()
			manifestPlaceholders += mapOf("contentProviderAuthority" to "de.tutao.fileprovider.test")
			resValue("string", "package_name", "de.tutao.tutashared. ")
		}
	}

	buildTypes.map {
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField("String", "SYS_MODEL_VERSION", "\"99\"")
		it.buildConfigField("String", "TUTANOTA_MODEL_VERSION", "\"73\"")
		it.buildConfigField("String", "RES_ADDRESS", "\"tutanota\"")
		it.buildConfigField("String", "VERSION_NAME", "\"240.240731.0\"")
	}

	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_17
		targetCompatibility = JavaVersion.VERSION_17
	}

	kotlinOptions {
		jvmTarget = "17"
	}

	sourceSets {
		this.getByName("debug").assets.srcDirs(files("$projectDir/schemas"))
	}
}

dependencies {
	val room_version = "2.6.1"
	val lifecycle_version = "2.8.3"
	val activity_version = "1.9.0"
	val coroutines_version = "1.8.1"
	val kotlin_version = "2.0.0"

	implementation("commons-io:commons-io:2.16.1")
	implementation("de.tutao:tutasdk")

	implementation("androidx.core:core-ktx:1.13.1")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	implementation("androidx.room:room-ktx:$room_version")
	// For Kotlin use kapt instead of annotationProcessor
	ksp("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		// We are not allowed to depend on an aar lib from an library, but, we can
		// use compileOnly IF we still include the library in our applications
		compileOnly(files("../libs/android-database-sqlcipher-4.5.0.aar"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite-ktx:2.4.0")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")
	implementation("org.jetbrains.kotlin:kotlin-stdlib:$kotlin_version")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.12.0")

	implementation("net.java.dev.jna:jna:5.14.0@aar")

	testImplementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlin_version")
	testImplementation("androidx.test.ext:junit-ktx:1.2.1")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.13")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
	// JVM-based unit tests (that don't need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
	androidTestImplementation("androidx.test:runner:1.6.1")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.2.1")
	androidTestImplementation("androidx.test:rules:1.6.1")
	androidTestImplementation("org.mockito:mockito-android:5.12.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.17.2")
	androidTestImplementation("androidx.room:room-testing:2.6.1")
}