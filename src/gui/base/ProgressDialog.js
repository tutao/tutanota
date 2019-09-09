//@flow
import m from "mithril"
import {assertMainOrNode, isAdminClient} from "../../api/Env"
import {Dialog, DialogType} from "./Dialog"
import {DefaultAnimationTime} from "../animation/Animations"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {progressIcon} from "./Icon"
import {PasswordIndicator} from "./PasswordIndicator"
import stream from "mithril/stream/stream.js"
import {worker} from "../../api/main/WorkerClient"

assertMainOrNode()

export function showProgressDialog<T>(messageIdOrMessageFunction: TranslationKey | lazy<string>, action: Promise<T>, progress?: Stream<number>): Promise<T> {
	const progressStream = progress
	let progressIndicator = null
	if (progressStream) {
		progressIndicator = new PasswordIndicator(() => progressStream())
		progressStream.map(() => m.redraw())
	}

	let progressDialog = new Dialog(DialogType.Progress, {
		view: () => m("", [
			m(".flex-center", progressIndicator ? m(progressIndicator) : progressIcon()),
			m("p", lang.getMaybeLazy(messageIdOrMessageFunction))
		])
	}).setCloseHandler(() => {
		// do not close progress on onClose event
	})

	progressDialog.show()
	let start = new Date().getTime()

	let minDialogVisibilityMillis = isAdminClient() ? 0 : 1000
	return Promise.fromCallback(cb => {
		action.then(result => {
			let diff = new Date().getTime() - start
			setTimeout(() => {
				progressDialog.close()
				setTimeout(() => cb(null, result), DefaultAnimationTime)
			}, Math.max(minDialogVisibilityMillis - diff, 0))
		}).catch(e => {
			let diff = new Date().getTime() - start
			setTimeout(() => {
				progressDialog.close()
				setTimeout(() => cb(e), DefaultAnimationTime)
			}, Math.max(minDialogVisibilityMillis - diff, 0))
		})
	})
}

export function showWorkerProgressDialog<T>(messageIdOrMessageFunction: TranslationKey | lazy<string>, action: Promise<T>): Promise<T> {
	const progress = stream(0)
	worker.registerProgressUpdater(progress)

	return showProgressDialog(messageIdOrMessageFunction, action, progress)
		.finally(() => {
			worker.unregisterProgressUpdater(progress)
		})
}
