import type { LoginController } from "../../main/LoginController"
import { FeatureType } from "@tutao/appEnv"
import { Mode } from "@tutao/appEnv"

export function isDriveEnabled(loginController: LoginController): boolean {
	return env.mode === Mode.Browser && loginController.isInternalUserLoggedIn() && loginController.isEnabled(FeatureType.DriveInternalBeta)
}
