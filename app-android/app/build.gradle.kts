import org.jetbrains.kotlin.config.KotlinCompilerVersion

plugins {
	id("com.andro.application")
	id("kotlin-andro")
	id("org.jetbrains.kotlin.kapt("))
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

group = "de.tutao"

android {
	defaultConfig {
		compileSdk 34
		applicationId = "de.tutao.tutanota"
		minSdkVersion(26)
		targetSdkVersion(33)
		versionCode = 396365
		versionName = "239.240731.0"
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
	}
	signingConfigs {
		register("release"){
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
			storeFile = "EMPTY")
			storePassword = "EMPTY")
			keyAlias = "EMPTY")
			keyPassword = "EMPTY")

			enableV1Signing = true
			enableV2Signing = true
		}
	}
	flavorDimensions = listOf("releaseType")
	productFlavors {
		tutao {
			signingConfig = signingConfigs.getByName("release")
		}
		fdroid {
		}
	}
	buildTypes {
		named("debug"){
			resValue("string", "package_name", "de.tutao.tutanota.debug")
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.debug")
			applicationIdSuffix = ".debug"
			jniDebuggable true
		}
		named("release"){
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider")
		}
		named("releaseTest"){
			initWith release
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.test")
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		buildConfig = true
	}

	applicationVariants.configureEach { variant ->
		variant.outputs.configureEach { output ->
			plugins {
	id("com.andro.application")
	id("kotlin-andro")
	id("org.jetbrains.kotlin.kapt("))
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

group = "de.tutao"

android {
	defaultConfig {
		compileSdk 34
		applicationId = "de.tutao.tutanota"
		minSdkVersion(26)
		targetSdkVersion(33)
		versionCode = 396365
		versionName = "239.240731.0"
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
	}
	signingConfigs {
		register("release"){
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
			storeFile = "EMPTY")
			storePassword = "EMPTY")
			keyAlias = "EMPTY")
			keyPassword = "EMPTY")

			enableV1Signing = true
			enableV2Signing = true
		}
	}
	flavorDimensions = listOf("releaseType")
	productFlavors {
		tutao {
			signingConfig = signingConfigs.getByName("release")
		}
		fdroid {
		}
	}
	buildTypes {
		named("debug"){
			resValue("string", "package_name", "de.tutao.tutanota.debug")
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.debug")
			applicationIdSuffix = ".debug"
			jniDebuggable true
		}
		named("release"){
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider")
		}
		named("releaseTest"){
			initWith release
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.test")
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		buildConfig = true
	}

	applicationVariants.configureEach { variant ->
		variant.outputs.configureEach { output ->
			val flavor = variant.productFlavorslistOf(0).name
			outputFileName = "tutanota-app-$flavor-${variant.buildType.name}-${variant.versionName}.apk" = versionName}.apk"
		}
	}

	buildTypes.each {
		it.buildConfigField "String", "FILE_PROVIDER_AUTHORITY", """ + it.manifestPlaceholderslistOf("contentProviderAuthority") + """
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField "String", "SYS_MODEL_VERSION", ""105""
		it.buildConfigField "String", "TUTANOTA_MODEL_VERSION", ""73""
		it.buildConfigField "String", "RES_ADDRESS", ""tutanota""
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
			excludes += listOf("META-INF/LICENSE", "META-INF/ASL2.0")
		}
	}
	lint {
		disable "MissingTranslation"
	}

	namespace "de.tutao.tutanota"
}

tasks.withType(Test).configureEach {
	testLogging {
		exceptionFormat "full"
		events "started", "skipped", "passed", "failed"
		showStandardStreams true
	}
}


dependencies {
	implementation(project(":tutashared"))
	val room_version = "2.4.2"
	val lifecycle_version = "2.4.1"
	val activity_version = "1.4.0"
	val coroutines_version = "1.8.0"

	implementation("de.tutao:tutasdk")

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt(instead of annotationProcessor)
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.1")
	implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
	implementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.11.0")

	implementation("net.java.dev.jna:jna:5.13.0@aar")

	testImplementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	testImplementation("androidx.test.ext:junit-ktx:1.1.3")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.11.1")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
	// JVM-based unit tests (that don"t need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("org.mockito:mockito-android:5.11.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}
			outputFileName = "tutanota-app-$flavor-${variant.buildType.name}-${variant.versionName}.apk" = versionName}.apk"
		}
	}

	buildTypes.each {
		it.buildConfigField "String", "FILE_PROVIDER_AUTHORITY", """ + it.manifestPlaceholderslistOf("contentProviderAuthority") + """
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField "String", "SYS_MODEL_VERSION", ""105""
		it.buildConfigField "String", "TUTANOTA_MODEL_VERSION", ""73""
		it.buildConfigField "String", "RES_ADDRESS", ""tutanota""
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
			excludes += listOf("META-INF/LICENSE", "META-INF/ASL2.0")
		}
	}
	lint {
		disable "MissingTranslation"
	}

	namespace "de.tutao.tutanota"
}

