package de.tutao.calendar.testdata;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class SignatureTestData {
	String publicKey;
	String privateKey;
	String input;
	String seed;
	String result;

	public String getPublicKey() {
		return publicKey;
	}

	public String getPrivateKey() {
		return privateKey;
	}

	public String getInput() {
		return input;
	}

	public String getSeed() {
		return seed;
	}

	public String getResult() {
		return result;
	}

	public SignatureTestData setPublicKey(String publicKey) {
		this.publicKey = publicKey;
		return this;
	}

	public SignatureTestData setPrivateKey(String privateKey) {
		this.privateKey = privateKey;
		return this;
	}

	public SignatureTestData setInput(String input) {
		this.input = input;
		return this;
	}

	public SignatureTestData setSeed(String seed) {
		this.seed = seed;
		return this;
	}

	public SignatureTestData setResult(String result) {
		this.result = result;
		return this;
	}

}
