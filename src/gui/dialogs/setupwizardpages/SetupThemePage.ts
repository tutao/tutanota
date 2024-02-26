import m, { Children } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../base/WizardDialog.js"
import { Icons } from "../../base/icons/Icons.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { RadioSelector, RadioSelectorAttrs } from "../../base/RadioSelector.js"
import { themeOptions } from "../../../settings/AppearanceSettingsViewer.js"
import { themeController, ThemePreference } from "../../theme.js"
import { SetupPageLayout } from "./SetupPageLayout.js"

export class SetupThemePage implements WizardPageN<null> {
	view(): Children {
		return m(
			SetupPageLayout,
			{
				icon: Icons.Palette,
			},
			m("p.full-width.pt-l", "Which theme would you like to use?"),
			m(RadioSelector, {
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
		return true
	}

	isEnabled(): boolean {
		return true
	}
}
