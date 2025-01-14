import { pureComponent } from "./base/PureComponent.js"
import { SelectAllCheckbox, SelectAllCheckboxAttrs } from "./SelectAllCheckbox.js"
import m from "mithril"
import { BaseMobileHeader } from "./BaseMobileHeader.js"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"
import { lang, MaybeTranslation } from "../misc/LanguageViewModel.js"

type MultiselectMobileHeaderAttrs = SelectAllCheckboxAttrs & {
	message: MaybeTranslation
}
/** A special header that is used for multiselect state on mobile. */
export const MultiselectMobileHeader = pureComponent((attrs: MultiselectMobileHeaderAttrs) => {
	const { selectAll, selectNone, selected, message } = attrs
	return m(BaseMobileHeader, {
		left: m(SelectAllCheckbox, { selectNone, selectAll, selected }),
		center: m(".font-weight-600", lang.getTranslationText(message)),
		right: m(IconButton, {
			icon: Icons.Cancel,
			title: "cancel_action",
			click: () => selectNone(),
		}),
	})
})
