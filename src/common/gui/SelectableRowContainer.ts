import m, { ClassComponent, Vnode } from "mithril"
import { stateBgActive, stateBgHover } from "./builtinThemes.js"
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
			".flex.mb-xs.border-radius.pt-m.pb-m.pl.pr.ml-s",
			{
				style: {
					paddingTop: "14px",
					paddingBottom: "12px",
					// this is an adjustment to keep tha columns aligned, space between columns is too big otherwise.
					// this is an obscure place to put it and ideally should not be done here or should be passed down here.
					marginRight: styles.isSingleColumnLayout() ? px(size.hpad_small) : "0",
					transition: `background 200ms`,
				},
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
						this.setBackground(stateBgActive)
					}
				},
				onblur: () => {
					if (SelectableRowContainer.isUsingKeyboard()) {
						if (this.selected && !styles.isSingleColumnLayout()) {
							this.setBackground(stateBgHover)
						} else {
							this.setBackground(theme.list_bg)
						}
					}
				},
				onpointerdown: () => this.setBackground(stateBgActive),
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
		this.setBackground(highlight ? stateBgHover : theme.list_bg)
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
export const selectableRowAnimParams: KeyframeAnimationOptions = { duration: DefaultAnimationTime, easing: "ease-in-out", fill: "forwards", delay: 36 }
export const scaleXHide = "scaleX(0)"
export const scaleXShow = "scaleX(1)"
