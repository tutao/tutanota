repositories {
    mavenLocal()
    maven {
        credentials(PasswordCredentials::class)
        url = uri("https://next.tutao.de/nexus/content/groups/public/")
    }
}

plugins {
    java
}

dependencies {
    implementation("com.icegreen:greenmail-standalone:2.1.0")
}

tasks.jar {
    val dependencies = configurations
        .runtimeClasspath
        .get()
        .map(::zipTree) // OR .map { zipTree(it) }
    from(dependencies)
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}