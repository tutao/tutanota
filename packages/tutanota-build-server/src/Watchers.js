import chokidar from "chokidar"

export class Watchers {
	/**
	 *
	 * @param log Variadic log function that accepts any number of strings.
	 * @param sourceFolders Array of strings representing paths(directories) to watch. If any file in any of the directory changes, sourceFolderHandler will be called.
	 * @param sourceFolderHandler Function to be called when a file within sourceFolders changes.
	 * @param builderPath Path to the builder used by the build process. A dedicated watcher will be registered for the file.
	 * @param builderHandler Handler to be called when the file under builderPath changes.
	 */
	start(log, sourceFolders, sourceFolderHandler, builderPath, builderHandler) {

		if (sourceFolders && Array.isArray(sourceFolders)) {
			log("Setting up watchers for: " + sourceFolders.join(","))
			this.watcher = chokidar.watch(sourceFolders, {
				ignoreInitial: true,
				ignored: path => path.includes('/node_modules/') || path.includes('/.git/'),
			}).on("all", sourceFolderHandler)
		}
		log(`Setting up watcher for: "${builderPath}"`)
		this.fileWatcher = chokidar.watch(builderPath, {ignoreInitial: true})
		                           .on("all", builderHandler)
	}

	stop() {
		this.watcher?.close()
		this.watcher = null

		this.fileWatcher?.close()
		this.fileWatcher = null
	}
}
