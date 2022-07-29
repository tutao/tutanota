pipeline {
	environment {
		ANDROID_SDK_ROOT = "/opt/android-sdk-linux"
		ANDROID_HOME = "/opt/android-sdk-linux"
		SQLCIPHER_ANDROID_VERSION = "4.5.0"
	}

	agent {
		label 'linux'
	}

	stages {
		stage("Build and upload it") {
			steps {
				script {
					def util = load "jenkins-lib/util.groovy"

					sh "git clone https://github.com/sqlcipher/android-database-sqlcipher.git"
					sh "git clone git://git.openssl.org/openssl.git"
					dir("openssl") {
						sh "git checkout OpenSSL_1_1_1-stable"
					}
					sh "git clone https://github.com/sqlcipher/sqlcipher"
					dir ("sqlcipher") {
						sh "git checkout v$SQLCIPHER_ANDROID_VERSION"
					}
					sh "curl -v https://dl.google.com/android/repository/android-ndk-r23-linux.zip -o android-ndk"
					sh "unzip -q android-ndk"
					dir("android-database-sqlcipher") {
						sh '''PATH=$PWD/../android-ndk-r23:$PATH \
                        	  ANDROID_NDK_ROOT=$PWD/../android-ndk-r23 \
                        	  ANDROID_NDK_HOME=$PWD/../android-ndk-r23 \
                        	  OPENSSL_ROOT=$PWD/../openssl \
                        	  SQLCIPHER_ROOT=$PWD/../sqlcipher \
                        	  SQLCIPHER_CFLAGS=-DSQLITE_HAS_CODEC \
                        	  make build-release
						'''
						sh "ls android-database-sqlcipher/build/outputs/aar"

						util.publishToNexus(
							groupId: "lib",
							artifactId: "android-database-sqlcipher",
							version: SQLCIPHER_ANDROID_VERSION,
							assetFilePath: "${WORKSPACE}/android-database-sqlcipher/android-database-sqlcipher/build/outputs/aar/android-database-sqlcipher-${SQLCIPHER_ANDROID_VERSION}-release.aar",
							fileExtension: 'aar'
						)
					}
				}
			}
		}
	}
}