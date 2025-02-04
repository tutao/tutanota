import groovy.json.JsonSlurper

HashSet<String> changeset = new HashSet<String>()

pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten:/usr/lib/bin:/opt/homebrew/bin"
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
		string(
				// this branch will be the initial branch checked out on the job.
				// this is important because if we update the jenkinsfile in a commit
				// we need to run the new version, not the one from master.
				name: 'SOURCE_BRANCH',
				defaultValue: 'test-jenkins-merge',
				description: "Branch that gets merged into TARGET_BRANCH"
		)
		string(
				name: 'TARGET_BRANCH',
				defaultValue: 'dev-infra',
				description: "Branch that gets updated"
		)
		booleanParam(
				name: 'CLEAN_WORKSPACE',
				defaultValue: false,
				description: "run 'git clean -fx' as the first step of the pipeline"
		)
		booleanParam(
				name: 'DRY_RUN',
				defaultValue: true,
				description: "run the tests, but don't push to TARGET_BRANCH"
		)
	}

	stages {
		stage("repo prep") {
			parallel {
				stage("checkout linux") {
					agent {
						label 'linux'
					}
					steps {
						script {
							currentBuild.displayName = "${params.SOURCE_BRANCH} -> ${params.TARGET_BRANCH}${params.DRY_RUN ? " DRY_RUN" : ""}"
						}
						initWorkspace(changeset, params.SOURCE_BRANCH, params.TARGET_BRANCH, params.CLEAN_WORKSPACE)
					}
				}
				stage("checkout mac m1") {
					agent {
						label "mac-m1"
					}
					steps {
						initWorkspace(changeset, params.SOURCE_BRANCH, params.TARGET_BRANCH, params.CLEAN_WORKSPACE)
					}
				}
				stage("checkout mac intel") {
					agent {
						label "mac-intel"
					}
					steps {
						initWorkspace(changeset, params.SOURCE_BRANCH, params.TARGET_BRANCH, params.CLEAN_WORKSPACE)
					}
				}
			}
		}
		stage("Lint and Style") {
			parallel {
				stage("find FIXMEs") {
					steps {
						findFixmes()
					}
				}
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
				stage("prepare, then lint swift on m1") {
					agent {
						label "mac-m1"
					}
					steps {
						prepareSwiftLint(true)
					}
				}
				stage("prepare swift on intel") {
					agent {
						label "mac-intel"
					}
					steps {
						prepareSwiftLint(false)
					}
				}
			}
		}
		stage("Testing and Building") {
			parallel {
				stage("packages test") {
					steps {
						sh 'npm run --if-present test -ws'
					}
				}
				stage("node tests") {
					steps {
						sh 'cd test && node test'
					}
				}
				stage("browser tests") {
					steps {
						sh 'npm run test:app -- --no-run --browser --browser-cmd \'$(which chromium) --no-sandbox --enable-logging=stderr --headless=new --disable-gpu\''
					}
				}
				stage("build web app") {
					steps {
						sh 'node webapp --disable-minify'
					}
				}
				stage("build web app calendar") {
					steps {
						sh 'node webapp --disable-minify --app calendar'
					}
				}
				stage("ios app tests") {
					agent {
						label "mac-m1"
					}
					steps {
						testFastlane("test_tuta_app")
					}
				}
				stage("ios framework tests") {
					agent {
						label "mac-intel"
					}
					steps {
						testFastlane("test_tuta_shared_framework")
					}
				}
				stage("android tests") {
					steps {
						testAndroid()
					}
				}
			}
		}
		stage("finalize") {
			agent {
				label 'linux'
			}
			steps {
				finalize(params.DRY_RUN)
			}
		}
	}
}

void initWorkspace(HashSet<String> changeset, String srcBranch, String targetBranch, boolean shouldClean) {
	if (shouldClean) {
		sh """
			git clean -fx
			cargo clean
		"""
	}
	sh "git status && git remote -v"
	fetch(srcBranch, targetBranch)
	merge(srcBranch, targetBranch)
	submodules()
	sh "git status && git remote -v"
	getChangeset(changeset, targetBranch)
	if (shouldRunNpmCi()) {
		sh "npm ci"
	}
}

void fetch(String srcBranch, String targetBranch) {
	sh """
		git switch --detach HEAD~1
		git branch -D ${targetBranch} ${srcBranch} || true
		git fetch
		git switch ${srcBranch}
		git switch ${targetBranch}
	"""
}

void submodules() {
	sh """
		git submodule init
	    git submodule sync --recursive
		git submodule update
	"""
}

void prepareSwiftLint(boolean shouldRunLint) {
	sh '''
		mkdir -p ./build-calendar-app
		mkdir -p ./build
	'''
	if (shouldRunLint) {
		sh '''
			cd app-ios
			./lint.sh lint:check
			./lint.sh style:check
		'''
	}

	sh '''
		cd app-ios
		xcodegen --spec calendar-project.yml
		xcodegen --spec mail-project.yml

		cd ../tuta-sdk/ios
		xcodegen
	'''
}

void merge(String srcBranch, String targetBranch) {
	def sucessfulMerge = sh(returnStatus: true, script: "git merge --ff-only ${srcBranch}").toInteger()
	if (sucessfulMerge != 0) {
		error("Failed to merge branch ${srcBranch} into ${targetBranch}. Please rebase and try again.")
	}
}

// must be called while checked out on targetBranch, after ff-merging srcBranch.
void getChangeset(HashSet<String> changeset, String targetBranch) {
	def out = sh(returnStdout: true, script: "git diff --name-only ${targetBranch} origin/${targetBranch}")
	def lines = out.split('\n')
	for (String line : lines) {
		changeset.add(line.trim())
	}
	println "changeset:\n\n${changeset.join("\n")}"
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

void findFixmes() {
	sh '''
		if grep "FIXME\\|[fF]ixme" -r src buildSrc test/tests packages/*/lib app-android/app/src app-ios/tutanota/Sources; then
			echo 'FIXMEs in src';
			exit 1;
		else
			echo 'No FIXMEs in src';
		fi
	'''
}

void testAndroid() {
	sh '''
		# We have some tests for same day alarms that depends on this TimeZone
		export TZ=Europe/Berlin
		mkdir -p build
		mkdir -p build-calendar-app
		cd app-android
		./gradlew lint --quiet
		./gradlew test
	'''
}

void testFastlane(String task) {
	sh """
		export LC_ALL="en_US.UTF-8"
		export LANG="en_US.UTF-8"
		cd app-ios
		fastlane ${task}
	"""
}

void finalize(boolean dryRun) {
	if (dryRun) {
		catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
			sh "exit 1"
		}
		echo """everything is fine, but I'm not pushing (DRY_RUN)!
			use the following link to re-run and merge:
			https://next.tutao.de/jenkins/job/${env.JOB_NAME}/parambuild?TARGET_BRANCH=${params.TARGET_BRANCH}&SOURCE_BRANCH=${params.SOURCE_BRANCH}&CLEAN_WORKSPACE=false&DRY_RUN=false
		"""
	} else {
		sh "git push origin HEAD:${params.TARGET_BRANCH}"
	}
}