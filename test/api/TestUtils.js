// @flow
import o from "ospec/ospec.js"

/**
 * Mocks an attribute (function or object) on an object and makes sure that it can be restored to the original attribute by calling unmockAttribute() later.
 * Additionally creates a spy for the attribute if the attribute is a function.
 * @param object The object on which the attribute exists.
 * @param attributeOnObject The attribute to mock.
 * @param attributeMock The attribute mock.
 * @returns An object to be passed to unmockAttribute() in order to restore the original attribute.
 */
export function mockAttribute(object: Object, attributeOnObject: Function | Object, attributeMock: Function | Object): Object {
	if (attributeOnObject == null) throw new Error("attributeOnObject is undefined")
	let attributeName = Object.getOwnPropertyNames(object).find(key => object[key] === attributeOnObject)
	if (!attributeName) {
		attributeName = Object.getOwnPropertyNames(Object.getPrototypeOf(object))
		                      .find(key => object[key] === attributeOnObject)
	}
	if (!attributeName) {
		throw new Error("attribute not found on object")
	}
	object[attributeName] = (typeof attributeOnObject == "function") ? o.spy(attributeMock) : attributeMock
	return {
		_originalObject: object,
		_originalAttribute: attributeOnObject,
		_attributeName: attributeName
	}
}

export function unmockAttribute(mock: Object) {
	mock._originalObject[mock._attributeName] = mock._originalAttribute
}

export function spy(producer?: (...any) => any) {
	const invocations = []
	const s = (...args: any[]) => {
		invocations.push(args)
		return producer && producer(...args)
	}
	s.invocations = invocations
	return s
}