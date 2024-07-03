import o from "@tutao/otest"
import { object } from "testdouble"
import {
	CardType,
	getCardTypeRange,
	inferExpirationDate,
	SimplifiedCreditCardViewModel,
} from "../../../src/common/subscription/SimplifiedCreditCardInputModel.js"

o.spec("inferExpirationDate month", function () {
	o("starting with invalid character returns empty string", function () {
		o(inferExpirationDate("a")).equals("")
		o(inferExpirationDate("a12")).equals("")
		o(inferExpirationDate("/")).equals("")
		o(inferExpirationDate("/23")).equals("")
		o(inferExpirationDate("?")).equals("")
		o(inferExpirationDate("?01/24")).equals("")
		o(inferExpirationDate("")).equals("")
	})

	o("starting with definite month returns expanded month", function () {
		o(inferExpirationDate("2")).equals("02 / ")
		o(inferExpirationDate("3")).equals("03 / ")
		o(inferExpirationDate("4")).equals("04 / ")
		o(inferExpirationDate("5")).equals("05 / ")
		o(inferExpirationDate("6")).equals("06 / ")
		o(inferExpirationDate("7")).equals("07 / ")
		o(inferExpirationDate("8")).equals("08 / ")
		o(inferExpirationDate("9")).equals("09 / ")
		o(inferExpirationDate("2/")).equals("02 / ")
		o(inferExpirationDate("3/")).equals("03 / ")
		o(inferExpirationDate("4/")).equals("04 / ")
		o(inferExpirationDate("5/")).equals("05 / ")
		o(inferExpirationDate("6/")).equals("06 / ")
		o(inferExpirationDate("7/")).equals("07 / ")
		o(inferExpirationDate("8/")).equals("08 / ")
		o(inferExpirationDate("9/")).equals("09 / ")
	})

	o.spec("starting with indefinite month", function () {
		o("starting with 1 returns 1", function () {
			o(inferExpirationDate("1")).equals("1")
		})

		o("starting with 0 returns 0", function () {
			o(inferExpirationDate("0")).equals("0")
		})

		o("starting with 1/ returns 01/", function () {
			o(inferExpirationDate("1/")).equals("01 / ")
		})

		o("starting with 10, 11, 12 gives input plus slash, strips invalid suffix", function () {
			o(inferExpirationDate("10")).equals("10 / ")
			o(inferExpirationDate("11")).equals("11 / ")
			o(inferExpirationDate("12")).equals("12 / ")
			o(inferExpirationDate("10 /")).equals("10 / ")
			o(inferExpirationDate("11 /")).equals("11 / ")
			o(inferExpirationDate("12 /")).equals("12 / ")
			o(inferExpirationDate("10 / a")).equals("10 / ")
			o(inferExpirationDate("11/ ?")).equals("11 / ")
			o(inferExpirationDate("11//")).equals("11 / ")
			o(inferExpirationDate("12 / 3")).equals("12 / 3")
		})

		o("starting with 13-19 infers january and uses rest of input", function () {
			o(inferExpirationDate("13")).equals("01 / 3")
			o(inferExpirationDate("14")).equals("01 / 4")
			o(inferExpirationDate("15")).equals("01 / 5")
			o(inferExpirationDate("16")).equals("01 / 6")
			o(inferExpirationDate("17")).equals("01 / 7")
			o(inferExpirationDate("18")).equals("01 / 8")
			o(inferExpirationDate("19")).equals("01 / 9")
		})

		o("starting with 0x x={0 or non digit} returns 0", function () {
			o(inferExpirationDate("0/")).equals("0")
			o(inferExpirationDate("00")).equals("0")
			o(inferExpirationDate("0W")).equals("0")
			o(inferExpirationDate("0//")).equals("0")
			o(inferExpirationDate("0 ")).equals("0")
			o(inferExpirationDate("0 ?")).equals("0")
		})

		o("starting with 01 - 09 returns input, potentially with slash", function () {
			o(inferExpirationDate("01")).equals("01 / ")
			o(inferExpirationDate("02")).equals("02 / ")
			o(inferExpirationDate("03")).equals("03 / ")
			o(inferExpirationDate("04")).equals("04 / ")
			o(inferExpirationDate("05")).equals("05 / ")
			o(inferExpirationDate("06")).equals("06 / ")
			o(inferExpirationDate("07")).equals("07 / ")
			o(inferExpirationDate("08")).equals("08 / ")
			o(inferExpirationDate("09")).equals("09 / ")
			o(inferExpirationDate("012")).equals("01 / 2")
			o(inferExpirationDate("022")).equals("02 / 2")
			o(inferExpirationDate("032")).equals("03 / 2")
			o(inferExpirationDate("042")).equals("04 / 2")
			o(inferExpirationDate("052")).equals("05 / 2")
			o(inferExpirationDate("062")).equals("06 / 2")
			o(inferExpirationDate("072")).equals("07 / 2")
			o(inferExpirationDate("082")).equals("08 / 2")
			o(inferExpirationDate("092")).equals("09 / 2")
		})

		o("adding a slash to a complete month adds that slash with whitespace", function () {
			o(inferExpirationDate("01/")).equals("01 / ")
			o(inferExpirationDate("02/")).equals("02 / ")
			o(inferExpirationDate("03/")).equals("03 / ")
			o(inferExpirationDate("04/")).equals("04 / ")
			o(inferExpirationDate("05/")).equals("05 / ")
			o(inferExpirationDate("06/")).equals("06 / ")
			o(inferExpirationDate("07/")).equals("07 / ")
			o(inferExpirationDate("08/")).equals("08 / ")
			o(inferExpirationDate("09/")).equals("09 / ")
		})

		o("four digit input with valid month gets slash", function () {
			o(inferExpirationDate("0123")).equals("01 / 23")
			o(inferExpirationDate("0224")).equals("02 / 24")
			o(inferExpirationDate("0325")).equals("03 / 25")
			o(inferExpirationDate("4205")).equals("04 / 205")
		})

		o("four digit input and slash with valid month returns same", function () {
			o(inferExpirationDate("01/23")).equals("01 / 23")
			o(inferExpirationDate("02/24")).equals("02 / 24")
			o(inferExpirationDate("03/25")).equals("03 / 25")
		})

		o("six digit input with valid month gets slash", function () {
			o(inferExpirationDate("012030")).equals("01 / 2030")
			o(inferExpirationDate("022045")).equals("02 / 2045")
			o(inferExpirationDate("032023")).equals("03 / 2023")
			o(inferExpirationDate("122020")).equals("12 / 2020")
		})

		o("six digit input and slash with valid month return same", function () {
			o(inferExpirationDate("01/2030")).equals("01 / 2030")
			o(inferExpirationDate("02/2045")).equals("02 / 2045")
			o(inferExpirationDate("03/2023")).equals("03 / 2023")
			o(inferExpirationDate("12/2020")).equals("12 / 2020")
			o(inferExpirationDate("12//2020")).equals("12 / 2020")
		})

		o("year contains non digit chars that stops the rest from getting parsed", function () {
			o(inferExpirationDate("01/21%30")).equals("01 / 21")
			o(inferExpirationDate("02/2!445")).equals("02 / 2")
			o(inferExpirationDate("03/202_ 3")).equals("03 / 202")
		})

		o("does not parse the rest if the year has already 4 digits", function () {
			o(inferExpirationDate("01 / 2030sd")).equals("01 / 2030")
			o(inferExpirationDate("02/20452")).equals("02 / 2045")
			o(inferExpirationDate("03/2023__ ")).equals("03 / 2023")
		})

		o("pasting valid format ignores any whitespace", function () {
			o(inferExpirationDate(" \n\t1\t\n  2 /2\n02 4\t\n\n")).equals("12 / 2024")
			o(inferExpirationDate(" \n\t0\t\n  6 /       2 6\t\n\n")).equals("06 / 26")
		})

		o("using backspace removes first year digit and trailing separator", function () {
			o(inferExpirationDate("01 / ", "01 / 5")).equals("01")
			o(inferExpirationDate("1", "11")).equals("1")
			o(inferExpirationDate("01 / 2", "01 / 24")).equals("01 / 2")
		})

		o("typing / backspacing across the slash works as intended", function () {
			o(inferExpirationDate("01 / ", "01 / 2")).equals("01")
			o(inferExpirationDate("01", "0")).equals("01 / ")
			o(inferExpirationDate("01 /", "01 / 2")).equals("01")
			o(inferExpirationDate("01 ", "01 / 2")).equals("01")
			o(inferExpirationDate("01", "0")).equals("01 / ")
			o(inferExpirationDate("03 / ", "03 / 2")).equals("03")
		})
	})
})

