// @flow
import o from "ospec/ospec.js"
import chalk from 'chalk'
import mockery from 'mockery'
import path from 'path'
import {downcast, neverNull} from "../../src/api/common/utils/Utils"

let exit = {value: undefined}
let spyCache = []
let testcount = 0

function enable() {
	console.log(chalk.green(`--- NODE TEST ${testcount} ---`))
	testcount = testcount + 1
	exit = setProperty(process, 'exit', o.spy(code => {
		console.log(`mock ${chalk.blue.bold("process.exit()")} with code ${chalk.red.bold(code.toString())}`)
	}))
	mockery.enable({useCleanCache: true})
	mockery.registerAllowables(allowedNodeModules)
	mockery.registerAllowables([
		'bluebird'
	])
}

function disable(): void {
	mockery.disable()
	setProperty(process, 'exit', neverNull(exit).value)
	spyCache.forEach(obj => delete obj.spy)
	spyCache = []
}

// register and get a test subject
function subject(module: string): any {
	mockery.registerAllowable(module)
	return require(module)
}

function allow(module: string | Array<string>) {
	[...module].forEach(m => mockery.registerAllowable(m))
}

function disallow(module: string | Array<string>): void {
	[...module].forEach(m => mockery.deregisterAllowable(m))
}

/**
 * you need to call .get() on the return value to actually register the replacer with mockery and to spyify its functions.
 * @param old name of the module to replace
 * @param replacer object that replaces the module and gets returned when require(old) is called. Its functions are spyified when .get() is called.
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
			return obj.spy
		case 'object':
			return obj == null
				? obj
				: (Object.keys(obj).reduce((newObj, key) => {
					(newObj: any)[key] = spyify((obj: any)[key])
					return newObj
				}, ({}: any)): T)
		default:
			return obj
	}
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
	enable,
	disable,
	subject,
	allow,
	disallow,
	mock,
	spyify
}

const allowedNodeModules = [
	'promise', './promise',
	'path', './path',
	'util', './util',
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
