// @flow
import m from "mithril"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {Button, createDropDownButton} from "../gui/base/Button"
import {TextField, Type} from "../gui/base/TextField"
import {lang} from "../misc/LanguageViewModel"
import {formatStorageSize, getCleanedMailAddress} from "../misc/Formatter"
import {ConversationType, InputFieldType, Keys, MAX_ATTACHMENT_SIZE, PushServiceType} from "../api/common/TutanotaConstants"
import {animations, height} from "../gui/animation/Animations"
import {assertMainOrNode} from "../api/Env"
import {fileController} from "../file/FileController"
import {mapAndFilterNull, remove} from "../api/common/utils/ArrayUtils"
import {windowFacade} from "../misc/WindowFacade"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {worker} from "../api/main/WorkerClient"
import {progressIcon} from "../gui/base/Icon"
import {createRecipientInfo, resolveRecipientInfo} from "../mail/MailUtils"
import {AccessDeactivatedError} from "../api/common/error/RestError"
import {neverNull} from "../api/common/utils/Utils"
import {client} from "../misc/ClientDetector"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {HttpMethod as HttpMethodEnum} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {PasswordForm} from "../settings/PasswordForm"
import {HtmlEditor} from "../gui/base/HtmlEditor"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {Icons} from "../gui/base/icons/Icons"
import {getDefaultContactFormLanguage} from "../contacts/ContactFormUtils"
import stream from "mithril/stream/stream.js"
import {CheckboxN} from "../gui/base/CheckboxN"
import {getPrivacyStatementLink} from "./LoginView"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {ButtonType} from "../gui/base/ButtonN"

assertMainOrNode()

export class ContactFormRequestDialog {
	_dialog: Dialog;
	_subject: TextField;
	_editor: HtmlEditor;
	view: Function;
	_attachments: Array<TutanotaFile | DataFile | FileReference>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_attachmentButtons: Button[]; // these map 1:1 to the _attachments
	_attachFilesButton: Button;
	_loadingAttachments: boolean;
	_contactForm: ContactForm;
	_domElement: HTMLElement;
	_statisticFields: Array<{component: Component, name: string, value: lazy<?string>}>;
	_notificationEmailAddress: TextField;
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
		this._subject = new TextField("subject_label", () => this.getConfidentialStateMessage())
		this._attachFilesButton = new Button('attachFiles_action', () => this._showFileChooserForAttachments(), () => Icons.Attachment)
		this._subject._injectionsRight = () => {
			return [m(this._attachFilesButton)]
		}

		this._statisticFields = this._createStatisticFields(contactForm)
		this._notificationEmailAddress = new TextField("mailAddress_label", () => lang.get("contactFormMailAddressInfo_msg")).setType(Type.Area);
		this._passwordForm = new PasswordForm(false, false, true, "contactFormEnterPasswordInfo_msg")
		this._privacyPolicyAccepted = stream(false)

		let headerBarAttrs: DialogHeaderBarAttrs = {
			left: [{label: "cancel_action", click: () => this._close(), type: ButtonType.Secondary}],
			right: [{label: "send_action", click: () => this.send(), type: ButtonType.Primary}],
			middle: () => lang.get("createContactRequest_action")
		}

		this._editor = new HtmlEditor().showBorders().setPlaceholderId("contactFormPlaceholder_label").setMinHeight(200)

		let statisticFieldHeader = new TextField(() => "", () => lang.get("contactFormStatisticFieldsInfo_msg"))
			.setDisabled()
			.setValue(lang.get("optionalValues_label"))

