import m, { Children, ClassComponent, Vnode } from "mithril"
import { CalendarSidebarRow, CalendarSidebarRowAttrs } from "../gui/CalendarSidebarRow"
import { CalendarInfo, CalendarInfoBase } from "../model/CalendarModel"
import { GuestPicker } from "../gui/pickers/GuestPicker"
import { RecipientsSearchModel } from "../../../common/misc/RecipientsSearchModel"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton"
import { Card } from "../../../common/gui/base/Card"
import { px, size } from "../../../common/gui/size"
import { IconMessageBox } from "../../../common/gui/base/ColumnEmptyMessageBox"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { theme } from "../../../common/gui/theme"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Group, GroupInfo, GroupMembership } from "../../../common/api/entities/sys/TypeRefs"
import { MultiPageDialog } from "../../../common/gui/dialogs/MultiPageDialog"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { ButtonType } from "../../../common/gui/base/Button"
import { Recipient, RecipientType } from "../../../common/api/common/recipients/Recipient"
import { RecipientsModel, ResolvableRecipient } from "../../../common/api/main/RecipientsModel"
import { Skeleton } from "../../../common/gui/base/Skeleton"
import { DismissibleCard } from "../../../common/gui/base/DismissibleCard"
import { sendShareNotificationEmail } from "../../../common/sharing/GroupSharingUtils"
import { KeyVerificationMismatchError } from "../../../common/api/common/error/KeyVerificationMismatchError"
import { contains } from "@tutao/tutanota-utils"
import { PreconditionFailedError, TooManyRequestsError } from "../../../common/api/common/error/RestError"
import { locator } from "../../../common/api/main/CommonLocator"
import { Dialog } from "../../../common/gui/base/Dialog"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { GroupSharingModel } from "../../../common/sharing/model/GroupSharingModel"
import { AvailablePlanType, GroupType, ShareCapability } from "../../../common/api/common/TutanotaConstants"
import { getTextsForGroupType } from "../../../common/sharing/GroupGuiUtils"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { CalendarGroupRoot } from "../../../common/api/entities/tutanota/TypeRefs"
import { Select, SelectAttributes, SelectOption } from "../../../common/gui/base/Select"
import stream from "mithril/stream"
import { getCapabilityText } from "../../../common/sharing/GroupUtils"

interface CalendarPageAttributes {
	sharableCalendars: Array<CalendarInfoBase>
	bulkCalendarSharingModel: BulkCalendarSharingViewModel
	continueCallback: () => void
}

interface UsersPageAttributes {
	recipientsSearchModel: RecipientsSearchModel
	recipientsModel: RecipientsModel
	bulkCalendarSharingModel: BulkCalendarSharingViewModel
	confirmCallback: () => void
}

interface ShareRecipient {
	resolved: boolean
	recipient?: Recipient
}

class BulkCalendarSharingViewModel {
	private calendarsToShare: Set<Id> = new Set<Id>()
	private recipientsToShareWith: Map<string, ShareRecipient> = new Map<string, ShareRecipient>()
	private shareCapability: ShareCapability = ShareCapability.Read

	constructor(
		private readonly groupSharingModelFactory: (groupInfo: GroupInfo) => Promise<GroupSharingModel>,
		private readonly calendars: ReadonlyArray<CalendarInfoBase>,
		private readonly recipientsModel: RecipientsModel,
	) {}

	get selectedCapability() {
		return this.shareCapability
	}

	setShareCapability(capability: ShareCapability) {
		this.shareCapability = capability
	}

	hasSelectedCalendars() {
		return this.calendarsToShare.size > 0
	}

	hasSelectedRecipients() {
		return this.recipientsToShareWith.size > 0
	}

	hasInvalidRecipients() {
		return Array.from(this.recipientsToShareWith.values()).some(
			(sharedRecipient) => !sharedRecipient.resolved || sharedRecipient.recipient?.type !== RecipientType.INTERNAL,
		)
	}

	recipientsList() {
		return Array.from(this.recipientsToShareWith)
	}

	isCalendarMarkedToShare(id: string) {
		return this.calendarsToShare.has(id)
	}

	toggleCalendarToShare(id: string) {
		if (this.isCalendarMarkedToShare(id)) {
			return this.calendarsToShare.delete(id)
		}

		this.calendarsToShare.add(id)
	}

	updateRecipientToShareWith(address: string, shareRecipient: ShareRecipient) {
		this.recipientsToShareWith.set(address, shareRecipient)
	}

