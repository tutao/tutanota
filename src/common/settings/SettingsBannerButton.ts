import { TranslationKey } from "../misc/LanguageViewModel.js"
import { ClickHandler } from "../gui/base/GuiUtils.js"
import m from "mithril"
import { BannerButton } from "../gui/base/buttons/BannerButton.js"
import { theme } from "../gui/theme.js"

/// Renders a banner button used in the onboarding wizard and notification permission dialog
export function renderSettingsBannerButton(text: TranslationKey, onclick: ClickHandler, isDisabled?: boolean, classes?: string) {
	return m(BannerButton, {
		text,
		borderColor: theme.content_accent,
		color: theme.content_accent,
		class: "b full-width button-content " + classes,
		click: (event: MouseEvent, dom: HTMLElement) => {
			onclick(event, dom)
		},
		disabled: isDisabled ?? undefined,
	})
}
