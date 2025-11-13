import m, { ChildArray, Children, Component, Vnode } from "mithril"
import { InfoLink, lang } from "../../../common/misc/LanguageViewModel.js"
import { theme } from "../../../common/gui/theme.js"
import { styles } from "../../../common/gui/styles.js"
import { ExpanderButton, ExpanderPanel } from "../../../common/gui/base/Expander.js"
import { File as TutanotaFile } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { BannerButtonAttrs, BannerType, InfoBanner } from "../../../common/gui/base/InfoBanner.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { RecipientButton } from "../../../common/gui/base/RecipientButton.js"
import { createAsyncDropdown, createDropdown, DropdownButtonAttrs } from "../../../common/gui/base/Dropdown.js"
import { InboxRuleType, Keys, MailAuthenticationStatus, TabIndex } from "../../../common/api/common/TutanotaConstants.js"
import { Icon, progressIcon } from "../../../common/gui/base/Icon.js"
import { formatDateWithWeekday, formatDateWithWeekdayAndYear, formatStorageSize, formatTime } from "../../../common/misc/Formatter.js"
import { isAndroidApp, isDesktop, isIOSApp } from "../../../common/api/common/Env.js"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import Badge from "../../../common/gui/base/Badge.js"
import { ContentBlockingStatus, FailureBannerType, MailViewerViewModel } from "./MailViewerViewModel.js"
import { canSeeTutaLinks } from "../../../common/gui/base/GuiUtils.js"
import { assertNotNull, isEmpty, isNotNull, resolveMaybeLazy } from "@tutao/tutanota-utils"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { getConfidentialIcon, getFolderIconByType, isTutanotaTeamMail } from "./MailGuiUtils.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { addToggleLightModeButtonAttrs, editDraft, MailViewerMoreActions, singleMailViewerMoreActions, unsubscribe } from "./MailViewerUtils.js"
import { liveDataAttrs } from "../../../common/gui/AriaUtils.js"
import { isKeyPressed } from "../../../common/misc/KeyManager.js"
import { AttachmentBubble, getAttachmentType } from "../../../common/gui/AttachmentBubble.js"
import { responsiveCardHMargin, responsiveCardHPadding } from "../../../common/gui/cards.js"
import { companyTeamLabel } from "../../../common/misc/ClientConstants.js"
import { getMailAddressDisplayText } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { MailAddressAndName } from "../../../common/api/common/CommonMailUtils.js"
import { LabelsPopup } from "./LabelsPopup.js"
import { Label } from "../../../common/gui/base/Label.js"
import { px, size } from "../../../common/gui/size.js"
import { highlightTextInQueryAsChildren } from "../../../common/gui/TextHighlightViewUtils"
import { EventBanner, EventBannerAttrs } from "./EventBanner"
import { getGroupColors } from "../../../common/misc/GroupColors"

export type MailAddressDropdownCreator = (args: {
	mailAddress: MailAddressAndName
	defaultInboxRuleField: InboxRuleType | null
	createContact?: boolean
}) => Promise<Array<DropdownButtonAttrs>>

export interface MailHeaderActions {
	trash: (() => unknown) | null
	delete: (() => unknown) | null
	move: ((dom: HTMLElement) => unknown) | null
}

export interface MailViewerHeaderAttrs {
	// Passing the whole viewModel because there are a lot of separate bits we might need.
	// If we want to reuse this view we should probably pass everything on its own.
	viewModel: MailViewerViewModel
	createMailAddressContextButtons: MailAddressDropdownCreator
	isPrimary: boolean
	importFile: (file: TutanotaFile) => void
	actions: MailHeaderActions
	moreActions: MailViewerMoreActions
}

/** The upper part of the mail viewer, everything but the mail body itself. */
export class MailViewerHeader implements Component<MailViewerHeaderAttrs> {
	private detailsExpanded = false
	private filesExpanded = false

