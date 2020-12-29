//@flow
import {px, size} from "../gui/size"
import stream from "mithril/stream/stream.js"
import {DatePicker} from "../gui/base/DatePicker"
import {Dialog} from "../gui/base/Dialog"
import type {CalendarInfo} from "./CalendarView"
import m from "mithril"
import {TextFieldN, Type as TextFieldType} from "../gui/base/TextFieldN"
import {lang} from "../misc/LanguageViewModel"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {Icons} from "../gui/base/icons/Icons"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {downcast, memoized, noOp} from "../api/common/utils/Utils"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import {AlarmInterval, CalendarAttendeeStatus, EndType, Keys, RepeatPeriod} from "../api/common/TutanotaConstants"
import {findAndRemove, numberRange, remove} from "../api/common/utils/ArrayUtils"
import {getCalendarName, getStartOfTheWeekOffsetForUser} from "./CalendarUtils"
import {TimePicker} from "../gui/base/TimePicker"
import {createRecipientInfo, getDisplayText} from "../mail/MailUtils"
import type {MailboxDetail} from "../mail/MailModel"
import {Bubble, BubbleTextField} from "../gui/base/BubbleTextField"
import {RecipientInfoBubbleHandler} from "../misc/RecipientInfoBubbleHandler"
import type {Contact} from "../api/entities/tutanota/Contact"
import {attachDropdown, createDropdown} from "../gui/base/DropdownN"
import {HtmlEditor} from "../gui/base/HtmlEditor"
import type {AllIconsEnum} from "../gui/base/Icon"
import {Icon} from "../gui/base/Icon"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {CheckboxN} from "../gui/base/CheckboxN"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {client} from "../misc/ClientDetector"
import type {Guest} from "./CalendarEventViewModel"
import {CalendarEventViewModel, createCalendarEventViewModel} from "./CalendarEventViewModel"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import {RecipientInfoType} from "../api/common/RecipientInfo"
import {PasswordIndicator} from "../gui/base/PasswordIndicator"
import {animations, height, opacity} from "../gui/animation/Animations"
import {UserError} from "../api/common/error/UserError"
import type {Mail} from "../api/entities/tutanota/Mail"
import {theme} from "../gui/theme"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import type {CalendarAttendeeStatusEnum} from "../api/common/TutanotaConstants"

export const iconForAttendeeStatus: {[CalendarAttendeeStatusEnum]: AllIconsEnum} = Object.freeze({
	[CalendarAttendeeStatus.ACCEPTED]: Icons.CircleCheckmark,
	[CalendarAttendeeStatus.TENTATIVE]: Icons.CircleHelp,
	[CalendarAttendeeStatus.DECLINED]: Icons.CircleReject,
	[CalendarAttendeeStatus.NEEDS_ACTION]: Icons.CircleEmpty,
	[CalendarAttendeeStatus.ADDED]: Icons.CircleEmpty,
})

const alarmIntervalItems = [
	{name: lang.get("comboBoxSelectionNone_msg"), value: null},
	{name: lang.get("calendarReminderIntervalFiveMinutes_label"), value: AlarmInterval.FIVE_MINUTES},
	{name: lang.get("calendarReminderIntervalTenMinutes_label"), value: AlarmInterval.TEN_MINUTES},
	{name: lang.get("calendarReminderIntervalThirtyMinutes_label"), value: AlarmInterval.THIRTY_MINUTES},
	{name: lang.get("calendarReminderIntervalOneHour_label"), value: AlarmInterval.ONE_HOUR},
	{name: lang.get("calendarReminderIntervalOneDay_label"), value: AlarmInterval.ONE_DAY},
	{name: lang.get("calendarReminderIntervalTwoDays_label"), value: AlarmInterval.TWO_DAYS},
	{name: lang.get("calendarReminderIntervalThreeDays_label"), value: AlarmInterval.THREE_DAYS},
	{name: lang.get("calendarReminderIntervalOneWeek_label"), value: AlarmInterval.ONE_WEEK}
]

