import {watch, FSWatcher} from "chokidar"
export class Watchers {
	private watcher: FSWatcher
	private fileWatcher: FSWatcher
    /**
     *
     * @param log Variadic log function that accepts any number of strings.
     * @param sourceFolders Array of strings representing paths(directories) to watch. If any file in any of the directory changes, sourceFolderHandler will be called.
     * @param sourceFolderHandler Function to be called when a file within sourceFolders changes.
     * @param builderPath Path to the builder used by the build process. A dedicated watcher will be registered for the file.
     * @param builderHandler Handler to be called when the file under builderPath changes.
     */
    start(log: (...args: Array<string>) => any, sourceFolders: Array<string>, sourceFolderHandler: () => any, builderPath: string, builderHandler) {
        if (sourceFolders && Array.isArray(sourceFolders)) {
            log("Setting up watchers for: " + sourceFolders.join(","))
            this.watcher = watch(sourceFolders, {
                    ignoreInitial: true,
                    ignored: path => path.includes("/.git/"),
                })
                .on("all", sourceFolderHandler)
        }

        log(`Setting up watcher for: "${builderPath}"`)
        this.fileWatcher = watch(builderPath, {
                ignoreInitial: true,
            })
            .on("all", builderHandler)
    }

    stop() {
        this.watcher?.close()
        this.watcher = null
        this.fileWatcher?.close()
        this.fileWatcher = null
    }
}