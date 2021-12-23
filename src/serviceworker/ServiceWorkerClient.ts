//@flow
import {assertMainOrNodeBoot, isApp, isDesktop, isTutanotaDomain} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import {windowFacade} from "../misc/WindowFacade"
import m from "mithril"
import {handleUncaughtError} from "../misc/ErrorHandler"
import {isSecurityError, objToError} from "../api/common/utils/Utils";

assertMainOrNodeBoot()

function showUpdateOverlay(onUpdate: () => void) {
	const notificationMessage: MComponent<void> = {
		view: () => {
			return m("span", [
				lang.get("updateFound_label"),
				" ",
				isTutanotaDomain()
					? m("a", {
						href: `https://github.com/tutao/tutanota/releases/`,
						target: "_blank"
					}, lang.get("releaseNotes_action"))
					: null
			])
		}
	}
	Promise.all([import("../gui/base/NotificationOverlay"), import("../gui/base/ButtonN")]).then(([notificationOverlay, {ButtonType}]) => {
		notificationOverlay.show(notificationMessage, {label: "postpone_action"}, [
			{
				label: "refresh_action",
				click: onUpdate,
				type: ButtonType.Primary
			}
		])
	})
}

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
		if (env.dist && !isApp() && !isDesktop()) {
			console.log("Registering ServiceWorker")
			serviceWorker.register(window.tutao.appState.prefixWithoutFile + "/sw.js")
			             .then((registration) => {
				             console.log("ServiceWorker has been installed")
				             showUpdateMessageIfNeeded(registration)
				             registration.addEventListener("updatefound", () => {
					             console.log("updatefound")
					             showUpdateMessageIfNeeded(registration)
				             })
				             const active = registration.active // Upon registration, check if we had an sw.
				             let refreshing = false // Prevent infinite reloading with devtools
				             serviceWorker.addEventListener("controllerchange", (e: Event) => {
					             console.log("controllerchange")
					             if (!active || refreshing) {
						             // If we didn't have an sw, there's no need to reload, it's "installation" and not "update"
						             console.log(`Skip refreshing: active: ${String(active)} refreshing: ${String(refreshing)}`)
						             return
					             }

					             windowFacade.windowCloseConfirmation = false
					             refreshing = true
					             windowFacade.reload({})
				             })

				             serviceWorker.addEventListener("message", (event: MessageEvent) => {
						             if (event.data == null || typeof event.data !== "object") {
							             console.error("Got strange message from sw", event.data)
							             return
						             }
						             if (event.data.type === "error") {
							             const unserializedError = objToError(event.data.value)
							             handleUncaughtError(unserializedError)
						             }
					             }
				             )
			             })
			             .catch(e => {
				             console.warn("Failed to register the service worker:", e.message)

				             // We get a rejection when trying to register the service worker in firefox with security settings like
				             // "Delete cookies and site data and site data when Firefox is closed" enabled
				             // Ignore this case but still allow other cases to show an error dialog
				             if (!isSecurityError(e)) {
					             throw e
				             }
			             })
		}
	} else {
		console.log("ServiceWorker is not supported")
	}
}
