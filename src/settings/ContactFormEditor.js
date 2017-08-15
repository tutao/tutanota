// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {Button, ButtonType} from "../gui/base/Button"
import {TextField} from "../gui/base/TextField"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import {GroupType} from "../api/common/TutanotaConstants"
import {load, loadAll, update, setup} from "../api/main/Entity"
import {neverNull, getGroupInfoDisplayName} from "../api/common/utils/Utils"
import {assertMainOrNode} from "../api/Env"
import {windowFacade} from "../misc/WindowFacade"
import {logins} from "../api/main/LoginController"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {isSameId, stringToCustomId, GENERATED_MIN_ID} from "../api/common/EntityFunctions"
import {Table, ColumnWidth} from "../gui/base/Table"
import TableLine from "../gui/base/TableLine"
import {createContactForm, ContactFormTypeRef} from "../api/entities/tutanota/ContactForm"
import {remove, mapAndFilterNull} from "../api/common/utils/ArrayUtils"
import {statisticsFieldTypeToString, getContactFormUrl} from "./ContactFormViewer"
import * as AddStatisticsFieldDialog from "./AddStatisticsFieldDialog"
import {HtmlEditor} from "../gui/base/HtmlEditor"
import {Icons} from "../gui/base/icons/Icons"
import {CustomerContactFormGroupRootTypeRef} from "../api/entities/tutanota/CustomerContactFormGroupRoot"
import {NotFoundError} from "../api/common/error/RestError"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {UserTypeRef} from "../api/entities/sys/User"

assertMainOrNode()

// keep in sync with ContactFormAccessor.java
let PATH_PATTERN = /^[a-zA-Z0-9_\\-]+$/

export class ContactFormEditor {
	_createNew: boolean;
	_contactForm: ContactForm;
	_newContactFormIdReceiver: Function

	dialog: Dialog;
	view: Function;

	_pageTitleField: TextField;
	_pathField: TextField;
	_mailGroupField: DropDownSelector<GroupInfo>;
	_participantGroupInfoList: GroupInfo[];
	_participantGroupInfosTable: Table;
	_headerField: HtmlEditor;
	_footerField: HtmlEditor;
	_helpField: HtmlEditor;
	_statisticsFields: InputField[];
	_statisticsFieldsTable: Table;

