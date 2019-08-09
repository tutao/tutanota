//@flow

import {fileController} from "../file/FileController"
import {utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {parseIntoCalendarEvents, parseIntoTree} from "./CalendarParser"
import {generateEventElementId, isLongEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"

export function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot) {
	fileController.showFileChooser(true, ["ical", "ics", "ifb", "icalendar"]).then((dataFiles) => {
		dataFiles.map(parseFile).map((events: Iterable<CalendarEvent>) => {
			Promise.each(events, (event) => {
				const elementId = generateEventElementId(event.startTime.getTime())
				if (isLongEvent(event)) {
					event._id = [calendarGroupRoot.longEvents, elementId]
				} else {
					event._id = [calendarGroupRoot.shortEvents, elementId]
				}
				event._ownerGroup = calendarGroupRoot._id
				return worker.createCalendarEvent(calendarGroupRoot, event, [], null).delay(100)
			})
		})
	})
	// Dialog.showActionDialog({
	// 	title: () => "Import",
	// 	child: () => {
	// 		return null
	// 	},
	// 	okAction: (dialog) => dialog.close(),
	// })
}

function parseFile(file: DataFile) {
	const stringData = utf8Uint8ArrayToString(file.data)
	const tree = parseIntoTree(stringData)
	console.log(tree)
	const events = parseIntoCalendarEvents(tree)
	console.log(events)
	return events

	//
	// if (tree.length !== 1) {
	// 	console.log(tree.length, tree)
	// 	throw new Error("Expecting tree to be non-empty" + JSON.stringify(tree))
	// }
	// const vcalendar = tree[0]
	// if (typeof vcalendar === "string" || vcalendar.tag !== "VCALENDAR") {
	// 	throw new Error("Expecting root to be a VCALENDAR object" + JSON.stringify(vcalendar))
	// }
	// const events = []
	// vcalendar.children.forEach((child) => {
	// 		if (typeof child !== "string" && child.tag && child.tag === "VEVENT") {
	// 			const event = createCalendarEvent()
	// 			child.children.forEach((property) => {
	// 				if (typeof property === "string") {
	// 					const regexResult = /([a-zA-Z]*)[:;]/.exec(property)
	// 					if (regexResult && regexResult.length > 0) {
	// 						const tag = regexResult[1]
	// 						switch (tag) {
	// 							case "DTSTART":
	// 								const value = property.substring("DTSTART.".length)
	// 								if (/[0-9]{8}T[0-9]{6}Z/.test(value)) {
	// 									const {year, month, day} = parseDateString(value)
	// 									const hour = parseInt(value.slice(9, 11))
	// 									const minute = parseInt(value.slice(11, 13))
	// 									event.startTime = new Date()
	// 									event.startTime.setFullYear(year, month, day)
	// 									event.startTime.setHours(hour, minute)
	// 								} else if (value.startsWith("VALUE=DATE:")) {
	// 									const {year, month, day} = parseDateString(value.slice("VALUE=DATE:".length))
	// 									event.startTime = new Date()
	// 									event.startTime.setFullYear(year, month, day)
	// 									event.startTime.setUTCHours(0, 0, 0, 0)
	// 								} else if (/TZID=[a-zA-Z\/]+:/) {
	//
	// 								} else {
	// 									console.log("DTSTART unknown", value)
	// 								}
	// 						}
	// 					}
	// 				}
	// 			})
	// 			events.push(event)
	// 		}
	// 	}
// )

	// return events
}
