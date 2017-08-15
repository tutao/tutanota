// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {TextField} from "../gui/base/TextField"
import {getSpamRuleTypeNameMapping} from "./GlobalSettingsViewer"
import {isDomainName, isMailAddress} from "../misc/Formatter"
import {SpamRuleType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {contains} from "../api/common/utils/ArrayUtils"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {load} from "../api/main/Entity"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {logins} from "../api/main/LoginController"

assertMainOrNode()

export function show() {
	let existingSpamRules: ?EmailSenderListElement[] = null
	let customDomains: ?string[]
	worker.loadCustomerServerProperties().then(props => {
		existingSpamRules = props.emailSenderList
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
				customDomains = customerInfo.domainInfos.map(d => d.domain)
				m.redraw()
			})
		})
	})

	let typeField = new DropDownSelector("emailSenderRule_label", null, getSpamRuleTypeNameMapping(), getSpamRuleTypeNameMapping()[0].value)
	let valueField = new TextField("emailSender_label", () => lang.get(_getInputInvalidMessage(typeField.selectedValue(), valueField.value(), existingSpamRules, customDomains) || "emptyString_msg"))
	let form = {
		view: () => {
			return [
				m(typeField),
				m(valueField)
			]
		}
	}
	return Dialog.smallDialog(lang.get("addSpamRule_action"), form, () => _getInputInvalidMessage(typeField.selectedValue(), valueField.value(), existingSpamRules, customDomains)).then(okClicked => {
		if (okClicked) {
			worker.addSpamRule(typeField.selectedValue(), valueField.value())
		}
	})
}

function _getInputInvalidMessage(type: NumberString, value: string, existingRules: ?EmailSenderListElement[], customDomains: ?string[]): ?string {
	let currentValue = value.toLowerCase().trim()

	if (!existingRules || !customDomains || currentValue == "") {
		return "emptyString_msg"
	} else if (!isDomainName(currentValue) && !isMailAddress(currentValue, false)) {
		return "invalidInputFormat_msg"
	} else if (_isInvalidRule(type, currentValue, customDomains)) {
		return "emailSenderInvalidRule_msg"
	} else if (existingRules.find(r => r.value == currentValue) != null) {
		return "emailSenderExistingRule_msg"
	}
	return null
}


function _isInvalidRule(type: NumberString, value: string, customDomains: string[]): boolean {
	if (type != SpamRuleType.WHITELIST) {
		if (isDomainName(value)) {
			return value == "tutao.de" || contains(TUTANOTA_MAIL_ADDRESS_DOMAINS, value) || contains(customDomains, value)
		} else if (isMailAddress(value, false)) {
			let domain = value.split("@")[1]
			return domain == "tutao.de" || contains(customDomains, domain)
		}
	}
	return false
}
