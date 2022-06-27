'use strict';

module.context.use('/terms', require('./routes/terms'), 'terms');
module.context.use('/schemas', require('./routes/schemas'), 'schemas');
module.context.use('/topos', require('./routes/topos'), 'topos');