o.spec("inferExpirationDate integration", function () {
	o("all dates we may care about at the moment can be typed in four-digit-year format, with leading zero on month", function () {
		const currentYear = new Date().getFullYear()
		let currentMonth = new Date().getMonth() + 1

		for (let y = currentYear; y < currentYear + 15; y = y + 1) {
			for (currentMonth; currentMonth < 13; currentMonth = currentMonth + 1) {
				const correctDateAsTyped = `${currentMonth.toString().padStart(2, "0")}/${currentYear}`
				const correctDateAsShown = correctDateAsTyped.replace("/", " / ")
				let lastVal = ""
				for (const c of correctDateAsTyped) {
					lastVal = inferExpirationDate(lastVal + c, lastVal)
				}
				o(lastVal).equals(correctDateAsShown)
			}
			currentMonth = 1
		}
	})

	o("all dates we may care about at the moment can be typed in two-digit-year format, without leading zero on month", function () {
		const currentYear = new Date().getFullYear()
		let currentMonth = new Date().getMonth() + 1

		for (let y = currentYear; y < currentYear + 15; y = y + 1) {
			for (currentMonth; currentMonth < 13; currentMonth = currentMonth + 1) {
				const correctDateAsTyped = `${currentMonth}/${currentYear.toString().slice(2)}`
				// 9/2022 -> 09 / 2022
				const correctDateAsShown = correctDateAsTyped.padStart(5, "0").replace("/", " / ")
				let lastVal = ""
				for (const c of correctDateAsTyped) {
					lastVal = inferExpirationDate(lastVal + c, lastVal)
				}
				o(lastVal).equals(correctDateAsShown)
			}
			currentMonth = 1
		}
	})
})

