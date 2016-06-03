"use strict";

tutao.provide("tutao.rest.ResourceConstants");

/**
 * @const
 */
tutao.rest.ResourceConstants.META_SERVICE_BASE_URI = "meta";
/**
 * @const
 */
tutao.rest.ResourceConstants.DB_REST_BASE_URI = "rest";

/**
 * @const
 */
tutao.rest.ResourceConstants.SW_VERSION_PARAMETER = "v";

// any requests
/**
 * @const
 */
tutao.rest.ResourceConstants.USER_ID_PARAMETER_NAME = "userId";

/**
 * @const
 */
tutao.rest.ResourceConstants.AUTH_ID_PARAMETER_NAME = "authId";

/**
 * @const
 */
tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME = "authToken";

/**
 * @const
 */
tutao.rest.ResourceConstants.AUTH_VERIFIER_PARAMETER_NAME = "authVerifier";

/**
 * @const
 */
tutao.rest.ResourceConstants.DEVICE_TOKEN_PARAMETER_NAME = "device";

// get requests
/**
 * get requests are not allowed to send a body. Therefore, we convert our body to a paramater
 * @const
 */
tutao.rest.ResourceConstants.GET_BODY_PARAM = "_body";
/**
 * @const
 */
tutao.rest.ResourceConstants.IDS_PARAMETER_NAME = "ids";
/**
 * @const
 */
tutao.rest.ResourceConstants.PARAMETER_LIST_SEPARATOR = ",";
/**
 * @const
 */
tutao.rest.ResourceConstants.START_ID_PARAMETER = "start";
/**
 * @const
 */
tutao.rest.ResourceConstants.ELEMENT_COUNT_PARAMETER = "count";
/**
 * @const
 */
tutao.rest.ResourceConstants.REVERSE_PARAMETER = "reverse";

/**
 * @const
 */
tutao.rest.ResourceConstants.PERMISSION_PARAMETER = "permission";

// post requests
/**
 * @const
 */
tutao.rest.ResourceConstants.GROUP_ID = "group";
/**
 * @const
 */
tutao.rest.ResourceConstants.SYM_ENC_SESSION_KEY = "symEncSessionKey";
/**
 * @const
 */
tutao.rest.ResourceConstants.SYM_ENC_LIST_KEY = "symEncListKey";
/**
 * @const
 */
tutao.rest.ResourceConstants.BUCKET_ENC_LIST_KEY = "bucketEncListKey";
/**
 * @const
 */
tutao.rest.ResourceConstants.BUCKET_ENC_SESSION_KEY = "bucketEncSessionKey";
/**
 * @const
 */
tutao.rest.ResourceConstants.LIST_ENC_SESSION_KEY = "listEncSessionKey";
/**
 * @const
 */
tutao.rest.ResourceConstants.BUCKET_PERMISSION_LIST_ID = "bucketList";
/**
 * @const
 */
tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY = "updateOwnerEncSessionKey";

// public key service get request

/**
 * @const
 */
tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8 = "application/json;charset=UTF-8";

/**
 * @const
 */
tutao.rest.ResourceConstants.ID_PARAMETER_NAME = "id";

/**
 * @const
 */
tutao.rest.ResourceConstants.VERSION_PARAMETER_NAME = "version";
