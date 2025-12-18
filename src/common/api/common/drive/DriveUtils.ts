import type { LoginController } from "../../main/LoginController"
import { isWebClient } from "../Env"
import { FeatureType } from "../TutanotaConstants"

export function isDriveEnabled(loginController: LoginController): boolean {
	return isWebClient() && loginController.isInternalUserLoggedIn() && loginController.isEnabled(FeatureType.DriveInternalBeta)
}