tasks.withType(Test).configureEach {
	testLogging {
		exceptionFormat "full"
		events "started", "skipped", "passed", "failed"
		showStandardStreams true
	}
}


dependencies {
	implementation(project(":tutashared"))
	plugins {
	id("com.andro.application")
	id("kotlin-andro")
	id("org.jetbrains.kotlin.kapt("))
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

group = "de.tutao"

android {
	defaultConfig {
		compileSdk 34
		applicationId = "de.tutao.tutanota"
		minSdkVersion(26)
		targetSdkVersion(33)
		versionCode = 396365
		versionName = "239.240731.0"
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
	}
	signingConfigs {
		register("release"){
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
			storeFile = "EMPTY")
			storePassword = "EMPTY")
			keyAlias = "EMPTY")
			keyPassword = "EMPTY")

			enableV1Signing = true
			enableV2Signing = true
		}
	}
	flavorDimensions = listOf("releaseType")
	productFlavors {
		tutao {
			signingConfig = signingConfigs.getByName("release")
		}
		fdroid {
		}
	}
	buildTypes {
		named("debug"){
			resValue("string", "package_name", "de.tutao.tutanota.debug")
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.debug")
			applicationIdSuffix = ".debug"
			jniDebuggable true
		}
		named("release"){
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider")
		}
		named("releaseTest"){
			initWith release
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.test")
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		buildConfig = true
	}

	applicationVariants.configureEach { variant ->
		variant.outputs.configureEach { output ->
			val flavor = variant.productFlavorslistOf(0).name
			outputFileName = "tutanota-app-$flavor-${variant.buildType.name}-${variant.versionName}.apk" = versionName}.apk"
		}
	}

	buildTypes.each {
		it.buildConfigField "String", "FILE_PROVIDER_AUTHORITY", """ + it.manifestPlaceholderslistOf("contentProviderAuthority") + """
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField "String", "SYS_MODEL_VERSION", ""105""
		it.buildConfigField "String", "TUTANOTA_MODEL_VERSION", ""73""
		it.buildConfigField "String", "RES_ADDRESS", ""tutanota""
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
			excludes += listOf("META-INF/LICENSE", "META-INF/ASL2.0")
		}
	}
	lint {
		disable "MissingTranslation"
	}

	namespace "de.tutao.tutanota"
}

tasks.withType(Test).configureEach {
	testLogging {
		exceptionFormat "full"
		events "started", "skipped", "passed", "failed"
		showStandardStreams true
	}
}


dependencies {
	implementation(project(":tutashared"))
	val room_version = "2.4.2"
	val lifecycle_version = "2.4.1"
	val activity_version = "1.4.0"
	val coroutines_version = "1.8.0"

	implementation("de.tutao:tutasdk")

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt(instead of annotationProcessor)
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.1")
	implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
	implementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.11.0")

	implementation("net.java.dev.jna:jna:5.13.0@aar")

	testImplementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	testImplementation("androidx.test.ext:junit-ktx:1.1.3")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.11.1")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
	// JVM-based unit tests (that don"t need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("org.mockito:mockito-android:5.11.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}
	plugins {
	id("com.andro.application")
	id("kotlin-andro")
	id("org.jetbrains.kotlin.kapt("))
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

group = "de.tutao"

android {
	defaultConfig {
		compileSdk 34
		applicationId = "de.tutao.tutanota"
		minSdkVersion(26)
		targetSdkVersion(33)
		versionCode = 396365
		versionName = "239.240731.0"
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
	}
	signingConfigs {
		register("release"){
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
			storeFile = "EMPTY")
			storePassword = "EMPTY")
			keyAlias = "EMPTY")
			keyPassword = "EMPTY")

			enableV1Signing = true
			enableV2Signing = true
		}
	}
	flavorDimensions = listOf("releaseType")
	productFlavors {
		tutao {
			signingConfig = signingConfigs.getByName("release")
		}
		fdroid {
		}
	}
	buildTypes {
		named("debug"){
			resValue("string", "package_name", "de.tutao.tutanota.debug")
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.debug")
			applicationIdSuffix = ".debug"
			jniDebuggable true
		}
		named("release"){
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider")
		}
		named("releaseTest"){
			initWith release
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.test")
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		buildConfig = true
	}

	applicationVariants.configureEach { variant ->
		variant.outputs.configureEach { output ->
			val flavor = variant.productFlavorslistOf(0).name
			outputFileName = "tutanota-app-$flavor-${variant.buildType.name}-${variant.versionName}.apk" = versionName}.apk"
		}
	}

	buildTypes.each {
		it.buildConfigField "String", "FILE_PROVIDER_AUTHORITY", """ + it.manifestPlaceholderslistOf("contentProviderAuthority") + """
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField "String", "SYS_MODEL_VERSION", ""105""
		it.buildConfigField "String", "TUTANOTA_MODEL_VERSION", ""73""
		it.buildConfigField "String", "RES_ADDRESS", ""tutanota""
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
			excludes += listOf("META-INF/LICENSE", "META-INF/ASL2.0")
		}
	}
	lint {
		disable "MissingTranslation"
	}

	namespace "de.tutao.tutanota"
}

