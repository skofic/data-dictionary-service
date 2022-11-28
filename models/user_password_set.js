'use strict'

const _ = require('lodash')
const joi = require('joi')

/**
 * User password set model
 * This model represents the data needed to change the password of a user.
 */
module.exports = {
	schema: {
		// Describe the attributes with joi here
		password: joi.string().required()
	},

	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj, ['_id', '_rev', '_oldRev', 'auth', 'role'])
		return obj
	},

	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
