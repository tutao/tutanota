import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"
import { theme } from "./theme.js"

export const SelectableRowContainer = pureComponent((_, children) => {
	return m(".flex.mt-xs.border-radius.pt-m.pb-m.pl.pr.mlr-s", {
		style: {
			paddingTop: "14px",
			paddingBottom: "12px",
		}
	}, children)
})

export function setSelectedRowStyle(innerContainer: HTMLElement, selected: boolean) {
	// "#F2F2F2" would be swell
	// FIXME
	innerContainer.style.backgroundColor = selected ? "rgba(139, 139, 139, 0.22)" : ""
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