//@flow
import {neverNull} from "../common/utils/Utils"
import {getHttpOrigin} from "../Env"

class LoginController {
	_userController: ?IUserController; // decoupled to interface in order to reduce size of boot bundle

	isUserLoggedIn() {
		return this._userController != null
	}


	isInternalUserLoggedIn() {
		return this.isUserLoggedIn() && this.getUserController().isInternalUser()
	}

	isAdminUserLoggedIn() {
		return this.isUserLoggedIn() && this.getUserController().isAdmin()
	}


	getUserController(): IUserController {
		return neverNull(this._userController) // only to be used after login (when user is defined)
	}

	setUserController(userController: ?IUserController): void {
		this._userController = userController
	}

	isProdDisabled() {
		// we enable certain features only for certain customers in prod
		return getHttpOrigin().startsWith("https://app.tutanota") && logins._userController != null && logins._userController.user.customer != 'Kq3X5tF--7-0'
	}
}

export const logins = new LoginController()
