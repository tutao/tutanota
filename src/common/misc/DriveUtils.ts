import type { LoginController } from "../api/main/LoginController"
import { FeatureType, Mode } from "@tutao/app-env"
import { client } from "../../app-env/boot/ClientDetector.js"

export function isDriveEnabled(loginController: LoginController): boolean {
	return (
		(env.mode === Mode.Browser || env.mode === Mode.Desktop || client.isDriveApp()) &&
		loginController.isInternalUserLoggedIn() &&
		loginController.isEnabled(FeatureType.DriveInternalBeta)
	)
}
