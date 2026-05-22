import m from "mithril"
import { LoginController } from "../api/main/LoginController"
import { pureComponent } from "../../../ui/base/PureComponent"
import { BaseButton } from "../../../ui/base/buttons/BaseButton"
import { theme } from "../../../ui/theme"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icon, IconSize } from "../../../ui/base/Icon"
import { Icons } from "../../../ui/base/icons/Icons"

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
