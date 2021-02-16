// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"

import {Editor} from "../../gui/editor/Editor"
import type {Attachment, Recipients, ResponseMailParameters} from "./SendMailModel"
import {defaultSendMailModel, mailAddressToRecipient, SendMailModel} from "./SendMailModel"
import {Dialog} from "../../gui/base/Dialog"
import {lang} from "../../misc/LanguageViewModel"
import type {MailboxDetail} from "../model/MailModel"
import {checkApprovalStatus} from "../../misc/LoginUtils"
import {conversationTypeString, getEnabledMailAddressesWithUser, LINE_BREAK, parseMailtoUrl} from "../model/MailUtils"
import {PermissionError} from "../../api/common/error/PermissionError"
import {locator} from "../../api/main/MainLocator"
import {logins} from "../../api/main/LoginController"
import {ALLOWED_IMAGE_FORMATS, ConversationType, Keys, MailMethod} from "../../api/common/TutanotaConstants"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import {PreconditionFailedError} from "../../api/common/error/RestError"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {attachDropdown, createDropdown} from "../../gui/base/DropdownN"
import {fileController} from "../../file/FileController"
import {RichTextToolbar} from "../../gui/base/RichTextToolbar"
import {isApp, isBrowser, isDesktop} from "../../api/common/Env"
import {Icons} from "../../gui/base/icons/Icons"
import {RecipientInfoType} from "../../api/common/RecipientInfo"
import {animations, height, opacity} from "../../gui/animation/Animations"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {
	chooseAndAttachFile,
	cleanupInlineAttachments,
	createAttachmentButtonAttrs,
	createPasswordField,
	getConfidentialStateMessage,
	MailEditorRecipientField,
} from "./MailEditorViewModel"
import {ExpanderButtonN, ExpanderPanelN} from "../../gui/base/Expander"
import {newMouseEvent} from "../../gui/HtmlUtils"
import {windowFacade} from "../../misc/WindowFacade"
import {UserError} from "../../api/main/UserError"
import {showProgressDialog} from "../../gui/ProgressDialog"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import type {Mail} from "../../api/entities/tutanota/Mail"
import type {File as TutanotaFile} from "../../api/entities/tutanota/File"
import type {InlineImages} from "../view/MailViewer"
import {FileOpenError} from "../../api/common/error/FileOpenError"
import {downcast, noOp} from "../../api/common/utils/Utils"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {createInlineImage, replaceCidsWithInlineImages, replaceInlineImagesWithCids} from "../view/MailGuiUtils";
import {client} from "../../misc/ClientDetector"
import {getTimeZone} from "../../calendar/CalendarUtils"
import {appendEmailSignature} from "../signature/Signature"

export type MailEditorAttrs = {
	model: SendMailModel,
	body: Stream<string>,
	doBlockExternalContent: Stream<boolean>,
	doShowToolbar: Stream<boolean>,
	onload?: Function,
	onclose?: Function,
	areDetailsExpanded: Stream<boolean>,
	selectedNotificationLanguage: Stream<string>,
	inlineImages?: Promise<InlineImages>,
	_focusEditorOnLoad: () => void,
	_onSend: () => void
}

export function createMailEditorAttrs(model: SendMailModel, doBlockExternalContent: boolean, doFocusEditorOnLoad: boolean, inlineImages?: Promise<InlineImages>): MailEditorAttrs {
	return {
		model,
		body: stream(""),
		doBlockExternalContent: stream(doBlockExternalContent),
		doShowToolbar: stream(false),
		areDetailsExpanded: stream(false),
		selectedNotificationLanguage: stream(""),
		inlineImages: inlineImages,
		_focusEditorOnLoad: () => {},
		_onSend: () => {}
	}
}

export class MailEditor implements MComponent<MailEditorAttrs> {

	editor: Editor;
	toolbar: RichTextToolbar;
	recipientFields: {to: MailEditorRecipientField, cc: MailEditorRecipientField, bcc: MailEditorRecipientField}
	objectUrls: Array<string>
	mentionedInlineImages: Array<string>
	inlineImageElements: Array<HTMLElement>


