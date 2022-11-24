import m, {Children, Component, Vnode} from "mithril"
import {InfoLink, lang} from "../../misc/LanguageViewModel.js"
import {getMailAddressDisplayText, getSenderHeading, isTutanotaTeamMail} from "../model/MailUtils.js"
import {theme} from "../../gui/theme.js"
import {styles} from "../../gui/styles.js"
import {ExpanderPanel} from "../../gui/base/Expander.js"
import {File as TutanotaFile} from "../../api/entities/tutanota/TypeRefs.js"
import {BannerType, InfoBanner} from "../../gui/base/InfoBanner.js"
import {Icons} from "../../gui/base/icons/Icons.js"
import {EventBanner} from "./EventBanner.js"
import {RecipientButton} from "../../gui/base/RecipientButton.js"
import {createAsyncDropdown, createDropdown, DomRectReadOnlyPolyfilled, DropdownButtonAttrs} from "../../gui/base/Dropdown.js"
import {InboxRuleType, Keys, MailAuthenticationStatus, TabIndex} from "../../api/common/TutanotaConstants.js"
import {Icon, progressIcon} from "../../gui/base/Icon.js"
import {formatDateWithWeekday, formatDateWithWeekdayAndYear, formatStorageSize, formatTime} from "../../misc/Formatter.js"
import {isAndroidApp, isDesktop, isIOSApp} from "../../api/common/Env.js"
import {Button, ButtonAttrs, ButtonColor, ButtonType} from "../../gui/base/Button.js"
import {size} from "../../gui/size.js"
import Badge from "../../gui/base/Badge.js"
import {ContentBlockingStatus, MailViewerViewModel} from "./MailViewerViewModel.js"
import {createMoreSecondaryButtonAttrs} from "../../gui/base/GuiUtils.js"
import {isNotNull, noOp, ofClass} from "@tutao/tutanota-utils"
import {IconButton} from "../../gui/base/IconButton.js"
import {promptAndDeleteMails, showMoveMailsDropdown} from "./MailGuiUtils.js"
import {UserError} from "../../api/main/UserError.js"
import {showUserError} from "../../misc/ErrorHandlerImpl.js"
import {BootIcons} from "../../gui/base/icons/BootIcons.js"
import {editDraft, mailViewerMoreActions, makeAssignMailsButtons} from "./MailViewerUtils.js"
import {liveDataAttrs} from "../../gui/AriaUtils.js"
import {isKeyPressed} from "../../misc/KeyManager.js"

export interface MailAddressAndName {
	name: string
	address: string
}

export type MailAddressDropdownCreator = (args: {
	mailAddress: MailAddressAndName,
	defaultInboxRuleField: InboxRuleType | null,
	createContact?: boolean,
}) => Promise<Array<DropdownButtonAttrs>>

export interface MailViewerHeaderAttrs {
	// Passing the whole viewModel because there are a lot of separate bits we might need.
	// If we want to reuse this view we should probably pass everything on its own.
	viewModel: MailViewerViewModel
	createMailAddressContextButtons: MailAddressDropdownCreator
}

/** The upper part of the mail viewer, everything but the mail body itself. */
export class MailViewerHeader implements Component<MailViewerHeaderAttrs> {
	private detailsExpanded = false
	private filesExpanded = false

	view({attrs}: Vnode<MailViewerHeaderAttrs>): Children {
		const {viewModel} = attrs
		const dateTime = formatDateWithWeekday(viewModel.mail.receivedDate) + " • " + formatTime(viewModel.mail.receivedDate)
		const dateTimeFull = formatDateWithWeekdayAndYear(viewModel.mail.receivedDate) + " • " + formatTime(viewModel.mail.receivedDate)

		if (styles.isSingleColumnLayout()) {
			return m(".header.mlr-safe-inset.mt", [
				this.renderFolderText(viewModel),
				this.renderAddressesAndDate(viewModel, attrs, dateTime, dateTimeFull),
				m(ExpanderPanel, {
					expanded: this.detailsExpanded,
				}, this.renderDetails(attrs, {bubbleMenuWidth: 300})),
				m(".plr-l", this.renderAttachments(viewModel)),
				this.renderConnectionLostBanner(viewModel),
				this.renderEventBanner(viewModel),
				this.renderBanners(attrs),
				m("", this.renderSubject(viewModel)),
			])
		} else {
			return m(".header.mlr-safe-inset", [
				this.renderSubjectActionsLine(viewModel, attrs),
				this.renderFolderText(viewModel),
				this.renderAddressesAndDate(viewModel, attrs, dateTime, dateTimeFull),
				m(ExpanderPanel, {
					expanded: this.detailsExpanded,
				}, this.renderDetails(attrs, {bubbleMenuWidth: 300})),
				m(".plr-l", this.renderAttachments(viewModel)),
				this.renderConnectionLostBanner(viewModel),
				this.renderEventBanner(viewModel),
				this.renderBanners(attrs)
			])
		}
	}

