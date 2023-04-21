import { pureComponent } from "./base/PureComponent.js"
import { SelectAllCheckbox, SomeList } from "./SelectAllCheckbox.js"
import m from "mithril"
import { BaseMobileHeader } from "./BaseMobileHeader.js"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"

/** A special header that is used for multiselect state on mobile. */
export const MultiselectMobileHeader = pureComponent(({ list, message }: { list: SomeList; message: string }) => {
	return m(BaseMobileHeader, {
		left: m(SelectAllCheckbox, { list: list }),
		center: m(".font-weight-600", message),
		right: m(IconButton, {
			icon: Icons.Cancel,
			title: "cancel_action",
			click: () => list.selectNone(),
		}),
	})
})
