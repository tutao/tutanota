import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Editor } from "../../gui/editor/Editor"
import type { Attachment, InitAsResponseArgs, SendMailModel } from "./SendMailModel"
import { Dialog } from "../../gui/base/Dialog"
import { InfoLink, lang } from "../../misc/LanguageViewModel"
import type { MailboxDetail } from "../model/MailModel"
import { checkApprovalStatus } from "../../misc/LoginUtils"
import {
	checkAttachmentSize,
	conversationTypeString,
	createNewContact,
	getEnabledMailAddressesWithUser,
	getMailAddressDisplayText,
	LINE_BREAK,
	RecipientField,
} from "../model/MailUtils"
import { PermissionError } from "../../api/common/error/PermissionError"
import { locator } from "../../api/main/MainLocator"
import { logins } from "../../api/main/LoginController"
import { ALLOWED_IMAGE_FORMATS, ConversationType, FeatureType, Keys, MailMethod } from "../../api/common/TutanotaConstants"
import { TooManyRequestsError } from "../../api/common/error/RestError"
import type { DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { attachDropdown, createDropdown, DropdownChildAttrs } from "../../gui/base/Dropdown.js"
import { isApp, isBrowser, isDesktop } from "../../api/common/Env"
import { Icons } from "../../gui/base/icons/Icons"
import { AnimationPromise, animations, height, opacity } from "../../gui/animation/Animations"
import type { TextFieldAttrs } from "../../gui/base/TextField.js"
import { Autocomplete, TextField, TextFieldType } from "../../gui/base/TextField.js"
import { chooseAndAttachFile, cleanupInlineAttachments, createAttachmentButtonAttrs, getConfidentialStateMessage } from "./MailEditorViewModel"
import { ExpanderPanel } from "../../gui/base/Expander"
import { windowFacade } from "../../misc/WindowFacade"
import { UserError } from "../../api/main/UserError"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { htmlSanitizer } from "../../misc/HtmlSanitizer"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import type { File as TutanotaFile, MailboxProperties } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import type { InlineImages } from "../view/MailViewer"
import { FileOpenError } from "../../api/common/error/FileOpenError"
import type { lazy } from "@tutao/tutanota-utils"
import { cleanMatch, downcast, isNotNull, noOp, ofClass, typedValues } from "@tutao/tutanota-utils"
import { isCustomizationEnabledForCustomer } from "../../api/common/utils/Utils"
import { createInlineImage, replaceCidsWithInlineImages, replaceInlineImagesWithCids } from "../view/MailGuiUtils"
import { client } from "../../misc/ClientDetector"
import { appendEmailSignature } from "../signature/Signature"
import { showTemplatePopupInEditor } from "../../templates/view/TemplatePopup"
import { registerTemplateShortcutListener } from "../../templates/view/TemplateShortcutListener"
import { TemplatePopupModel } from "../../templates/model/TemplatePopupModel"
import { createKnowledgeBaseDialogInjection } from "../../knowledgebase/view/KnowledgeBaseDialog"
import { KnowledgeBaseModel } from "../../knowledgebase/model/KnowledgeBaseModel"
import { styles } from "../../gui/styles"
import { showMinimizedMailEditor } from "../view/MinimizedMailEditorOverlay"
import { SaveErrorReason, SaveStatus, SaveStatusEnum } from "../model/MinimizedMailEditorViewModel"
import { isTutanotaFile } from "../../api/common/utils/FileUtils"
import { parseMailtoUrl } from "../../misc/parsing/MailAddressParser"
import { CancelledError } from "../../api/common/error/CancelledError"
import { Shortcut } from "../../misc/KeyManager"
import { Recipients, RecipientType } from "../../api/common/recipients/Recipient"
import { CompletenessIndicator } from "../../gui/CompletenessIndicator.js"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { MailRecipientsTextField } from "../../gui/MailRecipientsTextField.js"
import { getContactDisplayName } from "../../contacts/model/ContactUtils"
import { ResolvableRecipient } from "../../api/main/RecipientsModel"
import { isOfflineError } from "../../api/common/utils/ErrorCheckUtils.js"
import { animateToolbar, RichTextToolbar } from "../../gui/base/RichTextToolbar.js"
import { readLocalFiles } from "../../file/FileController"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ToggleButton, ToggleButtonAttrs } from "../../gui/base/ToggleButton.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { DialogInjectionRightAttrs } from "../../gui/base/DialogInjectionRight.js"
import { KnowledgebaseDialogContentAttrs } from "../../knowledgebase/view/KnowledgeBaseDialogContent.js"
import { MailWrapper } from "../../api/common/MailWrapper.js"
import { RecipientsSearchModel } from "../../misc/RecipientsSearchModel.js"
import { DataFile } from "../../api/common/DataFile.js"