	private renderFolderText(viewModel: MailViewerViewModel) {
		return viewModel.getFolderText()
			? m(".flex.small.plr-l.mt-xs.mb-xs.ml-between-s", [
				m(".b.mr-s", m("", lang.get("location_label"))),
				viewModel.getFolderText()
			])
			: null
	}

	private renderAddressesAndDate(viewModel: MailViewerViewModel, attrs: MailViewerHeaderAttrs, dateTime: string, dateTimeFull: string) {
		return m(".flex.plr-l.mt-xs.click.col", {
			role: "button",
			"aria-pressed": String(this.detailsExpanded),
			tabindex: TabIndex.Default,
			onclick: () => {
				this.detailsExpanded = !this.detailsExpanded
			},
			onkeydown: (e: KeyboardEvent) => {
				if (isKeyPressed(e.keyCode, Keys.SPACE, Keys.RETURN)) {
					this.detailsExpanded = !this.detailsExpanded
					e.preventDefault()
				}
			},
		}, [
			m(".small.flex.flex-wrap.items-start", [this.tutaoBadge(viewModel), m("span.text-break", getSenderHeading(viewModel.mail, false))]),
			m(".flex", [
				this.getRecipientEmailAddress(attrs),
				m(".flex-grow"),
				m(".flex.items-center.white-space-pre.ml-s", {
						// Orca refuses to read ut unless it's not focusable
						tabindex: TabIndex.Default,
						"aria-label": lang.get(viewModel.isConfidential() ? "confidential_action" : "nonConfidential_action") + ", " + dateTime,
					},
					[
						viewModel.isConfidential()
							? m(Icon, {
								icon: Icons.Lock,
								style: {
									fill: theme.content_fg,
								},
								// flex makes svg inside centered and not randomly somewhere
								class: "flex",
							})
							: null,
						m("small.date.content-fg.selectable",
							[
								m("span.noprint", dateTime), // show the short date when viewing
								m("span.noscreen", dateTimeFull), // show the date with year when printing
							]
						),
					],
				)
			]),
		])
	}

	private renderSubjectActionsLine(viewModel: MailViewerViewModel, attrs: MailViewerHeaderAttrs) {
		return m(".flex.items-start", [
			this.renderSubject(viewModel),
			this.actionButtons(attrs)
		])
	}

	private renderSubject(viewModel: MailViewerViewModel) {
		return m(
			".h5.subject.text-break.selectable.b.flex-grow.pl-l.pr",
			{
				"aria-label": lang.get("subject_label") + ", " + (viewModel.getSubject() || ""),
				style: {marginTop: "12px"},
			},
			viewModel.getSubject() || "",
		)
	}

	private renderBanners(attrs: MailViewerHeaderAttrs): Children {
		const {viewModel} = attrs
		return [
			this.renderPhishingWarning(viewModel) || this.renderHardAuthenticationFailWarning(viewModel) || this.renderSoftAuthenticationFailWarning(viewModel),
			this.renderExternalContentBanner(attrs),
			m("hr.hr.mt-xs.mlr-l"),
		].filter(Boolean)
	}

	private renderConnectionLostBanner(viewModel: MailViewerViewModel): Children {
		// If the mail body failed to load, then we show a message in the main column
		// If the mail body did load but not everything else, we show the message here
		if (viewModel.isConnectionLost()) {
			return m(InfoBanner, {
				message: "mailPartsNotLoaded_msg",
				icon: Icons.Warning,
				buttons: [
					{
						label: "retry_action",
						click: () => viewModel.loadAll()
					}
				]
			})
		} else {
			return null
		}
	}

	private renderEventBanner(viewModel: MailViewerViewModel): Children {
		const event = viewModel.getCalendarEventAttachment()
		return event
			? m(".plr-l", m(EventBanner, {
				event: event.event,
				method: event.method,
				recipient: event.recipient,
				mail: viewModel.mail,
			}))
			: null
	}