	constructor(vnode: Vnode<MailEditorAttrs>) {

		this.objectUrls = []
		this.inlineImageElements = []
		this.mentionedInlineImages = []

		const a: MailEditorAttrs = vnode.attrs
		const model = a.model

		this.editor = new Editor(200, (html, isPaste) => {
			const sanitized = htmlSanitizer.sanitizeFragment(html, {blockExternalContent: !isPaste && a.doBlockExternalContent()})
			this.mentionedInlineImages = sanitized.inlineImageCids
			return sanitized.html
		})

		a._focusEditorOnLoad = () => { this.editor.initialized.promise.then(() => this.editor.focus()) }

		const onEditorChanged = () => {
			cleanupInlineAttachments(this.editor.getDOM(), this.inlineImageElements, model.getAttachments())
			model.setMailChanged(true)
			m.redraw()
		}

		// call this async because the editor is not initialized before this mail editor dialog is shown
		this.editor.initialized.promise.then(() => {
			this.editor.setHTML(model.getBody())
			// Add mutation observer to remove attachments when corresponding DOM element is removed
			new MutationObserver(onEditorChanged).observe(this.editor.getDOM(), {
				attributes: false,
				childList: true,
				subtree: true
			})

			// since the editor is the source for the body text, the model won't know if the body has changed unless we tell it
			this.editor.addChangeListener(() => model.setBody(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML))
		})

		const insertImageHandler = isApp()
			? null
			: event => chooseAndAttachFile(model, (event.target: any).getBoundingClientRect(), ALLOWED_IMAGE_FORMATS)
				.then(files => {
					files && files.forEach(file => {
						const img = createInlineImage(file)
						this.objectUrls.push(img.objectUrl)
						this.inlineImageElements.push(this.editor.insertImage(img.objectUrl, {cid: img.cid, style: 'max-width: 100%'}))
					})
					m.redraw()
				})
		this.toolbar = new RichTextToolbar(this.editor, {imageButtonClickHandler: insertImageHandler})

		this.recipientFields = {
			to: new MailEditorRecipientField(model, "to", locator.contactModel),
			cc: new MailEditorRecipientField(model, "cc", locator.contactModel),
			bcc: new MailEditorRecipientField(model, "bcc", locator.contactModel),
		}

		if (model.logins().isInternalUserLoggedIn()) {
			this.recipientFields.to.component.textField._injectionsRight = () =>
				m(".mr-s", m(ExpanderButtonN, {
					label: "show_action",
					expanded: a.areDetailsExpanded,
				}))
		} else {
			this.recipientFields.to.component.textField.setDisabled()
		}

		if (a.inlineImages) {
			a.inlineImages.then((loadedInlineImages) => {
				try {
					for (let file of loadedInlineImages.values()) {
						if (!model.getAttachments().includes(file.file)) {
							model.attachFiles([file.file])
						}
					}
				} catch (e) {
					if (e instanceof UserError) {
						showUserError(downcast(e))
					} else {
						throw e
					}
				}
				m.redraw()

				this.editor.initialized.promise.then(() => {
					this.inlineImageElements = replaceCidsWithInlineImages(this.editor.getDOM(), loadedInlineImages, (file, event, dom) => {
						createDropdown(() => [
							{
								label: "download_action",
								click: () => file._type !== "DataFile" // it's a TutanotaFile
									? fileController.downloadAndOpen(downcast(file), true)
									                .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
									: noOp,
								type: ButtonType.Dropdown
							}
						])(downcast(event), dom)
					})
				})
			})
		}

		model.onMailChanged.map(didChange => {
			if (didChange) m.redraw()
		})

		// To get the behaviour that remainining text in a text field creates an error
		a._onSend = () => {
			let invalidText = ""
			for (const field in this.recipientFields) {
				this.recipientFields[field].component.createBubbles()
				if (this.recipientFields[field].component.textField.value().trim() !== "") {
					invalidText += "\n" + this.recipientFields[field].component.textField.value().trim()
				}
			}
			if (invalidText !== "") {
				throw new UserError(() => lang.get("invalidRecipients_msg") + "\n" + invalidText)
			}
		}
	}