export type MailEditorAttrs = {
	model: SendMailModel
	doBlockExternalContent: Stream<boolean>
	doShowToolbar: Stream<boolean>
	onload?: (editor: Editor) => void
	onclose?: (...args: Array<any>) => any
	selectedNotificationLanguage: Stream<string>
	dialog: lazy<Dialog>
	templateModel: TemplatePopupModel | null
	knowledgeBaseInjection: (editor: Editor) => Promise<DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs> | null>
	search: RecipientsSearchModel
}

export function createMailEditorAttrs(
	model: SendMailModel,
	doBlockExternalContent: boolean,
	doFocusEditorOnLoad: boolean,
	dialog: lazy<Dialog>,
	templateModel: TemplatePopupModel | null,
	knowledgeBaseInjection: (editor: Editor) => Promise<DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs> | null>,
	search: RecipientsSearchModel,
): MailEditorAttrs {
	return {
		model,
		doBlockExternalContent: stream(doBlockExternalContent),
		doShowToolbar: stream<boolean>(false),
		selectedNotificationLanguage: stream(""),
		dialog,
		templateModel,
		knowledgeBaseInjection: knowledgeBaseInjection,
		search,
	}
}

export class MailEditor implements Component<MailEditorAttrs> {
	private attrs: MailEditorAttrs

	editor: Editor

	private readonly recipientFieldTexts = {
		to: stream(""),
		cc: stream(""),
		bcc: stream(""),
	}

	mentionedInlineImages: Array<string>
	inlineImageElements: Array<HTMLElement>
	templateModel: TemplatePopupModel | null
	knowledgeBaseInjection: DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs> | null = null
	sendMailModel: SendMailModel
	private areDetailsExpanded: boolean
	private recipientShowConfidential: Map<string, boolean> = new Map()

	constructor(vnode: Vnode<MailEditorAttrs>) {
		const a = vnode.attrs
		this.attrs = a
		this.inlineImageElements = []
		this.mentionedInlineImages = []
		const model = a.model
		this.sendMailModel = model
		this.templateModel = a.templateModel

		// if we have any CC/BCC recipients, we should show these so, should the user send the mail, they know where it will be going to
		this.areDetailsExpanded = model.bccRecipients().length + model.ccRecipients().length > 0

		this.editor = new Editor(200, (html, isPaste) => {
			const sanitized = htmlSanitizer.sanitizeFragment(html, {
				blockExternalContent: !isPaste && a.doBlockExternalContent(),
			})
			this.mentionedInlineImages = sanitized.inlineImageCids
			return sanitized.fragment
		})

		const onEditorChanged = () => {
			cleanupInlineAttachments(this.editor.getDOM(), this.inlineImageElements, model.getAttachments())
			model.markAsChangedIfNecessary(true)
			m.redraw()
		}

		// call this async because the editor is not initialized before this mail editor dialog is shown
		this.editor.initialized.promise.then(() => {
			this.editor.setHTML(model.getBody())
			// Add mutation observer to remove attachments when corresponding DOM element is removed
			new MutationObserver(onEditorChanged).observe(this.editor.getDOM(), {
				attributes: false,
				childList: true,
				subtree: true,
			})
			// since the editor is the source for the body text, the model won't know if the body has changed unless we tell it
			this.editor.addChangeListener(() => model.setBody(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML))

			if (a.templateModel) {
				a.templateModel.init().then((templateModel) => {
					// add this event listener to handle quick selection of templates inside the editor
					registerTemplateShortcutListener(this.editor, templateModel)
				})
			}
		})

		this.editor.initialized.promise.then(() => {
			const dom = this.editor.getDOM()
			this.inlineImageElements = replaceCidsWithInlineImages(dom, model.loadedInlineImages, (cid, event, dom) => {
				const downloadClickHandler = createDropdown({
					lazyButtons: () => [
						{
							label: "download_action",
							click: () => this.downloadInlineImage(model, cid),
						},
					],
				})
				downloadClickHandler(downcast(event), dom)
			})
		})
		model.onMailChanged.map(() => m.redraw())
		// Leftover text in recipient field is an error
		model.setOnBeforeSendFunction(() => {
			let invalidText = ""
			for (const leftoverText of typedValues(this.recipientFieldTexts)) {
				if (leftoverText().trim() !== "") {
					invalidText += "\n" + leftoverText().trim()
				}
			}

			if (invalidText !== "") {
				throw new UserError(() => lang.get("invalidRecipients_msg") + invalidText)
			}
		})
		const dialog = a.dialog()

		if (model.getConversationType() === ConversationType.REPLY || model.toRecipients().length) {
			dialog.setFocusOnLoadFunction(() => {
				this.editor.initialized.promise.then(() => this.editor.focus())
			})
		}

		const shortcuts: Shortcut[] = [
			{
				key: Keys.SPACE,
				ctrl: true,
				exec: () => this.openTemplates(),
				help: "openTemplatePopup_msg",
			}, // these are handled by squire
			{
				key: Keys.B,
				ctrl: true,
				exec: noOp,
				help: "formatTextBold_msg",
			},
			{
				key: Keys.I,
				ctrl: true,
				exec: noOp,
				help: "formatTextItalic_msg",
			},
			{
				key: Keys.U,
				ctrl: true,
				exec: noOp,
				help: "formatTextUnderline_msg",
			},
		]
		shortcuts.forEach(dialog.addShortcut.bind(dialog))
		this.editor.initialized.promise.then(() => {
			a.knowledgeBaseInjection(this.editor).then((injection) => {
				this.knowledgeBaseInjection = injection
				m.redraw()
			})
		})
	}

