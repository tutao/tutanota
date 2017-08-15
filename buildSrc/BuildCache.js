const Promise = require('bluebird')

const fs = Promise.Promise.promisifyAll(require("fs-extra"))
const sha = require('sha')
const path = require("path")

/**
 * The build cache contains a mapping from all source paths to hashsums.
 * @type {BuildCache}
 */
module.exports = class BuildCache {
	constructor(destDir) {
		this.destDir = destDir
		try {
			this.sourceToHash = JSON.parse(fs.readFileSync(path.join(this.destDir, "cache.json"), 'utf-8'))
		} catch (e) {
			console.log("re-initializing build cache")
			this.sourceToHash = {}
		}
	}

	contains(srcFile) {
		return this.sourceToHash[srcFile] !== undefined
	}

	hasChanged(srcFile) {
		if (this.contains(srcFile) && this.sourceToHash[srcFile] == sha.getSync(srcFile)) {
			return false
		} else {
			return true
		}
	}

	update(file) {
		let hash = sha.getSync(file)
		this.sourceToHash[file] = hash
		this._saveBuildCache()
	}

	remove(file) {
		if (this.contains(file)) {
			this.sourceToHash[file] = undefined
		}
		this._saveBuildCache()
	}

	getCachedFiles() {
		return Object.keys(this.sourceToHash)
	}

	_saveBuildCache() {
		fs.ensureDirSync(this.destDir)
		fs.writeFileSync(path.join(this.destDir, "cache.json"), JSON.stringify(this.sourceToHash), 'utf-8')
	}
}