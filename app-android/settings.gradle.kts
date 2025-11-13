pluginManagement {
	includeBuild("build-common")
	repositories {
		gradlePluginPortal()
		google()
		mavenCentral()
	}
}

dependencyResolutionManagement {
	repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
	repositories {
		google()
		mavenCentral()
	}
}

includeBuild("../tuta-sdk/android") {
	name = "tutasdk"
	dependencySubstitution {
		substitute(module("de.tutao:tutasdk")).using(project(":sdk"))
	}
}

include(":app")
include(":calendar")
// FIXME
//project(":calendar").projectDir = File(rootDir, 'calendar/')
include(":tutashared")