'use strict'

const _ = require('lodash')
const joi = require('joi')

/**
 * User selection model
 * This model represents the filter for getting the list of users.
 */
module.exports = {
	schema: {
		// Describe the attributes with joi here
		username: joi.string().required(),
		password: joi.string().required()
	},

	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj, ['_id', '_rev', '_oldRev', 'auth'])
		return obj
	},

	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
