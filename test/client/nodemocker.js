// @flow
import o from "ospec/ospec.js"
import chalk from 'chalk'
import mockery from 'mockery'
import path from 'path'
import {neverNull} from "../../src/api/common/utils/Utils"

let exit = {value: undefined}

function enable() {
	exit = setProperty(process, 'exit', o.spy(code => {
		console.log(`mock ${chalk.blue.bold("process.exit()")} with code ${chalk.red.bold(code.toString())}`)
	}))
	mockery.enable({useCleanCache: true})
	mockery.registerAllowables([
		'path',
		'util'
	])
}

function disable(): void {
	mockery.disable()
	setProperty(process, 'exit', neverNull(exit).value)
}

// register and get a test subject
function subject(module: string): any {
	mockery.registerAllowable(module)
	return require(module)
}

function allow(module: string) {
	mockery.registerAllowable(module)
}

function disallow(module: string): void {
	mockery.deregisterAllowable(module)
}

function mock<T>(old: string, replacer: T): MockBuilder<T> {
	return new MockBuilder(old, replacer)
}

function spyify<T>(obj: T): T {
	switch (typeof obj) {
		case 'function':
			return o.spy(obj)
		case 'object':
			return obj == null || 'undefined' === typeof obj
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
	with<B>(obj: B): MockBuilder<T> {
		return mock(this._old, Object.assign(this._mock, obj))
	}

	/**
	 * register & get the actual mock module object
	 * @returns {T} the mock with recursively o.spy()'d functions
	 */
	get(): T {
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
	mock
}

export default n