	private downloadInlineImage(model: SendMailModel, cid: string) {
		const inlineAttachment = model.getAttachments().find((attachment) => attachment.cid === cid)

		if (inlineAttachment && isTutanotaFile(inlineAttachment)) {
			locator.fileController.open(inlineAttachment).catch(ofClass(FileOpenError, () => Dialog.message("canNotOpenFileOnDevice_msg")))
		}
	}

	view(vnode: Vnode<MailEditorAttrs>): Children {
		const a = vnode.attrs
		this.attrs = a
		const { model } = a
		this.sendMailModel = model

		const showConfidentialButton = model.containsExternalRecipients()
		const isConfidential = model.isConfidential() && showConfidentialButton
		const confidentialButtonAttrs: ToggleButtonAttrs = {
			title: model.isConfidential() ? "confidential_action" : "nonConfidential_action",
			onToggled: (_, e) => {
				e.stopPropagation()
				model.setConfidential(!model.isConfidential())
			},
			icon: model.isConfidential() ? Icons.Lock : Icons.Unlock,
			toggled: model.isConfidential(),
			size: ButtonSize.Compact,
		}
		const attachFilesButtonAttrs: IconButtonAttrs = {
			title: "attachFiles_action",
			click: (ev, dom) => chooseAndAttachFile(model, dom.getBoundingClientRect()).then(() => m.redraw()),
			icon: Icons.Attachment,
			size: ButtonSize.Compact,
		}
		const plaintextFormatting = logins.getUserController().props.sendPlaintextOnly
		this.editor.setCreatesLists(!plaintextFormatting)

		const toolbarButton = () =>
			!plaintextFormatting
				? m(ToggleButton, {
						title: "showRichTextToolbar_action",
						icon: Icons.FontSize,
						size: ButtonSize.Compact,
						toggled: a.doShowToolbar(),
						onToggled: (_, e) => {
							a.doShowToolbar(!a.doShowToolbar())
							// Stop the subject bar from being focused
							e.stopPropagation()
							this.editor.focus()
						},
				  })
				: null

		const subjectFieldAttrs: TextFieldAttrs = {
			label: "subject_label",
			helpLabel: () => getConfidentialStateMessage(model.isConfidential()),
			value: model.getSubject(),
			oninput: (val) => model.setSubject(val),
			injectionsRight: () =>
				m(".flex.end.ml-between-s.items-center", [
					showConfidentialButton ? m(ToggleButton, confidentialButtonAttrs) : null,
					this.knowledgeBaseInjection ? this.renderToggleKnowledgeBase(this.knowledgeBaseInjection) : null,
					m(IconButton, attachFilesButtonAttrs),
					toolbarButton(),
				]),
		}

		const attachmentButtonAttrs = createAttachmentButtonAttrs(model, this.inlineImageElements)

		let editCustomNotificationMailAttrs: IconButtonAttrs | null = null

		if (logins.getUserController().isGlobalAdmin()) {
			editCustomNotificationMailAttrs = attachDropdown({
				mainButtonAttrs: {
					title: "more_label",
					icon: Icons.More,
					size: ButtonSize.Compact,
				},
				childAttrs: () => [
					{
						label: "add_action",
						click: () => {
							import("../../settings/EditNotificationEmailDialog").then(({ showAddOrEditNotificationEmailDialog }) =>
								showAddOrEditNotificationEmailDialog(logins.getUserController()),
							)
						},
					},
					{
						label: "edit_action",
						click: () => {
							import("../../settings/EditNotificationEmailDialog").then(({ showAddOrEditNotificationEmailDialog }) =>
								showAddOrEditNotificationEmailDialog(logins.getUserController(), model.getSelectedNotificationLanguageCode()),
							)
						},
					},
				],
			})
		}

		return m(
			"#mail-editor.full-height.text.touch-callout.flex.flex-column",
			{
				onclick: (e: MouseEvent) => {
					if (e.target === this.editor.getDOM()) {
						this.editor.focus()
					}
				},
				ondragover: (ev: DragEvent) => {
					// do not check the data transfer here because it is not always filled, e.g. in Safari
					ev.stopPropagation()
					ev.preventDefault()
				},
				ondrop: (ev: DragEvent) => {
					if (ev.dataTransfer?.files && ev.dataTransfer.files.length > 0) {
						readLocalFiles(ev.dataTransfer.files)
							.then((dataFiles) => {
								model.attachFiles(dataFiles as any)
								m.redraw()
							})
							.catch((e) => {
								console.log(e)
								return Dialog.message("couldNotAttachFile_msg")
							})
						ev.stopPropagation()
						ev.preventDefault()
					}
				},
			},
			[
				m(".rel", this.renderRecipientField(RecipientField.TO, this.recipientFieldTexts.to, a.search)),
				m(
					".rel",
					m(
						ExpanderPanel,
						{
							expanded: this.areDetailsExpanded,
						},
						m(".details", [
							this.renderRecipientField(RecipientField.CC, this.recipientFieldTexts.cc, a.search),
							this.renderRecipientField(RecipientField.BCC, this.recipientFieldTexts.bcc, a.search),
						]),
					),
				),
				m(".wrapping-row", [
					m(
						"",
						{
							style: {
								"min-width": "250px",
							},
						},
						m(DropDownSelector, {
							label: "sender_label",
							items: getEnabledMailAddressesWithUser(model.mailboxDetails, model.user().userGroupInfo)
								.sort()
								.map((mailAddress) => ({
									name: mailAddress,
									value: mailAddress,
								})),
							selectedValue: a.model.getSender(),
							selectedValueDisplay: getMailAddressDisplayText(a.model.getSenderName(), a.model.getSender(), false),
							selectionChangedHandler: (selection: string) => model.setSender(selection),
							dropdownWidth: 250,
						}),
					),
					isConfidential
						? m(
								".flex",
								{
									style: {
										"min-width": "250px",
									},
									oncreate: (vnode) => {
										const htmlDom = vnode.dom as HTMLElement
										htmlDom.style.opacity = "0"
										return animations.add(htmlDom, opacity(0, 1, true))
									},
									onbeforeremove: (vnode) => {
										const htmlDom = vnode.dom as HTMLElement
										htmlDom.style.opacity = "1"
										return animations.add(htmlDom, opacity(1, 0, true))
									},
								},
								[
									m(
										".flex-grow",
										m(DropDownSelector, {
											label: "notificationMailLanguage_label",
											items: model.getAvailableNotificationTemplateLanguages().map((language) => {
												return {
													name: lang.get(language.textId),
													value: language.code,
												}
											}),
											selectedValue: model.getSelectedNotificationLanguageCode(),
											selectionChangedHandler: (v: string) => model.setSelectedNotificationLanguageCode(v),
											dropdownWidth: 250,
										}),
									),
									editCustomNotificationMailAttrs
										? m(".pt.flex-no-grow.flex-end.border-bottom.flex.items-center", m(IconButton, editCustomNotificationMailAttrs))
										: null,
								],
						  )
						: null,
				]),
				isConfidential ? this.renderPasswordFields() : null,
				m(".row", m(TextField, subjectFieldAttrs)),
				m(
					".flex-start.flex-wrap.column-gap",
					attachmentButtonAttrs.map((a) => m(Button, a)),
				),
				model.getAttachments().length > 0 ? m("hr.hr") : null,
				a.doShowToolbar() ? this.renderToolbar(model) : null,
				m(
					".pt-s.text.scroll-x.break-word-links.flex.flex-column.flex-grow",
					{
						onclick: () => this.editor.focus(),
					},
					m(this.editor),
				),
				m(".pb"),
			],
		)
	}

