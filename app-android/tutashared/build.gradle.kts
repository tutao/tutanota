plugins {
	// IMPORTANT: must be *before* other plugins or you will run into "duplicate sources" error
	// https://github.com/mozilla/rust-android-gradle/issues/147#issuecomment-2134688017
	id("org.mozilla.rust-android-gradle.rust-android")
	id("com.android.library")
	id("org.jetbrains.kotlin.android")
	id("com.google.devtools.ksp")
	id("org.jetbrains.kotlin.plugin.serialization") version "2.2.20"
	id("kotlin-android")
}

group = "de.tutao"

android {
	namespace = "de.tutao.tutashared"
	compileSdk = 36

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

	ndkVersion = "28.2.13676358"
}

val tutanota3Root = layout.projectDirectory
	.dir("..") // tutanota/tutashared
	.dir("..") // tutanota
val ftsCreatePath = tutanota3Root.dir("libs").dir("Signal-FTS5-Extension")

fun getActiveBuildType(): String {
	var buildType = "debug"
	val taskNames = gradle.parent?.startParameter?.taskNames
	if (!taskNames.isNullOrEmpty()) {
		if (taskNames.size > 0) {
			val targetTask = taskNames[0].lowercase()
			if (targetTask.contains("release")) {
				buildType = "release"
			}
		}
	}
	return buildType
}

fun getABITargets(): List<String> {
	val targetAbiPropertyValue = findProperty("targetABI") as String?
	if (targetAbiPropertyValue == null) {
		return listOf("arm", "arm64", "x86_64")
	}
	return targetAbiPropertyValue.orEmpty().split(",")
}

cargo {
	module = ftsCreatePath.toString()
	libname = "signal_tokenizer"
	prebuiltToolchains = true
	pythonCommand = "python3"
	targets = getABITargets()
	profile = getActiveBuildType()
	verbose = true
	features {
		defaultAnd(arrayOf("extension"))
	}
	exec = { spec, toolchain ->
		spec.environment("RUSTFLAGS", "-C link-arg=-Wl,-z,max-page-size=16384")
	}
}

tasks.whenTaskAdded {
	when (name) {
		"mergeDebugJniLibFolders", "mergeReleaseJniLibFolders", "mergeReleaseTestJniLibFolders" -> {
			dependsOn("cargoBuild")
			mustRunAfter("cargoBuild")
		}
	}
}

dependencies {
	val room_version = "2.8.0"
	val lifecycle_version = "2.9.4"
	val activity_version = "1.11.0"
	val coroutines_version = "1.10.2"
	val kotlin_version = "2.2.20"

	implementation("commons-io:commons-io:2.20.0")
	implementation("de.tutao:tutasdk")

	implementation("androidx.core:core-ktx:1.17.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.9.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.datastore:datastore-preferences:1.1.7")

	implementation("androidx.room:room-ktx:$room_version")
	// For Kotlin use kapt instead of annotationProcessor
	ksp("androidx.room:room-compiler:$room_version")

	// If we would build a standalone AAR out of tutashared we would run into this error:
	// "Direct local .aar file dependencies are not supported when building an AAR. The resulting AAR would be
	// broken because the classes and Android resources from any local .aar file dependencies would not be packaged
	// in the resulting AAR. Previous versions of the Android Gradle Plugin produce broken AARs in this case too
	// (despite not throwing this error)."
	// This is not really a problem for us because we never build a separate AAR out of tutashared, it is just a
	// module.
	compileOnly(files("../libs/sqlcipher-android.aar"))

	implementation("androidx.sqlite:sqlite-ktx:2.6.0")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
	implementation("org.jetbrains.kotlin:kotlin-stdlib:$kotlin_version")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.3")
	implementation("com.squareup.okhttp3:okhttp:5.1.0")

	implementation("net.java.dev.jna:jna:5.18.0@aar")

	testImplementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlin_version")
	testImplementation("androidx.test.ext:junit-ktx:1.3.0")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.16")
	testImplementation("org.mockito.kotlin:mockito-kotlin:6.0.0")
	// JVM-based unit tests (that don't need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("org.mockito.kotlin:mockito-kotlin:6.0.0")
	androidTestImplementation("com.linkedin.dexmaker:dexmaker-mockito-inline-extended:2.28.1") {
		exclude(group = "org.mockito", module = "mockito-core")
	}
	androidTestImplementation("org.mockito:mockito-core:5.20.0")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
	androidTestImplementation("androidx.test:runner:1.7.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.3.0")
	androidTestImplementation("androidx.test:rules:1.7.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.20.0")
	androidTestImplementation("androidx.room:room-testing:2.8.0")
}