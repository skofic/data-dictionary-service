'use strict'

//
// Application constants.
//
const K = require("./utils/constants")

//
// Routes.
//
module.context.use('/terms', require('./routes/terms'), 'terms')
module.context.use('/schemas', require('./routes/schemas'), 'schemas')
module.context.use('/topos', require('./routes/topos'), 'topos')
module.context.use('/enum', require('./routes/enumerations'), 'enum')
module.context.use('/struct', require('./routes/structures'), 'struct')
module.context.use('/check', require('./routes/validation'), 'check')
module.context.use('/auth', require('./routes/auth'), 'auth')
module.context.use('/util', require('./routes/utils'), 'utils')

//
// Sessions.
//
const sessions = require("./utils/sessions")
module.context.use(sessions)

//
// Ensure a user is logged in.
//
module.context.use(
	(request, response, next) => {
		if(request.session.uid) {
			try {
				request.user =
					K.db._collection(K.collection.user.name)
						.document(request.session.uid)
			} catch (error) {
				request.session.uid = null
				request.sessionStorage.save()
			}
		}
		next()
	}
)