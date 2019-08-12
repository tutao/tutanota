//@flow

import {fileController} from "../file/FileController"
import {utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {parseIntoCalendarEvents, parseIntoTree} from "./CalendarParser"
import {generateEventElementId, isLongEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {getTimeZone} from "./CalendarUtils"

export function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot) {
	fileController.showFileChooser(true, ["ical", "ics", "ifb", "icalendar"]).then((dataFiles) => {
		dataFiles.map(parseFile).map((events: Iterable<{event: CalendarEvent, alarms: Array<AlarmInfo>}>) => {
			Promise.each(events, ({event, alarms}) => {
				const elementId = generateEventElementId(event.startTime.getTime())
				if (isLongEvent(event)) {
					event._id = [calendarGroupRoot.longEvents, elementId]
				} else {
					event._id = [calendarGroupRoot.shortEvents, elementId]
				}
				event._ownerGroup = calendarGroupRoot._id

				const repeatRule = event.repeatRule
				if (repeatRule && repeatRule.timeZone === "") {
					repeatRule.timeZone = getTimeZone()
				}

				for (let alarmInfo of alarms) {
					alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
				}
				return worker.createCalendarEvent(calendarGroupRoot, event, alarms, null).delay(100)
			})
		})
	})
}

function parseFile(file: DataFile) {
	const stringData = utf8Uint8ArrayToString(file.data)
	const tree = parseIntoTree(stringData)
	return parseIntoCalendarEvents(tree)
}
