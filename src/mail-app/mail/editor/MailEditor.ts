import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Editor, ImagePasteEvent } from "../../../common/gui/editor/Editor"
import type { Attachment, InitAsResponseArgs, SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import { InfoLink, lang } from "../../../common/misc/LanguageViewModel"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { checkApprovalStatus } from "../../../common/misc/LoginUtils"
import { locator } from "../../../common/api/main/CommonLocator"
import {
	ALLOWED_IMAGE_FORMATS,
	ConversationType,
	ExternalImageRule,
	FeatureType,
	Keys,
	MailAuthenticationStatus,
	MailMethod,
} from "../../../common/api/common/TutanotaConstants"
import { TooManyRequestsError } from "../../../common/api/common/error/RestError"
import type { DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar"
import { ButtonType } from "../../../common/gui/base/Button.js"
import { attachDropdown, createDropdown, DropdownChildAttrs } from "../../../common/gui/base/Dropdown.js"
import { isApp, isBrowser, isDesktop } from "../../../common/api/common/Env"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { AnimationPromise, animations, height, opacity } from "../../../common/gui/animation/Animations"
import type { TextFieldAttrs } from "../../../common/gui/base/TextField.js"
import { Autocomplete, TextField } from "../../../common/gui/base/TextField.js"
import { chooseAndAttachFile, cleanupInlineAttachments, createAttachmentBubbleAttrs, getConfidentialStateMessage } from "./MailEditorViewModel"
import { ExpanderPanel } from "../../../common/gui/base/Expander"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { UserError } from "../../../common/api/main/UserError"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { htmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import { DropDownSelector } from "../../../common/gui/base/DropDownSelector.js"
import {
	Contact,
	ContactTypeRef,
	createTranslationGetIn,
	File as TutanotaFile,
	Mail,
	MailboxProperties,
	MailDetails,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { FileOpenError } from "../../../common/api/common/error/FileOpenError"
import type { lazy } from "@tutao/tutanota-utils"
import { assertNotNull, cleanMatch, downcast, isNotNull, noOp, ofClass, typedValues } from "@tutao/tutanota-utils"
import { createInlineImage, replaceCidsWithInlineImages, replaceInlineImagesWithCids } from "../view/MailGuiUtils"
import { client } from "../../../common/misc/ClientDetector"
import { appendEmailSignature } from "../signature/Signature"
import { showTemplatePopupInEditor } from "../../templates/view/TemplatePopup"
import { registerTemplateShortcutListener } from "../../templates/view/TemplateShortcutListener"
import { TemplatePopupModel } from "../../templates/model/TemplatePopupModel"
import { createKnowledgeBaseDialogInjection } from "../../knowledgebase/view/KnowledgeBaseDialog"
import { KnowledgeBaseModel } from "../../knowledgebase/model/KnowledgeBaseModel"
import { styles } from "../../../common/gui/styles"
import { showMinimizedMailEditor } from "../view/MinimizedMailEditorOverlay"
import { SaveErrorReason, SaveStatus, SaveStatusEnum } from "../model/MinimizedMailEditorViewModel"
import { FileReference, isTutanotaFile } from "../../../common/api/common/utils/FileUtils"
import { parseMailtoUrl } from "../../../common/misc/parsing/MailAddressParser"
import { CancelledError } from "../../../common/api/common/error/CancelledError"
import { Shortcut } from "../../../common/misc/KeyManager"
import { Recipients, RecipientType } from "../../../common/api/common/recipients/Recipient"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { MailRecipientsTextField } from "../../../common/gui/MailRecipientsTextField.js"
import { getContactDisplayName } from "../../../common/contactsFunctionality/ContactUtils.js"
import { ResolvableRecipient } from "../../../common/api/main/RecipientsModel"

import { animateToolbar, RichTextToolbar } from "../../../common/gui/base/RichTextToolbar.js"
import { readLocalFiles } from "../../../common/file/FileController"
import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton.js"
import { ToggleButton, ToggleButtonAttrs } from "../../../common/gui/base/buttons/ToggleButton.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { DialogInjectionRightAttrs } from "../../../common/gui/base/DialogInjectionRight.js"
import { KnowledgebaseDialogContentAttrs } from "../../knowledgebase/view/KnowledgeBaseDialogContent.js"
import { RecipientsSearchModel } from "../../../common/misc/RecipientsSearchModel.js"
import { createDataFile, DataFile } from "../../../common/api/common/DataFile.js"
import { AttachmentBubble } from "../../../common/gui/AttachmentBubble.js"
import { ContentBlockingStatus } from "../view/MailViewerViewModel.js"
import { canSeeTutaLinks } from "../../../common/gui/base/GuiUtils.js"
import { BannerButtonAttrs, InfoBanner } from "../../../common/gui/base/InfoBanner.js"
import { isCustomizationEnabledForCustomer } from "../../../common/api/common/utils/CustomerUtils.js"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import { TranslationService } from "../../../common/api/entities/tutanota/Services.js"
import { PasswordField } from "../../../common/misc/passwords/PasswordField.js"
import { InlineImages } from "../../../common/mailFunctionality/inlineImagesUtils.js"
import {
	checkAttachmentSize,
	conversationTypeString,
	createNewContact,
	getEnabledMailAddressesWithUser,
	getMailAddressDisplayText,
	LINE_BREAK,
	RecipientField,
} from "../../../common/mailFunctionality/SharedMailUtils.js"
import { mailLocator } from "../../mailLocator.js"

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
	alwaysBlockExternalContent: boolean
}

export function createMailEditorAttrs(
	model: SendMailModel,
	doBlockExternalContent: boolean,
	doFocusEditorOnLoad: boolean,
	dialog: lazy<Dialog>,
	templateModel: TemplatePopupModel | null,
	knowledgeBaseInjection: (editor: Editor) => Promise<DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs> | null>,
	search: RecipientsSearchModel,
	alwaysBlockExternalContent: boolean,
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
		alwaysBlockExternalContent,
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
	private blockExternalContent: boolean
	private readonly alwaysBlockExternalContent: boolean = false
	// if we're set to block external content, but there is no content to block,
	// we don't want to show the banner.
	private blockedExternalContent: number = 0

	constructor(vnode: Vnode<MailEditorAttrs>) {
		const a = vnode.attrs
		this.attrs = a
		this.inlineImageElements = []
		this.mentionedInlineImages = []
		const model = a.model
		this.sendMailModel = model
		this.templateModel = a.templateModel
		this.blockExternalContent = a.doBlockExternalContent()
		this.alwaysBlockExternalContent = a.alwaysBlockExternalContent

		// if we have any CC/BCC recipients, we should show these so, should the user send the mail, they know where it will be going to
		this.areDetailsExpanded = model.bccRecipients().length + model.ccRecipients().length > 0

		this.editor = new Editor(
			200,
			(html, isPaste) => {
				const sanitized = htmlSanitizer.sanitizeFragment(html, {
					blockExternalContent: !isPaste && this.blockExternalContent,
				})
				this.blockedExternalContent = sanitized.blockedExternalContent

				this.mentionedInlineImages = sanitized.inlineImageCids
				return sanitized.fragment
			},
			null,
		)

		const onEditorChanged = () => {
			cleanupInlineAttachments(this.editor.getDOM(), this.inlineImageElements, model.getAttachments())
			model.markAsChangedIfNecessary(true)
			m.redraw()
		}

		// call this async because the editor is not initialized before this mail editor dialog is shown
		this.editor.initialized.promise.then(() => {
			this.editor.setHTML(model.getBody())

			this.processInlineImages()

			// Add mutation observer to remove attachments when corresponding DOM element is removed
			new MutationObserver(onEditorChanged).observe(this.editor.getDOM(), {
				attributes: false,
				childList: true,
				subtree: true,
			})
			// since the editor is the source for the body text, the model won't know if the body has changed unless we tell it
			this.editor.addChangeListener(() => model.setBody(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML))
			this.editor.addEventListener("pasteImage", ({ detail }: ImagePasteEvent) => {
				const items = Array.from(detail.clipboardData.items)
				const imageItems = items.filter((item) => /image/.test(item.type))
				if (!imageItems.length) {
					return false
				}
				const file = imageItems[0]?.getAsFile()
				if (file == null) {
					return false
				}
				const reader = new FileReader()
				reader.onload = () => {
					if (reader.result == null || "string" === typeof reader.result) {
						return
					}
					const newInlineImages = [createDataFile(file.name, file.type, new Uint8Array(reader.result))]
					model.attachFiles(newInlineImages)
					this.insertInlineImages(model, newInlineImages)
				}
				reader.readAsArrayBuffer(file)
			})

			if (a.templateModel) {
				a.templateModel.init().then((templateModel) => {
					// add this event listener to handle quick selection of templates inside the editor
					registerTemplateShortcutListener(this.editor, templateModel)
				})
			}
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
				ctrlOrCmd: true,
				exec: () => this.openTemplates(),
				help: "openTemplatePopup_msg",
			}, // B (bold), I (italic), and U (underline) are handled by squire
			{
				key: Keys.B,
				ctrlOrCmd: true,
				exec: noOp,
				help: "formatTextBold_msg",
			},
			{
				key: Keys.I,
				ctrlOrCmd: true,
				exec: noOp,
				help: "formatTextItalic_msg",
			},
			{
				key: Keys.U,
				ctrlOrCmd: true,
				exec: noOp,
				help: "formatTextUnderline_msg",
			},
		]
		for (const shortcut of shortcuts) {
			dialog.addShortcut(shortcut)
		}
		this.editor.initialized.promise.then(() => {
			a.knowledgeBaseInjection(this.editor).then((injection) => {
				this.knowledgeBaseInjection = injection
				m.redraw()
			})
		})
	}

	private downloadInlineImage(model: SendMailModel, cid: string) {
		const tutanotaFiles = model.getAttachments().filter((attachment) => isTutanotaFile(attachment))
		const inlineAttachment = tutanotaFiles.find((attachment) => attachment.cid === cid)

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
			title: "confidential_action",
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
		const plaintextFormatting = locator.logins.getUserController().props.sendPlaintextOnly
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

		const attachmentBubbleAttrs = createAttachmentBubbleAttrs(model, this.inlineImageElements)

		let editCustomNotificationMailAttrs: IconButtonAttrs | null = null

		if (locator.logins.getUserController().isGlobalAdmin()) {
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
							import("../../../common/settings/EditNotificationEmailDialog.js").then(({ showAddOrEditNotificationEmailDialog }) =>
								showAddOrEditNotificationEmailDialog(locator.logins.getUserController()),
							)
						},
					},
					{
						label: "edit_action",
						click: () => {
							import("../../../common/settings/EditNotificationEmailDialog.js").then(({ showAddOrEditNotificationEmailDialog }) =>
								showAddOrEditNotificationEmailDialog(locator.logins.getUserController(), model.getSelectedNotificationLanguageCode()),
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
					".flex-start.flex-wrap.mt-s.mb-s.gap-hpad",
					attachmentBubbleAttrs.map((a) => m(AttachmentBubble, a)),
				),
				model.getAttachments().length > 0 ? m("hr.hr") : null,
				this.renderExternalContentBanner(this.attrs),
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

	private renderExternalContentBanner(attrs: MailEditorAttrs): Children | null {
		if (!this.blockExternalContent || this.alwaysBlockExternalContent || this.blockedExternalContent === 0) {
			return null
		}

		const showButton: BannerButtonAttrs = {
			label: "showBlockedContent_action",
			click: () => {
				this.updateExternalContentStatus(ContentBlockingStatus.Show)
				this.processInlineImages()
			},
		}

		return m(InfoBanner, {
			message: "contentBlocked_msg",
			icon: Icons.Picture,
			helpLink: canSeeTutaLinks(attrs.model.logins) ? InfoLink.LoadImages : null,
			buttons: [showButton],
		})
	}

	private updateExternalContentStatus(status: ContentBlockingStatus) {
		this.blockExternalContent = status === ContentBlockingStatus.Block || status === ContentBlockingStatus.AlwaysBlock

		const sanitized = htmlSanitizer.sanitizeHTML(this.editor.getHTML(), {
			blockExternalContent: this.blockExternalContent,
		})

		this.editor.setHTML(sanitized.html)
	}

	private processInlineImages() {
		this.inlineImageElements = replaceCidsWithInlineImages(this.editor.getDOM(), this.sendMailModel.loadedInlineImages, (cid, event, dom) => {
			const downloadClickHandler = createDropdown({
				lazyButtons: () => [
					{
						label: "download_action",
						click: () => this.downloadInlineImage(this.sendMailModel, cid),
					},
				],
			})
			downloadClickHandler(downcast(event), dom)
		})
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
		return await this.insertInlineImages(model, files)
	}

	private async insertInlineImages(model: SendMailModel, files: ReadonlyArray<DataFile | FileReference>): Promise<void> {
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

					return m(PasswordField, {
						oncreate: (vnode) => this.animateHeight(vnode.dom as HTMLElement, true),
						onbeforeremove: (vnode) => this.animateHeight(vnode.dom as HTMLElement, false),
						label: () => lang.get("passwordFor_label", { "{1}": recipient.address }),
						value: this.sendMailModel.getPassword(recipient.address),
						passwordStrength: this.sendMailModel.getPasswordStrength(recipient),
						status: "auto",
						autocompleteAs: Autocomplete.off,
						oninput: (val) => this.sendMailModel.setPassword(recipient.address, val),
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

	private async getRecipientClickedContextButtons(recipient: ResolvableRecipient, field: RecipientField): Promise<DropdownChildAttrs[]> {
		const { entity, contactModel } = this.sendMailModel

		const canEditBubbleRecipient = locator.logins.getUserController().isInternalUser() && !locator.logins.isEnabled(FeatureType.DisableContacts)

		const canRemoveBubble = locator.logins.getUserController().isInternalUser()

		const createdContactReceiver = (contactElementId: Id) => {
			const mailAddress = recipient.address

			contactModel.getContactListId().then((contactListId: string) => {
				if (!contactListId) return
				const id: IdTuple = [contactListId, contactElementId]
				entity.load(ContactTypeRef, id).then((contact: Contact) => {
					if (contact.mailAddresses.some((ma) => cleanMatch(ma.address, mailAddress))) {
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
						contactModel.getContactListId().then((contactListId: Id) => {
							const newContact = createNewContact(locator.logins.getUserController().user, recipient.address, recipient.name)
							import("../../contacts/ContactEditor").then(({ ContactEditor }) => {
								// external users don't see edit buttons
								new ContactEditor(entity, newContact, assertNotNull(contactListId), createdContactReceiver).show()
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
}

/**
 * Creates a new Dialog with a MailEditor inside.
 * @param model
 * @param blockExternalContent
 * @param alwaysBlockExternalContent
 * @returns {Dialog}
 * @private
 */
async function createMailEditorDialog(model: SendMailModel, blockExternalContent = false, alwaysBlockExternalContent = false): Promise<Dialog> {
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
		if (model.isSharedMailbox() && model.containsExternalRecipients() && model.isConfidential()) {
			await Dialog.message("sharedMailboxCanNotSendConfidentialExternal_msg")
			return
		}

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
		showMinimizedMailEditor(dialog, model, mailLocator.minimizedMailModel, locator.eventController, dispose, saveStatus)
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
		locator.logins.isInternalUserLoggedIn() && client.isDesktopDevice()
			? new TemplatePopupModel(locator.eventController, locator.logins, locator.entityClient)
			: null

	const createKnowledgebaseButtonAttrs = async (editor: Editor) => {
		if (locator.logins.isInternalUserLoggedIn()) {
			const customer = await locator.logins.getUserController().loadCustomer()
			// only create knowledgebase button for internal users with valid template group and enabled KnowledgebaseFeature
			if (
				styles.isDesktopLayout() &&
				templatePopupModel &&
				locator.logins.getUserController().getTemplateMemberships().length > 0 &&
				isCustomizationEnabledForCustomer(customer, FeatureType.KnowledgeBase)
			) {
				const knowledgebaseModel = new KnowledgeBaseModel(locator.eventController, locator.entityClient, locator.logins.getUserController())
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
		alwaysBlockExternalContent,
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
			ctrlOrCmd: true,
			exec: () => {
				save().catch(ofClass(UserError, showUserError))
			},
			help: "save_action",
		},
		{
			key: Keys.S,
			ctrlOrCmd: true,
			shift: true,
			exec: () => {
				send()
			},
			help: "send_action",
		},
		{
			key: Keys.RETURN,
			ctrlOrCmd: true,
			exec: () => {
				send()
			},
			help: "send_action",
		},
	]
	dialog = Dialog.editDialog(headerBarAttrs, MailEditor, mailEditorAttrs)
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
	await checkApprovalStatus(locator.logins, false)
	const { appendEmailSignature } = await import("../signature/Signature")
	const signature = appendEmailSignature("", locator.logins.getUserController().props)
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
	return newMailEditorFromTemplate(detailsProperties.mailboxDetails, {}, "", signature)
}

async function getExternalContentRulesForEditor(model: SendMailModel, currentStatus: boolean) {
	let contentRules
	const previousMail = model.getPreviousMail()

	if (!previousMail) {
		contentRules = {
			alwaysBlockExternalContent: false,
			// external content in a mail for which we don't have a
			// previous mail must have been put there by us.
			blockExternalContent: false,
		}
	} else {
		const externalImageRule = await locator.configFacade.getExternalImageRule(previousMail.sender.address).catch((e: unknown) => {
			console.log("Error getting external image rule:", e)
			return ExternalImageRule.None
		})

		let isAuthenticatedMail
		if (previousMail.authStatus !== null) {
			isAuthenticatedMail = previousMail.authStatus === MailAuthenticationStatus.AUTHENTICATED
		} else {
			const mailDetails = await locator.mailFacade.loadMailDetailsBlob(previousMail)
			isAuthenticatedMail = mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED
		}

		if (externalImageRule === ExternalImageRule.Block || (externalImageRule === ExternalImageRule.None && model.isUserPreviousSender())) {
			contentRules = {
				// When we have an explicit rule for blocking images we don´t
				// want to prompt the user about showing images again
				alwaysBlockExternalContent: externalImageRule === ExternalImageRule.Block,
				blockExternalContent: true,
			}
		} else if (externalImageRule === ExternalImageRule.Allow && isAuthenticatedMail) {
			contentRules = {
				alwaysBlockExternalContent: false,
				blockExternalContent: false,
			}
		} else {
			contentRules = {
				alwaysBlockExternalContent: false,
				blockExternalContent: currentStatus,
			}
		}
	}

	return contentRules
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

	const externalImageRules = await getExternalContentRulesForEditor(model, blockExternalContent)
	return createMailEditorDialog(model, externalImageRules?.blockExternalContent, externalImageRules?.alwaysBlockExternalContent)
}

export async function newMailEditorFromDraft(
	mail: Mail,
	mailDetails: MailDetails,
	attachments: TutanotaFile[],
	inlineImages: InlineImages,
	blockExternalContent: boolean,
	mailboxDetails?: MailboxDetail,
): Promise<Dialog> {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails)
	const model = await locator.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties)
	await model.initWithDraft(mail, mailDetails, attachments, inlineImages)
	const externalImageRules = await getExternalContentRulesForEditor(model, blockExternalContent)
	return createMailEditorDialog(model, externalImageRules?.blockExternalContent, externalImageRules?.alwaysBlockExternalContent)
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
		appendEmailSignature(mailTo.body || "", locator.logins.getUserController().props),
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
	const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	return locator
		.sendMailModel(mailboxDetails, mailboxProperties)
		.then((model) => model.initWithTemplate(recipients, subject, bodyText, attachments, confidential, senderMailAddress, initialChangedState))
		.then((model) => createMailEditorDialog(model))
}

export function getSupportMailSignature(): Promise<string> {
	return import("../../../common/calendar/date/CalendarUtils").then(({ getTimeZone }) => {
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
 * @returns true if sending support email is allowed, false if upgrade to premium is required (may have been ordered)
 */
export async function writeSupportMail(subject: string = "", mailboxDetails?: MailboxDetail): Promise<boolean> {
	if (locator.logins.getUserController().isPremiumAccount()) {
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
		return true
	} else {
		return import("../../../common/subscription/PriceUtils")
			.then(({ formatPrice }) => {
				const message = lang.get("premiumOffer_msg", {
					"{1}": formatPrice(1, true),
				})
				const title = lang.get("upgradeReminderTitle_msg")
				return Dialog.reminder(title, message)
			})
			.then((confirm) => {
				if (confirm) {
					import("../../../common/subscription/UpgradeSubscriptionWizard").then((utils) => utils.showUpgradeWizard(locator.logins))
				}
			})
			.then(() => false)
	}
}

/**
 * Create and show a new mail editor with an invite message
 * @param referralLink
 * @returns {*}
 */
export async function writeInviteMail(referralLink: string) {
	const detailsProperties = await getMailboxDetailsAndProperties(null)
	const username = locator.logins.getUserController().userGroupInfo.name
	const body = lang.get("invitationMailBody_msg", {
		"{registrationLink}": referralLink,
		"{username}": username,
	})
	const { invitationSubject } = await locator.serviceExecutor.get(TranslationService, createTranslationGetIn({ lang: lang.code }))
	const dialog = await newMailEditorFromTemplate(detailsProperties.mailboxDetails, {}, invitationSubject, body, [], false)
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
			"{username}": locator.logins.getUserController().userGroupInfo.name,
		})
		.split("\n")
		.join("<br />")
	const { giftCardSubject } = await locator.serviceExecutor.get(TranslationService, createTranslationGetIn({ lang: lang.code }))
	locator
		.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties)
		.then((model) => model.initWithTemplate({}, giftCardSubject, appendEmailSignature(bodyText, locator.logins.getUserController().props), [], false))
		.then((model) => createMailEditorDialog(model, false))
		.then((dialog) => dialog.show())
}

async function getMailboxDetailsAndProperties(
	mailboxDetails: MailboxDetail | null | undefined,
): Promise<{ mailboxDetails: MailboxDetail; mailboxProperties: MailboxProperties }> {
	mailboxDetails = mailboxDetails ?? (await locator.mailboxModel.getUserMailboxDetails())
	const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	return { mailboxDetails, mailboxProperties }
}
