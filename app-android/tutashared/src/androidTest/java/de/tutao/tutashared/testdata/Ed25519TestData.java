package de.tutao.tutashared.testdata;

public class Ed25519TestData {
	String alicePrivateKeyHex;
	String alicePublicKeyHex;
	String message;
	String signature;
	String seed;
	String privateEccKey;
	String pubEccKey;
	String privateKyberKey;
	String pubKyberKey;
	String privateRsaKey;

	String pubRsaKey;
	String keyPairVersion;

	public Ed25519TestData() {
	}

	public Ed25519TestData(String alicePrivateKeyHex, String alicePublicKeyHex, String message, String signature, String seed, String privateEccKey, String pubEccKey, String privateKyberKey, String pubKyberKey, String privateRsaKey, String pubRsaKey, String keyPairVersion) {
		this.alicePrivateKeyHex = alicePrivateKeyHex;
		this.alicePublicKeyHex = alicePublicKeyHex;
		this.message = message;
		this.signature = signature;
		this.seed = seed;
		this.privateEccKey = privateEccKey;
		this.pubEccKey = pubEccKey;
		this.privateKyberKey = privateKyberKey;
		this.pubKyberKey = pubKyberKey;
		this.privateRsaKey = privateRsaKey;
		this.pubRsaKey = pubRsaKey;
		this.keyPairVersion = keyPairVersion;
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

	public String getPrivateEccKey() {
		return privateEccKey;
	}

	public void setPrivateEccKey(String privateEccKey) {
		this.privateEccKey = privateEccKey;
	}

	public String getPubEccKey() {
		return pubEccKey;
	}

	public void setPubEccKey(String pubEccKey) {
		this.pubEccKey = pubEccKey;
	}

	public String getPrivateKyberKey() {
		return privateKyberKey;
	}

	public void setPrivateKyberKey(String privateKyberKey) {
		this.privateKyberKey = privateKyberKey;
	}

	public String getPubKyberKey() {
		return pubKyberKey;
	}

	public void setPubKyberKey(String pubKyberKey) {
		this.pubKyberKey = pubKyberKey;
	}

	public String getPrivateRsaKey() {
		return privateRsaKey;
	}

	public void setPrivateRsaKey(String privateRsaKey) {
		this.privateRsaKey = privateRsaKey;
	}

	public String getPubRsaKey() {
		return pubRsaKey;
	}

	public void setPubRsaKey(String pubRsaKey) {
		this.pubRsaKey = pubRsaKey;
	}

	public String getKeyPairVersion() {
		return keyPairVersion;
	}

	public void setKeyPairVersion(String keyPairVersion) {
		this.keyPairVersion = keyPairVersion;
	}
}