	private renderDetails(attrs: MailViewerHeaderAttrs, {bubbleMenuWidth}: {bubbleMenuWidth: number}): Children {
		const {viewModel, createMailAddressContextButtons} = attrs
		const envelopeSender = viewModel.getDifferentEnvelopeSender()
		return m(".plr-l" + liveDataAttrs(), [
				m(".mt-s", m(".small.b", lang.get("from_label")),
					m(RecipientButton, {
						label: getMailAddressDisplayText(viewModel.getSender().name, viewModel.getSender().address, false),
						click: createAsyncDropdown({
							lazyButtons: () => createMailAddressContextButtons({
								mailAddress: viewModel.getSender(),
								defaultInboxRuleField: InboxRuleType.FROM_EQUALS
							}), width: bubbleMenuWidth
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
										const contextButtons = await createMailAddressContextButtons(
											{
												mailAddress: {
													address: envelopeSender,
													name: "",
												},
												defaultInboxRuleField: InboxRuleType.FROM_EQUALS,
												createContact: false
											},
										)
										return [...childElements, ...contextButtons]
									}, width: bubbleMenuWidth
								}),
							}),
						]
						: null
				),
				m(".mt-s", viewModel.getToRecipients().length
					? [
						m(".small.b", lang.get("to_label")),
						m(".flex.col.mt-between-s", viewModel.getToRecipients().map(recipient =>
								m(".flex", m(RecipientButton, {
									label: getMailAddressDisplayText(recipient.name, recipient.address, false),
									click: createAsyncDropdown(
										{
											lazyButtons: () => createMailAddressContextButtons({
												mailAddress: recipient,
												defaultInboxRuleField: InboxRuleType.RECIPIENT_TO_EQUALS
											}), width: bubbleMenuWidth
										},
									),
									// To wrap text inside flex container, we need to allow element to shrink and pick own width
									style: {
										flex: "0 1 auto",
									},
								})),
							),
						),
					]
					: null),
				m(".mt-s", viewModel.getCcRecipients().length
					? [
						m(".small.b", lang.get("cc_label")),
						m(
							".flex-start.flex-wrap",
							viewModel.getCcRecipients().map(recipient =>
								m(RecipientButton, {
									label: getMailAddressDisplayText(recipient.name, recipient.address, false),
									click: createAsyncDropdown(
										{
											lazyButtons: () => createMailAddressContextButtons({
												mailAddress: recipient,
												defaultInboxRuleField: InboxRuleType.RECIPIENT_CC_EQUALS
											}), width: bubbleMenuWidth
										},
									),
									style: {
										flex: "0 1 auto",
									},
								}),
							),
						),
					]
					: null),
				m(".mt-s", viewModel.getBccRecipients().length
					? [
						m(".small.b", lang.get("bcc_label")),
						m(
							".flex-start.flex-wrap",
							viewModel.getBccRecipients().map(recipient =>
								m(RecipientButton, {
									label: getMailAddressDisplayText(recipient.name, recipient.address, false),
									click: createAsyncDropdown(
										{
											lazyButtons: () => createMailAddressContextButtons({
												mailAddress: recipient,
												defaultInboxRuleField: InboxRuleType.RECIPIENT_BCC_EQUALS
											}), width: bubbleMenuWidth
										},
									),
									style: {
										flex: "0 1 auto",
									},
								}),
							),
						),
					]
					: null),
				m(".mt-s", viewModel.getReplyTos().length
					? [
						m(".small.b", lang.get("replyTo_label")),
						m(
							".flex-start.flex-wrap",
							viewModel.getReplyTos().map(recipient =>
								m(RecipientButton, {
									label: getMailAddressDisplayText(recipient.name, recipient.address, false),
									click: createAsyncDropdown({
										lazyButtons: () => createMailAddressContextButtons({
											mailAddress: recipient,
											defaultInboxRuleField: null
										}), width: bubbleMenuWidth
									}),
									style: {
										flex: "0 1 auto",
									},
								}),
							),
						),
					]
					: null),
			]
		)
	}

	private renderAttachments(viewModel: MailViewerViewModel): Children {
		// Show a loading symbol if we are loading attachments
		if (viewModel.isLoadingAttachments() && !viewModel.isConnectionLost()) {
			return m(".flex", [m(".flex-v-center.pl-button", progressIcon()), m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))])
		} else {
			const attachments = viewModel.getNonInlineAttachments()
			const attachmentCount = attachments.length

			// Do nothing if we have no attachments
			if (attachmentCount === 0) {
				return null
			}

			// Get the total size of the attachments
			let totalAttachmentSize = 0
			attachments.forEach(attachment => totalAttachmentSize += Number(attachment.size))

			return [
				m(".flex" + liveDataAttrs(), [
					attachmentCount === 1
						// If we have exactly one attachment, just show the attachment
						? this.renderAttachmentContainer(viewModel, attachments)

						// Otherwise, we show the number of attachments and its total size along with a show all button
						: [
							m(".flex.center-vertically.click.flex-grow.ml-between-s.mt-xs", {
									role: "button",
									"aria-pressed": String(this.detailsExpanded),
									tabindex: TabIndex.Default,
									onclick: () => this.filesExpanded = !this.filesExpanded,
									onkeydown: (e: KeyboardEvent) => {
										if (isKeyPressed(e.keyCode, Keys.SPACE, Keys.RETURN)) {
											this.filesExpanded = !this.filesExpanded
											e.preventDefault()
										}
									},
								}, [
									m("", lang.get("attachmentAmount_label", {"{amount}": attachmentCount + ""}) + ` (${formatStorageSize(totalAttachmentSize)})`),
									m(Icon, {
										icon: BootIcons.Expand,
										style: {
											fill: theme.content_fg,
											transform: this.filesExpanded ? "rotate(180deg)" : ""
										},
									})
								]
							),
						],
				]),

				// if we have more than one attachment, list them here in this expander panel
				attachments.length > 1
					? m(ExpanderPanel, {
							expanded: this.filesExpanded,
						},
						m(".flex.col", [
								m(".flex.flex-wrap.column-gap", this.renderAttachmentContainer(viewModel, attachments)),
								isIOSApp()
									? null
									: m(".flex", m(Button, {
										label: "saveAll_action",
										type: ButtonType.Secondary,
										click: () => viewModel.downloadAll(),
									}))
							]
						))
					: null,
			]
		}
	}

	private renderAttachmentContainer(viewModel: MailViewerViewModel, attachments: TutanotaFile[]): Children {
		return attachments.map(attachment => this.renderAttachmentButton(viewModel, attachment))
	}

	private renderAttachmentButton(viewModel: MailViewerViewModel, attachment: TutanotaFile): Children {
		if (isAndroidApp() || isDesktop()) {
			return m(Button, {
				label: () => attachment.name,
				icon: () => Icons.Attachment,
				type: ButtonType.Bubble,
				staticRightText: `(${formatStorageSize(Number(attachment.size))})`,
				click: createDropdown({
					width: 200,
					overrideOrigin: (originalOrigin) => {
						// Bubble buttons use border so dropdown is misaligned by default
						return new DomRectReadOnlyPolyfilled(
							originalOrigin.left + size.bubble_border_width,
							originalOrigin.top,
							originalOrigin.width,
							originalOrigin.height
						)
					},
					lazyButtons: () => [
						{
							label: "open_action",
							click: () => viewModel.downloadAndOpenAttachment(attachment, true),
						},
						{
							label: "download_action",
							click: () => viewModel.downloadAndOpenAttachment(attachment, false),
						},
					]
				})
			})
		} else {
			return m(Button, {
				label: () => attachment.name,
				icon: () => Icons.Attachment,
				click: () => viewModel.downloadAndOpenAttachment(attachment, true),
				type: ButtonType.Bubble,
				staticRightText: `(${formatStorageSize(Number(attachment.size))})`
			})
		}
	}

	private tutaoBadge(viewModel: MailViewerViewModel): Children {
		return isTutanotaTeamMail(viewModel.mail)
			? m(
				Badge,
				{
					classes: ".mr-s",
				},
				"Tutanota Team",
			) : null
	}

	private renderPhishingWarning(viewModel: MailViewerViewModel): Children | null {
		if (viewModel.isMailSuspicious()) {
			return m(InfoBanner, {
				message: "phishingMessageBody_msg",
				icon: Icons.Warning,
				type: BannerType.Warning,
				helpLink: InfoLink.Phishing,
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
				helpLink: InfoLink.MailAuth,
				type: BannerType.Warning,
				buttons: [
					{
						label: "close_alt",
						click: () => (viewModel.setWarningDismissed(true)),
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
				helpLink: InfoLink.MailAuth,
				buttons: [
					{
						label: "close_alt",
						click: () => (viewModel.setWarningDismissed(true)),
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
			helpLink: InfoLink.LoadImages,
			buttons: [showButton, ...maybeDropdownButtons],
		})
	}

	private actionButtons(attrs: MailViewerHeaderAttrs): Children {
		const {viewModel} = attrs
		let actions: Children
		if (viewModel.isAnnouncement()) {
			actions = [
				this.deleteButton(attrs),
				this.moreButton(attrs),
			]
		} else if (viewModel.isDraftMail()) {
			actions = [
				this.deleteButton(attrs),
				this.moveButton(attrs),
				this.editButton(attrs),
			]
		} else if (viewModel.canForwardOrMove()) {
			actions = [
				this.replyButtons(attrs),
				this.forwardButton(attrs),
				this.separator(),
				this.deleteButton(attrs),
				this.moveButton(attrs),
				this.moreButton(attrs),
			]
		} else if (viewModel.canAssignMails()) {
			actions = [
				this.replyButtons(attrs),
				this.assignButton(attrs),
				this.separator(),
				this.deleteButton(attrs),
				this.moreButton(attrs),
			]
		} else {
			actions = [
				this.replyButtons(attrs),
				this.separator(),
				this.deleteButton(attrs),
				this.moreButton(attrs),
			]
		}

		return m(".action-bar.flex-end.items-center.ml-between-s.mt-xs", {
			style: {
				marginRight: "6px",
			}
		}, actions)
	}

	private deleteButton({viewModel}: MailViewerHeaderAttrs): Children {
		return m(IconButton, {
			title: "delete_action",
			click: () => {
				promptAndDeleteMails(viewModel.mailModel, [viewModel.mail], noOp)
			},
			icon: Icons.Trash,
		})
	}

	private moreButton(attrs: MailViewerHeaderAttrs): Children {
		return m(IconButton, {
			title: "more_label",
			icon: Icons.More,
			click: this.prepareMoreActions(attrs),
		})
	}

	private moveButton({viewModel}: MailViewerHeaderAttrs): Children {
		return m(IconButton, {
			title: "move_action",
			icon: Icons.Folder,
			click: (e, dom) => showMoveMailsDropdown(
				viewModel.mailModel,
				dom.getBoundingClientRect(),
				[viewModel.mail],
			),
		})
	}

	private editButton({viewModel}: MailViewerHeaderAttrs) {
		return m(IconButton, {
			title: "edit_action",
			click: () => editDraft(viewModel),
			icon: Icons.Edit,
		})
	}

	private replyButtons({viewModel}: MailViewerHeaderAttrs) {
		const actions: Children = []
		actions.push(
			m(IconButton, {
				title: "reply_action",
				click: () => viewModel.reply(false),
				icon: Icons.Reply,
			}),
		)

		if (viewModel.canReplyAll()) {
			actions.push(
				m(IconButton, {
					title: "replyAll_action",
					click: () => viewModel.reply(true),
					icon: Icons.ReplyAll,
				}),
			)
		}
		return actions
	}

	private forwardButton({viewModel}: MailViewerHeaderAttrs) {
		return m(IconButton, {
			title: "forward_action",
			click: () => viewModel.forward()
								  .catch(ofClass(UserError, showUserError)),
			icon: Icons.Forward,
		})
	}

	private assignButton({viewModel}: MailViewerHeaderAttrs) {
		return m(IconButton, {
			title: "forward_action",
			icon: Icons.Forward,
			colors: ButtonColor.Content,
			click: createAsyncDropdown({
				width: 250,
				lazyButtons: () => makeAssignMailsButtons(viewModel)
			})
		})
	}

	private separator() {
		return m("", {
			style: {
				width: "0",
				// 24px is usually the visible icon size
				height: "24px",
				border: `0.5px solid ${theme.content_border}`,
			}
		})
	}

	private prepareMoreActions({
								   viewModel,
							   }: MailViewerHeaderAttrs
	) {
		return createDropdown({
			lazyButtons: () => mailViewerMoreActions(viewModel),
			width: 300
		})
	}

	getRecipientEmailAddress({viewModel}: MailViewerHeaderAttrs) {
		const {mail} = viewModel
		const relevantRecipient = viewModel.getRelevantRecipient()

		if (relevantRecipient) {
			const numberOfAllRecipients = mail.toRecipients.length + mail.ccRecipients.length + mail.bccRecipients.length
			return m(".flex.click.small.ml-between-s.items-center", {
				style: {
					// use this to allow the container to shrink, otherwise it doesn't want to cut the recipient address
					minWidth: "20px",
				}
			}, [
				m("", lang.get("mailViewerRecipients_label")),
				m(".text-ellipsis", relevantRecipient.address),
				m(".flex.no-wrap", [
						numberOfAllRecipients > 1 ? `+ ${numberOfAllRecipients - 1}` : null,
						m(Icon, {
							icon: BootIcons.Expand,
							container: "div",
							style: {
								fill: theme.content_fg,
								transform: this.detailsExpanded ? "rotate(180deg)" : ""
							},
						})
					],
				)
			])
		} else {
			return ""
		}
	}
}