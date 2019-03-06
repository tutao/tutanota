const Promise = require('bluebird')
const fs = Promise.Promise.promisifyAll(require("fs-extra"))
const path = require("path")

// These are the dependencies that must be provided for the module loader systemjs
const baseDependencies = [
	"libs/polyfill.js",
	"libs/bluebird.js",
]

const baseDevDependencies = baseDependencies
	.concat(["libs/system.src.js"])
const baseProdDependencies = baseDependencies
	.concat(["libs/system-production.src.js"])
	.map(relative => path.join(__dirname, '/..', relative).replace("/libs/", "/libs/minified/"))

const dependencyMap = {
	"mithril": "./libs/mithril.js",
	"mithril/stream/stream.js": "./libs/stream.js",
	"squire-rte": "./libs/squire-raw.js",
	"bluebird": "./libs/bluebird.js",
	"dompurify": "./libs/purify.js",
	"autolinker": "./libs/Autolinker.js",
	"qrcode": "./libs/qrcode.js",
	"@hot": "@empty", // see https://github.com/alexisvincent/systemjs-hot-reloader#usage
	"util": "@empty" // used by ospec to provide debug output in node
}

const systemConfigTemplate = {
	map: dependencyMap,
}

const hotReloaderMap = {
	"systemjs-hot-reloader": "./libs/systemjs-hot-reload.js",
	"systemjs-hmr": "./libs/systemjs-hmr.js"
}

const hotReloaderDisabledMap = {
	"systemjs-hot-reloader": "@empty"
}

function devConfig(enableHotReload) {
	return Object.assign({}, systemConfigTemplate, {
		map: Object.assign({}, systemConfigTemplate.map, enableHotReload ? hotReloaderMap : hotReloaderDisabledMap),
	})
}

function distRuntimeConfig(bundles) {
	return {
		map: Object.assign(hotReloaderDisabledMap, replaceLibsPath(dependencyMap)),
		bundles
	}
}

function devPlaygroundConfig(bundles) {
	let playgroundConfig = {
		map: dependencyMap,
	}
	return Object.assign({}, playgroundConfig, {
		map: Object.assign({}, systemConfigTemplate.map, hotReloaderMap, {
			"marked": "../node_modules/marked/lib/marked.js",
			"velocity-animate": "../node_modules/velocity-animate/velocity.js",
			"prismjs": "../node_modules/prismjs",
			"faker": "../node_modules/faker/build/build/faker.min.js",
			"quill": "../node_modules/quill/dist/quill.js"
		}),
		bundles
	})
}

function devTestConfig() {
	return Object.assign({}, systemConfigTemplate, {
		map: Object.assign({}, systemConfigTemplate.map, hotReloaderMap, {
			"ospec/ospec.js": "../node_modules/ospec/ospec.js",
			"velocity-animate": "../node_modules/velocity-animate/velocity.js",
			"prismjs": "../node_modules/prismjs",
			"faker": "../node_modules/faker/build/build/faker.min.js",
		})
	})
}

function distBuildConfig() {
	return Object.assign({}, systemConfigTemplate, {
		transpiler: "plugin-babel",
		babelOptions: {
			es2015: true,
			"plugins": ["transform-flow-strip-types"],
			stage1: true
		},
		packages: {
			'./src': {defaultExtension: 'js'}
		},
		meta: {
			'./src/gui/base/icons/*.js': {
				format: 'esm'
			}
		},
		map: Object.assign({}, replaceLibsPath(systemConfigTemplate.map), {
			"plugin-babel": "node_modules/systemjs-plugin-babel/plugin-babel.js",
			"systemjs-babel-build": "node_modules/systemjs-plugin-babel/systemjs-babel-node.js",
			"transform-flow-strip-types": "@node/babel-plugin-transform-flow-strip-types/lib/index.js",
		})
	})
}

function replaceLibsPath(object) {
	let updated = {}
	Object.keys(object).forEach(k => updated[k] = object[k].replace("./libs/", "libs/"))
	return updated
}

module.exports = {
	baseDevDependencies,
	baseProdDependencies,
	hotReloaderMap,
	dependencyMap,
	devConfig,
	distRuntimeConfig,
	devPlaygroundConfig,
	devTestConfig,
	distBuildConfig
}