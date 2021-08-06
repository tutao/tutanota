// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/common/Env"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import {InvalidDataError, LockedError, PreconditionFailedError} from "../api/common/error/RestError"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {isDomainName} from "../misc/FormatValidator"
import stream from "mithril/stream/stream.js"
import {CertificateType, getCertificateType} from "../api/common/TutanotaConstants"
import {getWhitelabelDomain} from "../api/common/utils/Utils"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import type {CertificateInfo} from "../api/entities/sys/CertificateInfo"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ButtonN} from "../gui/base/ButtonN"

assertMainOrNode()

function orderWhitelabelCertificate(domain: string, dialog: Dialog) {
	showProgressDialog("pleaseWait_msg",
		worker.orderWhitelabelCertificate(domain)
		      .then(() => {
			      dialog.close()
		      })
		      .catch(InvalidDataError, e => {
			      Dialog.error("certificateError_msg")
		      })
		      .catch(LockedError, e => Dialog.error("operationStillActive_msg"))
		      .catch(PreconditionFailedError, e => {
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
		      }))
}

export function show(customerInfo: CustomerInfo, certificateInfo: ?CertificateInfo): void {
	// only show a dropdown if a domain is already selected for tutanota login or if there is exactly one domain available
	const whitelabelDomainInfo = getWhitelabelDomain(customerInfo)
	const domain = whitelabelDomainInfo ? stream(whitelabelDomainInfo.domain) : stream("")
	const domainFieldAttrs = {
		label: "whitelabelDomain_label",
		value: domain,
		disabled: whitelabelDomainInfo ? true : false,
	}

	let certChainFile: ?DataFile = null
	let selectedCertificateChain = ""

	const chooseCertificateChainButtonAttrs = {
		label: "edit_action",
		click: () => {
			fileController.showFileChooser(false).then(files => {
				certChainFile = files[0]
				selectedCertificateChain = certChainFile.name
				m.redraw()
			})
		},
		icon: Icons.Edit
	}

	let privKeyFile: ?DataFile = null
	let selectedPrivateKey = ""

	const choosePrivateKeyButtonAttrs = {
		label: "edit_action",
		click: () => {
			fileController.showFileChooser(false).then(files => {
				privKeyFile = files[0]
				selectedPrivateKey = privKeyFile.name
				m.redraw()
			})
		},
		icon: Icons.Edit
	}

	const selectedType = stream(certificateInfo ? getCertificateType(certificateInfo) : CertificateType.LETS_ENCRYPT)

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