o.spec("detectCreditCardIssuer", function () {
	o("amex", function () {
		o(getCardTypeRange("34")).equals(CardType.Amex)
		o(getCardTypeRange("37")).equals(CardType.Amex)
		o(getCardTypeRange("340")).equals(CardType.Amex)
		o(getCardTypeRange("371")).equals(CardType.Amex)
		o(getCardTypeRange("35")).notEquals(CardType.Amex)
		o(getCardTypeRange("374283089890073")).equals(CardType.Amex)
		o(getCardTypeRange("347562087582806")).equals(CardType.Amex)
		o(getCardTypeRange("377118013765255")).equals(CardType.Amex)
		o(getCardTypeRange("377188176009494")).equals(CardType.Amex)
	})
	o("visa", function () {
		o(getCardTypeRange("4")).equals(CardType.Visa)
		o(getCardTypeRange("40")).equals(CardType.Visa)
		o(getCardTypeRange("48")).equals(CardType.Visa)
		o(getCardTypeRange("04")).notEquals(CardType.Visa)
		o(getCardTypeRange("4219430910018892")).equals(CardType.Visa)
		o(getCardTypeRange("4020964956067842")).equals(CardType.Visa)
		o(getCardTypeRange("4522131094541")).equals(CardType.Visa)
		o(getCardTypeRange("4398342951138")).equals(CardType.Visa)
		o(getCardTypeRange("4111621867312903")).equals(CardType.Visa)
	})
	o("mastercard", function () {
		o(getCardTypeRange("51")).equals(CardType.Mastercard)
		o(getCardTypeRange("55")).equals(CardType.Mastercard)
		o(getCardTypeRange("52")).equals(CardType.Mastercard)
		o(getCardTypeRange("50")).notEquals(CardType.Mastercard)
		o(getCardTypeRange("2221")).equals(CardType.Mastercard)
		o(getCardTypeRange("2720")).equals(CardType.Mastercard)
		o(getCardTypeRange("2504")).equals(CardType.Mastercard)
		o(getCardTypeRange("23")).equals(CardType.Mastercard)
		o(getCardTypeRange("2220")).notEquals(CardType.Mastercard)
		o(getCardTypeRange("5392341340810814")).equals(CardType.Mastercard)
		o(getCardTypeRange("5571772194621274")).equals(CardType.Mastercard)
		o(getCardTypeRange("5155544629392217")).equals(CardType.Mastercard)
		o(getCardTypeRange("5464942746631846")).equals(CardType.Mastercard)
		o(getCardTypeRange("5183606138506219")).equals(CardType.Mastercard)
	})
	o("maestro", function () {
		o(getCardTypeRange("6759")).equals(CardType.Maestro)
		o(getCardTypeRange("676770")).equals(CardType.Maestro)
		o(getCardTypeRange("67677")).notEquals(CardType.Maestro)
		o(getCardTypeRange("5")).notEquals(CardType.Maestro)
		o(getCardTypeRange("5018")).equals(CardType.Maestro)
		o(getCardTypeRange("6762")).equals(CardType.Maestro)
		o(getCardTypeRange("67631")).equals(CardType.Maestro)
		o(getCardTypeRange("67630")).equals(CardType.Maestro)
		o(getCardTypeRange("67644")).notEquals(CardType.Maestro)
		o(getCardTypeRange("676")).notEquals(CardType.Maestro)
		o(getCardTypeRange("503896955559")).equals(CardType.Maestro)
		o(getCardTypeRange("6763964146952")).equals(CardType.Maestro)
		o(getCardTypeRange("63049263291396")).equals(CardType.Maestro)
		o(getCardTypeRange("675990328450529")).equals(CardType.Maestro)
		o(getCardTypeRange("6761384679616833")).equals(CardType.Maestro)
		o(getCardTypeRange("50185787002582074")).equals(CardType.Maestro)
		o(getCardTypeRange("630468508293435054")).equals(CardType.Maestro)
		o(getCardTypeRange("6759033525570348799")).equals(CardType.Maestro)
	})
	o("discover", function () {
		o(getCardTypeRange("6011")).equals(CardType.Discover)
		o(getCardTypeRange("645")).equals(CardType.Discover)
		o(getCardTypeRange("66")).notEquals(CardType.Discover)
		o(getCardTypeRange("64")).notEquals(CardType.Discover)
		o(getCardTypeRange("65")).equals(CardType.Discover)
		o(getCardTypeRange("622126")).equals(CardType.Discover)
		o(getCardTypeRange("6228")).equals(CardType.Discover)
		o(getCardTypeRange("6221299974430470")).equals(CardType.Discover)
		o(getCardTypeRange("6497238438147624")).equals(CardType.Discover)
		o(getCardTypeRange("6457995163050848")).equals(CardType.Discover)
		o(getCardTypeRange("6225765854038001")).equals(CardType.Discover)
	})
	o("other", function () {
		o(getCardTypeRange("")).equals(CardType.Other)
		o(getCardTypeRange(" ")).equals(CardType.Other)
		o(getCardTypeRange("0")).equals(CardType.Other)
		o(getCardTypeRange("00")).equals(CardType.Other)
		o(getCardTypeRange("02")).equals(CardType.Other)
	})
})