tasks.withType(Test).configureEach {
	testLogging {
		exceptionFormat "full"
		events "started", "skipped", "passed", "failed"
		showStandardStreams true
	}
}


dependencies {
	implementation(project(":tutashared"))
	val room_version = "2.4.2"
	val lifecycle_version = "2.4.1"
	val activity_version = "1.4.0"
	val coroutines_version = "1.8.0"

	implementation("de.tutao:tutasdk")

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt(instead of annotationProcessor)
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.1")
	implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
	implementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.11.0")

	implementation("net.java.dev.jna:jna:5.13.0@aar")

	testImplementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	testImplementation("androidx.test.ext:junit-ktx:1.1.3")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.11.1")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
	// JVM-based unit tests (that don"t need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("org.mockito:mockito-android:5.11.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}
	plugins {
	id("com.andro.application")
	id("kotlin-andro")
	id("org.jetbrains.kotlin.kapt("))
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

group = "de.tutao"

android {
	defaultConfig {
		compileSdk 34
		applicationId = "de.tutao.tutanota"
		minSdkVersion(26)
		targetSdkVersion(33)
		versionCode = 396365
		versionName = "239.240731.0"
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
	}
	signingConfigs {
		register("release"){
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
			storeFile = "EMPTY")
			storePassword = "EMPTY")
			keyAlias = "EMPTY")
			keyPassword = "EMPTY")

			enableV1Signing = true
			enableV2Signing = true
		}
	}
	flavorDimensions = listOf("releaseType")
	productFlavors {
		tutao {
			signingConfig = signingConfigs.getByName("release")
		}
		fdroid {
		}
	}
	buildTypes {
		named("debug"){
			resValue("string", "package_name", "de.tutao.tutanota.debug")
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.debug")
			applicationIdSuffix = ".debug"
			jniDebuggable true
		}
		named("release"){
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider")
		}
		named("releaseTest"){
			initWith release
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.test")
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		buildConfig = true
	}

	applicationVariants.configureEach { variant ->
		variant.outputs.configureEach { output ->
			val flavor = variant.productFlavorslistOf(0).name
			outputFileName = "tutanota-app-$flavor-${variant.buildType.name}-${variant.versionName}.apk" = versionName}.apk"
		}
	}

	buildTypes.each {
		it.buildConfigField "String", "FILE_PROVIDER_AUTHORITY", """ + it.manifestPlaceholderslistOf("contentProviderAuthority") + """
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField "String", "SYS_MODEL_VERSION", ""105""
		it.buildConfigField "String", "TUTANOTA_MODEL_VERSION", ""73""
		it.buildConfigField "String", "RES_ADDRESS", ""tutanota""
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
			excludes += listOf("META-INF/LICENSE", "META-INF/ASL2.0")
		}
	}
	lint {
		disable "MissingTranslation"
	}

	namespace "de.tutao.tutanota"
}

tasks.withType(Test).configureEach {
	testLogging {
		exceptionFormat "full"
		events "started", "skipped", "passed", "failed"
		showStandardStreams true
	}
}


dependencies {
	implementation(project(":tutashared"))
	val room_version = "2.4.2"
	val lifecycle_version = "2.4.1"
	val activity_version = "1.4.0"
	val coroutines_version = "1.8.0"

	implementation("de.tutao:tutasdk")

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt(instead of annotationProcessor)
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.1")
	implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
	implementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.11.0")

	implementation("net.java.dev.jna:jna:5.13.0@aar")

	testImplementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	testImplementation("androidx.test.ext:junit-ktx:1.1.3")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.11.1")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
	// JVM-based unit tests (that don"t need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("org.mockito:mockito-android:5.11.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}
	plugins {
	id("com.andro.application")
	id("kotlin-andro")
	id("org.jetbrains.kotlin.kapt("))
	id("org.jetbrains.kotlin.plugin.serialization") version "1.9.21"
}

group = "de.tutao"

