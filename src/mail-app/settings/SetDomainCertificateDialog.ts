import m from "mithril"
import { lang } from "../../common/misc/LanguageViewModel"
import { Dialog } from "../../common/gui/base/Dialog"
import { InvalidDataError, LockedError, PreconditionFailedError } from "../../common/api/common/error/RestError"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog"
import { isDomainName } from "../../common/misc/FormatValidator"
import stream from "mithril/stream"
import type { CustomerInfo } from "../../common/api/entities/sys/TypeRefs.js"
import { TextField } from "../../common/gui/base/TextField.js"
import { ofClass } from "@tutao/tutanota-utils"
import { locator } from "../../common/api/main/CommonLocator"
import { assertMainOrNode } from "../../common/api/common/Env"
import { getWhitelabelDomainInfo } from "../../common/api/common/utils/CustomerUtils.js"

assertMainOrNode()

function orderWhitelabelCertificate(domain: string, dialog: Dialog) {
	showProgressDialog(
		"pleaseWait_msg",
		locator.customerFacade
			.orderWhitelabelCertificate(domain)
			.then(() => {
				dialog.close()
			})
			.catch(
				ofClass(InvalidDataError, (e) => {
					Dialog.message("certificateError_msg")
				}),
			)
			.catch(ofClass(LockedError, (e) => Dialog.message("operationStillActive_msg")))
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					switch (e.data) {
						case "lock.locked":
							Dialog.message("operationStillActive_msg")
							break

						case "domain.invalid_cname":
							Dialog.message("invalidCnameRecord_msg")
							break

						case "domain.not_a_subdomain":
							Dialog.message("notASubdomain_msg")
							break

						case "domain.invalid":
						case "domain.exists":
							Dialog.message("customDomainErrorDomainNotAvailable_msg")
							break

						default:
							throw e
					}
				}),
			),
	)
}

export function show(customerInfo: CustomerInfo): void {
	// only show a dropdown if a domain is already selected for tutanota login or if there is exactly one domain available
	const whitelabelDomainInfo = getWhitelabelDomainInfo(customerInfo)
	const domain = whitelabelDomainInfo ? stream(whitelabelDomainInfo.domain) : stream("")
	let form = {
		view: () => {
			return m(TextField, {
				label: "whitelabelDomain_label",
				value: domain(),
				oninput: domain,
				isReadOnly: whitelabelDomainInfo ? true : false,
			})
		},
	}
	let dialog = Dialog.showActionDialog({
		title: lang.get("whitelabelDomain_label"),
		child: form,
		okAction: () => {
			const domainAllLowercase = domain().trim().toLowerCase()

			if (!isDomainName(domainAllLowercase) || domainAllLowercase.split(".").length < 3) {
				Dialog.message("notASubdomain_msg")
			} else if (customerInfo.domainInfos.some((di) => !di.whitelabelConfig && di.domain === domainAllLowercase)) {
				Dialog.message("customDomainErrorDomainNotAvailable_msg")
			} else {
				orderWhitelabelCertificate(domainAllLowercase, dialog)
			}
		},
	})
}
