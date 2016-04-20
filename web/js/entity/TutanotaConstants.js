"use strict";

tutao.provide('tutao.entity.tutanota.TutanotaConstants');

tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT = "0";
tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_256_BIT = "1";

tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_INVOICE = "0";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD = "1";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_SEPA = "2";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL = "3";

tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS = "0";
tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE = "1";

tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_PRICE_TYPE_SINGLE = "0";
tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_PRICE_TYPE_PACKAGE = "1";
tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_PRICE_TYPE_TOTAL = "2";

tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_NONE = "0";
tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_REPLY = "1";
tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_FORWARD = "2";
tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_REPLY_FORWARD = "3";

tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM = "0";
tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX = "1";
tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SENT = "2";
tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH = "3";
tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE = "4";
tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SPAM = "5";
tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_DRAFT = "6";


tutao.entity.tutanota.TutanotaConstants.OPERATION_TYPE_CREATE = "0";
tutao.entity.tutanota.TutanotaConstants.OPERATION_TYPE_UPDATE = "1";
tutao.entity.tutanota.TutanotaConstants.OPERATION_TYPE_DELETE = "2";

tutao.entity.tutanota.TutanotaConstants.PHONE_NUMBER_TYPE_INVALID = "0";
tutao.entity.tutanota.TutanotaConstants.PHONE_NUMBER_TYPE_MOBILE = "1";
tutao.entity.tutanota.TutanotaConstants.PHONE_NUMBER_TYPE_FIXED_LINE = "2";
tutao.entity.tutanota.TutanotaConstants.PHONE_NUMBER_TYPE_OTHER = "3";
tutao.entity.tutanota.TutanotaConstants.PHONE_NUMBER_TYPE_UNKNOWN = "4";

tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_USER = "0";

tutao.entity.tutanota.TutanotaConstants.AREA_CONTACTS = "1";
tutao.entity.tutanota.TutanotaConstants.AREA_SYSTEM = "3";

tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_SYSTEM = "0";
tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE = "1";
tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER = "2";
tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM = "3";
tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STREAM = "4";
tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_EXTERNAL = "5";

tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_NAMES = ["System", "Free", "Outlook", "Premium", "Stream", "External"];

tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_REGISTRATION_ALLOWED = "0";
tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_CODE_CHALLENGED = "1";

tutao.entity.tutanota.TutanotaConstants.APPROVAL_STATUS_REGISTRATION_APPROVED = "0";
tutao.entity.tutanota.TutanotaConstants.APPROVAL_STATUS_REGISTRATION_APPROVAL_NEEDED = "1";
tutao.entity.tutanota.TutanotaConstants.APPROVAL_STATUS_SEND_MAILS_APPROVED = "2";

tutao.entity.tutanota.TutanotaConstants.APPROVAL_REQUEST_REGISTRATION = "0";
tutao.entity.tutanota.TutanotaConstants.APPROVAL_REQUEST_SENT_MAILS = "1";

/**
 * Id for the internal recipient type.
 */
tutao.entity.tutanota.TutanotaConstants.RECIPIENT_TYPE_INTERNAL = "0";

/**
 * Id for the external recipient type.
 */
tutao.entity.tutanota.TutanotaConstants.RECIPIENT_TYPE_EXTERNAL = "1";

/**
 * Id for the new type.
 */
tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_NEW = "0";

/**
 * Id for the reply type.
 */
tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_REPLY = "1";

/**
 * Id for the forward type.
 */
tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_FORWARD = "2";

/**
 * The String to append to the beginning of a subject when replying on a mail.
 */
tutao.entity.tutanota.TutanotaConstants.CONVERSATION_REPLY_SUBJECT_PREFIX = "Re: ";

/**
 * The String to append to the beginning of a subject when forwarding a mail.
 */
tutao.entity.tutanota.TutanotaConstants.CONVERSATION_FORWARD_SUBJECT_PREFIX = "Fwd: ";

// mail states
/**
 * Id for the state draft.
 */
tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_DRAFT = 0;

