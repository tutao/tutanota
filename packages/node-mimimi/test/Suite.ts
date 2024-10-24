import { createFileImporter, TutaCredentialType } from "../dist/binding.cjs"
import { TutaCredentials } from "../index"

// we still need to figure out where we can get the encryptedPassphraseKey from
let tutaCredential: TutaCredentials = {
	apiUrl: "http://localhost:9000",
	clientVersion: "246",
	login: "map-free@tutanota.de",
	userId: "O9xate2----0",
	accessToken: "ZK9m5qGAB0ABSsmXJFz6b7m16rhSJ6y6aA",
	encryptedPassphraseKey: [],
	credentialType: TutaCredentialType.Internal,
}
let importer = await createFileImporter(tutaCredential.login, tutaCredential, "/home/sug/dev/repositories/tutanota-3/packages/node-mimimi/sample.eml", false)

let importStatus = await importer.continueImportNapi()
console.log("Import status is: ", importStatus)
