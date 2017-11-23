// @flow
import o from "ospec/ospec.js"
import {tokenize} from "../../../../src/api/worker/search/Tokenizer"

o.spec("Tokenizer test", () => {
	o("tokenize", () => {
		o(tokenize("")).deepEquals([])
		o(tokenize(null)).deepEquals([])
		//https://www.ibm.com/developerworks/community/blogs/nlp/entry/tokenization?lang=en
		o(tokenize("\"I said, 'what're you? Crazy?'\" said Sandowsky. \"I can't afford to do that.\"")).deepEquals(["i", "said", "what're", "you", "crazy", "said", "sandowsky", "i", "can't", "afford", "to", "do", "that"])
		o(tokenize("Hello@tuTao.de")).deepEquals(["hello", "tutao", "de"])
		o(tokenize("\t\n\x0B\f\r!\"&()+,-./:;<=>?@[\\]^_`{|}~")).deepEquals([]) // whitespace characters
		o(tokenize("#$%'*")).deepEquals(["#$%'*"]) // word characters
		o(tokenize("'")).deepEquals([])
		o(tokenize("'''")).deepEquals([])
		o(tokenize("''a''")).deepEquals(["a"])
		o(tokenize("'a'a'")).deepEquals(["a'a"])
		o(tokenize("this string has  html  code i want to  remove  Link Number 1 -> BBC")).deepEquals(["this", "string", "has", "html", "code", "i", "want", "to", "remove", "link", "number", "1", "bbc"])
	})

})