'use strict'

//
// Sessions.
//
// const sessions = require("./utils/sessions")
// module.context.use(sessions)

//
// Routes.
//
module.context.use('/', require('./routes/utils'), 'utils')

module.context.use('/terms', require('./routes/terms'), 'terms')
module.context.use('/schemas', require('./routes/schemas'), 'schemas')
module.context.use('/topos', require('./routes/topos'), 'topos')

module.context.use('/enum', require('./routes/enumerations'), 'enum')
module.context.use('/struct', require('./routes/structures'), 'struct')
module.context.use('/check', require('./routes/validation'), 'check')
