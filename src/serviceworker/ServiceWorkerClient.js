//@flow
import {assertMainOrNodeBoot, isApp} from "../api/Env"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {lang} from "../misc/LanguageViewModel"
import {windowFacade} from "../misc/WindowFacade"
import {ButtonType} from "../gui/base/ButtonN"
import m from "mithril"

assertMainOrNodeBoot()

function showUpdateOverlay(onUpdate: () => void) {

	const notificationMessage: Component = {
		view: () => {
			return m("span", [
				lang.get("updateFound_label"),
				" ",
				m("a", {
					href: `https://github.com/tutao/tutanota/releases/`,
					target: "_blank"
				}, lang.get("releaseNotes_action"))
			])
		}
	}
	notificationOverlay.show(notificationMessage, [
		{
			label: "refresh_action",
			click: onUpdate,
			type: ButtonType.Primary
		}
	])
}

window.showUpdateDialog = showUpdateOverlay

function showUpdateMessageIfNeeded(registration: ServiceWorkerRegistration) {
	const pending = registration.waiting || registration.installing
	if (pending && registration.active) {
		showUpdateOverlay(() => {
			// user has confirmed update so we have to notify the service worker to force update of version.
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
				             const active = registration.active // Upon registration, check if we had an sw.
				             let refreshing = false // Prevent infinite reloading with devtools
				             serviceWorker.addEventListener("controllerchange", (e) => {
					             console.log("controllerchange")
					             if (!active || refreshing) {
						             // If we didn't have an sw, there's no need to reload, it's "installation" and not "update"
						             console.log(`Skip refreshing: active: ${active} refreshing: ${String(refreshing)}`)
						             return
					             }

					             // Prevent losing user data, ask instead
					             // Even if it is a new ServiceWorker already, all code should be loaded at this point.
					             if (windowFacade.windowCloseConfirmation) {
						             if (window.confirm(lang.get("closeWindowConfirmation_msg"))) {
							             refreshing = true
							             windowFacade.reload({})
						             }
					             } else {
						             refreshing = true
						             windowFacade.reload({})
					             }
				             })
			             })
		}
	} else {
		console.log("ServiceWorker is not supported")
	}
}