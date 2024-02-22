import { parseCalendarFile, ParsedEvent } from "./CalendarImporter.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { createDataFile } from "../../api/common/DataFile.js"
import { assertNotNull } from "@tutao/tutanota-utils"

async function downloadAndParseSubscriptionICalFile(iCalSubscriptionUrl: string): Promise<ParsedEvent[]> {
	try {
		// download file
		return fetch(iCalSubscriptionUrl)
			.then((response) => response.body)
			.then((body) => assertNotNull(body))
			.then((body) => body.getReader().read())
			.then((stream) => assertNotNull(stream.value))
			.then((data) => createDataFile("event.ics", "ical", data))
			.then((dataFile) => parseCalendarFile(dataFile).contents)
			.then((parsedEvent) => parsedEvent.flat())
	} catch (e) {
		if (e instanceof ParserError) {
			console.log("Failed to parse file", e)
			Dialog.message(() =>
				lang.get("importReadFileError_msg", {
					"{filename}": e.filename,
				}),
			)
			return []
		} else {
			throw e
		}
	}
}
