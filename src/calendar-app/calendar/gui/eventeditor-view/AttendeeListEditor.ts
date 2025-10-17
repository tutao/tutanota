import m, { Children, Component, Vnode } from "mithril"
import { RecipientType } from "../../../../common/api/common/recipients/Recipient.js"
import { ToggleButton } from "../../../../common/gui/base/buttons/ToggleButton.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { AccountType, CalendarAttendeeStatus } from "../../../../common/api/common/TutanotaConstants.js"
import { RecipientsSearchModel } from "../../../../common/misc/RecipientsSearchModel.js"
import { Guest } from "../../view/CalendarInvites.js"
import { theme } from "../../../../common/gui/theme.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { px, size } from "../../../../common/gui/size.js"
import { CalendarEventWhoModel } from "../eventeditor-model/CalendarEventWhoModel.js"
import { LoginController } from "../../../../common/api/main/LoginController.js"
import { CalendarEventModel, CalendarOperation } from "../eventeditor-model/CalendarEventModel.js"
import { showPlanUpgradeRequiredDialog } from "../../../../common/misc/SubscriptionDialogs.js"
import { hasPlanWithInvites } from "../eventeditor-model/CalendarNotificationModel.js"
import { Dialog } from "../../../../common/gui/base/Dialog.js"

import { AttendingItem, calendarAttendeeStatusText, createAttendingItems } from "../CalendarGuiUtils.js"
import { Card } from "../../../../common/gui/base/Card.js"
import { Select, SelectAttributes } from "../../../../common/gui/base/Select.js"
import stream from "mithril/stream"
import { OrganizerSelectItem } from "./CalendarEventEditView.js"
import { GuestPicker } from "../pickers/GuestPicker.js"
import { IconMessageBox } from "../../../../common/gui/base/ColumnEmptyMessageBox.js"
import { PasswordInput } from "../../../../common/gui/PasswordInput.js"
import { Switch } from "../../../../common/gui/base/Switch.js"
import { Divider } from "../../../../common/gui/Divider.js"

export type AttendeeListEditorAttrs = {
	/** the event that is currently being edited */
	model: CalendarEventModel

	/** these are needed to show suggestions and external passwords. */
	recipientsSearch: RecipientsSearchModel
	logins: LoginController
	width: number
}

/**
 * an editor that can edit the attendees list of a calendar event with suggestions,
 * including the own attendance, the own organizer address and external passwords.
 */
export class AttendeeListEditor implements Component<AttendeeListEditorAttrs> {
	private hasPlanWithInvites: boolean = false

	view({ attrs }: Vnode<AttendeeListEditorAttrs>): Children {
		const { whoModel } = attrs.model.editModels
		const organizer = whoModel.organizer
		return [
			m(".flex-grow.flex.flex-column.gap-vpad.pb.pt.fit-height", { style: { width: px(attrs.width) } }, [
				this.renderOrganizer(attrs.model, organizer),
				m(".flex.flex-column.gap-vpad-s", [
					m("small.uppercase.b.text-ellipsis", { style: { color: theme.on_surface } }, lang.get("guests_label")),
					whoModel.canModifyGuests ? this.renderGuestsInput(whoModel, attrs.logins, attrs.recipientsSearch) : null,
					this.renderSendUpdateCheckbox(attrs.model.editModels.whoModel),
					this.renderGuestList(attrs, organizer),
				]),
			]),
		]
	}

	private renderGuestList(attrs: AttendeeListEditorAttrs, organizer: Guest | null): Children {
		const { whoModel } = attrs.model.editModels
		const guestItems: (() => Children)[] = []

		for (const guest of whoModel.guests) {
			let password: string
			let strength: number

			if (guest.type === RecipientType.EXTERNAL) {
				const presharedPassword = whoModel.getPresharedPassword(guest.address)
				password = presharedPassword.password
				strength = presharedPassword.strength
			}

			guestItems.push(() => this.renderGuest(guest, attrs, password, strength))
		}

		// ownGuest is never in the guest list, but it may be identical to organizer.
		const ownGuest = whoModel.ownGuest
		if (ownGuest != null && ownGuest.address !== organizer?.address) {
			guestItems.push(() => this.renderGuest(ownGuest, attrs))
		}

		const verticalPadding = guestItems.length > 0 ? size.vpad_small : 0

		return guestItems.length === 0
			? m(
					Card,
					{
						classes: ["min-h-s flex flex-column gap-vpad-s"],
						style: {
							padding: `${px(verticalPadding)} ${px(guestItems.length === 0 ? size.vpad_small : 0)} ${px(size.vpad_small)} ${px(
								verticalPadding,
							)}`,
						},
					},
					m(".flex.items-center.justify-center.min-h-s", [
						m(IconMessageBox, {
							message: "noEntries_msg",
							icon: Icons.People,
							color: theme.on_surface_variant,
						}),
					]),
				)
			: guestItems.map((r, index) => r())
	}

