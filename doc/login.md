# Login

## Second factor

### FIDO U2F

#### Registration

1. Create challenge (on the client?)
2. Invoke `register()`
3. Extract publicKey and keyHandle
4. Create `U2FRegisteredDevice` on the server:
  * keyHandle
  * appId
  * publicKey
  * compromised
  * counter

#### Authenticating

1. Pass U2fChallenge.challengeData and registeredKeys to `sign()`
2. Unwrap response
3. Create U2FResponseData
  * keyHandle
  * clientData
  * signatureData