export function showCalendarEventDialog(date: Date, calendars: Map<Id, CalendarInfo>, mailboxDetail: MailboxDetail,
                                        existingEvent: ?CalendarEvent, responseMail: ?Mail) {
	const viewModel = createCalendarEventViewModel(date, calendars, mailboxDetail, existingEvent, responseMail, false)
	const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser()
	const startDatePicker = new DatePicker(startOfTheWeekOffset, "dateFrom_label", "emptyString_msg", viewModel.isReadOnlyEvent())
	const endDatePicker = new DatePicker(startOfTheWeekOffset, "dateTo_label", "emptyString_msg", viewModel.isReadOnlyEvent())
	startDatePicker.setDate(viewModel.startDate)
	endDatePicker.setDate(viewModel.endDate)
	startDatePicker.date.map((date) => {
		viewModel.onStartDateSelected(date)
		if (endDatePicker.date() !== viewModel.endDate) {
			endDatePicker.setDate(viewModel.endDate)
		}
	})

	endDatePicker.date.map((date) => {
		viewModel.onEndDateSelected(date)
	})

	const repeatValues = createRepeatValues()
	const intervalValues = createIntevalValues()
	const endTypeValues = createEndTypeValues()
	const repeatEndDatePicker = new DatePicker(startOfTheWeekOffset, "emptyString_msg", "emptyString_msg")
	repeatEndDatePicker.date.map((date) => viewModel.onRepeatEndDateSelected(date))
	let finished = false


	const endOccurrencesStream = memoized(stream)

	function renderEndValue(): Children {
		if (viewModel.repeat == null || viewModel.repeat.endType === EndType.Never) {
			return null
		} else if (viewModel.repeat.endType === EndType.Count) {
			return m(DropDownSelectorN, {
				label: "emptyString_msg",
				items: intervalValues,
				selectedValue: endOccurrencesStream(viewModel.repeat.endValue),
				selectionChangedHandler: (endValue: number) => viewModel.onEndOccurencesSelected(endValue),
				icon: BootIcons.Expand,
			})
		} else if (viewModel.repeat.endType === EndType.UntilDate) {
			repeatEndDatePicker.setDate(new Date(viewModel.repeat.endValue))
			return m(repeatEndDatePicker)
		} else {
			return null
		}
	}

	const editorOptions = {enabled: false, alignmentEnabled: false, fontSizeEnabled: false}
	const descriptionEditor = new HtmlEditor("description_label", editorOptions, () => m(ButtonN, {
			label: "emptyString_msg",
			title: 'showRichTextToolbar_action',
			icon: () => Icons.FontSize,
			click: () => editorOptions.enabled = !editorOptions.enabled,
			isSelected: () => editorOptions.enabled,
			noBubble: true,
			type: ButtonType.Toggle,
			colors: ButtonColors.Elevated,
		})
	)
		.setMinHeight(400)
		.showBorders()
		.setEnabled(!viewModel.isReadOnlyEvent())
		// We only set it once, we don't viewModel on every change, that would be slow
		.setValue(viewModel.note)

	const okAction = () => {
		if (finished) {
			return
		}
		const description = descriptionEditor.getValue()
		if (description === "<div><br></div>") {
			viewModel.changeDescription("")
		} else {
			viewModel.changeDescription(description)
		}

		function askForUpdates() {
			return new Promise((resolve) => {
				let alertDialog: Dialog
				const cancelButton = {
					label: "cancel_action",
					click: () => {
						resolve("cancel")
						alertDialog.close()
					},
					type: ButtonType.Secondary
				}
				const noButton = {
					label: "no_label",
					click: () => {
						resolve("no")
						alertDialog.close()
					},
					type: ButtonType.Secondary
				}
				const yesButton = {
					label: "yes_label",
					click: () => {
						resolve("yes")
						alertDialog.close()
					},
					type: ButtonType.Primary,
				}

				const onclose = (positive) => positive
					? resolve("yes")
					: resolve("cancel")
				alertDialog = Dialog.confirmMultiple("sendUpdates_msg", [cancelButton, noButton, yesButton], onclose)
			})
		}

		function showProgress(p: Promise<mixed>) {
			// We get all errors in main promise, we don't need to handle them here
			return showProgressDialog("pleaseWait_msg", p).catch(noOp)
		}

		Promise.resolve().then(() => {
			return viewModel
				.saveAndSend({
					askForUpdates,
					showProgress,
					askInsecurePassword: () => Dialog.confirm("presharedPasswordNotStrongEnough_msg")
				})
				.then((shouldClose) => shouldClose && finish())
				.catch(UserError, (e) => Dialog.error(() => e.message))
		})
	}

	const attendeesField = makeBubbleTextField(viewModel)

	const attendeesExpanded = stream(viewModel.attendees().length > 0)

	const renderInvitationField = (): Children => viewModel.canModifyGuests()
		? m(attendeesField)
		: null

	function renderAttendees() {
		const ownAttendee = viewModel.findOwnAttendee()
		const guests = viewModel.attendees().slice()

		if (ownAttendee) {
			const indexOfOwn = guests.indexOf(ownAttendee)
			guests.splice(indexOfOwn, 1)
			guests.unshift(ownAttendee)
		}
		const externalGuests = viewModel.shouldShowPasswordFields()
			? guests.filter((a) => a.type === RecipientInfoType.EXTERNAL)
			        .map((guest) => {
				        return m(TextFieldN, {
					        value: stream(viewModel.getGuestPassword(guest)),
					        type: TextFieldType.ExternalPassword,
					        label: () => lang.get("passwordFor_label", {"{1}": guest.address.address}),
					        helpLabel: () => m(new PasswordIndicator(() => viewModel.getPasswordStrength(guest))),
					        oncreate: ({dom}) => animations.add(dom, height(0, dom.offsetHeight)),
					        onbeforeremove: ({dom}) => animations.add(dom, height(dom.offsetHeight, 0)),
					        key: guest.address.address,
					        oninput: (newValue) => viewModel.updatePassword(guest, newValue)
				        })
			        })
			: []
		return m("", [guests.map((guest, index) => renderGuest(guest, index, viewModel, ownAttendee)), externalGuests])
	}

	const renderDateTimePickers = () => renderTwoColumnsIfFits(
		[
			m(".flex-grow", m(startDatePicker)),
			!viewModel.allDay()
				? m(".ml-s.time-field", m(TimePicker, {
					value: viewModel.startTime,
					onselected: (time) => viewModel.onStartTimeSelected(time),
					amPmFormat: viewModel.amPmFormat,
					disabled: viewModel.isReadOnlyEvent()
				}))
				: null
		],
		[
			m(".flex-grow", m(endDatePicker)),
			!viewModel.allDay()
				? m(".ml-s.time-field", m(TimePicker, {
					value: viewModel.endTime,
					onselected: (time) => viewModel.onEndTimeSelected(time),
					amPmFormat: viewModel.amPmFormat,
					disabled: viewModel.isReadOnlyEvent()
				}))
				: null
		]
	)

	const renderLocationField = () => m(TextFieldN, {
		label: "location_label",
		value: viewModel.location,
		disabled: viewModel.isReadOnlyEvent(),
		injectionsRight: () => {
			let address = encodeURIComponent(viewModel.location())
			if (address === "") {
				return null;
			}
			return m(ButtonN, {
				label: 'showAddress_alt',
				icon: () => Icons.Pin,
				click: () => {
					window.open(`https://www.openstreetmap.org/search?query=${address}`, '_blank')
				}
			})
		}
	})

	function renderCalendarPicker() {
		const availableCalendars = viewModel.getAvailableCalendars()
		return m(".flex-half.pr-s", (availableCalendars.length)
			? m(DropDownSelectorN, ({
				label: "calendar_label",
				items: availableCalendars.map((calendarInfo) => {
					return {name: getCalendarName(calendarInfo.groupInfo, calendarInfo.shared), value: calendarInfo}
				}),
				selectedValue: viewModel.selectedCalendar,
				icon: BootIcons.Expand,
				disabled: viewModel.isReadOnlyEvent()
			}: DropDownSelectorAttrs<CalendarInfo>))
			: null
		)
	}

	// Avoid creating stream on each render. Will create new stream if the value is changed.
	// We could just change the value of the stream on each render but ultimately we should avoid
	// passing streams into components.
	const repeatFrequencyStream = memoized(stream)
	const repeatIntervalStream = memoized(stream)
	const endTypeStream = memoized(stream)

	function renderRepeatPeriod() {
		return m(DropDownSelectorN, {
			label: "calendarRepeating_label",
			items: repeatValues,
			selectedValue: repeatFrequencyStream(viewModel.repeat && viewModel.repeat.frequency || null),
			selectionChangedHandler: (period) => viewModel.onRepeatPeriodSelected(period),
			icon: BootIcons.Expand,
			disabled: viewModel.isReadOnlyEvent(),
		})
	}

	function renderRepeatInterval() {
		return m(DropDownSelectorN, {
			label: "interval_title",
			items: intervalValues,
			selectedValue: repeatIntervalStream(viewModel.repeat && viewModel.repeat.interval || 1),
			selectionChangedHandler: (period) => viewModel.onRepeatIntervalChanged(period),
			icon: BootIcons.Expand,
			disabled: viewModel.isReadOnlyEvent()
		})
	}

	function renderEndType(repeat) {
		return m(DropDownSelectorN, {
				label: () => lang.get("calendarRepeatStopCondition_label"),
				items: endTypeValues,
				selectedValue: endTypeStream(repeat.endType),
				selectionChangedHandler: (period) => viewModel.onRepeatEndTypeChanged(period),
				icon: BootIcons.Expand,
				disabled: viewModel.isReadOnlyEvent(),
			}
		)
	}

	const renderRepeatRulePicker = () => renderTwoColumnsIfFits([
			// Repeat type == Frequency: Never, daily, annually etc
			m(".flex-grow.pr-s", renderRepeatPeriod()),
			// Repeat interval: every day, every second day etc
			m(".flex-grow.pl-s"
				+ (viewModel.repeat ? "" : ".hidden"), renderRepeatInterval()),
		],
		viewModel.repeat
			? [
				m(".flex-grow.pr-s", renderEndType(viewModel.repeat)),
				m(".flex-grow.pl-s", renderEndValue()),
			]
			: null
	)

	function renderChangesMessage() {
		return viewModel.isInvite()
			? m(".mt.mb-s", lang.get("eventCopy_msg"))
			: null
	}

	viewModel.sendingOutUpdate.map(m.redraw)

	function renderDialogContent() {

		return m(".calendar-edit-container.pb", [
			renderHeading(),
			renderChangesMessage(),
			m(".mb", m(ExpanderPanelN, {
					expanded: attendeesExpanded,
				},
				[
					m(".flex-grow", renderInvitationField()),
					m(".flex-grow", renderAttendees())
				],
			)),
			renderDateTimePickers(),
			m(".flex.items-center.mt-s", [
				m(CheckboxN, {
					checked: viewModel.allDay,
					disabled: viewModel.isReadOnlyEvent(),
					label: () => lang.get("allDay_label")
				}),
				m(".flex-grow"),
			]),
			renderRepeatRulePicker(),
				m(".flex", [
					renderCalendarPicker(),
					viewModel.canModifyAlarms()
						? m(".flex.col.flex-half.pl-s",
						[
							viewModel.alarms.map((a) => m(DropDownSelectorN, {
								label: "reminderBeforeEvent_label",
								items: alarmIntervalItems,
								selectedValue: stream(downcast(a.trigger)),
								icon: BootIcons.Expand,
								selectionChangedHandler: (value) => viewModel.changeAlarm(a.alarmIdentifier, value),
								key: a.alarmIdentifier
							})),
							m(DropDownSelectorN, {
								label: "reminderBeforeEvent_label",
								items: alarmIntervalItems,
								selectedValue: stream(null),
								icon: BootIcons.Expand,
								selectionChangedHandler: (value) => value && viewModel.addAlarm(value)
							})
						])
						: m(".flex.flex-half.pl-s"),
				]),
				renderLocationField(),
				m(descriptionEditor),
			]
		)
	}

	function finish() {
		finished = true
		viewModel.dispose()
		dialog.close()
	}

	function renderHeading() {
		return m(TextFieldN, {
			label: "title_placeholder",
			value: viewModel.summary,
			disabled: viewModel.isReadOnlyEvent(),
			class: "big-input pt flex-grow",
			injectionsRight: () => m(".mr-s", m(ExpanderButtonN, {
				label: "guests_label",
				expanded: attendeesExpanded,
				style: {paddingTop: 0},
			}))
		})
	}

	viewModel.attendees.map(m.redraw)

	const dialog = Dialog.largeDialog(
		{
			left: [{label: "cancel_action", click: finish, type: ButtonType.Secondary}],
			right: [{label: "save_action", click: () => okAction(), type: ButtonType.Primary}],
			middle: () => lang.get("createEvent_label"),
		},
		{view: () => m(".calendar-edit-container.pb", renderDialogContent())}
	).addShortcut({
		key: Keys.ESC,
		exec: finish,
		help: "close_alt"
	}).addShortcut({
		key: Keys.S,
		ctrl: true,
		exec: () => okAction(),
		help: "save_action"
	})
	if (client.isMobileDevice()) {
		// Prevent focusing text field automatically on mobile. It opens keyboard and you don't see all details.
		dialog.setFocusOnLoadFunction(noOp)
	}
	dialog.show()
}


