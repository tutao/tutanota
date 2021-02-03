//@flow
import {Request} from "../../api/common/WorkerProtocol"
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {ButtonType} from "../../gui/base/ButtonN"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()


export function registerForUpdates() {
	import("../common/NativeWrapper").then(({nativeApp}) => {
		return nativeApp.initialized().then(() => nativeApp.invokeNative(new Request('isUpdateAvailable', [])))
		                .then(updateInfo => {
			                if (updateInfo) {
				                let message = {view: () => m("", lang.get("updateAvailable_label", {"{version}": updateInfo.version}))}
				                import("../../gui/base/NotificationOverlay.js").then(module => module.show(message, {label: "postpone_action"},
					                [
						                {
							                label: "installNow_action",
							                click: () => nativeApp.invokeNative(new Request('manualUpdate', [])),
							                type: ButtonType.Primary
						                }
					                ]))
			                }
		                })
	})
}