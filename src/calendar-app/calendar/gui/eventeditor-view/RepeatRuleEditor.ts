import m, { Children, Component, Vnode } from "mithril"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { TextField } from "../../../../common/gui/base/TextField.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { DropDownSelector, DropDownSelectorAttrs, SelectorItemList } from "../../../../common/gui/base/DropDownSelector.js"
import { EndType, RepeatPeriod } from "../../../../common/api/common/TutanotaConstants.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { DatePicker } from "../pickers/DatePicker.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"

import { renderTwoColumnsIfFits } from "../../../../common/gui/base/GuiUtils.js"

import { createIntervalValues, createRepeatRuleEndTypeValues, createRepeatRuleFrequencyValues } from "../CalendarGuiUtils.js"

export type RepeatRuleEditorAttrs = {
	model: CalendarEventWhenModel
	disabled: boolean
	startOfTheWeekOffset: number
}

export class RepeatRuleEditor implements Component<RepeatRuleEditorAttrs> {
	view({ attrs }: Vnode<RepeatRuleEditorAttrs>): Children {
		const { model, disabled } = attrs
		return [
			renderTwoColumnsIfFits(
				[
					m(".flex-grow.pr-s", this.renderRepeatPeriod(attrs)),
					m(
						".flex-grow.pl-s" + (model.repeatPeriod != null ? "" : ".hidden"),
						this.renderRepeatInterval({
							...attrs,
							disabled: model.repeatPeriod == null ? true : attrs.disabled,
						}),
					),
				],
				this.renderEndCondition(attrs),
			),
			renderTwoColumnsIfFits(this.renderExclusionCount(attrs), null),
		]
	}

	private renderEndCondition(attrs: RepeatRuleEditorAttrs): Children {
		const { model } = attrs
		if (model.repeatPeriod == null) {
			return null
		}
		return [m(".flex-grow.pr-s", this.renderEndType(attrs)), m(".flex-grow.pl-s", this.renderEndValue(attrs))]
	}

	private renderExclusionCount({ model, disabled }: RepeatRuleEditorAttrs): Children {
		if (model.repeatPeriod == null || model.excludedDates.length === 0) {
			return null
		}
		return [
			m(
				".flex-grow.pr-s",
				m(TextField, {
					label: "emptyString_msg",
					value: lang.get("someRepetitionsDeleted_msg"),
					injectionsRight: () => (disabled ? null : this.renderDeleteExclusionButton(model)),
					isReadOnly: true,
				}),
			),
		]
	}

	/**
	 * how frequently the event repeats (Never, daily, annually etc)
	 * @private
	 */
	private renderRepeatPeriod({ model, disabled }: RepeatRuleEditorAttrs) {
		const repeatValues: SelectorItemList<RepeatPeriod | null> = createRepeatRuleFrequencyValues()
		return m(DropDownSelector, {
			label: "calendarRepeating_label",
			items: repeatValues,
			selectedValue: model.repeatPeriod,
			selectionChangedHandler: (period) => (model.repeatPeriod = period),
			icon: BootIcons.Expand,
			disabled,
		} satisfies DropDownSelectorAttrs<RepeatPeriod | null>)
	}

	/** Repeat interval: every day, every second day etc
	 * @private
	 */
	private renderRepeatInterval({ model, disabled }: RepeatRuleEditorAttrs) {
		const intervalValues: SelectorItemList<number> = createIntervalValues()
		return m(DropDownSelector, {
			label: "interval_title",
			items: intervalValues,
			selectedValue: model.repeatInterval,
			selectionChangedHandler: (interval: number) => (model.repeatInterval = interval),
			icon: BootIcons.Expand,
			disabled,
		})
	}

	/**
	 * if and how the event stops repeating, like after number of occurrences or after a date.
	 * @param model
	 * @private
	 */
	private renderEndType({ model, disabled }: RepeatRuleEditorAttrs) {
		const endTypeValues: SelectorItemList<EndType> = createRepeatRuleEndTypeValues()
		return m(DropDownSelector, {
			label: () => lang.get("calendarRepeatStopCondition_label"),
			items: endTypeValues,
			selectedValue: model.repeatEndType,
			selectionChangedHandler: (end: EndType) => (model.repeatEndType = end),
			icon: BootIcons.Expand,
			disabled,
		})
	}

	/**
	 * the value of the end condition - a number for ending after number of occurrences, a date for ending after date.
	 * @private
	 */
	private renderEndValue(attrs: RepeatRuleEditorAttrs): Children {
		const { model, startOfTheWeekOffset, disabled } = attrs
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
				disabled,
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
				disabled,
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
