//@flow
import m from "mithril"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {isDomainName} from "../../misc/FormatValidator"
import {Dialog} from "../../gui/base/Dialog"
import type {AddDomainData} from "./AddDomainWizard"
import {lang} from "../../misc/LanguageViewModel"
import type {WizardPageAttrs, WizardPageN} from "../../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../../gui/base/WizardDialogN"
import {assertMainOrNode} from "../../api/Env"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"

assertMainOrNode()

export class EnterDomainPage implements WizardPageN<AddDomainData> {

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>) {
		const a = vnode.attrs
		return m("", [
			m("h4.mt-l.text-center", lang.get("enterCustomDomain_title")),
			m(".mt", lang.get("enterDomainIntroduction_msg")),
			m(".mt", lang.get("enterDomainGetReady_msg")),
			m(".mt", lang.get("enterDomain_msg")),
			m(TextFieldN, {
					label: "customDomain_label",
					value: vnode.attrs.data.domain,
					helpLabel: () => lang.get("enterDomainFieldHelp_label")
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

export class EnterDomainPageAttrs implements WizardPageAttrs<AddDomainData> {

	data: AddDomainData

	constructor(domainData: AddDomainData) {
		this.data = domainData
	}

	headerTitle() {
		return lang.get("domainSetup_title")
	}

	nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		let cleanDomainName = this.data.domain().toLocaleLowerCase().trim()
		if (!isDomainName(cleanDomainName)) {
			return showErrorDialog ? Dialog.error("customDomainNeutral_msg").then(() => false) : Promise.resolve(false)
		} else {
			return Promise.resolve(true)
		}
	}

	isSkipAvailable(): boolean {
		return false
	}


	isEnabled(): boolean {return true}
}