	private renderToggleKnowledgeBase(knowledgeBaseInjection: DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs>) {
		return m(ToggleButton, {
			title: "openKnowledgebase_action",
			toggled: knowledgeBaseInjection.visible(),
			onToggled: () => {
				if (knowledgeBaseInjection.visible()) {
					knowledgeBaseInjection.visible(false)
				} else {
					knowledgeBaseInjection.componentAttrs.model.sortEntriesByMatchingKeywords(this.editor.getValue())
					knowledgeBaseInjection.visible(true)
					knowledgeBaseInjection.componentAttrs.model.init()
				}
			},
			icon: Icons.Book,
			size: ButtonSize.Compact,
		})
	}

	private renderToolbar(model: SendMailModel): Children {
		// Toolbar is not removed from DOM directly, only it's parent (array) is so we have to animate it manually.
		// m.fragment() gives us a vnode without actual DOM element so that we can run callback on removal
		return m.fragment(
			{
				onbeforeremove: ({ dom }) => animateToolbar(dom.children[0] as HTMLElement, false),
			},
			[
				m(RichTextToolbar, {
					editor: this.editor,
					imageButtonClickHandler: isApp()
						? null
						: (event: Event) => this.imageButtonClickHandler(model, (event.target as HTMLElement).getBoundingClientRect()),
					customButtonAttrs: this.templateModel
						? [
								{
									title: "openTemplatePopup_msg",
									click: () => {
										this.openTemplates()
									},
									icon: Icons.ListAlt,
									size: ButtonSize.Compact,
								},
						  ]
						: [],
				}),
				m("hr.hr"),
			],
		)
	}

	private async imageButtonClickHandler(model: SendMailModel, rect: DOMRect): Promise<void> {
		const files = await chooseAndAttachFile(model, rect, ALLOWED_IMAGE_FORMATS)
		if (!files || files.length === 0) return
		for (const file of files) {
			const img = createInlineImage(file as DataFile)
			model.loadedInlineImages.set(img.cid, img)
			this.inlineImageElements.push(
				this.editor.insertImage(img.objectUrl, {
					cid: img.cid,
					style: "max-width: 100%",
				}),
			)
		}
		m.redraw()
	}

