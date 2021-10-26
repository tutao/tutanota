// @flow
import {size} from "../../gui/size"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {ExpanderButtonN, ExpanderPanelN} from "../../gui/base/Expander"
import {serviceRequestVoid} from "../../api/main/Entity"
import {Button} from "../../gui/base/Button"
import {formatDateTime, formatDateWithWeekday, formatStorageSize, formatTime, urlEncodeHtmlTags} from "../../misc/Formatter"
import {windowFacade} from "../../misc/WindowFacade"
import {ease} from "../../gui/animation/Easing"
import type {DomMutation} from "../../gui/animation/Animations"
import {animations, scroll} from "../../gui/animation/Animations"
import type {MailBody} from "../../api/entities/tutanota/MailBody"
import {MailBodyTypeRef} from "../../api/entities/tutanota/MailBody"
import type {CalendarMethodEnum, InboxRuleTypeEnum, MailReportTypeEnum} from "../../api/common/TutanotaConstants"
import {
	ConversationType,
	ExternalImageRule,
	FeatureType,
	InboxRuleType,
	Keys,
	MailAuthenticationStatus,
	MailFolderType,
	MailMethod,
	mailMethodToCalendarMethod,
	MailPhishingStatus,
	MailReportType,
	MailState,
	SpamRuleFieldType as SparmRuleType,
	SpamRuleType,
	TabIndex
} from "../../api/common/TutanotaConstants"
import type {File as TutanotaFile} from "../../api/entities/tutanota/File"
import {FileTypeRef} from "../../api/entities/tutanota/File"
import {CALENDAR_MIME_TYPE, fileController} from "../../file/FileController"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNode, isAndroidApp, isDesktop, isIOSApp} from "../../api/common/Env"
import {Dialog} from "../../gui/base/Dialog"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {getMailBodyText, getMailHeaders} from "../../api/common/utils/Utils"
import {defer, downcast, neverNull, noOp} from "@tutao/tutanota-utils"
import {addAll, contains} from "@tutao/tutanota-utils"
import {startsWith} from "@tutao/tutanota-utils"
import {Request} from "../../api/common/WorkerProtocol.js"
import {ConversationEntryTypeRef} from "../../api/entities/tutanota/ConversationEntry"
import {
	createNewContact,
	getArchiveFolder,
	getDefaultSender,
	getDisplayText,
	getEnabledMailAddresses,
	getExistingRuleForType,
	getFolder,
	getFolderIcon,
	getFolderName,
	getMailboxName,
	getSenderOrRecipientHeading,
	getSenderOrRecipientHeadingTooltip,
	getSortedCustomFolders,
	getSortedSystemFolders,
	isExcludedMailAddress,
	isTutanotaTeamMail,
} from "../model/MailUtils"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import type {KeyPress} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {logins} from "../../api/main/LoginController"
import {Icon, progressIcon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import type {MailAddress} from "../../api/entities/tutanota/MailAddress"
import {createMailAddress} from "../../api/entities/tutanota/MailAddress"
import type {EncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import {createEncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import {LockedError, NotAuthorizedError, NotFoundError} from "../../api/common/error/RestError"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {theme} from "../../gui/theme"
import {TutanotaService} from "../../api/entities/tutanota/Services"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {createListUnsubscribeData} from "../../api/entities/tutanota/ListUnsubscribeData"
import {MailHeadersTypeRef} from "../../api/entities/tutanota/MailHeaders"
import {client} from "../../misc/ClientDetector"
import type {PosRect} from "../../gui/base/Dropdown"
import {createAsyncDropDownButton, createDropDownButton, DomRectReadOnlyPolyfilled} from "../../gui/base/Dropdown"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import Badge from "../../gui/base/Badge"
import {FileOpenError} from "../../api/common/error/FileOpenError"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {styles} from "../../gui/styles"
import {createAsyncDropdown, createDropdown, showDropdownAtPosition} from "../../gui/base/DropdownN"
import {navButtonRoutes} from "../../misc/RouteChange"
import {createEmailSenderListElement} from "../../api/entities/sys/EmailSenderListElement"
import {RecipientButton} from "../../gui/base/RecipientButton"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {copyToClipboard} from "../../misc/ClipboardUtils"
import type {GroupInfo} from "../../api/entities/sys/GroupInfo"
import {EventBanner} from "./EventBanner"
import {checkApprovalStatus} from "../../misc/LoginUtils"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import type {MailboxDetail, MailModel} from "../model/MailModel"
import type {ResponseMailParameters} from "../editor/SendMailModel"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {EntityClient} from "../../api/common/EntityClient"
import type {InlineImageReference} from "./MailGuiUtils"
import {
	getReferencedAttachments,
	loadInlineImages,
	moveMails,
	promptAndDeleteMails,
	replaceCidsWithInlineImages,
	revokeInlineImages
} from "./MailGuiUtils"
import type {ContactModel} from "../../contacts/model/ContactModel"
import {elementIdPart, getListId, listIdPart} from "../../api/common/utils/EntityUtils"
import {isNewMailActionAvailable} from "../../gui/nav/NavFunctions"
import {locator} from "../../api/main/MainLocator"
import {exportMails} from "../export/Exporter"
import {BannerType, InfoBanner} from "../../gui/base/InfoBanner"
import {createMoreSecondaryButtonAttrs, getCoordsOfMouseOrTouchEvent, ifAllowedTutanotaLinks} from "../../gui/base/GuiUtils"
import type {Link} from "../../misc/HtmlSanitizer"
import {stringifyFragment} from "../../gui/HtmlUtils"
import {IndexingNotSupportedError} from "../../api/common/error/IndexingNotSupportedError"
import {ofClass} from "@tutao/tutanota-utils"
import {CancelledError} from "../../api/common/error/CancelledError"
import type {ConfigurationDatabase} from "../../api/worker/facades/ConfigurationDatabase"

assertMainOrNode()

// map of inline image cid to InlineImageReference
export type InlineImages = Map<string, InlineImageReference>

// synthetic events are fired in code to distinguish between double and single click events
type MaybeSyntheticEvent = TouchEvent & {synthetic?: boolean}


const DOUBLE_TAP_TIME_MS = 350
const SCROLL_FACTOR = 4 / 5

export const ContentBlockingStatus = Object.freeze({
	Block: "0",
	Show: "1",
	AlwaysShow: "2",
	NoExternalContent: "3",
	AlwaysBlock: "4"
})
export type ExternalContentBlockingStatusEnum = $Values<typeof ContentBlockingStatus>;
type MailAddressAndName = {
	name: string,
	address: string
}

/**
 * The MailViewer displays a mail. The mail body is loaded asynchronously.
 */
export class MailViewer {
	view: Function;
	mail: Mail;
	_mailBody: ?MailBody;
	_contrastFixNeeded: boolean;
	_sanitizedMailBody: ?string; // always sanitized in this.setSanitizedMailBodyFromMail
	_loadingAttachments: boolean;
	_attachments: TutanotaFile[];
	_attachmentButtons: Button[];
	_contentBlockingStatus: ExternalContentBlockingStatusEnum;
	_domMailViewer: ?HTMLElement;
	/** it is set after we measured mail body element */
	_bodyLineHeight: ?number;
	_errorOccurred: boolean;
	oncreate: Function;
	onbeforeremove: Function;
	onremove: Function;
	_scrollAnimation: ?Promise<void>;
	_folderText: ?string;
	mailHeaderDialog: Dialog;
	mailHeaderInfo: string;
	_isScaling: boolean;
	_filesExpanded: Stream<boolean>;
	_referencedCids: Promise<Array<string>>
	_loadedInlineImages: Promise<InlineImages>;
	_suspicious: boolean;
	_domBodyDeferred: DeferredObject<HTMLElement>;
	_domBody: ?HTMLElement;
	_lastBodyTouchEndTime: number = 0;
	_lastTouchStart: {x: number, y: number, time: number};
	_domForScrolling: ?HTMLElement
	_warningDismissed: boolean;
	_calendarEventAttachment: ?{|event: CalendarEvent, method: CalendarMethodEnum, recipient: string|};
	_entityClient: EntityClient;
	_mailModel: MailModel;
	_contactModel: ContactModel;
	_delayBodyRenderingUntil: Promise<*>
	_configFacade: ConfigurationDatabase

	constructor(mail: Mail, showFolder: boolean, entityClient: EntityClient, mailModel: MailModel, contactModel: ContactModel,
	            configFacade: ConfigurationDatabase, delayBodyRenderingUntil: Promise<*>) {
		this.mail = mail
		this._contactModel = contactModel
		this._configFacade = configFacade
		this._entityClient = entityClient
		this._mailModel = mailModel
		this._delayBodyRenderingUntil = delayBodyRenderingUntil
		if (isDesktop()) {
			import("../../native/common/NativeWrapper").then(({nativeApp}) =>
				nativeApp.invokeNative(new Request('sendSocketMessage', [{mailAddress: mail.sender.address}])))
		}
		this._folderText = null
		this._filesExpanded = stream(false)
		this._domBodyDeferred = defer()
		if (showFolder) {
			let folder = this._mailModel.getMailFolder(mail._id[0])
			if (folder) {
				this._mailModel.getMailboxDetailsForMail(mail).then((mailboxDetails) => {
					this._folderText =
						`${lang.get("location_label")}: ${getMailboxName(logins, mailboxDetails)} / ${getFolderName(folder)}`.toUpperCase()
					m.redraw()
				})
			}
		}
		this._attachments = []
		this._attachmentButtons = []
		this._sanitizedMailBody = null
		this._contrastFixNeeded = false
		// Initialize with NoExternalContent so that the banner doesn't flash, this will be set later in _loadMailBody
		this._contentBlockingStatus = ContentBlockingStatus.NoExternalContent
		this._errorOccurred = false
		this._domMailViewer = null
		this._suspicious = false
		this._isScaling = true;
		this._lastTouchStart = {x: 0, y: 0, time: Date.now()}
		this._warningDismissed = false

		let closeAction = () => this.mailHeaderDialog.close()
		const headerBarAttrs: DialogHeaderBarAttrs = {
			right: [{label: 'ok_action', click: closeAction, type: ButtonType.Secondary}],
			middle: () => lang.get("mailHeaders_title")
		}
		this.mailHeaderInfo = ""
		this.mailHeaderDialog = Dialog.largeDialog(headerBarAttrs, {
			view: () => {
				return m(".white-space-pre.pt.pb.selectable", this.mailHeaderInfo)
			}
		}).addShortcut({
			key: Keys.ESC,
			exec: closeAction,
			help: "close_alt"
		}).setCloseHandler(closeAction)

		const resizeListener = () => this._domBodyDeferred.promise.then((dom) => this._updateLineHeight(dom))
		windowFacade.addResizeListener(resizeListener)
		const bubbleMenuWidth = 300
		const details = this._createDetailsExpanderChildren(bubbleMenuWidth, mail)
		const detailsExpanded = stream(false)
		const expanderButtonStyle = {}
		const detailsExpanderButtonAttrs = {
			label: "showMore_action",
			expanded: detailsExpanded,
			style: expanderButtonStyle
		}

		// We call those sequentially as _loadAttachments() waits for _inlineFileIds to resolve
		this._referencedCids = this._loadMailBody(mail)
		this._loadedInlineImages = this._loadAttachments(mail)
		this._loadedInlineImages.then(() => {
			// load the conversation entry here because we expect it to be loaded immediately when responding to this email
			this._entityClient.load(ConversationEntryTypeRef, mail.conversationEntry)
			    .catch(ofClass(NotFoundError, e => console.log("could load conversation entry as it has been moved/deleted already", e)))
		})

		let delayIsOver = false
		delayBodyRenderingUntil
			.then(() => {
				delayIsOver = true
				m.redraw()
			})

		this.view = () => {
			const dateTime = formatDateWithWeekday(this.mail.receivedDate) + " • " + formatTime(this.mail.receivedDate)
			return [
				m("#mail-viewer.fill-absolute"
					+ (client.isMobileDevice() ? ".scroll-no-overlay.overflow-x-hidden" : ".flex.flex-column"), {
						oncreate: (vnode) => this._domMailViewer = vnode.dom
					}, [
						m(".header.plr-l.margin-are-inset-lr", [
							m(".flex-space-between.button-min-height", [ // the natural height may vary in browsers (Firefox), so set it to button height here to make it similar to the MultiMailViewer
								m(".flex.flex-column-reverse", [
									detailsExpanded()
										? m("small.flex.text-break", lang.get("from_label"))
										: m(".small.flex.text-break.selectable.badge-line-height.flex-wrap.pt-s", {
											title: getSenderOrRecipientHeadingTooltip(this.mail)
										}, [
											this._tutaoBadge(),
											getSenderOrRecipientHeading(this.mail, false)
										]),
									this._folderText
										? m("small.b.flex.pt", {
											style: {
												color: theme.navigation_button
											}
										}, this._folderText)
										: null,
								]),
								!this._isAnnouncement() && styles.isUsingBottomNavigation()
									? null
									: m(".pt-0", m(ExpanderButtonN, detailsExpanderButtonAttrs))
							]),
							m(".mb-m", m(ExpanderPanelN, {
								expanded: detailsExpanded
							}, details)),
							m(".subject-actions.flex-space-between.flex-wrap.mt-xs", [
								m(".left.flex-grow-shrink-150", [
									m(".subject.text-break.selectable", {
										"aria-label": lang.get("subject_label") + ", " + (this.mail.subject || ""),
									}, this.mail.subject || ""),
									m(".flex.items-center.content-accent-fg.svg-content-accent-fg"
										+ (this.mail.confidential ? ".ml-negative-xs" : ""), {
										// Orca refuses to read ut unless it's not focusable
										tabindex: TabIndex.Default,
										"aria-label": lang.get(this.mail.confidential ? "confidential_action" : "nonConfidential_action")
											+ ", " + dateTime
									}, [
										this.mail.confidential ? m(Icon, {
											icon: Icons.Lock,
											style: {
												fill: theme.content_fg
											}
										}) : null,
										m("small.date.mt-xs.content-fg.selectable", dateTime),
										m(".flex-grow"),
										m(".flex.flex-column-reverse",
											!this._isAnnouncement() && styles.isUsingBottomNavigation()
												? m(".pt-m", m(ExpanderButtonN, detailsExpanderButtonAttrs))
												: null),
									]),
								]),
								styles.isUsingBottomNavigation() ? null : this.actionButtons(),
							]),
							styles.isUsingBottomNavigation() ? this.actionButtons() : null,
							this._renderEventBanner(),
							this._renderAttachments(),
							this._renderBanners(mail)
						]),

						m(".flex-grow.margin-are-inset-lr.scroll-x.plr-l.pb-floating.pt"
							+ (client.isMobileDevice() ? "" : ".scroll-no-overlay")
							+ (this._contrastFixNeeded ? ".bg-white.content-black" : " "), {
								ontouchstart: (event) => {
									event.redraw = false
									const touch = event.touches[0]
									this._lastTouchStart.x = touch.clientX
									this._lastTouchStart.y = touch.clientY
									this._lastTouchStart.time = Date.now()
								},
								oncreate: vnode => {
									this._domForScrolling = vnode.dom
								},
								ontouchend: (event) => {
									if (client.isMobileDevice()) {
										this._handleDoubleTap(
											event,
											(e) => this._handleAnchorClick(e, true),
											() => this._rescale(true)
										)
									}
								},
								onclick: (event: MouseEvent) => {
									if (!client.isMobileDevice()) {
										this._handleAnchorClick(event, false)
									}
								},
							},
							delayIsOver ? this.renderMailBodySection() : null
						)
					],
				),
			]
		}

		this.onremove = () => windowFacade.removeResizeListener(resizeListener)
		this._setupShortcuts()
	}

	_renderBanners(mail: Mail): Children {
		return [
			this._renderPhishingWarning()
			|| this._renderHardAuthenticationFailWarning(mail)
			|| this._renderSoftAuthenticationFailWarning(mail),
			this._renderExternalContentBanner(),
			m("hr.hr.mt-xs"),
		].filter(Boolean)
	}

	renderMailBodySection(): Children {
		const sanitizedMailBody = this._sanitizedMailBody
		if (sanitizedMailBody != null && !this._didErrorsOccur()) {
			return m("#mail-body.selectable.touch-callout.break-word-links"
				+ (client.isMobileDevice() ? ".break-pre" : ""), {
				oncreate: vnode => {
					this._domBodyDeferred.resolve(vnode.dom)
					this._domBody = vnode.dom
					this._updateLineHeight(vnode.dom)
					this._rescale(false)
				},
				onupdate: (vnode) => {
					this._domBodyDeferred.resolve(vnode.dom)
					this._domBody = vnode.dom
					// Only measure and update line height once.
					// BUT we need to do in from onupdate too if we swap mailViewer but mithril does not realize
					// that it's a different vnode so oncreate might not be called.
					if (!this._bodyLineHeight) {
						this._updateLineHeight(vnode.dom)
					}
					this._rescale(false)
				},
				onsubmit: (event: Event) => this._confirmSubmit(event),
				style: {
					'line-height': this._bodyLineHeight ? this._bodyLineHeight.toString() : size.line_height,
					'transform-origin': 'top left'
				},
			}, m.trust(sanitizedMailBody))
		} else if (!this._didErrorsOccur()) {
			return m(".progress-panel.flex-v-center.items-center", {
				style: {
					height: '200px'
				}
			}, [
				progressIcon(),
				m("small", lang.get("loading_msg"))
			])
		} else {
			return m(ColumnEmptyMessageBox, {
				message: "corrupted_msg",
				icon: Icons.Warning,
				color: theme.content_message_bg,
			})
		}
	}

	_didErrorsOccur(): boolean {
		return this._errorOccurred || this.mail._errors || (this._mailBody != null && this._mailBody._errors)
	}

	_renderEventBanner(): Children {
		return this._calendarEventAttachment
			? m(EventBanner, {
				event: this._calendarEventAttachment.event,
				method: this._calendarEventAttachment.method,
				recipient: this._calendarEventAttachment.recipient,
				mail: this.mail,
			})
			: null
	}

	_createDetailsExpanderChildren(bubbleMenuWidth: number, mail: Mail): Children {
		const envelopeSender = this.mail.differentEnvelopeSender
		return [
			m(RecipientButton, {
				label: getDisplayText(this.mail.sender.name, this.mail.sender.address, false),
				click: createAsyncDropdown(() =>
					this._createBubbleContextButtons(this.mail.sender, InboxRuleType.FROM_EQUALS), bubbleMenuWidth),
			}),
			envelopeSender
				? [
					m(".small", lang.get("sender_label")),
					m(RecipientButton, {
						label: getDisplayText("", envelopeSender, false),
						click: createAsyncDropdown(async () => {
							const childElements = [
								{
									info: lang.get("envelopeSenderInfo_msg"),
									center: false,
									bold: false
								},
								{
									info: envelopeSender,
									center: true,
									bold: true
								}
							]
							const contextButtons = await this._createBubbleContextButtons(
								{address: envelopeSender, name: ""},
								InboxRuleType.FROM_EQUALS, false)
							return childElements.concat(contextButtons)
						}, bubbleMenuWidth)
					}),
				]
				: null,
			mail.toRecipients.length
				? [
					m(".small", lang.get("to_label")),
					m(".flex-start.flex-wrap", this.mail.toRecipients.map(recipient => m(RecipientButton, {
							label: getDisplayText(recipient.name, recipient.address, false),
							click: createAsyncDropdown(() =>
								this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_TO_EQUALS), bubbleMenuWidth),
							// To wrap text inside flex container, we need to allow element to shrink and pick own width
							style: {flex: "0 1 auto"},
						}))
					),
				]
				: null,
			mail.ccRecipients.length
				? [
					m(".small", lang.get("cc_label")),
					m(".flex-start.flex-wrap", this.mail.ccRecipients.map(recipient => m(RecipientButton, {
						label: getDisplayText(recipient.name, recipient.address, false),
						click: createAsyncDropdown(() =>
							this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_CC_EQUALS), bubbleMenuWidth),
						style: {flex: "0 1 auto"},
					}))),
				]
				: null,
			mail.bccRecipients.length
				? [
					m(".small", lang.get("bcc_label")),
					m(".flex-start.flex-wrap", this.mail.bccRecipients.map(recipient => m(RecipientButton, {
						label: getDisplayText(recipient.name, recipient.address, false),
						click: createAsyncDropdown(() =>
							this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_BCC_EQUALS), bubbleMenuWidth),
						style: {flex: "0 1 auto"},
					}))),
				]
				: null,
			mail.replyTos.length
				? [
					m(".small", lang.get("replyTo_label")),
					m(".flex-start.flex-wrap", this.mail.replyTos.map(recipient => m(RecipientButton, {
						label: getDisplayText(recipient.name, recipient.address, false),
						click: createAsyncDropdown(() =>
							this._createBubbleContextButtons(recipient, null), bubbleMenuWidth),
						style: {flex: "0 1 auto"},
					}))),
				]
				: null,
		]
	}

	_showEnvelopeSenderDialog(envelopeSender: string): Dialog {
		const dialog = Dialog.showActionDialog({
			title: "",
			child: () => [
				m(".mt.mb", lang.get("envelopeSenderInfo_msg")),
				envelopeSender,
				m(".flex-wrap.flex-end", [
					m(ButtonN, {
						label: "copy_action",
						click: () => copyToClipboard(envelopeSender),
						type: ButtonType.Secondary,
					}),
					m(ButtonN, {
						label: "addSpamRule_action",
						click: () => {
							dialog.close()
							this._addSpamRule(InboxRuleType.FROM_EQUALS, envelopeSender)
						},
						type: ButtonType.Secondary,
					}),
				])
			],
			okAction: null,
		})
		return dialog
	}

	_unsubscribe(): Promise<void> {
		if (this.mail.headers) {
			return showProgressDialog("pleaseWait_msg", this._entityClient.load(MailHeadersTypeRef, this.mail.headers).then(mailHeaders => {
				let headers = getMailHeaders(mailHeaders).split("\n").filter(headerLine =>
					headerLine.toLowerCase().startsWith("list-unsubscribe"))
				if (headers.length > 0) {
					return this._getSenderOfResponseMail().then((recipient) => {
						const postData = createListUnsubscribeData({
							mail: this.mail._id,
							recipient,
							headers: headers.join("\n"),
						})
						return serviceRequestVoid(TutanotaService.ListUnsubscribeService, HttpMethod.POST, postData)
							.then(() => true)
					})
				} else {
					return false
				}
			})).then(success => {
				if (success) {
					return Dialog.error("unsubscribeSuccessful_msg")
				}
			}).catch(e => {
				if (e instanceof LockedError) {
					return Dialog.error("operationStillActive_msg")
				} else {
					return Dialog.error("unsubscribeFailed_msg")
				}
			})
		}
		return Promise.resolve()
	}

	actionButtons(): Children {
		const mail = this.mail
		const actions = []
		const colors = ButtonColors.Content

		if (mail.state === MailState.DRAFT) {
			actions.push(m(ButtonN, {
				label: "edit_action",
				click: () => this._editDraft(),
				icon: () => Icons.Edit,
				colors
			}))
		} else {
			if (!this._isAnnouncement()) {
				actions.push(m(ButtonN, {
					label: "reply_action",
					click: () => this._reply(false),
					icon: () => Icons.Reply,
					colors,
				}))
				const userController = logins.getUserController()
				const restrictedParticipants = mail.restrictions && mail.restrictions.participantGroupInfos.length > 0
				if (userController.isInternalUser()
					&& (mail.toRecipients.length + mail.ccRecipients.length + mail.bccRecipients.length > 1)
					&& !restrictedParticipants) {
					actions.push(m(ButtonN, {
						label: "replyAll_action",
						click: () => this._reply(true),
						icon: () => Icons.ReplyAll,
						colors,
					}))
				}
				if (userController.isInternalUser() && !restrictedParticipants) {
					actions.push(m(ButtonN, {
						label: "forward_action",
						click: () => this._forward(),
						icon: () => Icons.Forward,
						colors,
					}))
					actions.push(m(ButtonN, {
						label: "move_action",
						icon: () => Icons.Folder,
						colors,
						click: createAsyncDropdown(() => this._mailModel.getMailboxFolders(this.mail).then((folders) => {
								const filteredFolders = folders.filter(f => f.mails !== this.mail._id[0])
								const targetFolders = (getSortedSystemFolders(filteredFolders).concat(getSortedCustomFolders(filteredFolders)))
								return targetFolders.map(f => {
									return {
										label: () => getFolderName(f),
										click: () => moveMails(this._mailModel, [mail], f),
										icon: getFolderIcon(f),
										type: ButtonType.Dropdown,
									}
								})
							})
						)
					}))
				} else if (userController.isInternalUser()
					&& restrictedParticipants
					&& userController.getUserMailGroupMembership().group !== this.mail._ownerGroup) {
					// do not allow re-assigning from personal mailbox
					actions.push(m(this._createAssignActionButton(mail)
					                   .setColors(colors)))
				}
			}
		}
		actions.push(m(ButtonN, {
			label: "delete_action",
			click: () => {
				promptAndDeleteMails(this._mailModel, [this.mail], noOp)
			},
			icon: () => Icons.Trash,
			colors,
		}))
		if (mail.state !== MailState.DRAFT) {
			actions.push(m(ButtonN, {
				label: "more_label",
				icon: () => Icons.More,
				colors,
				click: createDropdown(() => {
					const moreButtons: Array<ButtonAttrs> = []
					if (this.mail.unread) {
						moreButtons.push({
							label: "markRead_action",
							click: () => this._markUnread(false),
							icon: () => Icons.Eye,
							type: ButtonType.Dropdown,
						})
					} else {
						moreButtons.push({
							label: "markUnread_action",
							click: () => this._markUnread(true),
							icon: () => Icons.NoEye,
							type: ButtonType.Dropdown,
						})
					}
					if (!this._isAnnouncement() && !client.isMobileDevice() && !logins.isEnabled(FeatureType.DisableMailExport)) {
						moreButtons.push({
							label: "export_action",
							click: () => showProgressDialog("pleaseWait_msg", exportMails([this.mail], locator.entityClient, locator.fileFacade)),
							icon: () => Icons.Export,
							type: ButtonType.Dropdown,
						})
					}
					if (!client.isMobileDevice() && !logins.isEnabled(FeatureType.DisableMailExport)
						&& typeof window.print === "function") {
						moreButtons.push({
							label: "print_action",
							click: () => window.print(),
							icon: () => Icons.Print,
							type: ButtonType.Dropdown,
						})
					}
					if (this.mail.listUnsubscribe) {
						moreButtons.push({
							label: "unsubscribe_action",
							click: () => this._unsubscribe(),
							icon: () => Icons.Cancel,
							type: ButtonType.Dropdown,
						})
					}
					if (logins.isInternalUserLoggedIn()) {
						moreButtons.push({
							label: "showHeaders_action",
							click: () => this._showHeaders(),
							icon: () => Icons.ListUnordered,
							type: ButtonType.Dropdown,
						})
					}
					if (this.mail.phishingStatus === MailPhishingStatus.UNKNOWN && !isTutanotaTeamMail(this.mail)
						&& logins.isInternalUserLoggedIn()) {
						moreButtons.push({
							label: "reportEmail_action",
							click: () => this._reportMail(),
							icon: () => Icons.Warning,
							type: ButtonType.Dropdown
						})
					}
					if (locator.search.indexingSupported && this._isShowingExternalContent()) {
						moreButtons.push({
							label: "disallowExternalContent_action",
							click: () => {
								this._setContentBlockingStatus(ContentBlockingStatus.Block)
							},
							icon: () => Icons.Picture,
							type: ButtonType.Dropdown
						})
					}
					if (locator.search.indexingSupported && this.isBlockingExternalImages()) {
						moreButtons.push({
							label: "showImages_action",
							click: () => {
								this._setContentBlockingStatus(ContentBlockingStatus.Show)
							},
							icon: () => Icons.Picture,
							type: ButtonType.Dropdown
						})
					}
					return moreButtons
				}, 300)
			}))
		}

		return m(".action-bar.flex-end.items-center.mr-negative-s", actions)
	}

	_isShowingExternalContent(): boolean {
		return this._contentBlockingStatus === ContentBlockingStatus.Show
			|| this._contentBlockingStatus === ContentBlockingStatus.AlwaysShow
	}

	_reportMail() {
		const sendReport = (reportType: MailReportTypeEnum) => {
			this._mailModel.reportMails(reportType, [this.mail])
			    .then(() => {
				    if (reportType === MailReportType.PHISHING) {
					    this.mail.phishingStatus = MailPhishingStatus.SUSPICIOUS
					    return this._entityClient.update(this.mail)
				    }
			    })
			    .then(() => this._mailModel.getMailboxDetailsForMail(this.mail))
			    .then((mailboxDetails) => {
				    const spamFolder = getFolder(mailboxDetails.folders, MailFolderType.SPAM)
				    // do not report moved mails again
				    return moveMails(this._mailModel, [this.mail], spamFolder, false)
			    })
			    .catch(ofClass(LockedError, () => Dialog.error("operationStillActive_msg")))
			    .catch(ofClass(NotFoundError, () => console.log("mail already moved")))
			    .then(m.redraw)
		}

		const dialog = Dialog.showActionDialog({
			title: lang.get("reportEmail_action"),
			child: () => m(".flex.col.mt-m", {
				// So that space below buttons doesn't look huge
				style: {marginBottom: "-10px"},
			}, [
				m("div", lang.get("phishingReport_msg")),
				ifAllowedTutanotaLinks("phishing_link",
					link => m("a.mt-s", {href: link, target: "_blank"}, lang.get("whatIsPhishing_msg"))),
				m(".flex-wrap.flex-end", [
					m(ButtonN, {
						label: "reportPhishing_action",
						click: () => {
							sendReport(MailReportType.PHISHING)
							dialog.close()
						},
						type: ButtonType.Secondary,
					}),
					m(ButtonN, {
						label: "reportSpam_action",
						click: () => {
							sendReport(MailReportType.SPAM)
							dialog.close()
						},
						type: ButtonType.Secondary,
					}),
				]),
			]),
			okAction: null,
		})
	}

	_markAsNotPhishing(): Promise<void> {
		const oldStatus = this.mail.phishingStatus
		if (oldStatus === MailPhishingStatus.WHITELISTED) {
			return Promise.resolve()
		}

		this.mail.phishingStatus = MailPhishingStatus.WHITELISTED
		return this._entityClient.update(this.mail)
		           .catch(e => this.mail.phishingStatus = oldStatus)
		           .then(m.redraw)
	}

	_checkMailForPhishing(mail: Mail, links: Array<HTMLElement>) {
		if (mail.phishingStatus === MailPhishingStatus.SUSPICIOUS) {
			this._suspicious = true
		} else if (mail.phishingStatus === MailPhishingStatus.UNKNOWN) {
			const linkObjects = links.map((link) => {
				return {href: link.getAttribute("href") || "", innerHTML: link.innerHTML}
			})
			this._mailModel.checkMailForPhishing(mail, linkObjects).then((isSuspicious) => {
				if (isSuspicious) {
					this._suspicious = true
					mail.phishingStatus = MailPhishingStatus.SUSPICIOUS
					this._entityClient.update(mail)
					    .catch(ofClass(LockedError, e => console.log("could not update mail phishing status as mail is locked")))
					    .catch(ofClass(NotFoundError, e => console.log("mail already moved")))
					m.redraw()
				}
			})
		}
	}

	getBounds(): ?PosRect {
		return this._domMailViewer && this._domMailViewer.getBoundingClientRect()
	}

	_createAssignActionButton(mail: Mail): Button {
		const makeButtons = async () => {
			// remove the current mailbox/owner from the recipients list.
			const userOrMailGroupInfos = await this._getAssignableMailRecipients()
			return userOrMailGroupInfos.filter(userOrMailGroupInfo => {
				if (logins.getUserController().getUserMailGroupMembership().group === this.mail._ownerGroup) {
					return userOrMailGroupInfo.group !== logins.getUserController().userGroupInfo.group
						&& userOrMailGroupInfo.group !== mail._ownerGroup
				} else {
					return userOrMailGroupInfo.group !== mail._ownerGroup
				}
			}).map(userOrMailGroupInfo => {
				return new Button(
					() => getDisplayText(userOrMailGroupInfo.name,
						neverNull(userOrMailGroupInfo.mailAddress), true),
					() => this._assignMail(userOrMailGroupInfo), () => BootIcons.Contacts
				).setType(ButtonType.Dropdown)
			})
		}

		return createAsyncDropDownButton('forward_action', () => Icons.Forward, makeButtons, 250)
	}

	_replaceInlineImages() {
		this._loadedInlineImages.then((loadedInlineImages) => {
			this._domBodyDeferred.promise.then(domBody => {
				replaceCidsWithInlineImages(domBody, loadedInlineImages, (cid, event, dom) => {
					const inlineAttachment = this._attachments.find(attachment => attachment.cid === cid)
					if (inlineAttachment) {
						const coords = getCoordsOfMouseOrTouchEvent(event)
						showDropdownAtPosition([
							{
								label: "download_action",
								click: () => this._downloadAndOpenAttachment(inlineAttachment, false),
								type: ButtonType.Dropdown
							},
							{
								label: "open_action",
								click: () => this._downloadAndOpenAttachment(inlineAttachment, true),
								type: ButtonType.Dropdown
							},
						], coords.x, coords.y)
					}
				})
			})
		})
	}

	/** @return list of inline referenced cid */
	async _loadMailBody(mail: Mail): Promise<Array<string>> {

		try {
			this._mailBody = await this._entityClient.load(MailBodyTypeRef, mail.body)
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("could load mail body as it has been moved/deleted already", e)
				this._errorOccurred = true
				return []
			}
			if (e instanceof NotAuthorizedError) {
				console.log("could load mail body as the permission is missing", e)
				this._errorOccurred = true
				return []
			}
			throw e
		}

		const externalImageRule = await locator.configFacade.getExternalImageRule(mail.sender.address)
		                                       .catch(e => {
			                                       console.log("Error getting external image rule:", e)
			                                       return ExternalImageRule.None
		                                       })
		const isAllowedAndAuthenticatedExternalSender = externalImageRule === ExternalImageRule.Allow
			&& mail.authStatus === MailAuthenticationStatus.AUTHENTICATED

		// We should not try to sanitize body while we still animate because it's a heavy operation.
		await this._delayBodyRenderingUntil

		const sanitizeResult = await this.setSanitizedMailBodyFromMail(mail, !isAllowedAndAuthenticatedExternalSender)

		this._checkMailForPhishing(mail, sanitizeResult.links)

		this._contentBlockingStatus =
			externalImageRule === ExternalImageRule.Block
				? ContentBlockingStatus.AlwaysBlock
				: (isAllowedAndAuthenticatedExternalSender
					? ContentBlockingStatus.AlwaysShow
					: (sanitizeResult.externalContent.length > 0 ? ContentBlockingStatus.Block : ContentBlockingStatus.NoExternalContent)
				)

		m.redraw()
		return sanitizeResult.inlineImageCids
	}

	_loadAttachments(mail: Mail): Promise<InlineImages> {
		if (mail.attachments.length === 0) {
			this._loadingAttachments = false
			return Promise.resolve(new Map())
		} else {
			//We wait for _inlineFileIds to resolve in order to make the server requests sequentially
			return this._referencedCids.then((inlineCids) => {
				this._loadingAttachments = true
				const attachmentsListId = listIdPart(mail.attachments[0])
				const attachmentElementIds = mail.attachments.map(attachment => elementIdPart(attachment))
				return this._entityClient.loadMultipleEntities(FileTypeRef, attachmentsListId, attachmentElementIds)
				           .then(async (files) => {
					           this._handleCalendarFile(files, mail)
					           this._attachments = files
					           this._attachmentButtons = this._createAttachmentsButtons(files, inlineCids)
					           this._loadingAttachments = false
					           const inlineImages = await loadInlineImages(locator.fileFacade, files, inlineCids)
					           m.redraw()
					           return inlineImages
				           })
				           .catch(ofClass(NotFoundError, e => {
					           console.log("could load attachments as they have been moved/deleted already", e)
					           return new Map()
				           }))
			})
		}
	}

	/**
	 * Check if the list of files contain an iCal file which we can then load and display details for. An calendar notification
	 * should contain only one iCal attachment so we only process the first matching one.
	 */
	_handleCalendarFile(files: Array<TutanotaFile>, mail: Mail): void {
		const calendarFile = files.find(a => a.mimeType && a.mimeType.startsWith(CALENDAR_MIME_TYPE))
		if (calendarFile
			&& (mail.method === MailMethod.ICAL_REQUEST || mail.method === MailMethod.ICAL_REPLY)
			&& mail.state === MailState.RECEIVED
		) {
			Promise.all([
				import("../../calendar/date/CalendarInvites")
					.then(({getEventFromFile}) => getEventFromFile(calendarFile)),
				this._getSenderOfResponseMail()
			]).then(([event, recipient]) => {
				this._calendarEventAttachment = event && {
					event,
					method: mailMethodToCalendarMethod(downcast(mail.method)),
					recipient,
				}
				m.redraw()
			})
		}
	}

	_renderAttachments(): Children {
		if (this._loadingAttachments) {
			return m(".flex", [
				m(".flex-v-center.pl-button", progressIcon()),
				m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))
			])
		} else {
			const spoilerLimit = this._attachmentsSpoilerLimit()
			return m(".flex.ml-negative-bubble.flex-wrap", [
					this._attachmentButtons.length > spoilerLimit
						? [
							this._attachmentButtons.slice(0, spoilerLimit).map(m),
							m(ExpanderButtonN, {
								style: {
									paddingTop: "0px",
									margin: "0px 6px"
								},
								label: "showAll_action",
								expanded: this._filesExpanded,
							}),
							m(ExpanderPanelN, {
								expanded: this._filesExpanded
							}, this._attachmentButtons.slice(spoilerLimit).map(m))
						]
						: this._attachmentButtons.map(m),
					this._renderDownloadAllButton()
				]
			)
		}
	}

	_renderDownloadAllButton(): Children {
		return !isIOSApp() && this._attachmentButtons.length > 2
			? m(".limit-width", m(ButtonN, {
				label: "saveAll_action",
				type: ButtonType.Secondary,
				click: () => this._downloadAll()
			}))
			: null
	}

	_attachmentsSpoilerLimit(): number {
		return styles.isDesktopLayout() ? 4 : 2
	}

	_tutaoBadge(): Vnode<*> | null {
		return isTutanotaTeamMail(this.mail) ? m(Badge, {classes: ".mr-s"}, "Tutanota Team") : null
	}

	_isAnnouncement(): boolean {
		return isExcludedMailAddress(this.mail.sender.address)
	}

	_rescale(animate: boolean) {
		if (!client.isMobileDevice() || !this._domBody) {
			return
		}
		const child = this._domBody
		const containerWidth = child.offsetWidth

		if (!this._isScaling || containerWidth > child.scrollWidth) {
			child.style.transform = ''
			child.style.marginBottom = ''
		} else {
			const width = child.scrollWidth
			const scale = containerWidth / width
			const heightDiff = child.scrollHeight - child.scrollHeight * scale
			child.style.transform = `scale(${scale})`
			child.style.marginBottom = `${-heightDiff}px`
		}

		child.style.transition = animate ? 'transform 200ms ease-in-out' : ''
	}

	_setupShortcuts() {
		const userController = logins.getUserController()
		let shortcuts = [
			{
				key: Keys.E,
				enabled: () => this.mail.state === MailState.DRAFT,
				exec: () => {
					this._editDraft()
				},
				help: "editMail_action"
			},
			{
				key: Keys.H,
				enabled: () => this.mail.state !== MailState.DRAFT,
				exec: () => this._showHeaders(),
				help: "showHeaders_action"
			},
			{
				key: Keys.R,
				exec: (key: KeyPress) => {
					this._reply(false)
				},
				enabled: () => this.mail.state !== MailState.DRAFT,
				help: "reply_action"
			},
			{
				key: Keys.R,
				shift: true,
				exec: (key: KeyPress) => {
					this._reply(true)
				},
				enabled: () => this.mail.state !== MailState.DRAFT,
				help: "replyAll_action"
			},
		]
		if (userController.isInternalUser()) {
			shortcuts.push({
				key: Keys.F,
				shift: true,
				enabled: () => this.mail.state !== MailState.DRAFT,
				exec: (key: KeyPress) => {
					this._forward()
				},
				help: "forward_action"
			})
		}


		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			this._replaceInlineImages()
		}
		// onremove is called when we or any of our parents are removed from dom
		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
			this._domBodyDeferred = defer()
			this._domBody = null
		}
		// onbeforeremove is only called if we are removed from the parent
		// e.g. it is not called when switching to contact view
		this.onbeforeremove = () => {
			this._loadedInlineImages.then(inlineImages => {
				revokeInlineImages(inlineImages)
			})
		}
	}

	_updateLineHeight(dom: HTMLElement) {
		const width = dom.offsetWidth
		if (width > 900) {
			this._bodyLineHeight = size.line_height_l
		} else if (width > 600) {
			this._bodyLineHeight = size.line_height_m
		} else {
			this._bodyLineHeight = size.line_height
		}
		dom.style.lineHeight = String(this._bodyLineHeight)
	}

	_confirmSubmit(event: Event) {
		// use the default confirm dialog here because the submit can not be done async
		if (!confirm(lang.get("reallySubmitContent_msg"))) {
			event.preventDefault();
		}
	}

	_createBubbleContextButtons(mailAddress: MailAddressAndName, defaultInboxRuleField: ?InboxRuleTypeEnum, createContact: boolean = true): Promise<Array<ButtonAttrs>> {
		const buttons = []
		buttons.push(
			{
				label: "copy_action",
				type: ButtonType.Secondary,
				click: () => copyToClipboard(mailAddress.address),
			}
		)
		if (logins.getUserController().isInternalUser()) {
			let contactsPromise = Promise.resolve()
			if (createContact && !logins.isEnabled(FeatureType.DisableContacts)) {
				contactsPromise = this._contactModel.searchForContact(mailAddress.address).then(contact => {
					if (contact) {
						buttons.push({
							label: "showContact_action",
							click: () => {
								navButtonRoutes.contactsUrl = `/contact/${neverNull(contact)._id[0]}/${neverNull(contact)._id[1]}`
								m.route.set(navButtonRoutes.contactsUrl + location.hash)
							},
							type: ButtonType.Secondary
						})
					} else {
						buttons.push({
							label: "createContact_action",
							click: () => {
								this._contactModel.contactListId().then(contactListId => {
									import("../../contacts/ContactEditor").then(({ContactEditor}) => {
										const contact = createNewContact(logins.getUserController().user, mailAddress.address, mailAddress.name)
										new ContactEditor(this._entityClient, contact, contactListId).show()
									})
								})
							},
							type: ButtonType.Secondary
						})
					}
				})
			}
			return contactsPromise.then(() => {
				return this._mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
					if (defaultInboxRuleField
						&& !logins.isEnabled(FeatureType.InternalCommunication)) {
						let rule = getExistingRuleForType(logins.getUserController().props, mailAddress.address.trim().toLowerCase(), defaultInboxRuleField)
						let actionLabel = rule ? "editInboxRule_action" : "addInboxRule_action"
						buttons.push({
							label: actionLabel,
							click: () => {
								import("../../settings/AddInboxRuleDialog").then(({show, createInboxRuleTemplate}) => {
									const newRule =
										rule || createInboxRuleTemplate(defaultInboxRuleField, mailAddress.address.trim().toLowerCase())
									show(mailboxDetails, newRule)
								})
							},
							type: ButtonType.Secondary,
						})
					}
					if (logins.isGlobalAdminUserLoggedIn() && !logins.isEnabled(FeatureType.InternalCommunication)) {
						buttons.push({
							label: "addSpamRule_action",
							click: () => this._addSpamRule(defaultInboxRuleField, mailAddress.address),
							type: ButtonType.Secondary,
						})
					}
					return buttons
				})
			})
		} else {
			return Promise.resolve(buttons)
		}
	}

	_addSpamRule(defaultInboxRuleField: ?InboxRuleTypeEnum, address: string) {
		const folder = this._mailModel.getMailFolder(getListId(this.mail))
		const spamRuleType = folder && folder.folderType === MailFolderType.SPAM
			? SpamRuleType.WHITELIST
			: SpamRuleType.BLACKLIST
		let spamRuleField
		switch (defaultInboxRuleField) {
			case InboxRuleType.RECIPIENT_TO_EQUALS:
				spamRuleField = SparmRuleType.TO
				break
			case InboxRuleType.RECIPIENT_CC_EQUALS:
				spamRuleField = SparmRuleType.CC
				break
			case InboxRuleType.RECIPIENT_BCC_EQUALS:
				spamRuleField = SparmRuleType.BCC
				break
			default:
				spamRuleField = SparmRuleType.FROM
				break
		}
		import("../../settings/AddSpamRuleDialog").then(({showAddSpamRuleDialog}) => {
			showAddSpamRuleDialog(createEmailSenderListElement({
				value: address.trim().toLowerCase(),
				type: spamRuleType,
				field: spamRuleField,
			}))
		})
	}

	_isEnvelopeSenderVisible(): boolean {
		return this.mail.differentEnvelopeSender != null
	}

	_markUnread(unread: boolean) {
		this.mail.unread = unread
		this._entityClient.update(this.mail)
		    .catch(ofClass(LockedError, e => console.log("could not update mail read state: ", lang.get("operationStillActive_msg"))))
		    .catch(ofClass(NotFoundError, noOp))
	}

	_editDraft(): Promise<void> {
		return checkApprovalStatus(logins, false).then(sendAllowed => {
			if (sendAllowed) {
				// check if to be opened draft has already been minimized, iff that is the case, re-open it
				const minimizedEditor = locator.minimizedMailModel.getEditorForDraft(this.mail)
				if (minimizedEditor) {
					locator.minimizedMailModel.reopenMinimizedEditor(minimizedEditor)
				} else {
					return Promise.all([this._mailModel.getMailboxDetailsForMail(this.mail), import("../editor/MailEditor")])
					              .then(([mailboxDetails, {newMailEditorFromDraft}]) => {
						              return newMailEditorFromDraft(this.mail,
							              this._attachments,
							              this._getMailBody(),
							              this.isBlockingExternalImages(),
							              this._loadedInlineImages,
							              mailboxDetails)
					              })
					              .then(editorDialog => {editorDialog.show()})
					              .catch(ofClass(UserError, showUserError))
				}

			}
		})
	}

	async _reply(replyAll: boolean): Promise<void> {
		if (this._isAnnouncement()) {
			return Promise.resolve()
		}
		const sendAllowed = await checkApprovalStatus(logins, false)
		if (sendAllowed) {
			const mailboxDetails = await this._mailModel.getMailboxDetailsForMail(this.mail)
			let prefix = "Re: "
			const mailSubject = this.mail.subject
			let subject = mailSubject
				? (startsWith(mailSubject.toUpperCase(), prefix.toUpperCase()))
					? mailSubject
					: prefix + mailSubject
				: ""
			let infoLine = formatDateTime(this.mail.sentDate) + " " + lang.get("by_label") + " "
				+ this.mail.sender.address + ":";
			let body = infoLine + "<br><blockquote class=\"tutanota_quote\">" + this._getMailBody() + "</blockquote>";

			let toRecipients = []
			let ccRecipients = []
			let bccRecipients = []
			if (!logins.getUserController().isInternalUser() && this.mail.state === MailState.RECEIVED) {
				toRecipients.push(this.mail.sender)
			} else if (this.mail.state === MailState.RECEIVED) {
				if (this.mail.replyTos.filter(address => !downcast(address)._errors).length > 0) {
					addAll(toRecipients, this.mail.replyTos)
				} else {
					toRecipients.push(this.mail.sender)
				}
				if (replyAll) {
					let myMailAddresses = getEnabledMailAddresses(mailboxDetails)
					addAll(ccRecipients, this.mail.toRecipients.filter(recipient =>
						!contains(myMailAddresses, recipient.address.toLowerCase())))
					addAll(ccRecipients, this.mail.ccRecipients.filter(recipient =>
						!contains(myMailAddresses, recipient.address.toLowerCase())))
				}
			} else {
				// this is a sent email, so use the to recipients as new recipients
				addAll(toRecipients, this.mail.toRecipients)
				if (replyAll) {
					addAll(ccRecipients, this.mail.ccRecipients)
					addAll(bccRecipients, this.mail.bccRecipients)
				}
			}
			return Promise.all([
				this._getSenderOfResponseMail(),
				import("../signature/Signature"),
				import("../editor/MailEditor"),
				this._referencedCids
			]).then(([senderMailAddress, {prependEmailSignature}, {newMailEditorAsResponse}, referencedCids]) => {
				const attachmentsForReply = getReferencedAttachments(this._attachments, referencedCids)
				return newMailEditorAsResponse({
						previousMail: this.mail,
						conversationType: ConversationType.REPLY,
						senderMailAddress,
						toRecipients,
						ccRecipients,
						bccRecipients,
						attachments: attachmentsForReply,
						subject,
						bodyText: prependEmailSignature(body, logins),
						replyTos: [],
					}, this.isBlockingExternalImages(),
					this._loadedInlineImages, mailboxDetails)
			})
			              .then(editor => {editor.show()})
			              .catch(ofClass(UserError, showUserError))
		}
	}

	_getMailBody(): string {
		if (this._mailBody) {
			return getMailBodyText(this._mailBody)
		} else {
			return ""
		}
	}

	_forward(): Promise<void> {
		return checkApprovalStatus(logins, false).then(sendAllowed => {
			if (sendAllowed) {
				return this._createResponseMailArgsForForwarding([], [], true).then(args => {
					return Promise.all([this._getMailboxDetails(), import("../editor/MailEditor")])
					              .then(([mailboxDetails, {newMailEditorAsResponse}]) => {
						              return newMailEditorAsResponse(args,
							              this.isBlockingExternalImages(),
							              this._loadedInlineImages,
							              mailboxDetails)
					              })
					              .then(editor => {editor.show()})
					              .catch(ofClass(UserError, showUserError))
				})
			}
		})
	}

	isBlockingExternalImages(): boolean {
		return this._contentBlockingStatus === ContentBlockingStatus.Block
			|| this._contentBlockingStatus === ContentBlockingStatus.AlwaysBlock
	}

	_createResponseMailArgsForForwarding(recipients: MailAddress[], replyTos: EncryptedMailAddress[], addSignature: boolean): Promise<ResponseMailParameters> {
		let infoLine = lang.get("date_label") + ": " + formatDateTime(this.mail.sentDate) + "<br>"
		infoLine += lang.get("from_label") + ": " + this.mail.sender.address + "<br>"
		if (this.mail.toRecipients.length > 0) {
			infoLine += lang.get("to_label") + ": " + this.mail.toRecipients.map(recipient => recipient.address)
			                                              .join(", ")
			infoLine += "<br>";
		}
		if (this.mail.ccRecipients.length > 0) {
			infoLine += lang.get("cc_label") + ": " + this.mail.ccRecipients.map(recipient => recipient.address)
			                                              .join(", ")
			infoLine += "<br>";
		}

		const mailSubject = this.mail.subject || ""
		infoLine += lang.get("subject_label") + ": " + urlEncodeHtmlTags(mailSubject);

		let body = infoLine + "<br><br><blockquote class=\"tutanota_quote\">" + this._getMailBody() + "</blockquote>";

		return Promise.all([this._getSenderOfResponseMail(), import("../signature/Signature")])
		              .then(([senderMailAddress, {prependEmailSignature}]) => {
			              return {
				              previousMail: this.mail,
				              conversationType: ConversationType.FORWARD,
				              senderMailAddress,
				              toRecipients: recipients,
				              ccRecipients: [],
				              bccRecipients: [],
				              attachments: this._attachments.slice(),
				              subject: "FWD: " + mailSubject,
				              bodyText: addSignature ? prependEmailSignature(body, logins) : body,
				              replyTos,
			              }
		              })
	}

	_getMailboxDetails(): Promise<MailboxDetail> {
		return this._mailModel.getMailboxDetailsForMail(this.mail)
	}

	async _getAssignableMailRecipients(): Promise<GroupInfo[]> {
		if (this.mail.restrictions != null && this.mail.restrictions.participantGroupInfos.length > 0) {
			const participantGroupInfos = this.mail.restrictions.participantGroupInfos
			const customer = await this._entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			const {loadGroupInfos} = await import("../../settings/LoadingUtils")
			const groupInfos = await loadGroupInfos(participantGroupInfos.filter(groupInfoId => {
				return neverNull(customer.contactFormUserGroups).list !== groupInfoId[0]
			}))
			return groupInfos.filter(groupInfo => groupInfo.deleted == null)
		} else {
			return []
		}
	}

	_assignMail(userGroupInfo: GroupInfo): Promise<boolean> {
		const recipient = createMailAddress()
		recipient.address = neverNull(userGroupInfo.mailAddress)
		recipient.name = userGroupInfo.name

		let newReplyTos;
		if (this.mail.replyTos.length > 0) {
			newReplyTos = this.mail.replyTos
		} else {
			newReplyTos = [createEncryptedMailAddress()]
			newReplyTos[0].address = this.mail.sender.address
			newReplyTos[0].name = this.mail.sender.name
		}

		return this._createResponseMailArgsForForwarding([recipient], newReplyTos, false).then(args => {
			return Promise.all([
				this._getMailboxDetails(), import("../editor/SendMailModel")
			]).then(([mailboxDetails, {defaultSendMailModel}]) => {
				return defaultSendMailModel(mailboxDetails).initAsResponse(args, this._loadedInlineImages).then(model => model.send(MailMethod.NONE))
			})
		}).then(() => this._mailModel.getMailboxFolders(this.mail)).then((folders) => {
			return moveMails(this._mailModel, [this.mail], getArchiveFolder(folders))
		})
	}

	_getSenderOfResponseMail(): Promise<string> {
		return this._mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
			let myMailAddresses = getEnabledMailAddresses(mailboxDetails)
			let addressesInMail = []
			addAll(addressesInMail, this.mail.toRecipients)
			addAll(addressesInMail, this.mail.ccRecipients)
			addAll(addressesInMail, this.mail.bccRecipients)
			addressesInMail.push(this.mail.sender)
			let foundAddress = addressesInMail.find(address => contains(myMailAddresses, address.address.toLowerCase()))
			if (foundAddress) {
				return foundAddress.address.toLowerCase()
			} else {
				return getDefaultSender(logins, mailboxDetails)
			}
		})
	}

	_handleAnchorClick(event: Event, shouldDispatchSyntheticClick: boolean): void {
		let target = (event.target: any)
		if (target && target.closest) {
			let anchorElement = target.closest("a")
			if (anchorElement && startsWith(anchorElement.href, "mailto:")) {
				event.preventDefault()
				if (isNewMailActionAvailable()) { // disable new mails for external users.
					import("../editor/MailEditor").then(({newMailtoUrlMailEditor}) => {
						newMailtoUrlMailEditor(anchorElement.href, !logins.getUserController().props.defaultUnconfidential)
							.then(editor => editor.show())
							.catch(ofClass(CancelledError, noOp))
					})
				}
			}
			// Navigate to the settings menu if they are linked within an email.
			else if (anchorElement
				&& isTutanotaTeamMail(this.mail)
				&& startsWith(anchorElement.href, (anchorElement.origin + "/settings/"))) {
				let newRoute = anchorElement.href.substr(anchorElement.href.indexOf("/settings/"))
				m.route.set(newRoute)
				event.preventDefault()
			} else if (anchorElement && shouldDispatchSyntheticClick) {
				let newClickEvent: MouseEvent & {synthetic?: boolean} = new MouseEvent("click")
				newClickEvent.synthetic = true
				anchorElement.dispatchEvent(newClickEvent)
			}
		}
	}

	scrollUp(): void {
		this._scrollIfDomBody((dom) => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.max(0, current - toScroll))
		})
	}

	scrollDown(): void {
		this._scrollIfDomBody((dom) => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.min(dom.scrollHeight - dom.offsetHeight, dom.scrollTop + toScroll))
		})
	}

	scrollToTop(): void {
		this._scrollIfDomBody((dom) => {
			return scroll(dom.scrollTop, 0)
		})
	}

	scrollToBottom(): void {
		this._scrollIfDomBody((dom) => {
			const end = dom.scrollHeight - dom.offsetHeight
			return scroll(dom.scrollTop, end)
		})
	}

	_showHeaders() {
		if (!this.mailHeaderDialog.visible) {
			if (this.mail.headers) {
				this._entityClient.load(MailHeadersTypeRef, this.mail.headers).then(mailHeaders => {
						this.mailHeaderInfo = getMailHeaders(mailHeaders)
						this.mailHeaderDialog.show()
					}
				).catch(ofClass(NotFoundError, noOp))
			} else {
				this.mailHeaderInfo = lang.get("noMailHeadersInfo_msg")
				this.mailHeaderDialog.show()
			}
		}
	}

	_scrollIfDomBody(cb: (dom: HTMLElement) => DomMutation) {
		if (this._domForScrolling) {
			const dom = this._domForScrolling
			if (!this._scrollAnimation) {
				this._scrollAnimation = animations.add(dom, cb(dom), {easing: ease.inOut}).then(() => {
					this._scrollAnimation = null
				})
			}
		}
	}

	_downloadAndOpenAttachment(file: TutanotaFile, open: boolean): void {
		fileController.downloadAndOpen(file, open)
		              .catch(ofClass(FileOpenError, (e) => {
			              console.warn("FileOpenError", e)
			              Dialog.error("canNotOpenFileOnDevice_msg")
		              }))
		              .catch(e => {
			              const msg = e || "unknown error"
			              console.error("could not open file:", msg)
			              return Dialog.error("errorDuringFileOpen_msg")
		              })
	}

	_createAttachmentsButtons(files: $ReadOnlyArray<TutanotaFile>, inlineCids: $ReadOnlyArray<Id>): Button[] {
		// Only show file buttons which do not correspond to inline images in HTML
		files = files.filter((item) => inlineCids.includes(item.cid) === false)
		let buttons
		// On Android we give an option to open a file from a private folder or to put it into "Downloads" directory
		if (isAndroidApp() || isDesktop()) {
			buttons = files.map(file => {
				const dropdownButton: Button = createDropDownButton(() => file.name,
					() => Icons.Attachment,
					() => [
						new Button("open_action", () => this._downloadAndOpenAttachment(file, true), null)
							.setType(ButtonType.Dropdown),
						new Button("download_action", () => this._downloadAndOpenAttachment(file, false), null)
							.setType(ButtonType.Dropdown)
					], 200, () => {
						// Bubble buttons use border so dropdown is misaligned by default
						const rect = dropdownButton._domButton.getBoundingClientRect()
						return new DomRectReadOnlyPolyfilled(rect.left + size.bubble_border_width, rect.top,
							rect.width, rect.height)
					})
					.setType(ButtonType.Bubble)
					.setStaticRightText("(" + formatStorageSize(Number(file.size))
						+ ")")
				return dropdownButton
			})
		} else {
			buttons = files.map(file => new Button(() => file.name,
				() => this._downloadAndOpenAttachment(file, true),
				() => Icons.Attachment)
				.setType(ButtonType.Bubble)
				.setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
			)
		}
		return buttons
	}

	_downloadAll() {
		this._referencedCids
		    .then(inlineFileIds => this._attachments.filter(a => !inlineFileIds.includes(a.cid)))
		    .then(nonInlineFiles => showProgressDialog("pleaseWait_msg", fileController.downloadAll(nonInlineFiles)))
	}

	_handleDoubleTap(e: MaybeSyntheticEvent, singleClickAction: (e: MaybeSyntheticEvent) => void, doubleClickAction: (e: MaybeSyntheticEvent) => void) {
		const lastClick = this._lastBodyTouchEndTime
		const now = Date.now()
		const touch = e.changedTouches[0]
		// If there are no touches or it's not cancellable event (e.g. scroll) or more than certain time has passed or finger moved too
		// much then do nothing
		if (!touch || e.synthetic || !e.cancelable || Date.now() - this._lastTouchStart.time > DOUBLE_TAP_TIME_MS
			|| touch.clientX - this._lastTouchStart.x > 40 || touch.clientY - this._lastTouchStart.y > 40) {
			return
		}
		e.preventDefault()
		if (now - lastClick < DOUBLE_TAP_TIME_MS) {
			this._isScaling = !this._isScaling
			this._lastBodyTouchEndTime = 0
			;(e: any).redraw = false
			doubleClickAction(e)
		} else {
			setTimeout(() => {
				if (this._lastBodyTouchEndTime === now) {
					singleClickAction(e)
				}
			}, DOUBLE_TAP_TIME_MS)
		}
		this._lastBodyTouchEndTime = now
	}

	_renderPhishingWarning(): ?Children {
		if (this._suspicious) {
			return m(InfoBanner, {
				message: "phishingMessageBody_msg",
				icon: Icons.Warning,
				type: BannerType.Warning,
				helpLink: "phishing_link",
				buttons: [{label: "markAsNotPhishing_action", click: () => this._markAsNotPhishing()}]
			})
		}
	}

	_renderHardAuthenticationFailWarning(mail: Mail): ?Children {
		if (!this._warningDismissed && mail.authStatus === MailAuthenticationStatus.HARD_FAIL) {
			return m(InfoBanner, {
				message: "mailAuthFailed_msg",
				icon: Icons.Warning,
				helpLink: "mailAuth_link",
				type: BannerType.Warning,
				buttons: [{label: "close_alt", click: () => this._warningDismissed = true}]
			})
		}
	}

	_renderSoftAuthenticationFailWarning(mail: Mail): ?Children {
		if (!this._warningDismissed && mail.authStatus === MailAuthenticationStatus.SOFT_FAIL) {
			return m(InfoBanner, {
				message: () => mail.differentEnvelopeSender
					? lang.get("mailAuthMissingWithTechnicalSender_msg", {"{sender}": mail.differentEnvelopeSender})
					: lang.get("mailAuthMissing_label"),
				icon: Icons.Warning,
				helpLink: "mailAuth_link",
				buttons: [{label: "close_alt", click: () => this._warningDismissed = true}]
			})
		} else {
			return null
		}
	}

	_renderExternalContentBanner(): ?Children {
		// only show banner when there are blocked images and the user hasn't made a decision about how to handle them
		if (this._contentBlockingStatus !== ContentBlockingStatus.Block) {
			return null
		}

		const showButton = {
			label: "showBlockedContent_action",
			click: () => this._setContentBlockingStatus(ContentBlockingStatus.Show)
		}

		const alwaysOrNeverAllowButtons: $ReadOnlyArray<ButtonAttrs> = locator.search.indexingSupported
			? [
				this.mail.authStatus === MailAuthenticationStatus.AUTHENTICATED
					? {
						label: "allowExternalContentSender_action",
						click: () => this._setContentBlockingStatus(ContentBlockingStatus.AlwaysShow),
					}
					: null,
				{
					label: "blockExternalContentSender_action",
					click: () => this._setContentBlockingStatus(ContentBlockingStatus.AlwaysBlock),
				}
			].filter(Boolean)
			: []

		// on narrow screens the buttons will end up on 2 lines if there are too many, this looks bad.
		const maybeDropdownButtons = styles.isSingleColumnLayout() && alwaysOrNeverAllowButtons.length > 1
			? [createMoreSecondaryButtonAttrs(alwaysOrNeverAllowButtons, 216)]
			: alwaysOrNeverAllowButtons

		return m(InfoBanner, {
			message: "contentBlocked_msg",
			icon: Icons.Picture,
			helpLink: "loadImages_link",
			buttons: [
				showButton,
				...maybeDropdownButtons
			]
		})
	}

	async _setContentBlockingStatus(status: ExternalContentBlockingStatusEnum): Promise<void> {
		// We can only be set to NoExternalContent when initially loading the mailbody (_loadMailBody)
		// so we ignore it here, and don't do anything if we were already set to NoExternalContent
		if (status === ContentBlockingStatus.NoExternalContent
			|| this._contentBlockingStatus === ContentBlockingStatus.NoExternalContent
			|| this._contentBlockingStatus === status) {
			return
		}

		if (status === ContentBlockingStatus.AlwaysShow) {
			this._configFacade.addExternalImageRule(this.mail.sender.address, ExternalImageRule.Allow).catch(ofClass(IndexingNotSupportedError, noOp))
		} else if (status === ContentBlockingStatus.AlwaysBlock) {
			this._configFacade.addExternalImageRule(this.mail.sender.address, ExternalImageRule.Block).catch(ofClass(IndexingNotSupportedError, noOp))
		} else {
			// we are going from allow or block to something else it means we're resetting to the default rule for the given sender
			this._configFacade.addExternalImageRule(this.mail.sender.address, ExternalImageRule.None).catch(ofClass(IndexingNotSupportedError, noOp))
		}
		this._contentBlockingStatus = status

		// We don't check mail authentication status here because the user has manually called this
		await this.setSanitizedMailBodyFromMail(this.mail, this.isBlockingExternalImages())
		this._domBodyDeferred = defer()
		this._domBody = null
		this._replaceInlineImages()
	}

	async setSanitizedMailBodyFromMail(mail: Mail, blockExternalContent: boolean): Promise<{inlineImageCids: Array<string>, links: Array<Link>, externalContent: Array<string>}> {
		const {htmlSanitizer} = await import("../../misc/HtmlSanitizer")
		const {html, inlineImageCids, links, externalContent} = htmlSanitizer.sanitizeFragment(this._getMailBody(), {
			blockExternalContent,
			allowRelativeLinks: isTutanotaTeamMail(mail)
		})

		/**
		 * Check if we need to improve contrast for dark theme. We apply the contrast fix if any of the following is contained in
		 * the html body of the mail
		 *  * any tag with a style attribute that has the color property set (besides "inherit")
		 *  * any tag with a style attribute that has the background-color set (besides "inherit")
		 *  * any font tag with the color attribute set
		 */
		this._contrastFixNeeded =
			Array.from(html.querySelectorAll('*[style]'), e => e.style)
			     .some(s => (s.color && s.color !== "inherit") || (s.backgroundColor && s.backgroundColor !== "inherit"))
			|| html.querySelectorAll('font[color]').length > 0

		this._sanitizedMailBody = await locator.worker.urlify(stringifyFragment(html))

		m.redraw()

		return {inlineImageCids, links, externalContent}
	}
}