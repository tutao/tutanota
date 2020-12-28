// @flow
import {px, size} from "../gui/size"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {serviceRequestVoid} from "../api/main/Entity"
import {Button, createAsyncDropDownButton, createDropDownButton} from "../gui/base/Button"
import {formatDateTime, formatDateWithWeekday, formatStorageSize, formatTime, urlEncodeHtmlTags} from "../misc/Formatter"
import {windowFacade} from "../misc/WindowFacade"
import {ease} from "../gui/animation/Easing"
import type {DomMutation} from "../gui/animation/Animations"
import {animations, scroll} from "../gui/animation/Animations"
import {nativeApp} from "../native/NativeWrapper"
import type {MailBody} from "../api/entities/tutanota/MailBody"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import type {CalendarMethodEnum, InboxRuleTypeEnum, MailReportTypeEnum} from "../api/common/TutanotaConstants"
import {
	ConversationType,
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
} from "../api/common/TutanotaConstants"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import {FileTypeRef} from "../api/entities/tutanota/File"
import {fileController} from "../file/FileController"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode, isAndroidApp, isDesktop, isIOSApp} from "../api/Env"
import {htmlSanitizer, stringifyFragment} from "../misc/HtmlSanitizer"
import {Dialog} from "../gui/base/Dialog"
import type {DeferredObject} from "../api/common/utils/Utils"
import {defer, downcast, getMailBodyText, getMailHeaders, neverNull, noOp} from "../api/common/utils/Utils"
import {addAll, contains} from "../api/common/utils/ArrayUtils"
import {startsWith} from "../api/common/utils/StringUtils"
import {Request} from "../api/common/WorkerProtocol.js"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import {
	prependEmailSignature,
	createNewContact,
	getArchiveFolder,
	getDefaultSender,
	getDisplayText,
	getEnabledMailAddresses,
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
	replaceCidsWithInlineImages,
	showDeleteConfirmationDialog
} from "./MailUtils"
import {ContactEditor} from "../contacts/ContactEditor"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox"
import type {KeyPress} from "../misc/KeyManager"
import {keyManager} from "../misc/KeyManager"
import * as AddInboxRuleDialog from "../settings/AddInboxRuleDialog"
import {createInboxRuleTemplate} from "../settings/AddInboxRuleDialog"
import {showAddSpamRuleDialog} from "../settings/AddSpamRuleDialog"
import {urlify} from "../misc/Urlifier"
import {logins} from "../api/main/LoginController"
import {Icon, progressIcon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import type {MailAddress} from "../api/entities/tutanota/MailAddress"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"
import type {EncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {createEncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {loadGroupInfos} from "../settings/LoadingUtils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {LockedError, NotAuthorizedError, NotFoundError} from "../api/common/error/RestError"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {theme} from "../gui/theme"
import {LazyContactListId, searchForContactByMailAddress} from "../contacts/ContactUtils"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {elementIdPart, getListId, HttpMethod, listIdPart} from "../api/common/EntityFunctions"
import {createListUnsubscribeData} from "../api/entities/tutanota/ListUnsubscribeData"
import {MailHeadersTypeRef} from "../api/entities/tutanota/MailHeaders"
import {mailToEmlFile} from "./Exporter"
import {client} from "../misc/ClientDetector"
import type {PosRect} from "../gui/base/Dropdown"
import {DomRectReadOnlyPolyfilled} from "../gui/base/Dropdown"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import Badge from "../gui/base/Badge"
import {FileOpenError} from "../api/common/error/FileOpenError"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import type {ButtonAttrs, ButtonColorEnum} from "../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import {styles} from "../gui/styles"
import {worker} from "../api/main/WorkerClient"
import {CALENDAR_MIME_TYPE} from "../calendar/CalendarUtils"
import {createAsyncDropdown, createDropdown} from "../gui/base/DropdownN"
import {navButtonRoutes} from "../misc/RouteChange"
import {createEmailSenderListElement} from "../api/entities/sys/EmailSenderListElement"
import {isNewMailActionAvailable} from "./MailView"
import {RecipientButton} from "../gui/base/RecipientButton"
import {Banner, BannerType} from "../gui/base/Banner"
import {createReportPhishingPostData} from "../api/entities/tutanota/ReportPhishingPostData"
import {base64ToUint8Array} from "../api/common/utils/Encoding"
import type {Mail} from "../api/entities/tutanota/Mail"
import {_TypeModel as MailTypeModel} from "../api/entities/tutanota/Mail"
import {copyToClipboard} from "../misc/ClipboardUtils"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {EventBanner} from "./EventBanner"
import {checkApprovalStatus} from "../misc/LoginUtils"
import {getEventFromFile} from "../calendar/CalendarInvites"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {newMailEditorAsResponse, newMailEditorFromDraft, newMailtoUrlMailEditor} from "./MailEditorN"
import type {MailboxDetail} from "./MailModel"
import type {ResponseMailParameters} from "./SendMailModel"
import {defaultSendMailModel} from "./SendMailModel"
import {UserError} from "../api/common/error/UserError"
import {showUserError} from "../misc/ErrorHandlerImpl"
import {EntityClient} from "../api/common/EntityClient"
import {MailModel} from "./MailModel"

assertMainOrNode()

export type InlineImages = Map<string, {file: TutanotaFile | DataFile, url: string}>

// synthetic events are fired in code to distinguish between double and single click events
type MaybeSyntheticEvent = TouchEvent & {synthetic?: boolean}


const DOUBLE_TAP_TIME_MS = 350
const SCROLL_FACTOR = 4 / 5

/**
 * The MailViewer displays a mail. The mail body is loaded asynchronously.
 */
export class MailViewer {
	view: Function;
	mail: Mail;
	_mailBody: ?MailBody;
	_contrastFixNeeded: boolean;
	_htmlBody: string; // always sanitized
	_loadingAttachments: boolean;
	_attachments: TutanotaFile[];
	_attachmentButtons: Button[];
	_contentBlocked: boolean;
	_domMailViewer: ?HTMLElement;
	_bodyLineHeight: number;
	_errorOccurred: boolean;
	oncreate: Function;
	onbeforeremove: Function;
	onremove: Function;
	_scrollAnimation: Promise<void>;
	_folderText: ?string;
	mailHeaderDialog: Dialog;
	mailHeaderInfo: string;
	_isScaling: boolean;
	_filesExpanded: Stream<boolean>;
	_inlineFileIds: Promise<Array<string>>
	_inlineImages: Promise<InlineImages>;
	_suspicious: boolean;
	_domBodyDeferred: DeferredObject<HTMLElement>;
	_lastBodyTouchEndTime: number = 0;
	_lastTouchStart: {x: number, y: number, time: number};
	_domForScrolling: ?HTMLElement
	_warningDismissed: boolean;
	_calendarEventAttachment: ?{|event: CalendarEvent, method: CalendarMethodEnum, recipient: string|};
	_entityClient: EntityClient;
	_mailModel: MailModel;

	constructor(mail: Mail, showFolder: boolean, entityClient: EntityClient, mailModel: MailModel) {
		if (isDesktop()) {
			nativeApp.invokeNative(new Request('sendSocketMessage', [{mailAddress: mail.sender.address}]))
		}
		this.mail = mail
		this._entityClient = entityClient
		this._mailModel = mailModel
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
		this._htmlBody = ""
		this._contrastFixNeeded = false
		this._contentBlocked = false
		this._bodyLineHeight = size.line_height
		this._errorOccurred = false
		this._domMailViewer = null
		this._suspicious = false
		this._scrollAnimation = Promise.resolve()
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

		const resizeListener = () => this._updateLineHeight()
		windowFacade.addResizeListener(resizeListener)

		const bubbleMenuWidth = 300

		const expanderStyle = {}
		const detailsExpander = this._createDetailsExpander(bubbleMenuWidth, mail, expanderStyle)


		//We call those sequentially as _loadAttachments() waits for _inlineFileIds to resolve
		this._inlineFileIds = this._loadMailBody(mail)
		this._inlineImages = this._loadAttachments(mail)
		this._inlineImages.then(() => {
			// load the conversation entry here because we expect it to be loaded immediately when responding to this email
			this._entityClient.load(ConversationEntryTypeRef, mail.conversationEntry)
			    .catch(NotFoundError, e => console.log("could load conversation entry as it has been moved/deleted already", e))
		})


		this.view = () => {
			const dateTime = formatDateWithWeekday(this.mail.receivedDate) + " • " + formatTime(this.mail.receivedDate)
			expanderStyle.paddingTop = styles.isUsingBottomNavigation() ? "0" : "16px"
			return [
				m("#mail-viewer.fill-absolute"
					+ (client.isMobileDevice() ? ".scroll-no-overlay.overflow-x-hidden" : ".flex.flex-column"), {
						oncreate: (vnode) => this._domMailViewer = vnode.dom
					}, [
						m(".header.plr-l.margin-are-inset-lr", [
							m(".flex-space-between.button-min-height", [ // the natural height may vary in browsers (Firefox), so set it to button height here to make it similar to the MultiMailViewer
								m(".flex.flex-column-reverse", [
									(detailsExpander.panel.expanded)
										? m("small.flex.text-break", lang.get("from_label"))
										: m(".small.flex.text-break.selectable.badge-line-height.flex-wrap.pt-s",
										{title: getSenderOrRecipientHeadingTooltip(this.mail)}, [
											this._tutaoBadge(),
											getSenderOrRecipientHeading(this.mail, false)
										]),
									(this._folderText) ? m("small.b.flex.pt", {style: {color: theme.navigation_button}}, this._folderText) : null,
								]),
								this._isAnnouncement() || styles.isUsingBottomNavigation()
									? null
									: m(detailsExpander)
							]),
							m(detailsExpander.panel),
							m(".subject-actions.flex-space-between.flex-wrap.mt-xs", [
								m(".left.flex-grow-shrink-150", [
									m(".subject.text-break.selectable", {
										"aria-label": lang.get("subject_label") + ", " + this.mail.subject,
									}, this.mail.subject),
									m(".flex.items-center.content-accent-fg.svg-content-accent-fg"
										+ (this.mail.confidential ? ".ml-negative-xs" : ""), {
										// Orca refuses to read ut unless it's not focusable
										tabindex: TabIndex.Default,
										"aria-label": lang.get(this.mail.confidential ? "confidential_action" : "nonConfidential_action")
											+ ", " + dateTime
									}, [
										this.mail.confidential ? m(Icon, {icon: Icons.Lock}) : null,
										m("small.date.mt-xs", dateTime),
										m(".flex-grow"),
										m(".flex.flex-column-reverse",
											this._isAnnouncement() || !styles.isUsingBottomNavigation() ? null : m(detailsExpander)),
									]),
								]),
								styles.isUsingBottomNavigation() ? null : this.actionButtons(),
							]),
							styles.isUsingBottomNavigation() ? this.actionButtons() : null,
							this._suspicious
								? m(Banner, {
									type: BannerType.Warning,
									title: lang.get("phishingMessage_label"),
									message: lang.get("phishingMessageBody_msg"),
									icon: Icons.Warning,
									helpLink: lang.getInfoLink("phishing_link"),
									buttons: [{text: lang.get("markAsNotPhishing_action"), click: () => this._markAsNotPhishing()}]
								})
								: !this._warningDismissed && mail.authStatus === MailAuthenticationStatus.HARD_FAIL
								? m(Banner, {
									type: BannerType.Warning,
									title: lang.get("mailAuthFailed_label"),
									message: lang.get("mailAuthFailed_msg"),
									icon: Icons.Warning,
									helpLink: lang.getInfoLink("mailAuth_link"),
									buttons: [{text: lang.get("close_alt"), click: () => this._warningDismissed = true}]
								})
								: !this._warningDismissed && mail.authStatus === MailAuthenticationStatus.SOFT_FAIL
									? m(Banner, {
										type: BannerType.Info,
										title: lang.get("mailAuthMissing_label"),
										message: mail.differentEnvelopeSender ? lang.get("technicalSender_msg", {"{sender}": mail.differentEnvelopeSender}) : "",
										icon: Icons.Warning,
										helpLink: lang.getInfoLink("mailAuth_link"),
										buttons: [{text: lang.get("close_alt"), click: () => this._warningDismissed = true}]
									})
									: null,
							this._renderEventBanner(),
							this._renderAttachments(),
							m("hr.hr.mb.mt-s"),
						]),

						m(".rel.margin-are-inset-lr.scroll-x.plr-l.pb-floating"
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
										this._handleDoubleTap(event, (e) => this._handleAnchorClick(e, true), () => this._rescale(true))
									}
								},
								onclick: (event: MouseEvent) => {
									if (!client.isMobileDevice()) {
										this._handleAnchorClick(event, false)
									}
								},
							},
							m("#mail-body.selectable.touch-callout.break-word-links", {
								oncreate: vnode => {
									this._domBodyDeferred.resolve(vnode.dom)
									this._updateLineHeight()
									this._rescale(false)
								},
								onupdate: (vnode) => {
									if (this._domBodyDeferred.promise.isPending()) {
										this._domBodyDeferred.resolve(vnode.dom)
									}
									this._rescale(false)
								},
								onsubmit: (event: Event) => this._confirmSubmit(event),
								style: {'line-height': this._bodyLineHeight.toString(), 'transform-origin': 'top left'},
							}, (this._mailBody == null && !this._errorOccurred)
								? m(".progress-panel.flex-v-center.items-center", {
									style: {
										height: '200px'
									}
								}, [
									progressIcon(),
									m("small", lang.get("loading_msg"))
								])
								: ((this._errorOccurred || this.mail._errors || (this._mailBody != null && this._mailBody._errors))
									? m(ColumnEmptyMessageBox, {
										message: "corrupted_msg",
										icon: Icons.Warning,
										color: theme.content_message_bg,
									})
									: m.trust(this._htmlBody))) // this._htmlBody is always sanitized
						)
					],
				),
			]
		}

		this.onremove = () => windowFacade.removeResizeListener(resizeListener)
		this._setupShortcuts()
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

	_createDetailsExpander(bubbleMenuWidth: number, mail: Mail, expanderStyle: {}): ExpanderButton {
		return new ExpanderButton("showMore_action", new ExpanderPanel({
			view: () => {
				const envelopeSender = this.mail.differentEnvelopeSender
				return m("", [
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
								click: () => this._showEnvelopeSenderDialog(envelopeSender),
							})
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
				])
			}
		}), false, expanderStyle)
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
							.return(true)
					})
				} else {
					return false
				}
			})).then(success => {
				if (success) {
					return Dialog.error("unsubscribeSuccessful_msg")
				}
			}).catch(LockedError, e => {
				return Dialog.error("operationStillActive_msg")
			}).catch(e => {
				return Dialog.error("unsubscribeFailed_msg")
			})
		}
		return Promise.resolve()
	}

	actionButtons(): Children {
		const mail = this.mail
		const actions = []
		const colors = ButtonColors.Content

		actions.push(this._createLoadExternalContentButton(mail, colors))
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
										click: () => this._mailModel.moveMails([mail], f),
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
				showDeleteConfirmationDialog([this.mail]).then((confirmed) => {
					if (confirmed) {
						this._mailModel.deleteMails([this.mail])
					}
				})
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
					const moreButtons = []
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
							click: () => this._exportMail(),
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
					return moreButtons
				}, /*width=*/300)
			}))
		}

		return m(".action-bar.flex-end.items-center.mr-negative-s", actions)
	}

	_reportMail() {
		const sendReport = (reportType: MailReportTypeEnum) => {
			worker.resolveSessionKey(MailTypeModel, this.mail)
			      .then((mailSessionKeyB64) => {
				      const postData = createReportPhishingPostData({
					      mailId: this.mail._id,
					      mailSessionKey: base64ToUint8Array(neverNull(mailSessionKeyB64)),
					      reportType,
				      })
				      return serviceRequestVoid(TutanotaService.ReportPhishingService, HttpMethod.POST, postData)
			      })
			      .then(() => {
				      if (reportType === MailReportType.PHISHING) {
					      this.mail.phishingStatus = MailPhishingStatus.SUSPICIOUS
					      return this._entityClient.update(this.mail)
				      }
			      })
			      .then(() => this._mailModel.getMailboxDetailsForMail(this.mail))
			      .then((mailboxDetails) => {
				      const spamFolder = getFolder(mailboxDetails.folders, MailFolderType.SPAM)
				      return this._mailModel.moveMails([this.mail], spamFolder)
			      })
			      .catch(LockedError, () => Dialog.error("operationStillActive_msg"))
			      .catch(NotFoundError, () => console.log("mail already moved"))
			      .then(m.redraw)

		}

		const dialog = Dialog.showActionDialog({
			title: lang.get("reportEmail_action"),
			child: () => m(".flex.col.mt-m", {
				// So that space below buttons doesn't look huge
				style: {marginBottom: "-10px"},
			}, [
				m("div", lang.get("phishingReport_msg")),
				m("a.mt-s", {href: lang.getInfoLink("phishing_link"), target: "_blank"}, lang.get("whatIsPhishing_msg")),
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

	_exportMail() {
		const exportPromise = mailToEmlFile(
			this.mail,
			this._mailBody ? htmlSanitizer.sanitize(this._getMailBody(), false).text : ""
		)
		showProgressDialog("pleaseWait_msg", exportPromise).then(df => fileController.open(df))
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

	_checkMailForPhishing(mail: Mail, links: Array<string>) {
		if (mail.phishingStatus === MailPhishingStatus.SUSPICIOUS) {
			this._suspicious = true
		} else if (mail.phishingStatus === MailPhishingStatus.UNKNOWN) {
			this._mailModel.checkMailForPhishing(mail, links).then((isSuspicious) => {
				if (isSuspicious) {
					this._suspicious = true
					mail.phishingStatus = MailPhishingStatus.SUSPICIOUS
					this._entityClient.update(mail)
					    .catch(LockedError, e => console.log("could not update mail phishing status as mail is locked"))
					    .catch(NotFoundError, e => console.log("mail already moved"))
					m.redraw()
				}
			})
		}
	}

	getBounds(): ?PosRect {
		return this._domMailViewer && this._domMailViewer.getBoundingClientRect()
	}

	_createAssignActionButton(mail: Mail): Button {
		// remove the current mailbox/owner from the recipients list.
		const mailRecipients = this._getAssignableMailRecipients().filter(userOrMailGroupInfo => {
			if (logins.getUserController().getUserMailGroupMembership().group === this.mail._ownerGroup) {
				return userOrMailGroupInfo.group !== logins.getUserController().userGroupInfo.group
					&& userOrMailGroupInfo.group !== mail._ownerGroup
			} else {
				return userOrMailGroupInfo.group !== mail._ownerGroup
			}
		}).map(userOrMailGroupInfo => {
			return new Button(() => getDisplayText(userOrMailGroupInfo.name, neverNull(userOrMailGroupInfo.mailAddress), true), () => this._assignMail(userOrMailGroupInfo), () => BootIcons.Contacts)
				.setType(ButtonType.Dropdown)
		})
		return createAsyncDropDownButton('forward_action', () => Icons.Forward, () => mailRecipients, 250)
	}

	_createLoadExternalContentButton(mail: Mail, colors: ButtonColorEnum): Children {
		return this._contentBlocked
			? m(ButtonN, {
				label: "contentBlocked_msg",
				icon: () => Icons.Picture,
				colors,
				click: () => {
					if (this._mailBody) {
						Dialog.confirm("contentBlocked_msg", "showBlockedContent_action").then((confirmed) => {
							if (confirmed) {
								this._htmlBody = urlify(stringifyFragment(htmlSanitizer.sanitizeFragment(this._getMailBody(), false, isTutanotaTeamMail(mail)).html))
								this._contentBlocked = false
								this._domBodyDeferred = defer()
								this._replaceInlineImages()
								m.redraw()
							}
						})

					}
				}
			})
			: null
	}


	_replaceInlineImages() {
		this._inlineImages.then((loadedInlineImages) => {
			this._domBodyDeferred.promise.then(domBody => {
				replaceCidsWithInlineImages(domBody, loadedInlineImages, (file, event, dom) =>
					file._type !== "DataFile"
						? createDropdown(() => [
							{
								label: "download_action",
								click: () => {
									this._downloadAndOpenAttachment(downcast(file), true)
								},
								type: ButtonType.Dropdown
							}
						])(downcast(event), dom)
						: noOp
				)
			})
		})
	}

	/** @return list of inline referenced cid */
	_loadMailBody(mail: Mail): Promise<Array<string>> {
		return this._entityClient.load(MailBodyTypeRef, mail.body).then(body => {
			this._mailBody = body
			let sanitizeResult = htmlSanitizer.sanitizeFragment(this._getMailBody(), true, isTutanotaTeamMail(mail))
			this._checkMailForPhishing(mail, sanitizeResult.links)

			/**
			 * check if we need to improve contrast for dark theme.
			 * 1. theme id must be 'dark'
			 * 2. html body needs to contain any tag with a style attribute that has the color property set (besides "inherit")
			 * OR
			 * there is a font tag with the color attribute set
			 */
			this._contrastFixNeeded = (
				'undefined' !== typeof Array.from(sanitizeResult.html.querySelectorAll('*[style]'), e => e.style)
				                            .find(s => s.color !== "" && s.color !== "inherit" && typeof s.color !== 'undefined')
				|| 0 < Array.from(sanitizeResult.html.querySelectorAll('font[color]'), e => e.style).length
			)
			this._htmlBody = urlify(stringifyFragment(sanitizeResult.html))

			this._contentBlocked = sanitizeResult.externalContent.length > 0
			m.redraw()
			return sanitizeResult.inlineImageCids
		}).catch(NotFoundError, e => {
			this._errorOccurred = true
			console.log("could load mail body as it has been moved/deleted already", e)
			return []
		}).catch(NotAuthorizedError, e => {
			this._errorOccurred = true
			console.log("could load mail body as the permission is missing", e)
			return []
		})
	}

	_loadAttachments(mail: Mail): Promise<InlineImages> {
		if (mail.attachments.length === 0) {
			this._loadingAttachments = false
			return Promise.resolve(new Map())
		} else {
			//We wait for _inlineFileIds to resolve in order to make the server requests sequentially
			return this._inlineFileIds.then((inlineCids) => {
				this._loadingAttachments = true
				const attachmentsListId = listIdPart(mail.attachments[0])
				const attachmentElementIds = mail.attachments.map(attachment => elementIdPart(attachment))
				return this._entityClient.loadMultipleEntities(FileTypeRef, attachmentsListId, attachmentElementIds)
				           .then(files => {
					           const calendarFile = files.find(a => a.mimeType && a.mimeType.startsWith(CALENDAR_MIME_TYPE))
					           if (calendarFile
						           && (mail.method === MailMethod.ICAL_REQUEST || mail.method === MailMethod.ICAL_REPLY)
						           && mail.state === MailState.RECEIVED
					           ) {
						           Promise.all([
							           getEventFromFile(calendarFile),
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
					           this._attachments = files
					           this._attachmentButtons = this._createAttachmentsButtons(files, inlineCids)
					           this._loadingAttachments = false
					           m.redraw()
					           const filesToLoad = files.filter(file => inlineCids.find(inline => file.cid === inline))
					           const inlineImages: InlineImages = new Map()
					           return Promise
						           .each(filesToLoad, (file) => worker.downloadFileContent(file).then(dataFile => {
							           const blob = new Blob([dataFile.data], {
								           type: dataFile.mimeType
							           })
							           inlineImages.set(neverNull(file.cid), {
								           file,
								           url: URL.createObjectURL(blob)
							           })
						           })).return(inlineImages)
				           })
				           .catch(NotFoundError, e => {
					           console.log("could load attachments as they have been moved/deleted already", e)
					           return new Map()
				           })
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
			return m(".flex.ml-negative-bubble.flex-wrap",
				[
					this._attachmentButtons.length > spoilerLimit
						? [
							this._attachmentButtons.slice(0, spoilerLimit).map(m),
							m(ExpanderButtonN, {
								label: "showAll_action",
								expanded: this._filesExpanded,
								style: {
									margin: "0 6px",
									paddingTop: "0"
								}
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
		if (!client.isMobileDevice() || !this._domBodyDeferred.promise.isFulfilled()) {
			return
		}
		const child = this._domBodyDeferred.promise.value()
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
		}
		// onbeforeremove is only called if we are removed from the parent
		// e.g. it is not called when switching to contact view
		this.onbeforeremove = () => {
			this._inlineImages.then((inlineImages) => {
				for (let img of inlineImages.values()) {
					URL.revokeObjectURL(img.url)
				}
			})
		}
	}

	_updateLineHeight() {
		this._domBodyDeferred.promise.then((domBody) => {
			const width = domBody.offsetWidth
			if (width > 900) {
				this._bodyLineHeight = size.line_height_l
			} else if (width > 600) {
				this._bodyLineHeight = size.line_height_m
			} else {
				this._bodyLineHeight = size.line_height
			}
			m.redraw()
		})
	}

	_confirmSubmit(event: Event) {
		// use the default confirm dialog here because the submit can not be done async
		if (!confirm(lang.get("reallySubmitContent_msg"))) {
			event.preventDefault();
		}
	}

	_createBubbleContextButtons(address: MailAddress | EncryptedMailAddress, defaultInboxRuleField: ?InboxRuleTypeEnum): Promise<Array<ButtonAttrs>> {
		const buttons = [
			{
				label: "copy_action",
				type: ButtonType.Secondary,
				click: () => copyToClipboard(address.address),
			}
		]
		if (logins.getUserController().isInternalUser()) {
			let contactsPromise = Promise.resolve()
			if (!logins.isEnabled(FeatureType.DisableContacts)) {
				contactsPromise = searchForContactByMailAddress(address.address).then(contact => {
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
								LazyContactListId.getAsync().then(contactListId => {
									const contact = createNewContact(logins.getUserController().user, address.address, address.name)
									new ContactEditor(contact, contactListId).show()
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
						&& !logins.getUserController().isOutlookAccount()
						&& !logins.isEnabled(FeatureType.InternalCommunication)) {
						let rule = AddInboxRuleDialog.getExistingRuleForType(address.address.trim().toLowerCase(), defaultInboxRuleField)
						let actionLabel = "editInboxRule_action"
						if (!rule) {
							rule = createInboxRuleTemplate(defaultInboxRuleField, address.address.trim().toLowerCase())
							actionLabel = "addInboxRule_action"
						}
						buttons.push({
							label: actionLabel,
							click: () => AddInboxRuleDialog.show(mailboxDetails, neverNull(rule)),
							type: ButtonType.Secondary,
						})
					}
					if (logins.isGlobalAdminUserLoggedIn() && !logins.isEnabled(FeatureType.InternalCommunication)) {
						buttons.push({
							label: "addSpamRule_action",
							click: () => this._addSpamRule(defaultInboxRuleField, address.address),
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
		showAddSpamRuleDialog(createEmailSenderListElement({
			value: address.trim().toLowerCase(),
			type: spamRuleType,
			field: spamRuleField,
		}))
	}

	_isEnvelopeSenderVisible(): boolean {
		return this.mail.differentEnvelopeSender != null
	}

	_markUnread(unread: boolean) {
		this.mail.unread = unread
		this._entityClient.update(this.mail)
		    .catch(LockedError, e => console.log("could not update mail read state: ", lang.get("operationStillActive_msg")))
		    .catch(NotFoundError, noOp)
	}

	_editDraft(): Promise<void> {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				return this._mailModel.getMailboxDetailsForMail(this.mail)
				           .then(mailboxDetails => newMailEditorFromDraft(this.mail, this._attachments, this._getMailBody(), this._contentBlocked, this._inlineImages, mailboxDetails))
				           .then(editorDialog => editorDialog.show())
				           .catch(UserError, showUserError)

			}
		})
	}

	_reply(replyAll: boolean): Promise<void> {
		if (this._isAnnouncement()) {
			return Promise.resolve()
		}
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				return this._mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
					let prefix = "Re: "
					let subject = (startsWith(this.mail.subject.toUpperCase(), prefix.toUpperCase())) ? this.mail.subject : prefix
						+ this.mail.subject
					let infoLine = formatDateTime(this.mail.sentDate) + " " + lang.get("by_label") + " "
						+ this.mail.sender.address + ":";
					let body = infoLine + "<br><blockquote class=\"tutanota_quote\">" + this._getMailBody() + "</blockquote>";

					let toRecipients = []
					let ccRecipients = []
					let bccRecipients = []
					if (!logins.getUserController().isInternalUser() && this.mail.state === MailState.RECEIVED) {
						toRecipients.push(this.mail.sender)
					} else if (this.mail.state === MailState.RECEIVED) {
						if (this.mail.replyTos.length > 0) {
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
					return this._getSenderOfResponseMail().then((senderMailAddress) => {
						return newMailEditorAsResponse({
							previousMail: this.mail,
							conversationType: ConversationType.REPLY,
							senderMailAddress,
							toRecipients,
							ccRecipients,
							bccRecipients,
							attachments: [],
							subject,
							bodyText: prependEmailSignature(body, logins),
							replyTos: [],
						}, this._contentBlocked, this._inlineImages, mailboxDetails)
					}).then(editor => {
						editor.show()
					}).catch(UserError, showUserError)

				})
			}
		})
	}

	_getMailBody(): string {
		if (this._mailBody) {
			return getMailBodyText(this._mailBody)
		} else {
			return ""
		}
	}

	_forward(): Promise<void> {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				return this._createResponseMailArgsForForwarding([], [], true).then(args => {
					return this._getMailboxDetails().then(mailboxDetails => {
						newMailEditorAsResponse(args, this._contentBlocked, this._inlineImages, mailboxDetails)
							.then(editor => editor.show())
							.catch(UserError, showUserError)
					})
				})
			}
		})
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
		infoLine += lang.get("subject_label") + ": " + urlEncodeHtmlTags(this.mail.subject);

		let body = infoLine + "<br><br><blockquote class=\"tutanota_quote\">" + this._getMailBody() + "</blockquote>";

		return this._getSenderOfResponseMail().then((senderMailAddress) => {
			return {
				previousMail: this.mail,
				conversationType: ConversationType.FORWARD,
				senderMailAddress,
				toRecipients: recipients,
				ccRecipients: [],
				bccRecipients: [],
				attachments: this._attachments.slice(),
				subject: "FWD: " + this.mail.subject,
				bodyText: addSignature ? prependEmailSignature(body, logins) : body,
				replyTos,
			}
		})
	}

	_getMailboxDetails(): Promise<MailboxDetail> {
		return this._mailModel.getMailboxDetailsForMail(this.mail)
	}

	_getAssignableMailRecipients(): Promise<GroupInfo[]> {
		if (this.mail.restrictions != null && this.mail.restrictions.participantGroupInfos.length > 0) {
			const participantGroupInfos = this.mail.restrictions.participantGroupInfos
			return this._entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return loadGroupInfos(participantGroupInfos.filter(groupInfoId => {
					return neverNull(customer.contactFormUserGroups).list !== groupInfoId[0]
				})).filter(groupInfo => groupInfo.deleted == null)
			})
		} else {
			return Promise.resolve([])
		}
	}

	_assignMail(userGroupInfo: GroupInfo): Promise<void> {
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
			return this._getMailboxDetails().then(mailboxDetails => {
				return defaultSendMailModel(mailboxDetails).initAsResponse(args).then(model => model.send(MailMethod.NONE))
			})
		}).then(() => this._mailModel.getMailboxFolders(this.mail)).then((folders) => {
			this._mailModel.moveMails([this.mail], getArchiveFolder(folders))
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
					this._mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
						newMailtoUrlMailEditor(anchorElement.href, !logins.getUserController().props.defaultUnconfidential)
							.then(editor => editor.show())
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
				).catch(NotFoundError, noOp)
			} else {
				this.mailHeaderInfo = lang.get("noMailHeadersInfo_msg")
				this.mailHeaderDialog.show()
			}
		}
	}

	_scrollIfDomBody(cb: (dom: HTMLElement) => DomMutation) {
		if (this._domForScrolling) {
			const dom = this._domForScrolling
			if (this._scrollAnimation.isFulfilled()) {
				this._scrollAnimation = animations.add(dom, cb(dom), {easing: ease.inOut})
			}
		}
	}

	_downloadAndOpenAttachment(file: TutanotaFile, open: boolean): void {
		fileController.downloadAndOpen(file, open)
		              .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
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
		this._inlineFileIds
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
}