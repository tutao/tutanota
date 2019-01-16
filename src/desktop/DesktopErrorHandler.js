// @flow
import {app, dialog} from 'electron'
import {lang} from './DesktopLocalizationProvider.js'
import {ApplicationWindow} from "./ApplicationWindow"
import {LOGIN_TITLE} from "../api/Env"
import fs from 'fs'
import path from 'path'
import os from 'os'
import {ipc} from "./IPC"

/**
 * errors due to invokeNative calls get handled on the calling side
 * errors before app.ready just kill the app
 * errors before lang.init() can't show localized message yet, also no window (dump error report to disk?)
 * errors after lang.init() could be passed to any browserwindow and be handled like uncaught errors in web app
 *
 */
class DesktopErrorHandler {
	_errorLogPath: string;

	constructor() {
		this._errorLogPath = path.join(app.getPath('userData'), 'lasterror.log')
	}

	// these listeners can only be set after the app ready event
	init() {
		// check if there's an error log
		if (fs.existsSync(this._errorLogPath)) {
			try {
				const lastErrorLog: ?{|
					name: string,
					platform: string,
					message: string,
					stack: string,
					version: string
				|} = JSON.parse(fs.readFileSync(this._errorLogPath).toString())
				lang.initialized.promise
				    .then(() => {
					    if (lastErrorLog) {
						    const subject = `Feedback desktop client - ${lastErrorLog.name}`
						    const text = [
							    `=== Your Message ===`,
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
						    ipc.sendRequest(ApplicationWindow.getLastFocused().id, 'createMailEditor', [[], text, ["support@tutao.de"], subject, null])
						       .then(() => {
							       fs.unlinkSync(this._errorLogPath)
						       })
					    }
				    })
				console.log('found error log')
			} catch (e) {
			}
		}

		process.on('uncaughtException', error => {
			this.handleUnexpectedFailure(error)
		})

		process.on('unhandledRejection', (error, p) => {
			this.handleUnexpectedFailure(error)
		})
	}

	handleUnexpectedFailure(error: Error) {
		// check if there's an application window to send a report
		const loggedInWindow = ApplicationWindow.getAll().find(w => w.getTitle() !== LOGIN_TITLE)
		if (loggedInWindow) {
			// immediately try to send report?
		} else if (lang.initialized.promise.isFulfilled()) {
			dialog.showMessageBox(null, {
				title: lang.get("errorReport_label"),
				buttons: [lang.get('yes_label'), lang.get('no_label')],
				defaultId: 0,
				message: lang.get("sendReportAfterRestart_msg"),
				checkboxLabel: lang.get("restartNow_label"),
				checkboxChecked: true,
				type: 'error'
			}, (result, restartNow) => {
				if (result === 0) { // clicked yes
					console.log('writing error log to', this._errorLogPath)
					fs.writeFileSync(this._errorLogPath, JSON.stringify({
						name: error.name ? error.name : '?',
						platform: process.platform + ' ' + os.release(),
						message: error.message,
						stack: this._betterStack(error.stack),
						version: app.getVersion(),
					}))
					if (restartNow) {
						app.relaunch({args: process.argv.slice(1)})
						app.exit(0)
					}
				}
			})
		} else { // failure before first web app loaded
			// ignore and hope it wasn't important
			// may later send to error report service if that gets implemented
		}
	}

	_betterStack(stack: string): string {
		const regExpPath = /^\s*?at .*?\((.*?):/gm
		const appPath = app.getAppPath()
		return stack.replace(regExpPath, (match, pathGroup) => {
			return '<br>' + match.replace(pathGroup, path.relative(appPath, pathGroup))
		})
	}
}

export const err = new DesktopErrorHandler()

