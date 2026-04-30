import o from "@tutao/otest"
import { parsePastedInput } from "../../../../src/common/gui/MailRecipientsTextField"

o.spec("MailRecipientsTextField", () => {
	o.spec("testParsePastedInput", () => {
		o("check list of email addresses are correct (without name, comma, semicolon or  < >)", () => {
			const actual = parsePastedInput("test@tuta.com ludmila.prokofeva@tutamail.com kuki@gmail.com")
			const expected = [
				{ address: "test@tuta.com", name: null },
				{ address: "ludmila.prokofeva@tutamail.com", name: null },
				{ address: "kuki@gmail.com", name: null },
			]
			o.check(actual.newRecipients).deepEquals(expected)
			o.check(actual.errors.length).equals(0)
		})

		o("check list of email addresses are correct with name and < >(without comma, semicolon)", () => {
			const actual = parsePastedInput(`Test <test@tuta.com> Ludmila Prokofeva <ludmila.prokofeva@tutamail.com> Kuki <kuki@gmail.com>`)
			const expected = [
				{ address: "test@tuta.com", name: "Test" },
				{ address: "ludmila.prokofeva@tutamail.com", name: "Ludmila Prokofeva" },
				{ address: "kuki@gmail.com", name: "Kuki" },
			]
			o.check(actual.newRecipients).deepEquals(expected)
		})

		o("check list of email addresses are correct with comma (without name,  semicolon or  < >)", () => {
			const actual = parsePastedInput("test@tuta.com, ludmila.prokofeva@tutamail.com, kuki@gmail.com,")
			const expected = [
				{ address: "test@tuta.com", name: null },
				{ address: "ludmila.prokofeva@tutamail.com", name: null },
				{ address: "kuki@gmail.com", name: null },
			]
			o.check(actual.newRecipients).deepEquals(expected)
			o.check(actual.errors.length).equals(0)
		})

		o("check list of email addresses are correct with semicolon (without name, or  < >)", () => {
			const actual = parsePastedInput("test@tuta.com; ludmila.prokofeva@tutamail.com; kuki@gmail.com;")
			const expected = [
				{ address: "test@tuta.com", name: null },
				{ address: "ludmila.prokofeva@tutamail.com", name: null },
				{ address: "kuki@gmail.com", name: null },
			]
			o.check(actual.newRecipients).deepEquals(expected)
			o.check(actual.errors.length).equals(0)
		})

		o("check list of email addresses are correct with name and comma(without semicolon)", () => {
			const actual = parsePastedInput(`Test <test@tuta.com>, Ludmila Prokofeva <ludmila.prokofeva@tutamail.com>, Kuki <kuki@gmail.com>,`)
			const expected = [
				{ address: "test@tuta.com", name: "Test" },
				{ address: "ludmila.prokofeva@tutamail.com", name: "Ludmila Prokofeva" },
				{ address: "kuki@gmail.com", name: "Kuki" },
			]
			o.check(actual.newRecipients).deepEquals(expected)
		})

		o("check list of email addresses are correct with name and semicolon (without comma)", () => {
			const actual = parsePastedInput(`Test <test@tuta.com>; Ludmila Prokofeva <ludmila.prokofeva@tutamail.com>; Kuki <kuki@gmail.com>;`)
			const expected = [
				{ address: "test@tuta.com", name: "Test" },
				{ address: "ludmila.prokofeva@tutamail.com", name: "Ludmila Prokofeva" },
				{ address: "kuki@gmail.com", name: "Kuki" },
			]
			o.check(actual.newRecipients).deepEquals(expected)
		})

		o("check list of email addresses are incorrect with name and semicolon (without comma)", () => {
			const actual = parsePastedInput(`Test <test@tuta.com>; Ludmila Prokofeva <ludmila.prokofeva@tutamail>; Kuki <@gmail.com>;`)
			const expected = [{ address: "test@tuta.com", name: "Test" }]
			o.check(actual.newRecipients).deepEquals(expected)
			o.check(actual.errors.length).equals(2)
		})
	})
})
