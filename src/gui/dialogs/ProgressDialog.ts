//@flow
import m from "mithril"
import {assertMainOrNode, isAdminClient} from "../../api/common/Env"
import {Dialog, DialogType} from "../base/Dialog"
import {DefaultAnimationTime} from "../animation/Animations"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {progressIcon} from "../base/Icon"
import {PasswordIndicator} from "../PasswordIndicator"
import stream from "mithril/stream/stream.js"
import type {WorkerClient} from "../../api/main/WorkerClient"
import {TabIndex} from "../../api/common/TutanotaConstants"
import {delay} from "@tutao/tutanota-utils"
import type {lazy} from "@tutao/tutanota-utils"

assertMainOrNode()

export async function showProgressDialog<T>(messageIdOrMessageFunction: TranslationKey | lazy<string>, action: Promise<T>, progress?: Stream<number>): Promise<T> {
	const progressStream = progress
	let progressIndicator = null
	if (progressStream) {
		progressIndicator = new PasswordIndicator(() => progressStream())
		progressStream.map(() => m.redraw())
	}

	let progressDialog = new Dialog(DialogType.Progress, {
		view: () => m(".hide-outline", {
			// We make this element focusable so that the screen reader announces the dialog
			tabindex: TabIndex.Default,
			oncreate(vnode) {
				// We need to delay so that the eelement is attached to the parent
				setTimeout(() => {
					vnode.dom.focus()
				}, 10)
			}
		}, [
			m(".flex-center", progressIndicator ? m(progressIndicator) : progressIcon()),
			m("p#dialog-title", lang.getMaybeLazy(messageIdOrMessageFunction))
		])
	}).setCloseHandler(() => {
		// do not close progress on onClose event
	})

	progressDialog.show()
	let start = new Date().getTime()

	let minDialogVisibilityMillis = isAdminClient() ? 0 : 1000

	try {
		const result = await action
		const diff = Date.now() - start
		await delay(Math.max(minDialogVisibilityMillis - diff, 0))
		progressDialog.close()
		await delay(DefaultAnimationTime)
		return result
	} catch (e) {
		const diff = Date.now() - start
		await delay(Math.max(minDialogVisibilityMillis - diff, 0))
		progressDialog.close()
		await delay(DefaultAnimationTime)
		throw e
	}
}

export function showWorkerProgressDialog<T>(worker: WorkerClient, messageIdOrMessageFunction: TranslationKey | lazy<string>,
                                            action: Promise<T>
): Promise<T> {
	const progress = stream(0)
	worker.registerProgressUpdater(progress)

	return showProgressDialog(messageIdOrMessageFunction, action, progress)
		.finally(() => {
			worker.unregisterProgressUpdater(progress)
		})
}
