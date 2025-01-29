import groovy.json.JsonSlurper

def targetBranch = "master"
def targetMac = "mac-intel"

HashSet<String> changedPaths = new HashSet<>()

pipeline {
	options {
		parallelsAlwaysFailFast()
	}
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten"
		ANDROID_SDK_ROOT = "/opt/android-sdk-linux"
		ANDROID_HOME = "/opt/android-sdk-linux"
		RUSTFLAGS = "--cfg ci"
	}

	agent {
		label 'linux'
	}

	tools {
		jdk 'jdk-21.0.2'
	}

	parameters {
		string(name: 'BRANCH_NAME', defaultValue: 'test-jenkins-merge', description: 'Branch to merge to master')
	}

	stages {
		stage("git") {
			parallel {
				stage("git checkout mac") {
					when {
						expression {
							return true
						}
					}
					agent {
						label targetMac
					}
					steps {
						git(
								url: "git@github.com:tutao/tutanota.git",
								branch: params.BRANCH_NAME,
								changelog: true,
								poll: true
						)
					}
				}

				stage("git fetch and switch to branch") {

					steps {
						git(
								url: "git@github.com:tutao/tutanota.git",
								branch: params.BRANCH_NAME,
								changelog: true,
								poll: true
						)

					}
				}
			}
		}
		stage("sync submodules") {
			steps {
				sh '''
				                git submodule init
	                     		git submodule sync --recursive
				                git submodule update
			                   	'''
				script {
					def successfulMasterFetch = sh(returnStatus: true, script: "git fetch origin master:master").toInteger()
					if (successfulMasterFetch != 0) {
						abortJob("Failed to fetch master. Please wipe jenkins workspace and try again.")
					}

					def isOnTopOfTarget = sh(returnStatus: true, script: "git merge-base --is-ancestor ${targetBranch} ${params.BRANCH_NAME}").toInteger()
					if (isOnTopOfTarget == 1) {
						abortJob("branch ${params.BRANCH_NAME} is not rebased on top of ${targetBranch}. Please rebase and run again...")
					}
					initialize(changedPaths, targetBranch)
				}
			}
		}

		stage("Source code checks") {
			parallel {
				stage("npm ci") {
					when {
						expression {
							return shouldRunNpmCi()
						}
					}
					steps {
						sh 'npm ci'
					}
				}
				stage("find FIXMEs") {
					steps {
						sh '''
								if grep "FIXME\\|[fF]ixme" -r src buildSrc test/tests packages/*/lib app-android/app/src app-ios/tutanota/Sources; then
									echo 'FIXMEs in src';
									exit 1;
								else
									echo 'No FIXMEs in src';
								fi
								'''
					}

				}
			}
		}
		stage("Lint and Style") {
			parallel {
				stage("lint:check") {
					steps {
						sh 'npm run lint:check'
					}
				}
				stage("style:check") {
					steps {
						sh 'npm run style:check'
					}
				}
				stage("build-packages") {
					steps {
						sh 'npm run build-packages'
					}
				}
				stage("prepare/lint mac") {
					agent {
						label targetMac
					}
					when {
						expression {
							return shouldRunOnMac(changedPaths)
						}
					}
					steps {
						sh '''
							mkdir -p ./build-calendar-app
							mkdir -p ./build

							cd app-ios
							#./lint.sh lint:check
							./lint.sh style:check

							# xcodegen is not installed on m1
							/usr/local/bin/xcodegen --spec calendar-project.yml
							/usr/local/bin/xcodegen --spec mail-project.yml

							cd ../tuta-sdk/ios
							/usr/local/bin/xcodegen

						'''
					}
				}

			}
		}
		stage("Parallelize everything") {
			parallel {
				stage("packages test") {
					when {
						expression {
							return runByDefault()
						}
					}
					steps {
						sh 'npm run --if-present test -ws'
					}
				}
				stage("node tests") {
					when {
						expression {
							return runByDefault()
						}
					}
					steps {
						sh 'cd test && node test'
					}
				}
				stage("browser tests") {
					when {
						expression {
							return runByDefault()
						}
					}
					steps {
						sh 'npm run test:app -- --no-run --browser --browser-cmd \'$(which chromium) --no-sandbox --enable-logging=stderr --headless=new --disable-gpu\''
					}
				}
				stage("build web app") {
					when {
						expression {
							return runByDefault()
						}
					}
					steps {
						sh 'node webapp --disable-minify'
					}
				}
				stage("build web app calendar") {
					when {
						expression {
							return runByDefault()
						}
					}
					steps {
						sh 'node webapp --disable-minify --app calendar'
					}
				}
				stage("mac mail tests") {
					agent {
						label targetMac
					}
					when {
						expression {
							return shouldRunOnMac(changedPaths)
						}
					}
					environment {
						LC_ALL = "en_US.UTF-8"
						LANG = "en_US.UTF-8"
					}
					steps {
						dir("app-ios") {
							sh 'fastlane test_github'
						}
					}
				}
				stage("mac calendar tests") {
					agent {
						label targetMac
					}
					when {
						expression {
							return shouldRunOnMac(changedPaths)
						}
					}
					environment {
						LC_ALL = "en_US.UTF-8"
						LANG = "en_US.UTF-8"
					}
					steps {
						dir("app-ios") {
							sh 'fastlane test_calendar_github'
						}
					}
				}
				stage("android tests") {
//					when {
//						expression {
//							return runByDefault()
//						}
//					}
					environment {
						TZ = "Europe/Berlin" // We have some tests for same day alarms that depends on this TimeZone
					}
					steps {
						sh '''
mkdir -p build
mkdir -p build-calendar-app
cd app-android
./gradlew lint --quiet
./gradlew test
'''
					}
				}
			}
		}
	}
}

void abortJob(String errorMsg) {
	print(errorMsg)
	error(errorMsg)
}

boolean shouldRunNpmCi() {
	def current = readFile(file: 'package.json')
	def old
	try {
		old = readFile(file: 'cache/package.json')
	} catch (e) {
		print e
		return true
	} finally {
		writeFile(file: 'cache/package.json', text: current)
	}
	def json = new JsonSlurper()
	def oldJson = json.parseText(old)
	def currentJson = json.parseText(current)
	def oldVersion = oldJson.version
	def currentVersion = currentJson.version
	def oldWithUpdatedVersion = old.replaceAll(oldVersion, currentVersion)
	def expectedJSON = json.parseText(oldWithUpdatedVersion)
	if (expectedJSON.equals(currentJson)) {
		print "skipping npm ci as package.json is unchanged"
		return false
	} else {
		return true
	}
}


void initialize(HashSet<String> changedPaths, String targetBranch) {
	def out = sh(returnStdout: true, script: "git diff --name-status ${targetBranch}")
	def lines = out.split('\n')
	for (String line : lines) {
		def split = line.split("\t")
		// lines with moved files contain three parts
		if (split.length > 3) {
			abortJob("unexpected line: " + line)
		}
		changedPaths.add(split[split.length - 1].trim())
	}
}

boolean hasChangeForPath(HashSet<String> changedPaths, String pathPrefix, String ignoredSuffix) {
	for (String p : changedPaths) {
		if (p.startsWith(pathPrefix) && !p.endsWith(ignoredSuffix)) {
			return true
		}
	}
	return false
}

boolean shouldRunOnMac(HashSet<String> changedPaths) {
	return hasChangeForPath(changedPaths, "app-ios", "Info.plist")
	return true
}

boolean runByDefault() {
//	return true
	return false
}

//TODO
// why do we build web app and web app calendar? Is running tsc enough? -> willow?

// swift and kotlin tests
// why does cargo compiles every run




