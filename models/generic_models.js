'use strict'

//
// Imports.
//
const joi = require('joi');

//
// Generic models.
//
const DefaultLanguageTokenModel = joi.string().default("@")
const StringModel = joi.string().required()
const StringArrayModel = joi.array().items(joi.string())
const TermsArrayModel = joi.array().items(joi.object({
	_key: joi.string(),
	_code: joi.object(),
	_info: joi.object()
}))
const GraphPathsModel = joi.array().items(joi.object({
	edges: joi.array().items(joi.object()),
	vertices: joi.array().items(TermsArrayModel)
}))


module.exports = {
	DefaultLanguageTokenModel,
	StringModel,
	StringArrayModel,
	TermsArrayModel,
	GraphPathsModel
}