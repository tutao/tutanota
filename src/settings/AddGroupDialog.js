// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import type {GroupTypeEnum} from "../api/common/TutanotaConstants"
import {BookingItemFeatureType, FeatureType, GroupType} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {getGroupTypeName} from "./GroupViewer"
import * as AddUserDialog from "./AddUserDialog"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import * as BuyDialog from "../subscription/BuyDialog"
import {logins} from "../api/main/LoginController"
import {lang} from "../misc/LanguageViewModel"

assertMainOrNode()

export function show() {
	if (getAvailableGroupTypes().length === 0) {
		Dialog.error("selectionNotAvailable_msg")
	} else {
		AddUserDialog.getAvailableDomains().then(availableDomains => {

			let groupTypes = getAvailableGroupTypes()
			let typeField = new DropDownSelector("groupType_label", null, groupTypes.map(t => {
				return {name: getGroupTypeName(t), value: t}
			}), groupTypes[0])
			let nameField = new TextField("name_label")
			let mailAddressForm = new SelectMailAddressForm(availableDomains)
			let form = {
				view: () => {
					return [
						m(typeField),
						m(nameField),
						(typeField.selectedValue() === GroupType.Mail) ? m(mailAddressForm) : m(""),
					]
				}
			}
			let addGroupOkAction = (dialog) => {
				if (typeField.selectedValue() === GroupType.Mail) {
					showProgressDialog("pleaseWait_msg", BuyDialog.show(BookingItemFeatureType.SharedMailGroup, 1, 0, false)
					                                              .then(accepted => {
						                                              if (accepted) {
							                                              dialog.close()
							                                              return worker.createMailGroup(nameField.value(), mailAddressForm.getCleanMailAddress())
						                                              }
					                                              }))
				} else if (typeField.selectedValue() === GroupType.LocalAdmin) {
					showProgressDialog("pleaseWait_msg", BuyDialog.show(BookingItemFeatureType.LocalAdminGroup, 1, 0, false)
					                                              .then(accepted => {
						                                              if (accepted) {
							                                              dialog.close()
							                                              return worker.createLocalAdminGroup(nameField.value())
						                                              }
					                                              }))
				}
			}

			Dialog.showActionDialog({
				title: lang.get("addGroup_label"),
				child: form,
				validator: () => _validateAddGroupInput(typeField.selectedValue(), nameField.value(), mailAddressForm),
				okAction: addGroupOkAction
			})
		})
	}
}

function _validateAddGroupInput(type: string, name: string, mailAddressForm: SelectMailAddressForm): ?string {
	if (type === GroupType.Mail) {
		return mailAddressForm.getErrorMessageId()
	} else if (type === GroupType.Team && name.trim() === "") {
		return "enterName_msg"
	} else {
		return null
	}
}

function getAvailableGroupTypes(): GroupTypeEnum[] {
	if (logins.isEnabled(FeatureType.WhitelabelChild)) {
		return []
	} else if (logins.isProdDisabled()) {
		return logins.getUserController().isGlobalAdmin() ? [GroupType.LocalAdmin] : []
	} else {
		return logins.getUserController().isGlobalAdmin() ? [GroupType.Mail, GroupType.LocalAdmin] : [GroupType.Mail]
	}
}