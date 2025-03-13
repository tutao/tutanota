package de.tutao.tutanota.testdata;

public class Ed25519TestData {
	String alicePrivateKeyHex;
	String alicePublicKeyHex;
	String message;
	String signature;
	String seed;

	public Ed25519TestData() {
	}

	public Ed25519TestData(String alicePrivateKeyHex, String alicePublicKeyHex, String message, String signature, String seed) {
		this.alicePrivateKeyHex = alicePrivateKeyHex;
		this.alicePublicKeyHex = alicePublicKeyHex;
		this.message = message;
		this.signature = signature;
		this.seed = seed;
	}

	public String getAlicePrivateKeyHex() {
		return alicePrivateKeyHex;
	}

	public void setAlicePrivateKeyHex(String alicePrivateKeyHex) {
		this.alicePrivateKeyHex = alicePrivateKeyHex;
	}

	public String getAlicePublicKeyHex() {
		return alicePublicKeyHex;
	}

	public void setAlicePublicKeyHex(String alicePublicKeyHex) {
		this.alicePublicKeyHex = alicePublicKeyHex;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public String getSignature() {
		return signature;
	}

	public void setSignature(String signature) {
		this.signature = signature;
	}

	public String getSeed() {
		return seed;
	}

	public void setSeed(String seed) {
		this.seed = seed;
	}

}
