plugins {
	id("com.android.library")
	id("org.jetbrains.kotlin.android")
	id("org.mozilla.rust-android-gradle.rust-android")
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
	return listOf("arm", "arm64", "x86", "x86_64")
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
		consumerProguardFiles("consumer-rules.pro")
	}

	buildTypes {
		debug {
			isJniDebuggable=true
		}
		release {
			isMinifyEnabled = false
			proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
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
	implementation("net.java.dev.jna:jna:5.13.0@aar")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")
	implementation("androidx.annotation:annotation:1.8.0")
	testImplementation("junit:junit:4.13.2")
	androidTestImplementation("androidx.test.ext:junit:1.1.5")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
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
		"mergeDebugJniLibFolders", "mergeReleaseJniLibFolders" -> dependsOn("cargoBuild")
	}
}

tasks.whenTaskAdded {
	when (name) {
		"compileDebugKotlin", "compileReleaseKotlin" -> dependsOn("generateBinding")
	}
}