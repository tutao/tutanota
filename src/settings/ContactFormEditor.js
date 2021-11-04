// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {Button} from "../gui/base/Button"
import {lang, languages} from "../misc/LanguageViewModel"
import {BookingItemFeatureType, GroupType, Keys} from "../api/common/TutanotaConstants"
import {load, loadAll, setup, update} from "../api/main/Entity"
import {getWhitelabelDomain} from "../api/common/utils/Utils"
import {neverNull} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../api/common/Env"
import {logins} from "../api/main/LoginController"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {GroupTypeRef} from "../api/entities/sys/Group"
import type {TableAttrs} from "../gui/base/TableN"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import type {ContactForm} from "../api/entities/tutanota/ContactForm"
import {ContactFormTypeRef, createContactForm} from "../api/entities/tutanota/ContactForm"
import {mapAndFilterNull, remove} from "@tutao/tutanota-utils"
import {getContactFormUrl} from "./ContactFormViewer"
import {HtmlEditor} from "../gui/editor/HtmlEditor"
import {Icons} from "../gui/base/icons/Icons"
import {CustomerContactFormGroupRootTypeRef} from "../api/entities/tutanota/CustomerContactFormGroupRoot"
import {NotFoundError} from "../api/common/error/RestError"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {UserTypeRef} from "../api/entities/sys/User"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import stream from "mithril/stream/stream.js"
import type {ContactFormLanguage} from "../api/entities/tutanota/ContactFormLanguage"
import {createContactFormLanguage} from "../api/entities/tutanota/ContactFormLanguage"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import {getDefaultContactFormLanguage} from "../contacts/ContactFormUtils"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {windowFacade} from "../misc/WindowFacade"
import {ButtonType} from "../gui/base/ButtonN"
import {compareGroupInfos, getGroupInfoDisplayName} from "../api/common/utils/GroupUtils";
import {isSameId, stringToCustomId} from "../api/common/utils/EntityUtils";
import {createDropDownButton} from "../gui/base/Dropdown";
import type {LanguageCode} from "../misc/LanguageViewModel"
import {showBuyDialog} from "../subscription/BuyDialog"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ofClass} from "@tutao/tutanota-utils"

assertMainOrNode()

// keep in sync with ContactFormAccessor.java
let PATH_PATTERN = /^[a-zA-Z0-9_\\-]+$/

export class ContactFormEditor {
	_createNew: boolean;
	_contactForm: ContactForm;
	_newContactFormIdReceiver: (string) => void

	dialog: Dialog;
	view: Function;

	_receivingMailbox: Stream<?GroupInfo>;
	_participantGroupInfoList: Array<GroupInfo>;
	_headerField: HtmlEditor;
	_footerField: HtmlEditor;
	_helpField: HtmlEditor;
	_language: Stream<ContactFormLanguage>;
	_languages: Array<ContactFormLanguage>;
	_languageDisplayValue: string
	_receivingMailboxDisplayValue: string
	_pageTitle: string
	_path: string
	_brandingDomain: string
	_allUserGroupInfos: Array<GroupInfo>
	_allSharedMailboxGroupInfos: Array<GroupInfo>

