import o from "@tutao/otest"
import { clone, deepEqual, getChangedProps, memoized } from "../lib/Utils.js"
import { arrayEquals } from "../lib/index.js"
import { func, matchers, when } from "testdouble"
import { verify } from "@tutao/tutanota-test-utils"

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

	o.spec("memoized", function () {
		o.test("when called twice with the same argument it is called once", function () {
			const fnToMemoize = func<(_: number) => number>()
			when(fnToMemoize(matchers.anything())).thenReturn(42)
			const memoizedFn = memoized(fnToMemoize)
			o(memoizedFn(1)).equals(42)
			o(memoizedFn(1)).equals(42)
			verify(fnToMemoize(matchers.anything()), { times: 1 })
		})

		o.test("when called twice with the different arguments it is called twice", function () {
			const fnToMemoize = func<(_: number) => number>()
			when(fnToMemoize(1)).thenReturn(11)
			when(fnToMemoize(2)).thenReturn(12)
			const memoizedFn = memoized(fnToMemoize)
			o(memoizedFn(1)).equals(11)
			o(memoizedFn(2)).equals(12)
			verify(fnToMemoize(1), { times: 1 })
			verify(fnToMemoize(2), { times: 1 })
		})

		o.test("when called twice with the same arguments it is called once", function () {
			const fnToMemoize = func<(l: number, r: number) => number>()
			when(fnToMemoize(matchers.anything(), matchers.anything())).thenReturn(42)
			const memoizedFn = memoized(fnToMemoize)
			o(memoizedFn(1, 2)).equals(42)
			o(memoizedFn(1, 2)).equals(42)
			verify(fnToMemoize(matchers.anything(), matchers.anything()), { times: 1 })
		})

		o.test("when called twice with different arguments it is called twice", function () {
			const fnToMemoize = func<(l: number, r: number) => number>()
			when(fnToMemoize(1, 1)).thenReturn(11)
			when(fnToMemoize(1, 2)).thenReturn(12)
			const memoizedFn = memoized(fnToMemoize)
			o(memoizedFn(1, 1)).equals(11)
			o(memoizedFn(1, 2)).equals(12)
			verify(fnToMemoize(1, 1), { times: 1 })
			verify(fnToMemoize(1, 2), { times: 1 })
		})
	})
})
