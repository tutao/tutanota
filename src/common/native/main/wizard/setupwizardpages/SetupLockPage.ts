import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../../../gui/base/WizardDialog.js"
import { lang } from "../../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { SelectAppLockMethodView } from "../../SelectAppLockMethodDialog.js"
import { AppLockMethod } from "../../../common/generatedipc/AppLockMethod.js"
import { MobileSystemFacade } from "../../../common/generatedipc/MobileSystemFacade.js"
import { CredentialAuthenticationError } from "../../../../api/common/error/CredentialAuthenticationError.js"
import { CancelledError } from "../../../../api/common/error/CancelledError.js"

export class SetupLockPage implements Component<SetupLockPageAttrs> {
	view({ attrs }: Vnode<SetupLockPageAttrs>): Children {
		return m(SetupPageLayout, { image: "lock", buttonLabel: "finish_action" }, [
			m(SelectAppLockMethodView, {
				class: "mt",
				error: attrs.error,
				supportedModes: attrs.supportedModes,
				previousSelection: attrs.currentMode,
				onConfirm: null,
				onModeSelected: (mode) => (attrs.currentMode = mode),
			}),
		])
	}
}

export class SetupLockPageAttrs implements WizardPageAttrs<null> {
	hidePagingButtonForPage = false
	data: null = null

	error: string | null = null
	supportedModes: ReadonlyArray<AppLockMethod> = []
	currentMode: AppLockMethod = AppLockMethod.None

	constructor(public readonly mobileSystemFacade: MobileSystemFacade) {
		mobileSystemFacade.getSupportedAppLockMethods().then((supportedMethods) => {
			this.supportedModes = supportedMethods
			m.redraw()
		})
		this.mobileSystemFacade.getAppLockMethod().then((appLockMethod) => {
			this.currentMode = appLockMethod
			m.redraw()
		})
	}

	headerTitle(): string {
		return lang.get("credentialsEncryptionMode_label")
	}

	async nextAction(showDialogs: boolean): Promise<boolean> {
		try {
			await this.mobileSystemFacade.enforceAppLock(this.currentMode)
			await this.mobileSystemFacade.setAppLockMethod(this.currentMode)
		} catch (e) {
			if (e instanceof CredentialAuthenticationError) {
				this.error = e.message
				m.redraw()
				return false
			} else if (e instanceof CancelledError) {
				// if the user cancels, is unrecognized by Face ID, enters an incorrect device password, etc., we should not close the dialog
				// and instead let them try again or choose a different encryption mode
				return false
			} else {
				throw e
			}
		}

		// next action not available for this page
		return true
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return this.supportedModes.length > 1
	}
}
