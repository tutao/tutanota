import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../../../ui/base/Card.js"
import { PluginRegistryEntry } from "../../../../plugin-kit/plugins/PluginRegistry.js"

export type PluginFeaturedCardAttrs = {
	entry: PluginRegistryEntry
}

/**
 * Built directly on Card rather than TitleSection: TitleSection is meant for a single hero/empty-state
 * panel, whereas this is one of several cards in a flex-wrap row - a large centered logo with the plugin
 * name below it, no description (kept to the row/list section below).
 */
export class PluginFeaturedCard implements Component<PluginFeaturedCardAttrs> {
	view({ attrs: { entry } }: Vnode<PluginFeaturedCardAttrs>): Children {
		return m(
			Card,
			{ classes: ["flex", "flex-column", "items-center", "gap-8"], style: { padding: "16px" } },
			m("img.icon-128", { src: `data:image/svg+xml;utf8,${encodeURIComponent(entry.logoSvg)}` }),
			m(".b", entry.name),
		)
	}
}
