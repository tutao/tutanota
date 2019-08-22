// @flow
import {app, dialog} from 'electron'
import {lang} from "../misc/LanguageViewModel"
import {LOGIN_TITLE} from "../api/Env"
import fs from 'fs'
import path from 'path'
import os from 'os'
import type {IPC} from "./IPC"
import type {WindowManager} from "./DesktopWindowManager.js"

type ErrorLog = {|
	name: string,
	platform: string,
	message: string,
	stack: string,
	version: string
|}

class DesktopErrorHandler {
	_wm: WindowManager
	_ipc: IPC
	_errorLogPath: string;
	lastErrorLog: ?ErrorLog;
	_showingErrorDialog: boolean;

	constructor() {
		this._errorLogPath = path.join(app.getPath('userData'), 'lasterror.log')
		this._showingErrorDialog = false
	}

	// these listeners can only be set after the app ready event
	init(wm: WindowManager, ipc: IPC) {
		this._wm = wm
		this._ipc = ipc

		process.on('uncaughtException', error => {
			this.handleUnexpectedFailure(error)
		}).on('unhandledRejection', (error, p) => {
			this.handleUnexpectedFailure(error)
		})

		// check if there's an error log on disk
		if (fs.existsSync(this._errorLogPath)) {
			try {
				this.lastErrorLog = JSON.parse(fs.readFileSync(this._errorLogPath).toString())
				if (this.lastErrorLog) {
					console.log('found error log')
				}
			} catch (e) {
				console.warn("Could not read error log:", e)
			}
			try {
				fs.unlinkSync(this._errorLogPath)
			} catch (e) {
				console.warn("Could not delete error log:", e)
			}
		}
	}

	handleUnexpectedFailure(error: Error) {
		if (this._showingErrorDialog) {
			return
		}
		this._showingErrorDialog = true
		console.error("unexpected error:", error)
		this.lastErrorLog = {
			name: error.name,
			platform: process.platform + ' ' + os.release(),
			message: error.message,
			stack: this._betterStack(error.stack),
			version: app.getVersion(),
		}

		dialog.showMessageBox(null, {
			title: lang.get("errorReport_label"),
			buttons: [lang.get('cancel_action'), lang.get('yes_label')],
			defaultId: 1,
			message: lang.get("wantToSendReport_msg"),
			checkboxLabel: lang.get("restartBefore_action"),
			checkboxChecked: false,
			type: 'error'
		}).then(({response, checkboxChecked}) => {
			if (response === 1) { // clicked yes
				if (checkboxChecked) {
					console.log('writing error log to', this._errorLogPath)
					fs.writeFileSync(this._errorLogPath, this.lastErrorLog ? JSON.stringify(this.lastErrorLog) : "")
					app.relaunch({args: process.argv.slice(1)})
					app.exit(0)
				} else {
					const loggedInWindow = this._wm.getAll().find(w => w.getTitle() !== LOGIN_TITLE)
					if (loggedInWindow) {
						return this.sendErrorReport(loggedInWindow.id)
					} else {
						return this.sendErrorReport(this._wm.getLastFocused(true).id)
					}
				}
			}
		}).finally(() => {
			this._showingErrorDialog = false
		})
	}

	sendErrorReport(windowId: number): Promise<any> {
		if (!this.lastErrorLog) {
			return Promise.resolve()
		}
		return this._ipc.sendRequest(windowId, 'reportError', [this.lastErrorLog])
		           .then(() => this.lastErrorLog = null)
	}

	// replace absolute file paths in stack trace with nicer ones relative to the app
	_betterStack(stack: string): string {
		if (typeof stack !== 'string') {
			return ""
		}
		return stack.replace(/^\s*?at .*?\((.*?):/gm, (match, pathGroup) => {
			return match.replace(pathGroup, path.relative(app.getAppPath(), pathGroup))
		})
	}
}

export const err: DesktopErrorHandler = new DesktopErrorHandler()

