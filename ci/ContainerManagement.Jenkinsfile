pipeline {
    environment {
    	// on m1 macs, this is a symlink that must be updated. see wiki.
        VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
        TMPDIR='/tmp'
    }

    agent {
    	label 'linux'
    }

    stages {
    	stage('env') {
    		steps {
    			sh 'docker ps --all'
    			sh 'docker image prune -f'
				sh 'docker image list'
				sh 'docker system df'
    		}
    	}
    }
}