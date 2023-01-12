pipeline {
    environment {
        OPENSSL_VERSION="1.1.1"
        OPENSSL_BRANCH='OpenSSL_1_1_1-stable'

		// These options are all in service of reducing the total size of the binary by excluding things we don't need
		// You can check `INSTALL` in the OpenSSL repo to find information about all of these options
        CONFIGURE_PARAMS= "no-aria no-bf no-blake2 no-camellia no-cast no-chacha no-cmac \
        				   no-des no-dh no-dsa no-ecdh no-ecdsa no-idea no-md4 no-mdc2 \
        				   no-ocb no-poly1305 no-rc2 no-rc4 no-rmd160 no-scrypt no-seed \
        				   no-siphash no-sm2 no-sm3 no-sm4 no-whirlpool \
						   no-engine no-err no-sock no-hw"

    }
    agent {
        label 'master'
    }
    stages {
        stage('build') {
            parallel {
                stage('build linux') {
                    agent {
                        label 'linux'
                    }
                    steps {
                		buildOpenssl(platform: "linux")
                    }
                }
                stage('build mac') {
                    agent {
                        label 'mac'
                    }
                    steps {
						buildOpenssl(platform: "mac")
                    }
                }
            }
        }
        stage('publish to nexus') {
            steps {
				script {
					publish("linux")
					publish("mac")
				}
            }
        }
    }
}

def buildOpenssl(Map params) {
	checkout changelog: false,
			 poll: false,
			 scm: [
			 	$class: 'GitSCM', branches: [[name: '*/master']],
			 	extensions: [],
			 	userRemoteConfigs: [[url: 'git://git.openssl.org/openssl.git']]
			 ]

	script {
		sh "git checkout ${OPENSSL_BRANCH}"
		sh "./config ${CONFIGURE_PARAMS}"
		sh "make build_generated && make libcrypto.a"
		sh "mv libcrypto.a libcrypto-${params.platform}.a"
		stash includes: "libcrypto-${params.platform}.a", name: "libcrypto-${params.platform}"
	}
}

def publish(String platform) {

	unstash "libcrypto-${platform}"

	script {
		def util = load "ci/jenkins-lib/util.groovy"

		util.publishToNexus(
			groupId: "lib",
			artifactId: "libcrypto",
			version: "${OPENSSL_VERSION}-${platform}",
			assetFilePath: "${WORKSPACE}/libcrypto-${platform}.a",
			fileExtension: 'a'
		)
	}

}
