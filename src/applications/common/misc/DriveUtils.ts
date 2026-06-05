import type { LoginController } from "../api/main/LoginController"
import { FeatureType, Mode } from "../../../platform-kit/app-env"
import { client } from "../../../ui/ClientDetector.js"

export function isDriveEnabled(loginController: LoginController): boolean {
	return (
		(env.mode === Mode.Browser || env.mode === Mode.Desktop || client.isDriveApp()) &&
		loginController.isInternalUserLoggedIn() &&
		loginController.isEnabled(FeatureType.DriveInternalBeta)
	)
}