	private renderPasswordFields(): Children {
		return m(
			".external-recipients.overflow-hidden",
			{
				oncreate: (vnode) => this.animateHeight(vnode.dom as HTMLElement, true),
				onbeforeremove: (vnode) => this.animateHeight(vnode.dom as HTMLElement, false),
			},
			this.sendMailModel
				.allRecipients()
				.filter((r) => r.type === RecipientType.EXTERNAL)
				.map((recipient) => {
					if (!this.recipientShowConfidential.has(recipient.address)) this.recipientShowConfidential.set(recipient.address, false)

					return m(TextField, {
						oncreate: (vnode) => this.animateHeight(vnode.dom as HTMLElement, true),
						onbeforeremove: (vnode) => this.animateHeight(vnode.dom as HTMLElement, false),
						label: () => lang.get("passwordFor_label", { "{1}": recipient.address }),
						helpLabel: () =>
							m(".mt-xs.flex.items-center", [
								m(CompletenessIndicator, { percentageCompleted: this.sendMailModel.getPasswordStrength(recipient) }),
								// hack! We want to reserve enough space from the text field to be like "real" password field but we don't have any text and
								// CSS unit "lh" is not supported. We could query it programmatically but instead we insert one text node (this is nbsp character)
								// which will take line-height and size the line properly.
								m("", String.fromCharCode(160)),
							]),
						value: this.sendMailModel.getPassword(recipient.address),
						autocompleteAs: Autocomplete.off,
						type: this.isConfidentialPasswordRevealed(recipient.address) ? TextFieldType.Text : TextFieldType.Password,
						oninput: (val) => this.sendMailModel.setPassword(recipient.address, val),
						injectionsRight: () => this.renderRevealIcon(recipient.address),
					})
				}),
		)
	}

	private renderRecipientField(field: RecipientField, fieldText: Stream<string>, search: RecipientsSearchModel): Children {
		const label = (
			{
				to: "to_label",
				cc: "cc_label",
				bcc: "bcc_label",
			} as const
		)[field]

		return m(MailRecipientsTextField, {
			label,
			text: fieldText(),
			onTextChanged: (text) => fieldText(text),
			recipients: this.sendMailModel.getRecipientList(field),
			onRecipientAdded: async (address, name) => {
				try {
					await this.sendMailModel.addRecipient(field, { address, name })
				} catch (e) {
					if (isOfflineError(e)) {
						// we are offline but we want to show the error dialog only when we click on send.
					} else if (e instanceof TooManyRequestsError) {
						await Dialog.message("tooManyAttempts_msg")
					} else {
						throw e
					}
				}
			},
			onRecipientRemoved: (address) => this.sendMailModel.removeRecipientByAddress(address, field),
			getRecipientClickedDropdownAttrs: (address) => {
				const recipient = this.sendMailModel.getRecipient(field, address)!
				return this.getRecipientClickedContextButtons(recipient, field)
			},
			disabled: !this.sendMailModel.logins.isInternalUserLoggedIn(),
			injectionsRight:
				field === RecipientField.TO && this.sendMailModel.logins.isInternalUserLoggedIn()
					? m(
							"",
							m(ToggleButton, {
								title: "show_action",
								icon: BootIcons.Expand,
								size: ButtonSize.Compact,
								toggled: this.areDetailsExpanded,
								onToggled: (_, e) => {
									e.stopPropagation()
									this.areDetailsExpanded = !this.areDetailsExpanded
								},
							}),
					  )
					: null,
			search,
		})
	}

	private renderRevealIcon(address: string): Children {
		return m(ToggleButton, {
			title: this.isConfidentialPasswordRevealed(address) ? "concealPassword_action" : "revealPassword_action",
			toggled: this.isConfidentialPasswordRevealed(address),
			onToggled: (_, e) => {
				this.toggleRevealConfidentialPassword(address)
				e.stopPropagation()
			},
			icon: this.isConfidentialPasswordRevealed(address) ? Icons.NoEye : Icons.Eye,
			size: ButtonSize.Compact,
		})
	}

