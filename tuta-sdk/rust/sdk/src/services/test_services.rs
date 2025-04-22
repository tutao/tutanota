use crate::service_impl;
use crate::util::test_utils::{
	HelloEncInput, HelloEncOutput, HelloEncryptedService, HelloUnEncInput, HelloUnEncOutput,
	HelloUnEncryptedService, APP_VERSION_NUMBER,
};

service_impl!(
	declare,
	HelloEncryptedService,
	"test/encrypted-hello",
	APP_VERSION_NUMBER
);
service_impl!(POST, HelloEncryptedService, HelloEncInput, HelloEncOutput);
service_impl!(PUT, HelloEncryptedService, HelloEncInput, HelloEncOutput);
service_impl!(GET, HelloEncryptedService, HelloEncInput, HelloEncOutput);
service_impl!(DELETE, HelloEncryptedService, HelloEncInput, HelloEncOutput);

service_impl!(
	declare,
	HelloUnEncryptedService,
	"test/unencrypted-hello",
	APP_VERSION_NUMBER
);
service_impl!(
	POST,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
service_impl!(
	PUT,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
service_impl!(
	GET,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
service_impl!(
	DELETE,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
