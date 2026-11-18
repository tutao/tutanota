import type { LoginController } from "../api/main/LoginController"
import { FeatureType } from "../../../platform-kit/app-env"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector.js"
import { Singletons } from "../../../platform-kit/singletons/singleton"

export function isDriveEnabled(loginController: LoginController): boolean {
	return (
		(Singletons.envProvider.isBrowser() || Singletons.envProvider.isDesktop() || ClientDetector.get().isDriveApp()) &&
		loginController.isInternalUserLoggedIn() &&
		loginController.isEnabled(FeatureType.DriveInternalBeta)
	)
}
