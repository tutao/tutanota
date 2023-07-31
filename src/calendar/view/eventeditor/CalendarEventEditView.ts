import m, { Children, Component, Vnode } from "mithril"
import { ExpanderButton, ExpanderPanel } from "../../../gui/base/Expander.js"
import { AttendeeListEditor, AttendeeListEditorAttrs } from "./AttendeeListEditor.js"
import { locator } from "../../../api/main/MainLocator.js"
import { EventTimeEditor, EventTimeEditorAttrs } from "./EventTimeEditor.js"
import { RepeatRuleEditor, RepeatRuleEditorAttrs } from "./RepeatRuleEditor.js"
import { TextField, TextFieldAttrs } from "../../../gui/base/TextField.js"
import { defaultCalendarColor, TimeFormat } from "../../../api/common/TutanotaConstants.js"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel.js"
import { RecipientsSearchModel } from "../../../misc/RecipientsSearchModel.js"
import { DropDownSelector, DropDownSelectorAttrs } from "../../../gui/base/DropDownSelector.js"
import { getSharedGroupName } from "../../../sharing/GroupUtils.js"
import { BootIcons } from "../../../gui/base/icons/BootIcons.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import { createAlarmIntervalItems } from "../../date/CalendarUtils.js"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { IconButton } from "../../../gui/base/IconButton.js"
import { ButtonSize } from "../../../gui/base/ButtonSize.js"
import { HtmlEditor } from "../../../gui/editor/HtmlEditor.js"
import { attachDropdown } from "../../../gui/base/Dropdown.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../gui/base/InfoBanner.js"
import { CalendarEventModel, ReadonlyReason } from "../../date/eventeditor/CalendarEventModel.js"

export type CalendarEventEditViewAttrs = {
	model: CalendarEventModel
	groupColors: Map<Id, string>
	recipientsSearch: RecipientsSearchModel
	descriptionEditor: HtmlEditor
	startOfTheWeekOffset: number
	timeFormat: TimeFormat
}

/**
 * combines several semi-related editor components into a full editor for editing calendar events
 * to be displayed in a dialog.
 *
 * controls the enabling/disabling of certain editor components and the display of additional info
 * in the dialog depending on the type of the event being edited.
 */
export class CalendarEventEditView implements Component<CalendarEventEditViewAttrs> {
	private attendeesExpanded: boolean = false

	private readonly recipientsSearch: RecipientsSearchModel
	private readonly timeFormat: TimeFormat
	private readonly startOfTheWeekOffset: number

	constructor(vnode: Vnode<CalendarEventEditViewAttrs>) {
		this.timeFormat = vnode.attrs.timeFormat
		this.startOfTheWeekOffset = vnode.attrs.startOfTheWeekOffset
		this.attendeesExpanded = vnode.attrs.model.editModels.whoModel.canModifyGuests && vnode.attrs.model.editModels.whoModel.guests.length > 0
		this.recipientsSearch = vnode.attrs.recipientsSearch
	}

	view(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		return m(
			".pb",
			{
				style: {
					// The date picker dialogs have position: fixed, and they are fixed relative to the most recent ancestor with
					// a transform. So doing a no-op transform will make the dropdowns scroll with the dialog
					// without this, then the date picker dialogs will show at the same place on the screen regardless of whether the
					// editor has scrolled or not.
					// Ideally we could do this inside DatePicker itself, but the rendering breaks and the dialog appears below it's siblings
					// We also don't want to do this for all dialogs because it could potentially cause other issues
					transform: "translate(0)",
				},
			},
			[
				this.renderReadonlyMessage(vnode.attrs),
				this.renderHeading(vnode.attrs),
				this.renderAttendees(vnode.attrs),
				this.renderEventTimeEditor(vnode.attrs),
				this.renderRepeatRuleEditor(vnode.attrs),
				m(".flex", [this.renderCalendarPicker(vnode), this.renderRemindersEditor(vnode)]),
				this.renderLocationField(vnode),
				this.renderDescriptionEditor(vnode),
			],
		)
	}

	private renderHeading(attrs: CalendarEventEditViewAttrs): Children {
		const { model } = attrs
		return m(TextField, {
			label: "title_placeholder",
			value: model.editModels.summary.content,
			oninput: (v) => (model.editModels.summary.content = v),
			disabled: !model.isFullyWritable(),
			class: "big-input pt flex-grow",
			injectionsRight: () => this.renderGuestsExpanderButton(attrs),
		} satisfies TextFieldAttrs)
	}

	private renderGuestsExpanderButton(attrs: CalendarEventEditViewAttrs): Children {
		if (!attrs.model.editModels.whoModel.canModifyGuests && attrs.model.editModels.whoModel.guests.length === 0) return null
		return m(
			".mr-s",
			m(ExpanderButton, {
				label: "guests_label",
				expanded: this.attendeesExpanded,
				onExpandedChange: (v) => (this.attendeesExpanded = v),
				style: {
					paddingTop: 0,
				},
			}),
		)
	}