	addRecipientToShareWith(address: string) {
		if (!this.recipientsToShareWith.has(address)) {
			this.recipientsToShareWith.set(address, { resolved: false })
		}
	}

	removeRecipientToShareWith(address: string) {
		this.recipientsToShareWith.delete(address)
	}

	async doShare() {
		const { checkPaidSubscription, showPlanUpgradeRequiredDialog } = await import("../../../common/misc/SubscriptionDialogs")

		const recipients = Array.from(this.recipientsToShareWith.values()).flatMap((shareRecipient) => {
			if (!shareRecipient.resolved || shareRecipient.recipient?.type !== RecipientType.INTERNAL) {
				return []
			}

			return [shareRecipient.recipient]
		})

		if (await checkPaidSubscription()) {
			const calendars = this.calendars.filter((calendar) => this.calendarsToShare.has(calendar.id)) as Array<CalendarInfo>
			for (const calendar of calendars) {
				await this.inviteAndSendMails(calendar, recipients, showPlanUpgradeRequiredDialog)
			}
		}
	}

	private async inviteAndSendMails(
		calendar: CalendarInfoBase & {
			groupRoot: CalendarGroupRoot
			groupInfo: GroupInfo
			group: Group
			hasMultipleMembers: boolean
			userIsOwner: boolean
			isExternal: boolean
		},
		recipients: any[],
		showPlanUpgradeRequiredDialog: (acceptedPlans: readonly AvailablePlanType[], reason?: TranslationKey) => Promise<boolean>,
	) {
		try {
			const groupShareModel = await this.groupSharingModelFactory(calendar.groupInfo)
			const invitedMails = await groupShareModel.sendGroupInvitation(calendar.groupInfo, recipients, this.shareCapability)
			return sendShareNotificationEmail(calendar.groupInfo, invitedMails, getTextsForGroupType(GroupType.Calendar))
		} catch (e) {
			if (e instanceof KeyVerificationMismatchError) {
				const failedRecipients: ResolvableRecipient[] = []

				// Mark all recipients that have a KeyVerificationMismatch after hitting "Send"
				for (const recipient of recipients) {
					if (contains(e.data, recipient.address)) {
						const toResolveRecipient = this.recipientsModel.initialize(recipient)
						await toResolveRecipient.markAsKeyVerificationMismatch()
						failedRecipients.push(toResolveRecipient)
					}
				}

				await import("../../../common/settings/keymanagement/KeyVerificationRecoveryDialog.js").then(
					({ showMultiRecipientsKeyVerificationRecoveryDialog }) => showMultiRecipientsKeyVerificationRecoveryDialog(failedRecipients),
				)
			} else if (e instanceof PreconditionFailedError) {
				if (locator.logins.getUserController().isGlobalAdmin()) {
					const { getAvailablePlansWithSharing } = await import("../../../common/subscription/utils/SubscriptionUtils.js")
					const plans = await getAvailablePlansWithSharing()
					await showPlanUpgradeRequiredDialog(plans)
				} else {
					await Dialog.message("contactAdmin_msg")
				}
			} else if (e instanceof UserError) {
				await showUserError(e)
			} else if (e instanceof TooManyRequestsError) {
				await Dialog.message("tooManyAttempts_msg")
			}

			return Promise.reject(e)
		}
	}
}

class CalendarsPage implements ClassComponent<CalendarPageAttributes> {
	private sharableCalendars: Array<CalendarInfoBase> = []
	private bulkCalendarSharingModel: BulkCalendarSharingViewModel

	constructor({ attrs: { sharableCalendars, bulkCalendarSharingModel } }: Vnode<CalendarPageAttributes>) {
		this.sharableCalendars = sharableCalendars
		this.bulkCalendarSharingModel = bulkCalendarSharingModel
	}

	view({ attrs: { continueCallback } }: Vnode<CalendarPageAttributes>): Children {
		return m(".flex.col.flex-space-between.height-100p.pt.gap-vpad.pb", [
			m(".flex.col.gap-vpad.height-100p.min-height-0", [
				m(Card, m("span.h4", lang.getTranslationText("calendars_label"))),
				m(
					Card,
					{ classes: ["flex-shrink", "scroll"] },
					this.sharableCalendars.map((g) =>
						m(CalendarSidebarRow, {
							id: g.id,
							name: g.name,
							color: g.color,
							isHidden: !this.bulkCalendarSharingModel.isCalendarMarkedToShare(g.id),
							toggleHiddenCalendar: (calendarId) => this.bulkCalendarSharingModel.toggleCalendarToShare(calendarId),
							actions: [],
							classes: "",
						} satisfies CalendarSidebarRowAttrs),
					),
				),
			]),
			m(
				".align-self-center.full-width.flex-grow.height-100p",
				m(LoginButton, {
					label: "continue_action",
					disabled: !this.bulkCalendarSharingModel.hasSelectedCalendars(),
					onclick: continueCallback,
				}),
			),
		])
	}
}