	/**
	 * This constructor is only used internally. See show() for the external interface.
	 */
	constructor(c: ?ContactForm, createNew: boolean, newContactFormIdReceiver: Function, userGroupInfos: GroupInfo[], sharedMailGroupInfos: GroupInfo[], brandingDomain: string) {
		this._createNew = createNew
		this._contactForm = c ? c : createContactForm()
		this._newContactFormIdReceiver = newContactFormIdReceiver
		let allGroupInfos = userGroupInfos.concat(sharedMailGroupInfos)

		this._pageTitleField = new TextField("pageTitle_label").setValue(this._contactForm.pageTitle)
		this._pathField = new TextField("urlPath_label", () => getContactFormUrl(brandingDomain, this._pathField.value())).setValue(this._contactForm.path)

		let selectedTargetGroupInfo = allGroupInfos[0]
		if (this._contactForm.targetGroupInfo) {
			let groupInfo = allGroupInfos.find(groupInfo => isSameId(neverNull(this._contactForm.targetGroupInfo), groupInfo._id))
			if (groupInfo) {
				selectedTargetGroupInfo = groupInfo
			}
		}
		this._mailGroupField = new DropDownSelector("receivingMailbox_label", null, allGroupInfos.map(g => {
			return {name: getGroupInfoDisplayName(g), value: g}
		}), selectedTargetGroupInfo, 250)

		// remove all groups that do not exist any more
		this._participantGroupInfoList = mapAndFilterNull(this._contactForm.participantGroupInfos, groupInfoId => allGroupInfos.find(g => isSameId(g._id, groupInfoId)))
		let addParticipantMailGroupButton = new Button("addParticipant_label", () => {
			let availableGroupInfos = allGroupInfos.filter(g => this._participantGroupInfoList.find(alreadyAdded => isSameId(alreadyAdded._id, g._id)) == null)
			if (availableGroupInfos.length > 0) {
				let d = new DropDownSelector("group_label", null, availableGroupInfos.map(g => {
					return {name: getGroupInfoDisplayName(g), value: g}
				}), availableGroupInfos[0], 250)
				return Dialog.smallDialog(lang.get("addParticipant_label"), {
					view: () => m(d)
				}, null).then(ok => {
					if (ok) {
						this._participantGroupInfoList.push(d.selectedValue())
						this._updateParticipantGroupInfosTable()
					}
				})
			}
		}, () => Icons.Add)
		this._participantGroupInfosTable = new Table(["participants_label"], [ColumnWidth.Largest], true, addParticipantMailGroupButton)
		this._updateParticipantGroupInfosTable()

		this._headerField = new HtmlEditor("header_label").setValue(this._contactForm.headerHtml)
		this._footerField = new HtmlEditor("footer_label").setValue(this._contactForm.footerHtml)
		this._helpField = new HtmlEditor("helpPage_label").setValue(this._contactForm.helpHtml)

		this._statisticsFields = this._contactForm.statisticsFields.slice()
		let addStatisticsFieldButton = new Button("addStatisticsField_action", () => AddStatisticsFieldDialog.show().then(inputField => {
			if (inputField) {
				this._statisticsFields.push(inputField)
				this._updateStatisticsFieldTable()
			}
		}), () => Icons.Add)
		this._statisticsFieldsTable = new Table(["name_label", "type_label"], [ColumnWidth.Largest, ColumnWidth.Largest], true, addStatisticsFieldButton)
		this._updateStatisticsFieldTable()

		let headerBar = new DialogHeaderBar()
			.addLeft(new Button('cancel_action', () => this._close()).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get(this._createNew ? "createContactForm_label" : "editContactForm_label"))
			.addRight(new Button('save_action', () => this._save()).setType(ButtonType.Primary))
		this.view = () => m("#contact-editor.pb", [
			m(".h4.mt-l", lang.get("emailProcessing_label")),
			m(".wrapping-row", [
				m(this._mailGroupField),
			]),
			m(".mt-l", [
				m(this._participantGroupInfosTable),
				m(".small", lang.get("participantsInfo_msg"))
			]),
			m(".h4.mt-l", lang.get("display_action")),
			m(this._pathField),
			m(this._pageTitleField),
			m(this._headerField),
			m(this._footerField),
			m(this._helpField),
			m(".h4.mt-l", lang.get("statisticsFields_label")),
			m(this._statisticsFieldsTable)
		])
		this.dialog = Dialog.largeDialog(headerBar, this)
	}

	_updateStatisticsFieldTable() {
		this._statisticsFieldsTable.updateEntries(this._statisticsFields.map(field => {
			let removeButton = new Button("removeStatisticsField_action", () => {
				remove(this._statisticsFields, field)
				this._updateStatisticsFieldTable()
			}, () => Icons.Cancel)
			return new TableLine([field.name, statisticsFieldTypeToString(field)], removeButton)
		}))
	}

	_updateParticipantGroupInfosTable() {
		this._participantGroupInfosTable.updateEntries(this._participantGroupInfoList.map(groupInfo => {
			let removeButton = new Button("removeGroup_action", () => {
				remove(this._participantGroupInfoList, groupInfo)
				this._updateParticipantGroupInfosTable()
			}, () => Icons.Cancel)
			return new TableLine([getGroupInfoDisplayName(groupInfo)], removeButton)
		}))
	}

	_close() {
		windowFacade.checkWindowClosing(false)
		this.dialog.close()
	}

