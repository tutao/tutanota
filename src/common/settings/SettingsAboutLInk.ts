import { pureComponent } from "../gui/base/PureComponent"
import { lang } from "../misc/LanguageViewModel"
import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { AboutDialog } from "./AboutDialog"
import { calendarLocator } from "../../calendar-app/calendarLocator"
import { theme } from "../gui/theme"

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
