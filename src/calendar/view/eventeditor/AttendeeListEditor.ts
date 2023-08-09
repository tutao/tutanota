import m, { Children, Component, Vnode } from "mithril"
import { MailRecipientsTextField } from "../../../gui/MailRecipientsTextField.js"
import { RecipientType } from "../../../api/common/recipients/Recipient.js"
import { ToggleButton } from "../../../gui/base/buttons/ToggleButton.js"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { ButtonSize } from "../../../gui/base/ButtonSize.js"
import { Checkbox } from "../../../gui/base/Checkbox.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { AccountType, CalendarAttendeeStatus } from "../../../api/common/TutanotaConstants.js"
import { Autocomplete, TextField, TextFieldType } from "../../../gui/base/TextField.js"
import { CompletenessIndicator } from "../../../gui/CompletenessIndicator.js"
import { RecipientsSearchModel } from "../../../misc/RecipientsSearchModel.js"
import { noOp } from "@tutao/tutanota-utils"
import { Guest } from "../../date/CalendarInvites.js"
import { createAttendingItems, iconForAttendeeStatus } from "../../date/CalendarUtils.js"
import { Icon } from "../../../gui/base/Icon.js"
import { theme } from "../../../gui/theme.js"
import { IconButton } from "../../../gui/base/IconButton.js"
import { BootIcons } from "../../../gui/base/icons/BootIcons.js"
import { px, size } from "../../../gui/size.js"
import { createDropdown } from "../../../gui/base/Dropdown.js"
import { CalendarEventWhoModel } from "../../date/eventeditor/CalendarEventWhoModel.js"
import { LoginController } from "../../../api/main/LoginController.js"
import { CalendarEventModel, CalendarOperation } from "../../date/eventeditor/CalendarEventModel.js"
import { DropDownSelector } from "../../../gui/base/DropDownSelector.js"
import { showPlanUpgradeRequiredDialog } from "../../../misc/SubscriptionDialogs.js"
import { hasPlanWithInvites } from "../../date/eventeditor/CalendarNotificationModel.js"
import { scaleToVisualPasswordStrength } from "../../../misc/passwords/PasswordUtils.js"

export type AttendeeListEditorAttrs = {
	/** the event that is currently being edited */
	model: CalendarEventModel

	/** these are needed to show suggestions and external passwords. */
	recipientsSearch: RecipientsSearchModel
	logins: LoginController
}

/**
 * an editor that can edit the attendees list of a calendar event with suggestions,
 * including the own attendance, the own organizer address and external passwords.
 */
export class AttendeeListEditor implements Component<AttendeeListEditorAttrs> {
	private text: string = ""
	private hasPlanWithInvites: boolean = false
	private externalPasswordVisibility: Map<string, boolean> = new Map()

	view({ attrs }: Vnode<AttendeeListEditorAttrs>): Children {
		return [m(".flex-grow", this.renderInvitationField(attrs)), m(".flex-grow", this.renderGuestList(attrs))]
	}

	private renderInvitationField(attrs: AttendeeListEditorAttrs): Children {
		const { model, recipientsSearch, logins } = attrs
		if (!model.editModels.whoModel.canModifyGuests) return null
		return m(".flex.flex-column.flex-grow", [
			m(MailRecipientsTextField, {
				label: "addGuest_label",
				text: this.text,
				onTextChanged: (v) => (this.text = v),
				// we don't show bubbles, we just want the search dropdown
				recipients: [],
				disabled: false,
				onRecipientAdded: async (address, name, contact) => {
					if (!(await hasPlanWithInvites(logins)) && !this.hasPlanWithInvites) {
						if (logins.getUserController().user.accountType === AccountType.EXTERNAL) return
						const { getAvailablePlansWithEventInvites } = await import("../../../subscription/SubscriptionUtils.js")
						const plansWithEventInvites = await getAvailablePlansWithEventInvites()
						if (plansWithEventInvites.length === 0) return
						//entity event updates are too slow to call updateBusinessFeature()
						this.hasPlanWithInvites = await showPlanUpgradeRequiredDialog(plansWithEventInvites)
						// the user could have, but did not upgrade.
						if (!this.hasPlanWithInvites) return
					} else {
						model.editModels.whoModel.addAttendee(address, contact)
					}
				},
				// do nothing because we don't have any bubbles here
				onRecipientRemoved: noOp,
				injectionsRight: this.renderIsConfidentialToggle(attrs),
				search: recipientsSearch,
			}),
			this.renderSendUpdateCheckbox(attrs),
		])
	}

