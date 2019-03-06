//@flow
import m from "mithril"
import {assertMainOrNode, isAdminClient} from "../../api/Env"
import {worker} from "../../api/main/WorkerClient"
import {Dialog, DialogType} from "./Dialog"
import {DefaultAnimationTime} from "../animation/Animations"
import {lang} from "../../misc/LanguageViewModel"
import {progressIcon} from "./Icon"
import {PasswordIndicator} from "./PasswordIndicator"

assertMainOrNode()

export function showProgressDialog<T>(messageIdOrMessageFunction: TranslationKey | lazy<string>, action: Promise<T>, showProgress: ?boolean): Promise<T> {
	let progress = 0
	let progressIndicator = (showProgress === true) ? new PasswordIndicator(() => progress) : null
	let progressDialog = new Dialog(DialogType.Progress, {
		view: () => m("", [
			m(".flex-center", !showProgress ? progressIcon() : (progressIndicator ? m(progressIndicator) : null)),
			m("p", lang.getMaybeLazy(messageIdOrMessageFunction))
		])
	}).setCloseHandler(() => {
		// do not close progress on onClose event
	})
	let updater: progressUpdater = newProgress => {
		progress = newProgress
		m.redraw()
	}
	worker.registerProgressUpdater(updater)
	progressDialog.show()
	let start = new Date().getTime()

	let minDialogVisibilityMillis = isAdminClient() ? 0 : 1000

	return Promise.fromCallback(cb => {
		action.then(result => {
			let diff = new Date().getTime() - start
			setTimeout(() => {
				worker.unregisterProgressUpdater(updater)
				progressDialog.close()
				setTimeout(() => cb(null, result), DefaultAnimationTime)
			}, Math.max(minDialogVisibilityMillis - diff, 0))
		}).catch(e => {
			let diff = new Date().getTime() - start
			setTimeout(() => {
				worker.unregisterProgressUpdater(updater)
				progressDialog.close()
				setTimeout(() => cb(e), DefaultAnimationTime)
			}, Math.max(minDialogVisibilityMillis - diff, 0))
		})
	})
}