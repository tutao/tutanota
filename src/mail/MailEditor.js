// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {TextField} from "../gui/base/TextField"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN, Type} from "../gui/base/TextFieldN"
import type {Language, TranslationKey} from "../misc/LanguageViewModel"
import {_getSubstitutedLanguageCode, getAvailableLanguageCode, lang, languages} from "../misc/LanguageViewModel"
import {formatStorageSize} from "../misc/Formatter"
import type {ConversationTypeEnum} from "../api/common/TutanotaConstants"
import {
	ALLOWED_IMAGE_FORMATS,
	ConversationType,
	FeatureType,
	MAX_ATTACHMENT_SIZE,
	OperationType,
	ReplyType
} from "../api/common/TutanotaConstants"
import {animations, height, opacity} from "../gui/animation/Animations"
import {load, setup, update} from "../api/main/Entity"
import {worker} from "../api/main/WorkerClient"
import {Bubble, BubbleTextField} from "../gui/base/BubbleTextField"
import {Editor} from "../gui/base/Editor"
import {isExternal, recipientInfoType} from "../api/common/RecipientInfo"
import {
	AccessBlockedError,
	ConnectionError,
	NotFoundError,
	PreconditionFailedError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {UserError} from "../api/common/error/UserError"
import {RecipientsNotFoundError} from "../api/common/error/RecipientsNotFoundError"
import {assertMainOrNode, isApp, Mode} from "../api/Env"
import {PasswordIndicator} from "../gui/base/PasswordIndicator"
import {getPasswordStrength} from "../misc/PasswordUtils"
import {downcast, neverNull} from "../api/common/utils/Utils"
import {
	createNewContact,
	createRecipientInfo,
	getDefaultSender,
	getDisplayText,
	getEmailSignature,
	getEnabledMailAddresses,
	getMailboxName,
	getSenderName,
	parseMailtoUrl,
	replaceCidsWithInlineImages,
	replaceInlineImagesWithCids,
	resolveRecipientInfo
} from "./MailUtils"
import {fileController} from "../file/FileController"
import {contains, remove, replace} from "../api/common/utils/ArrayUtils"
import {FileTypeRef} from "../api/entities/tutanota/File"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {ContactEditor} from "../contacts/ContactEditor"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {isSameId} from "../api/common/EntityFunctions"
import {windowFacade} from "../misc/WindowFacade"
import {Keys} from "../misc/KeyManager"
import {fileApp} from "../native/FileApp"
import {PermissionError} from "../api/common/error/PermissionError"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {MailboxDetail} from "./MailModel"
import {mailModel} from "./MailModel"
import {locator} from "../api/main/MainLocator"
import {LazyContactListId} from "../contacts/ContactUtils"
import {RecipientNotResolvedError} from "../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream/stream.js"
import {checkApprovalStatus} from "../misc/ErrorHandlerImpl"
import type {EntityEventsListener} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {RichTextToolbar} from "../gui/base/RichTextToolbar"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {attachDropdown} from "../gui/base/DropdownN"
import {FileOpenError} from "../api/common/error/FileOpenError"
import {client} from "../misc/ClientDetector"
import {formatPrice} from "../subscription/SubscriptionUtils"
import {showUpgradeWizard} from "../subscription/UpgradeSubscriptionWizard"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import type {InlineImages} from "./MailViewer"
import {getTimeZone} from "../calendar/CalendarUtils"
import {MailAddressBubbleHandler} from "../misc/MailAddressBubbleHandler"

assertMainOrNode()

type RecipientList = $ReadOnlyArray<{name: ?string, address: string}>
type Recipients = {to?: RecipientList, cc?: RecipientList, bcc?: RecipientList}

export class MailEditor {
	dialog: Dialog;
	draft: ?Mail;
	_senderField: DropDownSelector<string>;
	_selectedNotificationLanguage: Stream<string>
	toRecipients: BubbleTextField<RecipientInfo>;
	ccRecipients: BubbleTextField<RecipientInfo>;
	bccRecipients: BubbleTextField<RecipientInfo>;
	_mailAddressToPasswordField: Map<string, TextFieldAttrs>;
	subject: TextField;
	conversationType: ConversationTypeEnum;
	previousMessageId: ?Id; // only needs to be the correct value if this is a new email. if we are editing a draft, conversationType is not used
	_confidentialButtonState: boolean;
	_editor: Editor;
	_tempBody: ?string; // only defined till the editor is initialized
	view: Function;
	_domElement: HTMLElement;
	_domCloseButton: HTMLElement;
	_attachments: Array<TutanotaFile | DataFile | FileReference>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_mailChanged: boolean;
	_showToolbar: boolean;
	_previousMail: ?Mail;
	_entityEventReceived: EntityEventsListener;
	_mailboxDetails: MailboxDetail;
	_replyTos: RecipientInfo[];
	_richTextToolbar: RichTextToolbar;
	_objectURLs: Array<string>;
	_blockExternalContent: boolean;

	/**
	 * Creates a new draft message. Invoke initAsResponse or initFromDraft if this message should be a response
	 * to an existing message or edit an existing draft.
	 *
	 */
	constructor(mailboxDetails: MailboxDetail) {
		this.conversationType = ConversationType.NEW
		this.toRecipients = new BubbleTextField("to_label", new MailAddressBubbleHandler(this))
		this.ccRecipients = new BubbleTextField("cc_label", new MailAddressBubbleHandler(this))
		this.bccRecipients = new BubbleTextField("bcc_label", new MailAddressBubbleHandler(this))
		this._replyTos = []
		this._mailAddressToPasswordField = new Map()
		this._attachments = []
		this._mailChanged = false
		this._previousMail = null
		this.draft = null
		this._mailboxDetails = mailboxDetails
		this._showToolbar = false
		this._objectURLs = []
		this._blockExternalContent = true

		let props = logins.getUserController().props

		this._senderField = new DropDownSelector("sender_label", null, getEnabledMailAddresses(this._mailboxDetails)
			.map(mailAddress => ({
				name: mailAddress,
				value: mailAddress
			})), stream(getDefaultSender(this._mailboxDetails)), 250)

		let sortedLanguages = languages.slice().sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		this._selectedNotificationLanguage = stream(getAvailableLanguageCode(props.notificationMailLanguage || lang.code))

		this._getTemplateLanguages(sortedLanguages)
		    .then((filteredLanguages) => {
			    if (filteredLanguages.length > 0) {
				    const languageCodes = filteredLanguages.map(l => l.code)
				    this._selectedNotificationLanguage(
					    _getSubstitutedLanguageCode(props.notificationMailLanguage || lang.code, languageCodes) || languageCodes[0])
				    sortedLanguages = filteredLanguages
			    }
		    })

		this._confidentialButtonState = !props.defaultUnconfidential
		this.subject = new TextField("subject_label", () => this.getConfidentialStateMessage())

		let confidentialButtonAttrs = {
			label: "confidential_action",
			click: (event, attrs) => this._confidentialButtonState = !this._confidentialButtonState,
			icon: () => this._confidentialButtonState ? Icons.Lock : Icons.Unlock,
			isSelected: () => this._confidentialButtonState,
			noBubble: true,
		}

		let attachFilesButtonAttrs = {
			label: "attachFiles_action",
			click: (ev, attrs) => this._showFileChooserForAttachments(ev.target.getBoundingClientRect()),
			icon: () => Icons.Attachment,
			noBubble: true
		}

		const toolbarButton = () => (!logins.getUserController().props.sendPlaintextOnly)
			? m(ButtonN, {
				label: 'showRichTextToolbar_action',
				icon: () => Icons.FontSize,
				click: () => this._showToolbar = !this._showToolbar,
				isSelected: () => this._showToolbar,
				noBubble: true
			})
			: null

		this.subject._injectionsRight = () => {
			return this._allRecipients().find(r => r.type === recipientInfoType.external)
				? [m(ButtonN, confidentialButtonAttrs), m(ButtonN, attachFilesButtonAttrs), toolbarButton()]
				: [m(ButtonN, attachFilesButtonAttrs), toolbarButton()]
		}
		this.subject.onUpdate(v => this._mailChanged = true)

		let closeButtonAttrs = attachDropdown({
			label: "close_alt",
			click: () => this._close(),
			type: ButtonType.Secondary,
			oncreate: vnode => this._domCloseButton = vnode.dom
		}, () => [
			{
				label: "discardChanges_action",
				click: () => this._close(),
				type: ButtonType.Dropdown
			},
			{
				label: "saveDraft_action",
				click: () => this.saveDraft(true, true)
				                 .then(() => this._close())
				                 .catch(FileNotFoundError, () => Dialog.error("couldNotAttachFile_msg"))
				                 .catch(PreconditionFailedError, () => Dialog.error("operationStillActive_msg")),
				type: ButtonType.Dropdown
			}
		], () => this._mailChanged, 250)

		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [closeButtonAttrs],
			right: [{label: "send_action", click: () => this.send(), type: ButtonType.Primary}],
			middle: () => lang.get(this._conversationTypeToTitleTextId())
		}
		let detailsExpanded = stream(false)
		this._editor = new Editor(200, (html, isPaste) => {
			return htmlSanitizer.sanitizeFragment(html, !isPaste && this._blockExternalContent).html
		})
		const attachImageHandler = isApp() ?
			null
			: (ev) => this._onAttachImageClicked(ev)
		this._richTextToolbar = new RichTextToolbar(this._editor, attachImageHandler)
		if (logins.isInternalUserLoggedIn()) {
			this.toRecipients.textField._injectionsRight = () => m(ExpanderButtonN, {
				label: "show_action",
				expanded: detailsExpanded,
			})
			this._editor.initialized.promise.then(() => {
				this._mailChanged = false
				this._editor.addChangeListener(() => this._mailChanged = true)
			})
		} else {
			this.toRecipients.textField.setDisabled()
			this._editor.initialized.promise.then(() => {
				this._mailChanged = false
				this._editor.addChangeListener(() => this._mailChanged = true)
			})
		}

		let windowCloseUnsubscribe = () => {}
		this.view = () => {
			return m("#mail-editor.full-height.text.touch-callout", {
				oncreate: vnode => {
					this._domElement = vnode.dom
					windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => closeButtonAttrs.click(null, this._domCloseButton))
				},
				onremove: vnode => {
					windowCloseUnsubscribe()
					this._objectURLs.forEach((url) => URL.revokeObjectURL(url))
				},
				onclick: (e) => {
					if (e.target === this._domElement) {
						this._editor.focus()
					}
				},
				ondragover: (ev) => {
					// do not check the datatransfer here because it is not always filled, e.g. in Safari
					ev.stopPropagation()
					ev.preventDefault()
				},
				ondrop: (ev) => {
					if (ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
						fileController.readLocalFiles(ev.dataTransfer.files).then(dataFiles => {
							this.attachFiles((dataFiles: any))
							m.redraw()
						}).catch(e => {
							console.log(e)
							return Dialog.error("couldNotAttachFile_msg")
						})
						ev.stopPropagation()
						ev.preventDefault()
					}
				}
			}, [
				m(this.toRecipients),
				m(ExpanderPanelN, {expanded: detailsExpanded},
					m(".details", [
						m(this.ccRecipients),
						m(this.bccRecipients),
						m(".wrapping-row", [
							m(this._senderField),
							this._languageDropDown(sortedLanguages)
						]),
					])
				),
				this._confidentialButtonState
					? m(".external-recipients.overflow-hidden", {
						oncreate: vnode => this.animate(vnode.dom, true),
						onbeforeremove: vnode => this.animate(vnode.dom, false)
					}, this._allRecipients()
					       .filter(r => r.type === recipientInfoType.external && !r.resolveContactPromise) // only show passwords for resolved contacts, otherwise we might not get the password
					       .map(r => m(TextFieldN, Object.assign({}, this.getPasswordField(r), {
						       oncreate: vnode => this.animate(vnode.dom, true),
						       onbeforeremove: vnode => this.animate(vnode.dom, false)
					       }))))
					: null,
				m(".row", m(this.subject)),
				m(".flex-start.flex-wrap.ml-negative-bubble", this._getAttachmentButtons().map((a) => m(ButtonN, a))),
				this._attachments.length > 0 ? m("hr.hr") : null,
				this._showToolbar ? m(this._richTextToolbar) : null,
				m(".pt-s.text.scroll-x.break-word-links", {onclick: () => this._editor.focus()}, m(this._editor)),
				m(".pb")
			])
		}

		this._entityEventReceived = (updates) => {
			for (let update of updates) {
				this._handleEntityEvent(update)
			}
		}

		this.dialog = Dialog.largeDialog(headerBarAttrs, this)
		                    .addShortcut({
			                    key: Keys.ESC,
			                    exec: () => closeButtonAttrs.click(null, this._domCloseButton),
			                    help: "close_alt"
		                    })
		                    .addShortcut({
			                    key: Keys.B,
			                    ctrl: true,
			                    exec: () => {
				                    // is done by squire
			                    },
			                    help: "formatTextBold_msg"
		                    })
		                    .addShortcut({
			                    key: Keys.I,
			                    ctrl: true,
			                    exec: () => {
				                    // is done by squire
			                    },
			                    help: "formatTextItalic_msg"
		                    })
		                    .addShortcut({
			                    key: Keys.U,
			                    ctrl: true,
			                    exec: () => {
				                    // is done by squire
			                    },
			                    help: "formatTextUnderline_msg"
		                    })
		                    .addShortcut({
			                    key: Keys.S,
			                    ctrl: true,
			                    exec: () => {
				                    this.saveDraft(true, true)
				                        .catch(FileNotFoundError, () => Dialog.error("couldNotAttachFile_msg"))
				                        .catch(PreconditionFailedError, () => Dialog.error("operationStillActive_msg"))
			                    },
			                    help: "save_action"
		                    })
		                    .addShortcut({
			                    key: Keys.S,
			                    ctrl: true,
			                    shift: true,
			                    exec: () => {
				                    this.send()
			                    },
			                    help: "send_action"
		                    }).setCloseHandler(() => closeButtonAttrs.click(null, this._domCloseButton))
		this._mailChanged = false
	}

	_getTemplateLanguages(sortedLanguages: Array<Language>): Promise<Array<Language>> {
		return logins.getUserController().loadCustomer()
		             .then((customer) => load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
		             .then((customerProperties) => {
			             return sortedLanguages.filter(sL =>
				             customerProperties.notificationMailTemplates.find((nmt) => nmt.language === sL.code))
		             })
		             .catch(() => [])
	}

	_focusBodyOnLoad() {
		this._editor.initialized.promise.then(() => {
			this._editor.focus()
		})
	}

	_conversationTypeToTitleTextId(): TranslationKey {
		switch (this.conversationType) {
			case ConversationType.NEW:
				return "newMail_action"
			case ConversationType.REPLY:
				return "reply_action"
			case ConversationType.FORWARD:
				return "forward_action"
			default:
				return "emptyString_msg"
		}
	}

	animate(domElement: HTMLElement, fadein: boolean) {
		let childHeight = domElement.offsetHeight
		return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
		                 .then(() => {
			                 domElement.style.height = ''
		                 })
	}

	getPasswordField(recipientInfo: RecipientInfo): TextFieldAttrs {
		if (!this._mailAddressToPasswordField.has(recipientInfo.mailAddress)) {
			let passwordIndicator = new PasswordIndicator(() => this.getPasswordStrength(recipientInfo))
			let textFieldAttrs = {
				label: () => lang.get("passwordFor_label", {"{1}": recipientInfo.mailAddress}),
				helpLabel: () => m(passwordIndicator),
				value: stream(""),
				type: Type.ExternalPassword
			}
			if (recipientInfo.contact && recipientInfo.contact.presharedPassword) {
				textFieldAttrs.value(recipientInfo.contact.presharedPassword)
			}
			this._mailAddressToPasswordField.set(recipientInfo.mailAddress, textFieldAttrs)
		}
		return neverNull(this._mailAddressToPasswordField.get(recipientInfo.mailAddress))
	}

	getPasswordStrength(recipientInfo: RecipientInfo) {
		let user = logins.getUserController()
		let reserved = getEnabledMailAddresses(this._mailboxDetails).concat(
			getMailboxName(this._mailboxDetails),
			recipientInfo.mailAddress,
			recipientInfo.name
		)
		return Math.min(100, (getPasswordStrength(this.getPasswordField(recipientInfo).value(), reserved) / 0.8 * 1))
	}

	initAsResponse({
		               previousMail, conversationType, senderMailAddress,
		               toRecipients, ccRecipients, bccRecipients,
		               attachments, subject, bodyText,
		               replyTos, addSignature, inlineImages,
		               blockExternalContent
	               }: {
		previousMail: Mail,
		conversationType: ConversationTypeEnum,
		senderMailAddress: string,
		toRecipients: MailAddress[],
		ccRecipients: MailAddress[],
		bccRecipients: MailAddress[],
		attachments: TutanotaFile[],
		subject: string,
		bodyText: string,
		replyTos: EncryptedMailAddress[],
		addSignature: boolean,
		inlineImages?: ?Promise<InlineImages>,
		blockExternalContent: boolean
	}): Promise<void> {
		this._blockExternalContent = blockExternalContent
		if (addSignature) {
			bodyText = "<br/><br/><br/>" + bodyText
			let signature = getEmailSignature()
			if (logins.getUserController().isInternalUser() && signature) {
				bodyText = signature + bodyText
			}
		}
		if (conversationType === ConversationType.REPLY) {
			this.dialog.setFocusOnLoadFunction(() => this._focusBodyOnLoad())
		}
		let previousMessageId: ?string = null
		return load(ConversationEntryTypeRef, previousMail.conversationEntry)
			.then(ce => {
				previousMessageId = ce.messageId
			})
			.catch(NotFoundError, e => {
				console.log("could not load conversation entry", e);
			})
			.then(() => {
				// We don't want to wait for the editor to be initialized, otherwise it will never be shown
				this._setMailData(previousMail, previousMail.confidential, conversationType, previousMessageId, senderMailAddress, toRecipients, ccRecipients, bccRecipients, attachments, subject, bodyText, replyTos)
				    .then(() => this._replaceInlineImages(inlineImages))
			})
	}

	initWithTemplate(recipients: Recipients, subject: string, bodyText: string, confidential: ?boolean, senderMailAddress?: string): Promise<void> {
		function toMailAddress({name, address}: {name: ?string, address: string}) {
			return createMailAddress({name: name || "", address})
		}

		const toRecipients = recipients.to ? recipients.to.map(toMailAddress) : []
		const ccRecipients = recipients.cc ? recipients.cc.map(toMailAddress) : []
		const bccRecipients = recipients.bcc ? recipients.bcc.map(toMailAddress) : []
		if (toRecipients.length) {
			this.dialog.setFocusOnLoadFunction(() => this._focusBodyOnLoad())
		}

		const sender = senderMailAddress ? senderMailAddress : this._senderField.selectedValue()

		this._setMailData(null, confidential, ConversationType.NEW, null, sender, toRecipients, ccRecipients,
			bccRecipients, [], subject, bodyText, [])
		return Promise.resolve()
	}

	initWithMailtoUrl(mailtoUrl: string, confidential: boolean): Promise<void> {
		let result = parseMailtoUrl(mailtoUrl)

		let bodyText = result.body
		let signature = getEmailSignature()
		if (logins.getUserController().isInternalUser() && signature) {
			bodyText = bodyText + signature
		}
		this._setMailData(null, confidential, ConversationType.NEW, null, this._senderField.selectedValue(), result.to, result.cc, result.bcc, [], result.subject, bodyText, [])
		return Promise.resolve()
	}

	initFromDraft({draftMail, attachments, bodyText, inlineImages, blockExternalContent}: {
		draftMail: Mail,
		attachments: TutanotaFile[],
		bodyText: string,
		blockExternalContent: boolean,
		inlineImages?: Promise<InlineImages>
	}): Promise<void> {
		let conversationType: ConversationTypeEnum = ConversationType.NEW
		let previousMessageId: ?string = null
		let previousMail: ?Mail = null
		this.draft = draftMail
		this._blockExternalContent = blockExternalContent

		return load(ConversationEntryTypeRef, draftMail.conversationEntry).then(ce => {
			conversationType = downcast(ce.conversationType)
			if (ce.previous) {
				return load(ConversationEntryTypeRef, ce.previous).then(previousCe => {
					previousMessageId = previousCe.messageId
					if (previousCe.mail) {
						return load(MailTypeRef, previousCe.mail).then(mail => {
							previousMail = mail
						})
					}
				}).catch(NotFoundError, e => {
					// ignore
				})
			}
		}).then(() => {
			const {confidential, sender, toRecipients, ccRecipients, bccRecipients, subject, replyTos} = draftMail
			// We don't want to wait for the editor to be initialized, otherwise it will never be shown
			this._setMailData(previousMail, confidential, conversationType, previousMessageId, sender.address, toRecipients, ccRecipients, bccRecipients, attachments, subject, bodyText, replyTos)
			    .then(() => this._replaceInlineImages(inlineImages))
		})
	}

	_setMailData(previousMail: ?Mail, confidential: ?boolean, conversationType: ConversationTypeEnum, previousMessageId: ?string, senderMailAddress: string,
	             toRecipients: MailAddress[], ccRecipients: MailAddress[], bccRecipients: MailAddress[], attachments: TutanotaFile[], subject: string,
	             body: string, replyTos: EncryptedMailAddress[]): Promise<void> {
		this._previousMail = previousMail
		this.conversationType = conversationType
		this.previousMessageId = previousMessageId
		if (confidential != null) {
			this._confidentialButtonState = confidential
		}
		this._senderField.selectedValue(senderMailAddress)
		this.subject.setValue(subject)
		this._attachments = []
		this._tempBody = body

		this.attachFiles(((attachments: any): Array<TutanotaFile | DataFile | FileReference>))

		// call this async because the editor is not initialized before this mail editor dialog is shown
		const promise = this._editor.initialized.promise.then(() => {
			if (this._editor.getHTML() !== body) {
				this._editor.setHTML(this._tempBody)
				this._mailChanged = false
				// Add mutation observer to remove attachments when corresponding DOM element is removed
				new MutationObserver((mutationList) => {
					mutationList.forEach((mutation) => {
						for (let i = 0; i < mutation.removedNodes.length; i++) {// use for loop here because forEach is not defined on NodeList in IE11
							const removedNode = mutation.removedNodes[i]
							if (removedNode instanceof Image && removedNode.getAttribute("cid") != null) {
								const cid = removedNode.getAttribute("cid")
								const index = this._attachments.findIndex((attach) => attach.cid === cid)
								if (index !== -1) {
									this._attachments.splice(index, 1)
									m.redraw()
								}
							}
						}
					})
				}).observe(this._editor.getDOM(), {attributes: false, childList: true, subtree: true})
			}
			this._tempBody = null
		})

		if (previousMail && previousMail.restrictions && previousMail.restrictions.participantGroupInfos.length > 0) {
			this.toRecipients.textField._injectionsRight = null
			this.toRecipients.textField.setDisabled()
		}

		this.toRecipients.bubbles = toRecipients.map(r => this.createBubble(r.name, r.address, null))
		this.ccRecipients.bubbles = ccRecipients.map(r => this.createBubble(r.name, r.address, null))
		this.bccRecipients.bubbles = bccRecipients.map(r => this.createBubble(r.name, r.address, null))
		this._replyTos = replyTos.map(ema => createRecipientInfo(ema.address, ema.name, null, true))
		this._mailChanged = false
		return promise
	}

	_replaceInlineImages(inlineImages: ?Promise<InlineImages>): void {
		if (inlineImages) {
			inlineImages.then((loadedInlineImages) => {
				Object.keys(loadedInlineImages).forEach((key) => {
					const {file} = loadedInlineImages[key]
					if (!this._attachments.includes(file)) this._attachments.push(file)
					m.redraw()
				})
				this._editor.initialized.promise.then(() => {
					replaceCidsWithInlineImages(this._editor.getDOM(), loadedInlineImages)
				})
			})
		}
	}

	show() {
		locator.eventController.addEntityListener(this._entityEventReceived)
		this.dialog.show()
	}


	_close() {
		locator.eventController.removeEntityListener(this._entityEventReceived)
		this.dialog.close()
	}

	_showFileChooserForAttachments(boundingRect: ClientRect, fileTypes?: Array<string>): Promise<?$ReadOnlyArray<FileReference | DataFile>> {
		if (env.mode === Mode.App) {
			return fileApp
				.openFileChooser(boundingRect)
				.then(files => {
					this.attachFiles((files: any))
					m.redraw()
					return files
				})
				.catch(PermissionError, () => {
					Dialog.error("fileAccessDeniedMobile_msg")
				})
				.catch(FileNotFoundError, () => {
					Dialog.error("couldNotAttachFile_msg")
				})
		} else {
			return fileController.showFileChooser(true, fileTypes).then(files => {
				this.attachFiles((files: any))
				m.redraw()
				return files
			})
		}
	}

	attachFiles(files: Array<TutanotaFile | DataFile | FileReference>) {
		let totalSize = 0
		this._attachments.forEach(file => {
			totalSize += Number(file.size)
		})
		let tooBigFiles = [];
		files.forEach(file => {
			if (totalSize + Number(file.size) > MAX_ATTACHMENT_SIZE) {
				tooBigFiles.push(file.name)
			} else {
				totalSize += Number(file.size)
				this._attachments.push(file)
			}
		})
		if (tooBigFiles.length > 0) {
			Dialog.error(() => lang.get("tooBigAttachment_msg") + tooBigFiles.join(", "));
		}
		this._mailChanged = true
		m.redraw()
	}

	_getAttachmentButtons(): Array<ButtonAttrs> {
		return this._attachments.map(file => {
			let lazyButtonAttrs: ButtonAttrs[] = []

			lazyButtonAttrs.push({
				label: "download_action",
				type: ButtonType.Secondary,
				click: () => {
					if (file._type === 'FileReference') {
						return fileApp.open((file: FileReference))
						              .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
					} else if (file._type === "DataFile") {
						return fileController.open(file)
					} else {
						fileController.downloadAndOpen(((file: any): TutanotaFile), true)
						              .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
					}

				}
			})

			lazyButtonAttrs.push({
				label: "remove_action",
				type: ButtonType.Secondary,
				click: () => {
					remove(this._attachments, file)
					const dom = this._domElement
					const cid = file.cid
					if (cid && dom) {
						const image = dom.querySelector(`img[cid="${cid}"]`)
						image && image.remove()
					}
					this._mailChanged = true
					m.redraw()
				}
			})

			return attachDropdown({
				label: () => file.name,
				icon: () => Icons.Attachment,
				type: ButtonType.Bubble,
				staticRightText: "(" + formatStorageSize(Number(file.size)) + ")",
			}, () => lazyButtonAttrs)
		})
	}

	_onAttachImageClicked(ev: Event) {
		this._showFileChooserForAttachments((ev.target: any).getBoundingClientRect(), ALLOWED_IMAGE_FORMATS)
		    .then((files) => {
			    files && files.forEach((f) => {
				    // Let'S assume it's DataFile for now... Editor bar is available for apps but image button is not
				    const dataFile: DataFile = downcast(f)
				    const cid = Math.random().toString(30).substring(2)
				    f.cid = cid
				    const blob = new Blob([dataFile.data], {type: f.mimeType})
				    let objectUrl = URL.createObjectURL(blob)
				    this._objectURLs.push(objectUrl)
				    this._editor.insertImage(objectUrl, {cid, style: 'max-width: 100%'})
			    })
		    })
	}

	/**
	 * Saves the draft.
	 * @param saveAttachments True if also the attachments shall be saved, false otherwise.
	 * @returns {Promise} When finished.
	 * @throws FileNotFoundError when one of the attachments could not be opened
	 * @throws PreconditionFailedError when the draft is locked
	 */
	saveDraft(saveAttachments: boolean, showProgress: boolean): Promise<void> {
		let attachments = (saveAttachments) ? this._attachments : null
		let senderName = getSenderName(this._mailboxDetails)
		let to = this.toRecipients.bubbles.map(bubble => bubble.entity)
		let cc = this.ccRecipients.bubbles.map(bubble => bubble.entity)
		let bcc = this.bccRecipients.bubbles.map(bubble => bubble.entity)

		// _tempBody is only set until the editor is initialized. It might not be the case when
		// assigning a mail to another user because editor is not shown and we cannot
		// wait for the editor to be initialized.
		const body = this._tempBody == null ? replaceInlineImagesWithCids(this._editor.getDOM()).innerHTML : this._tempBody
		let promise = null
		const createMailDraft = () => worker.createMailDraft(this.subject.value(), body,
			this._senderField.selectedValue(), senderName, to, cc, bcc, this.conversationType, this.previousMessageId,
			attachments, this._isConfidential(), this._replyTos)
		const draft = this.draft
		if (draft != null) {
			promise = worker.updateMailDraft(this.subject.value(), body, this._senderField.selectedValue(),
				senderName, to, cc, bcc, attachments, this._isConfidential(), draft)
			                .catch(NotFoundError, e => {
				                console.log("draft has been deleted, creating new one")
				                return createMailDraft()
			                })
		} else {
			promise = createMailDraft()
		}

		promise = promise.then(draft => {
			this.draft = draft
			return Promise.map(draft.attachments, fileId => load(FileTypeRef, fileId)).then(attachments => {
				this._attachments = [] // attachFiles will push to existing files but we want to overwrite them
				this.attachFiles(attachments)
				this._mailChanged = false
			})
		})

		if (showProgress) {
			return showProgressDialog("save_msg", promise)
		} else {
			return promise
		}
	}

	_isConfidential() {
		return this._confidentialButtonState || !this._containsExternalRecipients()
	}

	getConfidentialStateMessage() {
		if (this._isConfidential()) {
			return lang.get('confidentialStatus_msg')
		} else {
			return lang.get('nonConfidentialStatus_msg')
		}
	}

	_containsExternalRecipients() {
		return (this._allRecipients().find(r => isExternal(r)) != null)
	}

	send(showProgress: boolean = true) {
		return Promise
			.resolve()
			.then(() => {
				this.toRecipients.createBubbles()
				this.ccRecipients.createBubbles()
				this.bccRecipients.createBubbles()

				if (this.toRecipients.textField.value().trim() !== "" ||
					this.ccRecipients.textField.value().trim() !== "" ||
					this.bccRecipients.textField.value().trim() !== "") {
					throw new UserError("invalidRecipients_msg")
				} else if (this.toRecipients.bubbles.length === 0 &&
					this.ccRecipients.bubbles.length === 0 &&
					this.bccRecipients.bubbles.length === 0) {
					throw new UserError("noRecipients_msg")
				}

				let subjectConfirmPromise = Promise.resolve(true)

				if (this.subject.value().trim().length === 0) {
					subjectConfirmPromise = Dialog.confirm("noSubject_msg")
				}
				return subjectConfirmPromise
			})
			.then(confirmed => {
				if (confirmed) {
					let send = this
						._waitForResolvedRecipients() // Resolve all added recipients before trying to send it
						.then((recipients) =>
							this.saveDraft(true, false)
							    .return(recipients))
						.then(resolvedRecipients => {
							let externalRecipients = resolvedRecipients.filter(r => isExternal(r))
							if (this._confidentialButtonState && externalRecipients.length > 0
								&& externalRecipients.find(r => this.getPasswordField(r).value().trim()
									!== "") == null) {
								throw new UserError("noPreSharedPassword_msg")
							}

							let sendMail = Promise.resolve(true)
							if (this._confidentialButtonState
								&& externalRecipients.reduce((min, current) =>
									Math.min(min, this.getPasswordStrength(current)), 100) < 80) {
								sendMail = Dialog.confirm("presharedPasswordNotStrongEnough_msg")
							}

							return sendMail.then(ok => {
								if (ok) {
									return this._updateContacts(resolvedRecipients)
									           .then(() => worker.sendMailDraft(
										           neverNull(this.draft),
										           resolvedRecipients,
										           this._selectedNotificationLanguage()))
									           .then(() => this._updatePreviousMail())
									           .then(() => this._updateExternalLanguage())
									           .then(() => this._close())
								}
							})
						})
						.catch(RecipientNotResolvedError, e => {
							return Dialog.error("tooManyAttempts_msg")
						})
						.catch(RecipientsNotFoundError, e => {
							let invalidRecipients = e.message.join("\n")
							return Dialog.error(() => lang.get("invalidRecipients_msg") + "\n"
								+ invalidRecipients)
						})
						.catch(TooManyRequestsError, e => Dialog.error("tooManyMails_msg"))
						.catch(AccessBlockedError, e => {
							// special case: the approval status is set to SpamSender, but the update has not been received yet, so use SpamSender as default
							return checkApprovalStatus(true, "4")
								.then(() => {
									console.log("could not send mail (blocked access)", e)
								})
						})
						.catch(FileNotFoundError, () => Dialog.error("couldNotAttachFile_msg"))
						.catch(PreconditionFailedError, () => Dialog.error("operationStillActive_msg"))

					return showProgress
						? showProgressDialog(this._confidentialButtonState ? "sending_msg" : "sendingUnencrypted_msg", send)
						: send
				}
			})
			.catch(UserError, e => Dialog.error(e.message))
			.catch(e => {
				console.log(typeof e, e)
				throw e
			})
	}

	_updateExternalLanguage() {
		let props = logins.getUserController().props
		if (props.notificationMailLanguage !== this._selectedNotificationLanguage()) {
			props.notificationMailLanguage = this._selectedNotificationLanguage()
			update(props)
		}
	}

	_updatePreviousMail(): Promise<void> {
		if (this._previousMail
		) {
			if (this._previousMail.replyType === ReplyType.NONE && this.conversationType === ConversationType.REPLY) {
				this._previousMail.replyType = ReplyType.REPLY
			} else if (this._previousMail.replyType === ReplyType.NONE
				&& this.conversationType === ConversationType.FORWARD) {
				this._previousMail.replyType = ReplyType.FORWARD
			} else if (this._previousMail.replyType === ReplyType.FORWARD
				&& this.conversationType === ConversationType.REPLY) {
				this._previousMail.replyType = ReplyType.REPLY_FORWARD
			} else if (this._previousMail.replyType === ReplyType.REPLY
				&& this.conversationType === ConversationType.FORWARD) {
				this._previousMail.replyType = ReplyType.REPLY_FORWARD
			} else {
				return Promise.resolve()
			}
			return update(this._previousMail).catch(NotFoundError, e => {
				// ignore
			})
		} else {
			return Promise.resolve();
		}
	}

	_updateContacts(resolvedRecipients: RecipientInfo[]): Promise<any> {
		return Promise.all(resolvedRecipients.map(r => {
			if (r.contact) {
				let recipientContact = neverNull(r.contact)
				if (!recipientContact._id && (!logins.getUserController().props.noAutomaticContacts
					|| (isExternal(r) && this._confidentialButtonState))) {
					if (isExternal(r) && this._confidentialButtonState) {
						recipientContact.presharedPassword = this.getPasswordField(r).value().trim()
					}
					return LazyContactListId.getAsync().then(listId => {
						return setup(listId, r.contact)
					})
				} else if (recipientContact._id && isExternal(r) && this._confidentialButtonState
					&& recipientContact.presharedPassword !== this.getPasswordField(r).value().trim()) {
					recipientContact.presharedPassword = this.getPasswordField(r).value().trim()
					return update(recipientContact)
				} else {
					return Promise.resolve()
				}
			} else {
				return Promise.resolve()
			}
		}))
	}

	_allRecipients() {
		return this.toRecipients.bubbles.map(b => b.entity)
		           .concat(this.ccRecipients.bubbles.map(b => b.entity))
		           .concat(this.bccRecipients.bubbles.map(b => b.entity))
	}

	/**
	 * Makes sure the recipient type and contact are resolved.
	 */
	_waitForResolvedRecipients(): Promise<RecipientInfo[]> {
		return Promise.all(this._allRecipients().map(recipientInfo => {
			return resolveRecipientInfo(recipientInfo).then(recipientInfo => {
				if (recipientInfo.resolveContactPromise) {
					return recipientInfo.resolveContactPromise.return(recipientInfo)
				} else {
					return recipientInfo
				}
			})
		})).catch(TooManyRequestsError, e => {
			throw new RecipientNotResolvedError()
		})
	}

	/**
	 * @param name If null the name is taken from the contact if a contact is found for the email addrss
	 */
	createBubble(name: ?string, mailAddress: string, contact: ?Contact): Bubble<RecipientInfo> {
		this._mailChanged = true
		let recipientInfo = createRecipientInfo(mailAddress, name, contact, false)
		let bubbleWrapper = {}
		bubbleWrapper.buttonAttrs = attachDropdown({
			label: () => getDisplayText(recipientInfo.name, mailAddress, false),
			type: ButtonType.TextBubble,
			isSelected: () => false,
		}, () => {
			if (recipientInfo.resolveContactPromise) {
				return recipientInfo.resolveContactPromise.then(contact => {
					return this._createBubbleContextButtons(recipientInfo.name, mailAddress, contact, () => bubbleWrapper.bubble)
				})
			} else {
				return Promise.resolve(this._createBubbleContextButtons(recipientInfo.name, mailAddress, contact, () => bubbleWrapper.bubble))
			}
		}, undefined, 250)

		resolveRecipientInfo(recipientInfo)
			.then(() => m.redraw())
			.catch(ConnectionError, e => {
				// we are offline but we want to show the error dialog only when we click on send.
			})
			.catch(TooManyRequestsError, e => {
				Dialog.error("tooManyAttempts_msg")
			})
		bubbleWrapper.bubble = new Bubble(recipientInfo, neverNull(bubbleWrapper.buttonAttrs), mailAddress)
		return bubbleWrapper.bubble
	}

	_createBubbleContextButtons(name: string, mailAddress: string, contact: ? Contact, bubbleResolver: Function): Array<ButtonAttrs | string> {
		let buttonAttrs = [mailAddress]
		if (logins.getUserController().isInternalUser()) {
			if (!logins.isEnabled(FeatureType.DisableContacts)) {
				if (contact && contact._id) { // the contact may be new contact, in this case do not edit it
					buttonAttrs.push({
						label: "editContact_label",
						type: ButtonType.Secondary,
						click: () => new ContactEditor(contact).show()
					})
				} else {
					buttonAttrs.push({
						label: "createContact_action",
						type: ButtonType.Secondary,
						click: () => {
							LazyContactListId.getAsync().then(contactListId => {
								new ContactEditor(createNewContact(mailAddress, name), contactListId, contactElementId => {
									let bubbles = [
										this.toRecipients.bubbles, this.ccRecipients.bubbles, this.bccRecipients.bubbles
									].find(b => contains(b, bubbleResolver()))
									if (bubbles) {
										this._updateBubble(bubbles, bubbleResolver(), [contactListId, contactElementId])
									}
								}).show()
							})
						}
					})
				}
			}
			if (!this._previousMail
				|| !this._previousMail.restrictions
				|| this._previousMail.restrictions.participantGroupInfos.length === 0) {
				buttonAttrs.push({
					label: "remove_action",
					type: ButtonType.Secondary,
					click: () => this._removeBubble(bubbleResolver())
				})
			}
		}

		return buttonAttrs
	}

	_handleEntityEvent(update: EntityUpdateData): void {
		const {operation, instanceId, instanceListId} = update
		if (isUpdateForTypeRef(ContactTypeRef, update)
			&& (operation === OperationType.UPDATE || operation === OperationType.DELETE)) {
			let contactId: IdTuple = [neverNull(instanceListId), instanceId]
			let allBubbleLists = [this.toRecipients.bubbles, this.ccRecipients.bubbles, this.bccRecipients.bubbles]
			allBubbleLists.forEach(bubbles => {
				bubbles.forEach(bubble => {
					if (bubble => bubble.entity.contact && bubble.entity.contact._id
						&& isSameId(bubble.entity.contact._id, contactId)) {
						if (operation === OperationType.UPDATE) {
							this._updateBubble(bubbles, bubble, contactId)
						} else {
							this._removeBubble(bubble)
						}
					}
				})
			})
		}
	}

	_updateBubble(bubbles: Bubble<RecipientInfo> [], oldBubble: Bubble<RecipientInfo>, contactId: IdTuple) {
		this._mailChanged = true
		let emailAddress = oldBubble.entity.mailAddress
		load(ContactTypeRef, contactId).then(updatedContact => {
			if (!updatedContact.mailAddresses.find(ma =>
				ma.address.trim().toLowerCase() === emailAddress.trim().toLowerCase())) {
				// the mail address was removed, so remove the bubble
				remove(bubbles, oldBubble)
			} else {
				let newBubble = this.createBubble(`${updatedContact.firstName} ${updatedContact.lastName}`.trim(), emailAddress, updatedContact)
				replace(bubbles, oldBubble, newBubble)
				if (updatedContact.presharedPassword && this._mailAddressToPasswordField.has(emailAddress)) {
					neverNull(this._mailAddressToPasswordField.get(emailAddress))
						.value(updatedContact.presharedPassword || "")
				}
			}
		})
	}

	_removeBubble(bubble: Bubble<RecipientInfo>) {
		this._mailChanged = true
		let bubbles = [
			this.toRecipients.bubbles, this.ccRecipients.bubbles, this.bccRecipients.bubbles
		].find(b => contains(b, bubble))
		if (bubbles) {
			remove(bubbles, bubble)
		}
	}

	_languageDropDown(langs: Array<Language>): Children {
		const languageDropDownAttrs: DropDownSelectorAttrs<string> = {
			label: "notificationMailLanguage_label",
			items: langs.map(language => {
				return {name: lang.get(language.textId), value: language.code}
			}),
			selectedValue: this._selectedNotificationLanguage,
			dropdownWidth: 250
		}
		return m("", (this._confidentialButtonState && this._containsExternalRecipients())
			? m("", {
				oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
				onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
			}, m(DropDownSelectorN, languageDropDownAttrs))
			: null
		)
	}

	static writeSupportMail() {
		mailModel.init().then(() => {
			if (!logins.getUserController().isPremiumAccount()) {
				const message = lang.get("premiumOffer_msg", {"{1}": formatPrice(1, true)})
				const title = lang.get("upgradeReminderTitle_msg")
				Dialog.reminder(title, message, "https://tutanota.com/blog/posts/premium-pro-business").then(confirm => {
					if (confirm) {
						showUpgradeWizard()
					}
				})
				return
			}
			const editor = new MailEditor(mailModel.getUserMailboxDetails())
			let signature = "<br><br>--"
			signature += "<br>Client: " + client.getIdentifier()
			signature += "<br>Tutanota version: " + env.versionNumber
			signature += "<br>Time zone: " + getTimeZone()
			signature += "<br>User agent:<br>" + navigator.userAgent
			editor.initWithTemplate({to: [{name: null, address: "premium@tutao.de"}]}, "", signature, true).then(() => {
				editor.show()
			})
		})

	}

	static writeInviteMail() {
		mailModel.init().then(() => {
			const editor = new MailEditor(mailModel.getUserMailboxDetails())
			const username = logins.getUserController().userGroupInfo.name;
			const body = lang.get("invitationMailBody_msg", {
				'{registrationLink}': "https://mail.tutanota.com/signup",
				'{username}': username,
				'{githubLink}': "https://github.com/tutao/tutanota"
			})
			editor.initWithTemplate({}, lang.get("invitationMailSubject_msg"), body, false).then(() => {
				editor.show()
			})
		})
	}
}
