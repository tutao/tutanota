import type * as FsModule from "fs"
const instances: Record<string, ConfigFile> = {}

type FsExports = typeof FsModule

/**
 * get an instance of ConfigFile pointing at a certain path
 * @param p {string} path to file the configFile should write to
 * @param fs the fs object returned by "import fs from ''fs"
 */
export function getConfigFile(p: string, fs: FsExports): ConfigFile {
    if (!Object.keys(instances).includes(p)) {
        instances[p] = new ConfigFile(p, fs)
    }

    return instances[p]
}
export type ConfigFileType = ConfigFile

class ConfigFile {
    _path: string
    _accessPromise: Promise<any>
    readonly _fs: FsExports

    /**
     * @param p path to the file the json objects should be stored in
     * @param fs
     **/
    constructor(p: string, fs: FsExports) {
        this._path = p
        this._accessPromise = Promise.resolve()
        this._fs = fs
    }

    ensurePresence(defaultObj: any): Promise<void> {
        try {
            this._fs.accessSync(this._path, this._fs.constants.F_OK)
        } catch (e) {
            return this.writeJSON(defaultObj || {})
        }

        return Promise.resolve()
    }

    readJSON(): Promise<any> {
        this._accessPromise = this._accessPromise
            .then(() => this._fs.promises.readFile(this._path, "utf8"))
            .then(t => JSON.parse(t))
            .catch(e => {
                // catch needed to make future reads/writes work
                console.error("failed to read config!", e)
            })
        return this._accessPromise
    }

    /**
     * asynchronously write an object to a file.
     * multiple writes are handled in a fifo manner to prevent race conditions that could
     * cause the file to contain invalid json
     * deliberately not using async to make sure the chain of writes doesn't branch.
     *
     * @param obj the object to serialize
     * @returns {Promise<void>} resolves when the object has been written
     */
    writeJSON(obj: any): Promise<void> {
        this._accessPromise = this._accessPromise
            .then(() => JSON.stringify(obj, null, 2))
            .then(json => this._fs.promises.writeFile(this._path, json))
            .catch(e => {
                console.error("failed to write conf:", e)
            })
        return this._accessPromise
    }
}