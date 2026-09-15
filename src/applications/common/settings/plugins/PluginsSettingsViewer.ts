import m, { Children } from "mithril"
import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../ui/base/BaseSearchBar.js"
import { theme } from "../../../../ui/theme.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import ColumnEmptyMessageBox from "../../../../ui/base/ColumnEmptyMessageBox.js"
import { mailLocator } from "../../../mail-app/mailLocator.js"
import { PLUGIN_REGISTRY } from "./PluginRegistry.js"
import { PluginSettingsModel } from "./PluginSettingsModel.js"
import { PluginFeaturedCard } from "./PluginFeaturedCard.js"
import { PluginListRow } from "./PluginListRow.js"

const FEATURED_COUNT = 3

export class PluginsSettingsViewer implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private expandedPluginId: string | null = null
	private switchRenderKeys: Record<string, number> = {}
	private readonly model: PluginSettingsModel

	constructor() {
		this.model = new PluginSettingsModel(mailLocator.pluginConfigurationProvider)
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
		} satisfies BaseSearchBarAttrs)
	}

	private renderPluginList(): Children {
		const query = this.searchQuery.toLowerCase()
		const filtered = PLUGIN_REGISTRY.filter((entry) => entry.name.toLowerCase().includes(query) || entry.description.toLowerCase().includes(query))

		if (filtered.length === 0) {
			return m(ColumnEmptyMessageBox, {
				color: theme.on_surface_variant,
				icon: Icons.Search,
				message: "noEntries_msg",
			})
		}

		return filtered.map((entry) =>
			m(PluginListRow, {
				key: entry.id,
				entry,
				state: this.model.getState(entry.id),
				expanded: this.expandedPluginId === entry.id,
				switchRenderKey: this.switchRenderKeys[entry.id] ?? 0,
				onToggleExpand: () => {
					this.expandedPluginId = this.expandedPluginId === entry.id ? null : entry.id
				},
				onToggleEnabled: (newChecked: boolean) => this.handleToggle(entry.id, newChecked),
				onConfigFieldChange: (key: string, value: string) => {
					this.model.setConfigField(entry.id, key, value).then(() => m.redraw())
				},
			}),
		)
	}

	private async handleToggle(pluginId: string, newChecked: boolean): Promise<void> {
		const confirmed = await Dialog.confirm(newChecked ? "confirmEnablePlugin_msg" : "confirmDisablePlugin_msg")
		if (confirmed) {
			await this.model.setEnabled(pluginId, newChecked)
		}
		this.switchRenderKeys[pluginId] = (this.switchRenderKeys[pluginId] ?? 0) + 1
		m.redraw()
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<unknown> {
		// no-op: plugin config is fetched imperatively via PluginConfigurationProvider, not EntityClient list subscriptions
		return Promise.resolve()
	}
}
