// @flow
import m from "mithril"
import {Dialog, DialogType} from "../../gui/base/Dialog"
import {Button} from "../../gui/base/Button"
import {Type} from "../../gui/base/TextField"
import {lang} from "../../misc/LanguageViewModel"
import {formatStorageSize, getCleanedMailAddress} from "../../misc/Formatter"
import {ConversationType, InputFieldType, Keys, MailMethod, MAX_ATTACHMENT_SIZE, PushServiceType} from "../../api/common/TutanotaConstants"
import {animations, height} from "../../gui/animation/Animations"
import {assertMainOrNode} from "../../api/common/Env"
import {fileController} from "../../file/FileController"
import {remove} from "../../api/common/utils/ArrayUtils"
import {windowFacade} from "../../misc/WindowFacade"
import {worker} from "../../api/main/WorkerClient"
import {progressIcon} from "../../gui/base/Icon"
import {createRecipientInfo, resolveRecipientInfo} from "../../mail/model/MailUtils"
import {AccessDeactivatedError} from "../../api/common/error/RestError"
import {downcast, neverNull} from "../../api/common/utils/Utils"
import {client} from "../../misc/ClientDetector"
import {createPushIdentifier, PushIdentifierTypeRef} from "../../api/entities/sys/PushIdentifier"
import {HttpMethod as HttpMethodEnum} from "../../api/common/EntityFunctions"
import {logins} from "../../api/main/LoginController"
import {PasswordForm} from "../../settings/PasswordForm"
import {HtmlEditor} from "../../gui/editor/HtmlEditor"
import {Icons} from "../../gui/base/icons/Icons"
import {getDefaultContactFormLanguage} from "../../contacts/ContactFormUtils"
import stream from "mithril/stream/stream.js"
import {CheckboxN} from "../../gui/base/CheckboxN"
import {getPrivacyStatementLink} from "../LoginView"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {File as TutanotaFile} from "../../api/entities/tutanota/File"
import type {ContactForm} from "../../api/entities/tutanota/ContactForm"
import {locator} from "../../api/main/MainLocator"
import {createDropDownButton} from "../../gui/base/Dropdown";
import {TextFieldN} from "../../gui/base/TextFieldN"
import {showProgressDialog} from "../../gui/ProgressDialog"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import type {InputField} from "../../api/entities/tutanota/InputField"

assertMainOrNode()

export class ContactFormRequestDialog {
	_subject: string
	_dialog: Dialog;
	_editor: HtmlEditor;
	view: Function;
	_attachments: Array<TutanotaFile | DataFile | FileReference>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_attachmentButtons: Button[]; // these map 1:1 to the _attachments
	_loadingAttachments: boolean;
	_contactForm: ContactForm;
	_domElement: HTMLElement;
	_statisticFields: Map<string, string>
	_notificationEmailAddress: string;
	_passwordForm: PasswordForm;
	_privacyPolicyAccepted: Stream<boolean>;

	/**
	 * Creates a new draft message. Invoke initAsResponse or initFromDraft if this message should be a response
	 * to an existing message or edit an existing draft.
	 *
	 */
	constructor(contactForm: ContactForm) {
		this._contactForm = contactForm
		this._attachments = []
		this._attachmentButtons = []
		this._loadingAttachments = false
		this._statisticFields = new Map()

		this._passwordForm = new PasswordForm(false, false, true, "contactFormEnterPasswordInfo_msg")

		this._privacyPolicyAccepted = stream(false)

		this._editor = new HtmlEditor().showBorders().setPlaceholderId("contactFormPlaceholder_label").setMinHeight(200)

		let headerBarAttrs: DialogHeaderBarAttrs = {
			left: [{label: "cancel_action", click: () => this._close(), type: ButtonType.Secondary}],
			right: [{label: "send_action", click: () => this.send(), type: ButtonType.Primary}],
			middle: () => lang.get("createContactRequest_action")
		}

		this._dialog = Dialog.largeDialog(headerBarAttrs, this)
		                     .addShortcut({
			                     key: Keys.ESC,
			                     exec: () => this._close(),
			                     help: "close_alt"
		                     })
		                     .addShortcut({
			                     key: Keys.S,
			                     ctrl: true,
			                     shift: true,
			                     exec: () => {
				                     this.send()
			                     },
			                     help: "send_action"
		                     }).setCloseHandler(() => this._close())

		worker.createContactFormUserGroupData()
	}

