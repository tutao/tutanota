import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"
import { ListElement } from "../api/common/utils/EntityUtils.js"
import { List, VirtualRow } from "./base/List.js"

export type SomeList = List<ListElement, VirtualRow<ListElement>>

export const EnterMultiselectIconButton = pureComponent(({ clickAction }: { clickAction: () => unknown }) =>
	m(IconButton, {
		icon: Icons.AddCheckCirle,
		title: "selectMultiple_action",
		click: () => {
			clickAction()
		},
	}),
)
