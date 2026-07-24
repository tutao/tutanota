import type { LoginController } from "../api/main/LoginController"
import { FeatureType, Mode } from "../../../platform-kit/app-env"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector.js"

export function isDriveEnabled(loginController: LoginController): boolean {
	return (
		(env.mode === Mode.Browser || env.mode === Mode.Desktop || ClientDetector.get().isDriveApp()) &&
		loginController.isInternalUserLoggedIn() &&
		loginController.isEnabled(FeatureType.DriveInternalBeta)
	)
}
