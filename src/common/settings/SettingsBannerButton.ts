import { TranslationKey } from "../../ui/utils/LanguageViewModel.js"
import { ClickHandler } from "../../ui/base/GuiUtils.js"
import m from "mithril"
import { BannerButton } from "../../ui/base/buttons/BannerButton.js"
import { theme } from "../../ui/theme.js"

/// Renders a banner button used in the onboarding wizard and notification permission dialog
export function renderSettingsBannerButton(text: TranslationKey, onclick: ClickHandler, isDisabled?: boolean, classes?: string) {
	return m(BannerButton, {
		text,
		borderColor: theme.primary,
		color: theme.primary,
		class: "b full-width button-content " + classes,
		click: (event: MouseEvent, dom: HTMLElement) => {
			onclick(event, dom)
		},
		disabled: isDisabled ?? undefined,
	})
}
