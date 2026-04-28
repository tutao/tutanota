import type { LoginController } from "../../main/LoginController"
import { FeatureType } from "@tutao/app-env"
import { Mode } from "@tutao/app-env"

export function isDriveEnabled(loginController: LoginController): boolean {
	return (
		(env.mode === Mode.Browser || env.mode === Mode.Desktop) &&
		loginController.isInternalUserLoggedIn() &&
		loginController.isEnabled(FeatureType.DriveInternalBeta)
	)
}
