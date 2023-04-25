import m, { Children, Component, Vnode } from "mithril"
import { CalendarEventWhenModel } from "../../date/eventeditor/CalendarEventWhenModel.js"
import { createIntervalValues, createRepeatRuleEndTypeValues, createRepeatRuleFrequencyValues } from "../../date/CalendarUtils.js"
import { TextField } from "../../../gui/base/TextField.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { DropDownSelector, DropDownSelectorAttrs, SelectorItemList } from "../../../gui/base/DropDownSelector.js"
import { EndType, RepeatPeriod } from "../../../api/common/TutanotaConstants.js"
import { BootIcons } from "../../../gui/base/icons/BootIcons.js"
import { DatePicker } from "../../../gui/date/DatePicker.js"
import { IconButton } from "../../../gui/base/IconButton.js"
import { Icons } from "../../../gui/base/icons/Icons.js"

import { renderTwoColumnsIfFits } from "../../../gui/base/GuiUtils.js"

export type RepeatRuleEditorAttrs = {
	model: CalendarEventWhenModel
	startOfTheWeekOffset: number
}

export class RepeatRuleEditor implements Component<RepeatRuleEditorAttrs> {
	view({ attrs }: Vnode<RepeatRuleEditorAttrs>): Children {
		const { model } = attrs
		return [
			renderTwoColumnsIfFits(
				[
					m(".flex-grow.pr-s", this.renderRepeatPeriod(model)),
					m(".flex-grow.pl-s" + (model.repeatPeriod != null ? "" : ".hidden"), this.renderRepeatInterval(model)),
				],
				this.renderEndCondition(attrs),
			),
			renderTwoColumnsIfFits(this.renderExclusionCount(model), null),
		]
	}

	private renderEndCondition(attrs: RepeatRuleEditorAttrs): Children {
		const { model } = attrs
		if (model.repeatPeriod == null) {
			return null
		}
		return [m(".flex-grow.pr-s", this.renderEndType(model)), m(".flex-grow.pl-s", this.renderEndValue(attrs))]
	}

	private renderExclusionCount(model: CalendarEventWhenModel): Children {
		if (model.repeatPeriod == null || model.excludedDates.length === 0) {
			return null
		}
		return [
			m(
				".flex-grow.pr-s",
				m(TextField, {
					label: "emptyString_msg",
					value: lang.get("someRepetitionsDeleted_msg"),
					injectionsRight: () => this.renderDeleteExclusionButton(model),
					disabled: true,
				}),
			),
		]
	}

	/**
	 * how frequently the event repeats (Never, daily, annually etc)
	 * @private
	 */
	private renderRepeatPeriod(model: CalendarEventWhenModel) {
		const repeatValues: SelectorItemList<RepeatPeriod | null> = createRepeatRuleFrequencyValues()
		return m(DropDownSelector, {
			label: "calendarRepeating_label",
			items: repeatValues,
			selectedValue: model.repeatPeriod,
			selectionChangedHandler: (period) => (model.repeatPeriod = period),
			icon: BootIcons.Expand,
			disabled: false,
		} satisfies DropDownSelectorAttrs<RepeatPeriod | null>)
	}

	/** Repeat interval: every day, every second day etc
	 * @private
	 */
	private renderRepeatInterval(model: CalendarEventWhenModel) {
		const intervalValues: SelectorItemList<number> = createIntervalValues()
		return m(DropDownSelector, {
			label: "interval_title",
			items: intervalValues,
			selectedValue: model.repeatInterval,
			selectionChangedHandler: (interval: number) => (model.repeatInterval = interval),
			icon: BootIcons.Expand,
			disabled: false,
		})
	}

	/**
	 * if and how the event stops repeating, like after number of occurrences or after a date.
	 * @param model
	 * @private
	 */
	private renderEndType(model: CalendarEventWhenModel) {
		const endTypeValues: SelectorItemList<EndType> = createRepeatRuleEndTypeValues()
		return m(DropDownSelector, {
			label: () => lang.get("calendarRepeatStopCondition_label"),
			items: endTypeValues,
			selectedValue: model.repeatEndType,
			selectionChangedHandler: (end: EndType) => (model.repeatEndType = end),
			icon: BootIcons.Expand,
			disabled: false,
		})
	}

	/**
	 * the value of the end condition - a number for ending after number of occurrences, a date for ending after date.
	 * @private
	 */
	private renderEndValue(attrs: RepeatRuleEditorAttrs): Children {
		const { model, startOfTheWeekOffset } = attrs
		const intervalValues: SelectorItemList<number> = createIntervalValues()
		if (model.repeatPeriod == null || model.repeatEndType === EndType.Never) {
			return null
		} else if (model.repeatEndType === EndType.Count) {
			return m(DropDownSelector, {
				label: "emptyString_msg",
				items: intervalValues,
				selectedValue: model.repeatEndOccurrences,
				selectionChangedHandler: (endValue: number) => (model.repeatEndOccurrences = endValue),
				icon: BootIcons.Expand,
			})
		} else if (model.repeatEndType === EndType.UntilDate) {
			return m(DatePicker, {
				date: model.repeatEndDateForDisplay,
				onDateSelected: (date) => (model.repeatEndDateForDisplay = date),
				startOfTheWeekOffset,
				label: "emptyString_msg",
				nullSelectionText: "emptyString_msg",
				// When the guests expander is expanded and the dialog has overflow, then the scrollbar will overlap the date picker popup
				// to fix this we could either:
				// * reorganize the layout so it doesn't go over the right edge
				// * change the alignment so that it goes to the left (this is what we do)
				rightAlignDropdown: true,
			})
		} else {
			return null
		}
	}

	private renderDeleteExclusionButton(model: CalendarEventWhenModel): Children {
		return m(IconButton, {
			title: "restoreExcludedRecurrences_action",
			click: () => model.deleteExcludedDates(),
			icon: Icons.Cancel,
		})
	}
}
