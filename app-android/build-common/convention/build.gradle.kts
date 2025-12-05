plugins {
	`kotlin-dsl`
}

java {
	sourceCompatibility = JavaVersion.VERSION_17
	targetCompatibility = JavaVersion.VERSION_17
}

dependencies {
	compileOnly(libs.android.tools.build.gradle.plugin)
	compileOnly(libs.kotlin.gradle.plugin)
}

gradlePlugin {
	/**
	 * Register convention plugins so they are available in the build scripts of the application
	 */
	plugins {
		register("testConvention") {
			id = "de.tutao.testconvention"
			implementationClass = "AndroidTestConventionPlugin"
		}
	}
}