package de.tutao.calendar.testdata;

import java.util.LinkedList;
import java.util.List;

/**
 * Don't convert to records as this is copied to app-android!
 */
public class TestData {
	List<EncryptionTestData> rsaEncryptionTests = new LinkedList<>();
	List<KyberTestData> kyberEncryptionTests = new LinkedList<>();
	List<SignatureTestData> rsaSignatureTests = new LinkedList<>();
	List<AesTestData> aes256Tests = new LinkedList<>();
	List<AesTestData> aes128Tests = new LinkedList<>();
	List<AesTestData> aes128MacTests = new LinkedList<>();
	List<EncodingTestData> encodingTests = new LinkedList<>();
	List<KdfTestData> bcrypt128Tests = new LinkedList<>();
	List<KdfTestData> bcrypt256Tests = new LinkedList<>();
	List<KdfTestData> argon2idTests = new LinkedList<>();
	List<CompressionTestData> compressionTests = new LinkedList<>();
	List<X25519TestData> x25519tests = new LinkedList<>();
	List<PQCryptTestData> pqCryptEncryptionTests = new LinkedList<>();
	List<ByteArrayEncodingTestData> byteArrayEncodingTests = new LinkedList<>();
	List<HkdfTestData> hkdfTests = new LinkedList<>();

	public TestData addRsaEncryptionTest(EncryptionTestData test) {
		this.rsaEncryptionTests.add(test);
		return this;
	}

	public TestData addKyberEncryptionTest(KyberTestData test) {
		kyberEncryptionTests.add(test);
		return this;
	}

	public TestData addRsaSignatureTest(SignatureTestData test) {
		this.rsaSignatureTests.add(test);
		return this;
	}

	public TestData addAes256Test(AesTestData test) {
		this.aes256Tests.add(test);
		return this;
	}

	public TestData addAes128Test(AesTestData test) {
		this.aes128Tests.add(test);
		return this;
	}

	public TestData addAes128MacTest(AesTestData test) {
		this.aes128MacTests.add(test);
		return this;
	}


	public TestData addEncodingTest(EncodingTestData test) {
		this.encodingTests.add(test);
		return this;
	}

	public TestData addBcrypt128Test(KdfTestData test) {
		this.bcrypt128Tests.add(test);
		return this;
	}

	public TestData addBcrypt256Test(KdfTestData test) {
		this.bcrypt256Tests.add(test);
		return this;
	}

	public TestData addCompressionTest(CompressionTestData test) {
		this.compressionTests.add(test);
		return this;
	}

	public TestData addArgon2idTest(KdfTestData test) {
		this.argon2idTests.add(test);
		return this;
	}

	public TestData addX25519Test(X25519TestData test) {
		this.x25519tests.add(test);
		return this;
	}

	public TestData addPQCryptTest(PQCryptTestData test) {
		this.pqCryptEncryptionTests.add(test);
		return this;
	}

	public TestData addByteArrayEncodingTest(ByteArrayEncodingTestData test) {
		this.byteArrayEncodingTests.add(test);
		return this;
	}

	public TestData addHkdfTest(HkdfTestData test) {
		this.hkdfTests.add(test);
		return this;
	}

	public List<EncryptionTestData> getRsaEncryptionTests() {
		return rsaEncryptionTests;
	}

	public List<KyberTestData> getKyberEncryptionTests() {
		return kyberEncryptionTests;
	}

	public List<SignatureTestData> getRsaSignatureTests() {
		return rsaSignatureTests;
	}

	public List<AesTestData> getAes256Tests() {
		return aes256Tests;
	}

	public List<AesTestData> getAes128Tests() {
		return aes128Tests;
	}

	public List<AesTestData> getAes128MacTests() {
		return aes128MacTests;
	}

	public List<EncodingTestData> getEncodingTests() {
		return encodingTests;
	}

	public List<KdfTestData> getBcrypt128Tests() {
		return bcrypt128Tests;
	}

	public List<KdfTestData> getBcrypt256Tests() {
		return bcrypt256Tests;
	}

	public List<KdfTestData> getArgon2idTests() {
		return argon2idTests;
	}

	public List<CompressionTestData> getCompressionTests() {
		return compressionTests;
	}

	public List<X25519TestData> getX25519Tests() {
		return x25519tests;
	}


	public List<PQCryptTestData> getPQCryptEncryptionTests() {
		return pqCryptEncryptionTests;
	}

	public List<ByteArrayEncodingTestData> getByteArrayEncodingTests() {
		return byteArrayEncodingTests;
	}

	public List<HkdfTestData> getHkdfTests() {
		return hkdfTests;
	}
}

