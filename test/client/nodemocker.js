// @flow
import o from "ospec"
import {downcast} from "@tutao/tutanota-utils"

/**
 * you need to call .get() on the return value to actually register the replacer to spyify its functions.
 * placer object that replaces the module and gets returned when require(old) is called. Its functions are spyified when .get() is called.
 * warning: contents of array properties will not be spyified
 * @param old name of the module to replace
 * @returns {MockBuilder}
 */
function mock<T>(old: string, replacer: any): MockBuilder<T> {
	return new MockBuilder(old, replacer)
}

function getAllPropertyNames(obj) {
	const props = [];

	do {
		for (const prop of Object.getOwnPropertyNames(obj)) {
			if (props.indexOf(prop) === -1) {
				props.push(prop);
			}
		}
	} while (obj = Object.getPrototypeOf(obj));

	return props;
}

export function spyify<T>(obj: T): T {
	const anyObj: any = obj
	switch (typeof obj) {
		case 'function':
			const spy = o.spy(obj)

			Object.keys(anyObj) // classes are functions
			      .filter(k => !['args', 'callCount', 'spy'].includes(k))
			      .forEach(k => spy[k] = spyify(anyObj[k]))

			return spy
		case 'object':
			if (anyObj instanceof Promise) {
				return anyObj
			}
			if (Array.isArray(anyObj)) {
				// TODO: use proxy to sync spyified array?
				return anyObj
			} else if (anyObj instanceof Map) {
				const entries = Array.from(anyObj.entries()).map(([k, v]) => [k, spyify(v)])
				return downcast(new Map(entries))
			} else {
				if (anyObj == null) {
					return anyObj
				} else {
					const newObj = {}
					// iterate over everything, not only own props
					for (let key of getAllPropertyNames(anyObj)) {
						// if it's a proto, don't deeply copy it, just assign a new one
						if (key === "__proto__") {
							(newObj: any)[key] = (obj: any)[key]
						} else {
							(newObj: any)[key] = spyify((obj: any)[key])
						}
					}
					return downcast<T>(newObj)
				}
			}
		default:
			return obj
	}
}

type Mocked<T> = Class<T> & {
	mockedInstances: Array<any>;
}

/**
 * create a class-like structure from an object to be able to o.spy on method and constructor calls
 * @param template
 * @returns {cls}
 */
function classify(template: {prototype: {}, statics: {}}): Mocked<any> {
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

	cls.mockedInstances = []
	return downcast(cls)
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

export class MockBuilder<T> {
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
	 * warning! This effectively returns any.
	 * @returns {T} the mock with recursively o.spy()'d functions
	 */
	set<R>(): R {
		const copy = spyify(this._mock)
		return downcast(copy)
	}
}

const n = {
	classify,
	mock,
	spyify,
	setPlatform,
}

export default n
