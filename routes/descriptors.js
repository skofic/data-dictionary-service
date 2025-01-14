'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const aql = require('@arangodb').aql
const status = require('statuses')
const httpError = require('http-errors')
const errors = require('@arangodb').errors

//
// Error codes.
//
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

//
// Application constants.
//
const K = require('../utils/constants')
const Session = require('../utils/sessions')
const Dictionary = require("../utils/dictionary");

//
// Models.
//
const Models = require('../models/generic_models')
const ErrorModel = require("../models/error_generic");
const opSchema = joi.string()
	.valid("AND", "OR")
	.default("AND")
	.required()
	.description('Chaining operator for query filters')


//
// Instantiate router.
//
const createRouter = require('@arangodb/foxx/router');
const {db} = require("../utils/constants");
const router = createRouter();
module.exports = router;
router.tag('Descriptors');

//
// Collections.
//
const view_term = db._view(module.context.configuration.viewTerm)
const view_term_reference = {
	isArangoCollection: true,
	name: () => view_term.name()
}


//
// SERVICES
//

/**
 * Return class, domains, tags and subjects of the provided descriptors list.
 *
 * The service expects a list of descriptor global identifiers and will return
 * the list of domains and tags belonging to the provided descriptors.
 *
 * The service will skip any provided term that does not have the _data block.
 */
