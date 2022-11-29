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
		term_type: joi.string(),
		_nid: joi.string(),
		_lid: joi.string(),
		_gis: joi.string(),
		_aid: joi.array().items(joi.string()),
		_title: joi.string(),
		_definition: joi.string(),
		_data: joi.array().items(joi.string()),
		_type: joi.array().items(joi.string()),
		_kind: joi.array().items(joi.string())
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