	view(vnode: Vnode<MailEditorAttrs>): Children {
		const a = vnode.attrs
		const model = a.model

		a.body = () => this.editor.getHTML()

		const showConfidentialButton = model.containsExternalRecipients()
		const isConfidential = model.isConfidential() && showConfidentialButton

		const confidentialButtonAttrs = {
			label: "confidential_action",
			click: (event, attrs) => model.setConfidential(!model.isConfidential()),
			icon: () => model.isConfidential() ? Icons.Lock : Icons.Unlock,
			isSelected: () => model.isConfidential(),
			noRecipientInfoBubble: true,
		}
		const attachFilesButtonAttrs = {
			label: "attachFiles_action",
			click: (ev, dom) => chooseAndAttachFile(model, dom.getBoundingClientRect()).then(() => m.redraw()),
			icon: () => Icons.Attachment,
			noRecipientInfoBubble: true
		}

		const toolbarButton = () => (!logins.getUserController().props.sendPlaintextOnly)
			? m(ButtonN, {
				label: 'showRichTextToolbar_action',
				icon: () => Icons.FontSize,
				click: () => a.doShowToolbar(!a.doShowToolbar()),
				isSelected: a.doShowToolbar,
				noRecipientInfoBubble: true
			})
			: null

		const subjectFieldAttrs: TextFieldAttrs = {
			label: "subject_label",
			helpLabel: () => getConfidentialStateMessage(model.isConfidential()),
			value: stream(model.getSubject()),
			oninput: val => model.setSubject(val),
			injectionsRight: () => {
				return showConfidentialButton
					? [m(ButtonN, confidentialButtonAttrs), m(ButtonN, attachFilesButtonAttrs), toolbarButton()]
					: [m(ButtonN, attachFilesButtonAttrs), toolbarButton()]
			}

		}

		function animate(domElement: HTMLElement, fadein: boolean) {
			let childHeight = domElement.offsetHeight
			return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
			                 .then(() => {
				                 domElement.style.height = ''
			                 })
		}

		const senderFieldAttrs = {
			label: "sender_label",
			items: getEnabledMailAddressesWithUser(model.getMailboxDetails(), model.user().userGroupInfo)
				.sort().map(mailAddress => ({
					name: mailAddress,
					value: mailAddress
				})),
			selectedValue: stream(a.model.getSender()),
			selectionChangedHandler: selection => model.setSender(selection),
			dropdownWidth: 250,
		}

		const attachmentButtonAttrs = createAttachmentButtonAttrs(model, this.inlineImageElements, this.mentionedInlineImages)

		const lazyPasswordFieldAttrs =
			() => model.allRecipients()
			           .filter(r => r.type === RecipientInfoType.EXTERNAL || r.type === RecipientInfoType.UNKNOWN
				           && !r.resolveContactPromise) // only show passwords for resolved contacts, otherwise we might not get the password
			           .map(r => m(TextFieldN, Object.assign({}, createPasswordField(model, r), {
				           oncreate: vnode => animate(vnode.dom, true),
				           onbeforeremove: vnode => animate(vnode.dom, false)
			           })))


		const lazyLanguageDropDownAttrs = () => {
			return {
				label: "notificationMailLanguage_label",
				items: model.getAvailableNotificationTemplateLanguages().map(language => {
					return {name: lang.get(language.textId), value: language.code}
				}),
				selectedValue: stream(model.getSelectedNotificationLanguageCode()),
				selectionChangedHandler: (v) => model.setSelectedNotificationLanguageCode(v),
				dropdownWidth: 250
			}
		}


		return m("#mail-editor.full-height.text.touch-callout", {
			onremove: vnode => {
				model.dispose()
				this.objectUrls.forEach((url) => URL.revokeObjectURL(url))
			},
			onclick: (e) => {
				if (e.target === this.editor.getDOM()) {
					this.editor.focus()
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
						model.attachFiles((dataFiles: any))
						m.redraw()
					}).catch(e => {
						console.log(e)
						return Dialog.error("couldNotAttachFile_msg")
					})
					ev.stopPropagation()
					ev.preventDefault()
				}
			},
			onload: (ev) => {
			}
		}, [
			m(this.recipientFields.to.component),
			m(ExpanderPanelN, {expanded: a.areDetailsExpanded},
				m(".details", [
					m(this.recipientFields.cc.component),
					m(this.recipientFields.bcc.component),
					m(".wrapping-row", [
						m(DropDownSelectorN, senderFieldAttrs),
						m("", isConfidential
							? m("", {
								oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
								onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
							}, m(DropDownSelectorN, lazyLanguageDropDownAttrs()))
							: null
						)

					]),
				])
			),
			isConfidential
				? m(".external-recipients.overflow-hidden", {
					oncreate: vnode => animate(vnode.dom, true),
					onbeforeremove: vnode => animate(vnode.dom, false)
				}, lazyPasswordFieldAttrs())
				: null,
			m(".row", m(TextFieldN, subjectFieldAttrs)),
			m(".flex-start.flex-wrap.ml-negative-RecipientInfoBubble", attachmentButtonAttrs.map((a) => m(ButtonN, a))),
			model.getAttachments().length > 0 ? m("hr.hr") : null,
			a.doShowToolbar()
				// Toolbar is not removed from DOM directly, only it's parent (array) is so we have to animate it manually.
				// m.fragment() gives us a vnode without actual DOM element so that we can run callback on removal
				? m.fragment({
					onbeforeremove: ({dom}) => this.toolbar._animate(dom.children[0], false)
				}, [m(this.toolbar), m("hr.hr")])
				: null,
			m(".pt-s.text.scroll-x.break-word-links", {onclick: () => this.editor.focus()}, m(this.editor)),
			m(".pb")
		])
	}
}


