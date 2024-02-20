import m, { Children, VnodeDOM } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../base/WizardDialog.js"
import { renderNextButton } from "../SetupWizard.js"
import { Icon } from "../../base/Icon.js"
import { Icons } from "../../base/icons/Icons.js"
import { lang } from "../../../misc/LanguageViewModel.js"

export class SetupCongratulationsPage implements WizardPageN<null> {
	private dom!: HTMLElement

	oncreate(vnode: VnodeDOM<WizardPageAttrs<null>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(): Children {
		return m("section.full-height.center", [
			m(Icon, {
				icon: Icons.Notifications,
				large: true,
			}),
			m("h2.pt", lang.get("welcome_text")),
			m("p.full-width.pt-l", lang.get("onboarding_text")),
			renderNextButton(this.dom),
		])
	}
}

export class SetupCongratulationsPageAttrs implements WizardPageAttrs<null> {
	preventGoBack = true
	hidePagingButtonForPage = false
	data: null = null

	headerTitle(): string {
		return lang.get("welcome_label")
	}

	nextAction(showDialogs: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return true
	}

	isEnabled(): boolean {
		return true
	}
}
