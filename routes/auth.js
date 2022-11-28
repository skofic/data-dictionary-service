'use strict'

/**
 * Authentication services
 */

//
// Imports.
//
const dd = require('dedent')
const joi = require('joi')
const status = require('statuses')
const errors = require('@arangodb').errors
const httpError = require('http-errors')

//
// Error codes.
//
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

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
const UserSetRoles = require('../models/user_roles_set')
const UserSetPassword = require('../models/user_password_set')
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
	.summary('Login user')
	.description(dd
		`
            **Login user**
            
            *Use this service if you need to login.*
        `
	)
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
            **Invalid password**
            
            Provided a password that does not match the user authentication data.
        `
	)
	.response(404, ErrorModel, dd
		`
            **Unable to find user**
            
            No user exists with the provided username.
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
	.response(201, UserDisplayModel, dd
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

/**
 * Who am I? service
 * This service will return the current user record or an empty object.
 */
router.get('whoami', doWhoAmI, 'whoami')
	.summary('Who am I?')
	.description(dd
		`
            **Current session user**
            
            *Use this service to retrieve information on the current session user.*
        `
	)
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

/**
 * Logout user service
 * This service will logout the user and return its record.
 */
router.get('logout', doLogout, 'logout')
	.summary('Logout')
	.description(dd
		`
            **Logout user**
            
            *Use this service to logout the current user.*
        `
	)
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

/**
 * Reset users and authentication
 * This service can delete and re-create default users, and refresh authentication data.
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
	.summary('Reset users')
	.description(dd
		`
            **Reset users and authentication data**
             
            ***In order to use this service, the current user must have the \`admin\` role.***
             
            This service can be used to:
            - *Delete default users*: If you provide \`true\` in the \`default\` body parameter, \
              the service will delete all default users.
            - *Delete created users*: If you provide \`true\` in the \`created\` body parameter, \
              the service will delete all created users.
            - *Refresh authentication data*: If you provide \`true\` in the \`auth\` body parameter, \
              the service will refresh administrator, user and cookie authentication data.
            
            When deleting users, the service will also delete eventual sessions connected \
            to the deleted users, this means that these users will also be disconnected.
            
            Default users can be managed through the services settings, you can change \
            the username and the password: to register these changes you call this service \
            with the \`default\` parameter set to \`true\`: this will remove the former user, \
            clear related sessions, and will re-create the modified default user.
            
            *Note that in all cases default users will be created, if not already there.*
        `
	)
	.body(UserResetModel, dd
		`
            **Service parameters**
            
            The service body expects an object with the following properties:
            - \`default\` {Boolean}: Whether to delete *default* users.
            - \`created\` {Boolean}: Whether to delete *created* users.
            - \`auth\` {Boolean}: Whether to refresh authentication data.
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

/**
 * Set user password
 * This service will set the user password.
 */
router.patch(
	'password/:key',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doSetPassword(request, response)
		}
	},
	'set-pass'
)
	.summary('Set user password')
	.description(dd
		`
            **Set user password**
            
            This service is used by administrators to change the password of a specific user.
              
            ***In order to use this service, the current user must have the \`admin\` role.***
        `
	)
	.pathParam('key', keySchema)
	.body(UserSetPassword, dd
		`
            **User password**
            
            The service body expects an object with the following property:
            - \`password\` {String}: The new password
        `
	)
	.response(200, UserDisplayModel, dd
		`
            **Outcome**
            
            The service will return \`{ success: true }\` if successful.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No user registered**
            
            There is no active session.
        `
	)
	.response(403, ErrorModel, dd
		`
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
	)
	.response(404, ErrorModel, dd
		`
            **User not found**
            
            The provided key is not associated with any users.
        `
	)
	.response(409, ErrorModel, dd
		`
            **Conflict**
            
            The user document was modified in between the time \
            it was read and the time it was modified.
        `
	)

/**
 * Change user password
 * This service will change the user password.
 */
router.patch(
	'password',
	doChangePassword,
	'change-pass'
)
	.summary('Change my password')
	.description(dd
		`
            **Change current user password**
            
            This service can be used to change the current user's password.
        `
	)
	.body(UserSetPassword, dd
		`
            **User password**
            
            The service body expects an object with the following property:
            - \`password\` {String}: The new password
        `
	)
	.response(200, joi.object(), dd
		`
            **Outcome**
            
            The service will return \`{ success: true }\` if successful.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No user registered**
            
            There is no active session.
        `
	)
	.response(404, ErrorModel, dd
		`
            **User not found**
            
            The session user key is not associated with any users.
        `
	)
	.response(409, ErrorModel, dd
		`
            **Conflict**
            
            The user document was modified in between the time \
            it was read and the time it was modified.
        `
	)