	private renderGuestsInput(whoModel: CalendarEventWhoModel, logins: LoginController, recipientsSearch: RecipientsSearchModel): Children {
		const guests = whoModel.guests
		const hasExternalGuests = guests.some((a) => a.type === RecipientType.EXTERNAL)

		return m(".flex.items-center.flex-grow.gap-vpad-s", [
			m(Card, { style: { padding: "0" }, classes: ["flex-grow"] }, [
				m(".flex.flex-grow.rel.button-height", [
					m(GuestPicker, {
						ariaLabel: "addGuest_label",
						disabled: false,
						onRecipientAdded: async (address, name, contact) => {
							if (!(await hasPlanWithInvites(logins)) && !this.hasPlanWithInvites) {
								if (logins.getUserController().user.accountType === AccountType.EXTERNAL) return
								if (logins.getUserController().isGlobalAdmin()) {
									const { getAvailablePlansWithEventInvites } = await import("../../../../common/subscription/utils/SubscriptionUtils.js")
									const plansWithEventInvites = await getAvailablePlansWithEventInvites()
									if (plansWithEventInvites.length === 0) return
									//entity event updates are too slow to call updateBusinessFeature()
									this.hasPlanWithInvites = await showPlanUpgradeRequiredDialog(plansWithEventInvites)
									// the user could have, but did not upgrade.
									if (!this.hasPlanWithInvites) return
								} else {
									Dialog.message("contactAdmin_msg")
								}
							} else {
								whoModel.addAttendee(address, contact)
							}
						},
						search: recipientsSearch,
					}),
				]),
			]),
			hasExternalGuests
				? m(
						Card,
						{ style: { padding: "0" } },
						m(ToggleButton, {
							title: "confidential_action",
							onToggled: (_, e) => {
								whoModel.isConfidential = !whoModel.isConfidential
								e.stopPropagation()
							},
							icon: whoModel.isConfidential ? Icons.Lock : Icons.Unlock,
							toggled: whoModel.isConfidential,
							size: ButtonSize.Normal,
						}),
					)
				: null,
		])
	}

	private renderAttendeeStatus(model: CalendarEventWhoModel, organizer: Guest | null): Children {
		const { status } = organizer ?? { status: CalendarAttendeeStatus.TENTATIVE }

		const attendingOptions = createAttendingItems().filter((option) => option.selectable !== false)
		const attendingStatus = attendingOptions.find((option) => option.value === status)

		return m(".flex.flex-column.pl-vpad-s.pr-vpad-s", [
			m(Select<AttendingItem, CalendarAttendeeStatus>, {
				onchange: (option) => {
					if (option.selectable === false) return
					model.setOwnAttendance(option.value)
				},
				classes: ["button-min-height"],
				selected: attendingStatus,
				disabled: organizer == null,
				ariaLabel: lang.get("attending_label"),
				renderOption: (option) =>
					m(
						"button.items-center.flex-grow.state-bg.button-content.dropdown-button.pt-s.pb-s.button-min-height",
						{
							class: option.selectable === false ? `no-hover` : "",
							style: { color: option.value === status ? theme.primary : undefined },
						},
						option.name,
					),
				renderDisplay: (option) => m("", option.name),
				options: stream(attendingOptions),
				expanded: true,
				noIcon: organizer == null,
			} satisfies SelectAttributes<AttendingItem, CalendarAttendeeStatus>),
		])
	}

