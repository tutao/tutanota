import o from "@tutao/otest"
import { clone, deepEqual, getChangedProps } from "../lib/Utils.js"
import { arrayEquals } from "../lib/index.js"

o.spec("utils", function () {
	o("deep clone an instance", function () {
		let address: any = {}
		address.type = "1"
		address._id = "dummyAddressId"
		address.address = "donald@duck.de"
		address.customTypeName = ""
		let c1: any = {}
		const ownerEncSessionKey = new Uint8Array([3, 2])
		c1._ownerKeyVersion = "2"
		c1._ownerEncSessionKey = ownerEncSessionKey
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
		o(c2._ownerKeyVersion).equals(c1._ownerKeyVersion)
		o(arrayEquals(ownerEncSessionKey, c2._ownerEncSessionKey)).equals(true)
		o(Object.is(c1.mailAddresses[0], c2.mailAddresses[0])).equals(false)("objects must be cloned")
	})
	o("getChangedProps", function () {
		o(
			getChangedProps(
				{
					a: 1,
					b: 2,
				},
				{
					a: 1,
					b: 1,
					d: 4,
				},
			),
		).deepEquals(["b"])
		o(
			getChangedProps(
				{
					a: 1,
					b: [1, 2, 3],
				},
				{},
			),
		).deepEquals([])
		o(
			getChangedProps(
				{},
				{
					a: 1,
					b: [1, 2, 3],
				},
			),
		).deepEquals([])
		o(
			getChangedProps(
				{
					a: 1,
					b: [1, 2, 3],
				},
				{
					a: 1,
					b: [1, 2, 3],
				},
			),
		).deepEquals([])
		o(
			getChangedProps(
				{
					a: 1,
					b: [1, 2, 3],
				},
				{
					a: 1,
					b: [2, 1, 3],
				},
			),
		).deepEquals(["b"])
		o(
			getChangedProps(
				{
					a: undefined,
					b: null,
				},
				{
					a: {
						a: "hello",
					},
					b: [1, 2, 3],
				},
			),
		).deepEquals(["a", "b"])
		o(
			getChangedProps(
				{
					a: undefined,
					b: null,
				},
				{
					a: null,
					b: undefined,
				},
			),
		).deepEquals([])
		o(
			getChangedProps(
				{
					a: {},
					b: [1, 2, 3],
				},
				{
					a: {
						a: "hello",
					},
					b: [1, 2, 3],
				},
			),
		).deepEquals(["a"])
		o(
			getChangedProps(
				{
					a: "world",
					b: [],
				},
				{
					a: "hello",
					b: [1, 2, 3],
				},
			),
		).deepEquals(["a", "b"])
		o(getChangedProps(undefined, null)).deepEquals([])
		o(getChangedProps(null, undefined)).deepEquals([])
		o(getChangedProps(undefined, undefined)).deepEquals([])
		o(getChangedProps(null, null)).deepEquals([])
	})
})