	view: Function = () => {
		const statisticFields = getDefaultContactFormLanguage(this._contactForm.languages).statisticsFields

		const attachFilesButton = m(ButtonN, {
			label: "attachFiles_action",
			click: () => {this._showFileChooserForAttachments()},
			icon: () => Icons.Attachment
		})

		const subject = m(TextFieldN, {
			label: "subject_label",
			value: stream(this._subject || ""),
			helpLabel: this.getConfidentialStateMessage,
			injectionsRight: () => [attachFilesButton],
			oninput: (value) => this._subject = value.trim()
		})

		const notificationEmailAddress = m(TextFieldN, {
			label: "mailAddress_label",
			value: stream(this._notificationEmailAddress || ""),
			helpLabel: () => lang.get("contactFormMailAddressInfo_msg"),
			oninput: (value) => {
				this._notificationEmailAddress = value.trim()
			},
			type: Type.Area
		})

		const statisticFieldHeader = m(TextFieldN, {
			label: () => '',
			value: stream(lang.get("optionalValues_label")),
			helpLabel: () => lang.get("contactFormStatisticFieldsInfo_msg"),
			disabled: true
		})

		let windowCloseUnsubscribe = () => {}
		return m("#mail-editor.text.pb", {
			oncreate: vnode => {
				this._domElement = vnode.dom
				windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {})
			},
			onremove: vnode => windowCloseUnsubscribe(),
			ondragover: (ev) => {
				// do not check the datatransfer here because it is not always filled, e.g. in Safari
				ev.stopPropagation()
				ev.preventDefault()
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
			m(".row", subject),
			m(".flex-start.flex-wrap.ml-negative-bubble"
				+ (this._attachmentButtons.length > 0 ? ".pt" : ""),
				(!this._loadingAttachments) ? this._attachmentButtons.map(b => m(b)) : [
					m(".flex-v-center", progressIcon()),
					m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))
				]),
			this._attachmentButtons.length > 0 ? m("hr") : null,
			m(this._passwordForm),
			m(".pt-l.text", m(this._editor)),
			notificationEmailAddress,
			statisticFields.length > 0 ? statisticFieldHeader : null,
			statisticFields.map((field) => this._renderStatisticsField(field)),
			(getPrivacyStatementLink()) ? m(CheckboxN, {
				label: () => this._getPrivacyPolicyCheckboxContent(),
				checked: this._privacyPolicyAccepted
			}) : null
		])
	}

	_getPrivacyPolicyCheckboxContent(): VirtualElement {
		let parts = lang.get("acceptPrivacyPolicy_msg").split("{privacyPolicy}")
		return m("", [
			m("span", parts[0]),
			m("span", m(`a[href=${neverNull(getPrivacyStatementLink())}][target=_blank]`, lang.get("privacyLink_label"))),
			m("span", parts[1]),
		])
	}

	_renderStatisticsField(field: InputField): Child {
		if (field.type === InputFieldType.ENUM) {
			let items = field.enumValues.map(t => {
				return {name: t.name, value: t.name}
			})
			items.splice(0, 0, {name: "", value: null})
			return m(DropDownSelectorN, {
				label: () => field.name,
				items: items,
				selectedValue: stream(this._statisticFields.get(field.name) || ""),
				selectionChangedHandler: (value) => this._statisticFields.set(field.name, value || ""),
				dropdownWidth: 250,
			})
		} else {
			return m(TextFieldN, {
				label: () => field.name,
				value: stream(this._statisticFields.get(field.name) || ""),
				oninput: (value) => this._statisticFields.set(field.name, value)
			})
		}
	}

	_conversationTypeToTitleTextId(): string {
		return "newMail_action"
	}

	animate(domElement: HTMLElement, fadein: boolean): Promise<void> {
		let childHeight = domElement.offsetHeight
		return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
		                 .then(() => {
			                 domElement.style.height = ''
		                 })
	}

	show() {
		this._dialog.show()
	}

	_close() {
		this._dialog.close()
	}

	_showFileChooserForAttachments(): Promise<void> {
		return fileController.showFileChooser(true).then(files => {
			this._attachFiles((files: any))
			m.redraw()
		})
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
	}

	_updateAttachmentButtons() {
		this._attachmentButtons = this._attachments.map(file => {
			let lazyButtons: Button[] = []
			lazyButtons.push(new Button("download_action", () => {
				if (file._type === "DataFile") {
					fileController.open(downcast(file))
				} else {
					fileController.downloadAndOpen(((file: any): TutanotaFile), true)
				}
			}, null).setType(ButtonType.Secondary))
			lazyButtons.push(new Button("remove_action", () => {
				remove(this._attachments, file)
				this._updateAttachmentButtons()
				m.redraw()
			}, null).setType(ButtonType.Secondary))

			return createDropDownButton(() => file.name, () => Icons.Attachment, () => lazyButtons)
				.setType(ButtonType.Bubble)
				.setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
		})
	}


	getConfidentialStateMessage(): string {
		return lang.get('confidentialStatus_msg')
	}

	send() {
		const passwordErrorId = this._passwordForm.getErrorMessageId()
		if (passwordErrorId) {
			Dialog.error(passwordErrorId)
			return
		}
		if (getPrivacyStatementLink() && !this._privacyPolicyAccepted()) {
			Dialog.error("acceptPrivacyPolicyReminder_msg")
			return
		}
		let passwordCheck = Promise.resolve(true)
		if (this._passwordForm.isPasswordUnsecure()) {
			passwordCheck = Dialog.confirm("contactFormPasswordNotSecure_msg")
		}
		passwordCheck.then(ok => {
			if (ok) {

				const cleanedNotificationMailAddress = getCleanedMailAddress(this._notificationEmailAddress);
				if (this._notificationEmailAddress !== "" && !cleanedNotificationMailAddress) {
					return Dialog.error("mailAddressInvalid_msg")
				}
				const password = this._passwordForm.getNewPassword()

				let statisticsFields: Array<{name: string, value: string}> = []
				for (const [name, value] of this._statisticFields.entries()) {
					if (value) {
						statisticsFields.push({name, value})
					}
				}

				const sendRequest = worker.createContactFormUser(password, this._contactForm._id, statisticsFields)
				                          .then(contactFormResult => {
						                          let userEmailAddress = contactFormResult.responseMailAddress
						                          return logins.createSession(userEmailAddress, password, client.getIdentifier(), false, false)
						                                       .then(() => {
								                                       let p = Promise.resolve()
								                                       if (cleanedNotificationMailAddress) {
									                                       let pushIdentifier = createPushIdentifier()
									                                       pushIdentifier.displayName = client.getIdentifier()
									                                       pushIdentifier.identifier = neverNull(cleanedNotificationMailAddress)
									                                       pushIdentifier.language = lang.code
									                                       pushIdentifier.pushServiceType = PushServiceType.EMAIL
									                                       pushIdentifier._ownerGroup = logins.getUserController().userGroupInfo.group
									                                       pushIdentifier._owner = logins.getUserController().userGroupInfo.group // legacy
									                                       pushIdentifier._area = "0" // legacy
									                                       p = worker.entityRequest(PushIdentifierTypeRef,
										                                       HttpMethodEnum.POST,
										                                       neverNull(logins.getUserController().user.pushIdentifierList).list,
										                                       null, pushIdentifier);
								                                       }

								                                       let recipientInfo =
									                                       createRecipientInfo(contactFormResult.requestMailAddress, "", null)

								                                       return p.then(() => resolveRecipientInfo(locator.mailModel, recipientInfo)
									                                       .then(r => {
										                                       let recipientInfos = [r]
										                                       return worker.createMailDraft(this._subject,
											                                       this._editor.getValue(), userEmailAddress, "",
											                                       recipientInfos, [], [], ConversationType.NEW,
											                                       null, this._attachments, true, [], MailMethod.NONE
										                                       )
										                                                    .then(draft => {
											                                                    return worker.sendMailDraft(draft, recipientInfos, lang.code)
										                                                    })
									                                       })
									                                       .finally(e => {
										                                       return logins.logout(false)
									                                       })
								                                       )
							                                       }
						                                       )
						                                       .then(() => {
							                                       return {userEmailAddress}
						                                       })
					                          }
				                          )

				return showProgressDialog("sending_msg", sendRequest)
					.then(result => {return showConfirmDialog(result.userEmailAddress)})
					.then(() => this._close())
					.catch(AccessDeactivatedError, e => Dialog.error("contactFormSubmitError_msg"))
			}
		})
	}
}

function showConfirmDialog(userEmailAddress: string): Promise<void> {
	return Promise.fromCallback(cb => {
		// This old button has type login. New buttons with this type have rounded corner but this one should probably not have because
		// it fills the dialog in the bottom (unless we want dialogs to have rounded corners in the future.
		// Anyway, if you decide to replace it, take care of it.
		const confirm = new Button("contactFormSubmitConfirm_action", () => {
			dialog.close()
			cb()
		}).setType(ButtonType.Login)
		const requestId = m(TextFieldN, {
			label: "mailAddress_label",
			value: stream(userEmailAddress),
			disabled: true
		})
		const dialog = new Dialog(DialogType.EditMedium, {
			view: () => m("", [
				m(".dialog-header.plr-l.flex.justify-center.items-center.b", lang.get("loginCredentials_label")),
				m(".plr-l.pb.text-break", m(".pt", lang.get("contactFormSubmitConfirm_msg")), requestId),
				m(confirm)
			])
		}).setCloseHandler(() => {
			// Prevent user from closing accidentally
		}).show()
	})
}
