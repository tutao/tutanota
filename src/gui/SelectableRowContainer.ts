import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"
import { theme } from "./theme.js"

export const SelectableRowContainer = pureComponent((_, children) => {
	return m(".flex.mt-s.mb-s.border-radius.pt-s.pb-s.pl-s.pr.mlr", children)
})

export function setSelectedRowStyle(innerContainer: HTMLElement, selected: boolean) {
	// "#F2F2F2" would be swell
	innerContainer.style.backgroundColor = selected ? theme.list_alternate_bg : ""
}

export function setVisibility(dom: HTMLElement, visible: boolean) {
	dom.style.display = visible ? "" : "none"
}