class UsersPage implements ClassComponent<UsersPageAttributes> {
	private bulkCalendarSharingModel: BulkCalendarSharingViewModel
	private recipientsModel: RecipientsModel
	private capabilitiesOptions = stream(
		[ShareCapability.Read, ShareCapability.Invite, ShareCapability.Write].map((capability) => ({
			value: capability,
			ariaValue: getCapabilityText(capability),
		})),
	)
	private selectedCapability = this.capabilitiesOptions()[0]

	constructor({ attrs: { bulkCalendarSharingModel, recipientsModel } }: Vnode<UsersPageAttributes>) {
		this.bulkCalendarSharingModel = bulkCalendarSharingModel
		this.recipientsModel = recipientsModel
	}

	private async addAndResolveRecipient(address: string) {
		this.bulkCalendarSharingModel.addRecipientToShareWith(address)

		const resolvedRecipient = await this.recipientsModel.initialize({ address }).resolve()
		this.bulkCalendarSharingModel.updateRecipientToShareWith(address, {
			resolved: true,
			recipient: resolvedRecipient,
		})

		m.redraw()
	}

	view({ attrs: { bulkCalendarSharingModel, recipientsSearchModel, confirmCallback } }: Vnode<UsersPageAttributes>): Children {
		return m(".flex.col.flex-space-between.height-100p.pt.gap-vpad.pb", [
			m(".flex.col.height-100p.gap-vpad.min-height-0.flex-shrink", [
				m(
					Card,
					m(".flex.col.gap-vpad-xs", [
						m("span.h4", lang.getTranslationText("addParticipant_action")),
						m("span.selectable", lang.getTranslationText("featureTutanotaOnly_msg")),
					]),
				),
				m(".flex.col.gap-vpad-s.flex-grow.flex-shrink.overflow-hidden", [
					m(
						Card,
						{ style: { padding: "0px" } },
						m(".flex.gap-vpad-s.items-center.flex-grow", [
							m(".flex.flex-column.full-width", [
								m(GuestPicker, {
									ariaLabel: "emailRecipient_label",
									disabled: false,
									onRecipientAdded: (address) => this.addAndResolveRecipient(address),
									search: recipientsSearchModel,
								}),
							]),
						]),
					),
					!bulkCalendarSharingModel.hasSelectedRecipients()
						? m(
								Card,
								{
									classes: ["min-h-s flex flex-column gap-vpad-s"],
									style: { padding: `${px(size.vpad_small)}` },
								},
								m(".flex.items-center.justify-center.min-h-s", [
									m(IconMessageBox, {
										message: "noEntries_msg",
										icon: Icons.People,
										color: theme.on_surface_variant,
									}),
								]),
							)
						: m(
								".scroll.min-height-0.flex-shrink.flex.col.gap-vpad-xs",
								bulkCalendarSharingModel.recipientsList().map(([address, r]) => this.renderRecipient(address, r, bulkCalendarSharingModel)),
							),
				]),
				m(".flex.flex-column.gap-vpad-s", [
					m("small.uppercase.b.text-ellipsis", { style: { color: theme.on_surface_variant } }, lang.getTranslationText("permissions_label")),
					m(
						Card,
						m(Select<SelectOption<ShareCapability>, string>, {
							classes: ["flex-grow", "button-min-height"],
							onchange: (option) => {
								this.bulkCalendarSharingModel.setShareCapability(option.value)
								this.selectedCapability = option
							},
							selected: this.selectedCapability,
							disabled: false,
							ariaLabel: lang.get("organizer_label"),
							renderOption: (option) =>
								m(
									"button.items-center.flex-grow.state-bg.button-content.dropdown-button.pt-s.pb-s.button-min-height",
									{ style: { color: this.selectedCapability.value === option.value ? theme.primary : undefined } },
									option.ariaValue,
								),
							renderDisplay: (option) => m("", option.ariaValue),
							options: this.capabilitiesOptions,
							noIcon: false,
							expanded: true,
						} satisfies SelectAttributes<SelectOption<ShareCapability>, string>),
					),
				]),
				m(Card, m("span.selectable", lang.getTranslationText("shareCalendarWarning_msg"))),
			]),
			m(
				".align-self-center.full-width.flex-grow",
				m(LoginButton, {
					label: "share_action",
					disabled: !bulkCalendarSharingModel.hasSelectedRecipients() || bulkCalendarSharingModel.hasInvalidRecipients(),
					onclick: confirmCallback,
				}),
			),
		])
	}

