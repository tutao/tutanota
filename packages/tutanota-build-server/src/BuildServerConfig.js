export class BuildServerConfig {
	/**
	 * @param devServerPort if set, a dev server will be listening on this port
	 * @param builderPath absolute path to the builder which will be used by the server
	 * @param preserveLogs boolean, logs will not be deleted on server shutdown if set to true
	 * @param directory absolute path to directory in which the build server will create its log file and socket. This will identify a given build server
	 * @param watchFolders directories to watch for file changes that invalidate the last build
	 * @param webRoot absolute path to directory to be used as webRoot by devServer
	 * @param spaRedirect boolean, if true the devServer will redirect any requests to '/?r=<requestedURL>'
	 * @param autoRebuild boolean, if true, changes to watched folders trigger a rebuild
	 */
	constructor(builderPath, watchFolders, devServerPort, webRoot, spaRedirect, preserveLogs, directory, autoRebuild) {
		this.builderPath = builderPath
		this.watchFolders = this._cloneArray(watchFolders)
		this.devServerPort = devServerPort
		this.webRoot = webRoot
		this.spaRedirect = typeof (spaRedirect) != "undefined" ? spaRedirect : true
		this.preserveLogs = typeof (preserveLogs) != "undefined" ? preserveLogs : false
		this.directory = directory
		this.autoRebuild = typeof (autoRebuild) != "undefined" ? autoRebuild : false
		Object.freeze(this)
	}

	_cloneArray(array) {
		if (Array.isArray(array)) {
			return array.slice()
		}
		return []
	}

	equals(other) {
		return this.builderPath === other.builderPath
			&& this.devServerPort === other.devServerPort
			&& this.webRoot === other.webRoot
			&& this.spaRedirect === other.spaRedirect
			&& this.preserveLogs === other.preserveLogs
			&& this.directory === other.directory
			&& this.autoRebuild === other.autoRebuild
			&& this._equalArrays(this.watchFolders, other.watchFolders)
	}

	_equalArrays(array1, array2) {
		return Array.isArray(array1)
			&& Array.isArray(array2)
			&& array1.length === array2.length
			&& array1.every((value, index) => value === array2[index])
	}
}


