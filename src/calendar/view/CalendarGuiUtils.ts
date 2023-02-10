import m, { Child } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { Icons } from "../../gui/base/icons/Icons"
import { Dialog } from "../../gui/base/Dialog"
import type { MousePosAndBounds } from "../../gui/base/GuiUtils"
import { Time } from "../../api/common/utils/Time"
import { assert, clamp } from "@tutao/tutanota-utils"

export function renderCalendarSwitchLeftButton(label: TranslationKey, switcher: (...args: Array<any>) => any): Child {
	return m(Button, {
		label: label,
		icon: () => Icons.ArrowDropLeft,
		type: ButtonType.ActionLarge,
		colors: ButtonColor.DrawerNav,
		click: switcher,
	})
}

export function renderCalendarSwitchRightButton(label: TranslationKey, switcher: (...args: Array<any>) => any): Child {
	return m(Button, {
		label: label,
		icon: () => Icons.ArrowDropRight,
		type: ButtonType.ActionLarge,
		colors: ButtonColor.DrawerNav,
		click: switcher,
	})
}

export function askIfShouldSendCalendarUpdatesToAttendees(): Promise<"yes" | "no" | "cancel"> {
	return new Promise((resolve) => {
		let alertDialog: Dialog
		const cancelButton = {
			label: "cancel_action",
			click: () => {
				resolve("cancel")
				alertDialog.close()
			},
			type: ButtonType.Secondary,
		} as const
		const noButton = {
			label: "no_label",
			click: () => {
				resolve("no")
				alertDialog.close()
			},
			type: ButtonType.Secondary,
		} as const
		const yesButton = {
			label: "yes_label",
			click: () => {
				resolve("yes")
				alertDialog.close()
			},
			type: ButtonType.Primary,
		} as const

		const onclose = (positive: boolean) => (positive ? resolve("yes") : resolve("cancel"))

		alertDialog = Dialog.confirmMultiple("sendUpdates_msg", [cancelButton, noButton, yesButton], onclose)
	})
}

/**
 * Map the location of a mouse click on an element to a give date, given a list of weeks
 * there should be neither zero weeks, nor zero length weeks
 */
export function getDateFromMousePos({ x, y, targetWidth, targetHeight }: MousePosAndBounds, weeks: Array<Array<Date>>): Date {
	assert(weeks.length > 0, "Weeks must not be zero length")
	const unitHeight = targetHeight / weeks.length
	const currentSquareY = Math.floor(y / unitHeight)
	const week = weeks[clamp(currentSquareY, 0, weeks.length - 1)]
	assert(week.length > 0, "Week must not be zero length")
	const unitWidth = targetWidth / week.length
	const currentSquareX = Math.floor(x / unitWidth)
	return week[clamp(currentSquareX, 0, week.length - 1)]
}

/**
 * Map the vertical position of a mouse click on an element to a time of day
 * @param y
 * @param targetHeight
 * @param hourDivision: how many times to divide the hour
 */
export function getTimeFromMousePos({ y, targetHeight }: MousePosAndBounds, hourDivision: number): Time {
	const sectionHeight = targetHeight / 24
	const hour = y / sectionHeight
	const hourRounded = Math.floor(hour)
	const minutesInc = 60 / hourDivision
	const minute = Math.floor((hour - hourRounded) * hourDivision) * minutesInc
	return new Time(hourRounded, minute)
}

export const SELECTED_DATE_INDICATOR_THICKNESS = 4
