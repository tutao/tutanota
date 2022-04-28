import {TextFieldN} from "../../gui/base/TextFieldN"
import {Dialog} from "../../gui/base/Dialog"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {neverNull} from "@tutao/tutanota-utils"
import {PreconditionFailedError} from "../../api/common/error/RestError"
import {Icons} from "../../gui/base/icons/Icons"
import {logins} from "../../api/main/LoginController"
import {showNotAvailableForFreeDialog} from "../../misc/SubscriptionDialogs"
import {showWhitelabelBuyDialog} from "../../subscription/BuyDialog"
import * as SetCustomDomainCertificateDialog from "../SetDomainCertificateDialog"
import stream from "mithril/stream"
import {lang} from "../../misc/LanguageViewModel"
import m, {Children, Component, Vnode} from "mithril"
import {ButtonN} from "../../gui/base/ButtonN"
import type {CustomerInfo} from "../../api/entities/sys/TypeRefs.js"
import type {CertificateInfo} from "../../api/entities/sys/TypeRefs.js"
import {CertificateState, CertificateType} from "../../api/common/TutanotaConstants"
import {formatDateTime} from "../../misc/Formatter"
import {locator} from "../../api/main/MainLocator"

export type WhitelabelBrandingDomainSettingsAttrs = {
	customerInfo: CustomerInfo
	isWhitelabelFeatureEnabled: boolean
	certificateInfo: CertificateInfo | null
	whitelabelDomain: string
}

const FAILURE_LOCKED = "lock.locked"
const FAILURE_CONTACT_FORM_ACTIVE = "domain.contact_form_active"

export class WhitelabelBrandingDomainSettings implements Component<WhitelabelBrandingDomainSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelBrandingDomainSettingsAttrs>) {
	}

	view(vnode: Vnode<WhitelabelBrandingDomainSettingsAttrs>): Children {
		const {customerInfo, certificateInfo, whitelabelDomain, isWhitelabelFeatureEnabled} = vnode.attrs
		const whitelabelDomainConfigAttrs = {
			label: "whitelabelDomain_label",
			value: whitelabelDomain ? whitelabelDomain : lang.get("deactivated_label"),
			helpLabel: this._renderWhitelabelInfo(certificateInfo),
			disabled: true,
			injectionsRight: () => [
				whitelabelDomain ? this._renderDeactivateButton(whitelabelDomain) : null,
				customerInfo ? this._renderEditButton(customerInfo, certificateInfo, isWhitelabelFeatureEnabled) : null,
			],
		} as const
		return m(TextFieldN, whitelabelDomainConfigAttrs)
	}

	_renderDeactivateButton(whitelabelDomain: string): Children {
		const deactivateButtonAttrs = {
			label: "deactivate_action",
			click: async () => {
				if (await Dialog.confirm("confirmDeactivateWhitelabelDomain_msg")) {
					try {
						return await showProgressDialog("pleaseWait_msg", locator.customerFacade.deleteCertificate(whitelabelDomain))
					} catch (e) {
						if (e instanceof PreconditionFailedError) {
							if (e.data === FAILURE_LOCKED) {
								return await Dialog.message("operationStillActive_msg")
							} else if (e.data === FAILURE_CONTACT_FORM_ACTIVE) {
								return await Dialog.message(() => lang.get("domainStillHasContactForms_msg", {"{domain}": whitelabelDomain}))
							}
						}
						throw e
					}
				}
			},
			icon: () => Icons.Cancel,
		} as const
		return m(ButtonN, deactivateButtonAttrs)
	}

	_renderEditButton(customerInfo: CustomerInfo, certificateInfo: CertificateInfo | null, isWhitelabelFeatureEnabled: boolean): Children {
		const editActionAttrs = {
			label: "edit_action",
			click: () => {
				if (logins.getUserController().isFreeAccount()) {
					showNotAvailableForFreeDialog(false)
				} else {
					const whitelabelFailedPromise: Promise<boolean> = isWhitelabelFeatureEnabled ? Promise.resolve(false) : showWhitelabelBuyDialog(true)
					whitelabelFailedPromise.then(failed => {
						if (!failed) {
							SetCustomDomainCertificateDialog.show(customerInfo)
						}
					})
				}
			},
			icon: () => Icons.Edit,
		} as const
		return m(ButtonN, editActionAttrs)
	}

	_renderWhitelabelInfo(certificateInfo: CertificateInfo | null): () => Children {
		let components: Array<string>

		if (certificateInfo) {
			switch (certificateInfo.state) {
				case CertificateState.VALID:
					components = [
						lang.get("certificateExpiryDate_label", {
							"{date}": formatDateTime(neverNull(certificateInfo.expiryDate)),
						}),
						this._certificateTypeString(certificateInfo),
					]
					break

				case CertificateState.VALIDATING:
					components = [lang.get("certificateStateProcessing_label")]
					break

				case CertificateState.INVALID:
					components = [lang.get("certificateStateInvalid_label")]
					break

				default:
					components = [lang.get("emptyString_msg")]
			}
		} else {
			components = [lang.get("emptyString_msg")]
		}

		return () =>
			m(
				".flex",
				components.map(c => m(".pr-s", c)),
			)
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