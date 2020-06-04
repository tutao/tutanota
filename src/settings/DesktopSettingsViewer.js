// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {Request} from "../api/common/WorkerProtocol.js"
import {showProgressDialog} from "../gui/ProgressDialog.js"
import {noOp} from "../api/common/utils/Utils"
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
import type {NativeWrapper} from "../native/common/NativeWrapper"
import type {DesktopConfigKeyEnum} from "../desktop/config/ConfigKeys"
import {typeof DesktopConfigKey} from "../desktop/config/ConfigKeys"

assertMainOrNode()

const DownloadLocationStrategy = Object.freeze({
	ALWAYS_ASK: 0,
	CHOOSE_DIRECTORY: 1
})

export class DesktopSettingsViewer implements UpdatableSettingsViewer {
	_isDefaultMailtoHandler: Stream<?boolean>;
	_defaultDownloadPath: Stream<string>;
	_runAsTrayApp: Stream<?boolean>;
	_runOnStartup: Stream<?boolean>;
	_checkSpelling: Stream<?boolean>;
	_isIntegrated: Stream<?boolean>;
	_isAutoUpdateEnabled: Stream<?boolean>;
	_showAutoUpdateOption: boolean;
	_updateAvailable: Stream<boolean>;
	_mailExportMode: Stream<MailExportMode>
	_isPathDialogOpen: boolean;
	_nativeApp: Promise<NativeWrapper>
	_configKeys: Promise<DesktopConfigKey>

	constructor() {
		this._nativeApp = import("../native/common/NativeWrapper").then((module) => module.nativeApp)
		this._isDefaultMailtoHandler = stream(false)
		this._runAsTrayApp = stream(true)
		this._runOnStartup = stream(false)
		this._checkSpelling = stream(true)
		this._isIntegrated = stream(false)
		this._isAutoUpdateEnabled = stream(false)
		this._showAutoUpdateOption = true
		this._updateAvailable = stream(false)
		this._mailExportMode = stream("msg") // msg is just a dummy value here, it will be overwritten in requestDesktopConfig
		this._configKeys = import("../desktop/config/ConfigKeys").then((configKeys) => {
			return configKeys.DesktopConfigKey
		})
		this._requestDesktopConfig()
	}

