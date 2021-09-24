// @flow
import {CredentialEncryptionMode} from "../../misc/credentials/CredentialEncryptionMode"
import {Dialog} from "../base/Dialog"
import type {ICredentialsProvider} from "../../misc/credentials/CredentialsProvider"

export async function showCredentialsEncryptionDialog(credentialsProvider: ICredentialsProvider) {
	const choices = [
		{text: "credentialsEncryptionModeBiometrics_label", value: CredentialEncryptionMode.BIOMETRICS},
		{text: "credentialsEncryptionModeDeviceCredentials_label", value: CredentialEncryptionMode.SYSTEM_PASSWORD},
		{text: "credentialsEncryptionModeDeviceLock_label", value: CredentialEncryptionMode.DEVICE_LOCK},
	]
	const supported = await credentialsProvider.getSupportedEncryptionModes()
	const supportedChoices = choices.filter(c => supported.includes(c.value))
	const chosenEncryptionMode = await Dialog.choice("credentialsEncryptionModeDeviceCredentials_label", supportedChoices)
	await credentialsProvider.setCredentialsEncryptionMode(chosenEncryptionMode)
}

