import o from "ospec/ospec.js"
import {List, ScrollBuffer} from "../../../../src/gui/base/List"
import {client} from "../../../../src/misc/ClientDetector"
import {GENERATED_MAX_ID} from "../../../../src/api/common/EntityFunctions"
import {DeviceType} from "../../../../src/misc/ClientConstants"

client.device = DeviceType.DESKTOP

function dummySort(entity1, entity2) {
	return 0
}

o.spec("gui > list creation", function () {
	o("default page size: 100", function (done) {
		let list = new List({
			fetch: (start, count) => {
				o(start).equals("zzzzzzzzzzzz")
				o(count).equals(100)
				done()
				return Promise.resolve(new Array(100))
			},
			sortCompare: dummySort,
			rowHeight: 5
		})
		list.loadInitial()
	})
})

o.spec("gui > list updateRange", function () {

	let requestAnimationFrame = window.requestAnimationFrame

	o.before(function () {
		window.requestAnimationFrame = function (callback) {
			callback()
		}
	})
	o.after(function () {
		window.requestAnimationFrame = requestAnimationFrame
	})

	o("update range updates the backing list", function (done, timeout) {
		timeout(300)
		let createDomElement = () => {
			let e = document.createElement("div")
			if (!e.classList) {
				// classList does not exist in node
				e.classList = {add: () => undefined, remove: () => undefined}
			}
			return e
		}
		let vle = {
			render: () => {
			},
			update: () => {
			},
			domElement: createDomElement()
		}
		let db = new Array(1000).fill(0).fill(5, 103, 108)
		let list = new List({
			fetch: (start, count) => {
				if (start == GENERATED_MAX_ID) {
					start = 0
				}
				return Promise.resolve(db.slice(start, start + count))
			},
			createVirtualRow: listElement => {
				return vle
			},
			sortCompare: dummySort,
			rowHeight: 5
		})
		list.loadInitial().then(() => {
			o(list._loadedEntities.slice(0, 100)).deepEquals(new Array(100).fill(0))
			// o(list._loadedEntities.slice(100, 110)).deepEquals([undefined, undefined, undefined, 5, 5, 5, 5, 5, 0, 0])
			done()
		})

		list._domListContainer = {
			clientWidth: 100,
			clientHeight: 100,
			addEventListener: function () {
			}
		}
		list._domLoadingRow = {classList: {add: () => undefined, remove: () => undefined}, style: {}}
		list._setDomList({style: {}})
		list._init()
		list._domInitialized.resolve()
	})
})

o.spec("gui > list init", function () {

	let requestAnimationFrame = window.requestAnimationFrame

	o.before(function () {
		window.requestAnimationFrame = function (callback) {
			callback()
		}
	})
	o.after(function () {
		window.requestAnimationFrame = requestAnimationFrame
	})

	o("create virtual elements according to visible area and buffer size", (done, timeout) => {
		timeout(100)

		let createDomElement = () => {
			let e = document.createElement("div")
			if (!e.classList) {
				// classList does not exist in node
				e.classList = {add: () => undefined, remove: () => undefined}
			}
			return e
		}
		let vle = {
			render: () => {
			},
			update: () => {
			},
			domElement: createDomElement()
		}
		let list = new List({
			rowHeight: 62,
			fetch: (start, count) => {
				return Promise.resolve(new Array(100).fill(1))
			},
			createVirtualRow: listElement => {
				return vle
			},
			sortCompare: dummySort
		})
		list._domListContainer = {
			clientWidth: 100,
			clientHeight: 235,
			addEventListener: function () {
			}
		}
		list.loadInitial().then(() => {
			list._init()
			list._createVirtualElements()
			o(list._virtualList.length).equals(Math.ceil(235 / 62) + ScrollBuffer * 2)
		}).finally(() => {
			done()
		})

		list._domInitialized.resolve()
		list._domLoadingRow = {classList: {add: () => undefined, remove: () => undefined}, style: {}}
		list._setDomList({style: {}})
		list._init()
	})
})