/**
 * Id for the state sent.
 */
tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_SENT = 1;

/**
 * Id for the state received.
 */
tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED = 2;

// mail addresses
/**
 * Id for a private email address in tutao.entity.tutanota.ContactMailAddress.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_PRIVATE = "0";

/**
 * Id for a business email address in tutao.entity.tutanota.ContactMailAddress.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_WORK = "1";

/**
 * Id for an other email address in tutao.entity.tutanota.ContactMailAddress.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER = "2";

/**
 * Id for a custom email address in tutao.entity.tutanota.ContactMailAddress. The custom name can be specified by the user.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_CUSTOM = "3";

/**
 * The names for the mail address types.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_NAMES = function() {
	return [{ id: tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_PRIVATE, name: tutao.locator.languageViewModel.get("private_label") },
     { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_WORK, name: tutao.locator.languageViewModel.get("work_label") },
     { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER, name: tutao.locator.languageViewModel.get("other_label") },
     { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_CUSTOM, name: tutao.locator.languageViewModel.get("custom_label") }];
};

// phone numbers
/**
 * Id for a private phone number in tutao.entity.tutanota.PhoneNumber.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE = "0";

/**
 * Id for a business phone number in tutao.entity.tutanota.PhoneNumber.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_WORK = "1";

/**
 * Id for a mobile phone number in tutao.entity.tutanota.PhoneNumber.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_MOBILE = "2";

/**
 * Id for a fax number in tutao.entity.tutanota.PhoneNumber.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_FAX = "3";

/**
 * Id for an other phone number in tutao.entity.tutanota.PhoneNumber.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_OTHER = "4";

/**
 * Id for a custom phone number in tutao.entity.tutanota.PhoneNumber. The custom name can be specified by the user.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_CUSTOM = "5";

/**
 * The names for the phone number types.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_NAMES = function() {
	return [{ id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE, name: tutao.locator.languageViewModel.get("private_label") },
     { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_WORK, name: tutao.locator.languageViewModel.get("work_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_MOBILE, name: tutao.locator.languageViewModel.get("mobile_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_FAX, name: tutao.locator.languageViewModel.get("fax_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_OTHER, name: tutao.locator.languageViewModel.get("other_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_CUSTOM, name: tutao.locator.languageViewModel.get("custom_label") }];

};


// addresses
/**
 * Id for a private address in tutao.entity.tutanota.ContactAddress.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_PRIVATE = "0";

/**
 * Id for a business address in tutao.entity.tutanota.ContactAddress.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_WORK = "1";

/**
 * Id for an other address in tutao.entity.tutanota.ContactAddress.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_OTHER = "2";

/**
 * Id for a custom address in tutao.entity.tutanota.ContactAddress. The custom name can be specified by the user.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_CUSTOM = "3";

/**
 * The names for the address types.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_NAMES = function() {
	return [{ id: tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_PRIVATE, name: tutao.locator.languageViewModel.get("private_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_WORK, name: tutao.locator.languageViewModel.get("work_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_OTHER, name: tutao.locator.languageViewModel.get("other_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_CUSTOM, name: tutao.locator.languageViewModel.get("custom_label") }];
};


// social ids
/**
 * Id for a twitter id in tutao.entity.tutanota.SocialId.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_TWITTER = "0";

/**
 * Id for a faceboot id in tutao.entity.tutanota.SocialId.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_FACEBOOK = "1";

/**
 * Id for a xing id in tutao.entity.tutanota.SocialId.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_XING = "2";

/**
 * Id for a linked in id in tutao.entity.tutanota.SocialId.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_LINKED_IN = "3";

/**
 * Id for an other social id in tutao.entity.tutanota.SocialId.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_OTHER = "4";

/**
 * Id for a custom social id in tutao.entity.tutanota.SocialId. The custom name can be specified by the user.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_CUSTOM = "5";

/**
 * The names for the social id types.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_NAMES = function() {
	return [{ id: tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_TWITTER, name: tutao.locator.languageViewModel.get("twitter_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_FACEBOOK, name: tutao.locator.languageViewModel.get("facebook_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_XING, name: tutao.locator.languageViewModel.get("xing_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_LINKED_IN, name: tutao.locator.languageViewModel.get("linkedin_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_OTHER, name: tutao.locator.languageViewModel.get("other_label") },
	 { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_CUSTOM, name: tutao.locator.languageViewModel.get("custom_label") }];
};


/**
 * The URLs that are prefixed to the social id to create the link.
 */
tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_LINKS = ["https://twitter.com/", "https://www.facebook.com/", "https://www.xing.com/profile/", "https://www.linkedin.com/in/", null, null];

/**
 * The maximum size of a single attachment in bytes.
 */
tutao.entity.tutanota.TutanotaConstants.MAX_ATTACHMENT_SIZE = 1024 * 1024 * 25;

tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_MAIL_BOX = "0";
tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_CONTACT_LIST = "1";
tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_FILE_SYSTEM = "2";
tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_FILE = "3";


tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_ANDROID = "0";
tutao.entity.tutanota.TutanotaConstants.PUSH_SERVICE_TYPE_IOS = "1";


tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS = ["tutanota.com", "tutanota.de", "tutamail.com", "tuta.io", "keemail.me"];

tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON = "graphics/ion-alert-circled.svg";


tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_OK = 0;
tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_DNS_LOOKUP_FAILED = 1;
tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_MISSING_MX_RECORD = 2;
tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_MISSING_SPF_RECORD = 3;
tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_INVALID_DNS_RECORD = 4;
tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_DOMAIN_NOT_AVAILABLE = 5;


tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_FORM_READY = "tutao.tutanota.pay.formready"; // contains no value
tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_CLIENT_TOKEN = "tutao.tutanota.pay.clienttoken"; // contains one value <clientToken>
tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN = "tutao.tutanota.pay.paymenttoken"; //contains three values <token>:<method>:<methodInfo>
tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_WINDOW_NAME = "tutao.tutanota.pay.windowname"; // contains one value <windowName>
tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_METHOD = "tutao.tutanota.pay.paymentmethod"; // contains one value <paymentMethod> from tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_XXX


tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_OK = "0";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_COUNTRY_MISMATCH = "1";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_INVALID_VATID_NUMBER = "2";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_CREDIT_CARD_DECLINED = "3";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_CREDIT_CARD_CVV_INVALID = "4";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_PAYMENT_PROVIDER_NOT_AVAILABLE = "5";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_OTHER_PAYMENT_PROVIDER_ERROR = "6";


tutao.entity.tutanota.TutanotaConstants.PAYMENT_SITE_LOADING_STATUS_LOADING = "0";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_SITE_LOADING_STATUS_OK = "1";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_SITE_LOADING_STATUS_INVALID_PAGE_LOAD = "2";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_SITE_LOADING_STATUS_NOT_SUPPORTED = "3";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_SITE_LOADING_STATUS_NOT_SUPPORTED_PAYMENTMETHOD = "4";
tutao.entity.tutanota.TutanotaConstants.PAYMENT_SITE_LOADING_STATUS_ERROR = "5";

/* Sets the current date for testing date dependent services. Only available in test environments.*/
tutao.entity.tutanota.TutanotaConstants.CURRENT_DATE = null;

tutao.entity.tutanota.TutanotaConstants.DEFAULT_EMAIL_SIGNATURE = "defaultEmailSignature_msg";
tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT = "0";
tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM = "1";
tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_NONE = "2";

tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_NONE = "0";
tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_WHITELIST = "1";
tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_BLACKLIST = "2";
tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_DISCARD = "3";

tutao.entity.tutanota.TutanotaConstants.UPGRADE_REMINDER_INTERVAL = 14 * 24 * 60 * 60 * 1000;

tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SENDER_EQUALS = "0";
tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_TO_EQUALS = "1";
tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_CC_EQUALS = "2";
tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_BCC_EQUALS = "3";
tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS = "4";
