// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {TextField, Type} from "../gui/base/TextField"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import {formatStorageSize, getCleanedMailAddress} from "../misc/Formatter"
import {MAX_ATTACHMENT_SIZE, InputFieldType, ConversationType, PushServiceType} from "../api/common/TutanotaConstants"
import {animations, height} from "../gui/animation/Animations"
import {Editor} from "../gui/base/Editor"
import {assertMainOrNode} from "../api/Env"
import {getPasswordStrength} from "../misc/PasswordUtils"
import {fileController} from "../file/FileController"
import {remove, mapAndFilterNull} from "../api/common/utils/ArrayUtils"
import {windowFacade} from "../misc/WindowFacade"
import {Keys} from "../misc/KeyManager"
import {PasswordIndicator} from "../gui/base/PasswordIndicator"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {worker} from "../api/main/WorkerClient"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {progressIcon} from "../gui/base/Icon"
import {createRecipientInfo, resolveRecipientInfo} from "../mail/MailUtils"
import {deviceConfig} from "../misc/DeviceConfig"
import {AccessDeactivatedError} from "../api/common/error/RestError"
import {neverNull} from "../api/common/utils/Utils"
import {client} from "../misc/ClientDetector"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {HttpMethod as HttpMethodEnum} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"

assertMainOrNode()

export class ContactFormRequestDialog {
	_dialog: Dialog;
	_passwordField: TextField;
	_subject: TextField;
	_editor: Editor;
	view: Function;
	_attachments: Array<TutanotaFile|DataFile|FileReference>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_attachmentButtons: Button[]; // these map 1:1 to the _attachments
	_attachFilesButton: Button;
	_loadingAttachments: boolean;
	_contactForm: ContactForm;
	_domElement: HTMLElement;
	_statisticFields: Array<{component: Component, name: string, value: lazy<string>}>;
	_notificationEmailAddress: TextField;

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
		this._attachFilesButton = new Button('attachFiles_action', () => this._showFileChooserForAttachments(), () => BootIcons.Attachment)
		this._subject._injectionsRight = () => {
			return [m(this._attachFilesButton)]
		}

		this._statisticFields = this._createStatisticFields(contactForm)
		this._notificationEmailAddress = new TextField("mailAddress_label", () => lang.get("contactFormMailAddressInfo_msg")).setType(Type.Area);

		let passwordIndicator = new PasswordIndicator(() => this.getPasswordStrength())
		this._passwordField = new TextField("password_label", () => lang.get("contactFormEnterPasswordInfo_msg")).setType(Type.ExternalPassword)
		this._passwordField._injectionsRight = () => m(".mb-s.mlr", [m(passwordIndicator)])

		let closeButton = new Button('cancel_action', () => this._close()).setType(ButtonType.Secondary)
		let sendButton = new Button('send_action', () => this.send()).setType(ButtonType.Primary)
		let headerBar = new DialogHeaderBar()
			.addLeft(closeButton)
			.setMiddle(() => lang.get("createContactRequest_action"))
			.addRight(sendButton)

		this._editor = new Editor(true, 200, "contactFormPlaceholder_label")
		this._editor.initialized.promise.then(() => {
			this._editor.squire.setHTML("<br><br>")
		})

		let statisticFieldHeader = new TextField(() => "", () => lang.get("contactFormStatisticFieldsInfo_msg"))
			.setDisabled()
			.setValue(lang.get("optionalValues_label"))

		this.view = () => {
			return m("#mail-editor.text.pb", {
				oncreate: vnode => this._domElement = vnode.dom,
				onclick: (e) => {
					if (e.target === this._domElement) {
						this._editor.squire.focus()
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
							this._attachFiles((dataFiles:any))
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
				m(".flex-start.flex-wrap.ml-negative-bubble" + (this._attachmentButtons.length > 0 ? ".pt" : ""), (!this._loadingAttachments) ? this._attachmentButtons.map(b => m(b)) : [m(".flex-v-center", progressIcon()), m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))]),
				this._attachmentButtons.length > 0 ? m("hr") : null,
				m(this._passwordField),
				m(".pt-l.text", {onclick: () => this._editor.squire.focus()}, m(this._editor)),
				m(this._notificationEmailAddress),
				this._statisticFields.length > 0 ? m(statisticFieldHeader) : null,
				this._statisticFields.map(field => m(field.component)),
			])
		}

