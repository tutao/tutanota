import {px, size} from "../../gui/size"
import stream from "mithril/stream"
import {DatePicker} from "../../gui/date/DatePicker"
import {Dialog} from "../../gui/base/Dialog"
import m, {Children} from "mithril"
import {TextFieldN, TextFieldType as TextFieldType} from "../../gui/base/TextFieldN"
import {lang} from "../../misc/LanguageViewModel"
import type {DropDownSelectorAttrs, SelectorItemList} from "../../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {Icons} from "../../gui/base/icons/Icons"
import type {CalendarEvent, Contact, Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {createEncryptedMailAddress} from "../../api/entities/tutanota/TypeRefs.js"
import {downcast, findAndRemove, memoized, noOp, numberRange, ofClass, remove} from "@tutao/tutanota-utils"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColor, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {AlarmInterval, CalendarAttendeeStatus, EndType, Keys, RepeatPeriod} from "../../api/common/TutanotaConstants"
import {createRepeatRuleEndTypeValues, createRepeatRuleFrequencyValues, getStartOfTheWeekOffsetForUser} from "../date/CalendarUtils"
import {Bubble, BubbleTextField} from "../../gui/base/BubbleTextField"
import {RecipientInfoBubbleHandler} from "../../misc/RecipientInfoBubbleHandler"
import type {DropdownInfoAttrs} from "../../gui/base/DropdownN"
import {attachDropdown, createDropdown} from "../../gui/base/DropdownN"
import {AllIcons, Icon} from "../../gui/base/Icon"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {CheckboxN} from "../../gui/base/CheckboxN"
import {ExpanderButtonN, ExpanderPanelN} from "../../gui/base/Expander"
import {client} from "../../misc/ClientDetector"
import type {Guest, RepeatData} from "../date/CalendarEventViewModel"
import {CalendarEventViewModel, createCalendarEventViewModel} from "../date/CalendarEventViewModel"
import type {RecipientInfo} from "../../api/common/RecipientInfo"
import {RecipientInfoType} from "../../api/common/RecipientInfo"
import {UserError} from "../../api/main/UserError"
import {theme} from "../../gui/theme"
import {showBusinessFeatureRequiredDialog} from "../../misc/SubscriptionDialogs"
import {locator} from "../../api/main/MainLocator"
import {BusinessFeatureRequiredError} from "../../api/main/BusinessFeatureRequiredError"
import type {MailboxDetail} from "../../mail/model/MailModel"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {PasswordIndicator} from "../../gui/PasswordIndicator"
import {TimePicker} from "../../gui/TimePicker"
import type {ContactModel} from "../../contacts/model/ContactModel"
import {createRecipientInfo, getDisplayText} from "../../mail/model/MailUtils"
import {getSharedGroupName} from "../../sharing/GroupUtils"
import {logins} from "../../api/main/LoginController"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {askIfShouldSendCalendarUpdatesToAttendees} from "./CalendarGuiUtils"
import type {CalendarInfo} from "../model/CalendarModel"
import {showUserError} from "../../misc/ErrorHandlerImpl"

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

export function showCalendarEventDialog(
	date: Date,
	calendars: ReadonlyMap<Id, CalendarInfo>,
	mailboxDetail: MailboxDetail,
	existingEvent?: CalendarEvent,
	responseMail?: Mail,
) {
	const viewModelPromise = createCalendarEventViewModel(date, calendars, mailboxDetail, existingEvent ?? null, responseMail ?? null, false);
	Promise.all([import("../../gui/editor/HtmlEditor"), viewModelPromise]).then(
		([{HtmlEditor}, viewModel]) => {
			const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot)
			const repeatValues: SelectorItemList<RepeatPeriod | null> = createRepeatRuleFrequencyValues()
			const intervalValues = createIntevalValues()
			const endTypeValues = createRepeatRuleEndTypeValues()
			let finished = false

			function renderEndValue(): Children {
				if (viewModel.repeat == null || viewModel.repeat.endType === EndType.Never) {
					return null
				} else if (viewModel.repeat.endType === EndType.Count) {
					return m(DropDownSelectorN, {
						label: "emptyString_msg",
						items: intervalValues,
						selectedValue: stream(viewModel.repeat.endValue),
						selectionChangedHandler: (endValue: number) => viewModel.onEndOccurencesSelected(endValue),
						icon: BootIcons.Expand,
					})
				} else if (viewModel.repeat.endType === EndType.UntilDate) {
					return m(DatePicker, {
						date: viewModel.repeat?.endValue != null ? new Date(viewModel.repeat?.endValue) : new Date(),
						onDateSelected: date => viewModel.onRepeatEndDateSelected(date),
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

			const editorOptions = {
				enabled: false,
				alignmentEnabled: false,
				fontSizeEnabled: false,
			}
			const descriptionEditor = new HtmlEditor("description_label", editorOptions, () =>
				m(ButtonN, {
					label: "emptyString_msg",
					title: "showRichTextToolbar_action",
					icon: () => Icons.FontSize,
					click: () => (editorOptions.enabled = !editorOptions.enabled),
					isSelected: () => editorOptions.enabled,
					noBubble: true,
					type: ButtonType.Toggle,
					colors: ButtonColor.Elevated,
				}),
			)
				.setMinHeight(400)
				.showBorders()
				.setEnabled(!viewModel.isReadOnlyEvent()) // We only set it once, we don't viewModel on every change, that would be slow
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
							ofClass(UserError, e => {
								showUserError(e)
								return false
							}),
						)
						.catch(
							ofClass(BusinessFeatureRequiredError, async e => {
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

			const attendeesField = makeBubbleTextField(viewModel, locator.contactModel)
			const attendeesExpanded = stream(viewModel.attendees().length > 0)

			const renderInvitationField = (): Children => (viewModel.canModifyGuests() ? m(attendeesField) : null)

			function renderAttendees() {
				const ownAttendee = viewModel.findOwnAttendee()
				const guests = viewModel.attendees().slice()

				if (ownAttendee) {
					const indexOfOwn = guests.indexOf(ownAttendee)
					guests.splice(indexOfOwn, 1)
					guests.unshift(ownAttendee)
				}

				const organizer = viewModel.organizer

				if (organizer != null && guests.length > 0 && !guests.some(guest => guest.address.address === organizer.address)) {
					guests.unshift({
						address: createEncryptedMailAddress({
							address: organizer.address,
						}),
						type: RecipientInfoType.EXTERNAL,
						// Events created by Tutanota will always have the organizer in the attendee list
						status: CalendarAttendeeStatus.ADDED, // We don't know whether the organizer will be attending or not in this case
					})
				}

				const externalGuests = viewModel.shouldShowPasswordFields()
					? guests
						.filter(a => a.type === RecipientInfoType.EXTERNAL)
						.map(guest => {
							return m(TextFieldN, {
								value: stream(viewModel.getGuestPassword(guest)),
								type: TextFieldType.ExternalPassword,
								label: () =>
									lang.get("passwordFor_label", {
										"{1}": guest.address.address,
									}),
								helpLabel: () => m(new PasswordIndicator(() => viewModel.getPasswordStrength(guest))),
								key: guest.address.address,
								oninput: newValue => viewModel.updatePassword(guest, newValue),
							})
						})
					: []
				return m("", [guests.map((guest, index) => renderGuest(guest, index, viewModel, ownAttendee)), externalGuests])
			}

			const renderDateTimePickers = () =>
				renderTwoColumnsIfFits(
					[
						m(
							".flex-grow",
							m(DatePicker, {
								date: viewModel.startDate,
								onDateSelected: date => {
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
									onTimeSelected: time => viewModel.setStartTime(time),
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
								onDateSelected: date => {
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
									onTimeSelected: time => viewModel.setEndTime(time),
									amPmFormat: viewModel.amPmFormat,
									disabled: viewModel.isReadOnlyEvent(),
								}),
							)
							: null,
					],
				)

			const renderLocationField = () =>
				m(TextFieldN, {
					label: "location_label",
					value: viewModel.location,
					disabled: viewModel.isReadOnlyEvent(),
					injectionsRight: () => {
						let address = encodeURIComponent(viewModel.location())

						if (address === "") {
							return null
						}

						return m(ButtonN, {
							label: "showAddress_alt",
							icon: () => Icons.Pin,
							click: () => {
								window.open(`https://www.openstreetmap.org/search?query=${address}`, "_blank")
							},
						})
					},
				})

			function renderCalendarPicker() {
				const availableCalendars = viewModel.getAvailableCalendars()
				return m(
					".flex-half.pr-s",
					availableCalendars.length
						? m(DropDownSelectorN, {
							label: "calendar_label",
							items: availableCalendars.map(calendarInfo => {
								return {
									name: getSharedGroupName(calendarInfo.groupInfo, calendarInfo.shared),
									value: calendarInfo,
								}
							}),
							selectedValue: viewModel.selectedCalendar,
							icon: BootIcons.Expand,
							disabled: viewModel.isReadOnlyEvent(),
						} as DropDownSelectorAttrs<CalendarInfo>)
						: null,
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
					selectedValue: repeatFrequencyStream((viewModel.repeat && viewModel.repeat.frequency) || null),
					selectionChangedHandler: period => viewModel.onRepeatPeriodSelected(period),
					icon: BootIcons.Expand,
					disabled: viewModel.isReadOnlyEvent(),
				} as DropDownSelectorAttrs<RepeatPeriod | null>)
			}

			function renderRepeatInterval() {
				return m(DropDownSelectorN, {
					label: "interval_title",
					items: intervalValues,
					selectedValue: repeatIntervalStream((viewModel.repeat && viewModel.repeat.interval) || 1),
					selectionChangedHandler: period => viewModel.onRepeatIntervalChanged(period),
					icon: BootIcons.Expand,
					disabled: viewModel.isReadOnlyEvent(),
				} as DropDownSelectorAttrs<number>)
			}

			function renderEndType(repeat: RepeatData) {
				return m(DropDownSelectorN, {
					label: () => lang.get("calendarRepeatStopCondition_label"),
					items: endTypeValues,
					selectedValue: endTypeStream(repeat.endType),
					selectionChangedHandler: period => viewModel.onRepeatEndTypeChanged(period),
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
								ExpanderPanelN,
								{
									expanded: attendeesExpanded,
								},
								[m(".flex-grow", renderInvitationField()), m(".flex-grow", renderAttendees())],
							),
						),
						renderDateTimePickers(),
						m(".flex.items-center.mt-s", [
							m(CheckboxN, {
								checked: viewModel.allDay,
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
									viewModel.alarms.map(a =>
										m(DropDownSelectorN, {
											label: "reminderBeforeEvent_label",
											items: alarmIntervalItems,
											selectedValue: stream(downcast(a.trigger)),
											icon: BootIcons.Expand,
											selectionChangedHandler: (value: AlarmInterval) => viewModel.changeAlarm(a.alarmIdentifier, value),
											key: a.alarmIdentifier,
										}),
									),
									m(DropDownSelectorN, {
										label: "reminderBeforeEvent_label",
										items: alarmIntervalItems,
										selectedValue: stream(null),
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
				return m(TextFieldN, {
					label: "title_placeholder",
					value: viewModel.summary,
					disabled: viewModel.isReadOnlyEvent(),
					class: "big-input pt flex-grow",
					injectionsRight: () =>
						m(
							".mr-s",
							m(ExpanderButtonN, {
								label: "guests_label",
								expanded: attendeesExpanded,
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
		},
	)
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

function createIntevalValues(): Array<{name: string, value: number}> {
	return numberRange(1, 256).map(n => {
		return {
			name: String(n),
			value: n,
		}
	})
}

function makeBubbleTextField(viewModel: CalendarEventViewModel, contactModel: ContactModel): BubbleTextField<RecipientInfo> {
	function createBubbleContextButtons(name: string, mailAddress: string): [DropdownInfoAttrs, ButtonAttrs] {
		return [
			{
				info: mailAddress,
				center: true,
				bold: true,
			},
			{
				label: "remove_action",
				click: () => {
					findAndRemove(invitePeopleValueTextField.bubbles, bubble => bubble.entity.mailAddress === mailAddress)
				},
			}
		]
	}

	const bubbleHandler = new RecipientInfoBubbleHandler(
		{
			createBubble(name: string | null, mailAddress: string, contact: Contact | null): Bubble<RecipientInfo> {
				const recipientInfo = createRecipientInfo(mailAddress, name, contact)
				const buttonAttrs = attachDropdown({
					mainButtonAttrs: {
						label: () => getDisplayText(recipientInfo.name, mailAddress, false),
						type: ButtonType.TextBubble,
						isSelected: () => false,
					},
					childAttrs: () => createBubbleContextButtons(recipientInfo.name, mailAddress)
				})
				const bubble = new Bubble(recipientInfo, buttonAttrs, mailAddress)
				// remove bubble after it was created - we don't need it for calendar invites because the attendees are shown in a separate list.
				Promise.resolve().then(() => {
					const notAvailable = viewModel.shouldShowSendInviteNotAvailable()
					let p = Promise.resolve()

					if (notAvailable) {
						p = showBusinessFeatureRequiredDialog("businessFeatureRequiredInvite_msg").then(businessFeatureOrdered => {
							if (businessFeatureOrdered) {
								viewModel.addGuest(bubble.entity.mailAddress, bubble.entity.contact)
							}

							viewModel.hasBusinessFeature(businessFeatureOrdered) //entity event updates are too slow to call updateBusinessFeature()
						})
					} else {
						viewModel.addGuest(bubble.entity.mailAddress, bubble.entity.contact)
					}

					p.then(() => {
						remove(invitePeopleValueTextField.bubbles, bubble)
					})
				})
				return bubble
			},
		},
		contactModel,
	)
	const invitePeopleValueTextField = new BubbleTextField("addGuest_label", bubbleHandler, () => renderGuestButtons(viewModel))
	return invitePeopleValueTextField
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
		viewModel.possibleOrganizers.map(organizer => {
			return {
				label: () => organizer.address,
				type: ButtonType.Dropdown,
				click: () => viewModel.setOrganizer(organizer),
			}
		})

	createDropdown({lazyButtons: makeButtons, width: 300})(e, e.target as any)
}

function renderGuest(guest: Guest, index: number, viewModel: CalendarEventViewModel, ownAttendee: Guest | null): Children {
	const {organizer} = viewModel
	const isOrganizer = organizer && guest.address.address === organizer.address
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
						m(DropDownSelectorN, {
							label: "attending_label",
							items: attendingItems,
							selectedValue: stream(guest.status),
							class: "",
							selectionChangedHandler: (value: CalendarAttendeeStatus) => {
								if (value == null) return
								viewModel.selectGoing(value)
							},
						}),
					)
					: viewModel.canModifyGuests()
						? m(
							".mr-negative-s",
							m(ButtonN, {
								label: "remove_action",
								type: ButtonType.Action,
								icon: () => Icons.Cancel,
								click: () => viewModel.removeAttendee(guest),
							}),
						)
						: null,
			],
		],
	)
}

function renderGuestButtons(viewModel: CalendarEventViewModel): Children {
	return [renderUpdateAttendeesButton(viewModel), renderConfidentialButton(viewModel)]
}

function renderUpdateAttendeesButton(viewModel: CalendarEventViewModel) {
	return viewModel.isForceUpdateAvailable()
		? m(ButtonN, {
			label: "sendUpdates_label",
			click: () => viewModel.isForceUpdates(!viewModel.isForceUpdates()),
			icon: () => BootIcons.Mail,
			isSelected: () => viewModel.isForceUpdates(),
			noBubble: true,
		})
		: null
}

function renderConfidentialButton(viewModel: CalendarEventViewModel) {
	return viewModel.attendees().find(a => a.type === RecipientInfoType.EXTERNAL)
		? m(ButtonN, {
			label: "confidential_action",
			click: () => viewModel.setConfidential(!viewModel.isConfidential()),
			icon: () => (viewModel.isConfidential() ? Icons.Lock : Icons.Unlock),
			isSelected: () => viewModel.isConfidential(),
			noBubble: true,
		})
		: null
}