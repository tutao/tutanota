export class ContactListEditorModel {
	name: string
	newAddresses: Array<string>
	currentAddresses: Array<string>

	constructor(addresses: Array<string>) {
		this.name = ""
		this.newAddresses = []
		this.currentAddresses = addresses
	}

	addRecipient(address: string) {
		this.newAddresses = [address, ...this.newAddresses]
	}

	removeRecipient(address: string) {
		this.newAddresses = this.newAddresses.filter((a) => address !== a)
	}
}
