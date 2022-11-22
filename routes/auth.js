'use strict'

//
// Imports.
//
const _ = require('lodash')
const dd = require('dedent')
const joi = require('joi')
const createRouter = require('@arangodb/foxx/router')
const errors = require('@arangodb').errors;
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;

//
// Application constants.
//
const K = require( '../utils/constants' )	// Application constants.
const Auth = require('../utils/auth')
const dictionary = require("../utils/dictionary");		// Authentication functions.

//
// Collections.
//
const users = K.db._collection(K.collection.user.name)
const sessions = K.db._collection(K.collection.session.name)

//
// Constants.
//
const loginRequest =
	joi
		.object({
			username: joi.string().required(),
			password: joi.string().required()
		})

//
// Instantiate and export router.
//
const router = createRouter();
module.exports = router;


/**
 * Login service
 * This service expects username and password, and will
 */
router.post('login', doLogin, 'login')
	.body(loginRequest, dd
		`
            **Service parameters**
            
            - \`username\`: The username or user code.
            - \`password\`: The user password.
        `
	)
	.response(200, joi.string(), dd
		`
            **Authentication token**
            
            The service will return:
            - \`200\`: The authentication token to be used in subsequent services.
            - \`401\`: If no user was found, or if credentials failed.
            - \`500\`: For all other errors.
        `
	)
	.summary('Login user')
	.description(dd
		`
            **Login user**
            
            *Use this service if you need to login.*
            
            The service expects an object with the user credentials:
            - \`username\`: The username or code.
            - \`password\`: The user password.
            
            The service will return a \`200\` status with the authentication token \
            or \`401\` if authentication failed and \`500\` for all other errors.
        `
	)


//
// Functions.
//

/**
 * Login user.
 * @param request: API request.
 * @param response: API response.
 */
function doLogin(request, response)
{
	//
	// TRY BLOCK
	//
	try {
		//
		// Retrieve user record.
		//
		const user = users.document(request.body.username)

		//
		// Validate user.
		//
		response.send(user._key)
	}

	//
	// CATCH BLOCK
	//
	catch (error) {

		//
		// Handle record not found.
		//
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			response.throw(
				401,
				K.error.kMSG_UNKNOWN_USER.message.iso_639_3_eng
			)
		}

		//
		// Handle other errors.
		//
		response.throw(
			500,
			error
		)
	}

} // doLogin()
