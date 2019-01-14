// @flow
import {dialog} from 'electron'
import {lang} from './DesktopLocalizationProvider.js'

/**
 * errors due to invokeNative calls get handled on the calling side
 * errors before app.ready just kill the app
 * errors before lang.init() can't show localized message yet, also no window (dump error report to disk?)
 * errors after lang.init() could be passed to any browserwindow and be handled like uncaught errors in web app
 *
 */
class DesktopErrorHandler {

	constructor() {
	}

	// these listeners can only be set after the app ready event
	init() {
		process.on('uncaughtException', error => {
			this.handleUnexpectedFailure(error)
		})

		process.on('unhandledRejection', (error, p) => {
			this.handleUnexpectedFailure(error)
		})
	}

	handleUnexpectedFailure(error: Error) {
		dialog.showMessageBox(null, {
			title: lang.get("errorReport_label"),
			buttons: ['Ok'],
			defaultId: 0,
			message: lang.get("feedbackOnErrorInfo_msg") + '\n' + error.message,
			type: 'error'
		}, () => {
			process.exit(1)
		})
	}
}

export const err = new DesktopErrorHandler()