	_save() {
		if (!PATH_PATTERN.test(this._pathField.value())) {
			Dialog.error("pleaseEnterValidPath_msg")
		} else {
			// check that the path is unique
			load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
					load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(root => {
						let contactFormsListId = root.contactForms
						let customElementIdFromPath = stringToCustomId(this._pathField.value())
						let contactFormIdFromPath = [contactFormsListId, customElementIdFromPath]
						let samePathFormCheck = Promise.resolve(false)
						// only compare the path if this is a new contact form or it is a different existing contact form
						if (!this._contactForm._id || !isSameId(this._contactForm._id, contactFormIdFromPath)) {
							samePathFormCheck = load(ContactFormTypeRef, contactFormIdFromPath).then(cf => true).catch(NotFoundError, e => false)
						}
						samePathFormCheck.then(samePathForm => {
							if (samePathForm) {
								return Dialog.error("pathAlreadyExists_msg")
							} else {
								// check if the target mail group is already referenced by a different contact form
								load(GroupTypeRef, this._mailGroupField.selectedValue().group).then(group => {
									if (group.user) {
										return load(UserTypeRef, group.user).then(user => {
											return neverNull(user.memberships.find(m => m.groupType == GroupType.Mail)).group
										})
									} else {
										return group._id
									}
								}).then(mailGroupId => {
									load(MailboxGroupRootTypeRef, mailGroupId).then(mailboxGroupRoot => {
										let contactFormIdToCheck = (this._createNew) ? contactFormIdFromPath : this._contactForm._id
										if (mailboxGroupRoot.targetMailGroupContactForm && !isSameId(mailboxGroupRoot.targetMailGroupContactForm, contactFormIdToCheck)) {
											return Dialog.error("receivingMailboxAlreadyUsed_msg")
										} else {
											this._contactForm._ownerGroup = neverNull(logins.getUserController().user.memberships.find(m => m.groupType === GroupType.Admin)).group
											this._contactForm.targetGroupInfo = this._mailGroupField.selectedValue()._id
											this._contactForm.participantGroupInfos = this._participantGroupInfoList.map(groupInfo => groupInfo._id)
											this._contactForm.path = this._pathField.value()
											this._contactForm.pageTitle = this._pageTitleField.value()
											this._contactForm.headerHtml = this._headerField.value()
											this._contactForm.footerHtml = this._footerField.value()
											this._contactForm.helpHtml = this._helpField.value()
											this._contactForm.statisticsFields = this._statisticsFields
											this._contactForm.targetMailGroup_removed = GENERATED_MIN_ID; // legacy, should be removed in future

											let p
											if (this._createNew) {
												this._contactForm._id = contactFormIdFromPath
												p = setup(contactFormsListId, this._contactForm).then(contactFormId => {
													this._newContactFormIdReceiver(customElementIdFromPath)
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
			)
		}
	}
}

/**
 * @param createNew If true creates a new contact form. if c is provided it is taken as template for the new form.
 * @param newContactFormIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
 */
export function show(c: ?ContactForm, createNew: boolean, brandingDomain: string, newContactFormIdReceiver: Function) {
	Dialog.progress("loading_msg", load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
		// collect all enabled user mail groups together with the users name and the users mail address
		return loadAll(GroupInfoTypeRef, customer.userGroups).filter(g => !g.deleted).then(userGroupInfos => {
			// get and separate all enabled shared mail groups and shared team groups
			return loadAll(GroupInfoTypeRef, customer.teamGroups).filter(g => !g.deleted).filter(teamGroupInfo => {
				return load(GroupTypeRef, teamGroupInfo.group).then(teamGroup => {
					return teamGroup.type == GroupType.Mail
				})
			}).then(sharedMailGroupInfos => {
				let editor = new ContactFormEditor(c, createNew, newContactFormIdReceiver, userGroupInfos, sharedMailGroupInfos, brandingDomain)
				editor.dialog.show()
				windowFacade.checkWindowClosing(true)
			})
		})
	}))
}
