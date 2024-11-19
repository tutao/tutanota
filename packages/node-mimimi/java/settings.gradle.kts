rootProject.name = "greenmail-test-server"

pluginManagement {
	repositories {
		mavenLocal()
		maven {
			url = uri("https://next.tutao.de/nexus/content/groups/public/")
			credentials(PasswordCredentials::class)
		}
	}
}

buildscript {
	repositories {
		mavenLocal()
		maven {
			credentials(PasswordCredentials::class)
			url = uri("https://next.tutao.de/nexus/content/groups/public/")
		}
	}
	dependencies {
		classpath(group = "de.tutao.gradle", name = "devDefaults", version = "3.6.2")
	}
}