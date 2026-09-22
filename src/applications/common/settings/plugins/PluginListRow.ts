import m, { Children, Component, Vnode } from "mithril"
import { Switch, SwitchAttrs } from "../../../../ui/base/Switch.js"
import { ExpanderPanel } from "../../../../ui/base/Expander.js"
import { LegacyTextField, LegacyTextFieldAttrs } from "../../../../ui/base/LegacyTextField.js"
import { Button, ButtonAttrs, ButtonType } from "../../../../ui/base/Button.js"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { showInfoSnackbar } from "../../../../ui/base/SnackBar.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { PluginRegistryEntry } from "../../../../plugin-kit/plugins/PluginRegistry.js"
import { ConfigFieldConfiguration, PluginLanguageCode } from "../../../../plugin-kit/sdk/PluginHostApi.js"
import { PluginSettingsModel } from "./PluginSettingsModel.js"
import { isEmpty, isNotNull, Nullable } from "@tutao/utils"
import { PluginId } from "../../../../plugin-kit/sdk/PluginId"

function configFieldLabelText(field: ConfigFieldConfiguration): string {
	const preferredCode = lang.code.startsWith("de") ? PluginLanguageCode.de : PluginLanguageCode.en
	return field.text[preferredCode] ?? field.text[PluginLanguageCode.en] ?? field.text[PluginLanguageCode.de] ?? field.configFieldId
}

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
				// every sibling in this array needs a key once one of them (the Switch) does -
				// mithril requires a fragment's vnodes to be either all keyed or all unkeyed
				m("img.icon-32", { key: "logo", src: `data:image/svg+xml;utf8,${encodeURIComponent(entry.logoSvg)}` }),
				m(".flex.flex-column.flex-grow.min-width-0", { key: "text" }, [
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

	private async handleToggle(pluginId: PluginId, model: PluginSettingsModel, newChecked: boolean): Promise<void> {
		const confirmed = await Dialog.confirm(newChecked ? "confirmEnablePlugin_msg" : "confirmDisablePlugin_msg")
		if (confirmed) {
			await model.setEnabled(pluginId, newChecked)
		}
		this.switchRenderKey++
		m.redraw()
	}

	private renderConfigPanel(entry: PluginRegistryEntry, model: PluginSettingsModel): Nullable<Children> {
		const draft = this.draftConfig ?? {}
		const configFields = model.getConfigFields(entry.id)
		if (isEmpty(configFields)) {
			return null
		}

		const configFieldInputs = configFields.map((field) =>
			m(LegacyTextField, {
				label: lang.makeTranslation(field.configFieldId, configFieldLabelText(field)),
				value: draft[field.configFieldId] ?? "",
				oninput: (value: string) => {
					draft[field.configFieldId] = value
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
		if (isNotNull(this.draftConfig)) {
			await model.updateConfig(pluginId, this.draftConfig)
			showInfoSnackbar("pluginConfigUpdated_msg")
			m.redraw()
		}
	}
}
