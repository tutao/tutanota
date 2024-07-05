import { TextField } from "../../gui/base/TextField.js"
import { Dialog } from "../../gui/base/Dialog"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { neverNull } from "@tutao/tutanota-utils"
import { PreconditionFailedError } from "../../api/common/error/RestError"
import { Icons } from "../../gui/base/icons/Icons"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs"
import * as SetCustomDomainCertificateDialog from "../SetDomainCertificateDialog.js"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import type { CertificateInfo, CustomerInfo } from "../../../common/api/entities/sys/TypeRefs.js"
import { CertificateState, CertificateType, PlanType } from "../../../common/api/common/TutanotaConstants"
import { formatDateTime } from "../../../common/misc/Formatter"
import { locator } from "../../../common/api/main/CommonLocator"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { getAvailablePlansWithWhitelabel } from "../../../common/subscription/SubscriptionUtils.js"

export type WhitelabelBrandingDomainSettingsAttrs = {
	customerInfo: CustomerInfo
	isWhitelabelFeatureEnabled: boolean
	certificateInfo: CertificateInfo | null
	whitelabelDomain: string
}

const FAILURE_LOCKED = "lock.locked"
const FAILURE_CONTACT_FORM_ACTIVE = "domain.contact_form_active"

export class WhitelabelBrandingDomainSettings implements Component<WhitelabelBrandingDomainSettingsAttrs> {
	view(vnode: Vnode<WhitelabelBrandingDomainSettingsAttrs>): Children {
		const { customerInfo, certificateInfo, whitelabelDomain, isWhitelabelFeatureEnabled } = vnode.attrs
		return m(TextField, {
			label: "whitelabelDomain_label",
			value: whitelabelDomain ? whitelabelDomain : lang.get("deactivated_label"),
			helpLabel: this.renderWhitelabelInfo(certificateInfo),
			isReadOnly: true,
			injectionsRight: () =>
				m(".ml-between-s", [
					whitelabelDomain ? this.renderDeactivateButton(whitelabelDomain) : null,
					customerInfo ? this._renderEditButton(customerInfo, certificateInfo, isWhitelabelFeatureEnabled) : null,
				]),
		})
	}

	private renderDeactivateButton(whitelabelDomain: string): Children {
		return m(IconButton, {
			title: "deactivate_action",
			click: () => this.deactivate(whitelabelDomain),
			icon: Icons.Cancel,
			size: ButtonSize.Compact,
		})
	}

	private async deactivate(whitelabelDomain: string) {
		if (await Dialog.confirm("confirmDeactivateWhitelabelDomain_msg")) {
			try {
				return await showProgressDialog("pleaseWait_msg", locator.customerFacade.deleteCertificate(whitelabelDomain))
			} catch (e) {
				if (e instanceof PreconditionFailedError) {
					if (e.data === FAILURE_LOCKED) {
						return await Dialog.message("operationStillActive_msg")
					} else if (e.data === FAILURE_CONTACT_FORM_ACTIVE) {
						return await Dialog.message(() => lang.get("domainStillHasContactForms_msg", { "{domain}": whitelabelDomain }))
					}
				}
				throw e
			}
		}
	}

	_renderEditButton(customerInfo: CustomerInfo, certificateInfo: CertificateInfo | null, isWhitelabelFeatureEnabled: boolean): Children {
		return m(IconButton, {
			title: "edit_action",
			click: () => this.edit(isWhitelabelFeatureEnabled, customerInfo),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		})
	}

	private async edit(isWhitelabelFeatureEnabled: boolean, customerInfo: CustomerInfo): Promise<void> {
		if (locator.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog([PlanType.Unlimited])
		} else {
			if (!isWhitelabelFeatureEnabled) {
				const plansWithWhitelabel = await getAvailablePlansWithWhitelabel()
				isWhitelabelFeatureEnabled = await showPlanUpgradeRequiredDialog(plansWithWhitelabel)
			}
			if (isWhitelabelFeatureEnabled) {
				SetCustomDomainCertificateDialog.show(customerInfo)
			}
		}
	}

	private renderWhitelabelInfo(certificateInfo: CertificateInfo | null): () => Children {
		let components: Array<string>

		if (certificateInfo) {
			switch (certificateInfo.state) {
				case CertificateState.VALID:
					components = [
						lang.get("certificateExpiryDate_label", {
							"{date}": formatDateTime(neverNull(certificateInfo.expiryDate)),
						}),
						this.certificateTypeString(certificateInfo),
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
				components.map((c) => m(".pr-s", c)),
			)
	}

	private certificateTypeString(certificateInfo: CertificateInfo): string {
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