	private renderReadonlyMessage(attrs: CalendarEventEditViewAttrs): Children {
		const { model } = attrs
		const makeMessage = (message: TranslationKey): Children =>
			m(
				".pt-s",
				m(InfoBanner, {
					message: () => m(".small", lang.get(message)),
					icon: Icons.People,
					type: BannerType.Info,
					buttons: [],
				} satisfies InfoBannerAttrs),
			)

		switch (model.getReadonlyReason()) {
			case ReadonlyReason.SHARED:
				return makeMessage("cannotEditFullEvent_msg")
			case ReadonlyReason.SINGLE_INSTANCE:
				return makeMessage("cannotEditSingleInstance_msg")
			case ReadonlyReason.NONE:
				return null
		}
	}

	private renderAttendees(attrs: CalendarEventEditViewAttrs): Children {
		const { model } = attrs
		return m(
			".mb.rel",
			m(
				ExpanderPanel,
				{ expanded: this.attendeesExpanded },
				m(AttendeeListEditor, {
					model,
					recipientsSearch: this.recipientsSearch,
					logins: locator.logins,
				} satisfies AttendeeListEditorAttrs),
			),
		)
	}

	private renderEventTimeEditor(attrs: CalendarEventEditViewAttrs): Children {
		return m(EventTimeEditor, {
			editModel: attrs.model.editModels.whenModel,
			timeFormat: this.timeFormat,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			disabled: !attrs.model.isFullyWritable(),
		} satisfies EventTimeEditorAttrs)
	}

	private renderRepeatRuleEditor({ model }: CalendarEventEditViewAttrs): Children {
		if (!model.canEditSeries()) return null
		return m(RepeatRuleEditor, {
			model: model.editModels.whenModel,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
		} satisfies RepeatRuleEditorAttrs)
	}

	private renderCalendarPicker(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model } = vnode.attrs
		const availableCalendars = model.editModels.whoModel.getAvailableCalendars()
		return m(
			".flex-half.pr-s",
			m(DropDownSelector, {
				label: "calendar_label",
				items: availableCalendars.map((calendarInfo) => {
					return {
						name: getSharedGroupName(calendarInfo.groupInfo, model.userController, calendarInfo.shared),
						value: calendarInfo,
					}
				}),
				selectedValue: model.editModels.whoModel.selectedCalendar,
				selectionChangedHandler: (v) => (model.editModels.whoModel.selectedCalendar = v),
				icon: BootIcons.Expand,
				disabled: !model.canEditSeries() || availableCalendars.length < 2,
				helpLabel: () => this.renderCalendarColor(model.editModels.whoModel.selectedCalendar, vnode.attrs.groupColors),
			} satisfies DropDownSelectorAttrs<CalendarInfo>),
		)
	}

	private renderCalendarColor(selectedCalendar: CalendarInfo | null, groupColors: Map<Id, string>) {
		const color = selectedCalendar ? groupColors.get(selectedCalendar.groupInfo.group) ?? defaultCalendarColor : null
		return m(".mt-xs", {
			style: {
				width: "100px",
				height: "10px",
				background: color ? "#" + color : "transparent",
			},
		})
	}

	private renderRemindersEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		if (!vnode.attrs.model.editModels.alarmModel.canEditReminders) return null
		const { alarmModel } = vnode.attrs.model.editModels
		const { taken, available } = alarmModel.splitTriggers(createAlarmIntervalItems(), (i) => i.value)
		const textFieldAttrs: Array<TextFieldAttrs> = taken.map((a) => ({
			value: a.name,
			label: "emptyString_msg",
			disabled: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "delete_action",
					icon: Icons.Cancel,
					click: () => alarmModel.removeAlarm(a.value),
				}),
		}))

		if (available.length > 0) {
			textFieldAttrs.push({
				value: lang.get("add_action"),
				label: "emptyString_msg",
				disabled: true,
				injectionsRight: () =>
					m(
						IconButton,
						attachDropdown({
							mainButtonAttrs: {
								title: "add_action",
								icon: Icons.Add,
							},
							childAttrs: () =>
								available.map((i) => ({
									label: () => i.name,
									click: () => alarmModel.addAlarm(i.value),
								})),
						}),
					),
			})
		}

		textFieldAttrs[0].label = "reminderBeforeEvent_label"

		return m(
			".flex.col.flex-half.pl-s",
			textFieldAttrs.map((a) => m(TextField, a)),
		)
	}

	private renderLocationField(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model } = vnode.attrs
		return m(TextField, {
			label: "location_label",
			value: model.editModels.location.content,
			oninput: (v) => (model.editModels.location.content = v),
			disabled: !model.isFullyWritable(),
			class: "text pt-s", // override default pt with pt-s because calendar color indicator takes up some space
			injectionsRight: () => {
				let address = encodeURIComponent(model.editModels.location.content)

				if (address === "") {
					return null
				}

				return m(IconButton, {
					title: "showAddress_alt",
					icon: Icons.Pin,
					size: ButtonSize.Compact,
					click: () => {
						window.open(`https://www.openstreetmap.org/search?query=${address}`, "_blank")
					},
				})
			},
		})
	}

	private renderDescriptionEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model } = vnode.attrs
		vnode.attrs.descriptionEditor.setEnabled(model.isFullyWritable())
		return m(vnode.attrs.descriptionEditor)
	}
}
