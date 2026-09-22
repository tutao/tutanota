import m, { Children, Vnode, VnodeDOM } from "mithril"
import { Autocapitalize } from "../../../../ui/base/LegacyTextField.js"
import { TextField } from "../../../../ui/base/TextField.js"
import { isDomainName } from "../../../../platform-kit/utils/FormatUtils"
import { Dialog } from "../../../../ui/base/Dialog"
import type { AddDomainData } from "./AddDomainWizard"
import type { TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import type { WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../../../ui/base/WizardDialog.js"
import { EnvProvider } from "../../../../platform-kit/app-env"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons.js"
import { TitleSection } from "../../../../ui/TitleSection.js"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { px, size } from "../../../../ui/size"

EnvProvider.assertMainOrNode()

export class EnterDomainPage implements WizardPageN<AddDomainData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddDomainData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>): Children {
		const domain = vnode.attrs.data.domain()
		return m(".mt-24", [
			m(TitleSection, {
				icon: Icons.GlobeFilled,
				iconOptions: { color: theme.on_surface_variant },
				title: lang.get("enterCustomDomain_title"),
				subTitle: [m("", lang.get("enterDomainIntroduction_msg")), m(".mt-8", lang.get("enterDomainGetReady_msg"))],
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			}),
			m(TextField, {
				class: "mt-16",
				label: "customDomain_label",
				autocapitalize: Autocapitalize.none,
				value: domain,
				oninput: vnode.attrs.data.domain,
				leadingIcon: {
					icon: Icons.GlobeFilled,
					color: theme.on_surface_variant,
				},
				helpLabel: () => {
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
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{ style: { width: "260px" } },
					m(PrimaryButton, {
						label: "continue_action",
						class: "wizard-next-button",
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

	headerTitle(): TranslationKey {
		return "domainSetup_title"
	}

	stepTitle = "domainSetupStepDomain_title" as TranslationKey

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
