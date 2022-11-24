'use strict'

//
// Application constants.
//
const K = require('./constants')

//
// Includes.
//
const sessionsMiddleware = require("@arangodb/foxx/sessions")
const cookieTransport = require('@arangodb/foxx/sessions/transports/cookie')

/**
 * Sessions middleware
 */
// const Session = sessionsMiddleware({
// 	storage: K.db._collection(K.collection.session.name),
// 	transport: "cookie"
// })
const secret = module.context.configuration.cookieSecret
const Session = sessionsMiddleware({
	storage: K.db._collection(K.collection.session.name),
	transport: cookieTransport({
		ttl: module.context.configuration.timeToLive
	})
})

/**
 * Authorise service
 * This function expects the roles required by the service and will return
 * - 200: If the current user has all these roles.
 * - 401: If there is no current user.
 * - 403: If the current user does not have all required roles.
 *
 * @param theRequest {Object}: API request.
 * @param theRoles {Array<String>}: List of required roles.
 * @return {Number}: true means authorised; should throw 403 if not.
 */
function authorise(theRequest, theRoles = [])
{
	//
	// Assert user is logged in.
	//
	if(theRequest.session.uid !== null) {

		//
		// Iterate required roles.
		//
		for(const role of theRoles) {
			if(!theRequest.session.data.user.role.includes(role)) {
				return 403                                                      // ==>
			}
		}

		return 200                                                              // ==>
	}

	return 401                                                                  // ==>

} // authorise()


module.exports = {
	Session,
	authorise
}