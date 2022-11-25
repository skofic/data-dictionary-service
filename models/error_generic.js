'use strict'

const _ = require('lodash')
const joi = require('joi')

/**
 * Generic error model
 * This model represents the response of a failed service.
 */
module.exports = {
	schema: {
		// Describe the attributes with joi here
		errorNum: joi.number(),
		errorMessage: joi.string(),
		code: joi.number()
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