	view({ attrs }: Vnode<MailViewerHeaderAttrs>): Children {
		const { viewModel } = attrs
		const dateTime = formatDateWithWeekday(viewModel.mail.receivedDate) + " • " + formatTime(viewModel.mail.receivedDate)
		const dateTimeFull = formatDateWithWeekdayAndYear(viewModel.mail.receivedDate) + " • " + formatTime(viewModel.mail.receivedDate)

		return m(".header.selectable", [
			this.renderSubjectActionsLine(attrs),
			this.renderFolderAndLabels(viewModel),
			this.renderAddressesAndDate(viewModel, attrs, dateTime, dateTimeFull),
			m(
				ExpanderPanel,
				{
					expanded: this.detailsExpanded,
				},
				this.renderDetails(attrs, { bubbleMenuWidth: 300 }),
			),
			this.renderAttachments(viewModel, attrs.importFile),
			this.renderScheduledSendBanner(viewModel),
			this.renderConnectionLostBanner(viewModel),
			this.renderEventBanner(viewModel),
			this.renderBanners(attrs),
		])
	}

	private renderFolderAndLabels(viewModel: MailViewerViewModel) {
		const folderInfo = viewModel.getFolderInfo()
		if (!folderInfo) return null
		const icon = getFolderIconByType(folderInfo.folderType)

		const folderText = viewModel.getFolderMailboxText()
		const labels = viewModel.getLabels()
		if (folderText == null && labels.length === 0) {
			return null
		}

		const margin = px(size.vpad_xsm)
		return m(
			".flex.mb-xs.flex-wrap",
			{
				style: {
					columnGap: margin,
					rowGap: margin,
				},
				class: responsiveCardHMargin(),
			},
			[
				folderText
					? m(".flex.small", [
							m(".b", m("", lang.get("location_label"))),
							m(Icon, {
								icon,
								container: "div",
								style: {
									fill: theme.on_surface_variant,
									marginLeft: margin,
								},
							}),
							m(".span", folderInfo.name),
						])
					: null,
				labels.map((label) =>
					m(Label, {
						text: label.name,
						color: label.color ?? theme.primary,
					}),
				),
			],
		)
	}

