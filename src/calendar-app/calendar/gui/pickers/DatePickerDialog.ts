import m, { Component } from "mithril"
import { Dialog, DialogType } from "../../../../common/gui/base/Dialog.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { DatePicker } from "./DatePicker.js"
import { px, size } from "../../../../common/gui/size.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { assertMainOrNode } from "../../../../common/api/common/Env.js"
import { debounceStart, noOp } from "@tutao/tutanota-utils"
import { newPromise } from "@tutao/tutanota-utils"

assertMainOrNode()

/**
 * Shows a dialog in which the user can select a start date and an end date. Start and end date does not need to be selected, then they are null and regarded as unlimited.
 */
export function showDateRangeSelectionDialog({
	start,
	optionalStartDate,
	end,
	startOfTheWeekOffset,
	dateValidator = () => null,
}: {
	startOfTheWeekOffset: number
	start: Date | null
	end: Date
	optionalStartDate: boolean
	dateValidator: (startDate: Date | null, endDate: Date | null) => string | null
}): Promise<{
	start: typeof start
	end: Date
}> {
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
				".flex.col.pt-16",
				m(
					"",
					{
						style: {
							display: "grid",
							"grid-template-columns": "2fr 6fr 1fr",
							"grid-gap": px(size.spacing_8),
							"align-items": "center",
						},
					},
					[
						m("", lang.get("dateFrom_label")),
						m(
							".flex-grow.flex-space-between.flex-column",
							m(DatePicker, {
								useInputButton: true,
								date: startDate ?? undefined,
								onDateSelected: (date) => {
									warning = null
									startDate = date
									validateDates(startDate, endDate)
								},
								startOfTheWeekOffset,
								label: "dateFrom_label",
								nullSelectionText: optionalStartDate ? "unlimited_label" : undefined,
							}),
						),
						m(".button-height.button-width-fixed"),
						m("", lang.get("dateTo_label")),
						m(
							".flex-grow.flex-space-between.flex-column",
							m(DatePicker, {
								useInputButton: true,
								date: endDate,
								onDateSelected: (date) => {
									warning = null
									endDate = date
									validateDates(startDate, endDate)
								},
								startOfTheWeekOffset,
								label: "dateTo_label",
							}),
						),
					],
				),
				warning ? m(".mt-16.center", warning) : null,
			),
	}
	return newPromise((resolve) => {
		let dialog = Dialog.showActionDialog({
			title: "selectPeriodOfTime_label",
			child: form,
			allowOkWithReturn: true,
			okAction: () =>
				requestAnimationFrame(() => {
					const start = startDate
					const end = endDate

					if (start && start.getTime() > end.getTime()) {
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
