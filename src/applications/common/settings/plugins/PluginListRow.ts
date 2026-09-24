import m, { Children, Component, Vnode } from "mithril"
import { Switch } from "../../../../ui/base/Switch.js"
import { ExpanderPanel } from "../../../../ui/base/Expander.js"
import { LegacyTextField, LegacyTextFieldAttrs } from "../../../../ui/base/LegacyTextField.js"
import { Button, ButtonAttrs, ButtonType } from "../../../../ui/base/Button.js"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { showInfoSnackbar } from "../../../../ui/base/SnackBar.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { PLUGIN_REGISTRY, PluginRegistryEntry } from "../../../../plugin-kit/plugins/PluginRegistry.js"
import { ConfigFieldConfiguration, PluginLanguageCode } from "../../../../plugin-kit/sdk/hostApi/PluginHostApi.js"
import { PluginSettingsModel } from "./PluginSettingsModel.js"
import { Nullable } from "@tutao/utils"
import { PluginId } from "../../../../plugin-kit/sdk/PluginId"

function configFieldLabelText(field: ConfigFieldConfiguration): string {
	const preferredCode = lang.code.startsWith("de") ? PluginLanguageCode.de : PluginLanguageCode.en
	return field.text[preferredCode] ?? field.text[PluginLanguageCode.en] ?? field.text[PluginLanguageCode.de] ?? field.configFieldId
}

export type PluginListRowAttrs = {
	pluginId: PluginId
	model: PluginSettingsModel
}

/** Single-line row: logo, name, description, enable Switch. The config panel is always shown while the plugin is enabled. */
export class PluginListRow implements Component<PluginListRowAttrs> {
	view({ attrs }: Vnode<PluginListRowAttrs>): Children {
		const { pluginId, model } = attrs

		const pluginIsLoaded = model.pluginIsLoaded(pluginId)
		const pluginManifest = PLUGIN_REGISTRY[pluginId]

		return m(".plugin-row", [
			m(".flex.items-center.gap-8.pt-8.pb-8", [
				m("img.icon-32", { src: `data:image/svg+xml;utf8,${encodeURIComponent(pluginManifest.logoSvgUrl)}` }),
				m(".flex.flex-column.flex-grow.min-width-0", [
					m(".b.text-ellipsis", pluginManifest.name),
					m(".smaller.text-ellipsis.on-surface-variant", pluginManifest.description),
				]),
				m(Switch, {
					checked: pluginIsLoaded,
					ariaLabel: lang.get("pluginEnableToggle_label", { "{name}": pluginManifest.name }),
					onclick: (isEnabled: boolean) => this.handleToggle(pluginId, model, isEnabled),
					variant: "normal",
				}),
			]),
			m(ExpanderPanel, { expanded: pluginIsLoaded }, pluginIsLoaded ? this.renderConfigPanel(pluginManifest, model) : null),
		])
	}

	private async handleToggle(pluginId: PluginId, model: PluginSettingsModel, newChecked: boolean): Promise<void> {
		const confirmed = await Dialog.confirm(newChecked ? "confirmEnablePlugin_msg" : "confirmDisablePlugin_msg")
		if (confirmed) {
			await model.setEnabled(pluginId, newChecked)
		}
		m.redraw()
	}

	private renderConfigPanel(entry: PluginRegistryEntry, model: PluginSettingsModel): Nullable<Children> {
		const configFields = model.getConfigFields(entry.id)

		const configFieldInputs = configFields.map((field) =>
			m(LegacyTextField, {
				label: lang.makeTranslation(field.configFieldId, configFieldLabelText(field)),
				value: model.getConfigFieldValue(entry.id, field.configFieldId) ?? "",
				oninput: (value: string) => {
					model.setConfigField(entry.id, field.configFieldId, value)
				},
			} satisfies LegacyTextFieldAttrs),
		)

		return m(".pb-16.pl-32.flex.flex-column.gap-8", [
			...configFieldInputs,
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

	private async saveConfig(pluginId: PluginId, model: PluginSettingsModel): Promise<void> {
		if (await model.updateConfig(pluginId)) {
			showInfoSnackbar("pluginConfigUpdated_msg")
		}
		m.redraw()
	}
}
