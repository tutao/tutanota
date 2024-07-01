import m, { Children, Component, Vnode } from "mithril"
import { MailRecipientsTextField } from "../../../../common/gui/MailRecipientsTextField.js"
import { RecipientType } from "../../../../common/api/common/recipients/Recipient.js"
import { ToggleButton } from "../../../../common/gui/base/buttons/ToggleButton.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { Checkbox } from "../../../../common/gui/base/Checkbox.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { AccountType, CalendarAttendeeStatus } from "../../../../common/api/common/TutanotaConstants.js"
import { Autocomplete } from "../../../../common/gui/base/TextField.js"
import { RecipientsSearchModel } from "../../../../common/misc/RecipientsSearchModel.js"
import { noOp } from "@tutao/tutanota-utils"
import { Guest } from "../../view/CalendarInvites.js"
import { Icon } from "../../../../common/gui/base/Icon.js"
import { theme } from "../../../../common/gui/theme.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { px, size } from "../../../../common/gui/size.js"
import { createDropdown } from "../../../../common/gui/base/Dropdown.js"
import { CalendarEventWhoModel } from "../eventeditor-model/CalendarEventWhoModel.js"
import { LoginController } from "../../../../common/api/main/LoginController.js"
import { CalendarEventModel, CalendarOperation } from "../eventeditor-model/CalendarEventModel.js"
import { DropDownSelector } from "../../../../common/gui/base/DropDownSelector.js"
import { showPlanUpgradeRequiredDialog } from "../../../../common/misc/SubscriptionDialogs.js"
import { hasPlanWithInvites } from "../eventeditor-model/CalendarNotificationModel.js"
import { Dialog } from "../../../../common/gui/base/Dialog.js"

import { createAttendingItems, iconForAttendeeStatus } from "../CalendarGuiUtils.js"
import { PasswordField } from "../../../../common/misc/passwords/PasswordField.js"

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
						if (logins.getUserController().isGlobalAdmin()) {
							const { getAvailablePlansWithEventInvites } = await import("../../../../common/subscription/SubscriptionUtils.js")
							const plansWithEventInvites = await getAvailablePlansWithEventInvites()
							if (plansWithEventInvites.length === 0) return
							//entity event updates are too slow to call updateBusinessFeature()
							this.hasPlanWithInvites = await showPlanUpgradeRequiredDialog(plansWithEventInvites)
							// the user could have, but did not upgrade.
							if (!this.hasPlanWithInvites) return
						} else {
							Dialog.message(() => lang.get("contactAdmin_msg"))
						}
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
			title: "confidential_action",
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
						return m(PasswordField, {
							value: password,
							passwordStrength: strength,
							autocompleteAs: Autocomplete.off,
							label: () =>
								lang.get("passwordFor_label", {
									"{1}": guest.address,
								}),
							key: address,
							oninput: (newValue) => whoModel.setPresharedPassword(address, newValue),
						})
					})
			: []

		return m("", [...attendeeRenderers.map((r) => r()), externalGuestPasswords])
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
							(await import("../../../../mail-app/contacts/view/ContactView.js")).writeMail(
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
