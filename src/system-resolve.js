// mark module as esm for systemjs (detected as global module otherwise => global modules are not supported production loader)
export const a = ""

// replace getConfig for the production loader (remove with system js 0.20.11, see https://github.com/systemjs/systemjs/issues/1619#issuecomment-287123119)
if (env.dist) {
	System.__proto__.getConfig = function () {
		return System[Object.getOwnPropertySymbols(System)[1]]
	}
}


let resolve = System.__proto__.resolve

// add .js extensions where needed
System.__proto__.resolve = function (key, parent) {
	let config = System.getConfig()
	if (config.map[key] === '@empty') return Promise.resolve(config.map[key]) // see https://github.com/systemjs/systemjs/issues/1620
	if ((key.indexOf('core-js') === 0 || config.map[key] == null) && key.indexOf(".js") !== key.length - ".js".length) key += ".js"
	return resolve.apply(System, [key, parent])
}.bind(System)


