//@flow
import m from "mithril"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {isDomainName} from "../../misc/FormatValidator"
import {Dialog} from "../../gui/base/Dialog"
import type {AddDomainData} from "./AddDomainWizard"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {WizardPageAttrs, WizardPageN} from "../../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../../gui/base/WizardDialogN"
import {assertMainOrNode} from "../../api/common/Env"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"

assertMainOrNode()

export class EnterDomainPage implements WizardPageN<AddDomainData> {

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>): Children {
		const a = vnode.attrs
		return m("", [
			m("h4.mt-l.text-center", lang.get("enterCustomDomain_title")),
			m(".mt", lang.get("enterDomainIntroduction_msg")),
			m(".mt", lang.get("enterDomainGetReady_msg")),
			m(TextFieldN, {
					label: "customDomain_label",
					value: vnode.attrs.data.domain,
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
					}
				}
			),
			m(".flex-center.full-width.pt-l.mb-l", m("", {style: {width: "260px"}}, m(ButtonN, {
				type: ButtonType.Login,
				label: "next_action",
				click: () => emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
			})))
		])
	}
}

function validateDomain(domain: string): ?TranslationKey {
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
			return showErrorDialog ? Dialog.error(errorMsg).then(() => false) : Promise.resolve(false)
		} else {
			return Promise.resolve(true)
		}
	}

	isSkipAvailable(): boolean {
		return false
	}


	isEnabled(): boolean {return true}
}