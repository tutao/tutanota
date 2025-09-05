import m, { ClassComponent, Vnode } from "mithril"
import { theme } from "./theme.js"
import { styles } from "./styles.js"
import { px, size } from "./size.js"
import { DefaultAnimationTime } from "./animation/Animations.js"
import { currentNavigationType, PrimaryNavigationType } from "../../RootView.js"

/** A function that can adjust the style of the selectable row. */
export type SelectableRowSelectedSetter = (selected: boolean, isInMultiselect: boolean) => unknown

export interface SelectableRowContainerAttrs {
	/** This function will be called with a setter for the row style once it's available. */
	onSelectedChangeRef?: (changer: SelectableRowSelectedSetter) => unknown
}

export class SelectableRowContainer implements ClassComponent<SelectableRowContainerAttrs> {
	private dom: HTMLElement | null = null
	private selected: boolean = false
	private isInMultiselect: boolean = false

	view({ attrs, children }: Vnode<SelectableRowContainerAttrs>) {
		return m(
			".flex.mb-4.border-radius.pt-12.pb-12.pl-12.pr-12.ml-8",
			{
				style: {
					paddingTop: "12px",
					paddingBottom: "12px",
					// this is an adjustment to keep tha columns aligned, space between columns is too big otherwise.
					// this is an obscure place to put it and ideally should not be done here or should be passed down here.
					marginRight: styles.isSingleColumnLayout() ? px(size.spacing_8) : "0",
					transition: `background 200ms`,
				},
				tabindex: "0",
				oncreate: ({ dom }) => {
					this.dom = dom as HTMLElement
					this.updateDomBg()
					attrs.onSelectedChangeRef?.((selected, isInMultiselect) => {
						this.selected = selected
						this.isInMultiselect = isInMultiselect
						this.updateDomBg()
					})
				},
				// Highlight the row when it is tabbed into
				onfocus: () => {
					if (SelectableRowContainer.isUsingKeyboard()) {
						this.setBackground(theme.state_bg_active)
					}
				},
				onblur: () => {
					if (SelectableRowContainer.isUsingKeyboard()) {
						if (this.selected && !styles.isSingleColumnLayout()) {
							this.setBackground(theme.state_bg_hover)
						} else {
							this.setBackground(theme.surface)
						}
					}
				},
				onpointerdown: () => this.setBackground(theme.state_bg_active),
				onpointerup: this.updateDomBg,
				onpointercancel: this.updateDomBg,
				onpointerleave: this.updateDomBg,
			},
			children,
		)
	}

	private setBackground(color: string) {
		if (this.dom) this.dom.style.backgroundColor = color
	}

	private static isUsingKeyboard() {
		return currentNavigationType === PrimaryNavigationType.Keyboard
	}

	private updateDomBg = () => {
		const isUsingKeyboard = SelectableRowContainer.isUsingKeyboard()
		// In the single column view, a row may be 'selected' by the URL still linking to a specific mail
		// So do not highlight in that case but in just multiselect mode and keyboard navigation
		const highlight = styles.isSingleColumnLayout() ? (this.isInMultiselect || isUsingKeyboard) && this.selected : this.selected
		this.setBackground(highlight ? theme.state_bg_hover : theme.surface)
	}
}

export function setVisibility(dom: HTMLElement, visible: boolean) {
	dom.style.display = visible ? "" : "none"
}

export function checkboxOpacity(dom: HTMLInputElement, selected: boolean) {
	if (selected) {
		dom.classList.remove("list-checkbox")
	} else {
		dom.classList.add("list-checkbox")
	}
}

export function shouldAlwaysShowMultiselectCheckbox() {
	return !styles.isUsingBottomNavigation()
}

// delay by 2 frames roughly so that the browser has time to do heavy stuff with layout
export const selectableRowAnimParams: KeyframeAnimationOptions = {
	duration: DefaultAnimationTime,
	easing: "ease-in-out",
	fill: "forwards",
	delay: 36,
}
export const scaleXHide = "scaleX(0)"
export const scaleXShow = "scaleX(1)"
