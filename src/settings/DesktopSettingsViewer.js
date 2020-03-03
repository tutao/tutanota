// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {nativeApp} from '../native/NativeWrapper.js'
import {Request} from "../api/common/WorkerProtocol.js"
import {showProgressDialog} from "../gui/base/ProgressDialog.js"
import {noOp} from "../api/common/utils/Utils"
import {Icons} from "../gui/base/icons/Icons"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {fileApp} from "../native/FileApp"
import {attachDropdown} from "../gui/base/DropdownN"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {Dialog} from "../gui/base/Dialog"

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
	_isIntegrated: Stream<?boolean>;
	_isAutoUpdateEnabled: Stream<?boolean>;
	_isPathDialogOpen: boolean;

	constructor() {
		this._isDefaultMailtoHandler = stream(false)
		this._runAsTrayApp = stream(true)
		this._runOnStartup = stream(false)
		this._isIntegrated = stream(false)
		this._isAutoUpdateEnabled = stream(false)
		this._requestDesktopConfig()
	}

	view() {
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

		const setRunAsTrayAppAttrs: DropDownSelectorAttrs<boolean> = {
			label: env.platformId === 'linux' ? "showTrayIcon_action" : "runAsTrayApp_action",
			helpLabel: env.platformId === 'linux' ? () => lang.get("mayNotWorkForAllDe_msg") : () => "",
			items: [
				{name: lang.get("yes_label"), value: true},
				{name: lang.get("no_label"), value: false}
			],
			selectedValue: this._runAsTrayApp,
			selectionChangedHandler: v => {
				this._runAsTrayApp(v)
				this.setBooleanSetting('runAsTrayApp', v)
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
				showProgressDialog("pleaseWait_msg",
					nativeApp.invokeNative(new Request(v
						? 'enableAutoLaunch'
						: 'disableAutoLaunch', [])),
				).then(() => {
					this._runOnStartup(v)
					m.redraw()
				})
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

		const setAutoUpdateAttrs: DropDownSelectorAttrs<boolean> = {
			label: "autoUpdate_label",
			items: [
				{name: lang.get("activated_label"), value: true},
				{name: lang.get("deactivated_label"), value: false}
			],
			selectedValue: this._isAutoUpdateEnabled,
			selectionChangedHandler: v => {
				this._isAutoUpdateEnabled(v)
				this.setBooleanSetting('enableAutoUpdate', v)
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
				env.platformId === 'linux' ? null : m(DropDownSelectorN, setDefaultMailtoHandlerAttrs),
				env.platformId === 'darwin' ? null : m(DropDownSelectorN, setRunAsTrayAppAttrs),
				m(DropDownSelectorN, setRunOnStartupAttrs),
				m(TextFieldN, defaultDownloadPathAttrs),
				env.platformId === 'linux' ? m(DropDownSelectorN, setDesktopIntegrationAttrs) : null,
				m(DropDownSelectorN, setAutoUpdateAttrs)
			])
		]
	}

	_updateDefaultMailtoHandler(shouldBeDefaultMailtoHandler: boolean): Promise<void> {
		if (shouldBeDefaultMailtoHandler) {
			return nativeApp.invokeNative(new Request('registerMailto', []))
		} else {
			return nativeApp.invokeNative(new Request('unregisterMailto', []))
		}
	}

	_updateDesktopIntegration(shouldIntegrate: boolean): Promise<void> {
		if (shouldIntegrate) {
			return nativeApp.invokeNative(new Request('integrateDesktop', []))
		} else {
			return nativeApp.invokeNative(new Request('unIntegrateDesktop', []))
		}
	}

	_requestDesktopConfig() {
		this._defaultDownloadPath = stream(lang.get('alwaysAsk_action'))
		nativeApp.invokeNative(new Request('sendDesktopConfig', []))
		         .then(desktopConfig => {
			         this._isDefaultMailtoHandler(desktopConfig.isMailtoHandler)
			         this._defaultDownloadPath(desktopConfig.defaultDownloadPath
				         ? desktopConfig.defaultDownloadPath
				         : lang.get('alwaysAsk_action')
			         )
			         this._runAsTrayApp(desktopConfig.runAsTrayApp)
			         this._runOnStartup(desktopConfig.runOnStartup)
			         this._isIntegrated(desktopConfig.isIntegrated)
			         this._isAutoUpdateEnabled(desktopConfig.enableAutoUpdate)
			         m.redraw()
		         })
	}

	setBooleanSetting(setting: string, value: boolean): void {
		nativeApp.invokeNative(new Request('sendDesktopConfig', []))
		         .then(config => {
			         config[setting] = value
			         return nativeApp.invokeNative(new Request('updateDesktopConfig', [config]))
		         }).then(() => m.redraw())
	}

	setDefaultDownloadPath(v: $Values<typeof DownloadLocationStrategy>) {
		this._isPathDialogOpen = true
		Promise.join(
			nativeApp.invokeNative(new Request('sendDesktopConfig', [])),
			v === DownloadLocationStrategy.ALWAYS_ASK
				? Promise.resolve([null])
				: fileApp.openFolderChooser(),
			(config, newPaths) => {
				config.defaultDownloadPath = newPaths[0]
				this._defaultDownloadPath(newPaths[0]
					? newPaths[0]
					: lang.get('alwaysAsk_action'))
				return config
			}).then(config => nativeApp.invokeNative(new Request('updateDesktopConfig', [config])))
		       .then(() => {
			       this._isPathDialogOpen = false
			       m.redraw()
		       })
	}

	// this is all local for now
	entityEventsReceived = noOp
}