	private renderRecipient(address: string, shareRecipient: ShareRecipient, bulkSharingModel: BulkCalendarSharingViewModel) {
		const recipient = shareRecipient.recipient
		const isInvalidRecipient = shareRecipient.recipient?.type !== RecipientType.INTERNAL

		if (!recipient) {
			return m(
				Card,
				{
					style: {
						padding: `${px(size.vpad_small)} ${px(0)} ${px(size.vpad_small)} ${px(size.vpad_small)}`,
					},
				},
				m(".flex.flex-column.items-center", [
					m(".flex.items-center.flex-grow.full-width.pr.gap-vpad-xs", [
						m(Skeleton, {
							style: {
								width: "100%",
								height: "22px",
							},
						}),
						m(Skeleton, {
							style: {
								width: px(size.button_height),
								height: px(size.button_height),
							},
						}),
					]),
				]),
			)
		}

		if (isInvalidRecipient) {
			return m(
				DismissibleCard,
				{
					style: {
						padding: `${px(size.vpad_small)} ${px(0)} ${px(size.vpad_small)} ${px(0)}`,
					},
					dismissButton: m(IconButton, {
						title: "remove_action",
						icon: Icons.Cancel,
						click: () => bulkSharingModel.removeRecipientToShareWith(recipient.address),
					}),
					dismissCallback: () => this.bulkCalendarSharingModel.removeRecipientToShareWith(address),
				},
				[
					m(
						".flex.items-center.flex-grow.full-width.pr",
						m(".flex.col.full-width.justify-center.flex-grow", [
							m(".text-ellipsis", address),
							m(".text-ellipsis.small", lang.getTranslationText("mailAddressInvalid_msg")),
						]),
					),
				],
			)
		}

		return m(
			Card,
			{
				style: {
					padding: `${px(size.vpad_small)} ${px(0)} ${px(size.vpad_small)} ${px(size.vpad_small)}`,
				},
			},
			m(".flex.flex-column.items-center", [
				m(".flex.items-center.flex-grow.full-width.pr.gap-vpad-xs", [
					m(".flex.flex-column.flex-grow.min-width-0", [
						m(".text-ellipsis", recipient.name.length > 0 ? `${recipient.name} ${recipient.address}` : recipient.address),
					]),
					m(IconButton, {
						title: "remove_action",
						icon: Icons.Cancel,
						click: () => {
							bulkSharingModel.removeRecipientToShareWith(recipient.address)
						},
					}),
				]),
			]),
		)
	}
}

export class BulkCalendarSharing {
	static prepareBulkSharingDialog(
		groupSharingModelFactory: (groupInfo: GroupInfo) => Promise<GroupSharingModel>,
		calendarMemberships: Array<GroupMembership>,
		availableCalendars: ReadonlyArray<CalendarInfoBase>,
		recipientsSearchModel: RecipientsSearchModel,
		recipientsModel: RecipientsModel,
	) {
		const groups = calendarMemberships.filter((g) => g.capability === null)
		const sharableCalendars = availableCalendars.filter((calendarInfo) => {
			return groups.some((g) => g.group === calendarInfo.id)
		})

		const bulkSharingModel = new BulkCalendarSharingViewModel(groupSharingModelFactory, availableCalendars, recipientsModel)

		return new MultiPageDialog<"calendars" | "users">("calendars", (dialog, navigateToPage, goBack) => ({
			calendars: {
				title: lang.getTranslationText("calendars_label"),
				content: m(CalendarsPage, {
					sharableCalendars,
					bulkCalendarSharingModel: bulkSharingModel,
					continueCallback: () => navigateToPage("users"),
				}),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => dialog.onClose(),
					label: "close_alt",
					title: "close_alt",
				},
			},
			users: {
				title: lang.getTranslationText("recipients_label"),
				content: m(UsersPage, {
					recipientsSearchModel,
					recipientsModel,
					bulkCalendarSharingModel: bulkSharingModel,
					confirmCallback: () => showProgressDialog("calendarInvitationProgress_msg", bulkSharingModel.doShare()).finally(() => dialog.close()),
				}),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => goBack(),
					label: "back_action",
					title: "back_action",
				},
			},
		})).getDialog()
	}
}
