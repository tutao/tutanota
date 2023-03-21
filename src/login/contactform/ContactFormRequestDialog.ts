import m, { Children } from "mithril"
import { Dialog, DialogType } from "../../gui/base/Dialog"
import { Autocomplete, TextField, TextFieldType } from "../../gui/base/TextField.js"
import { lang } from "../../misc/LanguageViewModel"
import { formatStorageSize } from "../../misc/Formatter"
import { ConversationType, Keys, MailMethod, MAX_ATTACHMENT_SIZE, PushServiceType } from "../../api/common/TutanotaConstants"
import { animations, height } from "../../gui/animation/Animations"
import { downcast, neverNull, noOp, ofClass, remove } from "@tutao/tutanota-utils"
import { windowFacade } from "../../misc/WindowFacade"
import { progressIcon } from "../../gui/base/Icon"
import { AccessDeactivatedError } from "../../api/common/error/RestError"
import { client } from "../../misc/ClientDetector"
import { createPushIdentifier } from "../../api/entities/sys/TypeRefs.js"
import { PasswordForm, PasswordModel } from "../../settings/PasswordForm"
import { HtmlEditor } from "../../gui/editor/HtmlEditor"
import { Icons } from "../../gui/base/icons/Icons"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Checkbox } from "../../gui/base/Checkbox.js"
import { getPrivacyStatementLink } from "../LoginView"
import type { DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar"
import { Button, ButtonAttrs, ButtonType } from "../../gui/base/Button.js"
import type { ContactForm, File as TutanotaFile } from "../../api/entities/tutanota/TypeRefs.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { checkAttachmentSize } from "../../mail/model/MailUtils"
import { locator } from "../../api/main/MainLocator"
import { assertMainOrNode } from "../../api/common/Env"
import { DataFile } from "../../api/common/DataFile"
import { FileReference } from "../../api/common/utils/FileUtils"
import { SessionType } from "../../api/common/SessionType.js"
import { RecipientType } from "../../api/common/recipients/Recipient"
import { createDropdown } from "../../gui/base/Dropdown.js"
import { readLocalFiles, showFileChooser } from "../../file/FileController.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

assertMainOrNode()

export class ContactFormRequestDialog {
	_subject: string
	_dialog: Dialog
	_editor: HtmlEditor
	_attachments: Array<TutanotaFile | DataFile | FileReference> // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons

	_attachmentButtonAttrs: Array<ButtonAttrs> = [] // these map 1:1 to the _attachments

	_loadingAttachments: boolean
	_contactForm: ContactForm
	_notificationEmailAddress: string
	private passwordModel = new PasswordModel(locator.logins, { checkOldPassword: false, enforceStrength: false })
	_privacyPolicyAccepted: Stream<boolean>
	_windowCloseUnsubscribe: () => void

	/**
	 * Creates a new draft message. Invoke initAsResponse or initFromDraft if this message should be a response
	 * to an existing message or edit an existing draft.
	 */
	constructor(contactForm: ContactForm) {
		this._contactForm = contactForm
		this._attachments = []
		this._loadingAttachments = false
		this._subject = ""
		this._notificationEmailAddress = ""
		this._windowCloseUnsubscribe = noOp
		this._privacyPolicyAccepted = stream<boolean>(false)
		this._editor = new HtmlEditor().showBorders().setPlaceholderId("contactFormPlaceholder_label").setMinHeight(200)
		let headerBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					label: "cancel_action",
					click: () => this._close(),
					type: ButtonType.Secondary,
				},
			],
			right: [
				{
					label: "send_action",
					click: () => this.send(),
					type: ButtonType.Primary,
				},
			],
			middle: () => lang.get("createContactRequest_action"),
		}

		this.view = this.view.bind(this)

		this._dialog = Dialog.largeDialog(headerBarAttrs, this)
			.addShortcut({
				key: Keys.ESC,
				exec: () => this._close(),
				help: "close_alt",
			})
			.addShortcut({
				key: Keys.S,
				ctrl: true,
				shift: true,
				exec: () => {
					this.send()
				},
				help: "send_action",
			})
			.setCloseHandler(() => this._close())
		locator.customerFacade.createContactFormUserGroupData()
	}

	view(): Children {
		const subject = m(TextField, {
			label: "subject_label",
			value: this._subject,
			helpLabel: this.getConfidentialStateMessage,
			injectionsRight: () =>
				m(IconButton, {
					title: "attachFiles_action",
					click: () => this._showFileChooserForAttachments(),
					icon: Icons.Attachment,
					size: ButtonSize.Compact,
				}),
			oninput: (value) => (this._subject = value),
		})
		const notificationEmailAddress = m(TextField, {
			label: "mailAddress_label",
			value: this._notificationEmailAddress,
			autocompleteAs: Autocomplete.email,
			helpLabel: () => lang.get("contactFormMailAddressInfo_msg"),
			oninput: (value) => (this._notificationEmailAddress = value.trim()),
			type: TextFieldType.Area,
		})
		return m(
			"#mail-editor.text.pb",
			{
				oncreate: (vnode) => {
					this._windowCloseUnsubscribe = windowFacade.addWindowCloseListener(noOp)
				},
				onremove: (vnode) => this._windowCloseUnsubscribe(),
				ondragover: (ev: DragEvent) => {
					// do not check the datatransfer here because it is not always filled, e.g. in Safari
					ev.stopPropagation()
					ev.preventDefault()
				},
				ondrop: (ev: DragEvent) => {
					if (ev.dataTransfer?.files && ev.dataTransfer.files.length > 0) {
						readLocalFiles(ev.dataTransfer.files)
							.then((dataFiles) => {
								this._attachFiles(dataFiles as any)

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
				m(".row", subject),
				m(
					".flex-start.flex-wrap.column-gap" + (this._attachmentButtonAttrs.length > 0 ? ".pt" : ""),
					!this._loadingAttachments
						? this._attachmentButtonAttrs.map((attrs) => m(Button, attrs))
						: [m(".flex-v-center", progressIcon()), m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))],
				),
				this._attachmentButtonAttrs.length > 0 ? m("hr.hr") : null,
				m(PasswordForm, {
					model: this.passwordModel,
					passwordInfoKey: "contactFormEnterPasswordInfo_msg",
				}),
				m(".pt-l.text", m(this._editor)),
				notificationEmailAddress,
				getPrivacyStatementLink()
					? m(Checkbox, {
							label: () => this._getPrivacyPolicyCheckboxContent(),
							checked: this._privacyPolicyAccepted(),
							onChecked: this._privacyPolicyAccepted,
					  })
					: null,
			],
		)
	}

	_getPrivacyPolicyCheckboxContent(): Children {
		let parts = lang.get("acceptPrivacyPolicy_msg").split("{privacyPolicy}")
		return m("", [
			m("span", parts[0]),
			m("span", m(`a[href=${neverNull(getPrivacyStatementLink())}][target=_blank]`, lang.get("privacyLink_label"))),
			m("span", parts[1]),
		])
	}

	animate(domElement: HTMLElement, fadein: boolean): Promise<void> {
		let childHeight = domElement.offsetHeight
		return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0)).then(() => {
			domElement.style.height = ""
		})
	}

	show() {
		this._dialog.show()
	}

	_close() {
		this._dialog.close()
	}

	_showFileChooserForAttachments(): Promise<void> {
		return showFileChooser(true).then((files) => {
			this._attachFiles(files as any)

			m.redraw()
		})
	}

	_attachFiles(files: Array<TutanotaFile | DataFile | FileReference>) {
		let sizeLeft = MAX_ATTACHMENT_SIZE - this._attachments.reduce((total, file) => total + Number(file.size), 0)

		const sizeCheckResult = checkAttachmentSize(files, sizeLeft)

		this._attachments.push(...sizeCheckResult.attachableFiles)

		this._updateAttachmentButtons()

		if (sizeCheckResult.tooBigFiles.length > 0) {
			Dialog.message(
				() => lang.get("tooBigAttachment_msg"),
				() => sizeCheckResult.tooBigFiles.map((file) => m(".text-break.selectable", file)),
			)
		}
	}

	_updateAttachmentButtons() {
		this._attachmentButtonAttrs = this._attachments.map((file) => {
			return {
				label: () => file.name,
				icon: () => Icons.Attachment,
				type: ButtonType.Bubble,
				staticRightText: "(" + formatStorageSize(Number(file.size)) + ")",
				click: createDropdown({
					lazyButtons: () => [
						{
							label: "download_action",
							click: () => {
								if (file._type === "DataFile") {
									locator.fileController.saveDataFile(downcast(file))
								} else {
									locator.fileController.open(file as TutanotaFile)
								}
							},
							type: ButtonType.Secondary,
						},
						{
							label: "remove_action",
							click: () => {
								remove(this._attachments, file)

								this._updateAttachmentButtons()

								m.redraw()
							},
							type: ButtonType.Secondary,
						},
					],
				}),
			}
		})
	}

	getConfidentialStateMessage(): string {
		return lang.get("confidentialStatus_msg")
	}

	async send(): Promise<void> {
		const { mailFacade, customerFacade } = locator

		const passwordErrorId = this.passwordModel.getErrorMessageId()

		if (passwordErrorId) {
			Dialog.message(passwordErrorId)
			return
		}

		if (getPrivacyStatementLink() && !this._privacyPolicyAccepted()) {
			Dialog.message("acceptPrivacyPolicyReminder_msg")
			return
		}

		const passwordOk = !this.passwordModel.isPasswordInsecure() || (await Dialog.confirm("contactFormPasswordNotSecure_msg"))

		if (passwordOk) {
			const cleanedNotificationMailAddress = getCleanedMailAddress(this._notificationEmailAddress)

			if (this._notificationEmailAddress !== "" && !cleanedNotificationMailAddress) {
				return Dialog.message("mailAddressInvalid_msg")
			}

			const password = this.passwordModel.getNewPassword()

			const doSend = async () => {
				const operation = locator.operationProgressTracker.startNewOperation()
				const contactFormResult = await customerFacade
					.createContactFormUser(password, this._contactForm._id, operation.id)
					.finally(() => operation.done())
				const userEmailAddress = contactFormResult.responseMailAddress
				await locator.logins.createSession(userEmailAddress, password, SessionType.Temporary, null)

				try {
					if (cleanedNotificationMailAddress) {
						let pushIdentifier = createPushIdentifier({
							displayName: client.getIdentifier(),
							identifier: cleanedNotificationMailAddress,
							language: lang.code,
							pushServiceType: PushServiceType.EMAIL,
							_ownerGroup: locator.logins.getUserController().userGroupInfo.group,
							_owner: locator.logins.getUserController().userGroupInfo.group,
							// legacy
							_area: "0", // legacy
						})
						await locator.entityClient.setup(neverNull(locator.logins.getUserController().user.pushIdentifierList).list, pushIdentifier)
					}

					const name = ""
					const mailAddress = contactFormResult.requestMailAddress
					const draft = await mailFacade.createDraft({
						subject: this._subject,
						bodyText: this._editor.getValue(),
						senderMailAddress: userEmailAddress,
						senderName: "",
						toRecipients: [{ name, address: mailAddress }],
						ccRecipients: [],
						bccRecipients: [],
						conversationType: ConversationType.NEW,
						previousMessageId: null,
						attachments: this._attachments,
						confidential: true,
						replyTos: [],
						method: MailMethod.NONE,
					})
					await mailFacade.sendDraft(draft, [{ name, address: mailAddress, type: RecipientType.INTERNAL, contact: null }], lang.code)
				} finally {
					await locator.logins.logout(false)
				}

				return {
					userEmailAddress,
				}
			}

			return showProgressDialog("sending_msg", doSend())
				.then((result) => {
					return showConfirmDialog(result.userEmailAddress)
				})
				.then(() => this._close())
				.catch(ofClass(AccessDeactivatedError, (e) => Dialog.message("contactFormSubmitError_msg")))
		}
	}
}

function showConfirmDialog(userEmailAddress: string): Promise<void> {
	return new Promise((resolve) => {
		const dialog = new Dialog(DialogType.EditMedium, {
			view: () =>
				m("", [
					m(".dialog-header.plr-l.flex.justify-center.items-center.b", lang.get("loginCredentials_label")),
					m(
						".plr-l.pb.text-break",
						m(".pt", lang.get("contactFormSubmitConfirm_msg")),
						m(TextField, {
							label: "mailAddress_label",
							value: userEmailAddress,
							disabled: true,
						}),
					),
					m(
						".mb-s.mlr.flex.child-grow",
						m(Button, {
							label: "contactFormSubmitConfirm_action",
							click: () => {
								dialog.close()
								resolve()
							},
							type: ButtonType.Login,
						}),
					),
				]),
		})
			.setCloseHandler(() => {
				// Prevent user from closing accidentally
			})
			.show()
	})
}
