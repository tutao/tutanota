import o from "@tutao/otest"
import { getDateFromMousePos, getTimeFromMousePos } from "../../../src/calendar-app/calendar/gui/CalendarGuiUtils.js"

o.spec("CalendarGuiUtils", function () {
	o("getDateFromMouseClick", function () {
		function input(x, y, targetWidth, targetHeight) {
			return {
				x,
				y,
				targetWidth,
				targetHeight,
			}
		}

		const weeks = [
			[new Date(0), new Date(1), new Date(2), new Date(3)],
			[new Date(4), new Date(5), new Date(6), new Date(7)],
			[new Date(8), new Date(9), new Date(10), new Date(11)],
		]
		o(getDateFromMousePos(input(1, 1, 12, 9), weeks).getTime()).equals(0)
		o(getDateFromMousePos(input(4, 1, 12, 9), weeks).getTime()).equals(1)
		o(getDateFromMousePos(input(7, 1, 12, 9), weeks).getTime()).equals(2)
		o(getDateFromMousePos(input(10, 1, 12, 9), weeks).getTime()).equals(3)
		o(getDateFromMousePos(input(1, 4, 12, 9), weeks).getTime()).equals(4)
		o(getDateFromMousePos(input(4, 4, 12, 9), weeks).getTime()).equals(5)
		o(getDateFromMousePos(input(7, 4, 12, 9), weeks).getTime()).equals(6)
		o(getDateFromMousePos(input(10, 4, 12, 9), weeks).getTime()).equals(7)
		o(getDateFromMousePos(input(1, 7, 12, 9), weeks).getTime()).equals(8)
		o(getDateFromMousePos(input(4, 7, 12, 9), weeks).getTime()).equals(9)
		o(getDateFromMousePos(input(7, 7, 12, 9), weeks).getTime()).equals(10)
		o(getDateFromMousePos(input(10, 7, 12, 9), weeks).getTime()).equals(11)
	})
	o("getTimeFromMouseClick", function () {
		function input(y, targetHeight) {
			return {
				x: 0,
				y,
				targetWidth: 0,
				targetHeight,
			}
		}

		o(getTimeFromMousePos(input(0, 4 * 24), 4).toObject()).deepEquals({
			hours: 0,
			minutes: 0,
		})
		o(getTimeFromMousePos(input(1, 4 * 24), 4).toObject()).deepEquals({
			hours: 0,
			minutes: 15,
		})
		o(getTimeFromMousePos(input(2, 4 * 24), 4).toObject()).deepEquals({
			hours: 0,
			minutes: 30,
		})
		o(getTimeFromMousePos(input(3, 4 * 24), 4).toObject()).deepEquals({
			hours: 0,
			minutes: 45,
		})
		o(getTimeFromMousePos(input(4, 4 * 24), 4).toObject()).deepEquals({
			hours: 1,
			minutes: 0,
		})
		o(getTimeFromMousePos(input(2 * 24 - 1, 4 * 24), 4).toObject()).deepEquals({
			hours: 11,
			minutes: 45,
		})
		o(getTimeFromMousePos(input(4 * 24 - 1, 4 * 24), 4).toObject()).deepEquals({
			hours: 23,
			minutes: 45,
		})
	})
})
