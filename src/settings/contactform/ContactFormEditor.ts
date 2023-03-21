import m from "mithril"
import { Dialog } from "../../gui/base/Dialog"
import { lang, languages } from "../../misc/LanguageViewModel"
import { BookingItemFeatureType, GroupType, Keys } from "../../api/common/TutanotaConstants"
import { getWhitelabelDomain } from "../../api/common/utils/Utils"
import { clear, mapAndFilterNull, neverNull, ofClass, remove } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"
import type { GroupInfo } from "../../api/entities/sys/TypeRefs.js"
import { CustomerInfoTypeRef, CustomerTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../../api/entities/sys/TypeRefs.js"
import type { TableAttrs, TableLineAttrs } from "../../gui/base/Table.js"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import type { ContactForm, ContactFormLanguage } from "../../api/entities/tutanota/TypeRefs.js"
import {
	ContactFormTypeRef,
	createContactForm,
	createContactFormLanguage,
	CustomerContactFormGroupRootTypeRef,
	MailboxGroupRootTypeRef,
} from "../../api/entities/tutanota/TypeRefs.js"
import { HtmlEditor } from "../../gui/editor/HtmlEditor"
import { Icons } from "../../gui/base/icons/Icons"
import { NotFoundError } from "../../api/common/error/RestError"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import { getContactFormUrl, getDefaultContactFormLanguage } from "./ContactFormUtils"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import type { DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar"
import { windowFacade } from "../../misc/WindowFacade"
import { ButtonType } from "../../gui/base/Button.js"
import { compareGroupInfos, getGroupInfoDisplayName } from "../../api/common/utils/GroupUtils"
import { isSameId, stringToCustomId } from "../../api/common/utils/EntityUtils"
import { showBuyDialog } from "../../subscription/BuyDialog"
import type { TextFieldAttrs } from "../../gui/base/TextField.js"
import { TextField } from "../../gui/base/TextField.js"
import { locator } from "../../api/main/MainLocator"
import { attachDropdown, DropdownChildAttrs } from "../../gui/base/Dropdown.js"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

assertMainOrNode()
// keep in sync with ContactFormAccessor.java
let PATH_PATTERN = /^[a-zA-Z0-9_\\-]+$/

export class ContactFormEditor {
	_createNew: boolean
	_contactForm: ContactForm
	_newContactFormIdReceiver: (arg0: string) => void
	dialog: Dialog
	view: (...args: Array<any>) => any
	_receivingMailbox: Stream<GroupInfo | null>
	_participantGroupInfoList: Array<GroupInfo>
	_headerField: HtmlEditor
	_footerField: HtmlEditor
	_helpField: HtmlEditor
	_language: Stream<ContactFormLanguage>
	_languages: Array<ContactFormLanguage>
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
	constructor(
		c: ContactForm | null,
		createNew: boolean,
		newContactFormIdReceiver: (arg0: string) => void,
		allUserGroupInfos: GroupInfo[],
		allSharedMailboxGroupInfos: GroupInfo[],
		brandingDomain: string,
	) {
		this._createNew = createNew
		this._contactForm = c ? c : createContactForm()
		this._createNew = createNew
		this._newContactFormIdReceiver = newContactFormIdReceiver
		this._allUserGroupInfos = allUserGroupInfos
		this._allSharedMailboxGroupInfos = allSharedMailboxGroupInfos
		this._brandingDomain = brandingDomain

		if (!locator.logins.getUserController().isGlobalAdmin()) {
			let localAdminGroupIds = locator.logins
				.getUserController()
				.getLocalAdminGroupMemberships()
				.map((gm) => gm.group)
			this._allSharedMailboxGroupInfos = allSharedMailboxGroupInfos.filter((gi) => localAdminGroupIds.indexOf(neverNull(gi.localAdmin)) !== -1)
			this._allUserGroupInfos = allUserGroupInfos.filter((gi) => localAdminGroupIds.indexOf(neverNull(gi.localAdmin)) !== -1)
		}

		this._allSharedMailboxGroupInfos.sort(compareGroupInfos)

		this._allUserGroupInfos.sort(compareGroupInfos)

		let selectedTargetGroupInfo =
			this._allSharedMailboxGroupInfos.length > 0
				? this._allSharedMailboxGroupInfos[0]
				: this._allUserGroupInfos.length > 0
				? this._allUserGroupInfos[0]
				: null

		if (this._contactForm.targetGroupInfo) {
			let groupInfo = this._allSharedMailboxGroupInfos.find((groupInfo) => isSameId(neverNull(this._contactForm.targetGroupInfo), groupInfo._id))

			if (!groupInfo) {
				groupInfo = this._allUserGroupInfos.find((groupInfo) => isSameId(neverNull(this._contactForm.targetGroupInfo), groupInfo._id))
			}

			if (groupInfo) {
				selectedTargetGroupInfo = groupInfo
			}
		}

		this._path = this._contactForm.path
		this._receivingMailboxDisplayValue = ""
		this._receivingMailbox = stream(selectedTargetGroupInfo)

		this._receivingMailbox.map((groupInfo) => {
			if (groupInfo) {
				let prefix = (groupInfo.groupType === GroupType.User ? lang.get("account_label") : lang.get("sharedMailbox_label")) + ": "
				this._receivingMailboxDisplayValue = prefix + getGroupInfoDisplayName(groupInfo)
			}
		})

		// remove all groups that do not exist any more
		this._participantGroupInfoList = mapAndFilterNull(this._contactForm.participantGroupInfos, (groupInfoId) =>
			this._allUserGroupInfos.find((g) => isSameId(g._id, groupInfoId)),
		)
		this._languages = this._contactForm.languages.map((l) => Object.assign({}, l))

		if (this._languages.length === 0) {
			let l = createContactFormLanguage()
			l.code = lang.code === "de_sie" ? "de" : lang.code

			this._languages.push(l)
		}

		let previousLanguage: ContactFormLanguage | null = null
		let language = getDefaultContactFormLanguage(this._languages)
		this._language = stream(language)
		this._languageDisplayValue = getLanguageName(this._language().code)
		this._headerField = new HtmlEditor().setModeSwitcher("header_label").setMinHeight(200).showBorders().enableToolbar()

		this._footerField = new HtmlEditor().setModeSwitcher("footer_label").setMinHeight(200).showBorders().enableToolbar()

		this._helpField = new HtmlEditor().setModeSwitcher("helpPage_label").setMinHeight(200).showBorders().enableToolbar()

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
			left: [
				{
					label: "cancel_action",
					click: cancelAction,
					type: ButtonType.Secondary,
				},
			],
			right: [
				{
					label: "save_action",
					click: () => this._save(),
					type: ButtonType.Primary,
				},
			],
			middle: () => lang.get(this._createNew ? "createContactForm_label" : "editContactForm_label"),
		}
		let windowCloseUnsubscribe: () => void

		this.view = () => {
			return m(
				"#contact-editor.pb",
				{
					oncreate: (vnode) => (windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {})),
					onremove: (vnode) => windowCloseUnsubscribe(),
				},
				[
					m(".h4.mt-l", lang.get("emailProcessing_label")),
					this.renderReceiverField(),
					this._receivingMailbox() && neverNull(this._receivingMailbox()).groupType === GroupType.User
						? null
						: m(".mt-l", [m(Table, this._createParticipantGroupInfosTableAttrs()), m(".small", lang.get("responsiblePersonsInfo_msg"))]),
					m(".h4.mt-l", lang.get("display_action")),
					m(TextField, this._createPathFieldAttrs()),
					m(TextField, this._createLanguageFieldAttrs()),
					m(TextField, this._createPageTitleAttrs()),
					m(this._headerField),
					m(this._footerField),
					m(this._helpField),
				],
			)
		}

		this.dialog = Dialog.largeDialog(headerBarAttrs, this)
			.addShortcut({
				key: Keys.ESC,
				exec: cancelAction,
				help: "close_alt",
			})
			.setCloseHandler(cancelAction)
	}

	private renderReceiverField() {
		return m(TextField, {
			label: "receivingMailbox_label",
			value: this._receivingMailboxDisplayValue,
			disabled: true,
			injectionsRight: () =>
				m(".ml-between-s", [this.renderAssignUserButton(), this._allSharedMailboxGroupInfos.length > 0 ? this.renderAssignGroupButton() : null]),
		})
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
			Dialog.message("pleaseEnterValidPath_msg")
		} else {
			// check that the path is unique
			showProgressDialog(
				"pleaseWait_msg",
				locator.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer)).then((customer) => {
					return locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then((root) => {
						const receivingMailbox = this._receivingMailbox()

						if (!receivingMailbox) {
							return Dialog.message("noReceivingMailbox_label")
						}

						let contactFormsListId = root.contactForms
						let customElementIdFromPath = stringToCustomId(this._path)
						let contactFormIdFromPath = [contactFormsListId, customElementIdFromPath] as const
						let samePathFormCheck = Promise.resolve(false)

						// only compare the path if this is a new contact form or it is a different existing contact form
						if (!this._contactForm._id || !isSameId(this._contactForm._id, contactFormIdFromPath)) {
							samePathFormCheck = locator.entityClient
								.load(ContactFormTypeRef, contactFormIdFromPath)
								.then((cf) => true)
								.catch(ofClass(NotFoundError, (e) => false))
						}

						return samePathFormCheck.then((samePathForm) => {
							if (samePathForm) {
								return Dialog.message("pathAlreadyExists_msg")
							} else {
								// check if the target mail group is already referenced by a different contact form
								return locator.entityClient
									.load(GroupTypeRef, receivingMailbox.group)
									.then((group) => {
										if (group.user) {
											return locator.entityClient.load(UserTypeRef, group.user).then((user) => {
												return neverNull(user.memberships.find((m) => m.groupType === GroupType.Mail)).group
											})
										} else {
											return group._id
										}
									})
									.then((mailGroupId) => {
										return locator.entityClient.load(MailboxGroupRootTypeRef, mailGroupId).then((mailboxGroupRoot) => {
											let contactFormIdToCheck = this._createNew ? contactFormIdFromPath : this._contactForm._id

											if (
												mailboxGroupRoot.targetMailGroupContactForm &&
												!isSameId(mailboxGroupRoot.targetMailGroupContactForm, contactFormIdToCheck)
											) {
												return Dialog.message("receivingMailboxAlreadyUsed_msg")
											} else {
												this._contactForm._ownerGroup = neverNull(
													locator.logins.getUserController().user.memberships.find((m) => m.groupType === GroupType.Customer),
												).group
												this._contactForm.targetGroup = receivingMailbox.group
												this._contactForm.targetGroupInfo = receivingMailbox._id
												this._contactForm.participantGroupInfos = this._participantGroupInfoList.map((groupInfo) => groupInfo._id)
												this._contactForm.path = this._path
												this.updateLanguageFromFields(this._language())
												this._contactForm.languages = this._languages
												let p

												if (this._createNew) {
													this._contactForm._id = contactFormIdFromPath
													p = showBuyDialog({
														featureType: BookingItemFeatureType.ContactForm,
														count: 1,
														freeAmount: 0,
														reactivate: false,
													}).then((accepted) => {
														if (accepted) {
															return locator.entityClient.setup(contactFormsListId, this._contactForm).then(() => {
																this._newContactFormIdReceiver(customElementIdFromPath)
															})
														}
													})
												} else {
													p = locator.entityClient.update(this._contactForm).then(() => {
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
				}),
			)
		}
	}

	_createLanguageFieldAttrs(): TextFieldAttrs {
		const selectLanguageButtonAttrs = attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				size: ButtonSize.Compact,
			},
			childAttrs: () => {
				const childAttrs: Array<DropdownChildAttrs> = this._languages
					.map((lang) => ({
						label: () => getLanguageName(lang.code),
						click: () => this._language(lang),
					}))
					.sort((a, b) => a.label().localeCompare(b.label()))

				childAttrs.push({
					label: "addLanguage_action",
					click: () => {
						const additionalLanguages = languages
							.filter((t) => {
								if (t.code.endsWith("_sie")) {
									return false
								} else if (this._languages.find((l) => l.code === t.code) == null) {
									return true
								}

								return false
							})
							.map((l) => {
								return {
									name: lang.get(l.textId),
									value: l.code,
								}
							})
							.sort((a, b) => a.name.localeCompare(b.name))

						let newLanguageCode = additionalLanguages[0].value
						setTimeout(() => {
							const addLanguageOkAction = (dialog: Dialog) => {
								const newLang = createContactFormLanguage()
								newLang.code = newLanguageCode
								this._languages.push(newLang)
								this._language(newLang)
								dialog.close()
							}

							Dialog.showActionDialog({
								title: lang.get("addLanguage_action"),
								child: {
									view: () =>
										m(DropDownSelector, {
											label: "addLanguage_action",
											items: additionalLanguages,
											selectedValue: newLanguageCode,
											selectionChangedHandler: (value: string) => (newLanguageCode = value),
											dropdownWidth: 250,
										}),
								},
								allowOkWithReturn: true,
								okAction: addLanguageOkAction,
							})
						}, DefaultAnimationTime) // wait till the dropdown is hidden
					},
				})

				return childAttrs
			},
			width: 250,
		})

		return {
			label: "language_label",
			value: this._languageDisplayValue,
			disabled: true,
			injectionsRight: () =>
				m(".flex.ml-between-s", [
					m(IconButton, selectLanguageButtonAttrs),
					this._languages.length > 1
						? m(IconButton, {
								title: "delete_action",
								click: () => {
									remove(this._languages, this._language())

									this._language(this._languages[0])
								},
								icon: Icons.Cancel,
								size: ButtonSize.Compact,
						  })
						: null,
				]),
		}
	}

	_createPathFieldAttrs(): TextFieldAttrs {
		return {
			label: "urlPath_label",
			value: this._path,
			oninput: (value) => (this._path = value),
			helpLabel: () => getContactFormUrl(this._brandingDomain, this._path),
		}
	}

	_createPageTitleAttrs(): TextFieldAttrs {
		return {
			label: "pageTitle_label",
			value: this._pageTitle,
			oninput: (value) => (this._pageTitle = value),
		}
	}

	private renderAssignGroupButton() {
		return m(
			IconButton,
			attachDropdown({
				mainButtonAttrs: {
					title: "groups_label",
					icon: Icons.People,
					size: ButtonSize.Compact,
				},
				childAttrs: () =>
					this._allSharedMailboxGroupInfos.map((gi) => ({
						label: () => getGroupInfoDisplayName(gi),
						click: () => this._receivingMailbox(gi),
						isSelected: () => this._receivingMailbox() === gi,
					})),

				width: 250,
			}),
		)
	}

	private renderAssignUserButton() {
		return m(
			IconButton,
			attachDropdown({
				mainButtonAttrs: {
					title: "account_label",
					icon: BootIcons.Contacts,
					size: ButtonSize.Compact,
				},
				childAttrs: () =>
					this._allUserGroupInfos.map((gi) => ({
						label: () => getGroupInfoDisplayName(gi),
						click: () => {
							clear(this._participantGroupInfoList)

							this._receivingMailbox(gi)
						},
						isSelected: () => this._receivingMailbox() === gi,
					})),
				width: 250,
			}),
		)
	}

	_createParticipantGroupInfosTableAttrs(): TableAttrs {
		const addParticipantMailGroupButtonAttrs: IconButtonAttrs = {
			title: "addResponsiblePerson_label",
			icon: Icons.Add,
			size: ButtonSize.Compact,
			click: () => {
				let availableGroupInfos = this._allUserGroupInfos.filter(
					(g) => this._participantGroupInfoList.find((alreadyAdded) => isSameId(alreadyAdded._id, g._id)) == null,
				)

				if (availableGroupInfos.length > 0) {
					let selectedGroupInfo = availableGroupInfos[0]

					const dropdownItems = availableGroupInfos.map((g) => {
						return {
							name: getGroupInfoDisplayName(g),
							value: g,
						}
					})

					Dialog.showActionDialog({
						title: lang.get("responsiblePersons_label"),
						child: {
							view: () =>
								m(DropDownSelector, {
									label: "group_label",
									items: dropdownItems,
									selectedValue: selectedGroupInfo,
									selectionChangedHandler: (value: GroupInfo) => (selectedGroupInfo = value),
									dropdownWidth: 250,
								}),
						},
						allowOkWithReturn: true,
						okAction: (dialog: Dialog) => {
							this._participantGroupInfoList.push(selectedGroupInfo)
							dialog.close()
						},
					})
				}
			},
		} as const

		const lines: TableLineAttrs[] = this._participantGroupInfoList.map((groupInfo) => {
			return {
				cells: [getGroupInfoDisplayName(groupInfo)],
				actionButtonAttrs: {
					title: "removeGroup_action",
					click: () => remove(this._participantGroupInfoList, groupInfo),
					icon: Icons.Cancel,
					size: ButtonSize.Compact,
				},
			}
		})

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
export async function show(c: ContactForm | null, createNew: boolean, newContactFormIdReceiver: (arg0: string) => void) {
	const customer = await locator.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
	const customerInfo = await locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
	const whitelabelDomain = getWhitelabelDomain(customerInfo)

	if (whitelabelDomain) {
		showProgressDialog(
			"loading_msg",
			locator.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups).then(async (allUserGroups) => {
				const userGroupInfos = allUserGroups.filter((g) => !g.deleted)
				// get and separate all enabled shared mail groups and shared team groups
				const groupInfos = await locator.entityClient.loadAll(GroupInfoTypeRef, customer.teamGroups)
				const sharedMailGroupInfos = groupInfos.filter((g) => !g.deleted && g.groupType === GroupType.Mail)
				let editor = new ContactFormEditor(c, createNew, newContactFormIdReceiver, userGroupInfos, sharedMailGroupInfos, whitelabelDomain.domain)
				editor.dialog.show()
			}),
		)
	} else {
		Dialog.message("whitelabelDomainNeeded_msg")
	}
}

function getLanguageName(code: string): string {
	return lang.get(neverNull(languages.find((t) => t.code === code)).textId)
}