	private async getRecipientClickedContextButtons(recipient: ResolvableRecipient, field: RecipientField): Promise<DropdownChildAttrs[]> {
		const { logins, entity, contactModel } = this.sendMailModel

		const canEditBubbleRecipient = logins.getUserController().isInternalUser() && !logins.isEnabled(FeatureType.DisableContacts)

		const previousMail = this.sendMailModel.getPreviousMail()

		const canRemoveBubble =
			logins.getUserController().isInternalUser() &&
			(!previousMail || !previousMail.restrictions || previousMail.restrictions.participantGroupInfos.length === 0)

		const createdContactReceiver = (contactElementId: Id) => {
			const mailAddress = recipient.address

			contactModel.contactListId().then((contactListId) => {
				if (!contactListId) return
				const id: IdTuple = [contactListId, contactElementId]
				entity.load(ContactTypeRef, id).then((contact) => {
					if (contact.mailAddresses.find((ma) => cleanMatch(ma.address, mailAddress))) {
						recipient.setName(getContactDisplayName(contact))
						recipient.setContact(contact)
					} else {
						this.sendMailModel.removeRecipient(recipient, field, false)
					}
				})
			})
		}

		const contextButtons: Array<DropdownChildAttrs> = []

		if (canEditBubbleRecipient) {
			if (recipient.contact && recipient.contact._id) {
				contextButtons.push({
					label: () => lang.get("editContact_label"),
					click: () => {
						import("../../contacts/ContactEditor").then(({ ContactEditor }) => new ContactEditor(entity, recipient.contact).show())
					},
				})
			} else {
				contextButtons.push({
					label: () => lang.get("createContact_action"),
					click: () => {
						// contact list
						contactModel.contactListId().then((contactListId) => {
							const newContact = createNewContact(logins.getUserController().user, recipient.address, recipient.name)
							import("../../contacts/ContactEditor").then(({ ContactEditor }) => {
								new ContactEditor(entity, newContact, contactListId ?? undefined, createdContactReceiver).show()
							})
						})
					},
				})
			}
		}

		if (canRemoveBubble) {
			contextButtons.push({
				label: "remove_action",
				click: () => this.sendMailModel.removeRecipient(recipient, field, false),
			})
		}

		return contextButtons
	}

	private openTemplates() {
		if (this.templateModel) {
			this.templateModel.init().then((templateModel) => {
				showTemplatePopupInEditor(templateModel, this.editor, null, this.editor.getSelectedText())
			})
		}
	}

	private animateHeight(domElement: HTMLElement, fadein: boolean): AnimationPromise {
		let childHeight = domElement.offsetHeight
		return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0)).then(() => {
			domElement.style.height = ""
		})
	}

	private isConfidentialPasswordRevealed(address: string): boolean {
		return this.recipientShowConfidential.get(address) ?? false
	}

	private toggleRevealConfidentialPassword(address: string): void {
		this.recipientShowConfidential.set(address, !this.recipientShowConfidential.get(address))
	}
}

/**
 * Creates a new Dialog with a MailEditor inside.
 * @param model
 * @param blockExternalContent
 * @returns {Dialog}
 * @private
 */
