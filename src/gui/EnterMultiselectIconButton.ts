import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"
import { SomeList } from "./SelectAllCheckbox.js"

export const EnterMultiselectIconButton = pureComponent(({ list }: { list: SomeList | null | undefined }) =>
	m(IconButton, {
		icon: Icons.AddCheckCirle,
		title: "selectMultiple_action",
		click: () => {
			// avoid having the viewed element as a preselected one which might be confusing.
			list?.selectNone()
			list?.enterMobileMultiselect()
		},
	}),
)