		worker.createContactFormUserGroupData()
		let windowCloseUnsubscribe
		this.view = () => {
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
				m(".row", m(this._subject)),
				m(".flex-start.flex-wrap.ml-negative-bubble"
					+ (this._attachmentButtons.length > 0 ? ".pt" : ""),
					(!this._loadingAttachments) ? this._attachmentButtons.map(b => m(b)) : [
						m(".flex-v-center", progressIcon()),
						m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))
					]),
				this._attachmentButtons.length > 0 ? m("hr") : null,
				m(this._passwordForm),
				m(".pt-l.text", m(this._editor)),
				m(this._notificationEmailAddress),
				this._statisticFields.length > 0 ? m(statisticFieldHeader) : null,
				this._statisticFields.map(field => m(field.component)),
				(getPrivacyStatementLink()) ? m(CheckboxN, {
					label: () => this._getPrivacyPolicyCheckboxContent(),
					checked: this._privacyPolicyAccepted
				}) : null
			])
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
	}

	_getPrivacyPolicyCheckboxContent(): VirtualElement {
		let parts = lang.get("acceptPrivacyPolicy_msg").split("{privacyPolicy}")
		return m("", [
			m("span", parts[0]),
			m("span", m(`a[href=${neverNull(getPrivacyStatementLink())}][target=_blank]`, lang.get("privacyLink_label"))),
			m("span", parts[1]),
		])
	}

	_createStatisticFields(contactForm: ContactForm): Array<{component: Component, name: string, value: lazy<?string>}> {
		let language = getDefaultContactFormLanguage(contactForm.languages)
		return language.statisticsFields.map(field => {
			if (field.type === InputFieldType.ENUM) {
				let items = field.enumValues.map(t => {
					return {name: t.name, value: t.name}
				})
				// add empty entry
				items.splice(0, 0, {name: "", value: null})
				let f = new DropDownSelector(() => field.name, null, items, stream(null), 250)
				return {component: f, name: field.name, value: f.selectedValue}
			} else {
				let f = new TextField(() => field.name)
				return {component: f, name: field.name, value: f.value}
			}
		})
	}

	_conversationTypeToTitleTextId(): string {
		return "newMail_action"
	}

	animate(domElement: HTMLElement, fadein: boolean) {
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

	_showFileChooserForAttachments() {
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
					return fileController.open(file)
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


	getConfidentialStateMessage() {
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

				let cleanedNotificationMailAddress = getCleanedMailAddress(this._notificationEmailAddress.value());
				if (this._notificationEmailAddress.value().trim() !== "" && !cleanedNotificationMailAddress) {
					return Dialog.error("mailAddressInvalid_msg")
				}
				let password = this._passwordForm.getNewPassword()
				let statisticsFields = mapAndFilterNull(this._statisticFields, (field => {
					if (field.value()) {
						return {
							name: field.name,
							value: field.value()
						}
					} else {
						return null
					}
				}))
				let sendRequest = worker.createContactFormUser(password, this._contactForm._id, statisticsFields)
				                        .then(contactFormResult => {
					                        let userEmailAddress = contactFormResult.responseMailAddress
					                        return worker.createSession(userEmailAddress, password, client.getIdentifier(), false, false)
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
							                                     createRecipientInfo(contactFormResult.requestMailAddress, "", null, true)
						                                     return p.then(() => resolveRecipientInfo(recipientInfo)
							                                     .then(r => {
								                                     let recipientInfos = [r]
								                                     return worker.createMailDraft(this._subject.value(),
									                                     this._editor.getValue(), userEmailAddress, "",
									                                     recipientInfos, [], [], ConversationType.NEW,
									                                     null, this._attachments, true, [])
								                                                  .then(draft => {
									                                                  return worker.sendMailDraft(draft, recipientInfos, lang.code)
								                                                  })
							                                     })
							                                     .finally(e => {
								                                     return logins.logout(false)
							                                     }))
					                                     })
					                                     .then(() => {
						                                     return {userEmailAddress}
					                                     })
				                        })

				return showProgressDialog("sending_msg", sendRequest)
					.then(result => {
						return showConfirmDialog(result.userEmailAddress)
					})
					.then(() => this._close())
					.catch(AccessDeactivatedError, e => Dialog.error("contactFormSubmitError_msg"))
			}
		})
	}
}

function showConfirmDialog(userEmailAddress: string): Promise<void> {
	return Promise.fromCallback(cb => {
		let confirm = new Button("contactFormSubmitConfirm_action", () => {
			dialog.close()
			cb()
		}).setType(ButtonType.Login)
		let requestId = new TextField("mailAddress_label").setValue(userEmailAddress).setDisabled()
		let dialog = new Dialog(DialogType.EditMedium, {
			view: () => m("", [
				m(".dialog-header.plr-l.flex.justify-center.items-center.b", lang.get("loginCredentials_label")),
				m(".plr-l.pb.text-break", m(".pt", lang.get("contactFormSubmitConfirm_msg")), m(requestId)),
				m(confirm)
			])
		}).setCloseHandler(() => {
			// Prevent user from closing accidentally
		}).show()
	})
}
