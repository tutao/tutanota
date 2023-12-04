import m, { Children, Component, Vnode } from "mithril"
import { InfoLink, lang } from "../../misc/LanguageViewModel.js"
import { getFolderIconByType, getMailAddressDisplayText, getSenderAddressDisplay, isTutanotaTeamMail } from "../model/MailUtils.js"
import { theme } from "../../gui/theme.js"
import { styles } from "../../gui/styles.js"
import { ExpanderPanel } from "../../gui/base/Expander.js"
import { File as TutanotaFile } from "../../api/entities/tutanota/TypeRefs.js"
import { BannerType, InfoBanner } from "../../gui/base/InfoBanner.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { EventBanner, EventBannerAttrs } from "./EventBanner.js"
import { RecipientButton } from "../../gui/base/RecipientButton.js"
import { createAsyncDropdown, createDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { InboxRuleType, Keys, MailAuthenticationStatus, TabIndex } from "../../api/common/TutanotaConstants.js"
import { Icon, progressIcon } from "../../gui/base/Icon.js"
import { formatDateWithWeekday, formatDateWithWeekdayAndYear, formatStorageSize, formatTime } from "../../misc/Formatter.js"
import { isAndroidApp, isDesktop, isIOSApp } from "../../api/common/Env.js"
import { Button, ButtonAttrs, ButtonType } from "../../gui/base/Button.js"
import Badge from "../../gui/base/Badge.js"
import { ContentBlockingStatus, MailViewerViewModel } from "./MailViewerViewModel.js"
import { canSeeTutaLinks, createMoreSecondaryButtonAttrs } from "../../gui/base/GuiUtils.js"
import { isNotNull, noOp } from "@tutao/tutanota-utils"
import { IconButton } from "../../gui/base/IconButton.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { editDraft, mailViewerMoreActions } from "./MailViewerUtils.js"
import { liveDataAttrs } from "../../gui/AriaUtils.js"
import { isKeyPressed } from "../../misc/KeyManager.js"
import { AttachmentBubble } from "../../gui/AttachmentBubble.js"
import { responsiveCardHMargin, responsiveCardHPadding } from "../../gui/cards.js"

export interface MailAddressAndName {
	name: string
	address: string
}

export type MailAddressDropdownCreator = (args: {
	mailAddress: MailAddressAndName
	defaultInboxRuleField: InboxRuleType | null
	createContact?: boolean
}) => Promise<Array<DropdownButtonAttrs>>

export interface MailViewerHeaderAttrs {
	// Passing the whole viewModel because there are a lot of separate bits we might need.
	// If we want to reuse this view we should probably pass everything on its own.
	viewModel: MailViewerViewModel
	createMailAddressContextButtons: MailAddressDropdownCreator
	isPrimary: boolean
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
			this.renderFolderText(viewModel),
			this.renderAddressesAndDate(viewModel, attrs, dateTime, dateTimeFull),
			m(
				ExpanderPanel,
				{
					expanded: this.detailsExpanded,
				},
				this.renderDetails(attrs, { bubbleMenuWidth: 300 }),
			),
			this.renderAttachments(viewModel),
			this.renderConnectionLostBanner(viewModel),
			this.renderEventBanner(viewModel),
			this.renderBanners(attrs),
		])
	}

	private renderFolderText(viewModel: MailViewerViewModel) {
		const folderInfo = viewModel.getFolderInfo()
		if (!folderInfo) return null
		const icon = getFolderIconByType(folderInfo.folderType)

		return viewModel.getFolderMailboxText()
			? m(".flex.small.plr-l.mt-xs.mb-xs.ml-between-s", [
					m(".b", m("", lang.get("location_label"))),
					m(Icon, {
						icon,
						container: "div",
						style: {
							fill: theme.content_button,
						},
					}),
					m(".span.mr-s", folderInfo.name),
			  ])
			: null
	}

	private renderAddressesAndDate(viewModel: MailViewerViewModel, attrs: MailViewerHeaderAttrs, dateTime: string, dateTimeFull: string) {
		const folderInfo = viewModel.getFolderInfo()
		if (!folderInfo) return null

		return m(
			".flex.mt-xs.click.col",
			{
				class: responsiveCardHMargin(),
				role: "button",
				"aria-pressed": String(this.detailsExpanded),
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
				m(".small.flex.flex-wrap.items-start", [m("span.text-break", getSenderAddressDisplay(viewModel.mail))]),
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
									icon: Icons.Lock,
									container: "div",
									style: {
										fill: theme.content_button,
									},
							  })
							: null,

						m(Icon, {
							icon: getFolderIconByType(folderInfo.folderType),
							container: "div",
							style: {
								fill: theme.content_button,
							},
							hoverText: folderInfo.name,
						}),
						m(".small.font-weight-600.selectable.no-wrap", { style: { color: theme.content_button } }, [
							m(".noprint", dateTime), // show the short date when viewing
							m(".noscreen", dateTimeFull), // show the date with year when printing
						]),
					]),
				]),
			],
		)
	}

	private renderSubjectActionsLine(attrs: MailViewerHeaderAttrs) {
		const { viewModel } = attrs
		const classes = this.makeSubjectActionsLineClasses()

		return m(
			classes,
			{
				role: "button",
				"mail-expander": "true",
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
				m(
					".flex.flex-grow.align-self-start.items-start",
					{
						class: styles.isSingleColumnLayout() ? "mt-m" : "mt",
					},
					[
						viewModel.isUnread() ? this.renderUnreadDot() : null,
						viewModel.isDraftMail()
							? m(
									".mr-xs.align-self-center",
									m(Icon, {
										icon: Icons.Edit,
										container: "div",
										style: {
											fill: theme.content_button,
										},
									}),
							  )
							: null,
						this.tutaoBadge(viewModel),
						m("span.text-break" + (viewModel.isUnread() ? ".font-weight-600" : ""), viewModel.mail.sender.name),
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
					},
					this.moreButton(attrs),
				),
			],
		)
	}

	private renderUnreadDot(): Children {
		return m(
			".flex.flex-no-grow.no-shrink.pr-s",
			{
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
		// we don't wrap it in a single element because our container might depend on us being separate children for margins
		return [
			m(
				"." + responsiveCardHMargin(),
				this.renderPhishingWarning(viewModel) ||
					this.renderHardAuthenticationFailWarning(viewModel) ||
					this.renderSoftAuthenticationFailWarning(viewModel),
			),
			m("." + responsiveCardHMargin(), this.renderExternalContentBanner(attrs)),
			m("hr.hr.mt-xs." + responsiveCardHMargin()),
		].filter(Boolean)
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

	private renderEventBanner(viewModel: MailViewerViewModel): Children {
		const eventAttachment = viewModel.getCalendarEventAttachment()
		return eventAttachment
			? m(
					"." + responsiveCardHMargin(),
					m(EventBanner, {
						contents: eventAttachment.contents,
						recipient: eventAttachment.recipient,
						mail: viewModel.mail,
					} satisfies EventBannerAttrs),
			  )
			: null
	}

	private renderDetails(attrs: MailViewerHeaderAttrs, { bubbleMenuWidth }: { bubbleMenuWidth: number }): Children {
		const { viewModel, createMailAddressContextButtons } = attrs
		const envelopeSender = viewModel.getDifferentEnvelopeSender()
		return m("." + responsiveCardHPadding(), liveDataAttrs(), [
			m(
				".mt-s",
				m(".small.b", lang.get("from_label")),
				m(RecipientButton, {
					label: getMailAddressDisplayText(viewModel.getSender().name, viewModel.getSender().address, false),
					click: createAsyncDropdown({
						lazyButtons: () =>
							createMailAddressContextButtons({
								mailAddress: viewModel.getSender(),
								defaultInboxRuleField: InboxRuleType.FROM_EQUALS,
							}),
						width: bubbleMenuWidth,
					}),
				}),
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

	private renderAttachments(viewModel: MailViewerViewModel): Children {
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
				m(".flex" + "." + responsiveCardHMargin(), liveDataAttrs(), [
					attachmentCount === 1
						? // If we have exactly one attachment, just show the attachment
						  this.renderAttachmentContainer(viewModel, attachments)
						: // Otherwise, we show the number of attachments and its total size along with a show all button
						  [
								m(
									".flex.center-vertically.click.flex-grow.ml-between-s.mt-xs",
									{
										role: "button",
										"aria-pressed": String(this.detailsExpanded),
										tabindex: TabIndex.Default,
										onclick: () => (this.filesExpanded = !this.filesExpanded),
										onkeydown: (e: KeyboardEvent) => {
											if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
												this.filesExpanded = !this.filesExpanded
												e.preventDefault()
											}
										},
									},
									[
										m(
											"",
											lang.get("attachmentAmount_label", { "{amount}": attachmentCount + "" }) +
												` (${formatStorageSize(totalAttachmentSize)})`,
										),
										m(Icon, {
											icon: BootIcons.Expand,
											style: {
												fill: theme.content_fg,
												transform: this.filesExpanded ? "rotate(180deg)" : "",
											},
										}),
									],
								),
						  ],
				]),

				// if we have more than one attachment, list them here in this expander panel
				attachments.length > 1
					? m(
							ExpanderPanel,
							{
								expanded: this.filesExpanded,
							},
							m(".flex.col." + responsiveCardHMargin(), [
								m(".flex.flex-wrap.column-gap", this.renderAttachmentContainer(viewModel, attachments)),
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

	private renderAttachmentContainer(viewModel: MailViewerViewModel, attachments: TutanotaFile[]): Children {
		return attachments.map((attachment) =>
			m(AttachmentBubble, {
				attachment,
				remove: null,
				download:
					isAndroidApp() || isDesktop()
						? () => viewModel.downloadAndOpenAttachment(attachment, false)
						: () => viewModel.downloadAndOpenAttachment(attachment, true),
				open: isAndroidApp() || isDesktop() ? () => viewModel.downloadAndOpenAttachment(attachment, true) : null,
			}),
		)
	}

	private tutaoBadge(viewModel: MailViewerViewModel): Children {
		return isTutanotaTeamMail(viewModel.mail)
			? m(
					Badge,
					{
						classes: ".mr-s",
					},
					"Tuta Team",
			  )
			: null
	}

	private renderPhishingWarning(viewModel: MailViewerViewModel): Children | null {
		if (viewModel.isMailSuspicious()) {
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
	}

	private renderHardAuthenticationFailWarning(viewModel: MailViewerViewModel): Children | null {
		if (!viewModel.isWarningDismissed() && viewModel.mail.authStatus === MailAuthenticationStatus.HARD_FAIL) {
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
	}

	private renderSoftAuthenticationFailWarning(viewModel: MailViewerViewModel): Children | null {
		if (!viewModel.isWarningDismissed() && viewModel.mail.authStatus === MailAuthenticationStatus.SOFT_FAIL) {
			return m(InfoBanner, {
				message: () =>
					viewModel.mail.differentEnvelopeSender
						? lang.get("mailAuthMissingWithTechnicalSender_msg", {
								"{sender}": viewModel.mail.differentEnvelopeSender,
						  })
						: lang.get("mailAuthMissing_label"),
				icon: Icons.Warning,
				helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.MailAuth : null,
				buttons: [
					{
						label: "close_alt",
						click: () => viewModel.setWarningDismissed(true),
					},
				],
			})
		} else {
			return null
		}
	}

	private renderExternalContentBanner(attrs: MailViewerHeaderAttrs): Children | null {
		// only show banner when there are blocked images and the user hasn't made a decision about how to handle them
		if (attrs.viewModel.getContentBlockingStatus() !== ContentBlockingStatus.Block) {
			return null
		}

		const showButton: ButtonAttrs = {
			label: "showBlockedContent_action",
			click: () => attrs.viewModel.setContentBlockingStatus(ContentBlockingStatus.Show),
		}
		const alwaysOrNeverAllowButtons = attrs.viewModel.canPersistBlockingStatus()
			? [
					attrs.viewModel.isMailAuthenticated()
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
		const maybeDropdownButtons =
			styles.isSingleColumnLayout() && alwaysOrNeverAllowButtons.length > 1
				? [createMoreSecondaryButtonAttrs(alwaysOrNeverAllowButtons, 216)]
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

	private prepareMoreActions({ viewModel }: MailViewerHeaderAttrs) {
		return createDropdown({
			lazyButtons: () => {
				let actionButtons: DropdownButtonAttrs[] = []
				if (viewModel.isDraftMail()) {
					actionButtons.push({
						label: "edit_action",
						click: () => editDraft(viewModel),
						icon: Icons.Edit,
					})
					actionButtons.push({
						label: "move_action",
						click: (_: MouseEvent, dom: HTMLElement) => showMoveMailsDropdown(viewModel.mailModel, dom.getBoundingClientRect(), [viewModel.mail]),
						icon: Icons.Folder,
					})
					actionButtons.push({
						label: "delete_action",
						click: () => promptAndDeleteMails(viewModel.mailModel, [viewModel.mail], noOp),
						icon: Icons.Trash,
					})
				} else {
					if (viewModel.canForwardOrMove()) {
						actionButtons.push({
							label: "reply_action",
							click: () => viewModel.reply(false),
							icon: Icons.Reply,
						})

						if (viewModel.canReplyAll()) {
							actionButtons.push({
								label: "replyAll_action",
								click: () => viewModel.reply(true),
								icon: Icons.ReplyAll,
							})
						}

						actionButtons.push({
							label: "forward_action",
							click: () => viewModel.forward(),
							icon: Icons.Forward,
						})
						actionButtons.push({
							label: "move_action",
							click: (_: MouseEvent, dom: HTMLElement) =>
								showMoveMailsDropdown(viewModel.mailModel, dom.getBoundingClientRect(), [viewModel.mail]),
							icon: Icons.Folder,
						})
					}

					actionButtons.push({
						label: "delete_action",
						click: () => promptAndDeleteMails(viewModel.mailModel, [viewModel.mail], noOp),
						icon: Icons.Trash,
					})

					actionButtons.push(...mailViewerMoreActions(viewModel))
				}

				return actionButtons
			},
			width: 300,
		})
	}

	getRecipientEmailAddress({ viewModel }: MailViewerHeaderAttrs) {
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
					m(".text-ellipsis", relevantRecipient.address),
					m(".flex.no-wrap", [
						numberOfAllRecipients > 1 ? `+ ${numberOfAllRecipients - 1}` : null,
						m(Icon, {
							icon: BootIcons.Expand,
							container: "div",
							style: {
								fill: theme.content_fg,
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
