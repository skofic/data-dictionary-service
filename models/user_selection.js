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
		start: joi.number().integer().min(0).default(0).required(),
		limit: joi.number().integer().min(0).default(25).required(),
		username: joi.string(),
		role: joi.array().items(joi.string()),
		default: joi.boolean()
	},

	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj, [])
		return obj
	},

	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
