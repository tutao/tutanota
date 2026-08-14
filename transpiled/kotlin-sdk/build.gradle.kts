plugins {
  distribution
  alias(libs.plugins.kotlinJvm)
}

repositories {
  mavenCentral()
  mavenLocal()
  gradlePluginPortal()
}

dependencies {
  implementation(libs.kotlin)
  implementation(libs.kotlinReflect)
  implementation(libs.kotlinxCoroutines)
}

tasks.register<JavaExec>("ktfmtFormat") {
  group = "formatting"
  description = "Reformats Kotlin sources in place with ktfmt."
  classpath = files("/opt/bin/ktfmt.jar")
  args("--kotlinlang-style", "src/main/kotlin")
}
