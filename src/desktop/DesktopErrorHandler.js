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

	constructor() {
		this._errorLogPath = path.join(app.getPath('userData'), 'lasterror.log')
	}

	// these listeners can only be set after the app ready event
	init() {
		// check if there's an error log on disk
		if (fs.existsSync(this._errorLogPath)) {
			try {
				const lastErrorLog: ?ErrorLog = JSON.parse(fs.readFileSync(this._errorLogPath).toString())
				if (lastErrorLog) {
					console.log('found error log')
					this._sendErrorReport(ApplicationWindow.getLastFocused().id, lastErrorLog)
					    .then(() => fs.unlinkSync(this._errorLogPath))
				}
			} catch (e) {
			}
		}

		process.on('uncaughtException', error => {
			this.handleUnexpectedFailure(error)
		}).on('unhandledRejection', (error, p) => {
			this.handleUnexpectedFailure(error)
		})
	}

	handleUnexpectedFailure(error: Error) {
		const errorLog = {
			name: error.name ? error.name : '?',
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
						fs.writeFileSync(this._errorLogPath, JSON.stringify(errorLog))
						app.relaunch({args: process.argv.slice(1)})
						app.exit(0)
					} else {
						const loggedInWindow = ApplicationWindow.getAll().find(w => w.getTitle() !== LOGIN_TITLE)
						if (loggedInWindow) {
							this._sendErrorReport(loggedInWindow.id, errorLog)
						} else {
							this._sendErrorReport(ApplicationWindow.getLastFocused().id, errorLog)
						}
					}
				}
			})
		} else { // failure before first web app loaded
			// ignore and hope it wasn't important
			// may later send to error report service if that gets implemented
		}
	}

	_sendErrorReport(windowId: number, lastErrorLog: ErrorLog) {
		return lang.initialized.promise
		           .then(() => {
			           const subject = `Feedback desktop client - ${lastErrorLog.name}`
			           const text = [
				           `=== ${lang.get('yourMessage_label')} ===`,
				           '',
				           '',
				           '=== System Info ===',
				           '',
				           `Platform: ${lastErrorLog.platform}`,
				           `Tutanota Version: ${lastErrorLog.version}`,
				           '',
				           'Error Message:',
				           `${lastErrorLog.message}`,
				           '',
				           'Stacktrace:',
				           `${lastErrorLog.stack}`,
			           ].join('<br>')
			           return ipc.sendRequest(windowId, 'createMailEditor', [[], text, ["support@tutao.de"], subject, null])
		           })
	}

	// replace absolute file paths in stack trace with nicer ones relative to the app
	_betterStack(stack: string): string {
		return stack.replace(/^\s*?at .*?\((.*?):/gm, (match, pathGroup) => {
			return '<br>' + match.replace(pathGroup, path.relative(app.getAppPath(), pathGroup))
		})
	}
}

export const err = new DesktopErrorHandler()

