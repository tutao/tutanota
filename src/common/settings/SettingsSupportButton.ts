import { pureComponent } from "../gui/base/PureComponent"
import m from "mithril"
import { BaseButton } from "../gui/base/buttons/BaseButton"
import { theme } from "../gui/theme"
import { lang } from "../misc/LanguageViewModel"
import { Icon, IconSize } from "../gui/base/Icon"
import { Icons } from "../gui/base/icons/Icons"
import { LoginController } from "../api/main/LoginController"

export const SettingsSupportButton = pureComponent(function SettingsSupportButton({ logins }: { logins: LoginController }) {
	return m(BaseButton, {
		class: "flash flex center-vertically pt-8 pb-8 plr-12 border-radius",
		style: {
			border: `1px solid ${theme.outline}`,
			color: theme.on_surface_variant,
		},
		label: "supportMenu_label",
		text: m(".pl-4", lang.getTranslation("supportMenu_label").text),
		icon: m(Icon, {
			icon: Icons.ChatbubbleFilled,
			size: IconSize.PX24,
			class: "center-h",
			container: "div",
			style: { fill: theme.on_surface_variant },
		}),
		onclick: async () => {
			const { getSupportUsageTestStage } = await import("../support/SupportUsageTestUtils.js")
			const { showSupportDialog } = await import("../support/SupportDialog.js")

			const triggerStage = getSupportUsageTestStage(0)
			triggerStage.setMetric({ name: "Trigger", value: "Settings" })
			void triggerStage.complete()

			void showSupportDialog(logins)
		},
	})
})