		this._dialog = Dialog.largeDialog(headerBar, this)
			.addShortcut({
				key: Keys.ESC,
				exec: () => closeButton.clickHandler(),
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
			})
	}

	_createStatisticFields(contactForm: ContactForm): Array<{component: Component, name: string, value: lazy<string>}> {
		return contactForm.statisticsFields.map(field => {
			if (field.type === InputFieldType.ENUM) {
				let f = new DropDownSelector(() => field.name, null, field.enumValues.map(t => {
					return {name: t.name, value: t.name}
				}), field.enumValues[0].name, 250)
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

	getPasswordStrength() {
		return Math.min(100, (getPasswordStrength(this._passwordField.value(), []) / 0.8 * 1))
	}

	show() {
		this._dialog.show()
		windowFacade.checkWindowClosing(true)
	}

	_close() {
		windowFacade.checkWindowClosing(false)
		this._dialog.close()
	}

	_showFileChooserForAttachments() {
		return fileController.showFileChooser(true).then(files => {
			this._attachFiles((files:any))
			m.redraw()
		})
	}

	_attachFiles(files: Array<TutanotaFile|DataFile|FileReference>) {
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
				if (file._type == "DataFile") {
					return fileController.open(((file:any):DataFile))
				} else {
					fileController.downloadAndOpen(((file:any):TutanotaFile))
				}
			}, null).setType(ButtonType.Secondary))
			lazyButtons.push(new Button("remove_action", () => {
				remove(this._attachments, file)
				this._updateAttachmentButtons()
				m.redraw()
			}, null).setType(ButtonType.Secondary))

			return createDropDownButton(() => file.name, () => BootIcons.Attachment, () => lazyButtons).setType(ButtonType.Bubble).setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
		})
	}


	getConfidentialStateMessage() {
		return lang.get('confidentialStatus_msg')
	}

	send() {
		if (this._passwordField.value().trim() == "") {
			Dialog.error("contactFormEnterPasswordInfo_msg")
			return
		}
		let passwordCheck = Promise.resolve(true)
		if (this.getPasswordStrength() < 80) {
			passwordCheck = Dialog.confirm("contactFormPasswordNotSecure_msg")
		}
		passwordCheck.then(ok => {
			if (ok) {

				let cleanedNotificationMailAddress = getCleanedMailAddress(this._notificationEmailAddress.value());
				if (this._notificationEmailAddress.value().trim() != "" && !cleanedNotificationMailAddress) {
					return Dialog.error("mailAddressInvalid_msg")
				}
				let password = this._passwordField.value()
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
				let sendRequest = worker.createContactFormUser(password, this._contactForm._id, statisticsFields).then(contactFormResult => {
					let userEmailAddress = contactFormResult.responseMailAddress
					return worker.createSession(userEmailAddress, password, client.getIdentifier(), false).then(() => {
						let p = Promise.resolve()
						if (cleanedNotificationMailAddress) {
							let pushIdentifier = createPushIdentifier()
							pushIdentifier.identifier = neverNull(cleanedNotificationMailAddress)
							pushIdentifier.language = lang.code
							pushIdentifier.pushServiceType = PushServiceType.EMAIL
							pushIdentifier._ownerGroup = logins.getUserController().userGroupInfo.group
							pushIdentifier._owner = logins.getUserController().userGroupInfo.group // legacy
							pushIdentifier._area = "0" // legacy
							p = worker.entityRequest(PushIdentifierTypeRef, HttpMethodEnum.POST, neverNull(logins.getUserController().user.pushIdentifierList).list, null, pushIdentifier);
						}

						let recipientInfo = createRecipientInfo(contactFormResult.requestMailAddress, "")
						return p.then(() => resolveRecipientInfo(recipientInfo).then(r => {
							let recipientInfos = [r]
							return worker.createMailDraft(this._subject.value(), this._editor.squire.getHTML(), userEmailAddress, "", recipientInfos, [], [], ConversationType.NEW, null, this._attachments, true, []).then(draft => {
								return worker.sendMailDraft(draft, recipientInfos, lang.code)
							})
						}).finally(e => {
							worker.logout()
						}))
					}).then(() => {
						return {userEmailAddress, password}
					})
				})

				return Dialog.progress("sending_msg", sendRequest).then(result => {
					let requestId = new TextField("mailAddress_label").setValue(result.userEmailAddress).setDisabled()
					let password = new TextField("password_label").setValue(result.password).setDisabled()
					return Dialog.save(() => lang.get("loginCredentials_label"), () => {
						return worker.createSession(result.userEmailAddress, result.password, client.getIdentifier(), true).then(credentials => {
							deviceConfig.set(neverNull(credentials))
						}).then(e => {
							worker.logout()
						})
					}, {
						view: () => {
							return [m(".pt", lang.get("contactFormSubmitConfirm_msg")), m(requestId), m(password)]
						}
					})
				}).then(() => this._close()).catch(AccessDeactivatedError, e => Dialog.error("contactFormSubmitError_msg"))
			}
		})
	}
}