/**
 * Set user roles
 * This service will set the user roles.
 */
router.patch(
	'role/:key',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doSetRoles(request, response)
		}
	},
	'set-roles'
)
	.summary('Set user roles')
	.description(dd
		`
            **Set user roles**
            
            This service is used by administrators to change the roles of a specific user.
              
            ***In order to use this service, the current user must have the \`admin\` role.***
        `
	)
	.pathParam('key', keySchema)
	.body(UserSetRoles, dd
		`
            **User roles**
            
            The service body expects an object with the following property:
            - \`role\` {Array}: The list of new roles.
            
            These are the roles managed by this dictionary:
            - \`admin\`: Allows the user to manage users and sessions.
            - \`dict\`: Allows the user to manage dictionary elements.
            - \`read\`: Allows the user to read the data dictionary contents.
        `
	)
	.response(200, UserDisplayModel, dd
		`
            **User record**
            
            The service will return the current user updated record.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No user registered**
            
            There is no active session.
        `
	)
	.response(403, ErrorModel, dd
		`
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
	)
	.response(404, ErrorModel, dd
		`
            **User not found**
            
            The provided key is not associated with any users.
        `
	)
	.response(409, ErrorModel, dd
		`
            **Conflict**
            
            The user document was modified in between the time \
            it was read and the time it was modified.
        `
	)

/**
 * Delete user service
 * This service will delete a user by key.
 */
router.delete(
	'user/:key',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doDelete(request, response)
		}
	},
	'delete'
)
	.summary('Delete user')
	.description(dd
		`
            **Delete user**
            
            This service is used by administrators to delete specific users.
              
            ***In order to use this service, the current user must have the \`admin\` role.***
        `
	)
	.pathParam('key', keySchema)
	.response(200, UserDisplayModel, dd
		`
            **Message**
            
            The service will return the operation outcome.
        `
	)
	.response(404, ErrorModel, dd
		`
            **User not found**
            
            The provided key is not associated with any users.
        `
	)

/**
 * Delete current user service
 * This service will delete the current user.
 */
