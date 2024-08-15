import m, { Children, Component, Vnode } from "mithril"
import { ExpanderButton, ExpanderPanel } from "../../../../common/gui/base/Expander.js"
import { AttendeeListEditor, AttendeeListEditorAttrs } from "./AttendeeListEditor.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { EventTimeEditor, EventTimeEditorAttrs } from "./EventTimeEditor.js"
import { RepeatRuleEditor, RepeatRuleEditorAttrs } from "./RepeatRuleEditor.js"
import { TextField, TextFieldAttrs } from "../../../../common/gui/base/TextField.js"
import { defaultCalendarColor, TimeFormat } from "../../../../common/api/common/TutanotaConstants.js"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { RecipientsSearchModel } from "../../../../common/misc/RecipientsSearchModel.js"
import { DropDownSelector, DropDownSelectorAttrs } from "../../../../common/gui/base/DropDownSelector.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import { AlarmInterval } from "../../../../common/calendar/date/CalendarUtils.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { HtmlEditor } from "../../../../common/gui/editor/HtmlEditor.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../../common/gui/base/InfoBanner.js"
import { CalendarEventModel, CalendarOperation, ReadonlyReason } from "../eventeditor-model/CalendarEventModel.js"

import { getSharedGroupName } from "../../../../common/sharing/GroupUtils.js"

import { createAlarmIntervalItems, createCustomRepeatRuleUnitValues, humanDescriptionForAlarmInterval, renderCalendarColor } from "../CalendarGuiUtils.js"
import { RemindersEditor, RemindersEditorAttrs } from "../RemindersEditor.js"

export type CalendarEventEditViewAttrs = {
	model: CalendarEventModel
	groupColors: Map<Id, string>
	recipientsSearch: RecipientsSearchModel
	descriptionEditor: HtmlEditor
	startOfTheWeekOffset: number
	timeFormat: TimeFormat
	defaultAlarms: Map<Id, AlarmInterval[]>
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
	private readonly defaultAlarms: Map<Id, AlarmInterval[]>

	constructor(vnode: Vnode<CalendarEventEditViewAttrs>) {
		this.timeFormat = vnode.attrs.timeFormat
		this.startOfTheWeekOffset = vnode.attrs.startOfTheWeekOffset
		this.attendeesExpanded = vnode.attrs.model.editModels.whoModel.canModifyGuests && vnode.attrs.model.editModels.whoModel.guests.length > 0
		this.recipientsSearch = vnode.attrs.recipientsSearch
		this.defaultAlarms = vnode.attrs.defaultAlarms

		if (vnode.attrs.model.operation == CalendarOperation.Create) {
			const initialAlarms = vnode.attrs.defaultAlarms.get(vnode.attrs.model.editModels.whoModel.selectedCalendar.group._id) ?? []
			vnode.attrs.model.editModels.alarmModel.addAll(initialAlarms)
		}
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
					message: () => m(".small.selectable", lang.get(message)),
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
			case ReadonlyReason.NOT_ORGANIZER:
				return makeMessage("cannotEditNotOrganizer_msg")
			case ReadonlyReason.UNKNOWN:
				return makeMessage("cannotEditEvent_msg")
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
		return m(RepeatRuleEditor, {
			model: model.editModels.whenModel,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			disabled: !model.canEditSeries(),
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
				selectionChangedHandler: (selectedCalendar) => {
					model.editModels.alarmModel.removeAll()
					model.editModels.alarmModel.addAll(this.defaultAlarms.get(selectedCalendar.group._id) ?? [])

					model.editModels.whoModel.selectedCalendar = selectedCalendar
				},
				icon: BootIcons.Expand,
				disabled: !model.canChangeCalendar() || availableCalendars.length < 2,
				helpLabel: () => renderCalendarColor(model.editModels.whoModel.selectedCalendar, vnode.attrs.groupColors),
			} satisfies DropDownSelectorAttrs<CalendarInfo>),
		)
	}

	private renderRemindersEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		if (!vnode.attrs.model.editModels.alarmModel.canEditReminders) return null
		const { alarmModel } = vnode.attrs.model.editModels

		return m(RemindersEditor, {
			alarms: alarmModel.alarms,
			addAlarm: alarmModel.addAlarm.bind(alarmModel),
			removeAlarm: alarmModel.removeAlarm.bind(alarmModel),
			label: "reminderBeforeEvent_label",
		} satisfies RemindersEditorAttrs)
	}

	private renderLocationField(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model } = vnode.attrs
		return m(TextField, {
			label: "location_label",
			value: model.editModels.location.content,
			oninput: (v) => (model.editModels.location.content = v),
			disabled: !model.isFullyWritable(),
			class: "pt-s", // override default pt with pt-s because calendar color indicator takes up some space
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
		vnode.attrs.descriptionEditor.setReadOnly(!model.isFullyWritable())
		return m(vnode.attrs.descriptionEditor)
	}
}
