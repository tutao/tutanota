import m, { Children } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../ui/base/BaseSearchBar.js"
import { theme } from "../../../../ui/theme.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import ColumnEmptyMessageBox from "../../../../ui/base/ColumnEmptyMessageBox.js"
import { mailLocator } from "../../../mail-app/mailLocator.js"
import { PLUGIN_REGISTRY } from "../../../../plugin-kit/plugins/PluginRegistry.js"
import { PluginSettingsModel } from "./PluginSettingsModel.js"
import { PluginFeaturedCard } from "./PluginFeaturedCard.js"
import { PluginListRow } from "./PluginListRow.js"
import { UpdatableSettingsViewer } from "../Interfaces"
import { EntityUpdateData } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils.js"

const FEATURED_COUNT = 3

export class PluginsSettingsViewer implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private readonly model: PluginSettingsModel

	constructor() {
		this.model = new PluginSettingsModel(mailLocator.pluginConfigurationProvider, mailLocator.pluginManager)
		this.model.loadAll().then(() => m.redraw())
	}

	view(): Children {
		return m("#plugin-settings.fill-absolute.scroll.plr-24.pb-48", [
			m(".h4.mt-32", lang.get("pluginsFeatured_label")),
			m(
				".flex.flex-wrap.gap-16",
				PLUGIN_REGISTRY.slice(0, FEATURED_COUNT).map((entry) => m(PluginFeaturedCard, { entry, key: entry.id })),
			),
			m(".h4.mt-32", lang.get("pluginsAll_label")),
			this.renderSearchBar(),
			this.renderPluginList(),
		])
	}

	private renderSearchBar(): Children {
		return m(BaseSearchBar, {
			text: this.searchQuery,
			busy: false,
			placeholder: lang.get("searchPlugins_placeholder"),
			onInput: (text) => {
				this.searchQuery = text
			},
			onClear: () => {
				this.searchQuery = ""
			},
			// prevent app-wide keyboard shortcuts from firing while typing a search term
			onKeyDown: (e) => e.stopPropagation(),
		} satisfies BaseSearchBarAttrs)
	}

	private renderPluginList(): Children {
		const query = this.searchQuery.toLowerCase()
		const filtered = PLUGIN_REGISTRY.filter((entry) => entry.name.toLowerCase().includes(query) || entry.description.toLowerCase().includes(query))

		// wrapped in a single container so this slot is always exactly one (unkeyed) vnode at the outer view()'s
		// array position — mithril requires every vnode within one fragment to be either all-keyed or all-unkeyed,
		// and returning a bare array of keyed PluginListRows here would sit alongside the outer array's unkeyed
		// headers/search bar, corrupting the diff (duplicated/missing DOM nodes).
		return m(
			".plugin-list",
			filtered.length === 0
				? m(ColumnEmptyMessageBox, {
						color: theme.on_surface_variant,
						icon: Icons.Search,
						message: "noEntries_msg",
					})
				: filtered.map((entry) =>
						m(PluginListRow, {
							key: entry.id,
							entry,
							model: this.model,
						}),
					),
		)
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		// no-op
	}
}