	view(): Children {
		const setDefaultMailtoHandlerAttrs: DropDownSelectorAttrs<boolean> = {
			label: "defaultMailHandler_label",
			helpLabel: () => lang.get("defaultMailHandler_msg"),
			items: [
				{name: lang.get("unregistered_label"), value: false},
				{name: lang.get("registered_label"), value: true}
			],
			selectedValue: this._isDefaultMailtoHandler,
			selectionChangedHandler: v => {
				showProgressDialog("pleaseWait_msg", this._updateDefaultMailtoHandler(v))
					.then(() => {
						this._isDefaultMailtoHandler(v)
						m.redraw()
					})
			}
		}

		const setRunInBackgroundAttrs: DropDownSelectorAttrs<boolean> = {
			label: "runInBackground_action",
			helpLabel: () => {
				const lnk = lang.getInfoLink("runInBackground_link")
				return [
					m("span", lang.get("runInBackground_msg") + " "),
					m("span", lang.get("moreInfo_msg") + " "),
					m("span.text-break", [m(`a[href=${lnk}][target=_blank]`, lnk)])
				]
			},
			items: [
				{name: lang.get("yes_label"), value: true},
				{name: lang.get("no_label"), value: false}
			],
			selectedValue: this._runAsTrayApp,
			selectionChangedHandler: v => {
				this._runAsTrayApp(v)
				this.updateConfigBoolean('runAsTrayApp', v)
			}
		}

		const setRunOnStartupAttrs: DropDownSelectorAttrs<boolean> = {
			label: "runOnStartup_action",
			items: [
				{name: lang.get("yes_label"), value: true},
				{name: lang.get("no_label"), value: false}
			],
			selectedValue: this._runOnStartup,
			selectionChangedHandler: v => { // this may take a while
				showProgressDialog("pleaseWait_msg", this._toggeAutoLaunchInNative(v))
					.then(() => {
						this._runOnStartup(v)
						m.redraw()
					})
			}
		}

		const setSpellCheckingAttrs: DropDownSelectorAttrs<boolean> = {
			label: "checkSpelling_action",
			helpLabel: () => lang.get("requiresNewWindow_msg"),
			items: [
				{name: lang.get("yes_label"), value: true},
				{name: lang.get("no_label"), value: false}
			],
			selectedValue: this._checkSpelling,
			selectionChangedHandler: v => {
				this._checkSpelling(v)
				this.updateConfigBoolean('spellcheck', v)
			}
		}

		const setDesktopIntegrationAttrs: DropDownSelectorAttrs<boolean> = {
			label: "desktopIntegration_label",
			items: [
				{name: lang.get("activated_label"), value: true},
				{name: lang.get("deactivated_label"), value: false}
			],
			selectedValue: this._isIntegrated,
			selectionChangedHandler: v => {
				showProgressDialog("pleaseWait_msg", this._updateDesktopIntegration(v))
					.then(() => {
						this._isIntegrated(v)
						m.redraw()
					})
					.catch(e => Dialog.error("unknownError_msg", e.message))
			}
		}

		const setMailExportModeAttrs: DropDownSelectorAttrs<MailExportMode> = {
			label: "mailExportMode_label",
			helpLabel: () => lang.get("mailExportModeHelp_msg"),
			items: [
				{name: "EML", value: "eml"},
				{name: "MSG (Outlook)", value: "msg"}
			],
			selectedValue: this._mailExportMode,
			selectionChangedHandler: v => {
				this._mailExportMode(v)
				this.updateConfig("mailExportMode", v)
			}
		}


		const updateHelpLabelAttrs: UpdateHelpLabelAttrs = {
			updateAvailable: this._updateAvailable
		}

		const setAutoUpdateAttrs: DropDownSelectorAttrs<boolean> = {
			label: "autoUpdate_label",
			helpLabel: () => m(DesktopUpdateHelpLabel, updateHelpLabelAttrs),
			items: [
				{name: lang.get("activated_label"), value: true},
				{name: lang.get("deactivated_label"), value: false}
			],
			selectedValue: this._isAutoUpdateEnabled,
			selectionChangedHandler: v => {
				this._isAutoUpdateEnabled(v)
				this.updateConfigBoolean('enableAutoUpdate', v)
			}
		}

		const changeDefaultDownloadPathAttrs: ButtonAttrs = attachDropdown({
			label: "edit_action",
			type: ButtonType.Action,
			click: noOp,
			icon: () => Icons.Edit
		}, () => [
			{
				label: "alwaysAsk_action",
				click: () => this.setDefaultDownloadPath(DownloadLocationStrategy.ALWAYS_ASK),
				type: ButtonType.Dropdown
			},
			{
				label: "chooseDirectory_action",
				click: () => this.setDefaultDownloadPath(DownloadLocationStrategy.CHOOSE_DIRECTORY),
				type: ButtonType.Dropdown
			}
		], () => !this._isPathDialogOpen, 200)

		const defaultDownloadPathAttrs: TextFieldAttrs = {
			label: "defaultDownloadPath_label",
			value: this._defaultDownloadPath,
			injectionsRight: () => m(ButtonN, changeDefaultDownloadPathAttrs),
			disabled: true
		}

		return [
			m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
				m(".h4.mt-l", lang.get('desktopSettings_label')),
				m(DropDownSelectorN, setSpellCheckingAttrs),
				env.platformId === 'linux' ? null : m(DropDownSelectorN, setDefaultMailtoHandlerAttrs),
				env.platformId === 'darwin' ? null : m(DropDownSelectorN, setRunInBackgroundAttrs),
				m(DropDownSelectorN, setRunOnStartupAttrs),
				m(TextFieldN, defaultDownloadPathAttrs),
				m(DropDownSelectorN, setMailExportModeAttrs),
				env.platformId === 'linux' ? m(DropDownSelectorN, setDesktopIntegrationAttrs) : null,
				this._showAutoUpdateOption ? m(DropDownSelectorN, setAutoUpdateAttrs) : null,
			])
		]
	}

	_toggeAutoLaunchInNative(enable: boolean): Promise<*> {
		return import("../native/common/NativeWrapper").then(({nativeApp}) => {
			return nativeApp.invokeNative(new Request(enable ? 'enableAutoLaunch' : 'disableAutoLaunch', []))
		})
	}

	_updateDefaultMailtoHandler(shouldBeDefaultMailtoHandler: boolean): Promise<void> {
		return this._nativeApp.then((nativeApp) => {
			if (shouldBeDefaultMailtoHandler) {
				return nativeApp.invokeNative(new Request('registerMailto', []))
			} else {
				return nativeApp.invokeNative(new Request('unregisterMailto', []))
			}
		})
	}

	_updateDesktopIntegration(shouldIntegrate: boolean): Promise<void> {
		return this._nativeApp.then((nativeApp) => {
			if (shouldIntegrate) {
				return nativeApp.invokeNative(new Request('integrateDesktop', []))
			} else {
				return nativeApp.invokeNative(new Request('unIntegrateDesktop', []))
			}
		})
	}

	_requestDesktopConfig() {
		this._defaultDownloadPath = stream(lang.get('alwaysAsk_action'))

		Promise.all([import("../native/main/SystemApp"), this._configKeys])
		       .then(([systemApp, DesktopConfigKey]) => {
			       return Promise.all([
				       systemApp.getIntegrationInfo(),
				       systemApp.getConfigValue(DesktopConfigKey.defaultDownloadPath),
				       systemApp.getConfigValue(DesktopConfigKey.runAsTrayApp),
				       systemApp.getConfigValue(DesktopConfigKey.showAutoUpdateOption),
				       systemApp.getConfigValue(DesktopConfigKey.enableAutoUpdate),
				       systemApp.getConfigValue(DesktopConfigKey.mailExportMode)
			       ]).then((result) => {
				       const [integrationInfo, defaultDownloadPath, runAsTrayApp, showAutoUpdateOption, enableAutoUpdate, mailExportMode] = result
				       const {isMailtoHandler, isAutoLaunchEnabled, isIntegrated, isUpdateAvailable} = integrationInfo

				       this._isDefaultMailtoHandler(isMailtoHandler)
				       this._defaultDownloadPath(defaultDownloadPath || lang.get('alwaysAsk_action'))
				       this._runAsTrayApp(runAsTrayApp)
				       this._runOnStartup(isAutoLaunchEnabled)
				       this._isIntegrated(isIntegrated)
				       this._showAutoUpdateOption = showAutoUpdateOption
				       this._isAutoUpdateEnabled(enableAutoUpdate)
				       this._updateAvailable(isUpdateAvailable)
				       this._mailExportMode(mailExportMode)
				       m.redraw()
			       })
		       })
	}

	updateConfigBoolean(setting: DesktopConfigKeyEnum, value: boolean): void {
		return this.updateConfig(setting, value)
	}

	updateConfig<T>(setting: DesktopConfigKeyEnum, value: T): void {
		import("../native/main/SystemApp").then((systemApp) => {
			return systemApp.setConfigValue(setting, value)
			                .then(() => m.redraw())
		})
	}

	setDefaultDownloadPath(v: $Values<typeof DownloadLocationStrategy>): Promise<void> {
		this._isPathDialogOpen = true

		return Promise
			.resolve(
				v === DownloadLocationStrategy.ALWAYS_ASK
					? Promise.resolve([null])
					: import("../native/common/FileApp").then(({fileApp}) => fileApp.openFolderChooser())
			)
			.then((newPaths) => {
				this._defaultDownloadPath(newPaths[0] ? newPaths[0] : lang.get('alwaysAsk_action'))
				return this._configKeys.then((DesktopConfigKey) => this.updateConfig(DesktopConfigKey.defaultDownloadPath, newPaths[0]))
			})
			.then(() => {
				this._isPathDialogOpen = false
				m.redraw()
			})
	}

	onAppUpdateAvailable(): void {
		this._updateAvailable(true)
		m.redraw()
	}


	// this is all local for now
	entityEventsReceived: (() => Promise<void>) = () => Promise.resolve()
}
