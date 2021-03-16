// @flow
import {TextFieldN} from "../../gui/base/TextFieldN"
import {Dialog} from "../../gui/base/Dialog"
import {showProgressDialog} from "../../gui/ProgressDialog"
import {worker} from "../../api/main/WorkerClient"
import {neverNull} from "../../api/common/utils/Utils"
import {LockedError, PreconditionFailedError} from "../../api/common/error/RestError"
import {Icons} from "../../gui/base/icons/Icons"
import {logins} from "../../api/main/LoginController"
import {showNotAvailableForFreeDialog} from "../../misc/SubscriptionDialogs"
import {showWhitelabelBuyDialog} from "../../subscription/BuyDialog"
import * as SetCustomDomainCertificateDialog from "../SetDomainCertificateDialog"
import stream from "mithril/stream/stream.js"
import {lang} from "../../misc/LanguageViewModel"
import m from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import type {CustomerInfo} from "../../api/entities/sys/CustomerInfo"
import type {CertificateInfo} from "../../api/entities/sys/CertificateInfo"
import {CertificateState, CertificateType} from "../../api/common/TutanotaConstants"
import {formatDateTime} from "../../misc/Formatter"

export type WhitelabelBrandingDomainSettingsAttrs = {
	customerInfo: CustomerInfo,
	isWhitelabelFeatureEnabled: boolean,
	certificateInfo: ?CertificateInfo,
	whitelabelDomain: string,
}

export class WhitelabelBrandingDomainSettings implements MComponent<WhitelabelBrandingDomainSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelBrandingDomainSettingsAttrs>) {}

	view(vnode: Vnode<WhitelabelBrandingDomainSettingsAttrs>): Children {
		const {customerInfo, certificateInfo, whitelabelDomain, isWhitelabelFeatureEnabled} = vnode.attrs

		const whitelabelDomainConfigAttrs = {
			label: "whitelabelDomain_label",
			value: stream((whitelabelDomain) ? whitelabelDomain : lang.get("deactivated_label")),
			helpLabel: this._renderWhitelabelInfo(certificateInfo),
			disabled: true,
			injectionsRight: () => [
				(whitelabelDomain) ? this._renderDeactivateButton(whitelabelDomain) : null,
				(customerInfo) ? this._renderEditButton(customerInfo, certificateInfo, isWhitelabelFeatureEnabled) : null
			]
		}
		return m(TextFieldN, whitelabelDomainConfigAttrs)
	}

	_renderDeactivateButton(whitelabelDomain: string): Children {
		const deactivateButtonAttrs = {
			label: "deactivate_action",
			click: () => {
				Dialog.confirm("confirmDeactivateWhitelabelDomain_msg").then(ok => {
					if (ok) {
						showProgressDialog("pleaseWait_msg", worker.deleteCertificate(whitelabelDomain))
							.catch(LockedError, e => Dialog.error("operationStillActive_msg"))
							.catch(PreconditionFailedError, e => {
								if (e.data === "lock.locked") {
									Dialog.error("operationStillActive_msg")
								} else {
									throw e;
								}
							})
					}
				})
			},
			icon: () => Icons.Cancel,
		}

		return m(ButtonN, deactivateButtonAttrs)
	}

	_renderEditButton(customerInfo: CustomerInfo, certificateInfo: ?CertificateInfo, isWhitelabelFeatureEnabled: boolean): Children {
		const editActionAttrs = {
			label: "edit_action",
			click: () => {
				if (logins.getUserController().isFreeAccount()) {
					showNotAvailableForFreeDialog(false)
				} else {
					const whitelabelFailedPromise: Promise<boolean> = isWhitelabelFeatureEnabled ? Promise.resolve(false) : showWhitelabelBuyDialog(true)
					whitelabelFailedPromise.then(failed => {
						if (!failed) {
							SetCustomDomainCertificateDialog.show(customerInfo, certificateInfo)
						}
					})
				}
			},
			icon: () => Icons.Edit
		}
		return m(ButtonN, editActionAttrs)
	}

	_renderWhitelabelInfo(certificateInfo: ? CertificateInfo): (() => Children) {
		let components: Array<string>
		if (certificateInfo) {
			switch (certificateInfo.state) {
				case CertificateState.VALID:
					components = [
						lang.get("certificateExpiryDate_label", {"{date}": formatDateTime(neverNull(certificateInfo.expiryDate))}),
						this._certificateTypeString(certificateInfo)
					]
					break
				case CertificateState.VALIDATING:
					components = [lang.get("certificateStateProcessing_label")]
					break
				case CertificateState.INVALID:
					components = [lang.get("certificateStateInvalid_label")];
					break
				default:
					components = [lang.get("emptyString_msg")]
			}
		} else {
			components = [lang.get("emptyString_msg")]
		}
		return () => m(".flex", components.map(c => m(".pr-s", c)))
	}

	_certificateTypeString(certificateInfo: CertificateInfo): string {
		switch (certificateInfo.type) {
			case CertificateType.LETS_ENCRYPT:
				return lang.get("certificateTypeAutomatic_label")
			case CertificateType.MANUAL:
				return lang.get("certificateTypeManual_label")
			default:
				return lang.get("emptyString_msg")
		}
	}
}