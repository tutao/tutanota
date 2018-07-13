import o from "ospec/ospec.js"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
import {createContactMailAddress} from "../../../src/api/entities/tutanota/ContactMailAddress"
import {clone} from "../../../src/api/common/utils/Utils"

o.spec("utils", function () {

	o("deep clone an instance", function () {
		let address = createContactMailAddress()
		address.type = "1"
		address._id = "dummyAddressId"
		address.address = "donald@duck.de"
		address.customTypeName = ""

		let c1 = createContact()
		c1._ownerEncSessionKey = new Uint8Array([3, 2])
		c1._id = ["dummyListId", "dummyId"]
		c1.firstName = "Donald"
		c1.lastName = "Duck"
		c1.oldBirthday = new Date(2017, 5, 23)
		c1.mailAddresses = [address]

		let c2 = clone(c1)

		o(deepEqual(c1, c2)).equals(true)
		o(Object.is(c1, c2)).equals(false)
		o(Object.is(c1._id, c2._id)).equals(false)("arrays must be cloned")
		o(Object.is(c1._ownerEncSessionKey, c2._ownerEncSessionKey)).equals(false)("Uint8Arrays must be cloned")
		o(c1._ownerEncSessionKey instanceof Uint8Array).equals(true)
		o(c2._ownerEncSessionKey instanceof Uint8Array).equals(true)
		o(Object.is(c1.mailAddresses[0], c2.mailAddresses[0])).equals(false)("objects must be cloned")
	})
})

/**
 * modified deepEquals from ospec is only needed as long as we use custom classes (TypeRef) and Date is not properly handled
 */
function deepEqual(a, b) {
	if (a === b) return true
	if (a === null ^ b === null || a === undefined ^ b === undefined) return false
	if (typeof a === "object" && typeof b === "object") {
		var aIsArgs = isArguments(a), bIsArgs = isArguments(b)
		if (a.length === b.length && (a instanceof Array && b instanceof Array || aIsArgs && bIsArgs)) {
			var aKeys = Object.getOwnPropertyNames(a), bKeys = Object.getOwnPropertyNames(b)
			if (aKeys.length !== bKeys.length) return false
			for (var i = 0; i < aKeys.length; i++) {
				if (!hasOwn.call(b, aKeys[i]) || !deepEqual(a[aKeys[i]], b[aKeys[i]])) return false
			}
			return true
		}
		if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
		if (a instanceof Object && b instanceof Object && !aIsArgs && !bIsArgs) {
			for (var i in a) {
				if ((!(i in b)) || !deepEqual(a[i], b[i])) return false
			}
			for (var i in b) {
				if (!(i in a)) return false
			}
			return true
		}
		if (typeof Buffer === "function" && a instanceof Buffer && b instanceof Buffer) {
			for (var i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false
			}
			return true
		}
		if (a.valueOf() === b.valueOf()) return true
	}
	return false
}


function isArguments(a) {
	if ("callee" in a) {
		for (var i in a) if (i === "callee") return false
		return true
	}
}

const hasOwn = ({}).hasOwnProperty