router.post(
	'qual/keys',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getDescriptorQualificationKeys(request, response)
		}
	},
	'qual-list-keys'
)
	.summary('Get descriptor qualifications')
	.description(dd
		`
            **Get class, domains, tags and subjects**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects a list of descriptor global identifiers and will return \
            the list of classes, domains, tags and subjects associated with the provided \
            descriptors list.
            
            The service will skip any element of the provided list that does not have \
            the _data block.
        `
	)
	.body(Models.StringArrayModel, dd
		`
            **Descriptors list**
            
            Provide a list of descriptor term global identifiers.
        `
	)
	.response(200, Models.DescriptorQualifications, dd
		`
            **Qualifications record**
            
            The service will return a dictionary whose keys correspond to the descriptor \
            qualification properties whose the values represent the aggregated qualifications.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No user registered**
            
            There is no active session.
        `
	)
	.response(403, ErrorModel, dd
		`
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
	)

/**
 * Query descriptors.
 *
 * The service will query descriptors according to the provided selection criteria
 * and return the list of matching descriptor global identifiers.
 */
router.post(
	'query/keys',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getDescriptorQueryKeys(request, response)
		}
	},
	'query-list-keys'
)
	.summary('Query descriptor keys')
	.description(dd
		`
            **Query descriptor qualifications**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service allows selecting the dictionary descriptors matching the provided \
            selection criteria, it will return a list of term global identifiers.
        `
	)
	.queryParam('op', opSchema)
	.body(Models.DescriptorsQuery, dd
		`
            The service body expects an object with the following properties:
            
            - \`start\`: Start position in results, provide an integer greater or equal to 0. This property is required.
            - \`limit\`: Number of elements to be returned, provide an integer. This property is required.
            - \`_subject\`: Provide the list of *subject* enumerations to match.
            - \`_class\`: Provide the list of *class* enumerations to match.
            - \`_domain\`: Provide the list of *domain* enumerations to match.
            - \`_list\`: Provide the selection of *list* enumerations to match.
            - \`_tag\`: Provide the list of *tag* enumerations to match.
            
            The first two properties are required, if you want to ignore any of the other \
            properties, do not include them.
        `
	)
	.response(200, Models.ArrayModel, dd
		`
            **Term keys**
            
            The service will return the list of term keys that match the provided selection.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No user registered**
            
            There is no active session.
        `
	)
	.response(403, ErrorModel, dd
		`
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
	)

/**
 * Query descriptors.
 *
 * The service will query descriptors according to the provided selection criteria
 * and return the list of matching descriptor terms.
 */
router.post(
	'query/terms',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getDescriptorQueryTerms(request, response)
		}
	},
	'query-list-terms'
)
	.summary('Query descriptor terms')
	.description(dd
		`
            **Query descriptor qualifications**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service allows selecting the dictionary descriptors matching the provided \
            selection criteria, it will return a list of term records.
        `
	)
	.queryParam('op', opSchema)
	.body(Models.DescriptorsQuery, dd
		`
            The service body expects an object with the following properties:
            
            - \`start\`: Start position in results, provide an integer greater or equal to 0. This property is required.
            - \`limit\`: Number of elements to be returned, provide an integer. This property is required.
            - \`_subject\`: Provide the list of *subject* enumerations to match.
            - \`_class\`: Provide the list of *class* enumerations to match.
            - \`_domain\`: Provide the list of *domain* enumerations to match.
            - \`_list\`: Provide the selection of *list* enumerations to match.
            - \`_tag\`: Provide the list of *tag* enumerations to match.
            
            The first two properties are required, if you want to ignore any of the other \
            properties, do not include them.
        `
	)
	.response(200, joi.object(), dd
		`
            **Term records**
            
            The service will return the list of term records that match the provided selection.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No user registered**
            
            There is no active session.
        `
	)
	.response(403, ErrorModel, dd
		`
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
	)


//
// Functions.
//

/**
 * Get descriptor qualification keys.
 * @param request: API request.
 * @param response: API response.
 */
function getDescriptorQualificationKeys(request, response)
{
	//
	// Get descriptors.
	//
	const descriptors = request.body
	
	//
	// Get qualifications.
	//
	try {
		const result = Dictionary.getDescriptorQualificationKeys(descriptors)
		response.send(result)                                                   // ==>
	} catch (error) {
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, `Term ${descriptor} not found`)     // ==>
		}
		throw error
	}
	
} // getDescriptorQualificationKeys()

/**
 * Get descriptor query keys.
 * @param request: API request.
 * @param response: API response.
 */
function getDescriptorQueryKeys(request, response)
{
	///
	// Get chain operator.
	///
	const op = request.queryParams.op
	const body = request.body
	
	///
	// Get query filters.
	//
	const filters = descriptorQueryFilters(request, response)
	if(filters.length === 0) {
		return []                                                               // ==>
	}
	
	///
	// Build filters block.
	///
	const query = aql`
		FOR doc IN ${view_term_reference}
			SEARCH ${aql.join(filters, ` ${op} `)}
			LIMIT ${body.start}, ${body.limit}
		RETURN doc._key
	`
	
	///
	// Query.
	///
	const result = db._query(query).toArray()
	response.send(result)                                               // ==>
	
} // getDescriptorQueryKeys()

/**
 * Get descriptor query terms.
 * @param request: API request.
 * @param response: API response.
 */
function getDescriptorQueryTerms(request, response)
{
	///
	// Get chain operator.
	///
	const op = request.queryParams.op
	const body = request.body
	
	///
	// Get query filters.
	//
	const filters = descriptorQueryFilters(request, response)
	if(filters.length === 0) {
		return []                                                               // ==>
	}
	
	///
	// Build filters block.
	///
	const query = aql`
		FOR doc IN ${view_term_reference}
			SEARCH ${aql.join(filters, ` ${op} `)}
			LIMIT ${body.start}, ${body.limit}
		RETURN doc
	`
	
	///
	// Query.
	///
	const result = db._query(query).toArray()
	response.send(result)                                               // ==>
	
} // getDescriptorQueryTerms()


//
// Utilities.
//

/**
 * Return dataset query filters.
 *
 * This function will return the list of filters needed to query datasets.
 *
 * @param request {Object}: Service request.
 * @param response {Object}: Service response.
 * @returns {[String]}: Array of AQL filter conditions.
 */
function descriptorQueryFilters(request, response)
{
	///
	// Save data section tag.
	///
	const section = module.context.configuration.sectionData
	
	///
	// Iterate body properties.
	///
	const filters = []
	for(const [key, value] of Object.entries(request.body))
	{
		///
		// Parse body properties.
		///
		let filter = null
		switch(key)
		{
			case '_subject':
			case '_classe':
			case '_domain':
			case '_list':
			case '_tag':
				filter = aql`doc.${section}[${key}] IN ${value}`
				break
		}
		
		///
		// Add clause.
		///
		if(filter !== null) {
			filters.push(filter)
		}
	}
	
	return filters                                                      // ==>
	
} // datasetQueryFilters()
