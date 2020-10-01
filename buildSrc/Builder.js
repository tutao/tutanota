const Promise = require('bluebird')

const BuildCache = require('./BuildCache.js')

const path = require("path")
const fs = Promise.Promise.promisifyAll(require("fs-extra"))
const babel = Promise.promisifyAll(require("babel-core"))

const srcDir = "src"

let flow
try {
	flow = require('flow-bin')
} catch (e) {
	// we don't have flow on F-Droid
	console.log("flow-bin not found, stubbing it")
	flow = 'true'
}
const spawn = require('child_process').spawn

class Builder {
	constructor(baseDir, destDir) {
		this.baseDir = baseDir
		this.destDir = destDir
		this._buildCache = new BuildCache(this.destDir)
		this._ready = false
	}

	clean() {
		return fs.emptyDirAsync(this.destDir + "/").then(() => this._buildCache = new BuildCache(this.destDir))
	}

	/**
	 * Builds all files from srcDir to build/
	 * @param srcDirs An array of source directories
	 * @param watch Watch for changes of the src files, if a function is provided. The function will be invoked, after
	 *   the src files were build to the destionation dir
	 */
	build(srcDirs, watch) {
		return new Promise((resolve, reject) => {
			const chokidar = require('chokidar')
			let watcher = chokidar.watch(srcDirs, {ignoreInitial: true, followSymlinks: true, cwd: this.baseDir})
			                      .on('change', (file) => this._translateIfChanged(file).then(() => watch()))
			                      .on('add', (file) => this._translateIfChanged(file).then(() => watch()))
			                      .on('unlink', file => this._deleteFile(file).then(() => watch()))
			                      .on('ready', () => {
				                      let watched = watcher.getWatched()
				                      let dirs = Object.keys(watched)
				                      let currentFiles = []
				                      for (let dir of dirs) {
					                      for (let filename of watched[dir]) {
						                      var file = path.join(this.baseDir, dir + "/" + filename)
						                      if (fs.statSync(file).isFile()) {
							                      currentFiles.push(file)
						                      }
					                      }
				                      }

				                      let cachedFiles = this._buildCache.getCachedFiles()

				                      let promises = currentFiles.map(file => this._translateIfChanged(file))
				                      let deletedFiles = cachedFiles.filter(file => currentFiles.indexOf(file) === -1)
				                      Promise.all(promises.concat(deletedFiles.map(file => this._deleteFile(file))))
				                             .then(() => {
					                             this._ready = true
					                             this._runFlow()
				                             })
				                             .then(resolve)

				                      if (!watch) {
					                      watcher.close()
				                      }
			                      })
		})

	}

	_translateIfChanged(srcFile) {
		if (path.resolve(srcFile) !== srcFile) {
			srcFile = path.join(this.baseDir, srcFile) // convert to absolute path, if it is relative
		}
		if (!this._buildCache.hasChanged(srcFile)) {
			return Promise.resolve()
		}
		let targetFile = path.join(this.destDir, path.relative(this.baseDir, srcFile))

		let start = process.hrtime()
		return this._translate(srcFile, targetFile).then(() => {
			this._buildCache.update(srcFile)
			let end = process.hrtime(start);
			console.log(` > ${path.relative(this.baseDir, targetFile)} ${end[0] * 1000 + (end[1] / 1000000)}ms`)
		}).then(() => this._runFlow())
	}

	_translate(srcFile, targetFile) {
		// only js files that are no libs are compiled. All other files are just copied as resources.
		if (path.extname(srcFile) === '.js' && srcFile.indexOf(this.baseDir + "/lib/") === -1) {
			return fs.readFileAsync(srcFile, 'utf-8').then(src => {
				if (src.trim().length === 0) {
					console.log(`Source file ${srcFile} is currently empty, re-scheduling transform!`)
					// the changed event is issued too early sometimes (when the file is empty)
					return Promise.fromCallback(cb => {
						setTimeout(() => this._translateIfChanged(srcFile), 100)
					})
				}
				let result = babelCompile(src, srcFile)
				return this._writeFile(targetFile, result.code)
			})
		} else {
			return fs.ensureDirAsync(path.dirname(targetFile)).then(() => fs.copyAsync(srcFile, targetFile, {replace: true}))
		}
	}

	_writeFile(targetFile, content) {
		return fs.ensureDirAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
	}

	_deleteFile(srcFile) {
		let targetFile = path.join(this.destDir, srcFile)
		console.log(` - ${srcFile}`)
		this._buildCache.remove(srcFile)
		return fs.removeAsync(targetFile)
	}

	_runFlow() {
		if (this._ready) {
			// This prevents multiple Flow clients from printing at the same one. It doesn't actually stop the previoous check (flow does
			// it by itself).
			this._runningFlow && this._runningFlow.kill()
			this._runningFlow = spawn(flow, [], {stdio: [process.stdin, process.stdout, process.stderr]})
		}
	}
}

function babelCompile(src, srcFile) {
	return babel.transform(src, {
		"plugins": [
			"transform-flow-strip-types",
			"transform-class-properties",
			"transform-object-rest-spread"
		],
		"presets": ["es2015"],
		comments: false,
		babelrc: false,
		retainLines: true,
		sourceMaps: srcFile != null ? "inline" : false,
		filename: srcFile,
	})
}

module.exports = {
	Builder,
	babelCompile
}