function renderStatusIcon(viewModel: CalendarEventViewModel, attendee: Guest): Children {
	const icon = iconForAttendeeStatus[attendee.status]

	return m(Icon, {icon, class: "mr-s", style: {fill: theme.content_fg}})
}


function createRepeatValues() {
	return [
		{name: lang.get("calendarRepeatIntervalNoRepeat_label"), value: null},
		{name: lang.get("calendarRepeatIntervalDaily_label"), value: RepeatPeriod.DAILY},
		{name: lang.get("calendarRepeatIntervalWeekly_label"), value: RepeatPeriod.WEEKLY},
		{name: lang.get("calendarRepeatIntervalMonthly_label"), value: RepeatPeriod.MONTHLY},
		{name: lang.get("calendarRepeatIntervalAnnually_label"), value: RepeatPeriod.ANNUALLY}
	]
}

function createIntevalValues() {
	return numberRange(1, 256).map(n => {
		return {name: String(n), value: n}
	})
}

function createEndTypeValues() {
	return [
		{name: lang.get("calendarRepeatStopConditionNever_label"), value: EndType.Never},
		{name: lang.get("calendarRepeatStopConditionOccurrences_label"), value: EndType.Count},
		{name: lang.get("calendarRepeatStopConditionDate_label"), value: EndType.UntilDate}
	]
}

