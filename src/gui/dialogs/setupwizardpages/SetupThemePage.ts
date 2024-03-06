import m, { Children } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../base/WizardDialog.js"
import { OnboardingThemeImage } from "../../base/icons/Icons.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { RadioSelector, RadioSelectorAttrs } from "../../base/RadioSelector.js"
import { themeController, themeOptions, ThemePreference } from "../../theme.js"
import { SetupPageLayout } from "./SetupPageLayout.js"

export class SetupThemePage implements WizardPageN<null> {
	view(): Children {
		return m(
			SetupPageLayout,
			{
				image: OnboardingThemeImage,
			},
			m("p.full-width", "Which theme would you like to use?"),
			m(RadioSelector, {
				name: "theme_label",
				options: themeOptions,
				selectedOption: themeController.themePreference,
				onOptionSelected: (option) => {
					themeController.setThemePreference(option, true)
				},
			} satisfies RadioSelectorAttrs<ThemePreference>),
		)
	}
}

export class SetupThemePageAttrs implements WizardPageAttrs<null> {
	hidePagingButtonForPage = false
	data: null = null

	headerTitle(): string {
		return lang.get("appearanceSettings_label")
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
