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
		start: joi.number().integer().min(0).default(0).required(),
		limit: joi.number().integer().min(0).default(25).required(),
		term_type: joi.string().valid('descriptor', 'structure'),
		_nid: joi.string(),
		_lid: joi.string(),
		_gid: joi.string(),
		_name: joi.string(),
		_pid: joi.string(),
		_aid: joi.array().items(joi.string()),
		_title: joi.string(),
		_definition: joi.string(),
		_description: joi.string(),
		_examples: joi.string(),
		_notes: joi.string(),
		_provider: joi.string()
	},

	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit()
		return obj
	},

	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
