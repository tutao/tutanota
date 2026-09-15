import m, { Children, Component, Vnode } from "mithril"
import { Switch, SwitchAttrs } from "../../../../ui/base/Switch.js"
import { ExpanderPanel } from "../../../../ui/base/Expander.js"
import { LegacyTextField, LegacyTextFieldAttrs } from "../../../../ui/base/LegacyTextField.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { PluginRegistryEntry } from "./PluginRegistry.js"
import { PluginState } from "./PluginSettingsModel.js"

export type PluginListRowAttrs = {
	entry: PluginRegistryEntry
	state: PluginState
	expanded: boolean
	switchRenderKey: number
	onToggleExpand: () => unknown
	onToggleEnabled: (enabled: boolean) => unknown
	onConfigFieldChange: (key: string, value: string) => unknown
}

/** Single-line row: logo, name, description, enable Switch; clicking the row expands an inline config panel. */
export class PluginListRow implements Component<PluginListRowAttrs> {
	view({ attrs }: Vnode<PluginListRowAttrs>): Children {
		const { entry, state, expanded } = attrs
		return m(".plugin-row", [
			m(".flex.items-center.gap-8.pt-8.pb-8.click", { onclick: attrs.onToggleExpand }, [
				m("img.icon-32", { src: `data:image/svg+xml;utf8,${encodeURIComponent(entry.logoSvg)}` }),
				m(".flex.flex-column.flex-grow.min-width-0", [
					m(".b.text-ellipsis", entry.name),
					m(".smaller.text-ellipsis.on-surface-variant", entry.description),
				]),
				m(
					"",
					{ onclick: (e: MouseEvent) => e.stopPropagation() },
					m(Switch, {
						key: attrs.switchRenderKey,
						...({
							checked: state.enabled,
							ariaLabel: lang.get("pluginEnableToggle_label", { "{name}": entry.name }),
							onclick: attrs.onToggleEnabled,
						} satisfies SwitchAttrs),
					}),
				),
			]),
			m(ExpanderPanel, { expanded }, expanded ? this.renderConfigPanel(attrs) : null),
		])
	}

	private renderConfigPanel({ entry, state, onConfigFieldChange }: PluginListRowAttrs): Children {
		return m(
			".pb-16.pl-32.flex.flex-column.gap-8",
			entry.configFields.map((field) =>
				m(LegacyTextField, {
					label: field.label,
					value: state.config[field.key] ?? "",
					disabled: !state.enabled,
					oninput: (value: string) => onConfigFieldChange(field.key, value),
				} satisfies LegacyTextFieldAttrs),
			),
		)
	}
}
