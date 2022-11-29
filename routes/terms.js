'use strict'

//
// Includes.
//
const joi = require('joi')
const dd = require('dedent')
const status = require('statuses')
const aql = require('@arangodb').aql
const httpError = require('http-errors')
const errors = require('@arangodb').errors
const createRouter = require('@arangodb/foxx/router')

//
// Application includes.
//
const K = require("../utils/constants")
const Utils = require('../utils/utils')
const Session = require('../utils/sessions')
const Dictionary = require("../utils/dictionary")

//
// Models.
//
const Models = require('../models/generic_models')
const ErrorModel = require("../models/error_generic")
const TermDisplay = require('../models/term_display')
const TermSelection = require('../models/term_selection')
const UserResetModel = require("../models/user_reset");
const {TermsArrayModel} = require("../models/generic_models");
const keySchema = joi.string().required()
	.description('The key of the document')

//
// Collections.
//
const collection = K.db._collection(K.collection.term.name)

//
// Constants.
//
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code
const HTTP_NOT_FOUND = status('not found')
const HTTP_CONFLICT = status('conflict')

//
// Create router.
//
const router = createRouter()
module.exports = router
router.tag('Terms')

/**
 * Get term by key
 * This service will return the term corresponding to the provided key.
 */
router.get(
	':key/:lang',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doGetTermByKey(request, response)
		}
	},
	'term-key'
)
	.summary('Get term by key')
	.description(dd
		`
            **Get a term by key**
            
            *Use this service to get a specific term.*
            
             ***In order to use this service, the current user must have the \`read\` role.***
             
             The service expects two parameters:
             - *key*: It represents the term \`_key\`, or global identifier.
             - *lang*: The language code for the description texts; \
             the field will be set with the default language, or pass \`@\` to get the result \
             in all languages.
             
             Try providing \`iso_639_3_eng\` in the *key* parameter: you will get the \
             English language ISO entry with names in English.
             Try providing \`iso_639_3_eng\` in the *key* parameter and \`@\` in the language parameter: \
             you will get the English language ISO entry with names in all available languages.
        `
	)
	.pathParam('key', keySchema, "Term global identifier")
	.pathParam('lang', Models.DefaultLanguageTokenModel, "Language code, or @ for all languages.")
	.response(200, TermDisplay, dd
		`
            **Term record**
            
            The service will return the matched term.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not a dictionary user.
        `
	)
	.response(404, ErrorModel, dd
		`
            **Term not found**
            
            The provided key does not match any terms.
        `
	)

/**
 * Get list of terms
 * This service can be used to get a selected list of terms.
 */
router.post(
	':lang',
	(request, response) => {
		const roles = [K.environment.role.admin]
		if(Session.hasPermission(request, response, roles)) {
			doSelectTerms(request, response)
		}
	},
	'term-list'
)
	.summary('List terms')
	.description(dd
		`
            **Get a list of terms**
             
            ***In order to use this service, the current user must have the \`read\` role.***
             
            This service can be used to retrieve a list of terms according to a selection criteria. \
            This service will not by all means replace AQL queries, but it may be useful for some \
            limited uses.
            
            The request body contains an object that can be used to select from a set of properties:
            - \`start\`: Start position in results.
            - \`limit\`: Number of elements to be returned.
            - \`term_type\`: Select descriptors, structure types or any.
            - \`_nid\`: Term namespace.
            - \`_lid\`: Term local identifier.
            - \`_gid\`: Term global identifier.
            - \`_aid\`: Extended local identifiers.
            - \`_title\`: Term label or title.
            - \`_definition\`: Term definition.
            - \`_data\`: The data shape, for descriptors.
            - \`_type\`: The data tupe, for scalar descriptors.
            - \`_kind\`: The data kind for scalar descriptors.
        `
	)
	.pathParam('lang', Models.DefaultLanguageTokenModel, "Language code, @ for all languages")
	.body(TermSelection, dd
		`
            **Service parameters**
            
            The service body expects an object with the following properties:
            - \`term_type\`: Set \`descriptor\` or \`structure\`.
            - \`_nid\`: The namespace global ientifier (*string*).
            - \`_lid\`: The term local ientifier (*string*).
            - \`_gid\`: The term global ientifier (*string*).
            - \`_aid\`: List of local identifiers, any match counts.
            - \`_title\`: Title or label (*string*).
            - \`_definition\`: Definition (*string*).
            - \`_data\`: A list of data shapes, \`_scalar\`, \`_array\`, \`_set\` and \`_dict\` \
              are the allowed values. Any match selects.
            - \`_type\`: A list of data types, if \`_scalar\` was indicated in \`_data\`.
            - \`_kind\`: A list of data types, if \`_scalar\` was indicated in \`_data\`.
            
            For all *string* fields the supported wildcards are \`_\` to match a single arbitrary character, \
            and \`%\` to match any number of arbitrary characters. Literal % and _ need to be escaped \
            with a backslash. Backslashes need to be escaped themselves.
            
            Any selector can be omitted, except \`start\` and \`limit\`..
        `
	)
	.response(200, Models.TermsArrayModel, dd
		`
            **List of terms**
            
            The service will return the list of matching terms.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not a dictionary user.
        `
	)


//
// Functions.
//

/**
 * Get term by key.
 * @param request: API request.
 * @param response: API response.
 */
function doGetTermByKey(request, response)
{
	//
	// Try query.
	//
	try
	{
		//
		// Get term.
		//
		const term = collection.document(request.pathParams.key)

		//
		// Select language.
		//
		if(request.pathParams.lang != '@') {
			Utils.termLanguage(term, request.pathParams.lang)
		}

		response.send(term)                                                     // ==>
	}
	catch (error)
	{
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			response.throw(
				404,
				K.error.kMSG_TERM_NOT_FOUND.message[module.context.configuration.language]
			)                                                                   // ==>
		} else {
			response.throw(500, error.message)                               // ==>
		}
	}

} // doGetTermByKey()

/**
 * Get terms list.
 * @param request: API request.
 * @param response: API response.
 */
function doSelectTerms(request, response)
{
	//
	// Init local storage.
	//
	const query = [aql`FOR item IN ${collection}`]

	//
	// Collect filters.
	//
	if(request.body.hasOwnProperty('term_type')) {
		switch(request.body.term_type) {
			case 'descriptor':
				query.push(aql`FILTER HAS(item, '_data')`)
				break;
			case 'structure':
				query.push(aql`FILTER HAS(item, '_rule')`)
				break;
		}
	}

	//
	// Close query.
	//
	query.push(aql`SORT item._key ASC`)
	query.push(aql`LIMIT ${request.body.start}, ${request.body.limit}`)
	query.push(aql`RETURN item._key`)

	//
	// Perform query.
	//
	const result = K.db._query(aql.join(query)).toArray()

	response.send(result)                                                       // ==>

} // doSelectTerms()
