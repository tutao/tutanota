import type { LoginController } from "../api/main/LoginController"
import { FeatureType } from "../../../platform-kit/app-env"
import { Singletons } from "../../../platform-kit/singletons/singleton"

export function isDriveEnabled(loginController: LoginController): boolean {
	return (
		(Singletons.envProvider.isBrowser() || Singletons.envProvider.isDesktop() || Singletons.clientDetector.isDriveApp()) &&
		loginController.isInternalUserLoggedIn() &&
		loginController.isEnabled(FeatureType.DriveInternalBeta)
	)
}