	private renderIsConfidentialToggle(attrs: AttendeeListEditorAttrs): Children {
		const { whoModel } = attrs.model.editModels
		const guests = whoModel.guests
		if (!guests.some((a) => a.type === RecipientType.EXTERNAL)) return null
		return m(ToggleButton, {
			title: whoModel.isConfidential ? "confidential_action" : "nonConfidential_action",
			onToggled: (_, e) => {
				whoModel.isConfidential = !whoModel.isConfidential
				e.stopPropagation()
			},
			icon: whoModel.isConfidential ? Icons.Lock : Icons.Unlock,
			toggled: whoModel.isConfidential,
			size: ButtonSize.Compact,
		})
	}

	private renderSendUpdateCheckbox({ model }: AttendeeListEditorAttrs): Children {
		const { whoModel } = model.editModels
		return !whoModel.initiallyHadOtherAttendees
			? null
			: m(
					".mt-negative-s",
					m(Checkbox, {
						label: () => lang.get("sendUpdates_label"),
						onChecked: (v) => (whoModel.shouldSendUpdates = v),
						checked: whoModel.shouldSendUpdates,
					}),
			  )
	}

	/**
	 * render the list of guests, always putting the organizer on top, then the rest,
	 * followed by the external passwords.
	 *
	 * in cases where we can see the event editor AND we have to render a guest list, we're guaranteed to be the organizer.
	 * @private
	 */
	private renderGuestList(attrs: AttendeeListEditorAttrs): Children {
		const { whoModel } = attrs.model.editModels
		const organizer = whoModel.organizer
		const guests: Array<Guest> = whoModel.guests.slice()
		const attendeeRenderers: Array<() => Children> = []

		if (organizer != null) {
			attendeeRenderers.push(() => renderOrganizer(organizer, attrs))
		}

		for (const guest of whoModel.guests) {
			attendeeRenderers.push(() => renderGuest(guest, attrs))
		}

		// ownGuest is never in the guest list, but it may be identical to organizer.
		const ownGuest = whoModel.ownGuest
		if (ownGuest != null && ownGuest.address !== organizer?.address) {
			attendeeRenderers.push(() => renderGuest(ownGuest, attrs))
		}

		const externalGuestPasswords = whoModel.isConfidential
			? guests
					.filter((a) => a.type === RecipientType.EXTERNAL)
					.map((guest) => {
						const { address } = guest
						const { password, strength } = whoModel.getPresharedPassword(address)
						return m(TextField, {
							value: password,
							autocompleteAs: Autocomplete.off,
							type: this.externalPasswordVisibility.get(address) === true ? TextFieldType.Text : TextFieldType.Password,
							label: () =>
								lang.get("passwordFor_label", {
									"{1}": guest.address,
								}),
							helpLabel: () => m(".mt-s", m(CompletenessIndicator, { percentageCompleted: scaleToVisualPasswordStrength(strength) })),
							key: address,
							oninput: (newValue) => whoModel.setPresharedPassword(address, newValue),
							injectionsRight: () => this.renderRevealIcon(guest.address),
						})
					})
			: []

		return m("", [...attendeeRenderers.map((r) => r()), externalGuestPasswords])
	}

	private renderRevealIcon(address: string): Children {
		return m(IconButton, {
			title: this.externalPasswordVisibility.get(address) === true ? "concealPassword_action" : "revealPassword_action",
			click: () => {
				this.externalPasswordVisibility.set(address, !this.externalPasswordVisibility.get(address))
			},
			icon: this.externalPasswordVisibility.get(address) === true ? Icons.NoEye : Icons.Eye,
			size: ButtonSize.Compact,
		})
	}
}

/**
 *
 * @param editModel the event to set the organizer on when a button in the dropdown is clicked
 * @param e
 */