function makeBubbleTextField(viewModel: CalendarEventViewModel): BubbleTextField<RecipientInfo> {
	function createBubbleContextButtons(name: string, mailAddress: string): Array<ButtonAttrs | string> {
		let buttonAttrs = [mailAddress]
		buttonAttrs.push({
			label: "remove_action",
			click: () => {
				findAndRemove(invitePeopleValueTextField.bubbles, (bubble) => bubble.entity.mailAddress === mailAddress)
			},
		})
		return buttonAttrs
	}

	const bubbleHandler = new RecipientInfoBubbleHandler({
		createBubble(name: ?string, mailAddress: string, contact: ?Contact): Bubble<RecipientInfo> {
			const recipientInfo = createRecipientInfo(mailAddress, name, contact)
			const buttonAttrs = attachDropdown({
				label: () => getDisplayText(recipientInfo.name, mailAddress, false),
				type: ButtonType.TextBubble,
				isSelected: () => false,
			}, () => createBubbleContextButtons(recipientInfo.name, mailAddress))
			const bubble = new Bubble(recipientInfo, buttonAttrs, mailAddress)
			// remove bubble after it was created - we don't need it for calendar invites because the attendees are shown in a seperate list.
			Promise.resolve().then(() => {
				if (viewModel.shouldShowInviteUnavailble()) {
					showNotAvailableForFreeDialog(true)
				} else {
					viewModel.addGuest(bubble.entity.mailAddress, bubble.entity.contact)
				}
				remove(invitePeopleValueTextField.bubbles, bubble)
			})
			return bubble
		},

	})

	const invitePeopleValueTextField = new BubbleTextField("addGuest_label", bubbleHandler, {marginLeft: 0})
	invitePeopleValueTextField.textField._injectionsRight = () => renderConfidentialButton(viewModel)
	return invitePeopleValueTextField
}

