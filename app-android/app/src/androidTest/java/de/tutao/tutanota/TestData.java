package de.tutao.tutanota;

import org.codehaus.jackson.annotate.JsonIgnore;

import java.util.LinkedList;
import java.util.List;

public class TestData {
    List<EncryptionTestData> rsaEncryptionTests = new LinkedList<>();
    List<SignatureTestData> rsaSignatureTests = new LinkedList<>();
    List<AesTestData> aes256Tests = new LinkedList<>();
    List<AesTestData> aes128MacTests = new LinkedList<>();
    List<AesTestData> aes128Tests = new LinkedList<>();
    List<EncodingTestData> encodingTests = new LinkedList<>();
    List<BcryptTestData> bcrypt128Tests = new LinkedList<>();
    List<BcryptTestData> bcrypt256Tests = new LinkedList<>();

    public TestData addRsaEncryptionTest(EncryptionTestData test) {
        this.rsaEncryptionTests.add(test);
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

    public TestData addBcrypt128Test(BcryptTestData test) {
        this.bcrypt128Tests.add(test);
        return this;
    }

    public TestData addBcrypt256Test(BcryptTestData test) {
        this.bcrypt256Tests.add(test);
        return this;
    }

    public List<EncryptionTestData> getRsaEncryptionTests() {
        return rsaEncryptionTests;
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

    public List<BcryptTestData> getBcrypt128Tests() {
        return bcrypt128Tests;
    }

    public List<BcryptTestData> getBcrypt256Tests() {
        return bcrypt256Tests;
    }
}

class AesTestData {
    private String plainTextBase64;
    private String ivBase64;
    private String cipherTextBase64;
    private String hexKey;


    /**
     * Empty constructor needed for creating from json.
     */
    public AesTestData() {

    }

    @JsonIgnore
    public AesTestData(String plainTextBase64, String ivBase64, String cipherTextBase64, String hexKey) {
        this.plainTextBase64 = plainTextBase64;
        this.ivBase64 = ivBase64;
        this.cipherTextBase64 = cipherTextBase64;
        this.hexKey = hexKey;
    }

    public String getPlainTextBase64() {
        return plainTextBase64;
    }

    public void setPlainTextBase64(String plainTextBase64) {
        this.plainTextBase64 = plainTextBase64;
    }

    public String getIvBase64() {
        return ivBase64;
    }

    public void setIvBase64(String ivBase64) {
        this.ivBase64 = ivBase64;
    }

    public String getCipherTextBase64() {
        return cipherTextBase64;
    }

    public void setCipherTextBase64(String cipherTextBase64) {
        this.cipherTextBase64 = cipherTextBase64;
    }

    public String getHexKey() {
        return hexKey;
    }

    public void setHexKey(String hexKey) {
        this.hexKey = hexKey;
    }
}

class EncodingTestData {
    public String string;
    public String encodedString;

    /**
     * Empty constructor needed for creating from json.
     */
    public EncodingTestData() {

    }

    @JsonIgnore
    public EncodingTestData(String string, String encodedString) {
        this.string = string;
        this.encodedString = encodedString;
    }

    public String getString() {
        return string;
    }

    public void setString(String string) {
        this.string = string;
    }

    public String getEncodedString() {
        return encodedString;
    }

    public void setEncodedString(String encodedString) {
        this.encodedString = encodedString;
    }
}

class EncryptionTestData {
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

    public EncryptionTestData setPublicKey(String publicKey) {
        this.publicKey = publicKey;
        return this;
    }

    public EncryptionTestData setPrivateKey(String privateKey) {
        this.privateKey = privateKey;
        return this;
    }

    public EncryptionTestData setInput(String input) {
        this.input = input;
        return this;
    }

    public EncryptionTestData setSeed(String seed) {
        this.seed = seed;
        return this;
    }

    public EncryptionTestData setResult(String result) {
        this.result = result;
        return this;
    }

}

class SignatureTestData {
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

class BcryptTestData {
    String password;
    String keyHex;
    String saltHex;

    public BcryptTestData() {
    }

    public BcryptTestData(String password, String keyHex, String saltHex) {
        this.password = password;
        this.keyHex = keyHex;
        this.saltHex = saltHex;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getKeyHex() {
        return keyHex;
    }

    public void setKeyHex(String keyHex) {
        this.keyHex = keyHex;
    }

    public String getSaltHex() {
        return saltHex;
    }

    public void setSaltHex(String saltHex) {
        this.saltHex = saltHex;
    }
}
