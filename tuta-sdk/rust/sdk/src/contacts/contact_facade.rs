#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::generated::sys::RootInstance;
use crate::entities::generated::tutanota::ContactList;
use crate::entities::Entity;
use crate::type_model_provider::TypeModelProvider;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::{entities::generated::tutanota::Contact, GeneratedId};
use crate::{ApiCallError, Arc, IdTupleCustom, ListLoadDirection};

#[derive(uniffi::Object)]
pub struct ContactFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	type_model_provider: Arc<TypeModelProvider>,
	user_facade: Arc<UserFacade>,
}

#[cfg_attr(test, mockall::automock)]
impl ContactFacade {
	#[must_use]
	pub fn new(
		crypto_entity_client: Arc<CryptoEntityClient>,
		type_model_provider: Arc<TypeModelProvider>,
		user_facade: Arc<UserFacade>,
	) -> Self {
		ContactFacade {
			crypto_entity_client,
			type_model_provider,
			user_facade,
		}
	}

	async fn fetch_contact_lists(&self) -> Result<ContactList, ApiCallError> {
		let user_group_id = self.user_facade.get_user_group_id();
		let Some(type_root) = self
			.type_model_provider
			.resolve_client_type_ref(&ContactList::type_ref())
		else {
			return Err(ApiCallError::InternalSdkError {
				error_message: "Failed to resolve type_root for ContactList".to_string(),
			});
		};

		let root_instance_id = IdTupleCustom {
			list_id: user_group_id,
			element_id: type_root.root_id.clone(),
		};

		let root_instance = self
			.crypto_entity_client
			.load::<RootInstance, IdTupleCustom>(&root_instance_id)
			.await?;

		let contact_list = self
			.crypto_entity_client
			.load::<ContactList, GeneratedId>(&root_instance.reference)
			.await?;

		Ok(contact_list)
	}

	async fn fetch_contacts(
		&self,
		contact_list: &GeneratedId,
	) -> Result<Vec<Contact>, ApiCallError> {
		let contacts: Vec<Contact> = self
			.crypto_entity_client
			.load_all(&contact_list, ListLoadDirection::ASC)
			.await?;

		Ok(contacts)
	}

	pub async fn load_all_user_contacts(&self) -> Result<Vec<Contact>, ApiCallError> {
		let contact_list = self.fetch_contact_lists().await?;
		let contacts = self.fetch_contacts(&contact_list.contacts).await?;

		Ok(contacts)
	}
}

#[cfg(test)]
mod contact_facade_integration_tests {
	use super::ContactFacade;
	use crate::crypto_entity_client::MockCryptoEntityClient;
	use crate::entities::generated::sys::{GroupMembership, RootInstance, User};
	use crate::entities::generated::tutanota::{Contact, ContactList};
	use crate::tutanota_constants::GroupType;
	use crate::user_facade::MockUserFacade;
	use crate::util::test_utils::{
		create_mock_contact, create_test_entity, mock_type_model_provider,
	};
	use crate::{Arc, CustomId, GeneratedId, IdTupleCustom, ListLoadDirection};
	use mockall::predicate;

	fn create_mock_user(
		user_group: &GeneratedId,
		contact_list_id: &GeneratedId,
		contact_list_list_id: &GeneratedId,
	) -> User {
		User {
			memberships: vec![
				GroupMembership {
					groupType: Some(GroupType::Contact as i64),
					group: contact_list_id.to_owned(),
					..create_test_entity()
				},
				GroupMembership {
					groupType: Some(GroupType::ContactList as i64),
					group: contact_list_list_id.to_owned(),
					..create_test_entity()
				},
			],
			userGroup: GroupMembership {
				group: user_group.to_owned(),
				..create_test_entity()
			},
			..create_test_entity()
		}
	}

	#[tokio::test]
	pub async fn test_fetch_contacts_entity_list() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade: MockUserFacade = MockUserFacade::default();
		let mock_type_model_provider = mock_type_model_provider();

		let user_group = GeneratedId::test_random();
		let contact_list_id = GeneratedId::test_random();

		// Custom Id Took from type_models/tutanota.json
		let type_model_id = CustomId("CHR1dGFub3RhAACZ".to_string());
		let root_instance_id: IdTupleCustom = IdTupleCustom {
			list_id: user_group.clone(),
			element_id: type_model_id,
		};

		let root_instance = RootInstance {
			_id: Some(root_instance_id.clone()),
			_ownerGroup: Some(user_group.clone()),
			reference: contact_list_id.clone(),
			..create_test_entity()
		};

		let contact_list = ContactList {
			_id: Some(contact_list_id.clone()),
			contacts: GeneratedId::test_random(),
			..create_test_entity()
		};

		mock_crypto_entity_client
			.expect_load::<RootInstance, IdTupleCustom>()
			.with(predicate::eq(root_instance_id))
			.return_const(Ok(root_instance));

		mock_crypto_entity_client
			.expect_load::<ContactList, GeneratedId>()
			.with(predicate::eq(contact_list_id.clone()))
			.return_const(Ok(contact_list.clone()));

		let mock_user = create_mock_user(&user_group, &contact_list_id, &contact_list_id);
		mock_user_facade
			.expect_get_user_group_id()
			.return_const(mock_user.userGroup.group);

		let contact_facade = ContactFacade {
			crypto_entity_client: Arc::new(mock_crypto_entity_client),
			type_model_provider: Arc::new(mock_type_model_provider),
			user_facade: Arc::new(mock_user_facade),
		};

		let loaded_contact_list = contact_facade.fetch_contact_lists().await;

		assert_eq!(loaded_contact_list.unwrap(), contact_list);
	}

	#[tokio::test]
	pub async fn test_fetch_contacts() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mock_type_model_provider = mock_type_model_provider();

		let user_group = GeneratedId::test_random();
		let contact_list_id = GeneratedId::test_random();
		let contact_list_list_id = GeneratedId::test_random();

		let mock_user = create_mock_user(&user_group, &contact_list_id, &contact_list_list_id);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let contacts = vec![
			create_mock_contact(
				&contact_list_id,
				&GeneratedId::test_random(),
				Some("John"),
				None,
			),
			create_mock_contact(
				&contact_list_id,
				&GeneratedId::test_random(),
				Some("Jane"),
				None,
			),
			create_mock_contact(
				&contact_list_id,
				&GeneratedId::test_random(),
				Some("Isis"),
				None,
			),
		];

		mock_crypto_entity_client
			.expect_load_all::<Contact>()
			.with(
				predicate::eq(contact_list_id.clone()),
				predicate::eq(ListLoadDirection::ASC),
			)
			.return_const(Ok(contacts));

		let contact_facade = ContactFacade {
			crypto_entity_client: Arc::new(mock_crypto_entity_client),
			type_model_provider: Arc::new(mock_type_model_provider),
			user_facade: Arc::new(mock_user_facade),
		};

		let contacts = contact_facade.fetch_contacts(&contact_list_id).await;

		assert_eq!(contacts.unwrap().iter().count(), 3);
	}
}