function renderTwoColumnsIfFits(left: Children, right: Children): Children {
	if (client.isMobileDevice()) {
		return m(".flex.col", [
			m(".flex", left),
			m(".flex", right),
		])
	} else {
		return m(".flex", [
			m(".flex.flex-half.pr-s", left),
			m(".flex.flex-half.pl-s", right),
		])
	}
}


function showOrganizerDropdown(viewModel: CalendarEventViewModel, e: MouseEvent) {
	const makeButtons = () => viewModel.possibleOrganizers.map((organizer) => {
		return {
			label: () => organizer.address,
			type: ButtonType.Dropdown,
			click: () => viewModel.setOrganizer(organizer),
		}
	})
	createDropdown(makeButtons, 300)(e, (e.target: any))
}

function renderGuest(guest: Guest, index: number, viewModel: CalendarEventViewModel, ownAttendee: ?Guest): Children {
	const {organizer} = viewModel
	const isOrganizer = organizer && guest.address.address === organizer.address
	const editableOrganizer = isOrganizer && viewModel.canModifyOrganizer()
	const attendingItems = [
		{name: lang.get("yes_label"), value: CalendarAttendeeStatus.ACCEPTED},
		{name: lang.get("maybe_label"), value: CalendarAttendeeStatus.TENTATIVE},
		{name: lang.get("no_label"), value: CalendarAttendeeStatus.DECLINED},
		{name: lang.get("pending_label"), value: CalendarAttendeeStatus.NEEDS_ACTION, selectable: false}
	]
	return m(".flex", {
		style: {
			height: px(size.button_height),
			borderBottom: "1px transparent",
			marginTop: index === 0 && !viewModel.canModifyGuests() ? 0 : px(size.vpad),
		},
	}, [
		m(".flex.col.flex-grow.overflow-hidden.flex-no-grow-shrink-auto", [
			m(".flex.flex-grow.items-center" + (editableOrganizer ? ".click" : ""),
				editableOrganizer
					? {
						onclick: (e) => showOrganizerDropdown(viewModel, e)
					}
					: {},
				[
					m("div.text-ellipsis", {style: {lineHeight: px(24)}},
						guest.address.name ? `${guest.address.name} ${guest.address.address}` : guest.address.address
					),
					editableOrganizer ? m(Icon, {icon: BootIcons.Expand, style: {fill: theme.content_fg}}) : null,
				]
			),
			m(".small.flex.center-vertically", [
				renderStatusIcon(viewModel, guest),
				lang.get(isOrganizer ? "organizer_label" : "guest_label") + (guest === ownAttendee ? ` | ${lang.get("you_label")}` : "")
			]),
		]),
		m(".flex-grow"),
		[
			ownAttendee === guest && viewModel.canModifyOwnAttendance()
				? m("", {style: {minWidth: "120px"}}, m(DropDownSelectorN, {
					label: "attending_label",
					items: attendingItems,
					selectedValue: stream(guest.status),
					class: "",
					selectionChangedHandler: (value) => {
						if (value == null) return
						if (viewModel.shouldShowInviteUnavailble()) {
							showNotAvailableForFreeDialog(true)
						} else {
							viewModel.selectGoing(value)
						}
					},
				}))
				: viewModel.canModifyGuests()
				? m(".mr-negative-s", m(ButtonN, {
					label: "remove_action",
					type: ButtonType.Action,
					icon: () => Icons.Cancel,
					click: () => viewModel.removeAttendee(guest)
				}))
				: null,
		]
	])
}

function renderConfidentialButton(viewModel: CalendarEventViewModel) {
	return viewModel.attendees().find(a => a.type === RecipientInfoType.EXTERNAL)
		? m(ButtonN, {
				label: "confidential_action",
				click: () => viewModel.setConfidential(!viewModel.isConfidential()),
				icon: () => viewModel.isConfidential() ? Icons.Lock : Icons.Unlock,
				isSelected: () => viewModel.isConfidential(),
				noBubble: true,
			}
		)
		: null
}