function showOrganizerDropdown(editModel: CalendarEventWhoModel, e: MouseEvent) {
	const lazyButtons = () =>
		editModel.possibleOrganizers.map((organizer) => {
			return {
				label: () => organizer.address,
				click: () => editModel.addAttendee(organizer.address, null),
			}
		})

	createDropdown({ lazyButtons, width: 300 })(e, e.target as HTMLElement)
}

function renderOrganizer(organizer: Guest, { model }: Pick<AttendeeListEditorAttrs, "model">): Children {
	const { whoModel } = model.editModels
	const { address, name, status } = organizer
	const isMe = organizer.address === whoModel.ownGuest?.address
	const editableOrganizer = whoModel.possibleOrganizers.length > 1 && isMe
	const roleLabel = isMe ? `${lang.get("organizer_label")} | ${lang.get("you_label")}` : lang.get("organizer_label")
	const statusLine = m(".small.flex.center-vertically", [renderStatusIcon(status), roleLabel])
	const fullName = m("div.text-ellipsis", { style: { lineHeight: px(24) } }, name.length > 0 ? `${name} ${address}` : address)
	const nameAndAddress = editableOrganizer
		? m(".flex.flex-grow.items-center.click", { onclick: (e: MouseEvent) => showOrganizerDropdown(whoModel, e) }, [
				fullName,
				m(Icon, {
					icon: BootIcons.Expand,
					style: {
						fill: theme.content_fg,
					},
				}),
		  ])
		: m(".flex.flex-grow.items-center", fullName)

	const rightContent =
		// this prevents us from setting our own attendance on a single instance that we're editing.
		model.operation !== CalendarOperation.EditThis
			? isMe
				? m(
						"",
						{ style: { minWidth: "120px" } },
						m(DropDownSelector, {
							label: "attending_label",
							items: createAttendingItems(),
							selectedValue: status,
							class: "",
							selectionChangedHandler: (value: CalendarAttendeeStatus) => {
								if (value == null) return
								whoModel.setOwnAttendance(value)
							},
						}),
				  )
				: m(IconButton, {
						title: "sendMail_alt",
						click: async () =>
							(await import("../../../contacts/view/ContactView.js")).writeMail(
								organizer,
								lang.get("repliedToEventInvite_msg", {
									"{event}": model.editModels.summary.content,
								}),
							),
						icon: Icons.PencilSquare,
				  })
			: null

	return renderAttendee(nameAndAddress, statusLine, rightContent)
}

function renderGuest(guest: Guest, { model }: Pick<AttendeeListEditorAttrs, "model">): Children {
	const { whoModel } = model.editModels
	const { address, name, status } = guest
	const isMe = guest.address === whoModel.ownGuest?.address
	const roleLabel = isMe ? `${lang.get("guest_label")} | ${lang.get("you_label")}` : lang.get("guest_label")
	const statusLine = m(".small.flex.center-vertically", [renderStatusIcon(status), roleLabel])
	const fullName = m("div.text-ellipsis", { style: { lineHeight: px(24) } }, name.length > 0 ? `${name} ${address}` : address)
	const nameAndAddress = m(".flex.flex-grow.items-center", fullName)
	const rightContent = whoModel.canModifyGuests
		? m(IconButton, {
				title: "remove_action",
				icon: Icons.Cancel,
				click: () => whoModel.removeAttendee(guest.address),
		  })
		: null
	return renderAttendee(nameAndAddress, statusLine, rightContent)
}

function renderAttendee(nameAndAddress: Children, statusLine: Children, rightContent: Children): Children {
	const spacer = m(".flex-grow")
	return m(
		".flex",
		{
			style: {
				height: px(size.button_height),
				borderBottom: "1px transparent",
				marginTop: px(size.vpad),
			},
		},
		[m(".flex.col.flex-grow.overflow-hidden.flex-no-grow-shrink-auto", [nameAndAddress, statusLine]), spacer, rightContent],
	)
}

function renderStatusIcon(status: CalendarAttendeeStatus): Children {
	const icon = iconForAttendeeStatus[status]
	return m(Icon, {
		icon,
		class: "mr-s",
		style: {
			fill: theme.content_fg,
		},
	})
}
