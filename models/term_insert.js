'use strict'

const _ = require('lodash')
const joi = require('joi')

/**
 * Term insert model
 * This model represents the user document returned by authentication services.
 */
module.exports = {
	schema: joi.alternatives().try(
		joi.object({
			_code: joi.object({
				_nid: joi.string(),
				_lid: joi.string().required(),
				_gid: joi.string(),
				_aid: joi.array().items(joi.string()),
				_pid: joi.array().items(joi.string()),
				name: joi.string()
			}).required(),
			_info: joi.object({
				_title: joi.object().required(),
				_definition: joi.object().required(),
				_description: joi.object(),
				_examples: joi.object(),
				_notes: joi.object(),
				_provider: joi.string()
			}).required(),
			_data: joi.object(),
			_rule: joi.object()
		}),
		joi.array().items(joi.object({
			_code: joi.object({
				_nid: joi.string(),
				_lid: joi.string().required(),
				_gid: joi.string(),
				_aid: joi.array().items(joi.string()),
				_pid: joi.array().items(joi.string()),
				name: joi.string()
			}).required(),
			_info: joi.object({
				_title: joi.object().required(),
				_definition: joi.object().required(),
				_description: joi.object(),
				_examples: joi.object(),
				_notes: joi.object(),
				_provider: joi.string()
			}).required(),
			_data: joi.object(),
			_rule: joi.object()
		}))
	),

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
