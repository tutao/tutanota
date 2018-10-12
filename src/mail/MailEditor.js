// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {Button, ButtonType, createAsyncDropDownButton, createDropDownButton} from "../gui/base/Button"
import {TextField, Type} from "../gui/base/TextField"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang, languages} from "../misc/LanguageViewModel"
import {formatStorageSize, isMailAddress, stringToNameAndMailAddress} from "../misc/Formatter"
import type {ConversationTypeEnum, OperationTypeEnum} from "../api/common/TutanotaConstants"
import {ConversationType, MAX_ATTACHMENT_SIZE, OperationType, ReplyType} from "../api/common/TutanotaConstants"
import {animations, height, opacity} from "../gui/animation/Animations"
import {load, loadAll, setup, update} from "../api/main/Entity"
import {worker} from "../api/main/WorkerClient"
import {Bubble, BubbleTextField} from "../gui/base/BubbleTextField"
import {Editor} from "../gui/base/Editor"
import {isExternal, recipientInfoType} from "../api/common/RecipientInfo"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import {AccessBlockedError, ConnectionError, NotFoundError, TooManyRequestsError} from "../api/common/error/RestError"
import {UserError} from "../api/common/error/UserError"
import {RecipientsNotFoundError} from "../api/common/error/RecipientsNotFoundError"
import {assertMainOrNode, Mode} from "../api/Env"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {PasswordIndicator} from "../gui/base/PasswordIndicator"
import {getPasswordStrength} from "../misc/PasswordUtils"
import {neverNull} from "../api/common/utils/Utils"
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
	resolveRecipientInfo
} from "./MailUtils"
import {fileController} from "../file/FileController"
import {contains, remove, replace} from "../api/common/utils/ArrayUtils"
import {FileTypeRef} from "../api/entities/tutanota/File"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {ContactEditor} from "../contacts/ContactEditor"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {isSameId, isSameTypeRef, TypeRef} from "../api/common/EntityFunctions"
import {windowFacade} from "../misc/WindowFacade"
import {Keys} from "../misc/KeyManager"
import {fileApp} from "../native/FileApp"
import {contactApp} from "../native/ContactApp"
import {PermissionError} from "../api/common/error/PermissionError"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import {logins} from "../api/main/LoginController"
import {progressIcon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {px, size} from "../gui/size"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {MailboxDetail} from "./MailModel"
import {locator} from "../api/main/MainLocator"
import {LazyContactListId, searchForContacts} from "../contacts/ContactUtils"
import {RecipientNotResolvedError} from "../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream/stream.js"
import {modal} from "../gui/base/Modal"
import type {PosRect} from "../gui/base/Dropdown"
import {Dropdown} from "../gui/base/Dropdown"
import {checkApprovalStatus} from "../misc/ErrorHandlerImpl"

assertMainOrNode()

export class MailEditor {
	dialog: Dialog;
	draft: ?Mail;
	_senderField: DropDownSelector<string>;
	_languageCodeField: DropDownSelector<string>;
	toRecipients: BubbleTextField<RecipientInfo>;
	ccRecipients: BubbleTextField<RecipientInfo>;
	bccRecipients: BubbleTextField<RecipientInfo>;
	mailAddressToPasswordField: Map<string, TextField>;
	subject: TextField;
	conversationType: ConversationTypeEnum;
	previousMessageId: ?Id; // only needs to be the correct value if this is a new email. if we are editing a draft, conversationType is not used
	_confidentialButtonState: boolean;
	editor: Editor;
	_tempBody: ?string; // only defined till the editor is initialized
	view: Function;
	_domElement: HTMLElement;
	_loadingAttachments: boolean;
	_attachments: Array<TutanotaFile | DataFile | FileReference>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_mailChanged: boolean;
	_attachmentButtons: Button[]; // these map 1:1 to the _attachments
	_previousMail: ?Mail;
	_entityEventReceived: EntityEventReceived;
	_attachFilesButton: Button;
	_mailboxDetails: MailboxDetail;
	_replyTos: RecipientInfo[];

	/**
	 * Creates a new draft message. Invoke initAsResponse or initFromDraft if this message should be a response
	 * to an existing message or edit an existing draft.
	 *
	 */
	constructor(mailboxDetails: MailboxDetail) {
		this.conversationType = ConversationType.NEW
		this.toRecipients = new BubbleTextField("to_label", new MailBubbleHandler(this))
		this.ccRecipients = new BubbleTextField("cc_label", new MailBubbleHandler(this))
		this.bccRecipients = new BubbleTextField("bcc_label", new MailBubbleHandler(this))
		this._replyTos = []
		this.mailAddressToPasswordField = new Map()
		this._attachments = []
		this._mailChanged = false
		this._attachmentButtons = []
		this._loadingAttachments = false
		this._previousMail = null
		this.draft = null
		this._mailboxDetails = mailboxDetails

		let props = logins.getUserController().props

		this._senderField = new DropDownSelector("sender_label", null, getEnabledMailAddresses(this._mailboxDetails)
			.map(mailAddress => ({
				name: mailAddress,
				value: mailAddress
			})), stream(getDefaultSender(this._mailboxDetails)), 250)

		let sortedLanguages = languages.slice()
		sortedLanguages.sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		this._languageCodeField = new DropDownSelector("notificationMailLanguage_label", null, sortedLanguages.map(language => {
			return {name: lang.get(language.textId), value: language.code}
		}), stream(props.notificationMailLanguage || lang.code), 250)

		this._confidentialButtonState = !props.defaultUnconfidential
		this.subject = new TextField("subject_label", () => this.getConfidentialStateMessage())
		let confidentialButton = new Button("confidential_action", () => this._confidentialButtonState = false, () => Icons.Lock)
			.setSelected(() => true)
			.disableBubbling()
		let nonConfidentialButton = new Button("nonConfidential_action", () => this._confidentialButtonState = true, () => Icons.Unlock)
			.disableBubbling()

		this._attachFilesButton = new Button('attachFiles_action', () => this._showFileChooserForAttachments(), () => Icons.Attachment)

		this.subject._injectionsRight = () => {
			if (this._allRecipients().find(r => r.type === recipientInfoType.external)) {
				return [
					this._confidentialButtonState ? m(confidentialButton) : m(nonConfidentialButton),
					m(this._attachFilesButton)
				]
			} else {
				return [m(this._attachFilesButton)]
			}
		}
		this.subject.onUpdate(v => this._mailChanged = true)

		// close button needed changes so it was possible to show different outcomes
		// if nothing changed in the editor in comparison to after it was created just close the editor onclick
		// show drop down button if an input was made to choose closing or draft saving
		let closeButton = new Button('close_alt', () => {
			console.log(this.toRecipients)
			if (!this._mailChanged) {
				this._close()
			} else {
				let dropdown = new Dropdown(() => [
					new Button('discardChanges_action', () => this._close()).setType(ButtonType.Secondary),
					new Button('saveDraft_action', () => this.saveDraft(true, true)
						.then(() => this._close())).setType(ButtonType.Secondary)
				], 250)
				let buttonRect: PosRect = closeButton._domButton.getBoundingClientRect()
				dropdown.setOrigin(buttonRect)
				modal.display(dropdown)
			}
		}).setType(ButtonType.Secondary)
		createDropDownButton('close_alt', null, () => {
			return
		}, 250).setType(ButtonType.Secondary)


		let headerBar = new DialogHeaderBar()
			.addLeft(closeButton)
			.setMiddle(() => lang.get(this._conversationTypeToTitleTextId()))
			.addRight(new Button('send_action', () => this.send()).setType(ButtonType.Primary))

		this.editor = new Editor(200)

		if (logins.isInternalUserLoggedIn()) {
			this.toRecipients.textField._injectionsRight = () => m(detailsExpander)
			this.editor.initialized.promise.then(() => {
				this.editor.squire.setHTML(getEmailSignature())
				this._mailChanged = false
				this.editor.addChangeListener(() => this._mailChanged = true)
			})
		} else {
			this.toRecipients.textField.setDisabled()
			this.editor.initialized.promise.then(() => {
				this._mailChanged = false
				this.editor.addChangeListener(() => this._mailChanged = true)
			})
		}

		let detailsExpander = new ExpanderButton("show_action", new ExpanderPanel({
			view: () =>
				m(".details", [
					m(this.ccRecipients),
					m(this.bccRecipients),
					m(".wrapping-row", [
						m(this._senderField),
						m("", (this._confidentialButtonState && this._containsExternalRecipients()) ? m("", {
							oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
							onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
						}, m(this._languageCodeField)) : null)
					]),
				])
		}), false)


		this.view = () => {
			return m("#mail-editor.full-height.text.touch-callout", {
				oncreate: vnode => this._domElement = vnode.dom,
				onclick: (e) => {
					if (e.target === this._domElement) {
						this.editor.squire.focus()
					}
				},
				ondragover: (ev) => {
					// do not check the datatransfer here because it is not always filled, e.g. in Safari
					ev.stopPropagation()
					ev.preventDefault()
					ev.dataTransfer.dropEffect = 'copy'
				},
				ondrop: (ev) => {
					if (ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
						fileController.readLocalFiles(ev.dataTransfer.files).then(dataFiles => {
							this._attachFiles((dataFiles: any))
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
				m(detailsExpander.panel),
				this._confidentialButtonState ? m(".external-recipients.overflow-hidden", {
					oncreate: vnode => this.animate(vnode.dom, true),
					onbeforeremove: vnode => this.animate(vnode.dom, false)
				}, this._allRecipients()
					.filter(r => r.type === recipientInfoType.external && !r.resolveContactPromise) // only show passwords for resolved contacts, otherwise we might not get the password
					.map(r => m(this.getPasswordField(r), {
						oncreate: vnode => this.animate(vnode.dom, true),
						onbeforeremove: vnode => this.animate(vnode.dom, false)
					}))) : null,
				m(".row", m(this.subject)),
				m(".flex-start.flex-wrap.ml-negative-bubble",
					(!this._loadingAttachments) ? this._attachmentButtons.map(b => m(b)) : [
						m(".flex-v-center", progressIcon()),
						m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))
					]),
				this._attachmentButtons.length > 0 ? m("hr.hr") : null,
				m(".pt-l.text.scroll-x", {onclick: () => this.editor.squire.focus()}, m(this.editor)),
				m(".pb")
			])
		}

		this._entityEventReceived = (typeRef, listId, elementId, operation) => this._handleEntityEvent(typeRef, listId, elementId, operation)

		this.dialog = Dialog.largeDialog(headerBar, this)
			.addShortcut({
				key: Keys.ESC,
				exec: () => closeButton.clickHandler(),
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
			}).setCloseHandler(() => closeButton.clickHandler())
		this._mailChanged = false
	}

	_focusBodyOnLoad() {
		this.editor.initialized.promise.then(() => {
			this.editor.squire.focus()
		})
	}

	_conversationTypeToTitleTextId(): string {
		switch (this.conversationType) {
			case ConversationType.NEW:
				return "newMail_action"
			case ConversationType.REPLY:
				return "reply_action"
			case ConversationType.FORWARD:
				return "forward_action"
			default:
				return ""
		}
	}

	animate(domElement: HTMLElement, fadein: boolean) {
		let childHeight = domElement.offsetHeight
		return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
			.then(() => {
				domElement.style.height = ''
			})
	}

	getPasswordField(recipientInfo: RecipientInfo): TextField {
		if (!this.mailAddressToPasswordField.has(recipientInfo.mailAddress)) {
			let passwordIndicator = new PasswordIndicator(() => this.getPasswordStrength(recipientInfo))
			let textField = new TextField(() => lang.get("passwordFor_label", {"{1}": recipientInfo.mailAddress}), () => m(passwordIndicator))
			textField.setType(Type.ExternalPassword)

			if (recipientInfo.contact && recipientInfo.contact.presharedPassword) {
				textField.setValue(recipientInfo.contact.presharedPassword)
			}
			this.mailAddressToPasswordField.set(recipientInfo.mailAddress, textField)
		}
		return neverNull(this.mailAddressToPasswordField.get(recipientInfo.mailAddress))
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

	initAsResponse(previousMail: Mail, conversationType: ConversationTypeEnum, senderMailAddress: string, toRecipients: MailAddress[], ccRecipients: MailAddress[], bccRecipients: MailAddress[], attachments: TutanotaFile[], subject: string, bodyText: string, replyTos: EncryptedMailAddress[], addSignature: boolean): Promise<void> {
		bodyText = htmlSanitizer.sanitize(bodyText, false).text
		if (addSignature) {
			bodyText = "<br><br><br>" + bodyText
			let signature = getEmailSignature()
			if (logins.getUserController().isInternalUser() && signature) {
				bodyText = signature + bodyText
			}
		}
		if (conversationType === ConversationType.REPLY) {
			this.dialog.setFocusOnLoadFunction(() => this._focusBodyOnLoad())
		}
		let previousMessageId: ?string = null
		return load(ConversationEntryTypeRef, previousMail.conversationEntry).then(ce => {
			previousMessageId = ce.messageId
		}).catch(NotFoundError, e => {
			console.log("could not load conversation entry", e);
		}).finally(() => {
			this._setMailData(previousMail, previousMail.confidential, conversationType, previousMessageId, senderMailAddress, toRecipients, ccRecipients, bccRecipients, attachments, subject, bodyText, replyTos)
		})
	}

	initWithTemplate(recipientName: ?string, recipientMailAddress: ?string, subject: string, bodyText: string, confidential: ?boolean): Promise<void> {
		let recipients = []
		if (recipientMailAddress) {
			let recipient = createMailAddress()
			recipient.address = recipientMailAddress
			recipient.name = (recipientName ? recipientName : "")
			recipients.push(recipient)
		}
		if (recipientMailAddress) {
			this.dialog.setFocusOnLoadFunction(() => this._focusBodyOnLoad())
		}
		bodyText = htmlSanitizer.sanitize(bodyText, false).text
		this._setMailData(null, confidential, ConversationType.NEW, null, this._senderField.selectedValue(), recipients, [], [], [], subject, bodyText, [])
		return Promise.resolve()
	}

	initWithMailtoUrl(mailtoUrl: string, confidential: boolean): Promise<void> {
		let result = parseMailtoUrl(mailtoUrl)

		let bodyText = result.body
		let signature = getEmailSignature()
		if (logins.getUserController().isInternalUser() && signature) {
			bodyText = bodyText + signature
		}

		bodyText = htmlSanitizer.sanitize(bodyText, false).text
		this._setMailData(null, confidential, ConversationType.NEW, null, this._senderField.selectedValue(), result.to, result.cc, result.bcc, [], result.subject, bodyText, [])
		return Promise.resolve()
	}

	initFromDraft(draft: Mail): Promise<void> {
		let conversationType: ConversationTypeEnum = ConversationType.NEW
		let previousMessageId: ?string = null
		let previousMail: ?Mail = null
		let bodyText: string = ""
		let attachments: TutanotaFile[] = []

		let p1 = load(MailBodyTypeRef, draft.body).then(body => {
			bodyText = htmlSanitizer.sanitize(body.text, false).text
		})
		let p2 = load(ConversationEntryTypeRef, draft.conversationEntry).then(ce => {
			conversationType = (ce.conversationType: any)
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
		})
		let p3 = Promise.map(draft.attachments, fileId => {
			return load(FileTypeRef, fileId)
		}).then(files => {
			attachments = files;
		})
		return Promise.all([p1, p2, p3]).then(() => {
			this.draft = draft
			// conversation type is just a dummy here
			this._setMailData(previousMail, draft.confidential, conversationType, previousMessageId, draft.sender.address, draft.toRecipients, draft.ccRecipients, draft.bccRecipients, attachments, draft.subject, bodyText, draft.replyTos)
		})
	}

	_setMailData(previousMail: ?Mail, confidential: ?boolean, conversationType: ConversationTypeEnum, previousMessageId: ?string, senderMailAddress: string, toRecipients: MailAddress[], ccRecipients: MailAddress[], bccRecipients: MailAddress[], attachments: TutanotaFile[], subject: string, body: string, replyTos: EncryptedMailAddress[]): void {
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

		this._attachFiles(((attachments: any): Array<TutanotaFile | DataFile | FileReference>))

		// call this async because the editor is not initialized before this mail editor dialog is shown
		this.editor.initialized.promise.then(() => {
			if (this.editor.squire.getHTML() !== body) {
				this.editor.squire.setHTML(this._tempBody)
				this._mailChanged = false
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
	}

	show() {
		locator.entityEvent.addListener(this._entityEventReceived)
		this.dialog.show()
		windowFacade.checkWindowClosing(true)
	}


	_close() {
		windowFacade.checkWindowClosing(false)
		locator.entityEvent.removeListener(this._entityEventReceived)
		this.dialog.close()
	}

	_showFileChooserForAttachments() {
		if (env.mode === Mode.App) {
			return fileApp
				.openFileChooser(this._attachFilesButton._domButton.getBoundingClientRect())
				.then(files => {
					this._attachFiles((files: any))
					m.redraw()
				})
				.catch(PermissionError, () => {
					Dialog.error("fileAccessDeniedMobile_msg")
				})
				.catch(FileNotFoundError, () => {
					Dialog.error("couldNotAttachFile_msg")
				})
		} else {
			return fileController.showFileChooser(true).then(files => {
				this._attachFiles((files: any))
				m.redraw()
			})
		}
	}

	_attachFiles(files: Array<TutanotaFile | DataFile | FileReference>) {
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
		this._updateAttachmentButtons()
		if (tooBigFiles.length > 0) {
			Dialog.error(() => lang.get("tooBigAttachment_msg") + tooBigFiles.join(", "));
		}
		this._mailChanged = true
	}

	_updateAttachmentButtons() {
		this._attachmentButtons = this._attachments.map(file => {
			let lazyButtons: Button[] = []
			lazyButtons.push(new Button("download_action", () => {
					if (file._type === 'FileReference') {
						return fileApp.open((file: FileReference))
					} else if (file._type === "DataFile") {
						return fileController.open(file)
					} else {
						fileController.downloadAndOpen(((file: any): TutanotaFile), true)
					}

				}, null).setType(ButtonType.Secondary)
			)

			lazyButtons.push(new Button("remove_action", () => {
					remove(this._attachments, file)
					this._updateAttachmentButtons()
					this._mailChanged = true
					m.redraw()
				}, null).setType(ButtonType.Secondary)
			)

			return createDropDownButton(() => file.name, () => Icons.Attachment, () => lazyButtons)
				.setType(ButtonType.Bubble)
				.setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
		})
	}

	/**
	 * Saves the draft.
	 * @param saveAttachments True if also the attachments shall be saved, false otherwise.
	 * @returns {Promise} When finished.
	 */
	saveDraft(saveAttachments: boolean, showProgress: boolean): Promise<void> {
		let attachments = (saveAttachments) ? this._attachments : null
		let senderName = getSenderName(this._mailboxDetails)
		let to = this.toRecipients.bubbles.map(bubble => bubble.entity)
		let cc = this.ccRecipients.bubbles.map(bubble => bubble.entity)
		let bcc = this.bccRecipients.bubbles.map(bubble => bubble.entity)

		let promise = null
		const body = this._tempBody ? this._tempBody : this.editor.squire.getHTML()
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
		}
		else {
			promise = createMailDraft()
		}

		promise = promise.then(draft => {
			this.draft = draft
			return Promise.map(draft.attachments, fileId => load(FileTypeRef, fileId)).then(attachments => {
				this._attachments = [] // attachFiles will push to existing files but we want to overwrite them
				this._attachFiles(attachments)
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

	send() {
		return Promise
			.resolve()
			.then(() => {
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
						.saveDraft(true, false)
						.then(() => this._waitForResolvedRecipients())
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
											this._languageCodeField.selectedValue()))
										.then(() => this._updatePreviousMail())
										.then(() => this._updateExternalLanguage())
										.then(() => this._close())
								}
							})
						})
						.catch(RecipientNotResolvedError, e => {
							return Dialog.error("recipientNotResolvedTooManyRequests_msg")
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

					return showProgressDialog(this._confidentialButtonState ? "sending_msg" : "sendingUnencrypted_msg", send)
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
		if (props.notificationMailLanguage !== this._languageCodeField.selectedValue) {
			props.notificationMailLanguage = this._languageCodeField.selectedValue()
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
		}
		else {
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
	createBubble(name: ? string, mailAddress: string, contact: ? Contact): Bubble<RecipientInfo> {
		this._mailChanged = true
		let recipientInfo = createRecipientInfo(mailAddress, name, contact, false)
		let bubbleWrapper = {}
		bubbleWrapper.button = createAsyncDropDownButton(() => getDisplayText(recipientInfo.name, mailAddress, false), null, () => {
			if (recipientInfo.resolveContactPromise) {
				return recipientInfo.resolveContactPromise.then(contact => {
					return this._createBubbleContextButtons(recipientInfo.name, mailAddress, contact, () => bubbleWrapper.bubble)
				})
			} else {
				return Promise.resolve(this._createBubbleContextButtons(recipientInfo.name, mailAddress, contact, () => bubbleWrapper.bubble))
			}
		}, 250).setType(ButtonType.TextBubble)

		resolveRecipientInfo(recipientInfo)
			.then(() => m.redraw())
			.catch(ConnectionError, e => {
				// we are offline but we want to show the error dialog only when we click on send.
			})
			.catch(TooManyRequestsError, e => {
				Dialog.error("recipientNotResolvedTooManyRequests_msg")
			})
		bubbleWrapper.bubble = new Bubble(recipientInfo, neverNull(bubbleWrapper.button), mailAddress)
		return bubbleWrapper.bubble
	}

	_createBubbleContextButtons(name: string, mailAddress: string, contact: ? Contact, bubbleResolver: Function): (Button | string)[] {
		let buttons = [mailAddress]
		if (logins.getUserController().isInternalUser()) {
			if (contact && contact._id) { // the contact may be new contact, in this case do not edit it
				buttons.push(new Button("editContact_label", () => {
					new ContactEditor(contact).show()
				}, null).setType(ButtonType.Secondary))
			} else {
				buttons.push(new Button("createContact_action", () => {
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
				}, null).setType(ButtonType.Secondary))
			}
			buttons.push(new Button("remove_action", () => {
				this._removeBubble(bubbleResolver())
			}, null).setType(ButtonType.Secondary))
		}
		return buttons
	}

	_handleEntityEvent(typeRef: TypeRef<any>, listId: ? string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, ContactTypeRef) && (operation === OperationType.UPDATE
			|| operation === OperationType.DELETE)) {
			let contactId: IdTuple = [neverNull(listId), elementId]
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
				if (updatedContact.presharedPassword && this.mailAddressToPasswordField.has(emailAddress)) {
					neverNull(this.mailAddressToPasswordField.get(emailAddress))
						.setValue(updatedContact.presharedPassword)
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
}

const ContactSuggestionHeight = 60

export class ContactSuggestion {
	name: string;
	mailAddress: string;
	contact: ?Contact;
	selected: boolean;
	view: Function;

	constructor(name: string, mailAddress: string, contact: ?Contact) {
		this.name = name
		this.mailAddress = mailAddress
		this.contact = contact
		this.selected = false

		this.view = vnode => m(".pt-s.pb-s.click.content-hover", {
			class: this.selected ? 'content-accent-fg row-selected' : '',
			onmousedown: vnode.attrs.mouseDownHandler,
			style: {
				'padding-left': this.selected ? px(size.hpad_large - 3) : px(size.hpad_large),
				'border-left': this.selected ? "3px solid" : null,
				height: px(ContactSuggestionHeight),
			}
		}, [
			m("small", this.name),
			m(".name", this.mailAddress),
		])
	}

}

class MailBubbleHandler {
	suggestionHeight: number;
	_mailEditor: MailEditor;

	constructor(mailEditor: MailEditor) {
		this._mailEditor = mailEditor
		this.suggestionHeight = ContactSuggestionHeight
	}

	getSuggestions(text: string): Promise<ContactSuggestion[]> {
		let query = text.trim().toLowerCase()
		let contactsPromise = (locator.search.indexState().indexingSupported) ?
			searchForContacts(query, "recipient", 10) : LazyContactListId.getAsync()
				.then(listId => loadAll(ContactTypeRef, listId))
		return contactsPromise.map(contact => {
			let name = `${contact.firstName} ${contact.lastName}`.trim()
			let mailAddresses = []
			if (name.toLowerCase().indexOf(query) !== -1) {
				mailAddresses = contact.mailAddresses.filter(ma => isMailAddress(ma.address.trim(), false))
			} else {
				mailAddresses = contact.mailAddresses.filter(ma => {
					return isMailAddress(ma.address.trim(), false) && ma.address.toLowerCase().indexOf(query) !== -1
				})
			}
			return mailAddresses.map(ma => new ContactSuggestion(name, ma.address.trim(), contact))
		}).reduce((a, b) => a.concat(b), [])
			.then(suggestions => {
				if (env.mode === Mode.App) {
					return contactApp.findRecipients(query, 10, suggestions).then(() => suggestions)
				} else {
					return suggestions
				}
			})
			.then(suggestions => {
				return suggestions.sort((suggestion1, suggestion2) =>
					suggestion1.name.localeCompare(suggestion2.name))
			})
	}

	createBubbleFromSuggestion(suggestion: ContactSuggestion): Bubble<RecipientInfo> {
		return this._mailEditor.createBubble(suggestion.name, suggestion.mailAddress, suggestion.contact)
	}

	createBubblesFromText(text: string): Bubble<RecipientInfo>[] {
		let separator = (text.indexOf(";") !== -1) ? ";" : ","
		let textParts = text.split(separator)
		let bubbles = []

		for (let part of textParts) {
			part = part.trim()
			if (part.length !== 0) {
				let bubble = this.getBubbleFromText(part)
				if (!bubble) {
					return [] // if one recipient is invalid, we do not return any valid ones because all invalid text would be deleted otherwise
				} else {
					bubbles.push(bubble)
				}
			}
		}
		return bubbles
	}


	bubbleDeleted(bubble: Bubble<RecipientInfo>): void {
		console.log("deleted > ", bubble)
	}

	/**
	 * Retrieves a RecipientInfo instance from a text. The text may be a contact name, contact mail address or other mail address.
	 * @param text The text to create a RecipientInfo from.
	 * @return The recipient info or null if the text is not valid data.
	 */
	getBubbleFromText(text: string): ?Bubble<RecipientInfo> {
		text = text.trim()
		if (text === "") return null
		const nameAndMailAddress = stringToNameAndMailAddress(text)
		if (nameAndMailAddress) {
			let name = (nameAndMailAddress.name) ? nameAndMailAddress.name : null // name will be resolved with contact
			return this._mailEditor.createBubble(name, nameAndMailAddress.mailAddress, null)
		} else {
			return null
		}
	}
}
