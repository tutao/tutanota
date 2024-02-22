import m, { Children } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../base/WizardDialog.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { BootIcons } from "../../base/icons/BootIcons.js"

export class SetupCongratulationsPage implements WizardPageN<null> {
	view(): Children {
		return m(SetupPageLayout, { icon: BootIcons.Premium }, [m("h2.pt", lang.get("welcome_text")), m("p.full-width.pt-l", lang.get("onboarding_text"))])
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