android {
	defaultConfig {
		compileSdk 34
		applicationId = "de.tutao.tutanota"
		minSdkVersion(26)
		targetSdkVersion(33)
		versionCode = 396365
		versionName = "239.240731.0"
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
	}
	signingConfigs {
		register("release"){
			// Provide non-empty placeholders because otherwise configuration will braek even in debug.
			storeFile = "EMPTY")
			storePassword = "EMPTY")
			keyAlias = "EMPTY")
			keyPassword = "EMPTY")

			enableV1Signing = true
			enableV2Signing = true
		}
	}
	flavorDimensions = listOf("releaseType")
	productFlavors {
		tutao {
			signingConfig = signingConfigs.getByName("release")
		}
		fdroid {
		}
	}
	buildTypes {
		named("debug"){
			resValue("string", "package_name", "de.tutao.tutanota.debug")
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.debug")
			applicationIdSuffix = ".debug"
			jniDebuggable true
		}
		named("release"){
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider")
		}
		named("releaseTest"){
			initWith release
			isMinifyEnabled = true
			resValue("string", "package_name", "de.tutao.tutanota.test")
			setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
			manifestPlaceholders = listOf(contentProviderAuthority = "de.tutao.fileprovider.test")
			applicationIdSuffix = ".test"
		}
	}

	buildFeatures {
		buildConfig = true
	}

	applicationVariants.configureEach { variant ->
		variant.outputs.configureEach { output ->
			val flavor = variant.productFlavorslistOf(0).name
			outputFileName = "tutanota-app-$flavor-${variant.buildType.name}-${variant.versionName}.apk" = versionName}.apk"
		}
	}

	buildTypes.each {
		it.buildConfigField "String", "FILE_PROVIDER_AUTHORITY", """ + it.manifestPlaceholderslistOf("contentProviderAuthority") + """
		// keep in sync with src/native/main/NativePushServiceApp.ts
		it.buildConfigField "String", "SYS_MODEL_VERSION", ""105""
		it.buildConfigField "String", "TUTANOTA_MODEL_VERSION", ""73""
		it.buildConfigField "String", "RES_ADDRESS", ""tutanota""
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
			excludes += listOf("META-INF/LICENSE", "META-INF/ASL2.0")
		}
	}
	lint {
		disable "MissingTranslation"
	}

	namespace "de.tutao.tutanota"
}

tasks.withType(Test).configureEach {
	testLogging {
		exceptionFormat "full"
		events "started", "skipped", "passed", "failed"
		showStandardStreams true
	}
}


dependencies {
	implementation(project(":tutashared"))
	val room_version = "2.4.2"
	val lifecycle_version = "2.4.1"
	val activity_version = "1.4.0"
	val coroutines_version = "1.8.0"

	implementation("de.tutao:tutasdk")

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt(instead of annotationProcessor)
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.1")
	implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
	implementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.11.0")

	implementation("net.java.dev.jna:jna:5.13.0@aar")

	testImplementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	testImplementation("androidx.test.ext:junit-ktx:1.1.3")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.11.1")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
	// JVM-based unit tests (that don"t need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("org.mockito:mockito-android:5.11.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}

	implementation("de.tutao:tutasdk")

	// Important: cannot be updated without additional measures as Android 6 and 7 do not have Java 9
	//noinspection GradleDependency
	implementation("commons-io:commons-io:2.5")

	implementation("androidx.core:core-ktx:1.8.0")
	implementation("androidx.activity:activity-ktx:$activity_version")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.biometric:biometric:1.1.0")
	implementation("androidx.core:core-splashscreen:1.0.1")
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.room:room-runtime:$room_version")
	// For Kotlin use kapt(instead of annotationProcessor)
	kapt("androidx.room:room-compiler:$room_version")

	if (file("../libs/android-database-sqlcipher-4.5.0.aar").exists()) {
		implementation(fileTree(include: listOf("*.aar"), dir = "../libs"))
	} else {
		implementation("net.zetetic:android-database-sqlcipher:4.5.0")
	}
	implementation("androidx.sqlite:sqlite:2.0.1")

	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.1")
	implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
	implementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

	// TLS1.3 backwards compatibility for Android < 10
	implementation("org.conscrypt:conscrypt-android:2.5.2")
	implementation("com.squareup.okhttp3:okhttp:4.11.0")

	implementation("net.java.dev.jna:jna:5.13.0@aar")

	testImplementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
	testImplementation("androidx.test.ext:junit-ktx:1.1.3")
	testImplementation("junit:junit:4.13.2")
	testImplementation("org.robolectric:robolectric:4.11.1")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
	// JVM-based unit tests (that don"t need a real device or emulator)
	testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

	androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
	androidTestImplementation("androidx.test:runner:1.4.0")
	androidTestImplementation("androidx.test.ext:junit-ktx:1.1.3")
	androidTestImplementation("androidx.test:rules:1.4.0")
	androidTestImplementation("org.mockito:mockito-android:5.11.0")
	androidTestImplementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
	androidTestImplementation("androidx.room:room-testing:2.4.2")
}