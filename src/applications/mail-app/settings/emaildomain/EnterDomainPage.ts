import m, { Children, Vnode, VnodeDOM } from "mithril"
import { Autocapitalize, LegacyTextField } from "../../../../ui/base/LegacyTextField.js"
import { isDomainName } from "../../../../platform-kit/utils/FormatUtils"
import { Dialog } from "../../../../ui/base/Dialog"
import type { AddDomainData } from "./AddDomainWizard"
import type { TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import type { WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../../../ui/base/WizardDialog.js"
import { assertMainOrNode } from "../../../../platform-kit/app-env"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons.js"

assertMainOrNode()

export class EnterDomainPage implements WizardPageN<AddDomainData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddDomainData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>): Children {
		return m("", [
			m("h4.mt-32.text-center", lang.get("enterCustomDomain_title")),
			m(".mt-16", lang.get("enterDomainIntroduction_msg")),
			m(".mt-16", lang.get("enterDomainGetReady_msg")),
			m(LegacyTextField, {
				label: "customDomain_label",
				autocapitalize: Autocapitalize.none,
				value: vnode.attrs.data.domain(),
				oninput: vnode.attrs.data.domain,
				helpLabel: () => {
					const domain = vnode.attrs.data.domain()
					const errorMsg = validateDomain(domain)

					if (errorMsg) {
						return lang.get(errorMsg)
					} else {
						return lang.get("enterDomainFieldHelp_label", {
							"{domain}": domain.toLocaleLowerCase().trim(),
						})
					}
				},
			}),
			m(
				".flex-center.full-width.pt-32.mb-32",
				m(PrimaryButton, {
					label: "next_action",
					class: "small-login-button",
					onclick: () => emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE),
				}),
			),
		])
	}
}

function validateDomain(domain: string): TranslationKey | null {
	let cleanDomainName = domain.toLocaleLowerCase().trim()

	if (!cleanDomainName.length) {
		return "customDomainNeutral_msg"
	}

	if (!isDomainName(cleanDomainName)) {
		return "customDomainInvalid_msg"
	} else {
		return null
	}
}

export class EnterDomainPageAttrs implements WizardPageAttrs<AddDomainData> {
	data: AddDomainData

	constructor(domainData: AddDomainData) {
		this.data = domainData
	}

	headerTitle(): TranslationKey {
		return "domainSetup_title"
	}

	nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		const errorMsg = validateDomain(this.data.domain())

		if (errorMsg) {
			return showErrorDialog ? Dialog.message(errorMsg).then(() => false) : Promise.resolve(false)
		} else {
			return Promise.resolve(true)
		}
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
