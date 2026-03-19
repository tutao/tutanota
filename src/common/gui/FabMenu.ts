import m, { Children, Component, Vnode } from "mithril"
import { DropdownButtonAttrs } from "./base/Dropdown"
import { Icons } from "./base/icons/Icons"
import { ButtonColor } from "./base/Button"
import { IconButton } from "./base/IconButton"
import { ButtonSize } from "./base/ButtonSize"
import { lang, MaybeTranslation, Translation } from "../misc/LanguageViewModel"
import { theme } from "./theme"
import { pureComponent } from "./base/PureComponent"
import { BaseButton, BaseButtonAttrs } from "./base/buttons/BaseButton"
import { AllIcons, Icon, IconSize } from "./base/Icon"
import { ClickHandler } from "./base/GuiUtils"
import { BaseButtonClasses } from "./base/buttons/ButtonStyles"
import { px, size } from "./size"
import { DisplayState, onFabShown } from "./FloatingActionButton"

export interface FabMenuAttrs {
	actions: DropdownButtonAttrs[]
	title: Translation
}

/**
 * Component to show a FAB (floating action button) which expands to a menu.
 */
export class FabMenu implements Component<FabMenuAttrs> {
	private isMobileFabClicked: boolean = false
	private iconDom: HTMLElement | null = null

	oncreate() {
		onFabShown(DisplayState.Shown)
	}
	onremove() {
		onFabShown(DisplayState.Hidden)
	}

	view({ attrs: { actions, title } }: Vnode<FabMenuAttrs>): Children {
		return m("", [
			this.isMobileFabClicked
				? m(".fill-absolute.z3", {
						onclick: () => {
							this.close()
						},
						style: {
							backgroundColor: theme.scrim,
							opacity: "0.5",
						},
						oncreate: (vnode) => {
							vnode.dom.animate([{ opacity: 0 }, { opacity: 0.5 }], { duration: 200, iterations: 1 })
						},
						onbeforeremove: (vnode) => {
							return vnode.dom.animate([{ opacity: 0.5 }, { opacity: 0 }], { duration: 200, iterations: 1 }).finished
						},
					})
				: null,
			m(".fab-position.z4.gap-8.flex.col.items-end", [
				this.isMobileFabClicked
					? [
							actions.map((action, i) => {
								return m(FabMenuButton, {
									icon: action.icon,
									title: action.label,
									onclick: (event, dom) => {
										this.close()
										action.click?.(event, dom)
									},
									oncreate: (vnode) => {
										this.animateMenuButtonAppearance(vnode.dom, (actions.length - i) * 50)
									},
								})
							}),
						]
					: null,
				m(
					"fab.accent-bg.fab-shadow.fit-content.border-radius",
					m(IconButton, {
						icon: Icons.Plus,
						colors: ButtonColor.Fab,
						oncreate: ({ dom }) => {
							this.iconDom = dom.querySelector(".icon") as HTMLElement
							this.iconDom.style.transition = "transform 100ms"
						},
						click: (_, dom) => {
							// animate plus into "cancel" icon
							this.isMobileFabClicked = !this.isMobileFabClicked
							if (this.iconDom) {
								this.iconDom.style.transform = this.isMobileFabClicked ? " rotate(45deg)" : "rotate(0deg)"
							}
						},
						title: this.isMobileFabClicked ? "close_alt" : title,
						size: ButtonSize.Large,
						style: {
							// cancel IconButton's border radius to match the outer button
							borderRadius: "initial",
						},
					}),
				),
			]),
		])
	}
	private close() {
		this.isMobileFabClicked = false
		if (this.iconDom) {
			this.iconDom.style.transform = "rotate(0deg)"
		}
	}

	private animateMenuButtonAppearance(dom: Element, delay: number) {
		dom.animate(
			[
				{
					transform: "scale(0) translateY(8px)",
				},
				{
					transform: "scale(1) translateY(0)",
				},
			],
			{
				duration: 200,
				easing: "cubic-bezier(0,0.8,0.34,1)",
				delay,
				fill: "both",
			},
		)
	}
}

interface FabMenuButtonAttrs {
	icon?: AllIcons
	onclick: ClickHandler
	title: MaybeTranslation
}

const FabMenuButton = pureComponent<FabMenuButtonAttrs>(({ icon, onclick, title }) => {
	return m(BaseButton, {
		onclick,
		label: title,
		text: lang.getTranslationText(title),
		class: BaseButtonClasses.join(" ") + " base-button-lg",
		icon: icon
			? m(Icon, {
					icon: icon,
					size: IconSize.PX24,
					class: "center-h",
					container: "div",
					style: {
						fill: theme.on_primary_container,
					},
				})
			: null,
		style: {
			backgroundColor: theme.primary_container,
			color: theme.on_primary_container,
			padding: px(size.spacing_16),
			transformOrigin: "right bottom",
		},
	} satisfies BaseButtonAttrs)
})
