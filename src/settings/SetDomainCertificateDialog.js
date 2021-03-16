// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/common/Env"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import {utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {InvalidDataError, LockedError, PreconditionFailedError} from "../api/common/error/RestError"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/ProgressDialog"
import {isDomainName} from "../misc/FormatValidator"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import stream from "mithril/stream/stream.js"
import type {CertificateTypeEnum} from "../api/common/TutanotaConstants"
import {CertificateType, getCertificateType} from "../api/common/TutanotaConstants"
import {getWhitelabelDomain} from "../api/common/utils/Utils"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import type {CertificateInfo} from "../api/entities/sys/CertificateInfo"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ButtonN} from "../gui/base/ButtonN"

assertMainOrNode()

function registerDomain(domain: string, certChainFile: ?DataFile, privKeyFile: ?DataFile, dialog: Dialog) {
	showProgressDialog("pleaseWait_msg",
		worker.uploadCertificate(domain,
			certChainFile && utf8Uint8ArrayToString(certChainFile.data),
			privKeyFile && utf8Uint8ArrayToString(privKeyFile.data))
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
	let domainAllLowercase = ""
	const whitelabelDomainInfo = getWhitelabelDomain(customerInfo)
	const domainFieldAttrs = {
		label: "whitelabelDomain_label",
		value: whitelabelDomainInfo ? stream(whitelabelDomainInfo.domain) : stream(""),
		disabled: whitelabelDomainInfo ? true : false,
		oninput: (value) => {domainAllLowercase = value.trim().toLowerCase()}
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

	const certificateChainFieldAttrs = {
		label: "certificateChain_label",
		helpLabel: lang.get("certificateChainInfo_msg"),
		value: stream(selectedCertificateChain),
		disabled: true,
		_injectionsRight: () => {[m(ButtonN, chooseCertificateChainButtonAttrs)]}
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

	const selectedPrivateKeyFieldAttrs = {
		label: "privateKey_label",
		helpLabel: () => lang.get("privateKeyInfo_msg"),
		value: stream(selectedPrivateKey),
		disabled: true,
		_injectionsRight: () => [m(ButtonN, choosePrivateKeyButtonAttrs)],
	}

	const selectedType = stream(certificateInfo ? getCertificateType(certificateInfo) : CertificateType.LETS_ENCRYPT)
	const certOptionDropDownAttrs: DropDownSelectorAttrs<CertificateTypeEnum> = {
		label: "certificateType_label",
		items: [
			{name: lang.get("certificateTypeAutomatic_label"), value: CertificateType.LETS_ENCRYPT},
			{name: lang.get("certificateTypeManual_label"), value: CertificateType.MANUAL}
		],
		selectedValue: selectedType,
		dropdownWidth: 250
	}

	let form = {
		view: () => {
			return [
				m(TextFieldN, domainFieldAttrs),
				m(DropDownSelectorN, certOptionDropDownAttrs),
			].concat(selectedType() === CertificateType.MANUAL
				? [
					m(TextFieldN, certificateChainFieldAttrs),
					m(TextFieldN, selectedPrivateKeyFieldAttrs),
				]
				: null)
		}
	}
	let dialog = Dialog.showActionDialog({
		title: lang.get("whitelabelDomain_label"),
		child: form,
		okAction: () => {
			if (!isDomainName(domainAllLowercase) || domainAllLowercase.split(".").length < 3) {
				Dialog.error("notASubdomain_msg")
			} else if (customerInfo.domainInfos.find(di => !di.whitelabelConfig && di.domain === domainAllLowercase)) {
				Dialog.error("customDomainErrorDomainNotAvailable_msg")
			} else if (selectedType() === CertificateType.LETS_ENCRYPT) {
				registerDomain(domainAllLowercase, null, null, dialog)
			} else {
				if (!certChainFile) {
					Dialog.error("certificateChainInfo_msg")
				} else if (!privKeyFile) {
					Dialog.error("privateKeyInfo_msg")
				} else {
					try {
						registerDomain(domainAllLowercase, certChainFile, privKeyFile, dialog)
					} catch (e) {
						Dialog.error("certificateError_msg")
					}
				}
			}
		}
	})
}
