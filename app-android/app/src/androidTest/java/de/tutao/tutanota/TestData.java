package de.tutao.tutanota;

import org.codehaus.jackson.annotate.JsonIgnore;

import java.util.LinkedList;
import java.util.List;

public class TestData {
	public List<EncryptionTestData> rsaEncryptionTests = new LinkedList<>();
	public List<SignatureTestData> rsaSignatureTests = new LinkedList<>();
	public List<AesTestData> aes256Tests = new LinkedList<>();
	public List<AesTestData> aes128MacTests = new LinkedList<>();
	public List<AesTestData> aes128Tests = new LinkedList<>();
	public List<EncodingTestData> encodingTests = new LinkedList<>();
	public List<BcryptTestData> bcrypt128Tests = new LinkedList<>();
	public List<BcryptTestData> bcrypt256Tests = new LinkedList<>();
	public List<CompressionTestData> compressionTests = new LinkedList<>();
}

class AesTestData {
	public String plainTextBase64;
	public String ivBase64;
	public String cipherTextBase64;
	public String hexKey;
	public String keyToEncrypt128;
	public String encryptedKey128;
	public String keyToEncrypt256;
	public String encryptedKey256;
}

class EncodingTestData {
	public String string;
	public String encodedString;
}

class EncryptionTestData {
	public String publicKey;
	public String privateKey;
	public String input;
	public String seed;
	public String result;
}

class SignatureTestData {
	public String publicKey;
	public String privateKey;
	public String input;
	public String seed;
	public String result;
}

class BcryptTestData {
	public String password;
	public String keyHex;
	public String saltHex;
}

class CompressionTestData {
	public String uncompressedText;
	public String compressedBase64TextJava;
	public String compressedBase64TextJavaScript;
}
