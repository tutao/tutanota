import {isApp} from "../api/Env"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {lang} from "../misc/LanguageViewModel"


function showUpdateOverlay() {
	notificationOverlay.show(lang.get("updateFound_label"))
}

function showUpdateMessageIfNeeded(registration: ServiceWorkerRegistration) {
	const pending = registration.waiting || registration.installing
	if (pending && registration.active) {
		showUpdateOverlay()
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
			             })
		}
	} else {
		console.log("ServiceWorker is not supported")
	}
}