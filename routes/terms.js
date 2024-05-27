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
const Validation = require("../utils/validation")

//
// Models.
//
const Models = require('../models/generic_models')
const ErrorModel = require("../models/error_generic")
const TermInsert = require('../models/term_insert')
const TermsInsert = require('../models/terms_insert')
const TermDisplay = require('../models/term_display')
const TermSelection = require('../models/term_selection')
const {isObject} = require("../utils/utils");
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


//
// Services.
//

router.post(
	'insert',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doInsertTerm(request, response)
		}
	},
	'term-insert'
)
	.summary('Create term')
	.description(dd
		`
            **Create a term**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to create a new term of any kind: descriptor, structure type, \
            namespace and all other types of terms.
            
            You provide the term in the request body, the service will validate the entry \
            and, if correct, will insert the record.
        `
	)
	.body(TermInsert, dd
		`
            **Service parameters**
            
            The service body expects the term object.
            
            It is required to have at least the \`_code\` and \`_info\` data blocks.
            
            The \`_code\` block is required to have at least the \`_lid\`. \
            The global identifier will be set, and overwritten, by the service. \
            The list of official identifiers will also be set if missing.
            
            The \`_info\` block requires the \`_title\` and \`_definition\` properties, \
            the other properties are only provided as placeholders, delete them if not needed. \
            Remember that all elements, except \`_provider\`, are dictionaries with the language \
            code as the dictionary key and the text as the dictionary value, you will have to \
            provide by default the entry in the default language (\`language\` entry in the service settings).
            
            The \`_data\` section and the \`_rule\` section are provided as placeholders, \
            delete them if not needed. You are responsible for their contents.
            
            The document key will be automatically set, and overwritten, by the service.
            
            *Be aware that if you provide a local identifier in an enumeration field, \
            the service will attempt to resolve it into a global identifier*.
         `
	)
	.response(200, joi.object(), dd
		`
            **Inserted term**
            
            The service will return the newly inserted term.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided term is invalid:
            - Parameter error: if the error is caught at the level of the parameter, \
              the service will return a standard error.
            - Validation error: if it is a validation error, the service will return an \
              object with two properties: \`report\` will contain the status report and \
              \`value\` will contain the provided term.
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
	.response(409, ErrorModel, dd
		`
            **Term exists**
            
            The service will return this code if the term matches an already existing entry.
        `
	)

router.post(
	'insert/many',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doInsertTerms(request, response)
		}
	},
	'terms-insert'
)
	.summary('Create terms')
	.description(dd
		`
            **Create a list of terms**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to create a list of new terms.
            
            You provide an array of term objects in the request body, the service will validate \
            the elements of the list and, if all are correct, it will insert all the the records.
            
            When inserting the records, the operation is executed transactionally \
            in an all-or-nothing fashion.
        `
	)
	.body(TermsInsert, dd
		`
            **Service parameters**
            
            The service body expects an array of term objects.
            
            It is required to have at least the \`_code\` and \`_info\` data blocks.
            
            The \`_code\` block is required to have at least the \`_lid\`. \
            The global identifier will be set, and overwritten, by the service. \
            The list of official identifiers will also be set if missing.
            
            The \`_info\` block requires the \`_title\` and \`_definition\` properties, \
            the other properties are only provided as placeholders, delete them if not needed. \
            Remember that all elements, except \`_provider\`, are dictionaries with the language \
            code as the dictionary key and the text as the dictionary value, you will have to \
            provide by default the entry in the default language (\`language\` entry in the service settings).
            
            The \`_data\` section and the \`_rule\` section are provided as placeholders, \
            delete them if not needed. You are responsible for their contents.
            
            The document key will be automatically set, and overwritten, by the service.
            
            *Be aware that if you provide a local identifier in an enumeration field, \
            the service will attempt to resolve it into a global identifier*.
       `
	)
	.response(200, joi.array().items(joi.object()), dd
		`
            **Inserted terms**
            
            The service will return the newly inserted terms.
        `
	)
	.response(400, joi.array().items(joi.object()), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided term is invalid:
            - Parameter error: if the error is caught at the level of the parameter, \
              the service will return a standard error. Note that the service will exit \
              on the first error.
            - Validation error: in this case the service will return an object that will \
              contain a property \`errors\`, an array of objects holding the value of the \
              invalid term in a property called \`value\` and the status in a \`status\` \
              property. The provided object may also contain a \`valid\` array property \
              with the valid terms and a \`warnings\` array property containing all terms \
              whose enumerations have been resolved and modified by the validation process.
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
	.response(409, ErrorModel, dd
		`
            **Term exists**
            
            The service will return this code if the term matches an already existing entry.
        `
	)

/**
 * Get term by key
 * This service will return the term corresponding to the provided key.
 */
router.get(
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doGetTermByKey(request, response)
		}
	},
	'term-key'
)
	.summary('Term by key')
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
	.queryParam('key', keySchema, "Term global identifier")
	.queryParam('lang', Models.DefaultLanguageTokenModel, "Language code, or @ for all languages.")
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
 * Get terms dictionary
 * This service can be used to retrieve a dictionary of terms.
 */
router.post(
	'dict/:lang',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doDictionaryTerms(request, response)
		}
	},
	'term-dictionary'
)
	.summary('Get terms dictionary')
	.description(dd
		`
            **Get a dictionary of terms**
             
            ***In order to use this service, the current user must have the \`read\` role.***
             
            This service can be used to retrieve a dictionary of terms. Provide an array of term \
            keys and the service will return a key/value dictionary in which the keys will be the \
            provided keys and the values will be the found term objects.
             
             The service expects a parameter, \`lang\`, which represents the language code in which \
             you want the term descriptions returned. To return all available languages pass \`@\`.
        `
	)
	.pathParam('lang', Models.DefaultLanguageTokenModel, "Language code, or @ for all languages.")
	.body(joi.array().items(joi.string()).required(), dd
		`
            **Service parameters**
            
            The service body expects an array of term global identifiers.
       `
	)
	.response(200, joi.object(), dd
		`
            **Terms dictionary**
            
            The service will return a dictionary featuring the term key as the dictionary key \
            and the term object as the dictionary value. Unmatched term keys will have a value of \`null\`.
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

/**
 * Get list of term keys
 * This service can be used to get a selected list of term keys.
 */
router.post(
	'key',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doSelectTermKeys(request, response)
		}
	},
	'term-key-list'
)
	.summary('Query term keys')
	.description(dd
		`
            **Get a list of term keys**
             
            ***In order to use this service, the current user must have the \`read\` role.***
             
            This service can be used to retrieve a list of term keys according to a selection criteria. \
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
            
            To search for the first 10 descriptors that have a namespace that starts with \`iso\` \
            you can enter:
            \`{"start": 0, "limit": 10, "term_type": "descriptor", "_nid": "iso%"}\`
            
            To search for the first 10 terms whose title is \`Italy\` in English and \`Italia\` in Italian \
            you can enter:
            \`{"start": 0, "limit": 10, "_title": {"iso_639_3_eng": "Italy", "iso_639_3_ita": "Italia"}}\`
            
            To search for the first 10 terms whose definition contain \`Republic\` in English you can enter:
            \`{"start": 0, "limit": 10, "_definition": {"iso_639_3_eng": "%Republic%"}}\`
            
            To search for the first 10 scalar descriptors whose values must be elements of the \
            \`geo_datum\` controlled vocabulary, you can enter:
            \`{"start": 0, "limit": 10, "_data": ["_scalar"], "_type": ["_type_string_enum"], "_kind": ["geo_datum"]}\`
        `
	)
	.body(TermSelection, dd
		`
            **Service parameters**
            
            The service body expects an object with the following properties:
            - \`term_type\`: Set \`descriptor\` or \`structure\`.
            - \`_nid\`: The namespace global ientifier (*string*).
            - \`_lid\`: The term local ientifier (*string*).
            - \`_gid\`: The term global ientifier (*string*).
            - \`_aid\`: List of local identifiers, any match counts.
            - \`_title\`: An object whose property name must be a language code and whose value \
              is a pattern that should match the term title in that language (*string*). \
              You can add more language codes if you want.
            - \`_definition\`: An object whose property name must be a language code and whose value \
              is a pattern that should match the term definition in that language (*string*). \
              You can add more language codes if you want.
            - \`_data\`: A list of data shapes, \`_scalar\`, \`_array\`, \`_set\` and \`_dict\` \
              are the allowed values. Any match selects.
            - \`_type\`: A list of data types, if \`_scalar\` was indicated in \`_data\`.
            - \`_kind\`: A list of data types, if \`_scalar\` was indicated in \`_data\`.
            
            For all *string* fields the supported wildcards are \`_\` to match a single arbitrary character, \
            and \`%\` to match any number of arbitrary characters. Literal % and _ need to be escaped \
            with a backslash. Backslashes need to be escaped themselves.
            
            Any selector can be omitted, except \`start\` and \`limit\`.
        `
	)
	.response(200, Models.StringArrayModel, dd
		`
            **List of term keys**
            
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

/**
 * Get list of terms
 * This service can be used to get a selected list of terms.
 */
router.post(
	':lang',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doSelectTerms(request, response)
		}
	},
	'term-list'
)
	.summary('Query terms')
	.description(dd
		`
            **Get a list of terms**
             
            ***In order to use this service, the current user must have the \`read\` role.***
             
            This service can be used to retrieve a list of terms according to a selection criteria. \
            This service will not by all means replace AQL queries, but it may be useful for some \
            limited uses.
            
            You should pass the desired language in the path parameter: the titles and descriptions \
            of the terms will be returned in that language, or they will be returned unaltered if \
            the language code doesn't match any entry, or if you provide \`@\`.
            
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
            
            To search for the first 10 descriptors that have a namespace that starts with \`iso\` \
            you can enter:
            \`{"start": 0, "limit": 10, "term_type": "descriptor", "_nid": "iso%"}\`
            
            To search for the first 10 terms whose title is \`Italy\` in English and \`Italia\` in Italian \
            you can enter:
            \`{"start": 0, "limit": 10, "_title": {"iso_639_3_eng": "Italy", "iso_639_3_ita": "Italia"}}\`
            Try setting the language code parameter to French (\`iso_639_3_fra\`).
            
            To search for the first 10 terms whose definition contain \`Republic\` in English you can enter:
            \`{"start": 0, "limit": 10, "_definition": {"iso_639_3_eng": "%Republic%"}}\`
            
            To search for the first 10 scalar descriptors whose values must be elements of the \
            \`geo_datum\` controlled vocabulary, you can enter:
            \`{"start": 0, "limit": 10, "_data": ["_scalar"], "_type": ["_type_string_enum"], "_kind": ["geo_datum"]}\`
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
            - \`_title\`: An object whose property name must be a language code and whose value \
              is a pattern that should match the term title in that language (*string*). \
              You can add more language codes if you want.
            - \`_definition\`: An object whose property name must be a language code and whose value \
              is a pattern that should match the term definition in that language (*string*). \
              You can add more language codes if you want.
            - \`_data\`: A list of data shapes, \`_scalar\`, \`_array\`, \`_set\` and \`_dict\` \
              are the allowed values. Any match selects.
            - \`_type\`: A list of data types, if \`_scalar\` was indicated in \`_data\`.
            - \`_kind\`: A list of data types, if \`_scalar\` was indicated in \`_data\`.
            
            For all *string* fields the supported wildcards are \`_\` to match a single arbitrary character, \
            and \`%\` to match any number of arbitrary characters. Literal % and _ need to be escaped \
            with a backslash. Backslashes need to be escaped themselves.
            
            Any selector can be omitted, except \`start\` and \`limit\`.
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

/**
 * Update term
 * This service can be used to update a term.
 */
router.patch(
	':key',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doUpdateTerm(request, response)
		}
	},
	'term-update'
)
	.summary('Update term')
	.description(dd
		`
            **Update a term**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to update a term. You provide the term key in the URL and the fields \
            to be updated in the request body.
            
            The service will return the updated term object.
        `
	)
	.pathParam('key', Models.StringModel, "Term key")
	.body(joi.object(), dd
		`
            **Service parameters**
            
            The body should contain an object holding the properties that will be updated. \
            The following rules will be followed:
            - To delete a field pass \`null\`.
            - Arrays must be provided complete.
            - Objects are merged: object properties are added or replaced.
        `
	)
	.response(200, joi.object(), dd
		`
            **Updated term**
            
            The service will return the updated term object.
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
 * Insert term.
 * @param request: API request.
 * @param response: API response.
 */
function doInsertTerm(request, response)
{
	//
	// Init local storage.
	//
	const term = request.body

	//
	// Init code section.
	//
	insertTermPrepareCode(term, request, response)

	//
	// Check information section.
	//
	if (!insertTermCheckInfo(term, request, response)) {
		return                                                                  // ==>
	}

	//
	// Validate object.
	//
	const report = Validation.checkObject(term)

	//
	// Clean report.
	//
	for(const item of Object.keys(report)) {
		if(report[item].status.code === 0 || report[item].status.code === 1) {
			delete report[item]
		}
	}

	//
	// Handle errors.
	//
	if(Object.keys(report).length > 0) {
		response.status(400)
		response.send({ report: report, value: term })                          // ==>
	}

		//
		// Save term.
	//
	else {
		try
		{
			//
			// Insert.
			//
			const meta = collection.save(term)

			response.send(Object.assign(meta, term))                            // ==>
		}
		catch (error)
		{
			//
			// Duplicate record
			if(error.isArangoError && error.errorNum === ARANGO_DUPLICATE) {
				response.throw(
					409,
					K.error.kMSG_ERROR_DUPLICATE.message[module.context.configuration.language]
				)                                                               // ==>
			}
			else {
				response.throw(500, error.message)                          // ==>
			}
		}
	}

} // doInsertTerm()

/**
 * Insert terms.
 * @param request: API request.
 * @param response: API response.
 */
function doInsertTerms(request, response)
{
	//
	// Init local storage.
	//
	let terms = request.body

	//
	// Prepare code section and assert default language in info section.
	//
	terms.forEach(
		term =>
		{
			//
			// Init code section.
			//
			insertTermPrepareCode(term, request, response)

			//
			// Check information section.
			//
			if (!insertTermCheckInfo(term, request, response)) {
				return                                                          // ==>
			}
		}
	)

	//
	// Validate terms.
	//
	const report = Validation.checkObjects(terms)
	if(report.hasOwnProperty('errors')) {
		response.status(400)
		response.send(report)

		return                                                                  // ==>
	}

	//
	// Save term.
	//
	try
	{
		//
		// Insert in transaction.
		//
		const result =
			K.db._query( aql`
            FOR term IN ${terms}
                INSERT term INTO ${collection}
                OPTIONS {
                    keepNull: false,
                    overwriteMode: "conflict"
                }
            RETURN NEW
        `).toArray()

		response.send(result)                                                   // ==>
	}
	catch (error)
	{
		response.throw(500, error.message)                                  // ==>
	}

} // doInsertTerms()

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
		const term = collection.document(request.queryParams.key)

		//
		// Select language.
		//
		if(request.queryParams.lang !== '@') {
			Utils.termLanguage(term, request.queryParams.lang)
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
 * Get term by key.
 * @param request: API request.
 * @param response: API response.
 */
function doDictionaryTerms(request, response)
{
	//
	// Try query.
	//
	try
	{
		//
		// Get term.
		//
		const terms = collection.documents(request.body)

		//
		// Select language.
		//
		if(request.pathParams.lang !== '@') {
			for(let i = 0; i < terms.documents.length; i++) {
				Utils.termLanguage(terms.documents[i], request.pathParams.lang)
			}
		}

		//
		// Build dictionary.
		//
		let result = {}
		request.body.forEach(key => { result[key] = null })
		terms.documents.forEach(term => { result[term._key] = term})

		response.send(result)                                                   // ==>
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

} // doDictionaryTerms()

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
	const query = termsSelectionQuery(request, response)

	//
	// Close query.
	//
	query.push(aql`RETURN item`)

	//
	// Perform query.
	//
	const result = K.db._query(aql.join(query)).toArray()

	//
	// Handle output language.
	// Note that
	//
	if(request.pathParams.lang !== '@') {
		for(let i = 0; i < result.length; i++) {
			Utils.termLanguage(result[i], request.pathParams.lang)
		}
	}

	response.send(result)                                                       // ==>

} // doSelectTerms()

/**
 * Get term keys list.
 * @param request: API request.
 * @param response: API response.
 */
function doSelectTermKeys(request, response)
{
	//
	// Init local storage.
	//
	const query = termsSelectionQuery(request, response)

	//
	// Close query.
	//
	query.push(aql`RETURN item._key`)

	//
	// Perform query.
	//
	const result = K.db._query(aql.join(query)).toArray()

	response.send(result)                                                       // ==>

} // doSelectTermKeys()

/**
 * Update term.
 * @param request: API request.
 * @param response: API response.
 */
function doUpdateTerm(request, response)
{
	//
	// Init local storage.
	//
	let original = {}

	//
	// Load old record.
	//
	try {
		original = JSON.parse(JSON.stringify(collection.document(request.pathParams.key)))

	} catch (error) {
		if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			response.throw(
				HTTP_NOT_FOUND,
				K.error.kMSG_TERM_NOT_FOUND.message[module.context.configuration.language]
			)                                                                   // ==>
		}
		else {
			response.throw(500, error.message)                               // ==>
		}
	}

	//
	// Update properties.
	//
	const updated = mergeObjects(original, request.body)

	//
	// Validate changes.
	//
	const result = Validation.validateTermChanges(original, updated)
	if(Object.keys(result).length > 0) {
		response.status(400)
		response.send({
			status: K.error.kMSG_BAD_TERM_UPDATE.message[module.context.configuration.language],
			data: result
		})
		return                                                                  // ==>
	}

	//
	// Validate object.
	//
	const report = Validation.checkObject(updated)

	//
	// Clean report.
	//
	for(const item of Object.keys(report)) {
		if(report[item].status.code === 0 || report[item].status.code === 1) {
			delete report[item]
		}
	}

	//
	// Handle errors.
	//
	if(Object.keys(report).length > 0) {
		response.status(400)
		response.send({ report: report, value: original })                     // ==>
	}

		//
		// Save term.
	//
	else {
		try
		{
			//
			// Replace term.
			//
			const result =
				K.db._query( aql`
					REPLACE ${updated} IN ${collection}
					OPTIONS { ignoreRevs: false }
					RETURN NEW
                `)

			response.send({
				status: "OK", //K.error.kMSG_OK.message[module.context.configuration.language],
				data: result._documents[0]
			})                                                                  // ==>
		}
		catch (error)
		{
			//
			// Duplicate record
			if(error.isArangoError && error.errorNum === ARANGO_DUPLICATE) {
				response.throw(
					409,
					K.error.kMSG_ERROR_CONFLICT.message[module.context.configuration.language]
				)                                                               // ==>
			}
			else {
				response.throw(500, error.message)                           // ==>
			}
		}
	}

} // doUpdateTerm()


//
// Utility functions.
//

/**
 * Prepare terms selection query.
 * @param request: API request.
 * @param response: API response.
 * @return {Array<Aql>}: Query elements.
 */
function termsSelectionQuery(request, response)
{
	//
	// Init local storage.
	//
	const query = [aql`FOR item IN ${collection}`]

	//
	// Term type.
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
	// Term scalar codes.
	//
	for(const tok of ['_nid', '_lid', '_gid']) {
		if(request.body.hasOwnProperty(tok)) {
			query.push(aql`FILTER item._code.${tok} LIKE ${request.body[tok]}`)
		}
	}

	//
	// List of official codes.
	//
	if(request.body.hasOwnProperty('_aid')) {
		query.push(aql`FILTER item._code._aid ANY IN ${request.body._aid}`)
	}

	//
	// Term descriptions.
	//
	for(const tok of ['_title', '_definition']) {
		if(request.body.hasOwnProperty(tok)) {
			for(const [key, value] of Object.entries(request.body[tok])) {
				query.push(aql`FILTER item._info.${tok}.${key} LIKE ${value}`)
			}
		}
	}

	//
	// Descriptor data block.
	//
	if(request.body.hasOwnProperty('_data')) {
		query.push(aql`FILTER ATTRIBUTES(item._data) ANY IN ${request.body._data}`)
	}

	//
	// Data type and kind.
	//
	if(request.body.hasOwnProperty('_data') && request.body._data.includes('_scalar')) {
		if(request.body.hasOwnProperty('_type')) {
			query.push(aql`FILTER item._data._scalar._type IN ${request.body._type}`)
		}

		if(request.body.hasOwnProperty('_kind')) {
			query.push(aql`FILTER item._data._scalar._kind ANY IN ${request.body._kind}`)
		}
	}

	//
	// Close query.
	//
	query.push(aql`SORT item._key ASC`)
	query.push(aql`LIMIT ${request.body.start}, ${request.body.limit}`)

	return query                                                                // ==>

} // termsSelectionQuery()

/**
 * Prepare term code section.
 * @param term: The term object.
 * @param request: API request.
 * @param response: API response.
 */
function insertTermPrepareCode(term, request, response)
{
	//
	// Init code section.
	//
	if(term.hasOwnProperty('_code')) {

		//
		// Set global identifier.
		//
		if(term._code.hasOwnProperty('_nid')) {
			term._code['_gid'] = `${term._code._nid}${K.token.ns}${term._code._lid}`
		} else {
			term._code['_gid'] = term._code._lid
		}

		//
		// Set key.
		//
		term._key = term._code._gid

		//
		// Set official codes.
		//
		if(term._code.hasOwnProperty('_aid')) {
			if(!term._code._aid.includes(term._code._lid)) {
				term._code._aid.push(term._code._lid)
			}
		} else {
			term._code['_aid'] = [term._code._lid]
		}
	}

} // insertTermPrepareCode()

/**
 * Check term info section.
 * @param term: Term object.
 * @param request: API request.
 * @param response: API response.
 * @return {Boolean}: `true` means correct, `false` means error: bail out.
 */
function insertTermCheckInfo(term, request, response)
{
	//
	// Check information section.
	//
	if(term.hasOwnProperty('_info')) {

		//
		// Assert descriptions have the default language.
		//
		for(const field of ['_title', '_definition', '_description', '_examples', '_notes']) {
			if(term._info.hasOwnProperty(field)) {
				if(!term._info[field].hasOwnProperty(module.context.configuration.language)) {
					let message = K.error.kMSG_ERROR_MISSING_DEF_LANG.message[module.context.configuration.language]
					message += ` [term: ${term._key}]`
					response.throw(400, message)

					return false                                                // ==>
				}
			}
		}
	}

	return true                                                                 // ==>

} // insertTermCheckInfo()

/**
 * Merge two objects
 * The updated properties will be added or replace corresponding properties in the target.
 * Updated properties with a null value will be removed from the target if there.
 * @param theTarget {Object}: The original object.
 * @param theUpdates {Object}: The updated properties.
 * @return {Object}: The merged object.
 */
function mergeObjects(theTarget = {}, theUpdates = {})
{
	//
	// Ensure both are objects.
	//
	if(isObject(theTarget) && isObject(theUpdates)) {

		//
		// Clone both objects.
		//
		const copyTarget = JSON.parse(JSON.stringify(theTarget))
		const copyUpdates = JSON.parse(JSON.stringify(theUpdates))

		//
		// Iterate properties to be applied.
		//
		Object.keys(copyUpdates).forEach(key => {

			//
			// Remove property.
			//
			if(copyUpdates[key] === null) {
				if(copyTarget.hasOwnProperty(key)) {
					delete copyTarget[key]
				}
			}

				//
				// Recurse objects.
			//
			else {
				copyTarget[key] = (isObject(copyUpdates[key]))
					? mergeObjects(copyTarget[key], copyUpdates[key])
					: copyUpdates[key]
			}
		})

		return copyTarget                                                       // ==>

	}

	return theTarget                                                            // ==>

} // mergeObjects()
