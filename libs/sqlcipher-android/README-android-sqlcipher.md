# sqlcipher-android build tools

SQLCipher for Android is not "batteries included" and requires multiple other libraries to be built before
it can be built.
See [external dependency list](https://github.com/sqlcipher/sqlcipher-android/blob/ffe6c588b06ab042d60264f1f0da79a7ac56db0f/README.md#external-dependencies).

- OpenSSL or another crypto provider (we currently use OpenSSL)
- SQLCipher

Files here allow for an easy way to build your own version.

Can be run as:

```shell
mkdir build-sqlcipher
podman build -t android-sqlcipher --network=host -f android-sqlcipher.dockerfile
source android-sqlcipher-ver
podman run --rm \
  -e SQLCIPHER_VERSION=$SQLCIPHER_VERSION \
  -e SQLCIPHER_ANDROID_VERSION=$SQLCIPHER_ANDROID_VERSION \
  -v $(pwd):/workspace:ro \
  -v $(pwd)/build-sqlcipher:/build-sqlcipher \
  -it android-sqlcipher
# This will produce the artifact at build-sqlcipher/sqlcipher-android-4.7.2-release.aar
# Move it to its final destination
mv build-sqlcipher/sqlcipher-android-${SQLCIPHER_ANDROID_VERSION}-release.aar app-android/libs/sqlcipher-android.aar
```