	/**
	 * This constructor is only used internally. See show() for the external interface.
	 */
	constructor(c: ?ContactForm, createNew: boolean, newContactFormIdReceiver: (string) => void, allUserGroupInfos: GroupInfo[],
	            allSharedMailboxGroupInfos: GroupInfo[], brandingDomain: string) {
		this._createNew = createNew
		this._contactForm = c ? c : createContactForm()
		this._createNew = createNew
		this._newContactFormIdReceiver = newContactFormIdReceiver
		this._allUserGroupInfos = allUserGroupInfos
		this._allSharedMailboxGroupInfos = allSharedMailboxGroupInfos
		this._brandingDomain = brandingDomain

		if (!logins.getUserController().isGlobalAdmin()) {
			let localAdminGroupIds = logins.getUserController().getLocalAdminGroupMemberships().map(gm => gm.group)
			this._allSharedMailboxGroupInfos = allSharedMailboxGroupInfos.filter(gi =>
				localAdminGroupIds.indexOf(gi.localAdmin) !== -1)
			this._allUserGroupInfos = allUserGroupInfos.filter(gi => localAdminGroupIds.indexOf(gi.localAdmin) !== -1)
		}
		this._allSharedMailboxGroupInfos.sort(compareGroupInfos)
		this._allUserGroupInfos.sort(compareGroupInfos)

		let selectedTargetGroupInfo = this._allSharedMailboxGroupInfos.length
		> 0 ? this._allSharedMailboxGroupInfos[0] : (this._allUserGroupInfos.length > 0 ? this._allUserGroupInfos[0] : null)
		if (this._contactForm.targetGroupInfo) {
			let groupInfo = this._allSharedMailboxGroupInfos.find(groupInfo => isSameId(neverNull(this._contactForm.targetGroupInfo), groupInfo._id))
			if (!groupInfo) {
				groupInfo = this._allUserGroupInfos.find(groupInfo => isSameId(neverNull(this._contactForm.targetGroupInfo), groupInfo._id))
			}
			if (groupInfo) {
				selectedTargetGroupInfo = groupInfo
			}
		}
		this._path = this._contactForm.path
		this._receivingMailboxDisplayValue = ""
		this._receivingMailbox = stream(selectedTargetGroupInfo)
		this._receivingMailbox.map(groupInfo => {
			if (groupInfo) {
				let prefix = (groupInfo.groupType === GroupType.User ?
					lang.get("account_label") : lang.get("sharedMailbox_label")) + ": "
				this._receivingMailboxDisplayValue = (prefix + getGroupInfoDisplayName(groupInfo))
			}
		})

		// remove all groups that do not exist any more
		this._participantGroupInfoList = mapAndFilterNull(this._contactForm.participantGroupInfos, groupInfoId => this._allUserGroupInfos.find(g => isSameId(g._id, groupInfoId)))

		this._languages = this._contactForm.languages.map(l => Object.assign({}, l))
		if (this._languages.length === 0) {
			let l = createContactFormLanguage()
			l.code = (lang.code === "de_sie") ? "de" : lang.code
			this._languages.push(l)
		}
		let previousLanguage: ?ContactFormLanguage = null
		let language = getDefaultContactFormLanguage(this._languages)
		this._language = stream(language)
		this._languageDisplayValue = getLanguageName(this._language().code)

		this._headerField = new HtmlEditor(null, {enabled: true}).setModeSwitcher("header_label").setMinHeight(200).showBorders()
		this._footerField = new HtmlEditor(null, {enabled: true}).setModeSwitcher("footer_label").setMinHeight(200).showBorders()
		this._helpField = new HtmlEditor(null, {enabled: true}).setModeSwitcher("helpPage_label").setMinHeight(200).showBorders()

		this._pageTitle = ""
		this._language.map((l: ContactFormLanguage) => {
			if (previousLanguage && l !== previousLanguage) {
				this.updateLanguageFromFields(previousLanguage)
			}
			previousLanguage = l
			this._languageDisplayValue = getLanguageName(l.code)
			this._pageTitle = l.pageTitle
			this._headerField.setValue(l.headerHtml)
			this._footerField.setValue(l.footerHtml)
			this._helpField.setValue(l.helpHtml)
		})

		let cancelAction = () => this._close()

		let headerBarAttrs: DialogHeaderBarAttrs = {
			left: [{label: 'cancel_action', click: cancelAction, type: ButtonType.Secondary}],
			right: [{label: 'save_action', click: () => this._save(), type: ButtonType.Primary}],
			middle: () => lang.get(this._createNew ? "createContactForm_label" : "editContactForm_label")
		}

		let windowCloseUnsubscribe
		this.view = () => {
			return m("#contact-editor.pb", {
				oncreate: vnode => windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {}),
				onremove: vnode => windowCloseUnsubscribe()
			}, [
				m(".h4.mt-l", lang.get("emailProcessing_label")),
				m(TextFieldN, this._createReceivingMailboxFieldAttrs()),
				(this._receivingMailbox() && neverNull(this._receivingMailbox()).groupType === GroupType.User)
					? null
					: m(".mt-l", [
						m(TableN, this._createParticipantGroupInfosTableAttrs()),
						m(".small", lang.get("responsiblePersonsInfo_msg"))
					]),
				m(".h4.mt-l", lang.get("display_action")),
				m(TextFieldN, this._createPathFieldAttrs()),
				m(TextFieldN, this._createLanguageFieldAttrs()),
				m(TextFieldN, this._createPageTitleAttrs()),
				m(this._headerField),
				m(this._footerField),
				m(this._helpField),
			])
		}
		this.dialog = Dialog.largeDialog(headerBarAttrs, this)
		                    .addShortcut({
			                    key: Keys.ESC,
			                    exec: cancelAction,
			                    help: "close_alt"
		                    }).setCloseHandler(cancelAction)
	}

	updateLanguageFromFields(language: ContactFormLanguage) {
		language.pageTitle = this._pageTitle
		language.headerHtml = this._headerField.getValue()
		language.footerHtml = this._footerField.getValue()
		// the help html might contain <div> and <br> although no content was added, so remove it to avoid displaying the help link in the contact form
		if (this._helpField.getValue().replace("<div>", "").replace("</div>", "").replace("<br>", "").trim() === "") {
			language.helpHtml = ""
		} else {
			language.helpHtml = this._helpField.getValue()
		}
	}

	_close() {
		this.dialog.close()
	}

	_save() {
		if (!PATH_PATTERN.test(this._path)) {
			Dialog.error("pleaseEnterValidPath_msg")
		} else {
			// check that the path is unique
			showProgressDialog("pleaseWait_msg", load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
				.then(customer => {
						return load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(root => {
							const receivingMailbox = this._receivingMailbox()
							if (!receivingMailbox) {
								return Dialog.error("noReceivingMailbox_label")
							}
							let contactFormsListId = root.contactForms
							let customElementIdFromPath = stringToCustomId(this._path)
							let contactFormIdFromPath = [contactFormsListId, customElementIdFromPath]
							let samePathFormCheck = Promise.resolve(false)
							// only compare the path if this is a new contact form or it is a different existing contact form
							if (!this._contactForm._id || !isSameId(this._contactForm._id, contactFormIdFromPath)) {
								samePathFormCheck = load(ContactFormTypeRef, contactFormIdFromPath)
									.then(cf => true)
									.catch(ofClass(NotFoundError, e => false))
							}
							return samePathFormCheck.then(samePathForm => {
								if (samePathForm) {
									return Dialog.error("pathAlreadyExists_msg")
								} else {
									// check if the target mail group is already referenced by a different contact form
									return load(GroupTypeRef, receivingMailbox.group).then(group => {
										if (group.user) {
											return load(UserTypeRef, group.user).then(user => {
												return neverNull(user.memberships.find(m => m.groupType
													=== GroupType.Mail)).group
											})
										} else {
											return group._id
										}
									}).then(mailGroupId => {
										return load(MailboxGroupRootTypeRef, mailGroupId).then(mailboxGroupRoot => {
											let contactFormIdToCheck = (this._createNew) ? contactFormIdFromPath : this._contactForm._id
											if (mailboxGroupRoot.targetMailGroupContactForm
												&& !isSameId(mailboxGroupRoot.targetMailGroupContactForm, contactFormIdToCheck)) {
												return Dialog.error("receivingMailboxAlreadyUsed_msg")
											} else {
												this._contactForm._ownerGroup =
													neverNull(logins.getUserController().user.memberships
													                .find(m => m.groupType === GroupType.Customer)).group
												this._contactForm.targetGroup = receivingMailbox.group
												this._contactForm.targetGroupInfo = receivingMailbox._id
												this._contactForm.participantGroupInfos = this._participantGroupInfoList.map(groupInfo => groupInfo._id)
												this._contactForm.path = this._path
												this.updateLanguageFromFields(this._language())
												this._contactForm.languages = this._languages

												let p
												if (this._createNew) {
													this._contactForm._id = contactFormIdFromPath
													p = showBuyDialog(BookingItemFeatureType.ContactForm, 1, 0, false)
														.then(accepted => {
															if (accepted) {
																return setup(contactFormsListId, this._contactForm)
																	.then(() => {
																		this._newContactFormIdReceiver(customElementIdFromPath)
																	})
															}
														})
												} else {
													p = update(this._contactForm).then(() => {
														this._newContactFormIdReceiver(customElementIdFromPath)
													})
												}
												return p.then(() => this._close())
											}
										})
									})
								}
							})
						})
					}
				))
		}
	}

	_createLanguageFieldAttrs(): TextFieldAttrs {
		const selectLanguageButton = createDropDownButton("more_label", () => Icons.More, () => {
			const buttons: Array<Button> = this._languages.map(l => {
				return new Button(
					() => getLanguageName(l.code),
					e => this._language(l)
				).setType(ButtonType.Dropdown)
			}).sort((a: Button, b: Button) => a.getLabel().localeCompare(b.getLabel()))
			buttons.push(new Button("addLanguage_action", e => {
				const additionalLanguages = languages.filter(t => {
					if (t.code.endsWith('_sie')) {
						return false
					} else if (this._languages.find(l => l.code === t.code) == null) {
						return true
					}
					return false
				}).map(l => {
					return {name: lang.get(l.textId), value: l.code}
				}).sort((a, b) => a.name.localeCompare(b.name))
				const newLanguageCode: Stream<LanguageCode> = stream(additionalLanguages[0].value)
				const tagName = new DropDownSelector("addLanguage_action", null, additionalLanguages, newLanguageCode, 250)

				setTimeout(() => {
					let addLanguageOkAction = (dialog) => {
						const newLang = createContactFormLanguage()
						newLang.code = newLanguageCode()
						this._languages.push(newLang)
						this._language(newLang)
						dialog.close()
					}

					Dialog.showActionDialog({
						title: lang.get("addLanguage_action"),
						child: {view: () => m(tagName)},
						allowOkWithReturn: true,
						okAction: addLanguageOkAction
					})
				}, DefaultAnimationTime)// wait till the dropdown is hidden
			}).setType(ButtonType.Dropdown))
			return buttons
		}, 250)

		const deleteLanguageButton = new Button('delete_action', () => {
			remove(this._languages, this._language())
			this._language(this._languages[0])
		}, () => Icons.Cancel)

		return {
			label: "language_label",
			value: stream(this._languageDisplayValue),
			disabled: true,
			injectionsRight: () => [m(selectLanguageButton), this._languages.length > 1 ? m(deleteLanguageButton) : null],
		}
	}

	_createPathFieldAttrs(): TextFieldAttrs {
		return {
			label: "urlPath_label",
			value: stream(this._path),
			oninput: (value) => this._path = value,
			helpLabel: () => getContactFormUrl(this._brandingDomain, this._path),
		}
	}

	_createPageTitleAttrs(): TextFieldAttrs {
		return {
			label: "pageTitle_label",
			value: stream(this._pageTitle),
			oninput: (value) => this._pageTitle = value,
		}
	}

	_createReceivingMailboxFieldAttrs(): TextFieldAttrs {
		let userDropdown = createDropDownButton("account_label", () => BootIcons.Contacts, () => {
			return this._allUserGroupInfos.map(gi => new Button(() => getGroupInfoDisplayName(gi), () => {
				this._participantGroupInfoList.length = 0
				this._receivingMailbox(gi)
			}).setType(ButtonType.Dropdown)
			  .setSelected(() => this._receivingMailbox() === gi))
		}, 250)
		let groupsDropdown = null
		if (this._allSharedMailboxGroupInfos.length > 0) {
			groupsDropdown = createDropDownButton("groups_label", () => Icons.People, () => {
				return this._allSharedMailboxGroupInfos.map(gi => new Button(() => getGroupInfoDisplayName(gi), () => this._receivingMailbox(gi))
					.setType(ButtonType.Dropdown)
					.setSelected(() => this._receivingMailbox() === gi))
			}, 250)
		}
		return {
			label: "receivingMailbox_label",
			value: stream(this._receivingMailboxDisplayValue),
			disabled: true,
			injectionsRight: () => (groupsDropdown) ? [m(userDropdown), m(groupsDropdown)] : [m(userDropdown)],
		}
	}

	_createParticipantGroupInfosTableAttrs(): TableAttrs {
		const addParticipantMailGroupButtonAttrs = {
			label: "addResponsiblePerson_label",
			click: () => {
				let availableGroupInfos = this._allUserGroupInfos.filter(g =>
					this._participantGroupInfoList.find(alreadyAdded => isSameId(alreadyAdded._id, g._id)) == null)
				if (availableGroupInfos.length > 0) {
					let dropdown = new DropDownSelector("group_label", null, availableGroupInfos.map(g => {
						return {name: getGroupInfoDisplayName(g), value: g}
					}), stream(availableGroupInfos[0]), 250)
					let addResponsiblePersonOkAction = (dialog) => {
						this._participantGroupInfoList.push(dropdown.selectedValue())
						dialog.close()
					}

					Dialog.showActionDialog({
						title: lang.get("responsiblePersons_label"),
						child: {view: () => m(dropdown)},
						allowOkWithReturn: true,
						okAction: addResponsiblePersonOkAction
					})
				}
			},
			icon: () => Icons.Add,
		}

		const lines = this._participantGroupInfoList.map(groupInfo => {
				const removeButtonAttrs = {
					label: "removeGroup_action",
					click: () => remove(this._participantGroupInfoList, groupInfo),
					icon: () => Icons.Cancel,
				}
				return {cells: [getGroupInfoDisplayName(groupInfo)], actionButtonAttrs: removeButtonAttrs}
			}
		)

		return {
			columnHeading: ["responsiblePersons_label"],
			columnWidths: [ColumnWidth.Largest],
			showActionButtonColumn: true,
			addButtonAttrs: addParticipantMailGroupButtonAttrs,
			lines,
		}
	}
}

