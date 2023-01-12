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
					def util = load "ci/jenkins-lib/util.groovy"

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
						// Taking SQLCIPHER_CFLAGS from
						// https://github.com/sqlcipher/android-database-sqlcipher/blob/5164a1ba002929c739f6c31fafae588ac7a914f5/build.gradle#L88
						// because not specifying it does not default to them for some reason.
						// And then things break (see https://github.com/tutao/tutanota/issues/4560).
						//
						// If the library is updated the flags should be updated as well.

						sh '''PATH=$PWD/../android-ndk-r23:$PATH \
                        	  ANDROID_NDK_ROOT=$PWD/../android-ndk-r23 \
                        	  ANDROID_NDK_HOME=$PWD/../android-ndk-r23 \
                        	  OPENSSL_ROOT=$PWD/../openssl \
                        	  SQLCIPHER_ROOT=$PWD/../sqlcipher \
                        	  SQLCIPHER_CFLAGS="-DSQLITE_HAS_CODEC -DSQLITE_SOUNDEX -DHAVE_USLEEP=1 -DSQLITE_MAX_VARIABLE_NUMBER=99999 -DSQLITE_TEMP_STORE=3 -DSQLITE_THREADSAFE=1 -DSQLITE_DEFAULT_JOURNAL_SIZE_LIMIT=1048576 -DNDEBUG=1 -DSQLITE_ENABLE_MEMORY_MANAGEMENT=1 -DSQLITE_ENABLE_LOAD_EXTENSION -DSQLITE_ENABLE_COLUMN_METADATA -DSQLITE_ENABLE_UNLOCK_NOTIFY -DSQLITE_ENABLE_RTREE -DSQLITE_ENABLE_STAT3 -DSQLITE_ENABLE_STAT4 -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_FTS4 -DSQLITE_ENABLE_FTS5 -DSQLCIPHER_CRYPTO_OPENSSL -DSQLITE_ENABLE_DBSTAT_VTAB" \
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