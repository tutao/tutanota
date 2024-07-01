import m, { Children, Vnode, VnodeDOM } from "mithril"
import { TextField } from "../../../common/gui/base/TextField.js"
import { isDomainName } from "../../../common/misc/FormatValidator"
import { Dialog } from "../../../common/gui/base/Dialog"
import type { AddDomainData } from "./AddDomainWizard"
import type { TranslationKey } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { WizardPageAttrs, WizardPageN } from "../../../common/gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../../common/gui/base/WizardDialog.js"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton.js"

assertMainOrNode()

export class EnterDomainPage implements WizardPageN<AddDomainData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddDomainData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>): Children {
		return m("", [
			m("h4.mt-l.text-center", lang.get("enterCustomDomain_title")),
			m(".mt", lang.get("enterDomainIntroduction_msg")),
			m(".mt", lang.get("enterDomainGetReady_msg")),
			m(TextField, {
				label: "customDomain_label",
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
				".flex-center.full-width.pt-l.mb-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: "next_action",
						onclick: () => emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE),
					}),
				),
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

	headerTitle(): string {
		return lang.get("domainSetup_title")
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
