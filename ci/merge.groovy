import groovy.json.JsonSlurper

HashSet<String> changeset = new HashSet<String>()
String linuxWorkspace = '/opt/jenkins/jobs/bootleg-ci-merge/workspace-0'
ArrayList<String> linuxWorkspaceClones = [
		'/opt/jenkins/jobs/bootleg-ci-merge/workspace-1',
		'/opt/jenkins/jobs/bootleg-ci-merge/workspace-2',
		'/opt/jenkins/jobs/bootleg-ci-merge/workspace-3',
		'/opt/jenkins/jobs/bootleg-ci-merge/workspace-4',
		'/opt/jenkins/jobs/bootleg-ci-merge/workspace-5',
		'/opt/jenkins/jobs/bootleg-ci-merge/workspace-6',
		'/opt/jenkins/jobs/bootleg-ci-merge/workspace-7'
]
String macWorkspace = '/Users/jenkins/jenkins/workspace/bootleg-ci-merge/'

pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten:/usr/lib/bin:/opt/homebrew/bin"
		ANDROID_SDK_ROOT = "/opt/android-sdk"
		ANDROID_HOME = "/opt/android-sdk"
		DBUS_SESSION_BUS_ADDRESS = "/run/user/${env.UID}/bus"
	}

	agent {
		label 'linux'
	}

	options {
		// as long as tests like node/browser/android are run sequentially the timeout needs to be higher than 10 minutes
		timeout(time: 15, unit: 'MINUTES')
		// this prevents jenkins from running the "Check out from version control" step in every stage.
		// we're running several stages in parallel on the same folder, which means git will run in parallel, which
		// it can't because it places a lock file in .git
		skipDefaultCheckout true
	}

	tools {
		jdk 'jdk-21.0.2'
	}

	parameters {
		validatingString(
				// this branch will be the initial branch checked out on the job.
				// this is important because if we update the jenkinsfile in a commit
				// we need to run the new version, not the one from master.
				name: 'SOURCE_BRANCH',
				defaultValue: 'dummy-do-not-use',
				description: "Branch name (no 'origin' or similar) that gets merged into TARGET_BRANCH",
				regex: /^(?!dummy-do-not-use$).*$/,
				failedValidationMessage: "please provide one source branch name!",
		)
		validatingString(
				name: 'TARGET_BRANCH',
				defaultValue: 'dummy-do-not-use',
				description: "Branch name (no 'origin' or similar) that gets updated",
				regex: /^(?!dummy-do-not-use$).*$/,
				failedValidationMessage: "please provide one target branch name!",
		)
		booleanParam(
				name: 'CLEAN_WORKSPACE',
				defaultValue: false,
				description: "run 'git clean -dfx' as the first step of the pipeline"
		)
		booleanParam(
				name: 'DRY_RUN',
				defaultValue: false,
				description: "run the tests, but don't push to TARGET_BRANCH"
		)
		booleanParam(
				name: 'FORCE_RUN_ALL',
				defaultValue: false,
				description: "run ALL the tests, even if they would normally be pruned because there are no relevant changes."
		)
	}

	stages {
		stage("repo prep") {
			/**
			 * each physical node / container has to have a workspace prepared to do any of the checks we want to run.
			 *
			 * Most checks could run in parallel because they're read-only workloads, but jenkins really likes allocating
			 * new workspaces when it detects two stages running in parallel on the same workspace, even when explicitly
			 * told where to run the stages.
			 *
			 * we get around this by first preparing the workspace and then making symlinks for jenkins to use as
			 * "separate" workspaces that are already initialized.
			 */
			parallel {
				stage("checkout linux") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspace
						}
					}
					steps {
						assertBranchWasSet("TARGET_BRANCH", params.TARGET_BRANCH)
						assertBranchWasSet("SOURCE_BRANCH", params.SOURCE_BRANCH)
						script {
							currentBuild.displayName = "${params.DRY_RUN ? "DRY_RUN " : ""}${params.SOURCE_BRANCH} -> ${params.TARGET_BRANCH}"
						}
						initWorkspace(changeset, params.SOURCE_BRANCH, params.TARGET_BRANCH, params.CLEAN_WORKSPACE)

						// building sqlcipher is not parallelizable on the same directory and doesn't lock; so we
						// pre-build it while we're not parallel yet. the browser and node tests will pick up the binary
						// instead of each building it. we can parallelize it with build-packages though.
						sh '''
							node buildSrc/getNodeGypLibrary.js @signalapp/sqlcipher --copy-target node_sqlcipher --environment node --root-dir . &
							PID1=$!
							npm run build-packages &
							PID2=$!
							wait $PID1
							EXIT_CODE1=$?
							wait $PID2
							EXIT_CODE2=$?
							exit $(node -p "$EXIT_CODE1 + $EXIT_CODE2")
						'''
						duplicateWorkspace(linuxWorkspace, linuxWorkspaceClones)
					}
				}
				stage("checkout mac m1") {
					agent {
						node {
							label "mac-m1"
							customWorkspace macWorkspace
						}
					}
					steps {
						initWorkspace(changeset, params.SOURCE_BRANCH, params.TARGET_BRANCH, params.CLEAN_WORKSPACE)
						prepareSwift()
					}
				}

			}
		}
		stage("Lint and Style") {
			parallel {
				stage("find FIXMEs") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[0]
						}
					}
					steps {
						findFixmes()
					}
				}
				stage("lint:check") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[1]
						}
					}
					steps {
						sh 'npm run lint:check'
					}
				}
				stage("style:check") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[2]
						}
					}
					steps {
						sh 'npm run style:check'
					}
				}
				stage("check rust formatting") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[3]
						}
					}
					// this is so quick, we can run it every time.
					steps {
						sh "cargo fmt --check"
					}
				}
				stage("lint swift") {
					agent {
						node {
							label "mac-m1"
							customWorkspace macWorkspace
						}
					}
					when {
						expression { extensionChanged(changeset, ".swift") }
					}
					steps {
						lock("ios-build-m1") {
							lintSwift()
						}
					}
				}
			}
		}
		stage("Testing and Building") {
			parallel {
				stage("tests") {
					// the test cases write to the same files in the common workspace which produces race conditions like wasm/malloc function not available. as a workaround we run the critical tests sequentially. ideally we should never write to a re-used workspace.
					stages {
						stage("node tests") {
							agent {
								node {
									label 'linux'
									customWorkspace linuxWorkspaceClones[1]
								}
							}
							steps {
								sh 'cd test && node test'
							}
						}
						stage("browser tests") {
							agent {
								node {
									label 'linux'
									customWorkspace linuxWorkspaceClones[2]
								}
							}
							steps {
								sh 'npm run test:app -- --no-run --browser --browser-cmd \'$(which chromium) --no-sandbox --enable-logging=stderr --headless=new --disable-gpu\''
							}
						}
						stage("android tests") {
							agent {
								node {
									label 'linux'
									customWorkspace linuxWorkspace
								}
							}
							when {
								expression { hasRelevantChangesIn(changeset, "app-android") }
							}
							steps {
								testAndroid()
							}
						}
					}
				}
				stage("packages test") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[0]
						}
					}
					when {
						expression { hasRelevantChangesIn(changeset, "packages") }
					}
					steps {
						sh 'npm run --if-present test -ws'
					}
				}
				stage("build web app") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[3]
						}
					}
					steps {
						sh 'node webapp --disable-minify'
					}
				}
				stage("build web app calendar") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[4]
						}
					}
					steps {
						sh 'node webapp --disable-minify --app calendar'
					}
				}
				stage("sdk tests") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[5]
						}
					}
					when {
						expression { hasRelevantChangesIn(changeset, "tuta-sdk") }
					}
					steps {
						// once we spin local http server, we should also include more test by:
						// --features test-with-local-http-server
						sh "cargo test --package tuta-sdk"
					}
				}

				stage("clippy lints") {
					agent {
						node {
							label 'linux'
							customWorkspace linuxWorkspaceClones[6]
						}
					}
					when {
						expression { extensionChanged(changeset, ".rs", ".toml") }
					}
					steps {
						// -Dwarnings changes warnings to errors so that the check fails
						sh "cargo clippy --all --no-deps -- -Dwarnings"
					}
				}
				stage("ios tests") {
					// iOS tests write to the same temp folder which can cause both tests to fail, so they must run sequentially
					stages {
						stage("ios app") {
							agent {
								node {
									label "mac-m1"
									customWorkspace macWorkspace
								}
							}
							when {
								expression { hasRelevantChangesIn(changeset, "app-ios") }
							}
							steps {
								lock("ios-build-m1") {
									testFastlane("test_tuta_app")
								}
							}
						}
						stage("ios framework") {
							agent {
								node {
									label "mac-m1"
									customWorkspace macWorkspace
								}
							}
							when {
								expression { hasRelevantChangesIn(changeset, "app-ios") }
							}
							steps {
								lock("ios-build-m1") {
									testFastlane("test_tuta_shared_framework")
								}
							}
						}
					}
				}
			}
		}
		stage("finalize") {
			agent {
				node {
					label 'linux'
					customWorkspace linuxWorkspace
				}
			}
			steps {
				finalize(params.DRY_RUN)
			}
		}
	}
}