async function createMailEditorDialog(model: SendMailModel, blockExternalContent: boolean = false): Promise<Dialog> {
	let dialog: Dialog
	let mailEditorAttrs: MailEditorAttrs

	const save = (showProgress: boolean = true) => {
		const savePromise = model.saveDraft(true, MailMethod.NONE)

		if (showProgress) {
			return showProgressDialog("save_msg", savePromise)
		} else {
			return savePromise
		}
	}

	const send = async () => {
		try {
			const success = await model.send(MailMethod.NONE, Dialog.confirm, showProgressDialog)
			if (success) {
				dispose()
				dialog.close()
			}
		} catch (e) {
			if (e instanceof UserError) {
				showUserError(e)
			} else {
				throw e
			}
		}
	}

	// keep track of things we need to dispose of when the editor is completely closed
	const disposables: { dispose: () => unknown }[] = []

	const dispose = () => {
		model.dispose()
		if (templatePopupModel) templatePopupModel.dispose()
		for (const disposable of disposables) {
			disposable.dispose()
		}
	}

	const minimize = () => {
		let saveStatus = stream<SaveStatus>({ status: SaveStatusEnum.Saving })
		if (model.hasMailChanged()) {
			save(false)
				.then(() => saveStatus({ status: SaveStatusEnum.Saved }))
				.catch((e) => {
					const reason = isOfflineError(e) ? SaveErrorReason.ConnectionLost : SaveErrorReason.Unknown

					saveStatus({ status: SaveStatusEnum.NotSaved, reason })

					// If we don't show the error in the minimized error dialog,
					// Then we need to communicate it in a dialog or as an unhandled error
					if (reason === SaveErrorReason.Unknown) {
						if (e instanceof UserError) {
							showUserError(e)
						} else {
							throw e
						}
					}
				})
				.finally(() => m.redraw())
		} else if (!model.draft) {
			// If the mail is unchanged and there was no preexisting draft, close instead of saving and return to not show minimized mail editor
			dispose()
			dialog.close()
			return
		}
		// If the mail is unchanged and there /is/ a preexisting draft, there was no change and the mail is already saved
		else saveStatus = stream<SaveStatus>({ status: SaveStatusEnum.Saved })
		showMinimizedMailEditor(dialog, model, locator.minimizedMailModel, locator.eventController, dispose, saveStatus)
	}

	let windowCloseUnsubscribe = () => {}

	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "close_alt",
				click: () => minimize(),
				type: ButtonType.Secondary,
			},
		],
		right: [
			{
				label: "send_action",
				click: () => {
					send()
				},
				type: ButtonType.Primary,
			},
		],
		middle: () => conversationTypeString(model.getConversationType()),
		create: () => {
			if (isBrowser()) {
				// Have a simple listener on browser, so their browser will make the user ask if they are sure they want to close when closing the tab/window
				windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {})
			} else if (isDesktop()) {
				// Simulate clicking the Close button when on the desktop so they can see they can save a draft rather than completely closing it
				windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
					minimize()
				})
			}
		},
		remove: () => {
			windowCloseUnsubscribe()
		},
	}
	const templatePopupModel =
		logins.isInternalUserLoggedIn() && client.isDesktopDevice() ? new TemplatePopupModel(locator.eventController, logins, locator.entityClient) : null

	const createKnowledgebaseButtonAttrs = async (editor: Editor) => {
		if (logins.isInternalUserLoggedIn()) {
			const customer = await logins.getUserController().loadCustomer()
			// only create knowledgebase button for internal users with valid template group and enabled KnowledgebaseFeature
			if (
				styles.isDesktopLayout() &&
				templatePopupModel &&
				logins.getUserController().getTemplateMemberships().length > 0 &&
				isCustomizationEnabledForCustomer(customer, FeatureType.KnowledgeBase)
			) {
				const knowledgebaseModel = new KnowledgeBaseModel(locator.eventController, locator.entityClient, logins.getUserController())
				await knowledgebaseModel.init()

				// make sure we dispose knowledbaseModel once the editor is closed
				disposables.push(knowledgebaseModel)

				const knowledgebaseInjection = createKnowledgeBaseDialogInjection(knowledgebaseModel, templatePopupModel, editor)
				dialog.setInjectionRight(knowledgebaseInjection)
				return knowledgebaseInjection
			} else {
				return null
			}
		} else {
			return null
		}
	}

	mailEditorAttrs = createMailEditorAttrs(
		model,
		blockExternalContent,
		model.toRecipients().length !== 0,
		() => dialog,
		templatePopupModel,
		createKnowledgebaseButtonAttrs,
		await locator.recipientsSearchModel(),
	)
	const shortcuts: Shortcut[] = [
		{
			key: Keys.ESC,
			exec: () => {
				minimize()
			},
			help: "close_alt",
		},
		{
			key: Keys.S,
			ctrl: true,
			exec: () => {
				save().catch(ofClass(UserError, showUserError))
			},
			help: "save_action",
		},
		{
			key: Keys.S,
			ctrl: true,
			shift: true,
			exec: () => {
				send()
			},
			help: "send_action",
		},
		{
			key: Keys.RETURN,
			ctrl: true,
			exec: () => {
				send()
			},
			help: "send_action",
		},
	]
	dialog = Dialog.largeDialogN(headerBarAttrs, MailEditor, mailEditorAttrs)
	dialog.setCloseHandler(() => minimize())

	for (let shortcut of shortcuts) {
		dialog.addShortcut(shortcut)
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
export async function newMailEditor(mailboxDetails: MailboxDetail): Promise<Dialog> {
	// We check approval status so as to get a dialog informing the user that they cannot send mails
	// but we still want to open the mail editor because they should still be able to contact sales@tutao.de
	await checkApprovalStatus(logins, false)
	const { appendEmailSignature } = await import("../signature/Signature")
	const signature = appendEmailSignature("", logins.getUserController().props)
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
	return newMailEditorFromTemplate(detailsProperties.mailboxDetails, {}, "", signature)
}

export async function newMailEditorAsResponse(
	args: InitAsResponseArgs,
	blockExternalContent: boolean,
	inlineImages: InlineImages,
	mailboxDetails?: MailboxDetail,
): Promise<Dialog> {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
	const model = await locator.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties)
	await model.initAsResponse(args, inlineImages)
	return createMailEditorDialog(model, blockExternalContent)
}

export async function newMailEditorFromDraft(
	attachments: TutanotaFile[],
	mailWrapper: MailWrapper,
	blockExternalContent: boolean,
	inlineImages: InlineImages,
	mailboxDetails?: MailboxDetail,
): Promise<Dialog> {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
	const model = await locator.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties)
	await model.initWithDraft(attachments, mailWrapper, inlineImages)
	return createMailEditorDialog(model, blockExternalContent)
}

export async function newMailtoUrlMailEditor(mailtoUrl: string, confidential: boolean, mailboxDetails?: MailboxDetail): Promise<Dialog> {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
	const mailTo = parseMailtoUrl(mailtoUrl)
	let dataFiles: Attachment[] = []

	if (mailTo.attach) {
		const attach = mailTo.attach

		if (isDesktop()) {
			const files = await Promise.all(attach.map((uri) => locator.fileApp.readDataFile(uri)))
			dataFiles = files.filter(isNotNull)
		}
		// make sure the user is aware that (and which) files have been attached
		const keepAttachments =
			dataFiles.length === 0 ||
			(await Dialog.confirm("attachmentWarning_msg", "attachFiles_action", () =>
				dataFiles.map((df, i) =>
					m(
						".text-break.selectable.mt-xs",
						{
							title: attach[i],
						},
						df.name,
					),
				),
			))

		if (keepAttachments) {
			const sizeCheckResult = checkAttachmentSize(dataFiles)
			dataFiles = sizeCheckResult.attachableFiles

			if (sizeCheckResult.tooBigFiles.length > 0) {
				await Dialog.message(
					() => lang.get("tooBigAttachment_msg"),
					() => sizeCheckResult.tooBigFiles.map((file) => m(".text-break.selectable", file)),
				)
			}
		} else {
			throw new CancelledError("user cancelled opening mail editor with attachments")
		}
	}

	return newMailEditorFromTemplate(
		detailsProperties.mailboxDetails,
		mailTo.recipients,
		mailTo.subject || "",
		appendEmailSignature(mailTo.body || "", logins.getUserController().props),
		dataFiles,
		confidential,
		undefined,
		true, // emails created with mailto should always save as draft
	)
}

