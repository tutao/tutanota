import { parseCalendarFile, ParsedEvent } from "./CalendarImporter.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { lang } from "../../misc/LanguageViewModel.js"

async function downloadAndParseSubscriptionICalFile(iCalSubscriptionUrl: string): Promise<ParsedEvent[]> {
	try {
		const dataFiles = await // download file
		const contents = dataFiles.map((file) => parseCalendarFile(file).contents)
		return contents.flat()
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