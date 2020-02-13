// @flow
import {px, size} from "../gui/size"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {load, serviceRequestVoid, update} from "../api/main/Entity"
import {Button, createAsyncDropDownButton, createDropDownButton} from "../gui/base/Button"
import {formatDateTime, formatDateWithWeekday, formatStorageSize, formatTime, urlEncodeHtmlTags} from "../misc/Formatter"
import {windowFacade} from "../misc/WindowFacade"
import {ActionBar} from "../gui/base/ActionBar"
import {ease} from "../gui/animation/Easing"
import type {DomMutation} from "../gui/animation/Animations"
import {animations, scroll} from "../gui/animation/Animations"
import {nativeApp} from "../native/NativeWrapper"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import type {InboxRuleTypeEnum} from "../api/common/TutanotaConstants"
import {
	ConversationType,
	FeatureType,
	InboxRuleType, Keys,
	MailFolderType,
	MailState,
	SpamRuleFieldType as SparmRuleType,
	SpamRuleType
} from "../api/common/TutanotaConstants"
import {MailEditor} from "./MailEditor"
import {FileTypeRef} from "../api/entities/tutanota/File"
import {fileController} from "../file/FileController"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode, isAndroidApp, isDesktop, isIOSApp} from "../api/Env"
import {htmlSanitizer, stringifyFragment} from "../misc/HtmlSanitizer"
import {Dialog} from "../gui/base/Dialog"
import type {DeferredObject} from "../api/common/utils/Utils"
import {defer, getMailBodyText, getMailHeaders, neverNull, noOp} from "../api/common/utils/Utils"
import {checkApprovalStatus} from "../misc/ErrorHandlerImpl"
import {addAll, contains} from "../api/common/utils/ArrayUtils"
import {startsWith} from "../api/common/utils/StringUtils"
import {Request} from "../api/common/WorkerProtocol.js"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import {
	createNewContact,
	getArchiveFolder,
	getDefaultSender,
	getDisplayText,
	getEnabledMailAddresses,
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
import {keyManager} from "../misc/KeyManager"
import * as AddInboxRuleDialog from "../settings/AddInboxRuleDialog"
import {createInboxRuleTemplate} from "../settings/AddInboxRuleDialog"
import * as AddSpamRuleDialog from "../settings/AddSpamRuleDialog"
import {urlify} from "../misc/Urlifier"
import {logins} from "../api/main/LoginController"
import {Icon, progressIcon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"
import {createEncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {loadGroupInfos} from "../settings/LoadingUtils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {NotAuthorizedError, NotFoundError} from "../api/common/error/RestError"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {mailModel} from "./MailModel"
import {theme} from "../gui/theme"
import {LazyContactListId, searchForContactByMailAddress} from "../contacts/ContactUtils"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {getListId, HttpMethod} from "../api/common/EntityFunctions"
import {createListUnsubscribeData} from "../api/entities/tutanota/ListUnsubscribeData"
import {MailHeadersTypeRef} from "../api/entities/tutanota/MailHeaders"
import {exportAsEml} from "./Exporter"
import {client} from "../misc/ClientDetector"
import {DomRectReadOnlyPolyfilled} from "../gui/base/Dropdown"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import Badge from "../gui/base/Badge"
import {FileOpenError} from "../api/common/error/FileOpenError"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {styles} from "../gui/styles"
import {worker} from "../api/main/WorkerClient"
import {createDropdown} from "../gui/base/DropdownN"
import {navButtonRoutes} from "../misc/RouteChange"
import {createEmailSenderListElement} from "../api/entities/sys/EmailSenderListElement"
import {isNewMailActionAvailable} from "./MailView"

assertMainOrNode()

export type InlineImages = {
	[referencedCid: string]: {file: TutanotaFile, url: string} // map from cid to file and its URL (data or Blob)
}

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
	_bodyLineHeight: string;
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
	_domBodyDeferred: DeferredObject<HTMLElement>;
	_lastBodyTouchEndTime = 0;
	_lastTouchStart: {x: number, y: number, time: number};
	_domForScrolling: ?HTMLElement

	constructor(mail: Mail, showFolder: boolean) {
		if (isDesktop()) {
			nativeApp.invokeNative(new Request('sendSocketMessage', [{mailAddress: mail.sender.address}]))
		}
		this.mail = mail
		this._folderText = null
		this._filesExpanded = stream(false)
		this._domBodyDeferred = defer()
		if (showFolder) {
			let folder = mailModel.getMailFolder(mail._id[0])
			if (folder) {
				mailModel.getMailboxDetailsForMail(mail).then((mailboxDetails) => {
					this._folderText =
						`${lang.get("location_label")}: ${getMailboxName(mailboxDetails)} / ${getFolderName(folder)}`.toUpperCase()
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
		this._scrollAnimation = Promise.resolve()
		this._isScaling = true;
		this._lastTouchStart = {x: 0, y: 0, time: Date.now()}

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
		let senderBubble = createAsyncDropDownButton(() =>
				getDisplayText(this.mail.sender.name, this.mail.sender.address, false), null,
			() => this._createBubbleContextButtons(this.mail.sender, InboxRuleType.FROM_EQUALS), bubbleMenuWidth)
			.setType(ButtonType.Bubble)
		let differentSenderBubble = this._isEnvelopeSenderVisible() ?
			new Button(() => getDisplayText("", neverNull(this.mail.differentEnvelopeSender), false),
				() => Dialog.error("envelopeSenderInfo_msg", neverNull(this.mail.differentEnvelopeSender)), () => Icons.Warning).setType(ButtonType.Bubble)
			: null
		let toRecipientBubbles = this.mail.toRecipients.map(recipient =>
			createAsyncDropDownButton(() => getDisplayText(recipient.name, recipient.address, false),
				null, () => this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_TO_EQUALS), bubbleMenuWidth)
				.setType(ButtonType.Bubble))
		let ccRecipientBubbles = this.mail.ccRecipients.map(recipient =>
			createAsyncDropDownButton(() => getDisplayText(recipient.name, recipient.address, false), null,
				() => this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_CC_EQUALS), bubbleMenuWidth)
				.setType(ButtonType.Bubble))
		let bccRecipientBubbles = this.mail.bccRecipients.map(recipient =>
			createAsyncDropDownButton(() => getDisplayText(recipient.name, recipient.address, false), null,
				() => this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_BCC_EQUALS), bubbleMenuWidth)
				.setType(ButtonType.Bubble))
		let replyToBubbles = this.mail.replyTos.map(recipient => createAsyncDropDownButton(() =>
				getDisplayText(recipient.name, recipient.address, false), null,
			() => this._createBubbleContextButtons(recipient, null), bubbleMenuWidth)
			.setType(ButtonType.Bubble))

		let detailsExpander = new ExpanderButton("showMore_action", new ExpanderPanel({
			view: () =>
				m("", [
					m(".ml-negative-bubble", m(senderBubble)),
					(differentSenderBubble) ? m(".small", lang.get("sender_label")) : null,
					(differentSenderBubble) ? m(".ml-negative-bubble", m(differentSenderBubble)) : null,
					(toRecipientBubbles.length > 0) ? m(".small", lang.get("to_label")) : null,
					(toRecipientBubbles.length > 0) ?
						m(".flex-start.flex-wrap.ml-negative-bubble", toRecipientBubbles.map(b => m(b))) : null,
					(ccRecipientBubbles.length > 0) ? m(".small", lang.get("cc_label")) : null,
					(ccRecipientBubbles.length > 0) ?
						m(".flex-start.flex-wrap.ml-negative-bubble", ccRecipientBubbles.map(b => m(b))) : null,
					(bccRecipientBubbles.length > 0) ? m(".small", lang.get("bcc_label")) : null,
					(bccRecipientBubbles.length > 0) ?
						m(".flex-start.flex-wrap.ml-negative-bubble", bccRecipientBubbles.map(b => m(b))) : null,
					(replyToBubbles.length > 0) ? m(".small", lang.get("replyTo_label")) : null,
					(replyToBubbles.length > 0) ?
						m(".flex-start.flex-wrap.ml-negative-bubble", replyToBubbles.map(b => m(b))) : null,
				])
		}), false, {'padding-top': px(26)})

		let actions = new ActionBar()
		actions.add(this._createLoadExternalContentButton(mail))
		if (mail.state === MailState.DRAFT) {
			actions.add(new Button('edit_action', () => this._editDraft(), () => Icons.Edit))
		} else {
			if (!this._isAnnouncement()) {
				actions.add(new Button('reply_action', () => this._reply(false), () => Icons.Reply))
				let userController = logins.getUserController()
				let restrictedParticipants = mail.restrictions && mail.restrictions.participantGroupInfos.length > 0
				if (userController.isInternalUser()
					&& (mail.toRecipients.length + mail.ccRecipients.length + mail.bccRecipients.length > 1)
					&& !restrictedParticipants) {
					actions.add(new Button('replyAll_action', () => this._reply(true), () => Icons.ReplyAll))
				}
				if (userController.isInternalUser() && !restrictedParticipants) {
					actions.add(new Button('forward_action', () => this._forward(), () => Icons.Forward))
				} else if (userController.isInternalUser()
					&& restrictedParticipants
					&& userController.getUserMailGroupMembership().group !== this.mail._ownerGroup) { // do not allow re-assigning from personal mailbox
					actions.add(this._createAssignActionButton(mail))
				}
			}
			actions.add(createAsyncDropDownButton('move_action', () => Icons.Folder, () => {
				return mailModel.getMailboxFolders(this.mail).then((folders) => {
					const filteredFolders = folders.filter(f => f.mails !== this.mail._id[0])
					const targetFolders = (getSortedSystemFolders(filteredFolders).concat(getSortedCustomFolders(filteredFolders)))
					return targetFolders.map(f => {
						return new Button(() => getFolderName(f), () => mailModel.moveMails([mail], f), getFolderIcon(f))
							.setType(ButtonType.Dropdown)
					})
				})
			}))
		}
		actions.add(new Button('delete_action', () => {
			showDeleteConfirmationDialog([this.mail]).then((confirmed) => {
				if (confirmed) {
					mailModel.deleteMails([this.mail])
				}
			})
		}, () => Icons.Trash))
		if (mail.state !== MailState.DRAFT) {
			actions.add(createDropDownButton('more_label', () => Icons.More, () => {
				let moreButtons = []
				if (this.mail.unread) {
					moreButtons.push(new Button("markRead_action", () => this._markUnread(false), () => Icons.Eye).setType(ButtonType.Dropdown))
				} else {
					moreButtons.push(new Button("markUnread_action", () => this._markUnread(true), () => Icons.NoEye).setType(ButtonType.Dropdown))
				}
				if (!this._isAnnouncement() && !client.isMobileDevice() && !logins.isEnabled(FeatureType.DisableMailExport)) {
					moreButtons.push(new Button("export_action",
						() => exportAsEml(this.mail, this._mailBody ? htmlSanitizer.sanitize(this._getMailBody(), false).text : ""),
						() => Icons.Export).setType(ButtonType.Dropdown))
				}
				if (!client.isMobileDevice() && !logins.isEnabled(FeatureType.DisableMailExport) && typeof window.print === "function") {
					moreButtons.push(new Button("print_action", () => window.print(), () => Icons.Print).setType(ButtonType.Dropdown))
				}
				if (this.mail.listUnsubscribe) {
					moreButtons.push(new Button("unsubscribe_action", () => {
						if (this.mail.headers) {
							return showProgressDialog("pleaseWait_msg", load(MailHeadersTypeRef, this.mail.headers).then(mailHeaders => {
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
							}).catch(e => {
								return Dialog.error("unsubscribeFailed_msg")
							})
						}
					}, () => Icons.Cancel).setType(ButtonType.Dropdown))
				}
				moreButtons.push(new Button("showHeaders_action", () => this._showHeaders(), () => Icons.ListUnordered).setType(ButtonType.Dropdown))
				return moreButtons
			}, 350))
		}

		this._inlineFileIds = this._loadMailBody(mail)

		// load the conversation entry here because we expect it to be loaded immediately when responding to this email
		load(ConversationEntryTypeRef, mail.conversationEntry)
			.catch(NotFoundError, e => console.log("could load conversation entry as it has been moved/deleted already", e))

		this._inlineImages = this._loadAttachments(mail)


		this.view = () => {
			return [
				m("#mail-viewer.fill-absolute"
					+ (client.isMobileDevice() ? ".scroll-no-overlay.overflow-x-hidden" : ".flex.flex-column"),
					{
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
											this._isEnvelopeSenderVisible()
												? m(Icon, {icon: Icons.Warning, style: {fill: theme.navigation_button}})
												: null,
											getSenderOrRecipientHeading(this.mail, false)
										]),
									(this._folderText) ? m("small.b.flex.pt", {style: {color: theme.navigation_button}}, this._folderText) : null,
								]),
								m(".flex.flex-column-reverse", this._isAnnouncement() ? null : m(detailsExpander)),
							]),
							m(detailsExpander.panel),
							m(".subject-actions.flex-space-between.mr-negative-s.flex-wrap.mt-xs", [
								m(".left.flex-grow-shrink-150", [
									m(".subject.text-break.selectable", this.mail.subject),
									m(".flex.items-center.content-accent-fg.svg-content-accent-fg"
										+ (this.mail.confidential ? ".ml-negative-xs" : ""), [
										this.mail.confidential ? m(Icon, {icon: Icons.Lock}) : null,
										m("small.date.mt-xs", formatDateWithWeekday(this.mail.receivedDate) + " • "
											+ formatTime(this.mail.receivedDate))
									]),
								]),
								m(actions)
							]),
							this._renderAttachments(),
							m("hr.hr.mt"),
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
								style: {'line-height': this._bodyLineHeight, 'transform-origin': 'top left'},
							}, (this._mailBody == null && !this._errorOccurred)
								? m(".progress-panel.flex-v-center.items-center", {
									style: {
										height: '200px'
									}
								}, [
									progressIcon(),
									m("small", lang.get("loading_msg"))
								])
								: ((this._errorOccurred || this.mail._errors || neverNull(this._mailBody)._errors)
									? m(ColumnEmptyMessageBox, {
										message: "corrupted_msg",
										icon: Icons.Warning,
										color: theme.content_message_bg,
									})
									: m.trust(this._htmlBody))) // this._htmlBody is always sanitized
						)
					]
				),
			]
		}

		this.onbeforeremove = () => windowFacade.removeResizeListener(resizeListener)
		this._setupShortcuts()
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

	_createLoadExternalContentButton(mail: Mail): Button {
		let loadExternalContentButton = new Button('contentBlocked_msg', () => {
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
		}, () => Icons.Picture)
		loadExternalContentButton.setIsVisibleHandler(() => this._contentBlocked)

		return loadExternalContentButton

	}

	_replaceInlineImages() {
		this._inlineImages.then((loadedInlineImages) => {
			this._domBodyDeferred.promise.then(domBody => {
				replaceCidsWithInlineImages(domBody, loadedInlineImages, (file, event, dom) => {
					createDropdown(() => [
						{
							label: "download_action",
							click: () => {
								fileController.downloadAndOpen(file, true)
								              .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
							},
							type: ButtonType.Dropdown
						}
					])(event, dom)
				})
			})
		})
	}

	/** @return list of inline referenced cid */
	_loadMailBody(mail: Mail): Promise<Array<string>> {
		return load(MailBodyTypeRef, mail.body).then(body => {
			this._mailBody = body
			let sanitizeResult = htmlSanitizer.sanitizeFragment(this._getMailBody(), true, isTutanotaTeamMail(mail))

			/**
			 * check if we need to improve contrast for dark theme.
			 * 1. theme id must be 'dark'
			 * 2. html body needs to contain any tag with a style attribute that has the color property set
			 * OR
			 * there is a font tag with the color attribute set
			 */
			this._contrastFixNeeded = (
				'undefined' !== typeof Array.from(sanitizeResult.html.querySelectorAll('*[style]'), e => e.style)
				                            .find(s => s.color !== "" && typeof s.color !== 'undefined')
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
			return Promise.resolve({})
		} else {
			this._loadingAttachments = true
			return Promise.map(mail.attachments, fileId => load(FileTypeRef, fileId))
			              .then(files => {
				              this._attachments = files
				              return this._inlineFileIds.then((inlineCids) => {
					              this._attachmentButtons = this._createAttachmentsButtons(files, inlineCids)
					              this._loadingAttachments = false
					              m.redraw()
					              const filesToLoad = files.filter(file => inlineCids.find(inline => file.cid === inline))
					              const inlineImages: InlineImages = {}
					              return Promise
						              .map(filesToLoad, (file) => worker.downloadFileContent(file).then(dataFile => {
								              const blob = new Blob([dataFile.data], {
									              type: dataFile.mimeType
								              })
								              inlineImages[neverNull(file.cid)] = {
									              file,
									              url: URL.createObjectURL(blob)
								              }
							              })
						              ).return(inlineImages)
				              })
			              })
			              .catch(NotFoundError, e => {
				              console.log("could load attachments as they have been moved/deleted already", e)
				              return {}
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
		return !isIOSApp() && this._attachmentButtons.length > 2 ?
			m(".limit-width", m(ButtonN, {
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
		// console.log("child clientWidth", child.clientWidth, "scrollWidth", child.scrollWidth, "offsetWidth", child.offsetWidth )
		// if(this._domMailViewer){
		// 	const domContainer = this._domMailViewer
		// 	console.log("container clientWidth", domContainer.clientWidth, "scrollWidth", domContainer.scrollWidth, "offsetWidth", domContainer.offsetWidth )
		// }

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
				exec: () => this._showHeaders(),
				help: "showHeaders_action"
			},
			{
				key: Keys.R,
				exec: (key: KeyPress) => {
					this._reply(false)
				},
				help: "reply_action"
			},
			{
				key: Keys.R,
				shift: true,
				exec: (key: KeyPress) => {
					this._reply(true)
				},
				help: "replyAll_action"
			},
			{
				key: Keys.F,
				shift: true,
				exec: (key: KeyPress) => {
					this._forward()
				},
				help: "forward_action"
			},
		]

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
				Object.keys(inlineImages).forEach((key) => {
					URL.revokeObjectURL(inlineImages[key].url)
				})
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

	_createBubbleContextButtons(address: MailAddress | EncryptedMailAddress, defaultInboxRuleField: ?InboxRuleTypeEnum): Promise<(Button | string)[]> {
		if (logins.getUserController().isInternalUser()) {
			let buttons = [address.address]
			let contactsPromise = Promise.resolve()
			if (!logins.isEnabled(FeatureType.DisableContacts)) {
				contactsPromise = searchForContactByMailAddress(address.address).then(contact => {
					if (contact) {
						buttons.push(new Button("showContact_action", () => {
							navButtonRoutes.contactsUrl = `/contact/${neverNull(contact)._id[0]}/${neverNull(contact)._id[1]}`
							m.route.set(navButtonRoutes.contactsUrl + location.hash)
						}, null).setType(ButtonType.Secondary))
					} else {
						buttons.push(new Button("createContact_action", () => {
							LazyContactListId.getAsync().then(contactListId => {
								new ContactEditor(createNewContact(address.address, address.name), contactListId).show()
							})
						}, null).setType(ButtonType.Secondary))
					}
				})
			}
			return contactsPromise.then(() => {
				return mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
					if (defaultInboxRuleField
						&& !logins.getUserController().isOutlookAccount()
						&& !logins.isEnabled(FeatureType.InternalCommunication)) {
						let rule = AddInboxRuleDialog.getExistingRuleForType(address.address.trim().toLowerCase(), defaultInboxRuleField)
						let actionLabel = "editInboxRule_action"
						if (!rule) {
							rule = createInboxRuleTemplate(defaultInboxRuleField, address.address.trim().toLowerCase())
							actionLabel = "addInboxRule_action"
						}
						buttons.push(new Button(actionLabel, () => {
							AddInboxRuleDialog.show(mailboxDetails, neverNull(rule))
						}, null).setType(ButtonType.Secondary))
					}
					if (logins.isGlobalAdminUserLoggedIn() && !logins.isEnabled(FeatureType.InternalCommunication)) {
						buttons.push(new Button("addSpamRule_action", () => {
							const folder = mailModel.getMailFolder(getListId(this.mail))
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
							AddSpamRuleDialog.show(createEmailSenderListElement({
								value: address.address.trim().toLowerCase(),
								type: spamRuleType,
								field: spamRuleField,
							}))
						}, null).setType(ButtonType.Secondary))
					}
					return buttons
				})
			})
		} else {
			return Promise.resolve([address.address])
		}
	}

	_isEnvelopeSenderVisible(): boolean {
		return this.mail.differentEnvelopeSender != null
	}

	_markUnread(unread: boolean) {
		this.mail.unread = unread
		update(this.mail).catch(NotFoundError, noOp)
	}

	_editDraft() {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				return mailModel.getMailboxDetailsForMail(this.mail)
				                .then((mailboxDetails) => {
					                let editor = new MailEditor(mailboxDetails)
					                return editor.initFromDraft({
						                draftMail: this.mail,
						                attachments: this._attachments,
						                bodyText: this._getMailBody(),
						                blockExternalContent: this._contentBlocked,
						                inlineImages: this._inlineImages
					                }).then(() => {
						                editor.show()
					                })
				                })
			}
		})
	}

	_reply(replyAll: boolean) {
		if (this._isAnnouncement()) {
			return
		}
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				return mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
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
					let editor = new MailEditor(mailboxDetails)
					return this._getSenderOfResponseMail().then((senderMailAddress) => {
						return editor.initAsResponse({
							previousMail: this.mail,
							conversationType: ConversationType.REPLY,
							senderMailAddress,
							toRecipients,
							ccRecipients,
							bccRecipients,
							attachments: [],
							subject,
							bodyText: body,
							replyTos: [],
							addSignature: true,
							inlineImages: this._inlineImages,
							blockExternalContent: this._contentBlocked
						})
					}).then(() => {
						editor.show()
					})
				})
			}
		})
	}

	_getMailBody() {
		if (this._mailBody) {
			return getMailBodyText(this._mailBody)
		} else {
			return ""
		}
	}

	_forward() {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				return this._createForwardingMailEditor([], [], true, true).then(editor => {
					editor.show()
				})
			}
		})
	}

	_createForwardingMailEditor(recipients: MailAddress[], replyTos: EncryptedMailAddress[], addSignature: boolean, replaceInlineImages: boolean): Promise<MailEditor> {
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

		return mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
			return this._getSenderOfResponseMail().then((senderMailAddress) => {
				let editor = new MailEditor(mailboxDetails)
				return editor.initAsResponse({
					previousMail: this.mail,
					conversationType: ConversationType.FORWARD,
					senderMailAddress,
					toRecipients: recipients,
					ccRecipients: [],
					bccRecipients: [],
					attachments: this._attachments.slice(),
					subject: "FWD: " + this.mail.subject,
					bodyText: body,
					replyTos,
					addSignature,
					inlineImages: replaceInlineImages ? this._inlineImages : null,
					blockExternalContent: this._contentBlocked
				}).then(() => editor)
			})
		})
	}

	_getAssignableMailRecipients(): Promise<GroupInfo[]> {
		if (this.mail.restrictions != null && this.mail.restrictions.participantGroupInfos.length > 0) {
			const participantGroupInfos = this.mail.restrictions.participantGroupInfos
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return loadGroupInfos(participantGroupInfos.filter(groupInfoId => {
					return neverNull(customer.contactFormUserGroups).list !== groupInfoId[0]
				})).filter(groupInfo => groupInfo.deleted == null)
			})
		} else {
			return Promise.resolve([])
		}
	}

	_assignMail(userGroupInfo: GroupInfo) {
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

		this._createForwardingMailEditor([recipient], newReplyTos, false, false).then(editor => {
			return editor.send()
		}).then(() => mailModel.getMailboxFolders(this.mail)).then((folders) => {
			mailModel.moveMails([this.mail], getArchiveFolder(folders))
		})
	}

	_getSenderOfResponseMail(): Promise<string> {
		return mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
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
				return getDefaultSender(mailboxDetails)
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
					mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
						let mailEditor = new MailEditor(mailboxDetails)
						mailEditor.initWithMailtoUrl(anchorElement.href, !logins.getUserController().props.defaultUnconfidential)
						          .then(() => {
							          mailEditor.show()
						          })
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
				load(MailHeadersTypeRef, this.mail.headers).then(mailHeaders => {
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
						new Button("open_action",
							() => fileController.downloadAndOpen(file, true)
							                    .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg")),
							null).setType(ButtonType.Dropdown),
						new Button("download_action",
							() => fileController.downloadAndOpen(file, false)
							                    .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg")),
							null).setType(ButtonType.Dropdown)
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
				() => fileController.downloadAndOpen(file, true).catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg")),
				() => Icons.Attachment)
				.setType(ButtonType.Bubble)
				.setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
			)
		}
		return buttons
	}

	_downloadAll() {
		this._inlineFileIds.then((inilneFileIds) => {
			const nonInlineFiles = this._attachments.filter(a => !inilneFileIds.includes(a.cid))
			if (client.needsDownloadBatches() && nonInlineFiles.length > 10) {
				fileController.downloadBatched(nonInlineFiles, 10, 1000)
			} else if (!client.canDownloadMultipleFiles()) {
				fileController.downloadBatched(nonInlineFiles, 1, 10)
			} else {
				fileController.downloadAll(nonInlineFiles)
			}
		})
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
