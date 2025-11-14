import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
	// IMPORTANT: must be *before* other plugins or you will run into "duplicate sources" error
	// https://github.com/mozilla/rust-android-gradle/issues/147#issuecomment-2134688017
	alias(libs.plugins.rust.android)
	id("com.android.library")
	id("org.jetbrains.kotlin.android")
	alias(libs.plugins.google.ksp)
	alias(libs.plugins.kotlin.serialization)
	id("kotlin-android")
	alias(libs.plugins.tutao.testconvention)
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
			arg("room.schemaLocation", "$projectDir/schemas")
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

	sourceSets {
		this.getByName("debug").assets.srcDirs(files("$projectDir/schemas"))
	}

	ndkVersion = "28.2.13676358"
}

kotlin {
	compilerOptions {
		jvmTarget = JvmTarget.JVM_17
	}
}

val tutanota3Root = layout.projectDirectory
	.dir("..") // tutanota/tutashared
	.dir("..") // tutanota
val ftsCreatePath = tutanota3Root.dir("libs").dir("Signal-FTS5-Extension")

fun getActiveBuildType(): String {
	val taskNames = gradle.parent?.startParameter?.taskNames
	if (!taskNames.isNullOrEmpty()) {
		val targetTask = taskNames[0].lowercase()
		if (targetTask.contains("release")) {
			return "release"
		}
	}
	return "debug"
}

fun getABITargets(): List<String> {
	val targetAbiPropertyValue = findProperty("targetABI") as String?
		?: return listOf("arm", "arm64", "x86_64")
	return targetAbiPropertyValue.split(",")
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
	exec = { spec, _ ->
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

tasks.register("itest") {
	dependsOn("testDeviceDebugAndroidTest")
}

dependencies {
	implementation(libs.commons.io)
	implementation(libs.tutasdk)

	implementation(libs.androidx.core.ktx)
	implementation(libs.androidx.activity.ktx)
	implementation(libs.androidx.browser)
	implementation(libs.androidx.biometric)
	implementation(libs.androidx.datastore.preferences)

	implementation(libs.androidx.room.ktx)
	// For Kotlin use kapt instead of annotationProcessor
	ksp(libs.androidx.room.compiler)

	// If we would build a standalone AAR out of tutashared we would run into this error:
	// "Direct local .aar file dependencies are not supported when building an AAR. The resulting AAR would be
	// broken because the classes and Android resources from any local .aar file dependencies would not be packaged
	// in the resulting AAR. Previous versions of the Android Gradle Plugin produce broken AARs in this case too
	// (despite not throwing this error)."
	// This is not really a problem for us because we never build a separate AAR out of tutashared, it is just a
	// module.
	compileOnly(files("../libs/sqlcipher-android.aar"))

	implementation(libs.androidx.sqlite.ktx)

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
	testImplementation(libs.junit)
	testImplementation(libs.androidx.test.junit.ktx)
	testImplementation(libs.robolectric)
	testImplementation(libs.mockito.kotlin)
	testImplementation(libs.kotlinx.coroutines.test)

	androidTestImplementation(libs.mockito.kotlin)
	androidTestImplementation(libs.mockito.inline) {
		exclude(group = "org.mockito", module = "mockito-core")
	}
	androidTestImplementation(libs.mockito.core)
	androidTestImplementation(libs.androidx.test.espresso.core)
	androidTestImplementation(libs.androidx.test.runner)
	androidTestImplementation(libs.androidx.test.junit.ktx)
	androidTestImplementation(libs.androidx.test.rules)
	androidTestImplementation(libs.jackson.databind)
	androidTestImplementation(libs.androidx.room.testing)
}