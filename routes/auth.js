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
const K = require('../utils/constants')
const Auth = require('../utils/auth')
const Session = require('../utils/sessions')
const Application = require("../utils/application")

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
const keySchema = joi.string().required()
	.description('The key of the user');

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
router.post(
	'signup',
	(request, response) => {
		switch (
			Session.authorise(
				request,
				[
					K.environment.role.admin
				])
			)
		{
			case 200:
				doSignup(request, response)
				break

			case 401:
				response.throw(
					401,
					K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
				)													    		// ==>
				break

			case 403:
				response.throw(
					403,
					K.error.kMSG_UNAUTHORISED_USER.message[module.context.configuration.language]
				)													    		// ==>
				break
		}
	},
	'signup'
)
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

/**
 * Who am I?
 * This service will return the current user record or an empty object.
 */
router.get('whoami', doWhoAmI, 'whoami')
	.response(200, UserModel, dd
		`
            **User record**
            
            The service will return the current user record.
        `
	)
	.summary('Who am I?')
	.description(dd
		`
            **Current user**
            
            *Use this service to retrieve information on the current user.*
        `
	)

/**
 * Logout
 * This service will logout the user and return its record.
 */
router.get('logout', doLogout, 'logout')
	.response(200, UserModel, dd
		`
            **User record**
            
            The service will return the former current user record.
        `
	)
	.summary('Logout')
	.description(dd
		`
            **Logout user**
            
            *Use this service to logout the current user.*
        `
	)

/**
 * Reset
 * This service will delete and re-create users.
 */
router.post(
	'reset',
	(request, response) => {
		switch (
			Session.authorise(
				request,
				[
					K.environment.role.admin
				])
			)
		{
			case 200:
				let messages = []
				if(request.body.default) {
					messages = messages.concat(Application.deleteDefaultUsers())
				}

				if(request.body.created) {
					messages = messages.concat(Application.deleteCreatedUsers())
				}

				response.send(messages.concat(createDefaultUsers(request, response)))
				break

			case 401:
				response.throw(
					401,
					K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
				)													    		// ==>
				break

			case 403:
				response.throw(
					403,
					K.error.kMSG_UNAUTHORISED_USER.message[module.context.configuration.language]
				)													    		// ==>
				break
		}
	},
	'reset'
)
	.body(
		joi.object({
			default: joi.boolean().default(false),
			created: joi.boolean().default(false)
		}),
		dd
		`
            **Which users?**
            
            The service body expects an object with the following properties:
            - default {Boolean}: Whether to delete default users.
            - created {Boolean}: Whether to delete created users.
        `
	)
	.response(200, joi.array().items(joi.string()), dd
		`
            **Messages**
            
            The service will return the list of operations.
        `
	)
	.summary('Reset users')
	.description(dd
		`
            **Reset users**
            
            This service will delete default or created users, and re-create default users.
            All operations will delete corresponding session records and logout corresponding users,
            this means that the current user might also be disconnected.
            
            You can use this service after changing the default users codes or passwords in the configuration.
        `
	)

/**
 * Delete service
 * This service will delete a user by key.
 */
router.delete(
	':key',
	(request, response) => {
		switch (
			Session.authorise(
				request,
				[
					K.environment.role.admin
				])
			)
		{
			case 200:
				const key = request.pathParams.key
				try {

				} catch {

				}
				const user = users.document(key)
				if(user) {
					response.send(
						Application.deleteUser(key, user.username)
					)
				} else {
					response.send(
						`User ${key} not found`
					)
				}
				break

			case 401:
				response.throw(
					401,
					K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
				)													    		// ==>
				break

			case 403:
				response.throw(
					403,
					K.error.kMSG_UNAUTHORISED_USER.message[module.context.configuration.language]
				)													    		// ==>
				break
		}
	},
	'delete'
)
	.pathParam('key', keySchema)
	.response(200, joi.string(), dd
		`
            **Messages**
            
            The service will return the list of operations.
        `
	)
	.summary('Delete user')
	.description(dd
		`
            **Delete user**
            
            *Use this service to remove a user.*
            
            The service expects the user _key in the path.
            
            The service will return \`null\`.
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
	const user = users.firstExample({username})
	if (user) {

		//
		// Resolve password.
		//
		if (Auth.verify(user.auth, request.body.password)) {

			//
			// Save session.
			//
			request.session.uid = user._key
			request.session.data = {
				user: {
					username: user.username,
					role: user.role,
					default: user.default
				}
			}
			request.sessionStorage.save(request.session)

			response.send(request.session.data.user)							// ==>

		} // Valid password.

		else {
			response.throw(
				401,
				K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
			)																	// ==>

		} // Invalid password.

	} // Valid user.

	else {
		response.throw(
			401,
			K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
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
	// Build user.
	//
	const user = {
		username: request.body.username,
		role: request.body.role,
		auth: Auth.create(request.body.password),
		default: false
	}

	//
	// Save user.
	//
	try
	{
		//
		// Save user.
		//
		const meta = users.save(user)

		//
		// Save session.
		//
		request.session.uid = meta._key
		request.session.data = {
			user: {
				username: user.username,
				role: user.role,
				default: user.default
			}
		}
		request.sessionStorage.save(request.session)

		response.send(request.session.data.user)						// ==>

	} catch (error) {
		response.throw(
			409,
			K.error.kMSG_DUPLICATE_USER.message[module.context.configuration.language]
		)                                                               // ==>
	}

} // doSignup()

/**
 * Return current user.
 * @param request: API request.
 * @param response: API response.
 */
function doWhoAmI(request, response) {

	//
	// Check if there is a logged in user.
	//
	if (request.session.uid !== null) {
		response.send(request.session.data.user)                                // ==>
	} else {
		response.send({ })                                                      // ==>
	}

} // doWhoAmI()

/**
 * Logout current user.
 * @param request: API request.
 * @param response: API response.
 */
function doLogout(request, response)
{
	//
	// Check if there is a logged in user.
	//
	if (request.session.uid !== null) {
		const user = JSON.parse(JSON.stringify(request.session.data.user))

		request.session.uid = null
		request.session.data = null
		request.sessionStorage.save(request.session)

		response.send(user)                                                     // ==>

	} else {
		response.send({ })                                                      // ==>
	}

} // doLogout()

/**
 * Create default users.
 * @param request: API request.
 * @param response: API response.
 * @return {Array<String>>}: List of operation messages.
 */
function createDefaultUsers(request, response)
{
	//
	// Delete and create default users.
	//
	return Application.createDefaultUsers()                                     // ==>

} // createDefaultUsers()
