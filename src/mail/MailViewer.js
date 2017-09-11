// @flow
import {px} from "../gui/size"
import m from "mithril"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {load, update, loadMultiple} from "../api/main/Entity"
import {Button, ButtonType, createDropDownButton, createAsyncDropDownButton} from "../gui/base/Button"
import {MailView} from "./MailView"
import {
	formatDateWithWeekday,
	formatTime,
	formatStorageSize,
	formatDateTime,
	urlEncodeHtmlTags,
	getDomainWithoutSubdomains
} from "../misc/Formatter"
import {ActionBar} from "../gui/base/ActionBar"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import {MailState, ConversationType, InboxRuleType, FeatureType} from "../api/common/TutanotaConstants"
import {MailEditor} from "./MailEditor"
import {FileTypeRef} from "../api/entities/tutanota/File"
import {fileController} from "../file/FileController"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode, Mode} from "../api/Env"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {Dialog} from "../gui/base/Dialog"
import {neverNull} from "../api/common/utils/Utils"
import {exportAsEml} from "./Exporter"
import {worker} from "../api/main/WorkerClient"
import {checkApprovalStatus} from "../misc/ErrorHandlerImpl"
import {contains, addAll} from "../api/common/utils/ArrayUtils"
import {startsWith} from "../api/common/utils/StringUtils"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import {getSenderOrRecipientHeading, getDisplayText, createNewContact} from "./MailUtils"
import {header} from "../gui/base/Header"
import {ContactEditor} from "../contacts/ContactEditor"
import MessageBox from "../gui/base/MessageBox"
import {keyManager, Keys} from "../misc/KeyManager"
import * as AddInboxRuleDialog from "../settings/AddInboxRuleDialog"
import {urlify} from "../misc/Urlifier"
import {logins} from "../api/main/LoginController"
import {Icon, progressIcon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"
import {createEncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {loadGroupInfos} from "../settings/LoadingUtils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {NotFoundError} from "../api/common/error/RestError"

assertMainOrNode()

/**
 * The MailViewer displays a mail. The mail body is loaded asynchronously.
 */
export class MailViewer {
	view: Function;
	mail: Mail;
	mailView: MailView;
	_mailBody: ?MailBody;
	_htmlBody: string;
	_loadingAttachments: boolean;
	_attachments: TutanotaFile[];
	_attachmentButtons: Button[];
	_contentBlocked: boolean
	oncreate: Function;
	onbeforeremove: Function;

	constructor(mail: Mail, mailView: MailView) {
		this.mail = mail
		this._attachments = []
		this._attachmentButtons = []
		this.mailView = mailView
		this._htmlBody = ""
		this._contentBlocked = false

		let senderBubble = createDropDownButton(() => getDisplayText(this.mail.sender.name, this.mail.sender.address, false), null, () => this._createBubbleContextButtons(this.mail.sender, InboxRuleType.FROM_EQUALS), 250).setType(ButtonType.Bubble)
		let differentSenderBubble = (this._isEnvelopeSenderVisible()) ? new Button(() => getDisplayText("", neverNull(this.mail.differentEnvelopeSender), false), () => Dialog.error("envelopeSenderInfo_msg"), () => Icons.Warning).setType(ButtonType.Bubble) : null
		let toRecipientBubbles = this.mail.toRecipients.map(recipient => createDropDownButton(() => getDisplayText(recipient.name, recipient.address, false), null, () => this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_TO_EQUALS), 250).setType(ButtonType.Bubble))
		let ccRecipientBubbles = this.mail.ccRecipients.map(recipient => createDropDownButton(() => getDisplayText(recipient.name, recipient.address, false), null, () => this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_CC_EQUALS), 250).setType(ButtonType.Bubble))
		let bccRecipientBubbles = this.mail.bccRecipients.map(recipient => createDropDownButton(() => getDisplayText(recipient.name, recipient.address, false), null, () => this._createBubbleContextButtons(recipient, InboxRuleType.RECIPIENT_BCC_EQUALS), 250).setType(ButtonType.Bubble))
		let replyToBubbles = this.mail.replyTos.map(recipient => createDropDownButton(() => getDisplayText(recipient.name, recipient.address, false), null, () => this._createBubbleContextButtons(recipient, null), 250).setType(ButtonType.Bubble))

		let detailsExpander = new ExpanderButton("showMore_action", new ExpanderPanel({
			view: () =>
				m("", [
					m(".ml-negative-bubble", m(senderBubble)),
					(differentSenderBubble) ? m(".small", lang.get("sender_label")) : null,
					(differentSenderBubble) ? m(".ml-negative-bubble", m(differentSenderBubble)) : null,
					(toRecipientBubbles.length > 0) ? m(".small", lang.get("to_label")) : null,
					(toRecipientBubbles.length > 0) ? m(".flex-start.flex-wrap.ml-negative-bubble", toRecipientBubbles.map(b => m(b))) : null,
					(ccRecipientBubbles.length > 0) ? m(".small", lang.get("cc_label")) : null,
					(ccRecipientBubbles.length > 0) ? m(".flex-start.flex-wrap.ml-negative-bubble", ccRecipientBubbles.map(b => m(b))) : null,
					(bccRecipientBubbles.length > 0) ? m(".small", lang.get("bcc_label")) : null,
					(bccRecipientBubbles.length > 0) ? m(".flex-start.flex-wrap.ml-negative-bubble", bccRecipientBubbles.map(b => m(b))) : null,
					(replyToBubbles.length > 0) ? m(".small", lang.get("replyTo_label")) : null,
					(replyToBubbles.length > 0) ? m(".flex-start.flex-wrap.ml-negative-bubble", replyToBubbles.map(b => m(b))) : null,
				])
		}), differentSenderBubble != null, {'padding-top': px(26)})

		let actions = new ActionBar()
		if (mail.state === MailState.DRAFT) {
			actions.add(new Button('edit_action', () => this._editDraft(), () => BootIcons.Edit))
		} else {
			let loadExternalContentButton = new Button('contentBlocked_msg', () => {
				if (this._mailBody) {
					Dialog.confirm("contentBlocked_msg", "showBlockedContent_action").then((confirmed) => {
						if (confirmed) {
							this._htmlBody = urlify(htmlSanitizer.sanitize(neverNull(this._mailBody).text, false).text)
							this._contentBlocked = false
							m.redraw()
						}
					})

				}
			}, () => Icons.Warning)
			loadExternalContentButton.setIsVisibleHandler(() => this._contentBlocked)

			let restrictedParticipants = mail.restrictions && mail.restrictions.participantGroupInfos.length > 0

			actions.add(loadExternalContentButton)
			actions.add(new Button('reply_action', () => this._reply(false), () => Icons.Reply))
			if (logins.getUserController().isInternalUser() && (mail.toRecipients.length + mail.ccRecipients.length + mail.bccRecipients.length > 1) && !restrictedParticipants) {
				actions.add(new Button('replyAll_action', () => this._reply(true), () => Icons.ReplyAll))
			}
			if (logins.getUserController().isInternalUser() && !restrictedParticipants) {
				actions.add(new Button('forward_action', () => this._forward(), () => Icons.Forward))
			} else if (logins.getUserController().isInternalUser() && restrictedParticipants) {
				const mailRecipients = this._getAssignableMailRecipients().filter(userOrMailGroupInfo => {
					let mailbox = neverNull(this.mailView.selectedMailbox)
					if (mailbox.isUserMailbox()) {
						return userOrMailGroupInfo.group != logins.getUserController().userGroupInfo.group
					} else {
						return userOrMailGroupInfo.group != neverNull(mailbox.mailGroupInfo).group
					}
				}).map(userOrMailGroupInfo => {
					return new Button(() => getDisplayText(userOrMailGroupInfo.name, neverNull(userOrMailGroupInfo.mailAddress), true), () => this._assignMail(userOrMailGroupInfo), () => Icons.Contacts)
						.setType(ButtonType.Dropdown)
				})
				actions.add(createAsyncDropDownButton('forward_action', () => Icons.Forward, () => mailRecipients, 250))
			}
			actions.add(createDropDownButton('move_action', () => Icons.Folder, () => {
				return neverNull(this.mailView.selectedMailbox).getAllFolders().filter(vm => vm.folder !== this.mailView.selectedFolder).map(targetVm => {
					return new Button(() => targetVm.getDisplayName(), () => this.mailView.moveMails(targetVm, [mail]), targetVm.getDisplayIcon())
						.setType(ButtonType.Dropdown)
				})
			}))
		}
		actions.add(new Button('delete_action', () => this.mailView.deleteSelected(), () => Icons.Trash))
		if (mail.state !== MailState.DRAFT) {
			actions.add(createDropDownButton('more_label', () => Icons.More, () => {
				let moreButtons = []
				if (!this.mail.unread) {
					moreButtons.push(new Button("markUnread_action", () => this._markUnread(), () => Icons.NoEye).setType(ButtonType.Dropdown))
				}
				moreButtons.push(new Button("export_action", () => exportAsEml(this.mail, this._htmlBody), () => Icons.Download).setType(ButtonType.Dropdown)
					.setIsVisibleHandler(() => env.mode != Mode.App && !logins.isEnabled(FeatureType.DisableMailExport)))
				return moreButtons
			}))
		}

		load(MailBodyTypeRef, mail.body).then(body => {
			this._mailBody = body
			let sanitizeResult = htmlSanitizer.sanitize(body.text, true)
			this._htmlBody = urlify(sanitizeResult.text)
			this._contentBlocked = sanitizeResult.externalContent.length > 0;
			m.redraw()
		}).catch(NotFoundError, e => console.log("could load mail body as it has been moved/deleted already", e))
		// load the conversation entry here because we expect it to be loaded immediately when responding to this email
		load(ConversationEntryTypeRef, mail.conversationEntry)
			.catch(NotFoundError, e => console.log("could load conversation entry as it has been moved/deleted already", e))

		if (mail.attachments.length == 0) {
			this._loadingAttachments = false
		} else {
			this._loadingAttachments = true
			Promise.map(mail.attachments, fileId => {
				return load(FileTypeRef, fileId)
			}).then(files => {
				this._attachments = files
				this._attachmentButtons = files.map(file => {
					return new Button(() => file.name, () => fileController.downloadAndOpen(file), () => BootIcons.Attachment).setType(ButtonType.Bubble).setStaticRightText("(" + formatStorageSize(Number(file.size)) + ")")
				})
				if (this._attachmentButtons.length >= 3) {
					this._attachmentButtons.push(new Button("saveAll_action", () => fileController.downloadAndOpenAll(this._attachments), null).setType(ButtonType.Secondary))
				}
				this._loadingAttachments = false
				m.redraw()
			}).catch(NotFoundError, e => console.log("could load attachments as they have been moved/deleted already", e))
		}

		let errorMessageBox = new MessageBox("corrupted_msg")
		this.view = () => {
			return [
				m("#mail-viewer.fill-absolute.scroll.plr-l", [
						m(".header", [
							m(".sender-details.flex-space-between.mr-negative-s.button-min-height", [ // the natural height may vary in browsers (Firefox), so set it to button height here to make it similar to the MultiMailViewer
								m("small.flex.items-end.text-break", (detailsExpander.panel.expanded) ? lang.get("from_label") : getSenderOrRecipientHeading(this.mail, false)),
								m(detailsExpander),
							]),
							m(detailsExpander.panel),
							m(".subject-actions.flex-space-between.flex-wrap.mt-xs", [
								m(".left", [
									m(".subject", this.mail.subject),
									m(".flex.items-center.content-accent-fg.svg-content-accent-fg" + (this.mail.confidential ? ".ml-negative-xs" : ""), [
										this.mail.confidential ? m(Icon, {icon: Icons.Lock}) : null,
										m("small.date.mt-xs", formatDateWithWeekday(this.mail.receivedDate) + " • " + formatTime(this.mail.receivedDate))
									]),
								]),
								m(".middle"),
								m(actions)
							]),
							m(".flex-start.flex-wrap.ml-negative-bubble", (!this._loadingAttachments) ? this._attachmentButtons.map(b => m(b)) : [m(".flex-v-center.pl-button", progressIcon()), m(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))]),
							m("hr.hr.mt.mb"),
						]),

						m(".body", {
							onsubmit: (event: Event) => this._confirmSubmit(event)
						}, this._mailBody == null ? m(".progress-panel.flex-v-center.items-center", {
								style: {
									height: '200px'
								}
							}, [
								progressIcon(),
								m("small", lang.get("loading_msg"))
							]) : ((this.mail._errors || this._mailBody._errors) ? m(errorMessageBox) : m.trust(this._htmlBody)))
					]
				)
			]
		}


		this._setupShortcuts()
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
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	_confirmSubmit(event: Event) {
		// use the default confirm dialog here because the submit can not be done async
		if (!confirm(lang.get("reallySubmitContent_msg"))) {
			event.preventDefault();
		}
	}

	_createBubbleContextButtons(address: MailAddress | EncryptedMailAddress, defaultInboxRuleField: ?string) {
		let buttons = [address.address]
		if (logins.getUserController().isInternalUser()) {
			let contact = worker.getContactController().findContactByMailAddress(address.address)
			if (contact) {
				buttons.push(new Button("showContact_action", () => {
					header.contactsUrl = `/contact/${neverNull(contact)._id[0]}/${neverNull(contact)._id[1]}`
					m.route.set(header.contactsUrl + location.hash)
				}, null).setType(ButtonType.Secondary))
			} else {
				buttons.push(new Button("createContact_action", () => {
					worker.getContactController().lazyContactListId.getAsync().then(contactListId => {
						new ContactEditor(createNewContact(address.address, address.name), contactListId).show()
					})
				}, null).setType(ButtonType.Secondary))
			}
			if (defaultInboxRuleField && !logins.getUserController().isOutlookAccount() && !AddInboxRuleDialog.isRuleExistingForType(address.address.trim().toLowerCase(), defaultInboxRuleField)) {
				buttons.push(new Button("addRule_action", () => {
					AddInboxRuleDialog.show(neverNull(this.mailView.selectedMailbox), neverNull(defaultInboxRuleField), address.address.trim().toLowerCase())
				}, null).setType(ButtonType.Secondary))
			}
		}
		return buttons
	}

	_isEnvelopeSenderVisible(): boolean {
		return (this.mail.differentEnvelopeSender != null && getDomainWithoutSubdomains(this.mail.differentEnvelopeSender) != getDomainWithoutSubdomains(this.mail.sender.address))
	}

	_markUnread() {
		this.mail.unread = true
		update(this.mail)
	}

	_editDraft() {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				let editor = new MailEditor(neverNull(this.mailView.selectedMailbox))
				return editor.initFromDraft(this.mail).then(() => {
					editor.show()
				})
			}
		})
	}

	_reply(replyAll: boolean) {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				let prefix = "Re: "
				let subject = (startsWith(this.mail.subject, prefix)) ? this.mail.subject : prefix + this.mail.subject
				let infoLine = formatDateTime(this.mail.sentDate) + " " + lang.get("by_label") + " " + this.mail.sender.address + ":";
				var body = infoLine + "<br><blockquote class=\"tutanota_quote\">" + this._htmlBody + "</blockquote>";

				let toRecipients = []
				let ccRecipients = []
				let bccRecipients = []
				if (!logins.getUserController().isInternalUser()) {
					toRecipients.push(this.mail.sender)
				} else if (this.mail.state == MailState.RECEIVED) {
					if (this.mail.replyTos.length > 0) {
						addAll(toRecipients, this.mail.replyTos)
					} else {
						toRecipients.push(this.mail.sender)
					}
					if (replyAll) {
						let myMailAddresses = neverNull(this.mailView.selectedMailbox).getEnabledMailAddresses()
						addAll(ccRecipients, this.mail.toRecipients.filter(recipient => !contains(myMailAddresses, recipient.address)))
						addAll(ccRecipients, this.mail.ccRecipients.filter(recipient => !contains(myMailAddresses, recipient.address)))
					}
				} else {
					// this is a sent email, so use the to recipients as new recipients
					addAll(toRecipients, this.mail.toRecipients)
					if (replyAll) {
						addAll(ccRecipients, this.mail.ccRecipients)
						addAll(bccRecipients, this.mail.bccRecipients)
					}
				}
				let editor = new MailEditor(neverNull(this.mailView.selectedMailbox))
				return editor.initAsResponse(this.mail, ConversationType.REPLY, this._getSenderOfResponseMail(), toRecipients, ccRecipients, bccRecipients, [], subject, body, [], true).then(() => {
					editor.show()
				})
			}
		})
	}

	_forward() {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				return this._createForwardingMailEditor([], [], true).then(editor => {
					editor.show()
				})
			}
		})
	}

	_createForwardingMailEditor(recipients: MailAddress[], replyTos: EncryptedMailAddress[], addSignature: boolean): Promise<MailEditor> {
		let infoLine = lang.get("date_label") + ": " + formatDateTime(this.mail.sentDate) + "<br>"
		infoLine += lang.get("from_label") + ": " + this.mail.sender.address + "<br>"
		if (this.mail.toRecipients.length > 0) {
			infoLine += lang.get("to_label") + ": " + this.mail.toRecipients.map(recipient => recipient.address).join(", ")
			infoLine += "<br>";
		}
		if (this.mail.ccRecipients.length > 0) {
			infoLine += lang.get("cc_label") + ": " + this.mail.ccRecipients.map(recipient => recipient.address).join(", ")
			infoLine += "<br>";
		}
		infoLine += lang.get("subject_label") + ": " + urlEncodeHtmlTags(this.mail.subject);

		let body = infoLine + "<br><br><blockquote class=\"tutanota_quote\">" + this._htmlBody + "</blockquote>";

		let editor = new MailEditor(neverNull(this.mailView.selectedMailbox))
		return editor.initAsResponse(this.mail, ConversationType.FORWARD, this._getSenderOfResponseMail(), recipients, [], [], this._attachments.slice(), "Fwd: " + this.mail.subject, body, replyTos, addSignature).then(() => {
			return editor
		})
	}

	_getAssignableMailRecipients(): Promise<GroupInfo[]> {
		if (this.mail.restrictions != null && this.mail.restrictions.participantGroupInfos.length > 0) {
			const participantGroupInfos = this.mail.restrictions.participantGroupInfos
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return loadGroupInfos(participantGroupInfos.filter(groupInfoId => {
					return neverNull(customer.contactFormUserGroups).list !== groupInfoId[0]
				}))
			})
		} else {
			return Promise.resolve([])
		}
	}


	_test(): Promise<GroupInfo[]> {
		return loadMultiple(GroupInfoTypeRef, "", [""]).then((groupInfos: GroupInfo[]) => groupInfos)
	}


	_assignMail(userGroupInfo: GroupInfo) {
		const recipient = createMailAddress()
		recipient.address = neverNull(userGroupInfo.mailAddress)
		recipient.name = userGroupInfo.name

		let editor = new MailEditor(neverNull(this.mailView.selectedMailbox))
		let newReplyTos;
		if (this.mail.replyTos.length > 0) {
			newReplyTos = this.mail.replyTos
		} else {
			newReplyTos = [createEncryptedMailAddress()]
			newReplyTos[0].address = this.mail.sender.address
			newReplyTos[0].name = this.mail.sender.name
		}

		return this._createForwardingMailEditor([recipient], newReplyTos, false).then(editor => {
			return editor.send()
		}).then(() => {
			this.mailView.moveMails(neverNull(this.mailView.selectedMailbox).getArchiveFolder(), [this.mail])
		})
	}

	_getSenderOfResponseMail(): string {
		let myMailAddresses = neverNull(this.mailView.selectedMailbox).getEnabledMailAddresses()
		let addressesInMail = []
		addressesInMail.push(this.mail.sender)
		addAll(addressesInMail, this.mail.toRecipients)
		addAll(addressesInMail, this.mail.ccRecipients)
		addAll(addressesInMail, this.mail.bccRecipients)
		let foundAddress = addressesInMail.find(address => contains(myMailAddresses, address.address))
		if (foundAddress) {
			return foundAddress.address
		} else {
			return neverNull(this.mailView.selectedMailbox).getDefaultSender()
		}
	}
}
