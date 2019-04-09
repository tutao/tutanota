// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Dialog} from "../gui/base/Dialog"
import {Button} from "../gui/base/Button"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import {utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {isDomainName} from "../misc/FormatValidator"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import stream from "mithril/stream/stream.js"
import type {CertificateTypeEnum} from "../api/common/TutanotaConstants"
import {CertificateType, getCertificateType} from "../api/common/TutanotaConstants"
import {getWhitelabelDomain} from "../api/common/utils/Utils"

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
		      .catch(PreconditionFailedError, e => {
			      Dialog.error("invalidCnameRecord_msg")
		      }))
}

export function show(customerInfo: CustomerInfo, whitelabelConfig: ?WhitelabelConfig): void {
	// only show a dropdown if a domain is already selected for tutanota login or if there is exactly one domain available
	const whitelabelDomainInfo = getWhitelabelDomain(customerInfo)
	let domainField
	if (whitelabelDomainInfo) {
		domainField = new TextField("whitelabelDomain_label").setValue(whitelabelDomainInfo.domain).setDisabled()
	} else {
		domainField = new TextField("whitelabelDomain_label")
	}

	let certChainFile: ?DataFile = null
	let certificateChainField = new TextField("certificateChain_label",
		() => lang.get("certificateChainInfo_msg")).setValue("").setDisabled()
	let chooseCertificateChainButton = new Button("edit_action", () => {
		fileController.showFileChooser(false).then(files => {
			certChainFile = files[0]
			certificateChainField.setValue(certChainFile.name)
			m.redraw()
		})
	}, () => Icons.Edit)
	certificateChainField._injectionsRight = () => [m(chooseCertificateChainButton)]

	let privKeyFile: ?DataFile = null
	let privateKeyField = new TextField("privateKey_label",
		() => lang.get("privateKeyInfo_msg")).setValue("").setDisabled()
	let choosePrivateKeyButton = new Button("edit_action", () => {
		fileController.showFileChooser(false).then(files => {
			privKeyFile = files[0]
			privateKeyField.setValue(privKeyFile.name)
			m.redraw()
		})
	}, () => Icons.Edit)
	privateKeyField._injectionsRight = () => [m(choosePrivateKeyButton)]

	const certificateInfo = whitelabelConfig && whitelabelConfig.certificateInfo
	const selectedType = stream(certificateInfo ? getCertificateType(certificateInfo) : CertificateType.LETS_ENCRYPT)
	const certOptionDropDownAttrs: DropDownSelectorAttrs<CertificateTypeEnum> = {
		label: "certificateType_label",
		items: [
			{name: lang.get("certificateTypeAutomatic_label"), value: CertificateType.LETS_ENCRYPT},
			{name: lang.get("certificatTypeManual_label"), value: CertificateType.MANUAL}
		],
		selectedValue: selectedType,
		dropdownWidth: 250
	}

	let form = {
		view: () => {
			return [
				m(domainField),
				m(DropDownSelectorN, certOptionDropDownAttrs),
			].concat(selectedType() === CertificateType.MANUAL
				? [
					m(certificateChainField),
					m(privateKeyField),
				]
				: null)
		}
	}
	let dialog = Dialog.showActionDialog({
		title: lang.get("whitelabelDomain_label"),
		child: form,
		okAction: () => {
			let domain = domainField.value().trim().toLowerCase()

			if (!isDomainName(domain) || domain.split(".").length < 3) {
				Dialog.error("notASubdomain_msg")
			} else if (customerInfo.domainInfos.find(di => !di.whitelabelConfig && di.domain === domain)) {
				Dialog.error("customDomainErrorDomainNotAvailable_msg")
			} else if (selectedType() === CertificateType.LETS_ENCRYPT) {
				registerDomain(domain, null, null, dialog)
			} else {
				if (!certChainFile) {
					Dialog.error("certificateChainInfo_msg")
				} else if (!privKeyFile) {
					Dialog.error("privateKeyInfo_msg")
				} else {
					try {
						registerDomain(domain, certChainFile, privKeyFile, dialog)
					} catch (e) {
						Dialog.error("certificateError_msg")
					}
				}
			}
		}
	})
}
