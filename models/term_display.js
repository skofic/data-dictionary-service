'use strict'

const _ = require('lodash')
const joi = require('joi')

/**
 * User display model
 * This model represents the user document returned by authentication services.
 */
module.exports = {
	schema: {
		// Describe the attributes with joi here
		_key: joi.string().required(),
		_code: joi.object().required(),
		_info: joi.object().required()
	},

	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj, ['_id', '_rev', '_oldRev'])
		return obj
	},

	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
