'use strict'

//
// Application constants.
//
const K = require("./utils/constants")
const Session = require('./utils/sessions')

//
// Routes.
//
module.context.use('/auth', require('./routes/auth'), 'auth')
module.context.use('/util', require('./routes/utils'), 'utils')

module.context.use('/enum', require('./routes/enumerations'), 'enum')
module.context.use('/struct', require('./routes/structures'), 'struct')

module.context.use('/check', require('./routes/validation'), 'check')

// module.context.use('/terms', require('./routes/terms'), 'terms')
// module.context.use('/schemas', require('./routes/schemas'), 'schemas')
// module.context.use('/topos', require('./routes/topos'), 'topos')

//
// Sessions.
//
const sessions = require("./utils/sessions")
module.context.use(sessions.Session)

//
// Ensure a user is logged in.
//
module.context.use(
	(request, response, next) => {

		//
		// Request has user _key.
		//
		if(request.session.uid)
		{
			try
			{
				//
				// Get user.
				//
				const user =
					K.db._collection(K.collection.user.name)
						.document(request.session.uid)

				//
				// Save in session.
				//
				Session.setUser(request, user)

			} catch (error) {
				Session.clearUser(request)
			}
		}
		next()
	}
)