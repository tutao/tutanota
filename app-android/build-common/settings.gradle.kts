// adopted from https://github.com/android/architecture-samples/blob/multimodule/build-logic/settings.gradle.kts
dependencyResolutionManagement {
	repositories {
		google()
		mavenCentral()
	}
	versionCatalogs {
		create("libs") {
			from(files("../gradle/libs.versions.toml"))
		}
	}
}

include(":convention")