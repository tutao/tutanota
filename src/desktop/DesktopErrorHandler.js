// @flow
import {app, dialog} from 'electron'
import {lang} from './DesktopLocalizationProvider.js'
import {ApplicationWindow} from "./ApplicationWindow"
import {LOGIN_TITLE} from "../api/Env"
import fs from 'fs'
import path from 'path'
import os from 'os'
import {ipc} from "./IPC"

type ErrorLog = {|
	name: string,
	platform: string,
	message: string,
	stack: string,
	version: string
|}

class DesktopErrorHandler {
	_errorLogPath: string;
	lastErrorLog: ?ErrorLog;

	constructor() {
		this._errorLogPath = path.join(app.getPath('userData'), 'lasterror.log')
	}

	// these listeners can only be set after the app ready event
	init() {
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
		this.lastErrorLog = {
			name: error.name,
			platform: process.platform + ' ' + os.release(),
			message: error.message,
			stack: this._betterStack(error.stack),
			version: app.getVersion(),
		}
		// check if there's an application window to send a report
		if (lang.initialized.promise.isFulfilled()) {
			dialog.showMessageBox(null, {
				title: lang.get("errorReport_label"),
				buttons: [lang.get('cancel_action'), lang.get('yes_label')],
				defaultId: 1,
				message: lang.get("sendReport_msg"),
				checkboxLabel: lang.get("restartNow_label"),
				checkboxChecked: true,
				type: 'error'
			}, (result, restartNow) => {
				if (result === 1) { // clicked yes
					if (restartNow) {
						console.log('writing error log to', this._errorLogPath)
						fs.writeFileSync(this._errorLogPath, JSON.stringify(this.lastErrorLog))
						app.relaunch({args: process.argv.slice(1)})
						app.exit(0)
					} else {
						const loggedInWindow = ApplicationWindow.getAll().find(w => w.getTitle() !== LOGIN_TITLE)
						if (loggedInWindow) {
							this.sendErrorReport(loggedInWindow.id)
						} else {
							this.sendErrorReport(ApplicationWindow.getLastFocused(true).id)
						}
					}
				}
			})
		} else { // failure before first web app loaded
			// ignore and hope it wasn't important
			// may later send to error report service if that gets implemented
			console.warn("UI unavailable, ignored error:", error)
		}
	}

	sendErrorReport(windowId: number): Promise<any> {
		if (!this.lastErrorLog) {
			return Promise.resolve()
		}
		return lang.initialized.promise
		           .then(() => ipc.sendRequest(windowId, 'reportError', [this.lastErrorLog]))
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

export const err = new DesktopErrorHandler()