/**
 * @param createNew If true creates a new contact form. if c is provided it is taken as template for the new form.
 * @param newContactFormIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
 */
export async function show(c: ?ContactForm, createNew: boolean, newContactFormIdReceiver: (string) => void) {
	const customer = await load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
	const customerInfo = await load(CustomerInfoTypeRef, customer.customerInfo)

	const whitelabelDomain = getWhitelabelDomain(customerInfo)
	if (whitelabelDomain) {
		showProgressDialog("loading_msg", loadAll(GroupInfoTypeRef, customer.userGroups)
			.then(async allUserGroups => {
				const userGroupInfos = allUserGroups.filter(g => !g.deleted)
				// get and separate all enabled shared mail groups and shared team groups
				const groupInfos = await loadAll(GroupInfoTypeRef, customer.teamGroups)
				const sharedMailGroupInfos = groupInfos.filter(g => !g.deleted && g.groupType === GroupType.Mail)
				let editor = new ContactFormEditor(c, createNew, newContactFormIdReceiver, userGroupInfos, sharedMailGroupInfos,
					whitelabelDomain.domain)
				editor.dialog.show()
			}))
	} else {
		Dialog.error("whitelabelDomainNeeded_msg")
	}
}

function getLanguageName(code: string): string {
	return lang.get(neverNull(languages.find(t => t.code === code)).textId)
}