/**
 * Creates a new Dialog with a MailEditor inside.
 * @param model
 * @param blockExternalContent
 * @param inlineImages
 * @returns {Dialog}
 * @private
 */
function createMailEditorDialog(model: SendMailModel, blockExternalContent: boolean = false, inlineImages?: Promise<InlineImages>): Dialog {
	let dialog: Dialog
	let mailEditorAttrs: MailEditorAttrs
	let domCloseButton: HTMLElement


	const save = () => {
		return model.saveDraft(true, MailMethod.NONE, showProgressDialog)
		            .catch(UserError, err => Dialog.error(() => err.message))
		            .catch(FileNotFoundError, () => Dialog.error("couldNotAttachFile_msg"))
		            .catch(PreconditionFailedError, () => Dialog.error("operationStillActive_msg"))
	}
	const send = () => {
		try {
			mailEditorAttrs._onSend()
			model.send(
				MailMethod.NONE,
				Dialog.confirm,
				showProgressDialog)
			     .then(success => {if (success) dialog.close() })
			     .catch(UserError, (err) => Dialog.error(() => err.message))
		} catch (e) {
			Dialog.error(() => e.message)
		}

	}

	const closeButtonAttrs = attachDropdown({
			label: "close_alt",
			click: () => dialog.close(),
			type: ButtonType.Secondary,
			oncreate: vnode => domCloseButton = vnode.dom
		},
		() => [
			{
				label: "discardChanges_action",
				click: () => dialog.close(),
				type: ButtonType.Dropdown,
			},
			{
				label: "saveDraft_action",
				click: () => { save().then(() => dialog.close()) },
				type: ButtonType.Dropdown,
			}
		], () => model.hasMailChanged(), 250
	)

	let windowCloseUnsubscribe = () => {}
	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [closeButtonAttrs],
		right: [
			{
				label: "send_action",
				click: send,
				type: ButtonType.Primary
			}
		],
		middle: () => conversationTypeString(model.getConversationType()),
		create: () => {
			if (isBrowser()) {
				// Have a simple listener on browser, so their browser will make the user ask if they are sure they want to close when closing the tab/window
				windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {})
			} else if (isDesktop()) {
				// Simulate clicking the Close button when on the desktop so they can see they can save a draft rather than completely closing it
				windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
					closeButtonAttrs.click(newMouseEvent(), domCloseButton)
				})
			}
		},
		remove: () => {
			windowCloseUnsubscribe()
		}
	}

	mailEditorAttrs = createMailEditorAttrs(model, blockExternalContent, model.toRecipients().length !== 0, inlineImages);

	dialog = Dialog.largeDialogN(headerBarAttrs, MailEditor, mailEditorAttrs)
	               .addShortcut({
		               key: Keys.ESC,
		               exec() { closeButtonAttrs.click(newMouseEvent(), domCloseButton) },
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
		               exec: () => { save() },
		               help: "save_action"
	               })
	               .addShortcut({
		               key: Keys.S,
		               ctrl: true,
		               shift: true,
		               exec: send,
		               help: "send_action"
	               }).setCloseHandler(() => closeButtonAttrs.click(newMouseEvent(), domCloseButton))

	if (model.getConversationType() === ConversationType.REPLY || model.toRecipients().length) {
		dialog.setFocusOnLoadFunction(() => mailEditorAttrs._focusEditorOnLoad())
	}

	return dialog
}


