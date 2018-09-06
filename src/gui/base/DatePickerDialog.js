//@flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"
import {Dialog, DialogType} from "./Dialog"
import {lang} from "../../misc/LanguageViewModel"
import {DatePicker} from "./DatePicker"
import {px} from "../size"
import {client} from "../../misc/ClientDetector"

assertMainOrNode()

/**
 * Shows a dialog in which the user can select a start date and an end date. Start and end date does not need to be selected, then they are null and regarded as unlimited.
 */
export function showDatePickerDialog<T>(start: ?Date, end: ?Date, startBeforeEnd: boolean): Promise<{start: ?Date, end: ?Date}> {
	let dateStart = new DatePicker("dateFrom_label", "unlimited_label")
	if (start) {
		dateStart.setDate(start)
	}
	let dateEnd = new DatePicker("dateTo_label", "unlimited_label")
	if (end) {
		dateEnd.setDate(end)
	}
	let form = {
		view: () => m(".flex-space-between",
			client.isDesktopDevice() ? {style: {height: px(305)}} : {}, [
				m(".pr-s.flex-grow.max-width-200.flex-space-between.flex-column", m(dateStart)),
				m(".pl-s.flex-grow.max-width-200.flex-space-between.flex-column", m(dateEnd))
			]
		)
	}
	return Promise.fromCallback(cb => {
		let dialog = Dialog.showActionDialog({
			title: lang.get("selectPeriodOfTime_label"),
			child: form,
			okAction: () => {
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
			},
			type: DialogType.EditMedium
		})
	})
}