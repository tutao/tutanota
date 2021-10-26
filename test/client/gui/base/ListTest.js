//@flow
import o from "ospec"
import {List, ScrollBuffer} from "../../../../src/gui/base/List"
import {downcast, noOp} from "@tutao/tutanota-utils"
import {createMail} from "../../../../src/api/entities/tutanota/Mail"
import {GENERATED_MAX_ID} from "../../../../src/api/common/utils/EntityUtils";
import type {ListElement} from "../../../../src/api/common/utils/EntityUtils"

function dummySort() {
	return 0
}

const defaultSwipe = {
	enabled: true,
	renderLeftSpacer: () => null,
	renderRightSpacer: () => null,
	swipeLeft: () => Promise.resolve(false),
	swipeRight: () => Promise.resolve(false)
}

const defaultVLE = {
	render: () => null,
	update: noOp,
	domElement: document.createElement("div"),
	entity: (null: ?ListElement),
	top: 0,
}

o.spec("List", function () {
	o.spec("list creation", function () {
		o("default page size: 100", function (done) {
			let list = new List({
				fetch: (start, count) => {
					o(start).equals("zzzzzzzzzzzz")
					o(count).equals(100)
					done()
					return Promise.resolve(new Array(100))
				},
				sortCompare: dummySort,
				rowHeight: 5,
				className: "div",
				createVirtualRow: () => defaultVLE,
				elementSelected: () => {},
				emptyMessage: "",
				loadSingle: () => Promise.reject("stub"),
				multiSelectionAllowed: true,
				showStatus: false,
				swipe: defaultSwipe,
			})
			list.loadInitial()
		})
	})

	o.spec("updateRange", function () {

		let requestAnimationFrame = window.requestAnimationFrame

		o.before(function () {
			window.requestAnimationFrame = function (callback) {
				callback()
			}
		})
		o.after(function () {
			window.requestAnimationFrame = requestAnimationFrame
		})

		o("update range updates the backing list", async function () {
			o.timeout(300)
			const mail0 = createMail()
			const mail5 = createMail()
			let db = new Array(1000).fill(mail0).fill(mail5, 103, 108)
			let list = new List({
				fetch: (start, count) => {
					if (start !== GENERATED_MAX_ID) {
						throw new Error("wrong start")
					}
					return Promise.resolve(db.slice(0, count))
				},
				createVirtualRow: () => defaultVLE,
				sortCompare: dummySort,
				rowHeight: 5,
				className: "div",
				elementSelected: () => {},
				elementsDraggable: true,
				emptyMessage: "",
				loadSingle: () => Promise.reject("stub"),
				multiSelectionAllowed: true,
				showStatus: false,
				swipe: defaultSwipe,
			})

			list._domListContainer = downcast({
				clientWidth: 100,
				clientHeight: 100,
				addEventListener: function () {
				}
			})
			list._domLoadingRow = downcast({classList: {add: () => undefined, remove: () => undefined}, style: {}})
			list._setDomList(downcast({style: {}}))
			list._init()
			list._domInitialized.resolve()

			await list.loadInitial()
			o(list._loadedEntities.slice(0, 100)).deepEquals(new Array(100).fill(mail0))
		})
	})

	o.spec("list init", function () {

		let requestAnimationFrame = window.requestAnimationFrame

		o.before(function () {
			window.requestAnimationFrame = function (callback) {
				callback()
			}
		})
		o.after(function () {
			window.requestAnimationFrame = requestAnimationFrame
		})

		o("create virtual elements according to visible area and buffer size", async function () {
			o.timeout(100)
			let list = new List({
				rowHeight: 62,
				fetch: () => Promise.resolve(new Array(100).fill(createMail())),
				createVirtualRow: () => defaultVLE,
				sortCompare: dummySort,
				className: "div",
				elementSelected: () => {},
				emptyMessage: "",
				loadSingle: () => Promise.reject("stub"),
				multiSelectionAllowed: true,
				showStatus: false,
				swipe: defaultSwipe,
			})
			list._domListContainer = downcast({
				clientWidth: 100,
				clientHeight: 235,
				addEventListener: function () {
				}
			})
			list._domInitialized.resolve()
			list._domLoadingRow = downcast({classList: {add: () => undefined, remove: () => undefined}, style: {}})
			list._setDomList(downcast({style: {}}))
			list._init()

			await list.loadInitial()
			list._init()
			list._createChildrens()
			o(list._virtualList.length).equals(Math.ceil(235 / 62) + ScrollBuffer * 2)
		})
	})
})

