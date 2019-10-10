//@flow
import {defer, neverNull} from "../common/utils/Utils"
import {assertMainOrNodeBoot, getHttpOrigin} from "../Env"
import type {FeatureTypeEnum} from "../common/TutanotaConstants"

assertMainOrNodeBoot()

export class LoginController {
	_userController: ?IUserController; // decoupled to interface in order to reduce size of boot bundle
	customizations: ?NumberString[];
	waitForLogin: {resolve: Function, reject: Function, promise: Promise<void>} = defer()


	isUserLoggedIn(): boolean {
		return this._userController != null
	}

	waitForUserLogin(): Promise<void> {
		return this.waitForLogin.promise
	}

	loginComplete(): void {
		this.waitForLogin.resolve()
	}

	isInternalUserLoggedIn(): boolean {
		return this.isUserLoggedIn() && this.getUserController().isInternalUser()
	}

	isGlobalAdminUserLoggedIn(): boolean {
		return this.isUserLoggedIn() && this.getUserController().isGlobalAdmin()
	}

	getUserController(): IUserController {
		return neverNull(this._userController) // only to be used after login (when user is defined)
	}

	setUserController(userController: ?IUserController): void {
		this._userController = userController
	}

	isProdDisabled() {
		// we enable certain features only for certain customers in prod
		return getHttpOrigin().startsWith("https://mail.tutanota") && logins._userController != null
			&& logins._userController.user.customer !== 'Kq3X5tF--7-0' && logins._userController.user.customer
			!== 'Jwft3IR--7-0'
	}

	isEnabled(feature: FeatureTypeEnum): boolean {
		return this.customizations != null ? this.customizations.indexOf(feature) !== -1 : false
	}

	loadCustomizations(): Promise<void> {
		if (this.isInternalUserLoggedIn()) {
			return this.getUserController().loadCustomer().then(customer => {
				this.customizations = customer.customizations.map(f => f.feature)
			})
		} else {
			return Promise.resolve()
		}
	}

	logout(sync: boolean): Promise<void> {
		if (this._userController) {
			return this._userController.deleteSession(sync).then(() => {
				this.setUserController(null)
			})
		} else {
			console.log("No session to delete")
			return Promise.resolve()
		}
	}

}

export const logins = new LoginController()
