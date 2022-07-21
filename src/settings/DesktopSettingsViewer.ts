import m, {Children} from "mithril"
import {InfoLink, lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {noOp} from "@tutao/tutanota-utils"
import {Icons} from "../gui/base/icons/Icons"
import type {TextFieldAttrs} from "../gui/base/TextField.js"
import {TextField} from "../gui/base/TextField.js"
import type {ButtonAttrs} from "../gui/base/Button.js"
import {Button, ButtonType} from "../gui/base/Button.js"
import {attachDropdown} from "../gui/base/Dropdown.js"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelector.js"
import {DropDownSelector} from "../gui/base/DropDownSelector.js"
import {Dialog} from "../gui/base/Dialog"
import type {UpdateHelpLabelAttrs} from "./DesktopUpdateHelpLabel"
import {DesktopUpdateHelpLabel} from "./DesktopUpdateHelpLabel"
import type {MailExportMode} from "../mail/export/Exporter"
import {DesktopConfigKey} from "../desktop/config/ConfigKeys"
import {getCurrentSpellcheckLanguageLabel, showSpellcheckLanguageDialog} from "../gui/dialogs/SpellcheckLanguageDialog"
import {ifAllowedTutanotaLinks} from "../gui/base/GuiUtils"
import type {UpdatableSettingsViewer} from "./SettingsView"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"

assertMainOrNode()

enum DownloadLocationStrategy {
	ALWAYS_ASK,
	CHOOSE_DIRECTORY,
}

export class DesktopSettingsViewer implements UpdatableSettingsViewer {
	private readonly isDefaultMailtoHandler: Stream<boolean | null>
	private defaultDownloadPath!: Stream<string>
	private readonly runAsTrayApp: Stream<boolean | null>
	private readonly runOnStartup: Stream<boolean | null>
	private readonly spellCheckLang: Stream<string>
	private readonly isIntegrated: Stream<boolean | null>
	private readonly isAutoUpdateEnabled: Stream<boolean | null>
	private showAutoUpdateOption: boolean
	private readonly updateAvailable: Stream<boolean>
	private readonly mailExportMode: Stream<MailExportMode>
	private isPathDialogOpen: boolean = false
	private offlineStorageValue: Stream<boolean>

	constructor() {
		this.isDefaultMailtoHandler = stream<boolean | null>(false)
		this.runAsTrayApp = stream<boolean | null>(true)
		this.runOnStartup = stream<boolean | null>(false)
		this.spellCheckLang = stream("")
		this.isIntegrated = stream<boolean | null>(false)
		this.isAutoUpdateEnabled = stream<boolean | null>(false)
		this.showAutoUpdateOption = true
		this.updateAvailable = stream<boolean>(false)
		this.mailExportMode = stream<MailExportMode>("msg") // msg is just a dummy value here, it will be overwritten in requestDesktopConfig
		this.offlineStorageValue = stream<boolean>(false)
	}

	oninit() {
		this.requestDesktopConfig()
	}

	view(): Children {
		const setDefaultMailtoHandlerAttrs: DropDownSelectorAttrs<boolean> = {
			label: "defaultMailHandler_label",
			helpLabel: () => lang.get("defaultMailHandler_msg"),
			items: [
				{
					name: lang.get("unregistered_label"),
					value: false,
				},
				{
					name: lang.get("registered_label"),
					value: true,
				},
			],
			selectedValue: this.isDefaultMailtoHandler(),
			selectionChangedHandler: v => {
				showProgressDialog("pleaseWait_msg", this.updateDefaultMailtoHandler(v)).then(() => {
					this.isDefaultMailtoHandler(v)

					m.redraw()
				})
			},
		}
		const setRunInBackgroundAttrs: DropDownSelectorAttrs<boolean> = {
			label: "runInBackground_action",
			helpLabel: () => {
				return ifAllowedTutanotaLinks(InfoLink.RunInBackground, link => [
					m("span", lang.get("runInBackground_msg") + " "),
					m("span", lang.get("moreInfo_msg") + " "),
					m("span.text-break", [m(`a[href=${link}][target=_blank]`, link)]),
				])
			},
			items: [
				{
					name: lang.get("yes_label"),
					value: true,
				},
				{
					name: lang.get("no_label"),
					value: false,
				},
			],
			selectedValue: this.runAsTrayApp(),
			selectionChangedHandler: v => {
				this.runAsTrayApp(v)

				this.setBooleanValue(DesktopConfigKey.runAsTrayApp, v)
			},
		}
		const setRunOnStartupAttrs: DropDownSelectorAttrs<boolean> = {
			label: "runOnStartup_action",
			items: [
				{
					name: lang.get("yes_label"),
					value: true,
				},
				{
					name: lang.get("no_label"),
					value: false,
				},
			],
			selectedValue: this.runOnStartup(),
			selectionChangedHandler: v => {
				// this may take a while
				showProgressDialog("pleaseWait_msg", this.toggleAutoLaunchInNative(v)).then(() => {
					this.runOnStartup(v)

					m.redraw()
				})
			},
		}
		const editSpellcheckLanguageButtonAttrs: ButtonAttrs = {
			label: "checkSpelling_action",
			click: () => showSpellcheckLanguageDialog().then(newLabel => this.spellCheckLang(newLabel)),
			icon: () => Icons.Edit,
		}
		const spellcheckLanguageAttrs: TextFieldAttrs = {
			label: "checkSpelling_action",
			value: this.spellCheckLang(),
			oninput: this.spellCheckLang,
			disabled: true,
			injectionsRight: () => [m(Button, editSpellcheckLanguageButtonAttrs)],
			helpLabel: () => lang.get("requiresNewWindow_msg"),
		}
		const setDesktopIntegrationAttrs: DropDownSelectorAttrs<boolean> = {
			label: "desktopIntegration_label",
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
			],
			selectedValue: this.isIntegrated(),
			selectionChangedHandler: v => {
				showProgressDialog("pleaseWait_msg", this.updateDesktopIntegration(v))
					.then(() => {
						this.isIntegrated(v)

						m.redraw()
					})
					.catch(e => Dialog.message("unknownError_msg", e.message))
			},
		}
		const setMailExportModeAttrs: DropDownSelectorAttrs<MailExportMode> = {
			label: "mailExportMode_label",
			helpLabel: () => lang.get("mailExportModeHelp_msg"),
			items: [
				{
					name: "EML",
					value: "eml",
				},
				{
					name: "MSG (Outlook)",
					value: "msg",
				},
			],
			selectedValue: this.mailExportMode(),
			selectionChangedHandler: v => {
				this.mailExportMode(v)

				this.setStringValue(DesktopConfigKey.mailExportMode, v)
			},
		}
		const updateHelpLabelAttrs: UpdateHelpLabelAttrs = {
			updateAvailable: this.updateAvailable,
			manualUpdate: () => locator.desktopSettingsFacade.manualUpdate()
		}
		const setAutoUpdateAttrs: DropDownSelectorAttrs<boolean> = {
			label: "autoUpdate_label",
			helpLabel: () => m(DesktopUpdateHelpLabel, updateHelpLabelAttrs),
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
			],
			selectedValue: this.isAutoUpdateEnabled(),
			selectionChangedHandler: v => {
				this.isAutoUpdateEnabled(v)

				this.setBooleanValue(DesktopConfigKey.enableAutoUpdate, v)
			},
		}
		const changeDefaultDownloadPathAttrs: ButtonAttrs = attachDropdown(
			{
				mainButtonAttrs: {
					label: "edit_action",
					type: ButtonType.Action,
					click: noOp,
					icon: () => Icons.Edit,
				}, childAttrs: () => [
					{
						label: "alwaysAsk_action",
						click: () => this.setDefaultDownloadPath(DownloadLocationStrategy.ALWAYS_ASK),
						type: ButtonType.Dropdown,
					},
					{
						label: "chooseDirectory_action",
						click: () => this.setDefaultDownloadPath(DownloadLocationStrategy.CHOOSE_DIRECTORY),
						type: ButtonType.Dropdown,
					},
				], showDropdown: () => !this.isPathDialogOpen, width: 200
			},
		)
		const defaultDownloadPathAttrs: TextFieldAttrs = {
			label: "defaultDownloadPath_label",
			value: this.defaultDownloadPath(),
			oninput: this.defaultDownloadPath,
			injectionsRight: () => m(Button, changeDefaultDownloadPathAttrs),
			disabled: true,
		}

		return [
			m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
				m(".h4.mt-l", lang.get("desktopSettings_label")),
				// spell check is done via OS on mac
				env.platformId === "darwin" ? null : m(TextField, spellcheckLanguageAttrs),
				// setting protocol handler via Electron does not work on Linux
				env.platformId === "linux" ? null : m(DropDownSelector, setDefaultMailtoHandlerAttrs),
				// mac doesn't really have run in background, you can just close a window
				env.platformId === "darwin" ? null : m(DropDownSelector, setRunInBackgroundAttrs),
				m(DropDownSelector, setRunOnStartupAttrs),
				m(TextField, defaultDownloadPathAttrs),
				m(DropDownSelector, setMailExportModeAttrs),
				// AppImage is kind of a portable install so we optionally add desktop icons etc
				env.platformId === "linux" ? m(DropDownSelector, setDesktopIntegrationAttrs) : null,
				this.showAutoUpdateOption ? m(DropDownSelector, setAutoUpdateAttrs) : null,
			]),
		]
	}

	private toggleAutoLaunchInNative(enable: boolean): Promise<void> {
		return enable
			? locator.desktopSettingsFacade.enableAutoLaunch()
			: locator.desktopSettingsFacade.disableAutoLaunch()
	}

	private updateDefaultMailtoHandler(shouldBeDefaultMailtoHandler: boolean): Promise<void> {
		return shouldBeDefaultMailtoHandler
			? locator.desktopSettingsFacade.registerMailto()
			: locator.desktopSettingsFacade.unregisterMailto()
	}

	private updateDesktopIntegration(shouldIntegrate: boolean): Promise<void> {
		return shouldIntegrate
			? locator.desktopSettingsFacade.integrateDesktop()
			: locator.desktopSettingsFacade.unIntegrateDesktop()
	}

	private async requestDesktopConfig() {
		this.defaultDownloadPath = stream(lang.get("alwaysAsk_action"))
		const [
			integrationInfo,
			defaultDownloadPath,
			runAsTrayApp,
			showAutoUpdateOption,
			enableAutoUpdate,
			mailExportMode,
			spellcheckLabel,
		] = await Promise.all([
			locator.desktopSettingsFacade.getIntegrationInfo(),
			locator.desktopSettingsFacade.getStringConfigValue(DesktopConfigKey.defaultDownloadPath),
			locator.desktopSettingsFacade.getBooleanConfigValue(DesktopConfigKey.runAsTrayApp),
			locator.desktopSettingsFacade.getBooleanConfigValue(DesktopConfigKey.showAutoUpdateOption),
			locator.desktopSettingsFacade.getBooleanConfigValue(DesktopConfigKey.enableAutoUpdate),
			locator.desktopSettingsFacade.getStringConfigValue(DesktopConfigKey.mailExportMode),
			getCurrentSpellcheckLanguageLabel(),
		])
		const {isMailtoHandler, isAutoLaunchEnabled, isIntegrated, isUpdateAvailable} = integrationInfo

		this.isDefaultMailtoHandler(isMailtoHandler)

		this.defaultDownloadPath(defaultDownloadPath || lang.get("alwaysAsk_action"))

		this.runAsTrayApp(runAsTrayApp)

		this.runOnStartup(isAutoLaunchEnabled)

		this.isIntegrated(isIntegrated)

		this.showAutoUpdateOption = showAutoUpdateOption

		this.isAutoUpdateEnabled(enableAutoUpdate)

		this.updateAvailable(isUpdateAvailable)

		this.mailExportMode(mailExportMode as MailExportMode)

		this.spellCheckLang(spellcheckLabel)

		m.redraw()
	}

	async setBooleanValue(setting: DesktopConfigKey, value: boolean): Promise<void> {
		await locator.desktopSettingsFacade.setBooleanConfigValue(setting, value)
		m.redraw()
	}

	async setStringValue(setting: DesktopConfigKey, value: string | null): Promise<void> {
		await locator.desktopSettingsFacade.setStringConfigValue(setting, value)
		m.redraw()
	}

	async setDefaultDownloadPath(v: DownloadLocationStrategy): Promise<void> {
		this.isPathDialogOpen = true

		let savePath: string | null
		if (v === DownloadLocationStrategy.ALWAYS_ASK) {
			savePath = null
		} else {
			savePath = await locator.fileApp.openFolderChooser()
		}

		this.defaultDownloadPath(savePath ?? lang.get("alwaysAsk_action"))

		await this.setStringValue(DesktopConfigKey.defaultDownloadPath, savePath)
		this.isPathDialogOpen = false
	}

	onAppUpdateAvailable(): void {
		this.updateAvailable(true)

		m.redraw()
	}

	// this is all local for now
	entityEventsReceived: () => Promise<void> = () => Promise.resolve()
}