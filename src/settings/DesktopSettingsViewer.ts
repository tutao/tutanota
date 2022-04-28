import m, {Children} from "mithril"
import {InfoLink, lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {Request} from "../api/common/MessageDispatcher"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {noOp} from "@tutao/tutanota-utils"
import {Icons} from "../gui/base/icons/Icons"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {attachDropdown} from "../gui/base/DropdownN"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
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
	private readonly _isDefaultMailtoHandler: Stream<boolean | null>
	private _defaultDownloadPath!: Stream<string>
	private readonly _runAsTrayApp: Stream<boolean | null>
	private readonly _runOnStartup: Stream<boolean | null>
	private readonly _spellCheckLang: Stream<string>
	private readonly _isIntegrated: Stream<boolean | null>
	private readonly _isAutoUpdateEnabled: Stream<boolean | null>
	_showAutoUpdateOption: boolean
	private readonly _updateAvailable: Stream<boolean>
	private readonly _mailExportMode: Stream<MailExportMode>
	private _isPathDialogOpen: boolean = false
	private _offlineStorageValue: Stream<boolean>

	constructor() {
		this._isDefaultMailtoHandler = stream<boolean | null>(false)
		this._runAsTrayApp = stream<boolean | null>(true)
		this._runOnStartup = stream<boolean | null>(false)
		this._spellCheckLang = stream("")
		this._isIntegrated = stream<boolean | null>(false)
		this._isAutoUpdateEnabled = stream<boolean | null>(false)
		this._showAutoUpdateOption = true
		this._updateAvailable = stream<boolean>(false)
		this._mailExportMode = stream<MailExportMode>("msg") // msg is just a dummy value here, it will be overwritten in requestDesktopConfig
		this._offlineStorageValue = stream<boolean>(false)
	}

	oninit() {
		this._requestDesktopConfig()
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
			selectedValue: this._isDefaultMailtoHandler(),
			selectionChangedHandler: v => {
				showProgressDialog("pleaseWait_msg", this._updateDefaultMailtoHandler(v)).then(() => {
					this._isDefaultMailtoHandler(v)

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
			selectedValue: this._runAsTrayApp(),
			selectionChangedHandler: v => {
				this._runAsTrayApp(v)

				this.updateConfigBoolean(DesktopConfigKey.runAsTrayApp, v)
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
			selectedValue: this._runOnStartup(),
			selectionChangedHandler: v => {
				// this may take a while
				showProgressDialog("pleaseWait_msg", this._toggleAutoLaunchInNative(v)).then(() => {
					this._runOnStartup(v)

					m.redraw()
				})
			},
		}
		const editSpellcheckLanguageButtonAttrs: ButtonAttrs = {
			label: "checkSpelling_action",
			click: () => showSpellcheckLanguageDialog().then(newLabel => this._spellCheckLang(newLabel)),
			icon: () => Icons.Edit,
		}
		const spellcheckLanguageAttrs: TextFieldAttrs = {
			label: "checkSpelling_action",
			value: this._spellCheckLang(),
			oninput: this._spellCheckLang,
			disabled: true,
			injectionsRight: () => [m(ButtonN, editSpellcheckLanguageButtonAttrs)],
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
			selectedValue: this._isIntegrated(),
			selectionChangedHandler: v => {
				showProgressDialog("pleaseWait_msg", this._updateDesktopIntegration(v))
					.then(() => {
						this._isIntegrated(v)

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
			selectedValue: this._mailExportMode(),
			selectionChangedHandler: v => {
				this._mailExportMode(v)

				this.updateConfig(DesktopConfigKey.mailExportMode, v)
			},
		}
		const updateHelpLabelAttrs: UpdateHelpLabelAttrs = {
			updateAvailable: this._updateAvailable,
			manualUpdate: () => locator.native.invokeNative(new Request("manualUpdate", [])),
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
			selectedValue: this._isAutoUpdateEnabled(),
			selectionChangedHandler: v => {
				this._isAutoUpdateEnabled(v)

				this.updateConfigBoolean(DesktopConfigKey.enableAutoUpdate, v)
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
				], showDropdown: () => !this._isPathDialogOpen, width: 200
			},
		)
		const defaultDownloadPathAttrs: TextFieldAttrs = {
			label: "defaultDownloadPath_label",
			value: this._defaultDownloadPath(),
			oninput: this._defaultDownloadPath,
			injectionsRight: () => m(ButtonN, changeDefaultDownloadPathAttrs),
			disabled: true,
		}

		const setOfflineStorageAttrs: DropDownSelectorAttrs<any> = {
			label: "offlineStorage_label",
			helpLabel: undefined,
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
			selectedValue: this._offlineStorageValue,
			selectionChangedHandler: (v) => {
				this._offlineStorageValue(v)
				this.updateConfigBoolean(DesktopConfigKey.offlineStorageEnabled, v)
			}

		}
		return [
			m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
				m(".h4.mt-l", lang.get("desktopSettings_label")),
				// spell check is done via OS on mac
				env.platformId === "darwin" ? null : m(TextFieldN, spellcheckLanguageAttrs),
				// setting protocol handler via Electron does not work on Linux
				env.platformId === "linux" ? null : m(DropDownSelectorN, setDefaultMailtoHandlerAttrs),
				// mac doesn't really have run in background, you can just close a window
				env.platformId === "darwin" ? null : m(DropDownSelectorN, setRunInBackgroundAttrs),
				m(DropDownSelectorN, setRunOnStartupAttrs),
				m(TextFieldN, defaultDownloadPathAttrs),
				m(DropDownSelectorN, setMailExportModeAttrs),
				// AppImage is kind of a portable install so we optionally add desktop icons etc
				env.platformId === "linux" ? m(DropDownSelectorN, setDesktopIntegrationAttrs) : null,
				this._showAutoUpdateOption ? m(DropDownSelectorN, setAutoUpdateAttrs) : null,
				m(DropDownSelectorN, setOfflineStorageAttrs),
			]),
		]
	}

	private _toggleAutoLaunchInNative(enable: boolean): Promise<any> {
		return locator.native.invokeNative(new Request(enable ? "enableAutoLaunch" : "disableAutoLaunch", []))
	}

	private _updateDefaultMailtoHandler(shouldBeDefaultMailtoHandler: boolean): Promise<void> {
		if (shouldBeDefaultMailtoHandler) {
			return locator.native.invokeNative(new Request("registerMailto", []))
		} else {
			return locator.native.invokeNative(new Request("unregisterMailto", []))
		}
	}

	private _updateDesktopIntegration(shouldIntegrate: boolean): Promise<void> {
		if (shouldIntegrate) {
			return locator.native.invokeNative(new Request("integrateDesktop", []))
		} else {
			return locator.native.invokeNative(new Request("unIntegrateDesktop", []))
		}
	}

	private async _requestDesktopConfig() {
		this._defaultDownloadPath = stream(lang.get("alwaysAsk_action"))
		const [
			integrationInfo,
			defaultDownloadPath,
			runAsTrayApp,
			showAutoUpdateOption,
			enableAutoUpdate,
			mailExportMode,
			spellcheckLabel,
			offlineStorage,
		] = await Promise.all([
			locator.systemApp.getIntegrationInfo(),
			locator.systemApp.getConfigValue(DesktopConfigKey.defaultDownloadPath),
			locator.systemApp.getConfigValue(DesktopConfigKey.runAsTrayApp),
			locator.systemApp.getConfigValue(DesktopConfigKey.showAutoUpdateOption),
			locator.systemApp.getConfigValue(DesktopConfigKey.enableAutoUpdate),
			locator.systemApp.getConfigValue(DesktopConfigKey.mailExportMode),
			getCurrentSpellcheckLanguageLabel(),
			locator.systemApp.getConfigValue(DesktopConfigKey.offlineStorageEnabled),
		])
		const {isMailtoHandler, isAutoLaunchEnabled, isIntegrated, isUpdateAvailable} = integrationInfo

		this._isDefaultMailtoHandler(isMailtoHandler)

		this._defaultDownloadPath(defaultDownloadPath || lang.get("alwaysAsk_action"))

		this._runAsTrayApp(runAsTrayApp)

		this._runOnStartup(isAutoLaunchEnabled)

		this._isIntegrated(isIntegrated)

		this._showAutoUpdateOption = showAutoUpdateOption

		this._isAutoUpdateEnabled(enableAutoUpdate)

		this._updateAvailable(isUpdateAvailable)

		this._mailExportMode(mailExportMode)

		this._spellCheckLang(spellcheckLabel)

		this._offlineStorageValue(offlineStorage)

		m.redraw()
	}

	async updateConfigBoolean(setting: DesktopConfigKey, value: boolean): Promise<void> {
		await this.updateConfig(setting, value)
	}

	async updateConfig<T>(setting: DesktopConfigKey, value: T): Promise<void> {
		await locator.systemApp.setConfigValue(setting, value)
		m.redraw()
	}

	async setDefaultDownloadPath(v: DownloadLocationStrategy): Promise<void> {
		this._isPathDialogOpen = true

		let savePath: string | null
		if (v === DownloadLocationStrategy.ALWAYS_ASK) {
			savePath = null
		} else {
			const chosenPaths = await locator.fileApp.openFolderChooser()
			savePath = chosenPaths[0] ?? null
		}

		this._defaultDownloadPath(savePath ?? lang.get("alwaysAsk_action"))

		await this.updateConfig(DesktopConfigKey.defaultDownloadPath, savePath)
		this._isPathDialogOpen = false
	}

	onAppUpdateAvailable(): void {
		this._updateAvailable(true)

		m.redraw()
	}

	// this is all local for now
	entityEventsReceived: () => Promise<void> = () => Promise.resolve()
}