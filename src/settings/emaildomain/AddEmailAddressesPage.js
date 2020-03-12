//@flow
import {SelectMailAddressForm} from "../SelectMailAddressForm"
import {logins} from "../../api/main/LoginController"
import m from "mithril"
import {addAlias, getAliasLineAttrs, updateNbrOfAliases} from "../EditAliasesFormN"
import type {AddDomainData} from "./AddDomainWizard"
import type {EntityEventsListener} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {load, loadAll} from "../../api/main/Entity"
import {GroupInfoTypeRef} from "../../api/entities/sys/GroupInfo"
import {OperationType} from "../../api/common/TutanotaConstants"
import {isSameId} from "../../api/common/EntityFunctions"
import {downcast, neverNull} from "../../api/common/utils/Utils"
import {Dialog} from "../../gui/base/Dialog"
import {locator} from "../../api/main/MainLocator"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import {lang} from "../../misc/LanguageViewModel"
import {Icons} from "../../gui/base/icons/Icons"
import type {TableAttrs} from "../../gui/base/TableN"
import {ColumnWidth, TableN} from "../../gui/base/TableN"
import {theme} from "../../gui/theme"
import type {WizardPageAttrs, WizardPageN} from "../../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../../gui/base/WizardDialogN"
import {assertMainOrNode} from "../../api/Env"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"

assertMainOrNode()

export class AddEmailAddressesPage implements WizardPageN<AddDomainData> {

	_entityEventListener: ?EntityEventsListener

	oncreate(vnode: Vnode<WizardPageAttrs<AddDomainData>>) {
		const wizardAttrs = vnode.attrs
		this._entityEventListener = (updates) => {
			updates.forEach((update) => {
				const {instanceListId, instanceId, operation} = update
				if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE
					&& isSameId(logins.getUserController().userGroupInfo._id, [neverNull(instanceListId), instanceId])) {
					load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then(groupInfo => {
						wizardAttrs.data.editAliasFormAttrs.userGroupInfo = groupInfo
						m.redraw()
					})
				}
			})
		}
		locator.eventController.addEntityListener(this._entityEventListener)

		const addAliasButtonAttrs = {
			label: "addEmailAlias_label",
			icon: () => Icons.Checkmark,
			click: () => {
				const error = wizardAttrs.data.emailAliasInput.getErrorMessageId()
				if (error) {
					Dialog.error(error)
				} else {
					addAlias(wizardAttrs.data.editAliasFormAttrs, wizardAttrs.data.emailAliasInput.getCleanMailAddress())
						.then(() => wizardAttrs.data.emailAliasInput._username(""))
				}
			},
		}
		wizardAttrs.data.emailAliasInput = new SelectMailAddressForm([wizardAttrs.data.domain()], addAliasButtonAttrs)
		updateNbrOfAliases(wizardAttrs.data.editAliasFormAttrs)

	}

	onremove() {
		if (this._entityEventListener) {
			locator.eventController.removeEntityListener(this._entityEventListener)
		}
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>) {
		const a = vnode.attrs
		const aliasesTableAttrs: TableAttrs = {
			columnWidths: [ColumnWidth.Largest],
			showActionButtonColumn: true,
			addButtonAttrs: null,
			lines: getAliasLineAttrs(a.data.editAliasFormAttrs).map((row) => {
				return {
					actionButtonAttrs: row.actionButtonAttrs,
					cells: () => [{main: row.cells[0], info: [row.cells[1]]}]
				}
			}),
		}

		const addUsersDialogAttrs = {
			title: lang.get("addUsers_title"),
			child: {
				view: () => {
					return [
						m("p", lang.get("userManagementRedirect_msg")),
					]
				}
			},
			okAction: (confirmationDialog) => {
				m.route.set("/settings/users")
				confirmationDialog.close()
				emitWizardEvent(vnode.dom, WizardEventType.CLOSEDIALOG)
			}
		}

		return m("", [
			m("h4.mt-l.text-center", lang.get("addCustomDomainAddresses_title")),
			m(".mt.mb", lang.get("addCustomDomainAdresses_msg")),
			m(".h4.mt", lang.get("emailAlias_label")),
			m(".mt", lang.get("addCustomDomainAliases_msg")),
			m(a.data.emailAliasInput),
			m(".small.left", (a.data.editAliasFormAttrs.aliasCount.availableToCreate === 0) ?
				lang.get("adminMaxNbrOfAliasesReached_msg")
				: lang.get('mailAddressAliasesMaxNbr_label', {'{1}': a.data.editAliasFormAttrs.aliasCount.availableToCreate})),
			logins.getUserController().userGroupInfo.mailAddressAliases.length ? m(TableN, aliasesTableAttrs) : null,
			m(".h4.mt", lang.get("bookingItemUsers_label")),
			m(".mt", [
				lang.get("addCustomDomainUsers_msg"),
				" ",
				m("span.nav-button", {
						style: {
							color: theme.content_accent
						},
						onclick: (e) => {
							Dialog.showActionDialog(addUsersDialogAttrs)
						}
					},
					lang.get("adminUserList_action"))
			]),
			m(".flex-center.full-width.pt-l.mb-l", m("", {style: {width: "260px"}}, m(ButtonN, {
				type: ButtonType.Login,
				label: "next_action",
				click: () => emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
			})))
		])
	}
}

export class AddEmailAddressesPageAttrs implements WizardPageAttrs<AddDomainData> {

	data: AddDomainData

	constructor(domainData: AddDomainData) {
		this.data = domainData
	}

	headerTitle() {
		return lang.get("domainSetup_title")
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		let aliases = logins.getUserController().userGroupInfo.mailAddressAliases.filter((alias) => alias.mailAddress.endsWith(`@${this.data.domain()}`))
		if (aliases.length) {
			return Promise.resolve(true)
		} else {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then((customer) => {
				return loadAll(GroupInfoTypeRef, customer.userGroups).then((allUserGroupInfos) => {
					if (allUserGroupInfos.filter(u => downcast(u.mailAddress).endsWith("@" + this.data.domain())
						|| u.mailAddressAliases.filter((a) => downcast(a.mailAddress).endsWith("@"
							+ this.data.domain())).length).length) {
						return true
					} else if (showErrorDialog) {
						const message = "enforceAliasSetup_msg"
						return showErrorDialog ? Dialog.error(message).then(() => false) : false
					} else {
						return false
					}
				})
			})
		}
	}

	isSkipAvailable(): boolean {return true}

	isEnabled(): boolean {return true}
}

