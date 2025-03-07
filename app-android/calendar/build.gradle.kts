import com.android.build.gradle.internal.tasks.FinalizeBundleTask
import org.gradle.configurationcache.extensions.capitalized

plugins {
	id("com.android.application")
	id("org.jetbrains.kotlin.android")
	id("kotlin-kapt")
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

group = "de.tutao"

android {
	namespace = "de.tutao.calendar"

	defaultConfig {
		compileSdk = 34
		applicationId = "de.tutao.calendar"
		minSdk = 26
		targetSdk = 34
		versionCode = 100
		versionName = "274.250307.0"

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
		this.buildConfig = true
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
		it.buildConfigField("String", "SYS_MODEL_VERSION", "\"119\"")
		it.buildConfigField("String", "TUTANOTA_MODEL_VERSION", "\"80\"")
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
	ndkVersion = "26.1.10909125"
}

dependencies {
	val room_version = "2.4.2"
	val lifecycle_version = "2.4.1"
	val activity_version = "1.4.0"
	val coroutines_version = "1.8.0"

	implementation("de.tutao:tutasdk")
	implementation(project(":tutashared"))

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt instead of annotationProcessor
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/sqlcipher-android-4.6.0.aar").exists()) {
		logger.lifecycle("Using prebuild sqlcipher file in ../libs")
		// "Direct local .aar file dependencies are not supported when building an AAR. The resulting AAR would be
		// broken because the classes and Android resources from any local .aar file dependencies would not be packaged
		// in the resulting AAR. Previous versions of the Android Gradle Plugin produce broken AARs in this case too
		// (despite not throwing this error)."
		implementation(files("../libs/sqlcipher-android-4.6.0.aar"))
	} else {
		logger.lifecycle("Using sqlcipher from remote repository")
		implementation("net.zetetic:sqlcipher-android:4.6.0@aar")
	}

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

	androidTestImplementation("com.linkedin.dexmaker:dexmaker-mockito-inline-extended:2.28.1") {
		exclude(group = "org.mockito", module = "mockito-core")
	}
	androidTestImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
	androidTestImplementation("org.mockito:mockito-core:5.15.2")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}