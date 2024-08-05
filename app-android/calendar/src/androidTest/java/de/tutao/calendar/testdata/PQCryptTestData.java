package de.tutao.calendar.testdata;

public class PQCryptTestData {

	String privateKyberKey;
	String publicKyberKey;
	String publicX25519Key;
	String privateX25519Key;

	String epheremalPublicX25519Key;
	String epheremalPrivateX25519Key;

	String pqMessage;
	String seed;
	String bucketKey;

	public PQCryptTestData() {
	}

	public PQCryptTestData(String privateKyberKey, String publicKyberKey, String privateX25519Key, String publicX25519Key, String ephemeralPrivateX25519Key,
						   String ephemeralPublicX25519Key,
						   String pqMessage, String seed, String bucketKey) {
		this.privateKyberKey = privateKyberKey;
		this.publicKyberKey = publicKyberKey;
		this.publicX25519Key = publicX25519Key;
		this.privateX25519Key = privateX25519Key;
		this.epheremalPublicX25519Key = ephemeralPublicX25519Key;
		this.epheremalPrivateX25519Key = ephemeralPrivateX25519Key;
		this.pqMessage = pqMessage;
		this.seed = seed;
		this.bucketKey = bucketKey;
	}

	public String getPrivateKyberKey() {
		return privateKyberKey;
	}

	public void setPrivateKyberKey(String privateKyberKey) {
		this.privateKyberKey = privateKyberKey;
	}

	public String getPublicKyberKey() {
		return publicKyberKey;
	}

	public void setPublicKyberKey(String publicKyberKey) {
		this.publicKyberKey = publicKyberKey;
	}

	public String getPublicX25519Key() {
		return publicX25519Key;
	}

	public void setPublicX25519Key(String publicX25519Key) {
		this.publicX25519Key = publicX25519Key;
	}

	public String getPrivateX25519Key() {
		return privateX25519Key;
	}

	public void setPrivateX25519Key(String privateX25519Key) {
		this.privateX25519Key = privateX25519Key;
	}

	public String getEpheremalPublicX25519Key() {
		return epheremalPublicX25519Key;
	}

	public void setEpheremalPublicX25519Key(String epheremalPublicX25519Key) {
		this.epheremalPublicX25519Key = epheremalPublicX25519Key;
	}

	public String getEpheremalPrivateX25519Key() {
		return epheremalPrivateX25519Key;
	}

	public void setEpheremalPrivateX25519Key(String epheremalPrivateX25519Key) {
		this.epheremalPrivateX25519Key = epheremalPrivateX25519Key;
	}

	public String getPqMessage() {
		return pqMessage;
	}

	public void setPqMessage(String pqMessage) {
		this.pqMessage = pqMessage;
	}

	public String getSeed() {
		return seed;
	}

	public void setSeed(String seed) {
		this.seed = seed;
	}

	public String getBucketKey() {
		return bucketKey;
	}

	public void setBucketKey(String bucketKey) {
		this.bucketKey = bucketKey;
	}
}
