// @flow
import o from "ospec/ospec.js"
import chalk from 'chalk'
import mockery from 'mockery'
import path from 'path'
import {downcast, neverNull} from "../../src/api/common/utils/Utils"

let exit = {value: undefined}
let random = {value: undefined}
const platform = process.platform
let spyCache = []
let classCache = []
let testcount = 0


function startGroup(opts: {
	group: string,
	allowables?: Array<string>,
	cleanupFunctions?: Array<()=>void>, timeout?: number,
	beforeEach?: () => void
}) {
	const {group, allowables, cleanupFunctions, timeout, beforeEach} = Object.assign({}, {cleanupFunctions: [], allowables: []}, opts)
	o.before(() => announce(group))
	o.beforeEach(() => {
		enable(allowables)
		beforeEach && beforeEach()
	})
	o.afterEach(() => disable(cleanupFunctions))
	if (typeof timeout == 'number') o.specTimeout(timeout)
}

function enable(allowables: Array<string>) {
	console.log(chalk.green(`--- NODE TEST ${testcount} ---`))
	testcount = testcount + 1
	exit = setProperty(process, 'exit', o.spy(code => {
		console.log(`mock ${chalk.blue.bold("process.exit()")} with code ${chalk.red.bold(code.toString())}`)
	}))
	random = setProperty(Math, 'random', () => 0)
	setProperty(process, 'resourcesPath', 'app/path/resources')
	mockery.enable({useCleanCache: true, warnOnUnregistered: false})
	mockery.registerAllowables(allowedNodeModules)
	mockery.registerAllowables(allowables)
	mockery.registerAllowables(['bluebird'])
}

function disable(cleanups: Array<()=>void>): void {
	cleanups.forEach(f => f())
	mockery.deregisterAll()
	mockery.disable()
	setProperty(process, 'exit', neverNull(exit).value)
	setProperty(Math, 'random', neverNull(random).value)
	setPlatform(platform)
	spyCache.forEach(obj => delete obj.spy)
	spyCache = []
	classCache.forEach(c => c.mockedInstances = [])
}

// register and get a test subject
function subject(module: string): any {
	mockery.registerAllowable(module)
	return require(module)
}

/**
 * you need to call .get() on the return value to actually register the replacer with mockery and to spyify its functions.
 * placer object that replaces the module and gets returned when require(old) is called. Its functions are spyified when .get() is called.
 * warning: contents of array properties will not be spyified
 * @param old name of the module to replace
 * @returns {MockBuilder}
 */
function mock<T>(old: string, replacer: T): MockBuilder<T> {
	return new MockBuilder(old, replacer)
}

function spyify<T>(obj: T): T {
	switch (typeof obj) {
		case 'function':
			if (typeof obj.spy !== 'function') {
				obj.spy = o.spy(obj)
				spyCache.push(obj)
			}

			Object.keys(obj) // classes are functions
			      .filter(k => !['args', 'callCount', 'spy'].includes(k))
			      .forEach(k => (obj: any).spy[k] = spyify((obj: any)[k]))

			return obj.spy
		case 'object':
			if (Array.isArray(obj)) {
				// TODO: use proxy to sync spyified array?
				return obj
			} else {
				return obj == null
					? obj
					: (Object.keys(obj).reduce((newObj, key) => {
						(newObj: any)[key] = spyify((obj: any)[key])
						return newObj
					}, ({}: any)): T)
			}
		default:
			return obj
	}
}

/**
 * create a class-like structure from an object to be able to o.spy on method and constructor calls
 * @param template
 * @returns {cls}
 */
function classify(template: {prototype: {}, statics: {}}): (?*, ?*)=>void {

	const cls = function () {
		cls.mockedInstances.push(this)
		Object.keys(template.prototype).forEach(p => {
			if ('function' === typeof template.prototype[p]) {
				this[p] = o.spy(template.prototype[p]) // don't use spyify, we don't want these to be spyCached
			} else if ('object' === typeof template.prototype[p]) {
				// duplicate properties
				const obj = template.prototype[p]
				this[p] = obj == null
					? obj
					: (Object.keys(obj).reduce((newObj, key) => {
						(newObj: any)[key] = ((obj: any)[key])
						return newObj
					}, ({}: any)))
			} else {
				this[p] = template.prototype[p]
			}
		})

		if (typeof template.prototype["constructor"] === 'function') {
			template.prototype["constructor"].apply(this, arguments)
		}
	}

	if (template.statics) {
		Object.keys(template.statics).forEach(s => cls[s] = template.statics[s])
	}

	classCache.push(cls)
	cls.mockedInstances = []
	return cls
}

function announce(file: string) {
	console.log(chalk.bold.blue(`--- ${path.basename(file)} ---`))
}

function setPlatform(newPlatform: string) {
	setProperty(process, 'platform', newPlatform)
}

function setProperty(object, property, value) {
	const originalProperty = Object.getOwnPropertyDescriptor(object, property)
	Object.defineProperty(object, property, {value})
	return originalProperty
}

/**
 * recursively merge two objects
 * @param obj the base object
 * @param adder properties in this object will replace properties of the same name in the base object or,
 * in case of object type properties, be deep assigned to them.
 * @returns {B}
 */
function deepAssign<T, B>(obj: T, adder: B): T & B {
	let ret
	if (typeof adder !== 'object' || typeof obj !== 'object' || adder == null || obj == null) {
		ret = adder
	} else {
		ret = Object.keys(adder).reduce((newObj, key) => {
			(newObj: any)[key] = deepAssign((newObj: any)[key], (adder: any)[key])
			return newObj
		}, Object.assign({}, obj))
	}
	return downcast(ret)
}

class MockBuilder<T> {
	_mock: T
	_old: string

	constructor(old: string, obj: T) {
		this._mock = obj
		this._old = old
	}

	/**
	 *
	 * @param obj the object whose properties will replace properties on this mockbuilders output
	 * @returns {MockBuilder<*>} a new mockbuilder with the combined output
	 */
	with<B>(obj: B): MockBuilder<T & B> {
		return mock(this._old, deepAssign(this._mock, obj))
	}

	/**
	 * register & get the actual mock module object
	 * @returns {T} the mock with recursively o.spy()'d functions
	 */
	set(): T {
		const copy = spyify(this._mock)
		mockery.deregisterMock(this._old)
		mockery.registerMock(this._old, copy)
		return copy
	}
}

const n = {
	subject,
	classify,
	mock,
	spyify,
	setPlatform,
	startGroup
}

const allowedNodeModules = [
	'promise', './promise',
	'path', './path',
	'util', './util',
	'url',
	'./es5',
	'./async',
	'./schedule',
	'./errors',
	'./finally',
	'./context',
	'./queue',
	'./thenables',
	'./promise_array',
	'./debuggability',
	'./catch_filter',
	'./nodeback',
	'./method',
	'./bind',
	'./cancel',
	'./direct_resolve',
	'./synchronous_inspection',
	'./join',
	'./map.js',
	'./call_get.js',
	'./using.js',
	'./timers.js',
	'./generators.js',
	'./nodeify.js',
	'./promisify.js',
	'./props.js',
	'./race.js',
	'./reduce.js',
	'./settle.js',
	'./some.js',
	'./filter.js',
	'./each.js',
	'./any.js'
]

export default n
