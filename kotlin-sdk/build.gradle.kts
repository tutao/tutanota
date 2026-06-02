plugins {
	kotlin("jvm") version "2.2.20"
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
	mavenCentral()
}

dependencies {
	testImplementation(kotlin("test"))
}
java {
	toolchain {
		languageVersion.set(JavaLanguageVersion.of(21))
	}
}

tasks.test {
	useJUnitPlatform()
}