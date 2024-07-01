import m, { Component } from "mithril"
import { Dialog, DialogType } from "../../../../common/gui/base/Dialog.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { DatePicker } from "./DatePicker.js"
import { px, size } from "../../../../common/gui/size.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { formatDateWithWeekdayAndYear } from "../../../../common/misc/Formatter.js"
import { assertMainOrNode } from "../../../../common/api/common/Env.js"
import { debounceStart, NBSP, noOp } from "@tutao/tutanota-utils"

assertMainOrNode()

/**
 * Shows a dialog in which the user can select a start date and an end date. Start and end date does not need to be selected, then they are null and regarded as unlimited.
 */
export function showDateRangeSelectionDialog<T>(
	startOfTheWeekOffset: number,
	start: Date,
	end: Date,
	dateValidator: (startDate: Date | null, endDate: Date | null) => string | null = () => null,
): Promise<{
	start: Date
	end: Date
}> {
	const helpLabel = (date: Date | null) => (date != null ? () => formatDateWithWeekdayAndYear(date) : "unlimited_label")

	const validateDates = debounceStart(750, (startDate, endDate) => {
		warning = dateValidator(startDate, endDate)
		m.redraw()
	})

	let startDate = start
	let endDate = end
	let warning: string | null = null
	const form: Component = {
		view: () =>
			m(
				".flex.col",
				m(".flex-space-between", [
					m(
						".pr-s.flex-grow.max-width-200.flex-space-between.flex-column",
						m(DatePicker, {
							date: startDate,
							onDateSelected: (date) => {
								warning = null
								startDate = date
								validateDates(startDate, endDate)
							},
							startOfTheWeekOffset,
							label: "dateFrom_label",
							nullSelectionText: helpLabel(start),
						}),
					),
					m(
						".pl-s.flex-grow.max-width-200.flex-space-between.flex-column",
						m(DatePicker, {
							date: endDate,
							onDateSelected: (date) => {
								warning = null
								endDate = date
								validateDates(startDate, endDate)
							},
							startOfTheWeekOffset,
							label: "dateTo_label",
							nullSelectionText: helpLabel(end),
						}),
					),
				]),
				m(".mt", { style: { minHeight: px(2 * size.font_size_base * size.line_height) } }, warning ?? NBSP),
			),
	}
	return new Promise((resolve) => {
		let dialog = Dialog.showActionDialog({
			title: lang.get("selectPeriodOfTime_label"),
			child: form,
			allowOkWithReturn: true,
			okAction: () =>
				requestAnimationFrame(() => {
					const start = startDate
					const end = endDate

					if (start.getTime() > end.getTime()) {
						Dialog.message("startAfterEnd_label")
					} else {
						dialog.close()
						resolve({
							start,
							end,
						})
					}
				}),
			type: DialogType.EditMedium,
		})
		if (client.isMobileDevice()) {
			// Prevent focusing text field automatically on mobile. It opens keyboard and you don't see all details.
			dialog.setFocusOnLoadFunction(noOp)
		}
	})
}
