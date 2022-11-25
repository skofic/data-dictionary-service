'use strict'

const _ = require('lodash')
const joi = require('joi')

/**
 * Reset users model
 * This model represents the request to reset users.
 */
module.exports = {
	schema: {
		// Describe the attributes with joi here
		default: joi.boolean().default(false),
		created: joi.boolean().default(false)
	},

	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj)
		return obj
	},

	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
