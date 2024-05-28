'use strict'

//
// Includes.
//
const sessionsMiddleware = require("@arangodb/foxx/sessions")
const cookieTransport = require('@arangodb/foxx/sessions/transports/cookie');

//
// Application constants.
//
const K = require('./constants')
const Auth = require('./auth')

//
// Set sessions middleware.
// Note: you should expect a session property in the request.
//
const Session = sessionsMiddleware({						    // Middleware.
	storage	  : K.db._collection(K.collection.session.name),    // Collection.
	transport : cookieTransport({							    // Transport.
		name: module.context.configuration.cookie,			    // Name.
		ttl:  module.context.configuration.timeToLive,          // Timeout.
		algorithm: module.context.configuration.method,         // Algorythm.
		secret: Auth.getSettings().cookie                       // Secret.
	})
})

/**
 * Has permission
 *
 * This function will check whether the current user has all the required permissions,
 * if that is not the case, the function will throw the following errors:
 * - 401: If a registered user is required and there is no current user.
 * - 403: If the current user is lacking a required role.
 *
 * The function will return `true` if the user has permission, false if not.
 * In the latter case, an error will have been throws with the above codes.
 *
 * These are the default roles:
 * - `admin`: The user is allowed to create users and manage sessions.
 * - `dict`: The user is allowed to create and manage dictionary items.
 * - `read`: The user is allowed to use the dictionary.
 *
 * If no roles are provided, it is assumed the service is public.
 *
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 * @param theRoles {Array<String>>}: Rerquired roles.
 * @return {boolean}: true means has permission.
 */
function hasPermission(theRequest, theResponse, theRoles = [])
{
	//
	// Handle public services.
	//
	if(theRoles.length === 0) {
		return true                                                             // ==>
	}

	//
	// Assert user.
	//
	if(theRequest.session.uid === null) {
		theResponse.throw(
			401,
			K.error.kMSG_MUST_LOGIN.message[module.context.configuration.language]
		)
		return false                                                            // ==>
	}

	//
	// Assert role.
	//
	for(const role of theRoles) {
		if(!theRequest.session.data.user.role.includes(role)) {
			const message =
				K.error.kMSG_ROLE_REQUIRED.message[module.context.configuration.language]
					.replace('@@@', role)
			theResponse.throw(403, message)
			return false                                                        // ==>
		}
	}

	return true                                                                 // ==>

} // hasPermission()

/**
 * Set session user
 *
 * This function will set the user in the session.
 * The function expects the service request and the user document.
 *
 * The provided user document should have the following properties:
 * - username: User name or code.
 * - role: List of user roles.
 * - default: Flag indicating whether it is a default user.
 *
 * @param theRequest {Object}: Service request.
 * @param theUser {Object}: The user document.
 */
function setUser(theRequest, theUser)
{
	//
	// Save user in session.
	//
	theRequest.session.data = {
		user: {
			username: theUser.username,
			role: theUser.role,
			default: theUser.default
		}
	}

} // setUser()

/**
 * Clear session user
 *
 * This function will clear the user from the session.
 * The function expects the service request.
 *
 * @param theRequest {Object}: Service request.
 */
function clearUser(theRequest)
{
	//
	// Clear user from session.
	//
	theRequest.session.uid = null
	theRequest.session.data = null

	theRequest.sessionStorage.save(theRequest.session)

} // clearUser()


module.exports = {
	Session,
	hasPermission,
	setUser,
	clearUser
}
