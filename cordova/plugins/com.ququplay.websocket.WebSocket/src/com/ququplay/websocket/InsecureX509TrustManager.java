package com.ququplay.websocket;

import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateExpiredException;
import java.security.cert.CertificateNotYetValidException;
import java.security.cert.X509Certificate;

import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

/**
 * "Insecure" trust manager that can optionally allow self-signed or
 * expired/not-yet-valid certificates.
 *
 */
public class InsecureX509TrustManager implements X509TrustManager
{
  private X509TrustManager standardTrustManager = null;
  private boolean allowSelfSigned = false;
  private boolean allowExpired = false;

  public InsecureX509TrustManager(KeyStore keystore, boolean allowSelfSigned, boolean allowExpired) throws NoSuchAlgorithmException, KeyStoreException {
    final TrustManagerFactory factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
    factory.init(keystore);
    
    final TrustManager[] trustmanagers = factory.getTrustManagers();
    if (trustmanagers.length == 0) {
      throw new NoSuchAlgorithmException("Could not find a trustmanager for algorithm " + TrustManagerFactory.getDefaultAlgorithm());
    }
    this.standardTrustManager = (X509TrustManager) trustmanagers[0];
    this.allowSelfSigned = allowSelfSigned;
    this.allowExpired = allowExpired;
  }

  public void checkServerTrusted(X509Certificate[] certificates, String authType) throws CertificateException {
    try {
      if (allowSelfSigned && certificates != null && certificates.length == 1) {
        certificates[0].checkValidity();
      } else {
        standardTrustManager.checkServerTrusted(certificates, authType);
      }
    } catch (CertificateExpiredException e1) {
      if (!allowExpired) {
        throw e1;
      }
    } catch (CertificateNotYetValidException e2) {
      if (!allowExpired) {
        throw e2;
      }
    }
  }

  // delegate other methods to "real" trust manager
  
  public void checkClientTrusted(X509Certificate[] certificates, String authType) throws CertificateException {
    standardTrustManager.checkClientTrusted(certificates, authType);
  }

  public X509Certificate[] getAcceptedIssuers() {
    return this.standardTrustManager.getAcceptedIssuers();
  }

}
