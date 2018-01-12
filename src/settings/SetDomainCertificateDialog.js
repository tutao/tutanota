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
import {isDomainName} from "../misc/Formatter"
import * as BuyDialog from "./BuyDialog"
import {BookingItemFeatureType} from "../api/common/TutanotaConstants"

assertMainOrNode()

export function show(customerInfo: CustomerInfo): void {
	showProgressDialog("pleaseWait_msg", BuyDialog.show(BookingItemFeatureType.Branding, 1, 0, false)).then(accepted => {
		if (accepted) {
			// only show a dropdown if a domain is already selected for tutanota login or if there is exactly one domain available
			let brandingDomainInfo = customerInfo.domainInfos.find(info => info.certificate != null)
			let domainField
			if (brandingDomainInfo) {
				domainField = new TextField("brandingDomain_label").setValue(brandingDomainInfo.domain).setDisabled()
			} else {
				domainField = new TextField("brandingDomain_label")
			}

			let certChainFile: ?DataFile = null
			let certificateChainField = new TextField("certificateChain_label", () => lang.get("certificateChainInfo_msg")).setValue("").setDisabled()
			let chooseCertificateChainButton = new Button("edit_action", () => {
				fileController.showFileChooser(false).then(files => {
					certChainFile = files[0]
					certificateChainField.setValue(certChainFile.name)
					m.redraw()
				})
			}, () => Icons.Edit)
			certificateChainField._injectionsRight = () => [m(chooseCertificateChainButton)]

			let privKeyFile: ?DataFile = null
			let privateKeyField = new TextField("privateKey_label", () => lang.get("privateKeyInfo_msg")).setValue("").setDisabled()
			let choosePrivateKeyButton = new Button("edit_action", () => {
				fileController.showFileChooser(false).then(files => {
					privKeyFile = files[0]
					privateKeyField.setValue(privKeyFile.name)
					m.redraw()
				})
			}, () => Icons.Edit)
			privateKeyField._injectionsRight = () => [m(choosePrivateKeyButton)]

			let form = {
				view: () => {
					return [
						m(domainField),
						m(certificateChainField),
						m(privateKeyField),
					]
				}
			}
			let dialog = Dialog.smallActionDialog(lang.get("brandingDomain_label"), form, () => {
				let domain = domainField.value().trim().toLowerCase()
				if (!certChainFile) {
					Dialog.error("certificateChainInfo_msg")
				} else if (!privKeyFile) {
					Dialog.error("privateKeyInfo_msg")
				} else if (!isDomainName(domain) || domain.split(".").length < 3) {
					Dialog.error("notASubdomain_msg")
				} else if (customerInfo.domainInfos.find(d => d.domain == domain && !d.certificate)) {
					Dialog.error("customDomainErrorDomainNotAvailable_msg")
				} else {
					try {
						showProgressDialog("pleaseWait_msg", worker.uploadCertificate(domain, utf8Uint8ArrayToString(certChainFile.data), utf8Uint8ArrayToString(privKeyFile.data)).then(() => {
							dialog.close()
						}).catch(InvalidDataError, e => {
							Dialog.error("certificateError_msg")
						}).catch(PreconditionFailedError, e => {
							Dialog.error("invalidCnameRecord_msg")
						}))
					} catch (e) {
						Dialog.error("certificateError_msg")
					}
				}
			})
		}
	})
}
