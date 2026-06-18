import m, { Child, Children, Component, Vnode } from "mithril"

export type TimeZoneSelectorAttrs = {}

export class TimeZoneSelector implements Component<TimeZoneSelectorAttrs> {
	constructor({ attrs }: Vnode<TimeZoneSelectorAttrs>) {}

	view({ attrs }: Vnode<TimeZoneSelectorAttrs>): Children {
		return m("div", "Timezone Selector Page")
	}
}
