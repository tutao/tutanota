import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../../../ui/base/Card.js"
import { PluginRegistryEntry } from "./PluginRegistry.js"

export type PluginFeaturedCardAttrs = {
	entry: PluginRegistryEntry
}

/**
 * Built directly on Card rather than TitleSection: TitleSection centers content vertically for
 * hero/empty-state panels, but a featured plugin card wants a compact, left-aligned
 * logo + name + one-line description suited to a flex-wrap row.
 */
export class PluginFeaturedCard implements Component<PluginFeaturedCardAttrs> {
	view({ attrs: { entry } }: Vnode<PluginFeaturedCardAttrs>): Children {
		return m(
			Card,
			{ classes: ["flex", "flex-column", "gap-8"], style: { padding: "16px" } },
			m(".flex.items-center.gap-8", [m("img.icon-40", { src: `data:image/svg+xml;utf8,${encodeURIComponent(entry.logoSvg)}` }), m(".b", entry.name)]),
			m(".smaller.text-ellipsis", entry.description),
		)
	}
}