	private renderAddressesAndDate(viewModel: MailViewerViewModel, attrs: MailViewerHeaderAttrs, dateTime: string, dateTimeFull: string) {
		const folderInfo = viewModel.getFolderInfo()
		if (!folderInfo) return null

		const displayedSender = viewModel.getDisplayedSender()
		return m(
			".flex.mt-xs.click.col",
			{
				class: responsiveCardHMargin(),
				role: "button",
				"aria-pressed": String(this.detailsExpanded),
				"aria-expanded": String(this.detailsExpanded),
				tabindex: TabIndex.Default,
				onclick: () => {
					this.detailsExpanded = !this.detailsExpanded
				},
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
						this.detailsExpanded = !this.detailsExpanded
						e.preventDefault()
					}
				},
			},
			[
				displayedSender == null
					? null
					: m(".small.flex.flex-wrap.items-start", [
							m("span.text-break", this.renderAddress(attrs.viewModel, displayedSender.name, displayedSender.address)),
						]),
				m(".flex", [
					this.getRecipientEmailAddress(attrs),
					m(".flex-grow"),
					m(".flex.items-center.white-space-pre.ml-s.ml-between-s", {
						// Orca refuses to read ut unless it's not focusable
						tabindex: TabIndex.Default,
						"aria-label": lang.get(viewModel.isConfidential() ? "confidential_action" : "nonConfidential_action") + ", " + dateTime,
					}),
					m(".flex.ml-between-s.items-center", [
						viewModel.isConfidential()
							? m(Icon, {
									icon: getConfidentialIcon(viewModel.mail),
									container: "div",
									style: {
										fill: theme.on_surface_variant,
									},
									hoverText: lang.get("confidential_label"),
								})
							: null,

						m(Icon, {
							icon: getFolderIconByType(folderInfo.folderType),
							container: "div",
							style: {
								fill: theme.on_surface_variant,
							},
							hoverText: folderInfo.name,
						}),
						m(".small.font-weight-600.selectable.no-wrap", { style: { color: theme.on_surface_variant } }, [
							m(".noprint", dateTime), // show the short date when viewing
							m(".noscreen", dateTimeFull), // show the date with year when printing
						]),
					]),
				]),
			],
		)
	}

	private renderAddress(mailViewerViewModel: MailViewerViewModel, name: string, address: string): Children {
		const displayed = getMailAddressDisplayText(name, address, false)
		return highlightTextInQueryAsChildren(displayed, mailViewerViewModel.getHighlightedStrings())
	}

	private renderSubjectActionsLine(attrs: MailViewerHeaderAttrs) {
		const { viewModel } = attrs
		const classes = this.makeSubjectActionsLineClasses()
		const senderName = viewModel.getDisplayedSender()?.name?.trim() ?? ""
		const displayAddressForSender = senderName === ""

		return m(classes, [
			m(
				".flex.flex-grow.align-self-start.items-start.overflow-hidden",
				{
					class: styles.isSingleColumnLayout() ? "mt-m" : "mt",
					role: "button",
					"mail-expander": "true",
					// "aria-expanded" is always true because this component is only used in expanded view
					"aria-expanded": "true",
					tabindex: TabIndex.Default,
					onclick: (e: MouseEvent) => {
						viewModel.collapseMail()
						e.stopPropagation()
					},
					onkeydown: (e: KeyboardEvent) => {
						if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN) && (e.target as HTMLElement).hasAttribute("mail-expander")) {
							viewModel.collapseMail()
							e.preventDefault()
						}
					},
				},
				[
					viewModel.isUnread() ? this.renderUnreadDot() : null,
					viewModel.isEditableDraft()
						? m(
								".flex.row.mr-xs.align-self-center",
								m(Icon, {
									icon: Icons.Edit,
									container: "div",
									style: {
										fill: theme.on_surface_variant,
									},
									hoverText: lang.getTranslationText("draft_label"),
								}),
							)
						: null,
					this.tutaoBadge(viewModel),
					m(
						"span" + (displayAddressForSender ? ".invisible.overflow-hidden" : ".text-break") + (viewModel.isUnread() ? ".font-weight-600" : ""),
						displayAddressForSender ? (viewModel.getDisplayedSender()?.address ?? "") : senderName,
					),
				],
			),
			m(
				".flex-end.items-start.ml-between-s",
				{
					class: styles.isSingleColumnLayout() ? "" : "mt-xs",
					style: {
						// align "more" button with the datetime text
						marginRight: styles.isSingleColumnLayout() ? "-3px" : "6px",
					},
					onclick: (e: MouseEvent) => e.stopPropagation(),
				},
				this.moreButton(attrs),
			),
		])
	}

	private renderUnreadDot(): Children {
		return m(
			".flex.flex-no-grow.no-shrink.pr-s",
			{
				"data-testid": "unread-indicator",
				style: {
					paddingTop: "2px",
				},
			},
			m(".dot.bg-accent-fg"),
		)
	}

	private makeSubjectActionsLineClasses() {
		let classes = ".flex.click"
		if (styles.isSingleColumnLayout()) {
			classes += ".ml"
		} else {
			classes += ".pl-l"
		}

		return classes
	}

	private renderBanners(attrs: MailViewerHeaderAttrs): Children {
		const { viewModel } = attrs
		if (viewModel.isCollapsed()) return null

		const failureBanner = this.renderFailureBanner(viewModel)
		const externalContentBanner = this.renderExternalContentBanner(attrs)
		const newsletterBanner = this.renderNewsletterBanner(viewModel)
		const banners: ChildArray = []
		// we don't wrap it in a single element because our container might depend on us being separate children for margins
		if (failureBanner) {
			banners.push(m("." + responsiveCardHMargin(), failureBanner))
		}
		if (externalContentBanner) {
			banners.push(m("." + responsiveCardHMargin(), externalContentBanner))
		}
		if (newsletterBanner) {
			banners.push(m("." + responsiveCardHMargin(), newsletterBanner))
		}

		const hasEventInvitation = viewModel.getCalendarEventAttachment()
		return isEmpty(banners) && !hasEventInvitation ? [m("hr.hr.mt-xs." + responsiveCardHMargin())] : [...banners]
	}

	private renderFailureBanner(viewModel: MailViewerViewModel): Children | null {
		switch (viewModel.mustRenderFailureBanner()) {
			case FailureBannerType.Phishing:
				return this.renderPhishingWarning(viewModel)
			case FailureBannerType.MailAuthenticationHardFail:
				return this.renderHardAuthenticationFailWarning(viewModel)
			case FailureBannerType.MailAuthenticationSoftFail:
				return this.renderSoftAuthenticationFailWarning(viewModel)
			case FailureBannerType.DeprecatedPublicKey:
				return this.renderDeprecatedPublicKeyBanner(viewModel)
			case FailureBannerType.None:
			default:
				return null
		}
	}

	private renderConnectionLostBanner(viewModel: MailViewerViewModel): Children {
		// If the mail body failed to load, then we show a message in the main column
		// If the mail body did load but not everything else, we show the message here
		if (viewModel.isConnectionLost()) {
			return m(
				"." + responsiveCardHMargin(),
				m(InfoBanner, {
					message: "mailPartsNotLoaded_msg",
					icon: Icons.Warning,
					buttons: [
						{
							label: "retry_action",
							click: () => viewModel.loadAll(Promise.resolve()),
						},
					],
				}),
			)
		} else {
			return null
		}
	}

	private renderScheduledSendBanner(viewModel: MailViewerViewModel): Children {
		if (viewModel.isScheduled()) {
			const sendAt = assertNotNull(viewModel.mail.sendAt)

			return m(
				".mb-s.mt-s." + responsiveCardHMargin(),
				m(InfoBanner, {
					message: () =>
						lang.getTranslation("sendScheduledForDate_msg", { "{dateTime}": formatDateWithWeekday(sendAt) + " • " + formatTime(sendAt) }).text,
					icon: Icons.Clock,
					buttons: [],
				}),
			)
		} else {
			return null
		}
	}

	private renderEventBanner(viewModel: MailViewerViewModel): Children {
		const eventAttachment = viewModel.getCalendarEventAttachment()
		const groupColors: Map<Id, string> = getGroupColors(
			viewModel.logins.getUserController().user._id,
			viewModel.logins.getUserController().userSettingsGroupRoot,
		)

		return eventAttachment
			? m(
					"." + responsiveCardHMargin(),
					m(EventBanner, {
						iCalContents: eventAttachment.contents,
						recipient: eventAttachment.recipient,
						mail: viewModel.mail,
						eventsRepository: viewModel.eventsRepository,
						groupColors,
					} satisfies EventBannerAttrs),
				)
			: null
	}

	private renderDetails(attrs: MailViewerHeaderAttrs, { bubbleMenuWidth }: { bubbleMenuWidth: number }): Children {
		const { viewModel, createMailAddressContextButtons } = attrs
		const envelopeSender = viewModel.getDifferentEnvelopeSender()
		const displayedSender = viewModel.getDisplayedSender()

		return m("." + responsiveCardHPadding(), liveDataAttrs(), [
			m(
				".mt-s",
				displayedSender == null
					? null
					: [
							m(".small.b", lang.get("from_label")),
							m(RecipientButton, {
								label: getMailAddressDisplayText(displayedSender.name, displayedSender.address, false),
								click: createAsyncDropdown({
									lazyButtons: () =>
										createMailAddressContextButtons({
											mailAddress: displayedSender,
											defaultInboxRuleField: InboxRuleType.FROM_EQUALS,
										}),
									width: bubbleMenuWidth,
								}),
							}),
						],
				envelopeSender
					? [
							m(".small.b", lang.get("sender_label")),
							m(RecipientButton, {
								label: getMailAddressDisplayText("", envelopeSender, false),
								click: createAsyncDropdown({
									lazyButtons: async () => {
										const childElements = [
											{
												info: lang.get("envelopeSenderInfo_msg"),
												center: false,
												bold: false,
											},
											{
												info: envelopeSender,
												center: true,
												bold: true,
											},
										]
										const contextButtons = await createMailAddressContextButtons({
											mailAddress: {
												address: envelopeSender,
												name: "",
											},
											defaultInboxRuleField: InboxRuleType.FROM_EQUALS,
											createContact: false,
										})
										return [...childElements, ...contextButtons]
									},
									width: bubbleMenuWidth,
								}),
							}),
						]
					: null,
			),
			m(
				".mt-s",
				viewModel.getToRecipients().length
					? [
							m(".small.b", lang.get("to_label")),
							m(
								".flex.col.mt-between-s",
								viewModel.getToRecipients().map((recipient) =>
									m(
										".flex",
										m(RecipientButton, {
											label: getMailAddressDisplayText(recipient.name, recipient.address, false),
											click: createAsyncDropdown({
												lazyButtons: () =>
													createMailAddressContextButtons({
														mailAddress: recipient,
														defaultInboxRuleField: InboxRuleType.RECIPIENT_TO_EQUALS,
													}),
												width: bubbleMenuWidth,
											}),
											// To wrap text inside flex container, we need to allow element to shrink and pick own width
											style: {
												flex: "0 1 auto",
											},
										}),
									),
								),
							),
						]
					: null,
			),
			m(
				".mt-s",
				viewModel.getCcRecipients().length
					? [
							m(".small.b", lang.get("cc_label")),
							m(
								".flex-start.flex-wrap",
								viewModel.getCcRecipients().map((recipient) =>
									m(RecipientButton, {
										label: getMailAddressDisplayText(recipient.name, recipient.address, false),
										click: createAsyncDropdown({
											lazyButtons: () =>
												createMailAddressContextButtons({
													mailAddress: recipient,
													defaultInboxRuleField: InboxRuleType.RECIPIENT_CC_EQUALS,
												}),
											width: bubbleMenuWidth,
										}),
										style: {
											flex: "0 1 auto",
										},
									}),
								),
							),
						]
					: null,
			),
			m(
				".mt-s",
				viewModel.getBccRecipients().length
					? [
							m(".small.b", lang.get("bcc_label")),
							m(
								".flex-start.flex-wrap",
								viewModel.getBccRecipients().map((recipient) =>
									m(RecipientButton, {
										label: getMailAddressDisplayText(recipient.name, recipient.address, false),
										click: createAsyncDropdown({
											lazyButtons: () =>
												createMailAddressContextButtons({
													mailAddress: recipient,
													defaultInboxRuleField: InboxRuleType.RECIPIENT_BCC_EQUALS,
												}),
											width: bubbleMenuWidth,
										}),
										style: {
											flex: "0 1 auto",
										},
									}),
								),
							),
						]
					: null,
			),
			m(
				".mt-s",
				viewModel.getReplyTos().length
					? [
							m(".small.b", lang.get("replyTo_label")),
							m(
								".flex-start.flex-wrap",
								viewModel.getReplyTos().map((recipient) =>
									m(RecipientButton, {
										label: getMailAddressDisplayText(recipient.name, recipient.address, false),
										click: createAsyncDropdown({
											lazyButtons: () =>
												createMailAddressContextButtons({
													mailAddress: recipient,
													defaultInboxRuleField: null,
												}),
											width: bubbleMenuWidth,
										}),
										style: {
											flex: "0 1 auto",
										},
									}),
								),
							),
						]
					: null,
			),
		])
	}

	private renderAttachments(viewModel: MailViewerViewModel, importFile: (file: TutanotaFile) => void): Children {
		// Show a loading symbol if we are loading attachments
		if (viewModel.isLoadingAttachments() && !viewModel.isConnectionLost()) {
			return m(".flex." + responsiveCardHMargin(), [
				m(".flex-v-center.pl-button", progressIcon()),
				m(".small.flex-v-center.plr.button-height", lang.get("loading_msg")),
			])
		} else {
			const attachments = viewModel.getNonInlineAttachments()
			const attachmentCount = attachments.length

			// Do nothing if we have no attachments
			if (attachmentCount === 0) {
				return null
			}

			// Get the total size of the attachments
			let totalAttachmentSize = 0
			for (const attachment of attachments) {
				totalAttachmentSize += Number(attachment.size)
			}

			return [
				m(".flex.mt-s.mb-s" + "." + responsiveCardHMargin(), liveDataAttrs(), [
					attachmentCount === 1
						? // If we have exactly one attachment, just show the attachment
							this.renderAttachmentContainer(viewModel, attachments, importFile)
						: // Otherwise, we show the number of attachments and its total size along with a show all button
							m(ExpanderButton, {
								label: lang.makeTranslation(
									"attachmentAmount_label",
									lang.get("attachmentAmount_label", { "{amount}": attachmentCount + "" }) + ` (${formatStorageSize(totalAttachmentSize)})`,
								),
								style: {
									"padding-top": "inherit",
									height: "inherit",
									"min-height": "inherit",
									"text-decoration": "none",
									"font-weight": "normal",
								},
								expanded: this.filesExpanded,
								color: theme.on_surface,
								isBig: true,
								isUnformattedLabel: true,
								onExpandedChange: (change) => {
									this.filesExpanded = change
								},
							}),
				]),

				// if we have more than one attachment, list them here in this expander panel
				attachments.length > 1
					? m(
							ExpanderPanel,
							{
								expanded: this.filesExpanded,
							},
							m(".flex.col." + responsiveCardHMargin(), [
								m(".flex.flex-wrap.gap-hpad", this.renderAttachmentContainer(viewModel, attachments, importFile)),
								isIOSApp()
									? null
									: m(
											".flex",
											m(Button, {
												label: "saveAll_action",
												type: ButtonType.Secondary,
												click: () => viewModel.downloadAll(),
											}),
										),
							]),
						)
					: null,
			]
		}
	}

	private renderAttachmentContainer(viewModel: MailViewerViewModel, attachments: TutanotaFile[], importFile: (file: TutanotaFile) => void): Children {
		return attachments.map((attachment) => {
			const attachmentType = getAttachmentType(attachment.mimeType ?? "")
			return m(AttachmentBubble, {
				attachment,
				remove: null,
				download:
					isAndroidApp() || isDesktop()
						? () => viewModel.downloadAndOpenAttachment(attachment, false)
						: () => viewModel.downloadAndOpenAttachment(attachment, true),
				open: isAndroidApp() || isDesktop() ? () => viewModel.downloadAndOpenAttachment(attachment, true) : null,
				fileImport: viewModel.canImportFile(attachment) ? () => importFile(attachment) : null,
				type: attachmentType,
			})
		})
	}

	private tutaoBadge(viewModel: MailViewerViewModel): Children {
		return isTutanotaTeamMail(viewModel.mail)
			? m(
					Badge,
					{
						classes: ".mr-s",
					},
					companyTeamLabel,
				)
			: null
	}

	private renderPhishingWarning(viewModel: MailViewerViewModel): Children {
		return m(InfoBanner, {
			message: "phishingMessageBody_msg",
			icon: Icons.Warning,
			type: BannerType.Warning,
			helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.Phishing : null,
			buttons: [
				{
					label: "markAsNotPhishing_action",
					click: () => viewModel.markAsNotPhishing().then(() => m.redraw()),
				},
			],
		})
	}

	private renderNewsletterBanner(viewModel: MailViewerViewModel): Children | null {
		if (viewModel.hasListUnsubscribeHeader()) {
			return m(InfoBanner, {
				message: viewModel.isListUnsubscribe() ? "newsletterBanner_msg" : "newsletterBannerUnsubscribed_msg",
				icon: Icons.PricingMail,
				type: BannerType.Info,
				buttons: viewModel.isListUnsubscribe()
					? [
							{
								label: "unsubscribe_action",
								click: () => unsubscribe(viewModel).then(() => m.redraw()),
							},
						]
					: [],
			})
		}
	}

	private renderHardAuthenticationFailWarning(viewModel: MailViewerViewModel): Children {
		return m(InfoBanner, {
			message: "mailAuthFailed_msg",
			icon: Icons.Warning,
			helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.MailAuth : null,
			type: BannerType.Warning,
			buttons: [
				{
					label: "close_alt",
					click: () => viewModel.setWarningDismissed(true),
				},
			],
		})
	}

	private renderSoftAuthenticationFailWarning(viewModel: MailViewerViewModel): Children {
		const buttons: ReadonlyArray<BannerButtonAttrs | null> = [
			{
				label: "close_alt",
				click: () => viewModel.setWarningDismissed(true),
			},
		]
		return m(InfoBanner, {
			message: () =>
				viewModel.mail.differentEnvelopeSender
					? lang.get("mailAuthMissingWithTechnicalSender_msg", {
							"{sender}": viewModel.mail.differentEnvelopeSender,
						})
					: lang.get("mailAuthMissing_label"),
			icon: Icons.Warning,
			helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.MailAuth : null,
			buttons: buttons,
		})
	}

	private renderDeprecatedPublicKeyBanner(viewModel: MailViewerViewModel): Children {
		const buttons: ReadonlyArray<BannerButtonAttrs | null> = [
			{
				label: "close_alt",
				click: () => viewModel.setWarningDismissed(true),
			},
		]
		return m(InfoBanner, {
			message: () => lang.get("deprecatedKeyWarning_msg"),
			icon: Icons.Warning,
			helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.DeprecatedKey : null,
			buttons: buttons,
		})
	}

	private renderExternalContentBanner(attrs: MailViewerHeaderAttrs): Children | null {
		// only show banner when there are blocked images and the user hasn't made a decision about how to handle them
		if (attrs.viewModel.getContentBlockingStatus() !== ContentBlockingStatus.Block) {
			return null
		}

		const showButton: BannerButtonAttrs = {
			label: "showBlockedContent_action",
			click: () => attrs.viewModel.setContentBlockingStatus(ContentBlockingStatus.Show),
		}
		const alwaysOrNeverAllowButtons = attrs.viewModel.canPersistBlockingStatus()
			? [
					attrs.viewModel.checkMailAuthenticationStatus(MailAuthenticationStatus.AUTHENTICATED)
						? {
								label: "allowExternalContentSender_action" as const,
								click: () => attrs.viewModel.setContentBlockingStatus(ContentBlockingStatus.AlwaysShow),
							}
						: null,
					{
						label: "blockExternalContentSender_action" as const,
						click: () => attrs.viewModel.setContentBlockingStatus(ContentBlockingStatus.AlwaysBlock),
					},
				].filter(isNotNull)
			: []
		// on narrow screens the buttons will end up on 2 lines if there are too many, this looks bad.
		const maybeDropdownButtons: ReadonlyArray<BannerButtonAttrs> =
			styles.isSingleColumnLayout() && alwaysOrNeverAllowButtons.length > 1
				? [
						{
							label: "more_label",
							click: createAsyncDropdown({
								width: 216,
								lazyButtons: async () => resolveMaybeLazy(alwaysOrNeverAllowButtons),
							}),
						},
					]
				: alwaysOrNeverAllowButtons
		return m(InfoBanner, {
			message: "contentBlocked_msg",
			icon: Icons.Picture,
			helpLink: canSeeTutaLinks(attrs.viewModel.logins) ? InfoLink.LoadImages : null,
			buttons: [showButton, ...maybeDropdownButtons],
		})
	}

	private moreButton(attrs: MailViewerHeaderAttrs): Children {
		return m(IconButton, {
			title: "more_label",
			icon: Icons.More,
			click: this.prepareMoreActions(attrs),
		})
	}

	private prepareMoreActions({ viewModel, moreActions, actions }: MailViewerHeaderAttrs) {
		return createDropdown({
			lazyButtons: () => {
				let actionButtons: DropdownButtonAttrs[] = []
				const { delete: deleteAction, trash: trashAction, move: moveAction } = actions

				const deleteButton: DropdownButtonAttrs | null =
					deleteAction != null
						? {
								label: "delete_action",
								click: () => deleteAction(),
								icon: Icons.DeleteForever,
							}
						: null
				const trashButton: DropdownButtonAttrs | null =
					trashAction != null
						? {
								label: "trash_action",
								click: () => trashAction(),
								icon: Icons.Trash,
							}
						: null
				const deleteOrTrashButton = deleteButton ?? trashButton

				const moveButton: DropdownButtonAttrs | null =
					moveAction != null
						? {
								label: "move_action",
								click: (_: MouseEvent, dom: HTMLElement) => moveAction(dom),
								icon: Icons.Folder,
							}
						: null

				const labelButton: DropdownButtonAttrs | null = viewModel.mailModel.canAssignLabels()
					? {
							label: "assignLabel_action",
							click: (_, dom) => {
								const popup = new LabelsPopup(
									dom,
									dom.getBoundingClientRect(),
									styles.isDesktopLayout() ? 300 : 200,
									viewModel.mailModel.getLabelsForMails([viewModel.mail]),
									viewModel.mailModel.getLabelStatesForMails([viewModel.mail]),
									(addedLabels, removedLabels) => viewModel.mailModel.applyLabels([viewModel.mail._id], addedLabels, removedLabels),
								)
								// waiting for the dropdown to be closed
								setTimeout(() => {
									popup.show()
								}, 16)
							},
							icon: Icons.Label,
						}
					: null

				if (viewModel.isScheduled()) {
					actionButtons.push({
						label: "cancelSend_action",
						click: () => viewModel.unscheduleMail(),
						icon: Icons.XCross,
					})
				} else if (viewModel.isDraftMail()) {
					actionButtons.push({
						label: "edit_action",
						click: () => editDraft(viewModel),
						icon: Icons.Edit,
					})
				} else {
					if (viewModel.canReply()) {
						actionButtons.push({
							label: "reply_action",
							click: () => viewModel.reply(false),
							icon: Icons.Reply,
						})
					}
					if (viewModel.canReplyAll()) {
						actionButtons.push({
							label: "replyAll_action",
							click: () => viewModel.reply(true),
							icon: Icons.ReplyAll,
						})
					}
					if (viewModel.canForward()) {
						actionButtons.push({
							label: "forward_action",
							click: () => viewModel.forward(),
							icon: Icons.Forward,
						})
					}
				}

				if (moveButton != null) {
					actionButtons.push(moveButton)
				}
				if (labelButton != null) {
					actionButtons.push(labelButton)
				}
				if (deleteOrTrashButton != null) {
					actionButtons.push(deleteOrTrashButton)
				}

				if (viewModel.isUnread()) {
					actionButtons.push({
						label: "markRead_action",
						click: () => viewModel.setUnread(false),
						icon: Icons.Eye,
					})
				} else {
					actionButtons.push({
						label: "markUnread_action",
						click: () => viewModel.setUnread(true),
						icon: Icons.NoEye,
					})
				}

				if (viewModel.isDraftMail()) {
					addToggleLightModeButtonAttrs(viewModel, actionButtons)
				} else {
					actionButtons.push(...singleMailViewerMoreActions(viewModel, moreActions))
				}

				return actionButtons
			},
			width: 300,
		})
	}

	getRecipientEmailAddress({ viewModel }: MailViewerHeaderAttrs): Children {
		const relevantRecipient = viewModel.getRelevantRecipient()

		if (relevantRecipient) {
			const numberOfAllRecipients = viewModel.getNumberOfRecipients()
			return m(
				".flex.click.small.ml-between-s.items-center",
				{
					style: {
						// use this to allow the container to shrink, otherwise it doesn't want to cut the recipient address
						minWidth: "20px",
					},
				},
				[
					m("", lang.get("mailViewerRecipients_label")),
					m(".text-ellipsis", this.renderAddress(viewModel, "", relevantRecipient.address)),
					m(".flex.no-wrap", [
						numberOfAllRecipients > 1 ? `+ ${numberOfAllRecipients - 1}` : null,
						m(Icon, {
							icon: BootIcons.Expand,
							container: "div",
							style: {
								fill: theme.on_surface,
								transform: this.detailsExpanded ? "rotate(180deg)" : "",
							},
						}),
					]),
				],
			)
		} else {
			return ""
		}
	}
}
