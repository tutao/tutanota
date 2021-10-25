//@flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import {Dialog, DialogType} from "../base/Dialog"
import {lang} from "../../misc/LanguageViewModel"
import {DatePicker} from "./DatePicker"
import {px} from "../size"
import {client} from "../../misc/ClientDetector"
import {formatDateWithWeekdayAndYear} from "../../misc/Formatter"

assertMainOrNode()

/**
 * Shows a dialog in which the user can select a start date and an end date. Start and end date does not need to be selected, then they are null and regarded as unlimited.
 */
export function showDateRangeSelectionDialog<T>(startOfTheWeekOffset: number, start: Date, end: Date): Promise<{start: Date, end: Date}> {
	const helpLabel = (date) => date != null ? () => formatDateWithWeekdayAndYear(date) : "unlimited_label"

	let startDate = start
	let endDate = end

	const form: MComponent<void> = {
		view: () => m(".flex-space-between",
			client.isDesktopDevice() ? {style: {height: px(305)}} : {}, [
				m(".pr-s.flex-grow.max-width-200.flex-space-between.flex-column", m(DatePicker, {
					date: startDate,
					onDateSelected: date => startDate = date,
					startOfTheWeekOffset,
					label: "dateFrom_label",
					nullSelectionText: helpLabel(start)
				})),
				m(".pl-s.flex-grow.max-width-200.flex-space-between.flex-column", m(DatePicker, {
					date: endDate,
					onDateSelected: date => endDate = date,
					startOfTheWeekOffset,
					label: "dateFrom_label",
					nullSelectionText: helpLabel(end)
				}))
			]
		)
	}
	return new Promise((resolve) => {
		let dialog = Dialog.showActionDialog({
			title: lang.get("selectPeriodOfTime_label"),
			child: form,
			allowOkWithReturn: true,
			okAction: () => requestAnimationFrame(() => {
				const start = startDate
				const end = endDate
				if (start.getTime() > end.getTime()) {
					Dialog.error("startAfterEnd_label")
				} else {
					dialog.close()
					resolve({start, end})
				}
			}),
			type: DialogType.EditMedium
		})
	})
}


