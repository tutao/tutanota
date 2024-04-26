import m, { Children } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../../../gui/base/WizardDialog.js"
import { lang } from "../../../../misc/LanguageViewModel.js"
import { RadioSelector, RadioSelectorAttrs, RadioSelectorOption } from "../../../../gui/base/RadioSelector.js"
import { themeController, themeOptions, ThemePreference } from "../../../../gui/theme.js"
import { SetupPageLayout } from "./SetupPageLayout.js"

export class SetupThemePage implements WizardPageN<SetupThemePageAttrs> {
	// The whitelabel themes formatted as `RadioSelectorOption`s.
	private customThemes: Array<RadioSelectorOption<string>> | null = null

	oninit() {
		// Get the whitelabel themes from the theme controller and map them to `RadioSelector` options.
		themeController.getCustomThemes().then((customThemes) => {
			this.customThemes = customThemes.map((themeId) => {
				return { name: () => themeId, value: themeId }
			})
			m.redraw()
		})
	}

	view(): Children {
		return m(
			SetupPageLayout,
			{
				image: "theme",
			},
			m("p.full-width", lang.get("theme_title")),
			// We need to await the promise from `themeController.getCustomThemes()`, so we delay rendering the `RadioSelector` until it does.
			this.customThemes == null
				? null
				: m(RadioSelector, {
						name: "theme_label",
						options: [...themeOptions, ...this.customThemes],
						class: "mb-s",
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