export async function newMailEditorFromTemplate(
	mailboxDetails: MailboxDetail,
	recipients: Recipients,
	subject: string,
	bodyText: string,
	attachments?: ReadonlyArray<Attachment>,
	confidential?: boolean,
	senderMailAddress?: string,
	initialChangedState?: boolean,
): Promise<Dialog> {
	const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	return locator
		.sendMailModel(mailboxDetails, mailboxProperties)
		.then((model) => model.initWithTemplate(recipients, subject, bodyText, attachments, confidential, senderMailAddress, initialChangedState))
		.then((model) => createMailEditorDialog(model))
}

export function getSupportMailSignature(): Promise<string> {
	return import("../../calendar/date/CalendarUtils").then(({ getTimeZone }) => {
		return (
			LINE_BREAK +
			LINE_BREAK +
			"--" +
			`<br>Client: ${client.getIdentifier()}` +
			`<br>Tutanota version: ${env.versionNumber}` +
			`<br>Time zone: ${getTimeZone()}` +
			`<br>User agent:<br> ${navigator.userAgent}`
		)
	})
}

/**
 * Create and show a new mail editor with a support query, addressed to premium support,
 * or show an option to upgrade
 * @param subject
 * @param mailboxDetails
 * @returns {Promise<any>|Promise<R>|*}
 */
export async function writeSupportMail(subject: string = "", mailboxDetails?: MailboxDetail) {
	if (logins.getUserController().isPremiumAccount()) {
		const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
		const recipients = {
			to: [
				{
					name: null,
					address: "premium@tutao.de",
				},
			],
		}
		const signature = await getSupportMailSignature()
		const dialog = await newMailEditorFromTemplate(detailsProperties.mailboxDetails, recipients, subject, signature)
		dialog.show()
	} else {
		import("../../subscription/PriceUtils")
			.then(({ formatPrice }) => {
				const message = lang.get("premiumOffer_msg", {
					"{1}": formatPrice(1, true),
				})
				const title = lang.get("upgradeReminderTitle_msg")
				return Dialog.reminder(title, message, InfoLink.PremiumProBusiness)
			})
			.then((confirm) => {
				if (confirm) {
					import("../../subscription/UpgradeSubscriptionWizard").then((utils) => utils.showUpgradeWizard())
				}
			})
	}
}

/**
 * Create and show a new mail editor with an invite message
 * @param mailboxDetails?
 * @returns {*}
 */
export async function writeInviteMail(referralLink: string) {
	const detailsProperties = await getMailboxDetailsAndProperties(null)
	const username = logins.getUserController().userGroupInfo.name
	const body = lang.get("invitationMailBody_msg", {
		"{registrationLink}": referralLink,
		"{username}": username,
	})
	const dialog = await newMailEditorFromTemplate(detailsProperties.mailboxDetails, {}, lang.get("invitationMailSubject_msg"), body, [], false)
	dialog.show()
}

/**
 * Create and show a new mail editor with an invite message
 * @param link: the link to the giftcard
 * @param svg: an SVGElement that is the DOM node of the rendered gift card
 * @param mailboxDetails
 * @returns {*}
 */
export async function writeGiftCardMail(link: string, svg: SVGElement, mailboxDetails?: MailboxDetail) {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
	const bodyText = lang
		.get("defaultShareGiftCardBody_msg", {
			"{link}": '<a href="' + link + '">' + link + "</a>",
			"{username}": logins.getUserController().userGroupInfo.name,
		})
		.split("\n")
		.join("<br />")
	const subject = lang.get("defaultShareGiftCardSubject_msg")
	locator
		.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties)
		.then((model) => model.initWithTemplate({}, subject, appendEmailSignature(bodyText, logins.getUserController().props), [], false))
		.then((model) => createMailEditorDialog(model, false))
		.then((dialog) => dialog.show())
}

async function getMailboxDetailsAndProperties(
	mailboxDetails: MailboxDetail | null | undefined,
): Promise<{ mailboxDetails: MailboxDetail; mailboxProperties: MailboxProperties }> {
	mailboxDetails = mailboxDetails ?? (await locator.mailModel.getUserMailboxDetails())
	const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	return { mailboxDetails, mailboxProperties }
}
