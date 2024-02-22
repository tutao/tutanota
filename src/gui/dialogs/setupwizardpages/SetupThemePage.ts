import m, { Children, VnodeDOM } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../base/WizardDialog.js"
import { renderNextButton } from "../SetupWizard.js"
import { Icon } from "../../base/Icon.js"
import { Icons } from "../../base/icons/Icons.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { RadioSelector, RadioSelectorAttrs } from "../../base/RadioSelector.js"
import { themeOptions } from "../../../settings/AppearanceSettingsViewer.js"
import { themeController, ThemePreference } from "../../theme.js"

export class SetupThemePage implements WizardPageN<null> {
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
			m("p.full-width.pt-l", "Which theme would you like to use?"),
			m(RadioSelector, {
				options: themeOptions,
				selectedOption: themeController.themePreference,
				onOptionSelected: (option) => {
					themeController.setThemePreference(option, true)
				},
			} satisfies RadioSelectorAttrs<ThemePreference>),
			renderNextButton(this.dom),
		])
	}
}

export class SetupThemePageAttrs implements WizardPageAttrs<null> {
	preventGoBack = true
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