void assertBranchWasSet(String name, String param) {
	if (param.contains("dummy-do-not-use")) {
		error("Parameter ${name} must be set to a valid branch name, not '${param}'.")
	}
}

void initWorkspace(HashSet<String> changeset, String srcBranch, String targetBranch, boolean shouldClean) {
	if (shouldClean) {
		sh """
		    git submodule deinit --all --force
			git clean -dfx
			git fetch
			git reset --hard origin/${srcBranch}
			cargo clean
		"""
	}
	sh "git status && git remote -v"
	fetch(srcBranch, targetBranch)
	merge(srcBranch, targetBranch)
	submodules()
	sh "pwd && git status && git remote -v && git submodule status"
	getChangeset(changeset, targetBranch)
	if (shouldRunNpmCi()) {
		sh "npm ci"
	}
}

void duplicateWorkspace(String source, ArrayList<String> targets) {
	// don't trust the jenkins primitives to do this correctly...
	sh """
			pwd
			cd ${source}/..
			TARGETS="${targets.join(" ")}"
			ls -halt
			rm -f \$TARGETS
			ls -halt
			for target in \${TARGETS}; do
				ln -s ${source} \$target
			done
			ls -halt
	"""
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

void prepareSwift() {
	sh '''
		mkdir -p ./build-calendar-app
		mkdir -p ./build

		cd app-ios
		xcodegen --spec calendar-project.yml
		xcodegen --spec mail-project.yml

		cd ../tuta-sdk/ios
		xcodegen
	'''
}

void lintSwift() {
	sh '''
		cd app-ios
		./lint.sh lint:check
		./lint.sh style:check
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
	def out = sh(returnStdout: true, script: "git diff --name-only ${targetBranch} origin/${targetBranch} --")
	def lines = out.split('\n')
	for (String line in lines) {
		changeset.add(line.trim())
	}
	println "changeset:\n\n${changeset.join("\n")}"
}

// return whether any file in the given paths changed (recursively)
boolean hasRelevantChangesIn(HashSet<String> changeset, String... paths) {
	boolean relevant = false
	for (String path in paths) {
		relevant = relevant || changeset.any { f -> f.startsWith(path) }
	}

	return relevant || extensionChanged(changeset, "groovy") || params.FORCE_RUN_ALL
}

// return whether any file with the given extensions changed
boolean extensionChanged(HashSet<String> changeset, String... exts) {
	boolean changed = false
	for (String ext in exts) {
		changed = changed || changeset.any { f -> f.endsWith(ext) }
	}
	return changed || params.FORCE_RUN_ALL
}

boolean shouldRunNpmCi() {
	def current = readFile(file: 'package.json')
	def old
	try {
		old = readFile(file: 'cache/package.json')
	} catch (e) {
		print "package.json not found in cache, re-caching."
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
		if grep "FIXME\\|[fF]ixme" -r src buildSrc test/tests packages/*/lib app-android/app/src app-ios/tutanota/Sources tuta-sdk; then
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
		./gradlew lint -PtargetABI=x86_64 --quiet
		./gradlew test -PtargetABI=x86_64
		./gradlew itest -PtargetABI=x86_64
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

/**
 * push the resulting repo state to origin if it's not a dry run
 */
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
