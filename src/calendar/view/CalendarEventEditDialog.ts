import { px, size } from "../../gui/size"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { DatePicker } from "../../gui/date/DatePicker"
import { Dialog } from "../../gui/base/Dialog"
import m, { Children } from "mithril"
import { Autocomplete, TextField, TextFieldType as TextFieldType } from "../../gui/base/TextField.js"
import { lang } from "../../misc/LanguageViewModel"
import type { DropDownSelectorAttrs, SelectorItemList } from "../../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonType } from "../../gui/base/Button.js"
import { AlarmInterval, CalendarAttendeeStatus, defaultCalendarColor, EndType, Keys, RepeatPeriod } from "../../api/common/TutanotaConstants"
import { createRepeatRuleEndTypeValues, createRepeatRuleFrequencyValues, getStartOfTheWeekOffsetForUser } from "../date/CalendarUtils"
import { AllIcons, Icon } from "../../gui/base/Icon"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { Checkbox } from "../../gui/base/Checkbox.js"
import { ExpanderButton, ExpanderPanel } from "../../gui/base/Expander"
import { client } from "../../misc/ClientDetector"
import type { Guest, RepeatData } from "../date/CalendarEventViewModel"
import { CalendarEventViewModel } from "../date/CalendarEventViewModel"
import { UserError } from "../../api/main/UserError"
import { theme } from "../../gui/theme"
import { showBusinessFeatureRequiredDialog } from "../../misc/SubscriptionDialogs"
import { BusinessFeatureRequiredError } from "../../api/main/BusinessFeatureRequiredError"
import type { MailboxDetail } from "../../mail/model/MailModel"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { CompletenessIndicator } from "../../gui/CompletenessIndicator.js"
import { TimePicker } from "../../gui/TimePicker"
import { getSharedGroupName } from "../../sharing/GroupUtils"
import type { DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar"
import { askIfShouldSendCalendarUpdatesToAttendees } from "./CalendarGuiUtils"
import type { CalendarInfo } from "../model/CalendarModel"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { RecipientType } from "../../api/common/recipients/Recipient"
import { MailRecipientsTextField } from "../../gui/MailRecipientsTextField.js"
import { noOp, numberRange, ofClass } from "@tutao/tutanota-utils"
import { createDropdown } from "../../gui/base/Dropdown.js"
import { CalendarEvent, createEncryptedMailAddress, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { RecipientsSearchModel } from "../../misc/RecipientsSearchModel.js"
import type { HtmlEditor } from "../../gui/editor/HtmlEditor.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { ToggleButton } from "../../gui/base/ToggleButton.js"
import { locator } from "../../api/main/MainLocator.js"
import { findAttendeeInAddresses } from "../../api/common/utils/CommonCalendarUtils.js"

export const iconForAttendeeStatus: Record<CalendarAttendeeStatus, AllIcons> = Object.freeze({
	[CalendarAttendeeStatus.ACCEPTED]: Icons.CircleCheckmark,
	[CalendarAttendeeStatus.TENTATIVE]: Icons.CircleHelp,
	[CalendarAttendeeStatus.DECLINED]: Icons.CircleReject,
	[CalendarAttendeeStatus.NEEDS_ACTION]: Icons.CircleEmpty,
	[CalendarAttendeeStatus.ADDED]: Icons.CircleEmpty,
})
const alarmIntervalItems = [
	{
		name: lang.get("comboBoxSelectionNone_msg"),
		value: null,
	},
	{
		name: lang.get("calendarReminderIntervalFiveMinutes_label"),
		value: AlarmInterval.FIVE_MINUTES,
	},
	{
		name: lang.get("calendarReminderIntervalTenMinutes_label"),
		value: AlarmInterval.TEN_MINUTES,
	},
	{
		name: lang.get("calendarReminderIntervalThirtyMinutes_label"),
		value: AlarmInterval.THIRTY_MINUTES,
	},
	{
		name: lang.get("calendarReminderIntervalOneHour_label"),
		value: AlarmInterval.ONE_HOUR,
	},
	{
		name: lang.get("calendarReminderIntervalOneDay_label"),
		value: AlarmInterval.ONE_DAY,
	},
	{
		name: lang.get("calendarReminderIntervalTwoDays_label"),
		value: AlarmInterval.TWO_DAYS,
	},
	{
		name: lang.get("calendarReminderIntervalThreeDays_label"),
		value: AlarmInterval.THREE_DAYS,
	},
	{
		name: lang.get("calendarReminderIntervalOneWeek_label"),
		value: AlarmInterval.ONE_WEEK,
	},
]

export async function showCalendarEventDialog(
	date: Date,
	calendars: ReadonlyMap<Id, CalendarInfo>,
	mailboxDetail: MailboxDetail,
	existingEvent?: CalendarEvent,
	responseMail?: Mail,
) {
	const { HtmlEditor } = await import("../../gui/editor/HtmlEditor")
	const recipientsSearch = await locator.recipientsSearchModel()
	const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot)

	const viewModel = await locator.calenderEventViewModel(
		date,
		calendars,
		mailboxDetail,
		mailboxProperties,
		existingEvent ?? null,
		responseMail ?? null,
		false,
	)
	const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot)
	const groupColors = locator.logins.getUserController().userSettingsGroupRoot.groupSettings.reduce((acc, gc) => {
		acc.set(gc.group, gc.color)
		return acc
	}, new Map())
	const repeatValues: SelectorItemList<RepeatPeriod | null> = createRepeatRuleFrequencyValues()
	const intervalValues = createIntervalValues()
	const endTypeValues = createRepeatRuleEndTypeValues()
	const guestShowConfidential: Map<string, boolean> = new Map()
	let finished = false

	function renderEndValue(): Children {
		if (viewModel.repeat == null || viewModel.repeat.endType === EndType.Never) {
			return null
		} else if (viewModel.repeat.endType === EndType.Count) {
			return m(DropDownSelector, {
				label: "emptyString_msg",
				items: intervalValues,
				selectedValue: viewModel.repeat.endValue,
				selectionChangedHandler: (endValue: number) => viewModel.onEndOccurencesSelected(endValue),
				icon: BootIcons.Expand,
			})
		} else if (viewModel.repeat.endType === EndType.UntilDate) {
			return m(DatePicker, {
				date: viewModel.repeat?.endValue != null ? new Date(viewModel.repeat?.endValue) : new Date(),
				onDateSelected: (date) => viewModel.onRepeatEndDateSelected(date),
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

	const descriptionEditor: HtmlEditor = new HtmlEditor("description_label")
		.setMinHeight(400)
		.showBorders()
		.setEnabled(!viewModel.isReadOnlyEvent())
		// We only set it once, we don't viewModel on every change, that would be slow
		.setValue(viewModel.note)
		.setToolbarOptions({
			alignmentEnabled: false,
			fontSizeEnabled: false,
		})
		.enableToolbar()

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

		function showProgress(p: Promise<unknown>) {
			// We get all errors in main promise, we don't need to handle them here
			return showProgressDialog("pleaseWait_msg", p).catch(noOp)
		}

		Promise.resolve().then(async () => {
			const shouldClose = await viewModel
				.saveAndSend({
					askForUpdates: askIfShouldSendCalendarUpdatesToAttendees,
					showProgress,
					askInsecurePassword: () => Dialog.confirm("presharedPasswordNotStrongEnough_msg"),
				})
				.catch(
					ofClass(UserError, (e) => {
						showUserError(e)
						return false
					}),
				)
				.catch(
					ofClass(BusinessFeatureRequiredError, async (e) => {
						const businessFeatureOrdered = await showBusinessFeatureRequiredDialog(() => e.message)
						// entity event updates are too slow to call updateBusinessFeature()
						viewModel.hasBusinessFeature(businessFeatureOrdered)
						return false
					}),
				)

			if (shouldClose) {
				finish()
			}
		})
	}

	const attendeesExpanded = stream(viewModel.attendees().length > 0)
	const invitationFieldText = stream("")
	const renderInvitationField = (): Children =>
		viewModel.canModifyGuests() ? renderAddAttendeesField(invitationFieldText, viewModel, recipientsSearch) : null

	function renderAttendees() {
		const ownAttendee = viewModel.findOwnAttendee()
		const guests = viewModel.attendees().slice()

		if (ownAttendee) {
			const indexOfOwn = guests.indexOf(ownAttendee)
			guests.splice(indexOfOwn, 1)
			guests.unshift(ownAttendee)
		}

		const organizer = viewModel.organizer

		if (organizer != null && guests.length > 0 && !findAttendeeInAddresses(guests, [organizer.address])) {
			guests.unshift({
				address: createEncryptedMailAddress({
					name: organizer.name,
					address: organizer.address,
				}),
				type: RecipientType.EXTERNAL,
				// Events created by Tutanota will always have the organizer in the attendee list
				status: CalendarAttendeeStatus.ADDED, // We don't know whether the organizer will be attending or not in this case
			})
		}

		const externalGuests = viewModel.shouldShowPasswordFields()
			? guests
					.filter((a) => a.type === RecipientType.EXTERNAL)
					.map((guest) => {
						if (!guestShowConfidential.has(guest.address.address)) guestShowConfidential.set(guest.address.address, false)

						return m(TextField, {
							value: viewModel.getGuestPassword(guest),
							autocompleteAs: Autocomplete.off,
							type: guestShowConfidential.get(guest.address.address) ? TextFieldType.Text : TextFieldType.Password,
							label: () =>
								lang.get("passwordFor_label", {
									"{1}": guest.address.address,
								}),
							helpLabel: () => m(".mt-s", m(CompletenessIndicator, { percentageCompleted: viewModel.getPasswordStrength(guest) })),
							key: guest.address.address,
							oninput: (newValue) => viewModel.updatePassword(guest, newValue),
							injectionsRight: () => renderRevealIcon(guest.address.address),
						})
					})
			: []
		return m("", [guests.map((guest, index) => renderGuest(guest, index, viewModel, ownAttendee)), externalGuests])
	}

	const renderRevealIcon = (address: string) => {
		return m(IconButton, {
			title: guestShowConfidential.get(address) ? "concealPassword_action" : "revealPassword_action",
			click: () => {
				guestShowConfidential.set(address, !guestShowConfidential.get(address))
			},
			icon: guestShowConfidential.get(address) ? Icons.NoEye : Icons.Eye,
			size: ButtonSize.Compact,
		})
	}

	const renderDateTimePickers = () =>
		renderTwoColumnsIfFits(
			[
				m(
					".flex-grow",
					m(DatePicker, {
						date: viewModel.startDate,
						onDateSelected: (date) => {
							if (date) {
								viewModel.setStartDate(date)
							}
						},
						startOfTheWeekOffset,
						label: "dateFrom_label",
						nullSelectionText: "emptyString_msg",
						disabled: viewModel.isReadOnlyEvent(),
					}),
				),
				!viewModel.allDay()
					? m(
							".ml-s.time-field",
							m(TimePicker, {
								time: viewModel.startTime,
								onTimeSelected: (time) => viewModel.setStartTime(time),
								amPmFormat: viewModel.amPmFormat,
								disabled: viewModel.isReadOnlyEvent(),
							}),
					  )
					: null,
			],
			[
				m(
					".flex-grow",
					m(DatePicker, {
						date: viewModel.endDate,
						onDateSelected: (date) => {
							if (date) {
								viewModel.setEndDate(date)
							}
						},
						startOfTheWeekOffset,
						label: "dateTo_label",
						nullSelectionText: "emptyString_msg",
						disabled: viewModel.isReadOnlyEvent(),
					}),
				),
				!viewModel.allDay()
					? m(
							".ml-s.time-field",
							m(TimePicker, {
								time: viewModel.endTime,
								onTimeSelected: (time) => viewModel.setEndTime(time),
								amPmFormat: viewModel.amPmFormat,
								disabled: viewModel.isReadOnlyEvent(),
							}),
					  )
					: null,
			],
		)

	const renderLocationField = () =>
		m(TextField, {
			label: "location_label",
			value: viewModel.location(),
			oninput: viewModel.location,
			disabled: viewModel.isReadOnlyEvent(),
			class: "text pt-s", // override default pt with pt-s because calendar color indicator takes up some space
			injectionsRight: () => {
				let address = encodeURIComponent(viewModel.location())

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

	function renderCalendarColor() {
		const color = viewModel.selectedCalendar() ? groupColors.get(viewModel.selectedCalendar()!.groupInfo.group) ?? defaultCalendarColor : null
		return m(".mt-xs", {
			style: {
				width: "100px",
				height: "10px",
				background: color ? "#" + color : "transparent",
			},
		})
	}

	function renderCalendarPicker() {
		const availableCalendars = viewModel.getAvailableCalendars()
		return m(
			".flex-half.pr-s",
			availableCalendars.length
				? m(DropDownSelector, {
						label: "calendar_label",
						items: availableCalendars.map((calendarInfo) => {
							return {
								name: getSharedGroupName(calendarInfo.groupInfo, calendarInfo.shared),
								value: calendarInfo,
							}
						}),
						selectedValue: viewModel.selectedCalendar(),
						selectionChangedHandler: viewModel.selectedCalendar,
						icon: BootIcons.Expand,
						disabled: viewModel.isReadOnlyEvent(),
						helpLabel: () => renderCalendarColor(),
				  } as DropDownSelectorAttrs<CalendarInfo>)
				: null,
		)
	}

	function renderRepeatPeriod() {
		return m(DropDownSelector, {
			label: "calendarRepeating_label",
			items: repeatValues,
			selectedValue: (viewModel.repeat && viewModel.repeat.frequency) || null,
			selectionChangedHandler: (period) => viewModel.onRepeatPeriodSelected(period),
			icon: BootIcons.Expand,
			disabled: viewModel.isReadOnlyEvent(),
		} as DropDownSelectorAttrs<RepeatPeriod | null>)
	}

	function renderRepeatInterval() {
		return m(DropDownSelector, {
			label: "interval_title",
			items: intervalValues,
			selectedValue: (viewModel.repeat && viewModel.repeat.interval) || 1,
			selectionChangedHandler: (period) => viewModel.onRepeatIntervalChanged(period),
			icon: BootIcons.Expand,
			disabled: viewModel.isReadOnlyEvent(),
		} as DropDownSelectorAttrs<number>)
	}

	function renderEndType(repeat: RepeatData) {
		return m(DropDownSelector, {
			label: () => lang.get("calendarRepeatStopCondition_label"),
			items: endTypeValues,
			selectedValue: repeat.endType,
			selectionChangedHandler: (period) => viewModel.onRepeatEndTypeChanged(period),
			icon: BootIcons.Expand,
			disabled: viewModel.isReadOnlyEvent(),
		} as DropDownSelectorAttrs<EndType>)
	}

	const renderRepeatRulePicker = () =>
		renderTwoColumnsIfFits(
			[
				// Repeat type == Frequency: Never, daily, annually etc
				m(".flex-grow.pr-s", renderRepeatPeriod()), // Repeat interval: every day, every second day etc
				m(".flex-grow.pl-s" + (viewModel.repeat ? "" : ".hidden"), renderRepeatInterval()),
			],
			viewModel.repeat ? [m(".flex-grow.pr-s", renderEndType(viewModel.repeat)), m(".flex-grow.pl-s", renderEndValue())] : null,
		)

	function renderChangesMessage() {
		return viewModel.isInvite() ? m(".mt.mb-s", lang.get("eventCopy_msg")) : null
	}

	viewModel.sendingOutUpdate.map(m.redraw)

	function renderDialogContent() {
		return m(
			".calendar-edit-container.pb",
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
				renderHeading(),
				renderChangesMessage(),
				m(
					".mb.rel",
					m(
						ExpanderPanel,
						{
							expanded: attendeesExpanded(),
						},
						[m(".flex-grow", renderInvitationField()), m(".flex-grow", renderAttendees())],
					),
				),
				renderDateTimePickers(),
				m(".flex.items-center.mt-s", [
					m(Checkbox, {
						checked: viewModel.allDay(),
						onChecked: viewModel.allDay,
						disabled: viewModel.isReadOnlyEvent(),
						label: () => lang.get("allDay_label"),
					}),
					m(".flex-grow"),
				]),
				renderRepeatRulePicker(),
				m(".flex", [
					renderCalendarPicker(),
					viewModel.canModifyAlarms()
						? m(".flex.col.flex-half.pl-s", [
								viewModel.alarms.map((a) =>
									m(DropDownSelector, {
										label: "reminderBeforeEvent_label",
										items: alarmIntervalItems,
										selectedValue: a.trigger as AlarmInterval,
										icon: BootIcons.Expand,
										selectionChangedHandler: (value: AlarmInterval) => viewModel.changeAlarm(a.alarmIdentifier, value),
										key: a.alarmIdentifier,
									}),
								),
								m(DropDownSelector, {
									label: "reminderBeforeEvent_label",
									items: alarmIntervalItems,
									selectedValue: null,
									icon: BootIcons.Expand,
									selectionChangedHandler: (value: AlarmInterval) => value && viewModel.addAlarm(value),
								}),
						  ])
						: m(".flex.flex-half.pl-s"),
				]),
				renderLocationField(),
				m(descriptionEditor),
			],
		)
	}

	function finish() {
		finished = true
		viewModel.dispose()
		dialog.close()
	}

	function renderHeading() {
		return m(TextField, {
			label: "title_placeholder",
			value: viewModel.summary(),
			oninput: viewModel.summary,
			disabled: viewModel.isReadOnlyEvent(),
			class: "big-input pt flex-grow",
			injectionsRight: () =>
				m(
					".mr-s",
					m(ExpanderButton, {
						label: "guests_label",
						expanded: attendeesExpanded(),
						onExpandedChange: attendeesExpanded,
						style: {
							paddingTop: 0,
						},
					}),
				),
		})
	}

	viewModel.attendees.map(m.redraw)
	const dialogHeaderBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: finish,
				type: ButtonType.Secondary,
			},
		],
		middle: () => lang.get("createEvent_label"), // right: save button is only added if the event is not read-only
	}
	const dialog = Dialog.largeDialog(dialogHeaderBarAttrs, {
		view: renderDialogContent,
	}).addShortcut({
		key: Keys.ESC,
		exec: finish,
		help: "close_alt",
	})

	if (!viewModel.isReadOnlyEvent()) {
		dialogHeaderBarAttrs.right = [
			{
				label: "save_action",
				click: () => okAction(),
				type: ButtonType.Primary,
			},
		]
		dialog.addShortcut({
			key: Keys.S,
			ctrl: true,
			exec: () => okAction(),
			help: "save_action",
		})
	}

	if (client.isMobileDevice()) {
		// Prevent focusing text field automatically on mobile. It opens keyboard and you don't see all details.
		dialog.setFocusOnLoadFunction(noOp)
	}

	dialog.show()
}

function renderStatusIcon(viewModel: CalendarEventViewModel, attendee: Guest): Children {
	const icon = iconForAttendeeStatus[attendee.status]
	return m(Icon, {
		icon,
		class: "mr-s",
		style: {
			fill: theme.content_fg,
		},
	})
}

function createIntervalValues(): Array<{ name: string; value: number }> {
	return numberRange(1, 256).map((n) => {
		return {
			name: String(n),
			value: n,
		}
	})
}

function renderAddAttendeesField(text: Stream<string>, viewModel: CalendarEventViewModel, recipientsSearch: RecipientsSearchModel): Children {
	return m(".flex.flex-column.flex-grow", [
		m(MailRecipientsTextField, {
			label: "addGuest_label",
			text: text(),
			onTextChanged: text,
			// we dont show bubbles, we just want the search dropdown
			recipients: [],
			disabled: false,
			onRecipientAdded: async (address, name, contact) => {
				const notAvailable = viewModel.shouldShowSendInviteNotAvailable()
				if (notAvailable) {
					const businessFeatureOrdered = await showBusinessFeatureRequiredDialog("businessFeatureRequiredInvite_msg")
					if (businessFeatureOrdered) {
						viewModel.addGuest(address, contact)
					}

					viewModel.hasBusinessFeature(businessFeatureOrdered) //entity event updates are too slow to call updateBusinessFeature()
				} else {
					viewModel.addGuest(address, contact)
				}
			},
			onRecipientRemoved: () => {
				// do nothing because we don't have any bubbles here
			},
			injectionsRight: [
				viewModel.attendees().find((a) => a.type === RecipientType.EXTERNAL)
					? m(ToggleButton, {
							title: viewModel.isConfidential() ? "confidential_action" : "nonConfidential_action",
							onToggled: (_, e) => {
								viewModel.setConfidential(!viewModel.isConfidential())
								e.stopPropagation()
							},
							icon: viewModel.isConfidential() ? Icons.Lock : Icons.Unlock,
							toggled: viewModel.isConfidential(),
							size: ButtonSize.Compact,
					  })
					: null,
			],
			search: recipientsSearch,
		}),
		viewModel.isForceUpdateAvailable()
			? m(
					".mt-negative-s",
					m(Checkbox, {
						label: () => lang.get("sendUpdates_label"),
						onChecked: (v) => viewModel.isForceUpdates(v),
						checked: viewModel.isForceUpdates(),
					}),
			  )
			: null,
	])
}

function renderTwoColumnsIfFits(left: Children, right: Children): Children {
	if (client.isMobileDevice()) {
		return m(".flex.col", [m(".flex", left), m(".flex", right)])
	} else {
		return m(".flex", [m(".flex.flex-half.pr-s", left), m(".flex.flex-half.pl-s", right)])
	}
}

function showOrganizerDropdown(viewModel: CalendarEventViewModel, e: MouseEvent) {
	const makeButtons = () =>
		viewModel.possibleOrganizers.map((organizer) => {
			return {
				label: () => organizer.address,
				click: () => viewModel.setOrganizer(organizer),
			}
		})

	createDropdown({ lazyButtons: makeButtons, width: 300 })(e, e.target as any)
}

function renderGuest(guest: Guest, index: number, viewModel: CalendarEventViewModel, ownAttendee: Guest | null): Children {
	const { organizer } = viewModel
	const isOrganizer = organizer && findAttendeeInAddresses([guest], [organizer.address])
	const editableOrganizer = isOrganizer && viewModel.canModifyOrganizer()
	const attendingItems = [
		{
			name: lang.get("yes_label"),
			value: CalendarAttendeeStatus.ACCEPTED,
		},
		{
			name: lang.get("maybe_label"),
			value: CalendarAttendeeStatus.TENTATIVE,
		},
		{
			name: lang.get("no_label"),
			value: CalendarAttendeeStatus.DECLINED,
		},
		{
			name: lang.get("pending_label"),
			value: CalendarAttendeeStatus.NEEDS_ACTION,
			selectable: false,
		},
	]
	return m(
		".flex",
		{
			style: {
				height: px(size.button_height),
				borderBottom: "1px transparent",
				marginTop: index === 0 && !viewModel.canModifyGuests() ? 0 : px(size.vpad),
			},
		},
		[
			m(".flex.col.flex-grow.overflow-hidden.flex-no-grow-shrink-auto", [
				m(
					".flex.flex-grow.items-center" + (editableOrganizer ? ".click" : ""),
					editableOrganizer
						? {
								onclick: (e: MouseEvent) => showOrganizerDropdown(viewModel, e),
						  }
						: {},
					[
						m(
							"div.text-ellipsis",
							{
								style: {
									lineHeight: px(24),
								},
							},
							guest.address.name ? `${guest.address.name} ${guest.address.address}` : guest.address.address,
						),
						editableOrganizer
							? m(Icon, {
									icon: BootIcons.Expand,
									style: {
										fill: theme.content_fg,
									},
							  })
							: null,
					],
				),
				m(".small.flex.center-vertically", [
					renderStatusIcon(viewModel, guest),
					lang.get(isOrganizer ? "organizer_label" : "guest_label") + (guest === ownAttendee ? ` | ${lang.get("you_label")}` : ""),
				]),
			]),
			m(".flex-grow"),
			[
				ownAttendee === guest && viewModel.canModifyOwnAttendance()
					? m(
							"",
							{
								style: {
									minWidth: "120px",
								},
							},
							m(DropDownSelector, {
								label: "attending_label",
								items: attendingItems,
								selectedValue: guest.status,
								class: "",
								selectionChangedHandler: (value: CalendarAttendeeStatus) => {
									if (value == null) return
									viewModel.selectGoing(value)
								},
							}),
					  )
					: viewModel.canModifyGuests()
					? m(IconButton, {
							title: "remove_action",
							icon: Icons.Cancel,
							click: () => viewModel.removeAttendee(guest),
					  })
					: null,
			],
		],
	)
}
