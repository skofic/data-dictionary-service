'use strict'

/**
 * Authentication services
 */

//
// Imports.
//
const dd = require('dedent')
const joi = require('joi')
const errors = require('@arangodb').errors

//
// Error codes.
//
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code

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
const UserSignupModel = require('../models/user_signup')
const UserCredentialsModel = require('../models/user_credentials')
const UserDisplayModel = require('../models/user_display')
const UserResetModel = require('../models/user_reset')
const ErrorModel = require('../models/error_generic')
const keySchema = joi.string().required()
	.description('The `_key` of the user document.')

//
// Instantiate and export router.
//
const createRouter = require('@arangodb/foxx/router')
const router = createRouter()
module.exports = router
router.tag('Authentication')


/**
 * Login user service
 * This service will login a user given its code and password.
 */
router.post('login', doLogin, 'login')
	.body(UserCredentialsModel, dd
		`
            **Service parameters**
            
            - \`username\`: The username or user code.
            - \`password\`: The user password.
        `
	)
	.response(200, UserDisplayModel, dd
		`
            **User record**
            
            The service will return the user document.
        `
	)
	.response(401, ErrorModel, dd
		`
            **Unable to register user**
            
            The service will return this code if either the user was not found, \
            or if the provided password did not match.
        `
	)
	.summary('Login user')
	.description(dd
		`
            **Login user**
            
            *Use this service if you need to login.*
        `
	)

/**
 * Signup user service
 * This service will create a new user.
 */
router.post(
	'signup',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doSignup(request, response)
		}
	},
	'signup'
)
	.body(UserSignupModel, dd
		`
            **Service parameters**
            
            The service expects an object with the following properties:
            - \`username\`: *String* - The username or code.
            - \`password\`: *String* - The user password.
            - \`role\`: *Array* - The list of permission roles.
            
            The \`role\` property is an array that may contain none, one or more codes:
            - \`admin\` role allows to manage users and sessions.
            - \`dict\` role allows the management of dictionary elements.
            - \`read\` role allows reading the data dictionary contents.
            
            Besides the above codes, you may set other values in the roles list, \
            if you intent to use them for purposes other than service permissions.
        `
	)
	.response(200, UserDisplayModel, dd
		`
            **User record**
            
            The service will return the newly created user document, only \
            \`username\`, \`role\` and \`default\` properties will be returned.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not an administrator.
        `
	)
	.response(409, ErrorModel, dd
		`
            **Username conflict**
            
            The service will return this code if the provided user already exists.
        `
	)
	.summary('Signup user')
	.description(dd
		`
            **Signup user**
            
            *Use this service to create a new user.*
            
             ***In order to create a user, the current user must have the \`admin\` role.***
           
            The service expects the user code, password and roles, if successful, \
            the service will return the code, roles and default flag.
        `
	)

/**
 * Who am I? service
 * This service will return the current user record or an empty object.
 */
router.get('whoami', doWhoAmI, 'whoami')
	.response(200, UserDisplayModel, dd
		`
            **User record**
            
            The service will return the current user record.
        `
	)
	.response(404, ErrorModel, dd
		`
            **No current user**
            
            The current session does not have a registered user.
        `
	)
	.summary('Who am I?')
	.description(dd
		`
            **Current session user**
            
            *Use this service to retrieve information on the current session user.*
        `
	)

/**
 * Logout user service
 * This service will logout the user and return its record.
 */
router.get('logout', doLogout, 'logout')
	.response(200, UserDisplayModel, dd
		`
            **User record**
            
            The service will return the former current user document.
        `
	)
	.response(404, ErrorModel, dd
		`
            **No current user**
            
            The current session does not have a registered user.
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
 * Reset users service
 * This service will delete and re-create users.
 */
router.post(
	'reset',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doReset(request, response)
		}
	},
	'reset'
)
	.body(UserResetModel, dd
		`
            **Which users?**
            
            The service body expects an object with the following properties:
            - \`default\` {Boolean}: Whether to delete *default* users.
            - \`created\` {Boolean}: Whether to delete *created* users.
            
            *Default* users are those who have the \`default\` property set to \`true\`, \
            these users can be managed using the service settings.
            *Created* users are those who have the \`default\` property set to \`false\`, \
            these users are those created with the *signup* service.
            
            If the value is \`false\`, existing users will not be modified.
            In all cases, the default users will be created if not already there.
        `
	)
	.response(200, joi.array().items(joi.string()), dd
		`
            **Messages**
            
            The service will return the list of operations.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not an administrator.
        `
	)
	.summary('Reset users')
	.description(dd
		`
            **Reset users**
             
             ***In order to use this service, the current user must have the \`admin\` role.***
           
            This service will delete *default* or *created* users, and re-create default users.
            All operations will delete corresponding session records and logout corresponding users,
            this means that the current user might also be disconnected.
            
            Default users can be managed through the services settings, you can change \
            the username and the password, to register these changes you call this service \
            with the \`default\` parameter set to \`true\`: this will remove the former user, \
            clear related sessions, and will re-create the modified default user.
            
            You can use this service to clear all users and start over with the default administrator.
        `
	)

