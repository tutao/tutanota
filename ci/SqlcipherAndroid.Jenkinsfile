pipeline {
	environment {
		SQLCIPHER_ANDROID_VERSION = "4.6.0"
	}

	agent {
		label 'linux'
	}

	stages {
		stage("Build & Upload") {
			steps {
				script {
					def util = load "ci/jenkins-lib/util.groovy"

					// Docker plugin fails to mount relative path like `./build-sqlcipher:build-sqlcipher` for whatever
					// reason so we resolve it to an absolute one.
					def outdir = "$WORKSPACE/build-sqlcipher"
					sh "mkdir -p $outdir"

					// We would love to just run the container without overriding entrypoint but Jenkins plugin is not
					// really designed for that. You can either use withRun() to start a detached container that needs
					// to be set up manually or inside() to run some steps synchronously, but that overrides entrypoint.
					docker.build("android-sqlcipher", "-f ci/containers/android-sqlcipher.dockerfile")
							.inside("-v $outdir:/build-sqlcipher --network=host") {
								sh "/build-sqlcipher-android.sh"
							}
					sh "ls -l ./build-sqlcipher"
					util.publishToNexus(
							groupId: "lib",
							artifactId: "android-database-sqlcipher",
							version: SQLCIPHER_ANDROID_VERSION,
							assetFilePath: "${WORKSPACE}/build-sqlcipher/sqlcipher-android-${SQLCIPHER_ANDROID_VERSION}-release.aar",
							fileExtension: 'aar'
					)
				}
			}
		}
	}
}