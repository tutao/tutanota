// There is currently a bug in Android Gradle Plugin 8.4+.
// Workaround from https://github.com/mozilla/rust-android-gradle/issues/147#issuecomment-2134688017
plugins {
	id("org.mozilla.rust-android-gradle.rust-android")
	id("com.android.library")
	id("org.jetbrains.kotlin.android")
}

dependencies {
	implementation("net.java.dev.jna:jna:5.14.0@aar")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
	implementation("androidx.annotation:annotation:1.8.0")
	testImplementation("junit:junit:4.13.2")
	androidTestImplementation("androidx.test.ext:junit:1.2.1")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}

val tutanota3Root = layout.projectDirectory
	.dir("..") // tutanota-3/tuta-sdk/android
	.dir("..") // tutanota-3/tuta-sdk/
	.dir("..") // tutanota-3
val rustSdkCratePath = tutanota3Root.dir("tuta-sdk").dir("rust").dir("sdk")
val sdkUniffiConfigFile = tutanota3Root.dir("tuta-sdk").dir("rust").dir("sdk").file("uniffi.toml")

cargo {
	module = rustSdkCratePath.toString()
	libname = "tutasdk"
	prebuiltToolchains = true
	pythonCommand = "python3"
	targets = getABITargets()
	profile = getActiveBuildType()
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
		listOf("arm", "arm64")
	else
		listOf(abi)
}

fun abiTargetToJniTarget(abiTarget: String): String {
	return when (abiTarget) {
		"arm" -> "armeabi-v7a"
		"arm64" -> "arm64-v8a"
		"x86_64" -> "x86_64"
		else -> throw RuntimeException("unknown abi target: $abiTarget")
	}
}

fun jniTargetToRustTargetName(jniTargetName: String): String {
	return when (jniTargetName) {
		"arm64-v8a" -> "aarch64-linux-android"
		"armeabi-v7a" -> "armv7-linux-androideabi"
		"x86_64" -> "x86_64-linux-android"
		else -> throw RuntimeException("unknwon jni name $jniTargetName")
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

		// Limit the ABIs this can be built for; we do not support base x86
		ndk.abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86_64")
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
	ndkVersion = "26.1.10909125"
}

tasks.register("generateBinding") {
	dependsOn("cargoBuild")

	if (!sdkUniffiConfigFile.asFile.exists()) throw RuntimeException("I would expect uniffi.toml for rust-sdk")


	getABITargets().forEach { abiTargetName ->
		val jniTargetName = abiTargetToJniTarget(abiTargetName)
		val rustTargetName = jniTargetToRustTargetName(jniTargetName)

		val tutasdkSharedObjectPath =
			tutanota3Root.dir("target").dir(rustTargetName).dir(getActiveBuildType()).file("libtutasdk.so")
		val kotlinHeaderTargetDir = file("${layout.buildDirectory.asFile.get()}/generated-sources/tuta-sdk")

		doLast {
			exec {
				workingDir = tutanota3Root.asFile
				executable = "cargo"
				args = listOf("build", "--lib", "--package", "tuta-sdk")
			}

			exec {
				workingDir = tutanota3Root.asFile
				executable = "cargo"
				args = listOf(
					"run",
					"--package",
					"uniffi-bindgen",
					"generate",
					"--language",
					"kotlin",
					"--out-dir",
					kotlinHeaderTargetDir.toString(),
					"--library",
					tutasdkSharedObjectPath.toString(),
					"--config",
					sdkUniffiConfigFile.toString(),
				)
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