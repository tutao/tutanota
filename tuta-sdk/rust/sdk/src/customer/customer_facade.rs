#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::generated::sys::{Customer, CustomerInfo, User};
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::ApiCallError;
use std::sync::Arc;

#[derive(uniffi::Object)]
pub struct CustomerFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	user_facade: Arc<UserFacade>,
}

#[cfg_attr(test, mockall::automock)]
impl CustomerFacade {
	pub fn new(
		crypto_entity_client: Arc<CryptoEntityClient>,
		user_facade: Arc<UserFacade>,
	) -> Self {
		CustomerFacade {
			crypto_entity_client,
			user_facade,
		}
	}

	pub async fn fetch_customer(&self) -> Result<Customer, ApiCallError> {
		let user: Arc<User> = self.user_facade.get_user();
		let Some(customer_id) = &user.customer else {
			return Err(ApiCallError::internal(format!(
				"User {} without a customer id",
				user._id.as_ref().unwrap()
			)));
		};

		let customer = self.crypto_entity_client.load(customer_id).await?;

		Ok(customer)
	}

	pub async fn fetch_customer_info(&self) -> Result<CustomerInfo, ApiCallError> {
		let customer = self.fetch_customer().await?;
		let customer_info = self
			.crypto_entity_client
			.load(&customer.customerInfo)
			.await?;

		Ok(customer_info)
	}
}

#[cfg(test)]
mod customer_facade_unit_test {
	use crate::crypto_entity_client::MockCryptoEntityClient;
	use crate::customer::customer_facade::CustomerFacade;
	use crate::entities::generated::sys::{Customer, CustomerInfo, User};
	use crate::tutanota_constants::PlanType;
	use crate::user_facade::MockUserFacade;
	use crate::util::test_utils::create_test_entity;
	use crate::{GeneratedId, IdTupleGenerated};
	use mockall::predicate;
	use std::sync::Arc;

	fn create_mock_user(customer_id: &GeneratedId) -> User {
		User {
			customer: Some(customer_id.clone()),
			..create_test_entity()
		}
	}

	fn create_mock_customer(
		customer_id: &GeneratedId,
		customer_info_id: Option<IdTupleGenerated>,
	) -> Customer {
		Customer {
			_id: Some(customer_id.clone()),
			customerInfo: customer_info_id.unwrap_or(IdTupleGenerated::new(
				GeneratedId::test_random(),
				GeneratedId::test_random(),
			)),
			..create_test_entity()
		}
	}

	fn create_mock_customer_info(
		customer_id: &GeneratedId,
		customer_info_id: IdTupleGenerated,
		plan_type: PlanType,
	) -> CustomerInfo {
		CustomerInfo {
			_id: Some(customer_info_id),
			customer: customer_id.clone(),
			plan: plan_type as i64,
			..create_test_entity()
		}
	}

	#[tokio::test]
	async fn test_fetch_customer() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade: MockUserFacade = MockUserFacade::default();

		let customer_id = GeneratedId::test_random();
		let mock_user = create_mock_user(&customer_id);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_customer = create_mock_customer(&customer_id, None);
		mock_crypto_entity_client
			.expect_load::<Customer, GeneratedId>()
			.with(predicate::eq(customer_id.clone()))
			.return_const(Ok(mock_customer.clone()));

		let customer_facade = CustomerFacade {
			crypto_entity_client: Arc::new(mock_crypto_entity_client),
			user_facade: Arc::new(mock_user_facade),
		};

		let customer = customer_facade.fetch_customer().await;
		assert!(customer.is_ok());
		assert_eq!(customer.unwrap(), mock_customer);
	}

	#[tokio::test]
	async fn test_fetch_customer_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();

		let customer_id = GeneratedId::test_random();
		let mock_user = create_mock_user(&customer_id);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let customer_info_list_id = GeneratedId::test_random();
		let customer_info_element_id = GeneratedId::test_random();
		let customer_info_id =
			IdTupleGenerated::new(customer_info_list_id, customer_info_element_id);
		let mock_customer = create_mock_customer(&customer_id, Some(customer_info_id.clone()));
		mock_crypto_entity_client
			.expect_load::<Customer, GeneratedId>()
			.with(predicate::eq(customer_id.clone()))
			.return_const(Ok(mock_customer.clone()));

		let plan_type = PlanType::Free;
		let mock_customer_info =
			create_mock_customer_info(&customer_id, customer_info_id.clone(), plan_type);
		mock_crypto_entity_client
			.expect_load::<CustomerInfo, IdTupleGenerated>()
			.with(predicate::eq(customer_info_id))
			.return_const(Ok(mock_customer_info.clone()));

		let customer_facade = CustomerFacade {
			crypto_entity_client: Arc::new(mock_crypto_entity_client),
			user_facade: Arc::new(mock_user_facade),
		};

		let customer_info = customer_facade.fetch_customer_info().await;

		assert!(customer_info.is_ok());
		assert_eq!(customer_info.unwrap(), mock_customer_info);
	}
}
