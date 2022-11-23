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

//
// Models.
//
const CredentialsModel =
	joi
		.object({
			username: joi.string().required(),
			password: joi.string().required()
		})

const UserModel =
	joi
		.object({
			username: joi.string().required(),
			role: joi.array().items(joi.string()).required()
		})

const SignupModel =
	joi
		.object({
			username: joi.string().required(),
			password: joi.string().required(),
			role: joi.array().items(joi.string()).required()
		})

//
// Instantiate and export router.
//
const router = createRouter();
module.exports = router;
router.tag('authentication')


/**
 * Login service
 * This service will login a user given its code and password.
 */
router.post('login', doLogin, 'login')
	.body(CredentialsModel, dd
		`
            **Service parameters**
            
            - \`username\`: The username or user code.
            - \`password\`: The user password.
        `
	)
	.response(200, UserModel, dd
		`
            **User record**
            
            The service will return :
            - \`200\`: The user record.
            - \`401\`: If no user was found, or if credentials failed.
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
            
            The service will return a \`200\` status with the user record \
            or \`401\` if authentication failed .
        `
	)

/**
 * Signup service
 * This service will create a new user.
 */
router.post('signup', doSignup, 'signup')
	.body(SignupModel, dd
		`
            **Service parameters**
            
            The service expects an object with the following properties:
            - username: *String* - The username or code.
            - password: *String* - The user password.
            - role: *Array* - The list of permission roles: \
            \`admin\` for administration, \`dict\` for dictionary management \
            and \`read\` for dictionary usage.
            
            \`admin\` role allows to create and manage users.
            \`dict\` role allows the management of dictionary elements.
            \`read\` role allows reading the data dictionary contents.
        `
	)
	.response(200, UserModel, dd
		`
            **User record**
            
            The service will return :
            - \`200\`: The user record.
            - \`401\`: If no user was found, or if credentials failed.
        `
	)
	.summary('Signup user')
	.description(dd
		`
            **Signup user**
            
            *Use this service to create a new user.*
            
            The service expects an object including the username, password and the list of roles.
            
            The service will return a \`200\` status with the user record.
            
            Note that we do not validate user roles, the \`role\` user property \
            may include any value, whether values match default roles counts.
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
	// Resolve username.
	//
	const username = request.body.username
	const user = users.firstExample({ username })
	if(user) {

		//
		// Resolve password.
		//
		if(Auth.verify(user.auth, request.body.password)) {

			//
			// Save session.
			//
			request.session.uid = user._key
			request.sessionStorage.save(request.session)

			//
			// Clean user record.
			//
			delete user._id
			delete user._rev
			delete user.auth

			response.send(user)													// ==>

		} // Valid password.

		else {
			response.throw(
				401,
				K.error.kMSG_UNKNOWN_USER[module.context.configuration.language]
			)																	// ==>

		} // Invalid password.

	} // Valid user.

	else {
		response.throw(
			401,
			K.error.kMSG_UNKNOWN_USER[module.context.configuration.language]
		)																		// ==>

	} // Invalid user.

} // doLogin()

/**
 * Signup user.
 * @param request: API request.
 * @param response: API response.
 */
function doSignup(request, response)
{
	//
	// Init local storage.
	//
	const user = {}

	//
	// Build user.
	//
	user.username = request.body.username
	user.role = request.body.role
	user.auth = Auth.create(request.body.password)

	//
	// Save user.
	//
	try
	{
		//
		// Save user.
		//
		const meta = users.save(user)
		Object.assign(user, meta)

		//
		// Save session.
		//
		request.session.uid = meta._key
		request.sessionStorage.save(request.session)

		delete user.auth
		response.send(user)														// ==>

	} catch (error) {
		response.throw(
			409,
			K.error.kMSG_DUPLICATE_USER[module.context.configuration.language]
		)
	}

} // doSignup()
