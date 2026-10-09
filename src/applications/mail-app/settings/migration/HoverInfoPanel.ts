import m, { ClassComponent, Children, Vnode } from "mithril"
import { Card } from "../../../../ui/base/Card"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { px } from "../../../../ui/size"

export interface HoverInfoPanelAttrs {
	left: number
	top: number
	message: string
	onDismiss: () => void
}

export class HoverInfoPanel implements ClassComponent<HoverInfoPanelAttrs> {
	view(vnode: Vnode<HoverInfoPanelAttrs>): Children {
		const { left, top, message, onDismiss } = vnode.attrs
		return m(
			".hover-panel.border.border-radius",
			{
				style: {
					left: px(left),
					top: px(top),
				},
				onanimationend: (event: AnimationEvent) => {
					if (event.animationName === "hover-panel-hide") {
						onDismiss()
					}
				},
			},
			m(Card, {}, [
				m(
					".flex.items-center.justify-center",
					m(Icon, {
						icon: Icons.InfoFilled,
						size: IconSize.PX32,
						style: {
							fill: theme.on_surface_variant,
						},
					}),
				),
				m("", message),
			]),
		)
	}
}