/**
 * open a MailEditor
 * @param mailboxDetails details to use when sending an email
 * @returns {*}
 * @private
 * @throws PermissionError
 */
export function newMailEditor(mailboxDetails: MailboxDetail): Promise<Dialog> {
	return checkApprovalStatus(false).then(sendAllowed => {
		if (sendAllowed) {
			return import("../signature/Signature")
				.then(({appendEmailSignature}) => appendEmailSignature("", logins.getUserController().props))
				.then((signature) => newMailEditorFromTemplate(mailboxDetails, {}, "", signature))
		} else {
			return Promise.reject(new PermissionError("not allowed to send mail"))
		}
	})
}

export function newMailEditorAsResponse(args: ResponseMailParameters, blockExternalContent: boolean, inlineImages?: Promise<InlineImages>, mailboxDetails?: MailboxDetail): Promise<Dialog> {
	return _mailboxPromise(mailboxDetails)
		.then(defaultSendMailModel)
		.then(model => model.initAsResponse(args))
		.then(model => createMailEditorDialog(model, blockExternalContent, inlineImages))
}

export function newMailEditorFromDraft(draft: Mail, attachments: Array<TutanotaFile>, bodyText: string, blockExternalContent: boolean, inlineImages?: Promise<InlineImages>, mailboxDetails?: MailboxDetail): Promise<Dialog> {
	return _mailboxPromise(mailboxDetails)
		.then(defaultSendMailModel)
		.then(model => model.initWithDraft(draft, attachments, bodyText))
		.then(model => createMailEditorDialog(model, blockExternalContent, inlineImages))
}

export function newMailtoUrlMailEditor(mailtoUrl: string, confidential: boolean, mailboxDetails?: MailboxDetail): Promise<Dialog> {

	return _mailboxPromise(mailboxDetails).then(mailbox => {
		const mailTo = parseMailtoUrl(mailtoUrl)
		const subject = mailTo.subject
		const body = appendEmailSignature(mailTo.body, logins.getUserController().props)
		const recipients = {
			to: mailTo.to.map(mailAddressToRecipient),
			cc: mailTo.cc.map(mailAddressToRecipient),
			bcc: mailTo.bcc.map(mailAddressToRecipient)
		}

		return newMailEditorFromTemplate(mailbox, recipients, subject, body, [], confidential)
	})

}


