'use strict'

//
// Imports.
//
const joi = require('joi')

//
// Generic models.
//
const DefaultLanguageTokenModel = joi.string().default(module.context.configuration.language)
const StringModel = joi.string().required()
const LevelsModel = joi.number().integer().greater(0).required()
const TreeModel = joi.array().items(joi.object({
	property: {
		predicate: joi.array().items("sub-properties or one single structure data type.")
	}
}))
const ArrayModel = joi.array().items(joi.any())
const StringArrayModel = joi.array().items(joi.string())
const TermsArrayModel = joi.array().items(joi.object({
	_key: joi.string(),
	_code: joi.object(),
	_info: joi.object()
}))
const GraphPathsModel = joi.array().items(joi.object({
	vertices: joi.array().items(TermsArrayModel),
	edges: joi.array().items(joi.object()),
	weights: joi.array().items(joi.number())
}))
const AddChildrenProperties = joi.object({
	parent: joi.string().required(),
	items: joi.array().items(joi.string()).required()
})
const AddChildren = joi.object({
	root: joi.string().required(),
	parent: joi.string().required(),
	items: joi.array().items(joi.string()).required()
})
const AddChildrenResponse = joi.object({
	inserted: joi.number(),
	updated: joi.number(),
	existing: joi.number()
})
const DescriptorQualifications = joi.object({
	classes: joi.array().items(joi.string()),
	domains: joi.array().items(joi.string()),
	tags: joi.array().items(joi.string()),
	subjects: joi.array().items(joi.string())
})


module.exports = {
	DefaultLanguageTokenModel,
	StringModel,
	LevelsModel,
	TreeModel,
	ArrayModel,
	StringArrayModel,
	TermsArrayModel,
	GraphPathsModel,
	AddChildrenProperties,
	AddChildren,
	AddChildrenResponse,
	DescriptorQualifications
}
