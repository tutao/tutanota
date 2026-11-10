import type { LoginController } from "../api/main/LoginController"
import { EnvProvider, FeatureType, Mode } from "../../../platform-kit/app-env"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector.js"

export function isDriveEnabled(loginController: LoginController): boolean {
	return (
		(EnvProvider.get().isBrowser() || EnvProvider.get().isDesktop() || ClientDetector.get().isDriveApp()) &&
		loginController.isInternalUserLoggedIn() &&
		loginController.isEnabled(FeatureType.DriveInternalBeta)
	)
}
