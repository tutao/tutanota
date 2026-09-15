import m, { Children, Component, Vnode } from "mithril"
import { Switch, SwitchAttrs } from "../../../../ui/base/Switch.js"
import { ExpanderPanel } from "../../../../ui/base/Expander.js"
import { LegacyTextField, LegacyTextFieldAttrs } from "../../../../ui/base/LegacyTextField.js"
import { Button, ButtonAttrs, ButtonType } from "../../../../ui/base/Button.js"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { showInfoSnackbar } from "../../../../ui/base/SnackBar.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import type { TranslationKeyType } from "../../../../ui/utils/TranslationKey.js"
import { PluginRegistryEntry } from "../../../../plugin-kit/plugins/PluginRegistry.js"
import { PluginSettingsModel } from "./PluginSettingsModel.js"

export type PluginListRowAttrs = {
	entry: PluginRegistryEntry
	model: PluginSettingsModel
}

/** Single-line row: logo, name, description, enable Switch. The config panel is always shown while the plugin is enabled. */
export class PluginListRow implements Component<PluginListRowAttrs> {
	private switchRenderKey: number = 0
	private draftConfig: Record<string, string> | null = null

	view({ attrs }: Vnode<PluginListRowAttrs>): Children {
		const { entry, model } = attrs
		const state = model.getState(entry.id)

		if (state.enabled) {
			if (this.draftConfig == null) this.draftConfig = { ...state.config }
		} else {
			this.draftConfig = null
		}

		return m(".plugin-row", [
			m(".flex.items-center.gap-8.pt-8.pb-8", [
				m("img.icon-32", { src: `data:image/svg+xml;utf8,${encodeURIComponent(entry.logoSvg)}` }),
				m(".flex.flex-column.flex-grow.min-width-0", [
					m(".b.text-ellipsis", entry.name),
					m(".smaller.text-ellipsis.on-surface-variant", entry.description),
				]),
				m(Switch, {
					key: this.switchRenderKey,
					...({
						checked: state.enabled,
						ariaLabel: lang.get("pluginEnableToggle_label", { "{name}": entry.name }),
						onclick: (checked: boolean) => this.handleToggle(entry.id, model, checked),
					} satisfies SwitchAttrs),
				}),
			]),
			m(ExpanderPanel, { expanded: state.enabled }, state.enabled ? this.renderConfigPanel(entry, model) : null),
		])
	}

	private async handleToggle(pluginId: string, model: PluginSettingsModel, newChecked: boolean): Promise<void> {
		const confirmed = await Dialog.confirm(newChecked ? "confirmEnablePlugin_msg" : "confirmDisablePlugin_msg")
		if (confirmed) {
			await model.setEnabled(pluginId, newChecked)
		}
		this.switchRenderKey++
		m.redraw()
	}

	private renderConfigPanel(entry: PluginRegistryEntry, model: PluginSettingsModel): Children {
		const draft = this.draftConfig ?? {}
		return m(".pb-16.pl-32.flex.flex-column.gap-8", [
			...entry.configFields.map((field) =>
				m(LegacyTextField, {
					label: field.label as TranslationKeyType,
					value: draft[field.key] ?? "",
					oninput: (value: string) => {
						draft[field.key] = value
					},
				} satisfies LegacyTextFieldAttrs),
			),
			m(
				".flex",
				m(Button, {
					label: "update_action",
					type: ButtonType.Secondary,
					click: () => this.saveConfig(entry.id, model),
				} satisfies ButtonAttrs),
			),
		])
	}

	private async saveConfig(pluginId: string, model: PluginSettingsModel): Promise<void> {
		if (this.draftConfig != null) {
			await model.updateConfig(pluginId, this.draftConfig)
			showInfoSnackbar("pluginConfigUpdated_msg")
			m.redraw()
		}
	}
}
