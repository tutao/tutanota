import m, { Children, Component, Vnode } from "mithril"
import { ExpanderButton, ExpanderPanel } from "../../../../common/gui/base/Expander.js"
import { AttendeeListEditor, AttendeeListEditorAttrs } from "./AttendeeListEditor.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { EventTimeEditor, EventTimeEditorAttrs } from "./EventTimeEditor.js"
import { RepeatRuleEditor, RepeatRuleEditorAttrs } from "./RepeatRuleEditor.js"
import { defaultCalendarColor, TimeFormat } from "../../../../common/api/common/TutanotaConstants.js"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { RecipientsSearchModel } from "../../../../common/misc/RecipientsSearchModel.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import { AlarmInterval } from "../../../../common/calendar/date/CalendarUtils.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { HtmlEditor } from "../../../../common/gui/editor/HtmlEditor.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../../common/gui/base/InfoBanner.js"
import { CalendarEventModel, CalendarOperation, ReadonlyReason } from "../eventeditor-model/CalendarEventModel.js"
import { getSharedGroupName } from "../../../../common/sharing/GroupUtils.js"
import { RemindersEditor, RemindersEditorAttrs } from "../RemindersEditor.js"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "../../../../common/gui/base/SingleLineTextField.js"
import { px, size } from "../../../../common/gui/size.js"
import { Card } from "../../../../common/gui/base/Card.js"
import { Select, SelectAttributes, SelectOption } from "../../../../common/gui/base/Select.js"
import { Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { theme } from "../../../../common/gui/theme.js"

export type CalendarEventEditViewAttrs = {
	model: CalendarEventModel
	groupColors: Map<Id, string>
	recipientsSearch: RecipientsSearchModel
	descriptionEditor: HtmlEditor
	startOfTheWeekOffset: number
	timeFormat: TimeFormat
	defaultAlarms: Map<Id, AlarmInterval[]>
}

export interface CalendarSelectItem extends SelectOption<CalendarInfo> {
	color: string
	name: string
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
	private addressURI: string = ""

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
			".pb.pt-s.flex.col.gap-vpad",
			{
				style: {
					// The date picker dialogs have position: fixed, and they are fixed relative to the most recent ancestor with
					// a transform. So doing a no-op transform will make the dropdowns scroll with the dialog
					// without this, then the date picker dialogs will show at the same place on the screen regardless of whether the
					// editor has scrolled or not.
					// Ideally we could do this inside DatePicker itself, but the rendering breaks and the dialog appears below it's siblings
					// We also don't want to do this for all dialogs because it could potentially cause other issues
					transform: "translate(0)",
					color: theme.button_bubble_fg,
				},
			},
			[
				this.renderReadonlyMessage(vnode.attrs),
				this.renderTitle(vnode.attrs),
				// this.renderAttendees(vnode.attrs), // FIXME Depends on new design
				this.renderEventTimeEditor(vnode.attrs),
				// this.renderRepeatRuleEditor(vnode.attrs), // FIXME Depends on new design
				this.renderCalendarPicker(vnode),
				this.renderRemindersEditor(vnode),
				this.renderLocationField(vnode),
				this.renderDescriptionEditor(vnode),
			],
		)
	}

	private renderTitle(attrs: CalendarEventEditViewAttrs): Children {
		const { model } = attrs
		return m(
			Card,
			{
				style: {
					padding: "0",
				},
			},
			m(SingleLineTextField, {
				value: model.editModels.summary.content,
				oninput: (newValue: string) => {
					model.editModels.summary.content = newValue
				},
				placeholder: lang.get("title_placeholder"),
				disabled: !model.isFullyWritable(),
				style: {
					fontSize: px(size.font_size_base * 1.25), // Overriding the component style
				},
			} satisfies SingleLineTextFieldAttrs),
		)
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
			m(InfoBanner, {
				message: () => m(".small.selectable", lang.get(message)),
				icon: Icons.People,
				type: BannerType.Info,
				buttons: [],
			} satisfies InfoBannerAttrs)

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
		return m(
			Card, // FIXME Depends on outline button
			m(EventTimeEditor, {
				editModel: attrs.model.editModels.whenModel,
				timeFormat: this.timeFormat,
				startOfTheWeekOffset: this.startOfTheWeekOffset,
				disabled: !attrs.model.isFullyWritable(),
			} satisfies EventTimeEditorAttrs),
		)
	}

	private renderRepeatRuleEditor({ model }: CalendarEventEditViewAttrs): Children {
		return m(
			Card,
			m(RepeatRuleEditor, {
				model: model.editModels.whenModel,
				startOfTheWeekOffset: this.startOfTheWeekOffset,
				disabled: !model.canEditSeries(),
			} satisfies RepeatRuleEditorAttrs),
		)
	}

	private renderCalendarPicker(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model, groupColors } = vnode.attrs
		const availableCalendars = model.editModels.whoModel.getAvailableCalendars()

		const options: CalendarSelectItem[] = availableCalendars.map((calendarInfo) => {
			console.log(calendarInfo, { color: groupColors.get(calendarInfo.group._id) ?? defaultCalendarColor })
			const name = getSharedGroupName(calendarInfo.groupInfo, model.userController, calendarInfo.shared)
			return {
				name,
				color: "#" + (groupColors.get(calendarInfo.group._id) ?? defaultCalendarColor),
				value: calendarInfo,
				ariaValue: name,
			}
		})

		const selectedCalendarInfo = model.editModels.whoModel.selectedCalendar
		const selectedCalendarName = getSharedGroupName(selectedCalendarInfo.groupInfo, model.userController, selectedCalendarInfo.shared)
		let selected: CalendarSelectItem = {
			name: selectedCalendarName,
			color: "#" + (groupColors.get(selectedCalendarInfo.group._id) ?? defaultCalendarColor),
			value: model.editModels.whoModel.selectedCalendar,
			ariaValue: selectedCalendarName,
		}
		return m(
			Card,
			m(Select<CalendarSelectItem, CalendarInfo>, {
				onChange: (val) => {
					model.editModels.alarmModel.removeAll()
					model.editModels.alarmModel.addAll(this.defaultAlarms.get(val.value.group._id) ?? [])
					model.editModels.whoModel.selectedCalendar = val.value
				},
				options,
				expanded: true,
				selected,
				renderOption: (option: CalendarSelectItem) => {
					console.log("Render:", option)
					return m(".flex.items-center.gap-vpad-sm.full-width", [
						m("div", { style: { width: "20px", height: "20px", borderRadius: "50%", backgroundColor: option.color } }),
						m("span", option.name),
					])
				},
				ariaLabel: lang.get("calendar_label"),
				disabled: !model.canChangeCalendar() || availableCalendars.length < 2,
			} satisfies SelectAttributes<CalendarSelectItem, CalendarInfo>),
		)
	}

	private renderRemindersEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		if (!vnode.attrs.model.editModels.alarmModel.canEditReminders) return null
		const { alarmModel } = vnode.attrs.model.editModels

		return m(
			Card,
			m(".flex.gap-vpad-small", [
				m(
					"label.cursor-pointer",
					{ for: "reminders" },
					m(".flex.items-center", { color: theme.content_fg }, [
						m(Icon, {
							icon: Icons.Notifications,
							class: "mr-s",
							style: {
								fill: theme.content_fg,
							},
							title: lang.get("reminderBeforeEvent_label"),
							size: IconSize.Medium,
						}),
						"Reminders",
					]),
				),
				m(RemindersEditor, {
					alarms: alarmModel.alarms,
					addAlarm: alarmModel.addAlarm.bind(alarmModel),
					removeAlarm: alarmModel.removeAlarm.bind(alarmModel),
					label: "reminderBeforeEvent_label",
				} satisfies RemindersEditorAttrs),
			]),
		)
	}

	private renderLocationField(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model } = vnode.attrs
		return m(
			Card,
			{
				style: { padding: `0 ${this.addressURI ? px(size.vpad_small) : 0} 0 0` },
			},
			m(
				".flex.gap-vpad-sm.items-center",
				m(SingleLineTextField, {
					value: model.editModels.location.content,
					oninput: (newValue) => {
						model.editModels.location.content = newValue
						this.addressURI = encodeURIComponent(model.editModels.location.content)
					},
					placeholder: lang.get("location_label"),
					disabled: !model.isFullyWritable(),
				}),
				this.addressURI
					? m(IconButton, {
							title: "showAddress_alt",
							icon: Icons.Pin,
							size: ButtonSize.Compact,
							click: () => {
								window.open(`https://www.openstreetmap.org/search?query=${this.addressURI}`, "_blank")
							},
					  })
					: null,
			),
		)
	}

	private renderDescriptionEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		return m(
			Card,
			{
				classes: ["child-text-editor", "rel"],
				style: {
					padding: "0",
				},
			},
			[
				vnode.attrs.descriptionEditor.isEmpty() && !vnode.attrs.descriptionEditor.isActive()
					? m("span.text-editor-placeholder", lang.get("description_label"))
					: null,
				m(vnode.attrs.descriptionEditor),
			],
		)
	}
}