/**
 * Delete user service
 * This service will delete a user by key.
 */
router.delete(
	':key',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doDelete(request, response)
		}
	},
	'delete'
)
	.pathParam('key', keySchema)
	.response(200, joi.string(), dd
		`
            **Messages**
            
            The service will return the operation outcome.
        `
	)
	.response(404, ErrorModel, dd
		`
            **User not found**
            
            The provided key is not associated with any users.
        `
	)
	.summary('Delete user')
	.description(dd
		`
            **Delete user**
            
            This service is used by administrators to delete specific users.
              
            ***In order to use this service, the current user must have the \`admin\` role.***
        `
	)

/**
 * Delete current user service
 * This service will delete the current user.
 */
router.delete(
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doDeleteCurrent(request, response)
		}
	},
	'delete-me'
)
	.response(200, joi.string(), dd
		`
            **Messages**
            
            The service will return the operation outcome.
        `
	)
	.response(404, ErrorModel, dd
		`
            **User not found**
            
            This error is either returned if the current session user cannot be located, \
            or if there is no current user in the session.
        `
	)
	.summary('Delete current user')
	.description(dd
		`
            **Delete current user**
            
            This service can be used by a user to delete itself.
            Once deleted, the former current user will no more be able to login \
            and all related sessions will be deleted.
            
            If you are logged in as the default administrator, \
            that user will be re-created automatically.
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
		if (Auth.Module.verify(user.auth, request.body.password)) {

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
		auth: Auth.Module.Create.create(request.body.password),
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
		users.save(user)

		response.send({
			username: user.username,
			role: user.role,
			default: user.default
		})                                                                      // ==>
	}

	//
	// Assume duplicate user.
	//
	catch (error) {
		if(error.isArangoError && error.errorNum === ARANGO_DUPLICATE) {
			response.throw(
				409,
				K.error.kMSG_DUPLICATE_USER.message[module.context.configuration.language]
			)                                                                   // ==>
		} else {
			response.throw(error)                                               // ==>
		}
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
		response.throw(
			404,
			K.error.kMSG_NO_CURRENT_USER.message[module.context.configuration.language]
		)                                                                       // ==>
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

		//
		// Save current user.
		//
		const user = JSON.parse(JSON.stringify(request.session.data.user))

		//
		// Clear user from session.
		//
		Session.clearUser(request)

		response.send(user)                                                     // ==>

	} else {
		response.throw(
			404,
			K.error.kMSG_NO_CURRENT_USER.message[module.context.configuration.language]
		)                                                                       // ==>
	}

} // doLogout()

/**
 * Reset users.
 * @param request: API request.
 * @param response: API response.
 */
function doReset(request, response)
{
	let messages = []

	//
	// Delete default users.
	//
	if(request.body.default) {
		messages = messages.concat(Application.deleteDefaultUsers())
	}

	//
	// Delete created users.
	//
	if(request.body.created) {
		messages = messages.concat(Application.deleteCreatedUsers())
	}

	//
	// Create default users.
	//
	messages = messages.concat(Application.createDefaultUsers())

	response.send(messages)

} // doReset()

/**
 * Delete user.
 * @param request: API request.
 * @param response: API response.
 */
function doDelete(request, response)
{
	const key = request.pathParams.key

	try {
		const user = users.document(key)
		response.send(
			Application.deleteUser(user._key, user.username)
		)
	} catch {
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			response.throw(
				404,
				K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
			)                                                                   // ==>
		} else {
			response.throw(error)                                               // ==>
		}
	}

} // doDelete()

/**
 * Delete current user.
 * @param request: API request.
 * @param response: API response.
 */
function doDeleteCurrent(request, response)
{
	//
	// Assert there is a current user.
	//
	if(request.session.uid !== null) {
		try {
			const user = users.document(request.session.uid)
			response.send(
				Application.deleteUser(user._key, user.username)
			)
		} catch {
			if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
				response.throw(
					404,
					K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
				)                                                               // ==>
			} else {
				response.throw(error)                                           // ==>
			}
		}
	} else {
		response.throw(
			404,
			K.error.kMSG_NO_CURRENT_USER.message[module.context.configuration.language]
		)                                                                       // ==>
	}

} // doDeleteCurrent()
