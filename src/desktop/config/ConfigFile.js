// @flow
import fs from "fs"

let accessPromise: Promise<any> = Promise.resolve()

export function readJSON(path: string): Promise<any> {
	accessPromise = accessPromise
		.then(() => fs.promises.readFile(path, "utf8"))
		.then(t => JSON.parse(t))
		.catch(e => {
			// catch needed to make future reads/writes work
			console.error("failed to read config!", e)
		})
	return accessPromise
}

/**
 * asynchronously write an object to a file.
 * multiple writes are handled in a fifo manner to prevent race conditions that could
 * cause the file to contain invalid json
 * deliberately not using async to make sure the chain of writes doesn't branch.
 *
 * @param path path to the file the json object should be stored in
 * @param obj the object to serialize
 * @returns {Promise<void>} resolves when the object has been written
 */
export function writeJSON(path: string, obj: any): Promise<void> {
	accessPromise = accessPromise
		.then(() => JSON.stringify(obj, null, 2))
		.then(json => fs.promises.writeFile(path, json))
		.catch(e => {
			console.error("failed to write conf:", e)
		})
	return accessPromise
}