o.spec("inferCreditCardNumber", function () {
	o("non-digits are stripped and the remaining input is reduced to at most 20 digits", function () {
		const model = new SimplifiedCreditCardViewModel(object())
		model.creditCardNumber = "aath5ö5\nü5s🤣 "
		o(model.creditCardNumber).equals("555")
		model.creditCardNumber = ""
		model.creditCardNumber = "555"
		o(model.creditCardNumber).equals("555")
		model.creditCardNumber = ""
		model.creditCardNumber = "111122223333444412346666"
		o(model.creditCardNumber).equals("1111 2222 3333 4444 1234")
		model.creditCardNumber = ""
		model.creditCardNumber = "341111111111111"
		o(model.creditCardNumber).equals("3411 111111 11111") // Amex
		model.creditCardNumber = "1234-2222-3333-4444-5555"
		o(model.creditCardNumber).equals("1234 2222 3333 4444 5555")
		model.creditCardNumber = ""
		model.creditCardNumber = "1234/5678/3333/44"
		o(model.creditCardNumber).equals("1234 5678 3333 44")
		model.creditCardNumber = ""
		model.creditCardNumber = "\t1111 22223333aoeu[{---+/+++ tsnh 4444555566667777"
		o(model.creditCardNumber).equals("1111 2222 3333 4444 5555")
	})

	o("non-digits are ignored", function () {
		const model = new SimplifiedCreditCardViewModel(object())
		model.creditCardNumber = "1234-"
		o(model.creditCardNumber).equals("1234")
		model.creditCardNumber = ""
		model.creditCardNumber = "12345 "
		o(model.creditCardNumber).equals("1234 5")
	})

	o("backspace is handled correctly", function () {
		const model = new SimplifiedCreditCardViewModel(object())
		model.creditCardNumber = "1234 5"
		model.creditCardNumber = "1234 "
		o(model.creditCardNumber).equals("1234")
		model.creditCardNumber = ""
		model.creditCardNumber = "1234 5678"
		model.creditCardNumber = "1234 567"
		o(model.creditCardNumber).equals("1234 567")
	})
})

o.spec("inferCreditCardNumber integration", function () {
	o("it's possible to type a credit card number", function () {
		const model = new SimplifiedCreditCardViewModel(object())
		const numberAsTyped = "1234567890123456"
		const numberAsShown = "1234 5678 9012 3456"
		model.creditCardNumber = ""
		for (const c of numberAsTyped) {
			model.creditCardNumber = model.creditCardNumber + c
		}
		o(model.creditCardNumber).equals(numberAsShown)
	})

	o("it's possible to type an amex credit card number", function () {
		const model = new SimplifiedCreditCardViewModel(object())
		const numberAsTyped = "345678901234567"
		const numberAsShown = "3456 789012 34567"
		model.creditCardNumber = ""
		for (const c of numberAsTyped) {
			model.creditCardNumber = model.creditCardNumber + c
		}
		o(model.creditCardNumber).equals(numberAsShown)
	})

	o("it's possible to type an overlong credit card number", function () {
		const model = new SimplifiedCreditCardViewModel(object())
		const numberAsTyped = "345678901234567890890"
		const numberAsShown = "3456 789012 34567 89089"
		model.creditCardNumber = ""
		for (const c of numberAsTyped) {
			model.creditCardNumber = model.creditCardNumber + c
		}
		o(model.creditCardNumber).equals(numberAsShown)
	})
})
