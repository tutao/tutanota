// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {TextField} from "../gui/base/TextField"
import type {GroupTypeEnum} from "../api/common/TutanotaConstants"
import {BookingItemFeatureType, FeatureType, GroupType} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {getGroupTypeName} from "./GroupViewer"
import * as AddUserDialog from "./AddUserDialog"
import {showProgressDialog} from "../gui/ProgressDialog"
import {logins} from "../api/main/LoginController"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {showBuyDialog} from "../subscription/BuyDialog"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {showBusinessFeatureRequiredDialog} from "../misc/SubscriptionDialogs"
import {TemplateGroupPreconditionFailedReason} from "../sharing/GroupUtils"

assertMainOrNode()

const BUSINESS_FEATURE_REQUIRED = "templategroup.business_feature_required"

export function show() {
	if (getAvailableGroupTypes().length === 0) {
		Dialog.error("selectionNotAvailable_msg")
	} else {
		AddUserDialog.getAvailableDomains().then(availableDomains => {

			let groupTypes = getAvailableGroupTypes()
			let typeField = new DropDownSelector("groupType_label", null, groupTypes.map(t => {
				return {name: getGroupTypeName(t), value: t}
			}), stream(groupTypes[0]))
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
					showProgressDialog("pleaseWait_msg", showBuyDialog(BookingItemFeatureType.SharedMailGroup, 1, 0, false)
						.then(accepted => {
							if (accepted) {
								dialog.close()
								return worker.createMailGroup(nameField.value(), mailAddressForm.getCleanMailAddress())
							}
						}))
				} else if (typeField.selectedValue() === GroupType.LocalAdmin) {
					showProgressDialog("pleaseWait_msg", showBuyDialog(BookingItemFeatureType.LocalAdminGroup, 1, 0, false)
						.then(accepted => {
							if (accepted) {
								dialog.close()
								return worker.createLocalAdminGroup(nameField.value())
							}
						}))
				} else if (typeField.selectedValue() === GroupType.Template) {
					addTemplateGroup(nameField.value()).then(success => {
						if (success) {
							dialog.close()
						}
					})
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

function _validateAddGroupInput(type: string, name: string, mailAddressForm: ?SelectMailAddressForm): ?TranslationKey {
	if (type === GroupType.Mail && mailAddressForm) {
		return mailAddressForm.getErrorMessageId()
	} else if (type === GroupType.MailingList && name.trim() === "") {
		return "enterName_msg"
	} else if (type === GroupType.Template && name.trim() === "") {
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


/**
 * @returns {Promise<boolean>} true if group was added, false otherwise
 */
function addTemplateGroup(name: string): Promise<boolean> {
	return showProgressDialog("pleaseWait_msg",
		worker.createTemplateGroup(name)
		      .then(() => true)
		      .catch(PreconditionFailedError, (e) => {
			      if (e.data === TemplateGroupPreconditionFailedReason.BUSINESS_FEATURE_REQUIRED) {
				      showBusinessFeatureRequiredDialog("businessFeatureRequiredGeneral_msg")
			      } else {
				      Dialog.error(() => e.message)
			      }
			      return false
		      }))
}