router.delete(
	'user',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doDeleteCurrent(request, response)
		}
	},
	'delete-me'
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
	.response(200, joi.string(), dd
		`
            **Message**
            
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
			404,
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
		auth: Auth.Module.create(request.body.password),
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
			)

			return                                                              // ==>
		}

		response.throw(500, error.message)
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
		response.send(request.session.data.user)
		return                                                                  // ==>
	}

	response.throw(
		404,
		K.error.kMSG_NO_CURRENT_USER.message[module.context.configuration.language]
	)

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

		response.send(user)
		return                                                                  // ==>
	}

	response.throw(
		404,
		K.error.kMSG_NO_CURRENT_USER.message[module.context.configuration.language]
	)                                                                           // ==>

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
	// Refresh authentication data.
	//
	messages = messages.concat(Application.createAuthSettings(request.body.auth))

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
		Application.deleteUser(user._key, user.username)
		response.send({
			username: user.username,
			role: user.role,
			default: user.default
		})                                                                      // ==>

	} catch (error) {
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			response.throw(
				404,
				K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
			)                                                                   // ==>
		} else {
			response.throw(500, error.message)                               // ==>
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
		} catch (error) {
			if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
				response.throw(
					404,
					K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
				)                                                               // ==>
			} else {
				response.throw(500, error.message)                          // ==>
			}
		}
	} else {
		response.throw(
			404,
			K.error.kMSG_NO_CURRENT_USER.message[module.context.configuration.language]
		)                                                                       // ==>
	}

} // doDeleteCurrent()

/**
 * Set user password.
 * Note that role matching must be performed before calling this function.
 * @param request: API request.
 * @param response: API response.
 */
function doSetPassword(request, response)
{
	//
	// Init local storage.
	//
	let user = {}

	//
	// Get user.
	//
	try {
		user = users.document(request.pathParams.key)
	}
	catch (error)
	{
		//
		// Handle user not found.
		//
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND)
		{
			response.throw(
				404,
				K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
			)
		}
		else {
			response.throw(500, error.message)
		}

		return                                                                  // ==>

	} // User unavailable.

	//
	// Set new password.
	//
	try
	{
		users.update(
			user,
			{ auth: Auth.Module.create(request.body.password) }
		)
	}
	catch (error)
	{
		if(error.isArangoError && error.errorNum === ARANGO_CONFLICT)
		{
			response.throw(
				409,
				K.error.kMSG_ERROR_CONFLICT.message[module.context.configuration.language]
			)
		}
		else {
			response.throw(500, error.message)
		}

		return                                                                  // ==>
	}

	response.send({
		username: user.username,
		role: request.body.role,
		default: user.default
	})                                                                          // ==>

} // doSetPassword()

/**
 * Set user roles.
 * Note that role matching must be performed before calling this function.
 * @param request: API request.
 * @param response: API response.
 */
function doSetRoles(request, response)
{
	//
	// Init local storage.
	//
	let user = {}

	//
	// Get user.
	//
	try {
		user = users.document(request.pathParams.key)
	}
	catch (error)
	{
		//
		// Handle user not found.
		//
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND)
		{
			response.throw(
				404,
				K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
			)
		}
		else {
			response.throw(500, error.message)
		}

		return                                                                  // ==>

	} // User unavailable.

	//
	// Set new roles.
	//
	try
	{
		users.update( user, { role: request.body.role } )
	}
	catch (error)
	{
		if(error.isArangoError && error.errorNum === ARANGO_CONFLICT)
		{
			response.throw(
				409,
				K.error.kMSG_ERROR_CONFLICT.message[module.context.configuration.language]
			)
		}
		else {
			response.throw(500, error.message)
		}

		return                                                                  // ==>
	}

	response.send({
		username: user.username,
		role: request.body.role,
		default: user.default
	})                                                                          // ==>

} // doSetRoles()

/**
 * Change current user password.
 * Note that no role matching is dome before calling this function.
 * @param request: API request.
 * @param response: API response.
 */
function doChangePassword(request, response)
{
	//
	// Assert active session.
	//
	if(request.session.uid !== null)
	{
		try
		{
			//
			// Get user.
			//
			const user = users.document(request.session.uid)

			try
			{
				//
				// Update user.
				//
				users.update(
					user,
					{ auth: Auth.Module.create(request.body.password) }
				)

				response.send({ success: true })
				return                                                          // ==>
			}
			catch (error)
			{
				if(error.isArangoError && error.errorNum === ARANGO_CONFLICT)
				{
					response.throw(
						409,
						K.error.kMSG_ERROR_CONFLICT.message[module.context.configuration.language]
					)
				}
				else {
					response.throw(500, error.message)
				}

				return                                                          // ==>

			} // Unable to update user.
		}
		catch (error)
		{
			//
			// Handle user not found.
			//
			if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND)
			{
				response.throw(
					404,
					K.error.kMSG_UNKNOWN_USER.message[module.context.configuration.language]
				)
			}
			else {
				response.throw(500, error.message)
			}

			return                                                              // ==>

		} // User not found.

	} // Active session.

	response.throw(
		401,
		K.error.kMSG_MUST_LOGIN.message[module.context.configuration.language]
	)

} // doChangePassword()
