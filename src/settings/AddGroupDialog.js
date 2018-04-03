// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {GroupType, BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {getGroupTypeName} from "./GroupViewer"
import * as AddUserDialog from "./AddUserDialog"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import * as BuyDialog from "../subscription/BuyDialog"
import {logins} from "../api/main/LoginController"

assertMainOrNode()

export function show(): Promise<void> {
	return AddUserDialog.getAvailableDomains().then(availableDomains => {

		let groupTypes = logins.getUserController().isGlobalAdmin() ? [GroupType.Mail, GroupType.LocalAdmin] : [GroupType.Mail]
		let typeField = new DropDownSelector("groupType_label", null, groupTypes.map(t => {
			return {name: getGroupTypeName(t), value: t}
		}), GroupType.Mail)

		let nameField = new TextField("name_label")
		let mailAddressForm = new SelectMailAddressForm(availableDomains)
		let form = {
			view: () => {
				return [
					m(typeField),
					m(nameField),
					(typeField.selectedValue() == GroupType.Mail) ? m(mailAddressForm) : m(""),
				]
			}
		}

		return Dialog.smallDialog(lang.get("addGroup_label"), form, () => {
			if (typeField.selectedValue() == GroupType.Mail) {
				return mailAddressForm.getErrorMessageId()
			} else if (typeField.selectedValue() == GroupType.Team && nameField.value().trim() == "") {
				return "enterName_msg"
			} else {
				return null
			}
		}).then(okClicked => {
			if (okClicked) {
				if (typeField.selectedValue() == GroupType.Mail) {
					return showProgressDialog("pleaseWait_msg", BuyDialog.show(BookingItemFeatureType.SharedMailGroup, 1, 0, false).then(accepted => {
						if (accepted) {
							return worker.createMailGroup(nameField.value(), mailAddressForm.getCleanMailAddress())
						}
					}))
				} else if (typeField.selectedValue() == GroupType.LocalAdmin) {
					return showProgressDialog("pleaseWait_msg", BuyDialog.show(BookingItemFeatureType.LocalAdminGroup, 1, 0, false).then(accepted => {
						if (accepted) {
							return worker.createLocalAdminGroup(nameField.value())
						}
					}))
				}
			}
		})
	})
}