	private renderOrganizer(model: CalendarEventModel, organizer: Guest | null): Children {
		const { whoModel } = model.editModels

		if (!(whoModel.possibleOrganizers.length > 0 || organizer)) {
			console.log("Trying to access guest without organizer")
			return null
		}

		const { address, name, status } = organizer ?? {}
		const hasGuest = whoModel.guests.length > 0
		const isMe = organizer?.address === whoModel.ownGuest?.address
		const editableOrganizer = whoModel.possibleOrganizers.length > 1 && isMe

		const options = whoModel.possibleOrganizers.map((organizer) => {
			return {
				name: organizer.name,
				address: organizer.address,
				ariaValue: organizer.address,
				value: organizer.address,
			}
		})

		const disabled = !editableOrganizer || !hasGuest
		const selected = options.find((option) => option.address === address) ?? options[0]

		return m(".flex.col", [
			m("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.on_surface } }, lang.get("organizer_label")),
			m(Card, { style: { padding: `0` } }, [
				m(".flex.flex-column", [
					m(".flex.pl-vpad-s.pr-vpad-s", [
						m(Select<OrganizerSelectItem, string>, {
							classes: ["flex-grow", "button-min-height"],
							onchange: (option) => {
								const organizer = whoModel.possibleOrganizers.find((organizer) => organizer.address === option.address)
								if (organizer) {
									whoModel.addAttendee(organizer.address, null)
								}
							},
							selected,
							disabled,
							ariaLabel: lang.get("organizer_label"),
							renderOption: (option) =>
								m(
									"button.items-center.flex-grow.state-bg.button-content.dropdown-button.pt-s.pb-s.button-min-height",
									{ style: { color: selected.address === option.address ? theme.primary : undefined } },
									option.address,
								),
							renderDisplay: (option) => m("", option.name ? `${option.name} <${option.address}>` : option.address),
							options: stream(
								whoModel.possibleOrganizers.map((organizer) => {
									return {
										name: organizer.name,
										address: organizer.address,
										ariaValue: organizer.address,
										value: organizer.address,
									}
								}),
							),
							noIcon: disabled,
							expanded: true,
						} satisfies SelectAttributes<OrganizerSelectItem, string>),
						model.operation !== CalendarOperation.EditThis && organizer && !isMe
							? m(IconButton, {
									title: "sendMail_alt",
									click: async () =>
										(await import("../../../../mail-app/contacts/view/ContactView.js")).writeMail(
											organizer,
											lang.get("repliedToEventInvite_msg", {
												"{event}": model.editModels.summary.content,
											}),
										),
									size: ButtonSize.Compact,
									icon: Icons.PencilSquare,
								})
							: null,
					]),
					isMe && model.operation !== CalendarOperation.EditThis
						? [m(Divider, { color: theme.outline_variant }), this.renderAttendeeStatus(whoModel, organizer)]
						: null,
				]),
			]),
		])
	}

	private renderSendUpdateCheckbox(whoModel: CalendarEventWhoModel): Children {
		return !whoModel.initiallyHadOtherAttendees || !whoModel.canModifyGuests
			? null
			: m(
					Card,
					m(
						Switch,
						{
							checked: whoModel.shouldSendUpdates,
							onclick: (value) => (whoModel.shouldSendUpdates = value),
							ariaLabel: lang.get("sendUpdates_label"),
							disabled: false,
							variant: "expanded",
						},
						lang.get("sendUpdates_label"),
					),
				)
	}

	private renderGuest(guest: Guest, { model }: Pick<AttendeeListEditorAttrs, "model">, password?: string, strength?: number): Children {
		const { whoModel } = model.editModels
		const { address, name, status } = guest
		const isMe = guest.address === whoModel.ownGuest?.address
		const statusText = calendarAttendeeStatusText(status)
		const roleLabel = isMe ? `${lang.get("guest_label")} | ${lang.get("you_label")}` : `${lang.get("guest_label")}`
		const guestStatusAndRole = roleLabel + (statusText ? ` | ${statusText}` : "")
		const renderPasswordField = whoModel.isConfidential && password != null && guest.type === RecipientType.EXTERNAL

		let rightContent: Children = null

		if (isMe) {
			rightContent = m("", { style: { paddingRight: px(size.vpad_small) } }, this.renderAttendeeStatus(model.editModels.whoModel, guest))
		} else if (whoModel.canModifyGuests) {
			rightContent = m(IconButton, {
				title: "remove_action",
				icon: Icons.Cancel,
				click: () => whoModel.removeAttendee(guest.address),
			})
		}

		return m(
			Card,
			{
				style: {
					padding: `${px(size.vpad_small)} ${px(0)} ${px(size.vpad_small)} ${px(size.vpad_small)}`,
				},
			},
			m(".flex.flex-column.items-center", [
				m(".flex.items-center.flex-grow.full-width", [
					m(".flex.flex-column.flex-grow.min-width-0", [
						m(".small", { style: { lineHeight: px(size.vpad_small) } }, guestStatusAndRole),
						m(".text-ellipsis", name.length > 0 ? `${name} ${address}` : address),
					]),
					rightContent,
				]),
				renderPasswordField
					? [
							m(
								".flex.full-width",
								{
									style: {
										padding: `0 0 ${px(size.vpad_xsm)} ${px(size.vpad_small + size.icon_size_medium_large)}`,
									},
								},
								m(Divider, {
									color: theme.outline_variant,
								}),
							),
							this.renderPasswordField(address, password, strength ?? 0, whoModel),
						]
					: null,
			]),
		)
	}

	private renderPasswordField(address: string, password: string, strength: number, whoModel: CalendarEventWhoModel): Children {
		const label = lang.get("passwordFor_label", {
			"{1}": address,
		})
		return [
			m(".flex.flex-grow.full-width.justify-between.items-end", [
				m(
					".flex.flex-column.full-width",
					{
						style: {
							paddingLeft: px(size.hpad_medium + size.vpad_small),
							paddingRight: px((size.button_height - size.button_height_compact) / 2),
						},
					},
					[
						m(PasswordInput, {
							ariaLabel: label,
							password,
							strength,
							oninput: (newPassword) => {
								whoModel.setPresharedPassword(address, newPassword)
							},
						}),
					],
				),
			]),
		]
	}
}
