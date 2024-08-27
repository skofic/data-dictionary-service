'use strict'

//
// Imports.
//
const joi = require('joi')

///
// Generic object models.
///

// Term model to be inserted.
const TermModel = joi.object({
	_code: joi.object({
		_nid: joi.string().allow(''),
		_lid: joi.string().required(),
		_gid: joi.string(),
		_aid: joi.array().items(joi.string()),
		_pid: joi.array().items(joi.string()),
		_name: joi.string()
	}).required(),
	_info: joi.object({
		_title: joi.object().required(),
		_definition: joi.object(),
		_description: joi.object(),
		_examples: joi.object(),
		_notes: joi.object(),
		_provider: joi.string()
	}).required(),
	_data: joi.object(),
	_rule: joi.object()
})

// Term model that was saved.
const TermInsertedModel = joi.object({
	_id: joi.string().required(),
	_key: joi.string().required(),
	_rev: joi.string().required(),
	_code: joi.object({
		_nid: joi.string().allow(''),
		_lid: joi.string().required(),
		_gid: joi.string(),
		_aid: joi.array().items(joi.string()),
		_pid: joi.array().items(joi.string()),
		_name: joi.string()
	}).required(),
	_info: joi.object({
		_title: joi.object().required(),
		_definition: joi.object(),
		_description: joi.object(),
		_examples: joi.object(),
		_notes: joi.object(),
		_provider: joi.string()
	}).required(),
	_data: joi.object(),
	_rule: joi.object()
})

// Array of terms to be inserted model.
const TermsArrayModel = joi.array()
	.items(TermModel)

// Array of inserted terms model.
const TermsInsertedArrayModel = joi.array()
	.items(TermInsertedModel)

// Graph traversal result model.
const GraphPathsModel = joi.array()
	.items(
		joi.object({
			vertices: joi.array().items(TermsArrayModel),
			edges: joi.array().items(joi.object()),
			weights: joi.array().items(joi.number())
		})
	)

// Default language enum.
const DefaultLanguageTokenModel = joi.string()
	.default(
		module.context.configuration.language
	)


///
// Report models.
///

// Object providing resolved values changes in service reports.
const ReportChanges =
	joi.object({
		changes: joi.object({
			"<hash>": joi.object({
				field: joi.string().required(),
				original: joi.any().required(),
				resolved: joi.any().required()
			}).required()
		})
	})

// Object providing status report in service reports.
const ReportStatus =
	joi.object({
		status: joi.object({
			status: joi.number().default(0),
			message: joi.string().required()
		}).required()
	})


//
// Generic models.
//

// Generic array model.
const ArrayModel = joi.array()
	.items(
		joi.any()
	)

// Genetic string array model.
const StringArrayModel = joi.array()
	.items(
		joi.string()
	)

// Generic required string model.
const StringModel = joi.string()
	.required()

// Maximum graph tree depth level.
const LevelsModel = joi.number()
	.integer()
	.greater(0)
	.required()

// Enumeration tree result model.
const TreeModel = joi.array()
	.items(
		joi.object({
			property: {
				predicate: joi.array().items("sub-properties or one single structure data type.")
			}
		})
	)

// Graph insertion elements: root, parent and items to insert.
const AddChildren = joi.object({
	root: joi.string().required(),
	parent: joi.string().required(),
	items: joi.array().items(joi.string()).required()
})

// Structure to add child properties to an object.
const AddChildrenProperties = joi.object({
	parent: joi.string().required(),
	items: joi.array().items(joi.string()).required()
})

// Add elements to graph response.
const AddChildrenResponse = joi.object({
	inserted: joi.number(),
	updated: joi.number(),
	existing: joi.number()
})

// Descriptor qualification statistics.
const DescriptorQualifications = joi.object({
	classes: joi.array().items(joi.string()),
	domains: joi.array().items(joi.string()),
	tags: joi.array().items(joi.string()),
	subjects: joi.array().items(joi.string())
})


module.exports = {
	TermModel,
	TermInsertedModel,
	
	TermsArrayModel,
	TermsInsertedArrayModel,
	
	GraphPathsModel,
	DefaultLanguageTokenModel,
	
	ReportChanges,
	ReportStatus,
	
	ArrayModel,
	StringArrayModel,
	StringModel,
	LevelsModel,
	TreeModel,
	AddChildrenProperties,
	AddChildren,
	AddChildrenResponse,
	DescriptorQualifications
}
