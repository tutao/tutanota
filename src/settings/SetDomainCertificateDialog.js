// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {Dialog} from "../gui/base/Dialog"
import {InvalidDataError, LockedError, PreconditionFailedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {isDomainName} from "../misc/FormatValidator"
import stream from "mithril/stream/stream.js"
import {getWhitelabelDomain} from "../api/common/utils/Utils"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ofClass} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

function orderWhitelabelCertificate(domain: string, dialog: Dialog) {
	showProgressDialog("pleaseWait_msg",
		locator.customerFacade.orderWhitelabelCertificate(domain)
		       .then(() => {
			       dialog.close()
		       })
		       .catch(ofClass(InvalidDataError, e => {
			       Dialog.error("certificateError_msg")
		       }))
		       .catch(ofClass(LockedError, e => Dialog.error("operationStillActive_msg")))
		       .catch(ofClass(PreconditionFailedError, e => {
			       switch (e.data) {
				       case "lock.locked":
					       Dialog.error("operationStillActive_msg")
					       break
				       case "domain.invalid_cname":
					       Dialog.error("invalidCnameRecord_msg")
					       break
				       case "domain.not_a_subdomain":
					       Dialog.error("notASubdomain_msg")
					       break
				       case "domain.invalid":
				       case "domain.exists":
					       Dialog.error("customDomainErrorDomainNotAvailable_msg")
					       break
				       default:
					       throw e;
			       }
		       })))
}

export function show(customerInfo: CustomerInfo): void {
	// only show a dropdown if a domain is already selected for tutanota login or if there is exactly one domain available
	const whitelabelDomainInfo = getWhitelabelDomain(customerInfo)
	const domain = whitelabelDomainInfo ? stream(whitelabelDomainInfo.domain) : stream("")
	const domainFieldAttrs = {
		label: "whitelabelDomain_label",
		value: domain,
		disabled: whitelabelDomainInfo ? true : false,
	}

	let form = {
		view: () => {
			return [
				m(TextFieldN, domainFieldAttrs),
			]
		}
	}
	let dialog = Dialog.showActionDialog({
		title: lang.get("whitelabelDomain_label"),
		child: form,
		okAction: () => {
			const domainAllLowercase = domain().trim().toLowerCase()
			if (!isDomainName(domainAllLowercase) || domainAllLowercase.split(".").length < 3) {
				Dialog.error("notASubdomain_msg")
			} else if (customerInfo.domainInfos.find(di => !di.whitelabelConfig && di.domain === domainAllLowercase)) {
				Dialog.error("customDomainErrorDomainNotAvailable_msg")
			} else {
				orderWhitelabelCertificate(domainAllLowercase, dialog)
			}
		}
	})
}
