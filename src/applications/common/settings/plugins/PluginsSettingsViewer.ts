import m, { Children } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../ui/base/BaseSearchBar.js"
import { theme } from "../../../../ui/theme.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import ColumnEmptyMessageBox from "../../../../ui/base/ColumnEmptyMessageBox.js"
import { PluginSettingsModel } from "./PluginSettingsModel.js"
import { PluginFeaturedCard } from "./PluginFeaturedCard.js"
import { PluginListRow } from "./PluginListRow.js"
import { UpdatableSettingsViewer } from "../Interfaces"
import { KNOWN_PLUGINS } from "../../../../plugin-kit/sdk/PluginId"
import { mailLocator } from "../../../mail-app/mailLocator"
import { isEmpty, isNotNull } from "@tutao/utils"

export class PluginsSettingsViewer implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private readonly model: PluginSettingsModel

	constructor() {
		this.model = new PluginSettingsModel(mailLocator.pluginConfigurationProvider, mailLocator.pluginManager)
	}

	view(): Children {
		return m("#plugin-settings.fill-absolute.scroll.plr-24.pb-48", [
			this.renderFeaturedPlugins(),
			m(".h4.mt-32", lang.get("pluginsAll_label")),
			this.renderSearchBar(),
			this.renderPluginList(),
		])
	}

	private renderFeaturedPlugins(): Children {
		return [
			m(".h4.mt-32", lang.get("pluginsFeatured_label")),
			m(
				".flex.flex-wrap.gap-16",
				this.model.featuredPlugins
					.map((pluginId) => this.model.getPluginManifest(pluginId))
					.filter(isNotNull)
					.map((pluginManifest) =>
						m(PluginFeaturedCard, { name: pluginManifest.name, logoSvgUrl: pluginManifest.logoSvgUrl, key: pluginManifest.id }),
					),
			),
		]
	}

	oncreate(): void {
		this.model.setConfigChangeListener(() => m.redraw())
	}

	onremove(): void {
		this.model.setConfigChangeListener(() => {})
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
			onKeyDown: (e) => e.stopPropagation(),
		} satisfies BaseSearchBarAttrs)
	}

	private renderPluginList(): Children {
		const query = this.searchQuery.toLowerCase()
		const filteredPluginIds = KNOWN_PLUGINS.map((pluginId) => this.model.getPluginManifest(pluginId))
			.filter(isNotNull)
			.filter((entry) => entry.name.toLowerCase().includes(query) || entry.description.toLowerCase().includes(query))
			.map((manifest) => manifest.id)

		return m(
			".plugin-list.rel",
			isEmpty(filteredPluginIds)
				? m(ColumnEmptyMessageBox, {
						color: theme.on_surface_variant,
						icon: Icons.Search,
						message: "noEntries_msg",
					})
				: filteredPluginIds.map((pluginId) =>
						m(PluginListRow, {
							key: pluginId,
							pluginId,
							model: this.model,
						}),
					),
		)
	}

	async onEntityUpdatesReceived(): Promise<void> {
		// noop
		// entity events related to plugin is handeled by pluginManager
	}
}
