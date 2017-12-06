//@flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"
import {Dialog} from "./Dialog"
import {lang} from "../../misc/LanguageViewModel"
import {DatePicker} from "./DatePicker"

assertMainOrNode()

/**
 * Shows a dialog in which the user can select a start date and an end date. Start and end date does not need to be selected, then they are null.
 */
export function showDatePickerDialog<T>(start: ?Date, end: ?Date, startBeforeEnd: boolean): Promise<{start: ?Date, end: ?Date}> {
	let dateStart = new DatePicker("dateFrom_label")
	if (start) {
		dateStart.setDate(start)
	}
	let dateEnd = new DatePicker("dateTo_label")
	if (end) {
		dateEnd.setDate(end)
	}
	let form = {
		view: () => {
			return [
				m(".flex-space-between", [
					m(".pr-s", [m(dateStart)]),
					m(".pl-s", [m(dateEnd)]),
				])
			]
		}
	}
	return Promise.fromCallback(cb => {
		let dialog = Dialog.smallActionDialog(lang.get("selectTime_label"), form, () => {
			let start = (dateStart.invalidDate) ? null : dateStart.date()
			let end = dateEnd.invalidDate ? null : dateEnd.date()
			if (startBeforeEnd && start && end && start.getTime() > end.getTime()) {
				Dialog.error("startAfterEnd_label")
			} else if (!startBeforeEnd && start && end && start.getTime() < end.getTime()) {
				Dialog.error("endAfterStart_label")
			} else {
				dialog.close()
				cb(null, {start, end})
			}
		})
	})
}