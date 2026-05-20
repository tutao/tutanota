import m from "mithril"
import { AboutDialog } from "./AboutDialog"
import { calendarLocator } from "../../calendar-app/calendarLocator"
import { pureComponent } from "../../../ui/base/PureComponent"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { theme } from "../../../ui/theme"
import { Dialog } from "../../../ui/base/Dialog"

export const SettingsAboutLInk = pureComponent(() => {
	const label = lang.getTranslationText("about_label")
	const versionLabel = `Tuta v${env.versionNumber}`
	return m("", [
		m(
			"button.text-center.small.no-text-decoration",
			{
				style: {
					backgroundColor: "transparent",
				},
				href: "#",
				"aria-label": label,
				"aria-description": versionLabel,
				"aria-haspopup": "dialog",
				onclick: showAboutDialog,
			},
			[
				m("", versionLabel),
				m(
					".b",
					{
						style: {
							color: theme.primary,
						},
					},
					label,
				),
			],
		),
	])
})

function showAboutDialog() {
	const dialog = Dialog.showActionDialog({
		title: "about_label",
		child: () =>
			m(AboutDialog, {
				onShowSetupWizard: () => {
					dialog.close()
					calendarLocator.showSetupWizard()
				},
			}),
		allowOkWithReturn: true,
		okAction: (dialog: Dialog) => dialog.close(),
		allowCancel: false,
	})
}
