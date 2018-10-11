//@flow
import {assertMainOrNodeBoot, isApp} from "../api/Env"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {lang} from "../misc/LanguageViewModel"
import {windowFacade} from "../misc/WindowFacade"

assertMainOrNodeBoot()

function showUpdateOverlay(onUpdate: () => void) {
	notificationOverlay.show(lang.get("updateFound_label"), [
		{
			label: lang.get("releaseNotes_action"),
			onclick: () => windowFacade.openLink(`https://github.com/tutao/tutanota/releases/tag/tutanota-release-${env.versionNumber}`)
		},
		{
			label: lang.get("refresh_action"),
			onclick: onUpdate,
		}
	])
}

function showUpdateMessageIfNeeded(registration: ServiceWorkerRegistration) {
	const pending = registration.waiting || registration.installing
	if (pending && registration.active) {
		showUpdateOverlay(() => {
			console.log("registration.waiting: ", registration.waiting)
			registration.waiting && registration.waiting.postMessage("update")
		})
	}
}


export function init() {
	const serviceWorker = navigator.serviceWorker
	if (serviceWorker) {
		if (env.dist && !isApp()) {
			console.log("Registering ServiceWorker")
			serviceWorker.register("sw.js")
			             .then((registration) => {
				             console.log("ServiceWorker has been installed")
				             showUpdateMessageIfNeeded(registration)
				             registration.addEventListener("updatefound", () => {
					             console.log("updatefound")
					             showUpdateMessageIfNeeded(registration)
				             })
				             serviceWorker.addEventListener("controllerchange", () => {
					             console.log("controllerchange")
					             // Prevent losing user data, ask instead
					             // Even if it is a new ServiceWorker already, all code should be loaded at this point.
					             if (windowFacade.windowCloseConfirmation) {
						             if (window.confirm(lang.get("closeWindowConfirmation_msg"))) {
							             windowFacade.reload({})
						             }
					             } else {
						             windowFacade.reload({})
					             }
				             })
			             })
		}
	} else {
		console.log("ServiceWorker is not supported")
	}
}