'use strict'

//
// Application.
//
const K = require("./utils/constants")
const Session = require('./utils/sessions')

//
// Routes.
//
module.context.use('/terms', require('./routes/terms'), 'terms')
module.context.use('/graph', require('./routes/graphs'), 'graphs')
module.context.use('/enum', require('./routes/enumerations'), 'enum')
// module.context.use('/struct', require('./routes/structures'), 'struct')
module.context.use('/link', require('./routes/links'), 'link')
module.context.use('/descr', require('./routes/descriptors'), 'descr')
module.context.use('/check', require('./routes/validation'), 'check')

//
// Sessions.
//
module.context.use(Session.Session)

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
