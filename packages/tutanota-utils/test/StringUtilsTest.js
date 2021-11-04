// @flow

import o from "ospec"
import {replaceAll} from "../lib/StringUtils"

o.spec("StringUtils", function () {

	o.spec("replaceAll", function () {
		o("no replacements", function () {
			o(replaceAll("What tied the room together, Dude?", "Jeff", "Dude")).equals("What tied the room together, Dude?")
		})

		o("one replacement", function () {
			o(replaceAll("What tied the room together, Jeff?", "Jeff", "Dude")).equals("What tied the room together, Dude?")
		})

		o("multiple different replacements", function () {
			o(replaceAll(`Let me explain something to you. Um, I am not "Mr. Lebowski". You're Mr. Lebowski. I'm the Jeff. So that's what you call me. You know, that or, uh, His Jeffness, or uh, Jeffr, or El Jeffrino if you're not into the whole brevity thing.`,
				"Jeff",
				"Dude"))
				.equals(`Let me explain something to you. Um, I am not "Mr. Lebowski". You're Mr. Lebowski. I'm the Dude. So that's what you call me. You know, that or, uh, His Dudeness, or uh, Duder, or El Duderino if you're not into the whole brevity thing.`)
		})

		o("no recursive replacements", function () {
			o(replaceAll("You got the wrong guy, I'm Dude, man",
				"Dude",
				"The Dude"))
				.equals("You got the wrong guy, I'm The Dude, man")
		})

		o("tricky input not exists", function () {
			o(replaceAll("please don't explode", "{1}", "explode")).equals("please don't explode")
		})

		o("tricky input exists", function () {
			o(replaceAll("please don't {1}", "{1}", "explode")).equals("please don't explode")
		})

		o("really just bad awful terrible input", function() {
			// not a regex, just a nightmare
			const badness = "/^[a-zA-Z][\\]+[]\\\\[.*\\.\\$\\\\oof)(()\\(\\)\\{\\}{}{-}$//gi"
			o(replaceAll(`Badness coming up: ${badness}`, badness, "... oh.. never mind")).equals("Badness coming up: ... oh.. never mind")
		})
	})
})