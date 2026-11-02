import { TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { ClickHandler } from "../../../ui/base/GuiUtils.js"
import m from "mithril"
import { ColoredThickOutlineButton } from "../../../ui/base/buttons/ColoredThickOutlineButton.js"
import { theme } from "../../../ui/theme.js"

export function renderSetupWizardButton(text: TranslationKey, onclick: ClickHandler, isDisabled?: boolean, classes?: string) {
	return m(ColoredThickOutlineButton, {
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
