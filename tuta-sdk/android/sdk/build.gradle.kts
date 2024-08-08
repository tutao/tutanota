// There is currently a bug in Android Gradle Plugin 8.4+.
// Workaround from https://github.com/mozilla/rust-android-gradle/issues/147#issuecomment-2134688017
plugins {
	id("org.mozilla.rust-android-gradle.rust-android")
	id("com.android.library")
	id("org.jetbrains.kotlin.android")
}

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
	var abi = project.gradle.parent?.startParameter?.projectProperties?.get("targetABI")
	if (abi.isNullOrBlank())
		abi = findProperty("targetABI") as String?

	return if (abi.isNullOrBlank())
		listOf("arm", "arm64", "x86", "x86_64")
	else
		listOf(abi)
}

fun getJNILibsDirs(): List<String> {
	val abiTargets = getABITargets()
	return abiTargets.map {
		when (it) {
			"arm" -> "armeabi-v7a"
			"arm64" -> "arm64-v8a"
			"x86" -> "x86"
			"x86_64" -> "x86_64"
			else -> "arm64-v8a"
		}
	}
}


android {
	namespace = "de.tutao.tutasdk"
	compileSdk = 34

	defaultConfig {
		minSdk = 26

		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
		// Proguard rules that are passed on to the users of the library
		// See https://developer.android.com/studio/projects/android-library#Considerations
		consumerProguardFiles("consumer-rules.pro")
	}

	buildTypes {
		debug {
			isJniDebuggable = true
		}
		release {
			// Do not apply minification to the library artifact itself, without the application code that references
			// the specific classes we cannot know what we need to keep so we would have to effectively disable
			// minification anyway.
			isMinifyEnabled = false
		}
		create("releaseTest") {
			initWith(getByName("release"))
		}
	}
	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_1_8
		targetCompatibility = JavaVersion.VERSION_1_8
	}
	kotlinOptions {
		jvmTarget = "1.8"
	}
	sourceSets["main"].java.srcDirs(file("${layout.buildDirectory.asFile.get()}/generated-sources/tuta-sdk"))
}

dependencies {
	implementation("net.java.dev.jna:jna:5.14.0@aar")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
	implementation("androidx.annotation:annotation:1.8.0")
	testImplementation("junit:junit:4.13.2")
	androidTestImplementation("androidx.test.ext:junit:1.2.1")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}

cargo {
	module = "../../rust"
	libname = "tutasdk"
	prebuiltToolchains = true
	pythonCommand = "python3"
	targets = getABITargets()
	profile = getActiveBuildType()
}

tasks.register("generateBinding") {
	dependsOn("cargoBuild")
	getJNILibsDirs().forEach { dir ->
		doLast {
			exec {
				this.executable("mkdir")
				this.args("-p", "${layout.buildDirectory.asFile.get()}/rustJniLibs/android/${dir}")
			}
			exec {
				this.workingDir("../../rust")
				this.executable("cargo")
				this.args("run", "--bin", "uniffi-bindgen", "generate", "--library", "${layout.buildDirectory.asFile.get()}/rustJniLibs/android/${dir}/libtutasdk.so", "--language", "kotlin", "--out-dir", "${layout.buildDirectory.asFile.get()}/generated-sources/tuta-sdk")
			}
		}
	}
}

tasks.whenTaskAdded {
	when (name) {
		"preDebugBuild", "preReleaseBuild", "preReleaseTestBuild" -> {
			dependsOn("clean")
			mustRunAfter("clean")
		}

		"compileDebugKotlin", "compileReleaseKotlin", "compileReleaseTestKotlin" -> {
			dependsOn("generateBinding")
			mustRunAfter("generateBinding")
		}

		"mergeDebugJniLibFolders", "mergeReleaseJniLibFolders", "mergeReleaseTestJniLibFolders" -> {
			dependsOn("cargoBuild")
			mustRunAfter("cargoBuild")
		}
	}
}