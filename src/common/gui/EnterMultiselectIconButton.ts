import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"

export const EnterMultiselectIconButton = pureComponent(({ clickAction }: { clickAction: () => unknown }) =>
	m(IconButton, {
		icon: Icons.AddCheckCirle,
		title: "selectMultiple_action",
		click: () => {
			clickAction()
		},
	}),
)