export function newMailEditorFromTemplate(
	mailboxDetails: MailboxDetail,
	recipients: Recipients,
	subject: string,
	bodyText: string,
	attachments?: $ReadOnlyArray<Attachment>,
	confidential?: boolean,
	senderMailAddress?: string): Promise<Dialog> {

	return defaultSendMailModel(mailboxDetails)
		.initWithTemplate(recipients, subject, bodyText, attachments, confidential, senderMailAddress)
		.then(model => createMailEditorDialog(model))
}


export function getSupportMailSignature(): string {
	return LINE_BREAK + LINE_BREAK + "--"
		+ `<br>Client: ${client.getIdentifier()}`
		+ `<br>Tutanota version: ${env.versionNumber}`
		+ `<br>Time zone: ${getTimeZone()}`
		+ `<br>User agent:<br> ${navigator.userAgent}`
}

/**
 * Create and show a new mail editor with a support query, addressed to premium support,
 * or show an option to upgrade
 * @param subject
 * @param mailboxDetails
 * @returns {Promise<any>|Promise<R>|*}
 */
export function writeSupportMail(subject: string = "", mailboxDetails?: MailboxDetail) {
	if (logins.getUserController().isPremiumAccount()) {
		_mailboxPromise(mailboxDetails).then(mailbox => {
			const recipients = {
				to: [{name: null, address: "premium@tutao.de"}]
			}
			newMailEditorFromTemplate(mailbox, recipients, subject, getSupportMailSignature())
				.then(dialog => dialog.show())
		})

	} else {
		import("../../subscription/PriceUtils").then(({formatPrice}) => {
			const message = lang.get("premiumOffer_msg", {"{1}": formatPrice(1, true)})
			const title = lang.get("upgradeReminderTitle_msg")
			return Dialog.reminder(title, message, lang.getInfoLink("premiumProBusiness_link"))
		}).then(confirm => {
			if (confirm) {
				import("../../subscription/UpgradeSubscriptionWizard").then((utils) => utils.showUpgradeWizard())
			}
		})
	}
}

/**
 * Create and show a new mail editor with an invite message
 * @param mailboxDetails
 * @returns {*}
 */
export function writeInviteMail(mailboxDetails?: MailboxDetail) {
	_mailboxPromise(mailboxDetails).then(mailbox => {
		const username = logins.getUserController().userGroupInfo.name;
		const body = lang.get("invitationMailBody_msg", {
			'{registrationLink}': "https://mail.tutanota.com/signup",
			'{username}': username,
			'{githubLink}': "https://github.com/tutao/tutanota"
		})
		newMailEditorFromTemplate(mailbox, {}, lang.get("invitationMailSubject_msg"), body, [], false)
			.then(dialog => dialog.show())
	})
}

/**
 * Create and show a new mail editor with an invite message
 * @param link: the link to the giftcard
 * @param svg: an SVGElement that is the DOM node of the rendered gift card (note: This should be an SVGElement, but flow doesn't have declarations for that)
 * @param mailboxDetails
 * @returns {*}
 */
export function writeGiftCardMail(link: string, svg: HTMLElement, mailboxDetails?: MailboxDetail) {
	_mailboxPromise(mailboxDetails).then(mailbox => {
		let bodyText = lang.get("defaultShareGiftCardBody_msg", {
			'{link}': '<a href="' + link + '">' + link + '</a>',
			'{username}': logins.getUserController().userGroupInfo.name,
		}).split("\n").join("<br />");
		const subject = lang.get("defaultShareGiftCardSubject_msg")
		defaultSendMailModel(mailbox)
			.initWithTemplate({}, subject, appendEmailSignature(bodyText, logins.getUserController().props), [], false)
			.then(model => createMailEditorDialog(model, false))
			.then(dialog => dialog.show())
	})
}

function _mailboxPromise(mailbox?: MailboxDetail): Promise<MailboxDetail> {
	return mailbox
		? Promise.resolve(mailbox)
		: locator.mailModel.getUserMailboxDetails()
}

