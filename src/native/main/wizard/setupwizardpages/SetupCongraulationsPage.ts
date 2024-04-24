import m, { Children } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../../../gui/base/WizardDialog.js"
import { lang } from "../../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"

export class SetupCongratulationsPage implements WizardPageN<null> {
	view(): Children {
		return m(SetupPageLayout, { image: "congratulations", class: "onboarding-logo-large" }, [
			m("h2.mt-l.b", lang.get("welcome_text")),
			m("p.mt-s.full-width", lang.get("onboarding_text")),
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
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
