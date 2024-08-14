plugins {
	id("com.android.library")
	id("org.jetbrains.kotlin.android")
	id("kotlin-kapt")
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

android {
	namespace = "de.tutao.tutashared"
	compileSdk = 34

	defaultConfig {
		minSdk = 24

		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
		consumerProguardFiles("consumer-rules.pro")
		externalNativeBuild {
			cmake {
				cppFlags += ""
			}
		}

		javaCompileOptions {
			annotationProcessorOptions {
				this.arguments["room.schemaLocation"] = "$projectDir/schemas"
			}
		}
	}

	buildFeatures {
		buildConfig = true
	}

	buildTypes.map {
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField("String", "SYS_MODEL_VERSION", "\"99\"")
		it.buildConfigField("String", "TUTANOTA_MODEL_VERSION", "\"73\"")
		it.buildConfigField("String", "RES_ADDRESS", "\"tutanota\"")
		it.buildConfigField("String", "VERSION_NAME", "\"240.240731.0\"")
	}

	buildTypes {
		debug {
			resValue("string", "package_name", "de.tutao.tutashared.debug")
			manifestPlaceholders.clear()
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider.debug"
			isJniDebuggable = true
		}
		release {
			manifestPlaceholders += mapOf()
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutashared")
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider"
			isMinifyEnabled = false
			proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")


		}
		create("releaseTest") {
			initWith(getByName("release"))
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutashared.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders["contentProviderAuthority"] = "de.tutao.fileprovider.test"
		}
	}

	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_17
		targetCompatibility = JavaVersion.VERSION_17
	}

	kotlinOptions {
		jvmTarget = "17"
	}

	externalNativeBuild {
		cmake {
			this.path(file("src/main/cpp/CMakeLists.txt"))
			this.version = "3.18.0+"
		}
	}

	sourceSets {
		this.getByName("debug").assets.srcDirs(files("$projectDir/schemas"))
	}
}

dependencies {
	val room_version = "2.4.2"
	val lifecycle_version = "2.4.1"
	val activity_version = "1.4.0"
	val coroutines_version = "1.8.0"
// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt instead of annotationProcessor
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		val includes: Map<String, Any> = mapOf("include" to arrayOf("*.aar"), "dir" to "../libs")
		implementation(fileTree(includes))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.1")
	implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
	implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.22")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.11.0")

	implementation("net.java.dev.jna:jna:5.13.0@aar")

	testImplementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.22")
	testImplementation("androidx.test.ext:junit-ktx:1.1.3")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.11.1")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
	// JVM-based unit tests (that don't need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("org.mockito:mockito-android:5.11.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}