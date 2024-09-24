'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const aql = require('@arangodb').aql
const status = require('statuses')
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


//
// Instantiate router.
//
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
module.exports = router;
router.tag('Link graphs');


//
// TRAVERSE SERVICES
//

/**
 * Return linked document keys.
 * The service will return the list of linked document keys for the provided
 * predicate and descriptors list.
 */
router.post(
	'keys',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doGetLinkedKeys(request, response)
		}
	},
	'get-linked-keys'
)
	.summary('Get list of linked keys')
	.description(dd
		`
        **Return list of linked keys**
        
        Use this service if you want to retrieve the *flattened list* of \
        *document keys* linked to the provided *list* of *global identifiers* \
        with the provided *predicate*.
        
        ***To use this service, the current user must have the \`read\` role.***
        
        The service expects the link predicate as a path query parameter, \
        and the list of descriptor global identifiers in the request body. \
        The service will return the list of all the elements linked to the \
        provided list of keys with the provided predicate.
        
        You can try providing \`_predicate_requires_indicator\` as the \
        predicate, and \`chr_EffPopSize\` in the list of nodes to get the \
        list of additional descriptors you should add to a dataset that \
        features the \`chr_EffPopSize\` descriptor.
    `
	)
	.queryParam('predicate', Models.StringModel, dd`
        Link predicate, here are some examples:
        
        - \`_predicate_requires_indicator\`: Requires indicator.
        - \`_predicate_requires_metadata\`: Required metadata indicator.
    `
	)
	.body(Models.StringArrayModel, dd
		`
            **Service parameters**
            
            The POST body should contain an array with the list of *global \
            identifiers* for which we want the linked items.
        `
	)
	.response(200, [joi.string()], dd
		`
            **Linked keys**
            
            The service will return a list of *descriptor global identifiers* \
            linked to the provided list of document keys with the provided predicate.
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
 * Return linked documents.
 * The service will return the list of linked documents for the provided
 * predicate and descriptors list. */
router.post(
	'terms',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doGetLinkedTerms(request, response)
		}
	},
	'get-linked-terms'
)
	.summary('Get list of linked terms')
	.description(dd
		`
        **Return list of linked terms**
        
        Use this service if you want to retrieve the *flattened list* of \
        *terms* linked to the provided *list* of *global identifiers* \
        with the provided *predicate*.
        
        ***To use this service, the current user must have the \`read\` role.***
        
        The service expects the link predicate as a path query parameter, \
        and the list of descriptor global identifiers in the request body. \
        The service will return the list of all the terms linked to the \
        provided list of keys with the provided predicate.
        
        You can try providing \`_predicate_requires_indicator\` as the \
        predicate, and \`chr_EffPopSize\` in the list of nodes to get the \
        list of additional descriptors you should add to a dataset that \
        features the \`chr_EffPopSize\` descriptor.
    `
	)
	.queryParam('predicate', Models.StringModel, dd`
        Link predicate, here are some examples:
        
        - \`_predicate_requires_indicator\`: Requires indicator.
        - \`_predicate_requires_metadata\`: Required metadata indicator.
    `
	)
	.body(Models.StringArrayModel, dd
		`
            **Service parameters**
            
            The POST body should contain an array with the list of *global \
            identifiers* for which we want the linked items.
        `
	)
	.response(200, [joi.object()], dd
		`
            **Linked terms**
            
            The service will return a list of *terms*  linked to the provided \
            list of document keys with the provided predicate.
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
 * Return list of indicators required by provided list of variables.
 * @param request: API request.
 * @param response: API response.
 */
function doGetLinkedTerms(request, response)
{
	//
	// Query database.
	//
	const result = Dictionary.getLinkedTerms(
		'_predicate_requires_indicator',
		request.body
	)

	response.send(result);                                                      // ==>

} // doGetLinkedTerms()

/**
 * Return list of indicator keys required by provided list of variables.
 * @param request: API request.
 * @param response: API response.
 */
function doGetLinkedKeys(request, response)
{
	//
	// Query database.
	//
	const result = Dictionary.getLinkedKeys(
		request.queryParams.predicate,
		request.body
	)

	response.send(result);                                                      // ==>

} // doGetLinkedKeys()

/**
 * Return list of metadata descriptors required by provided list of variables.
 * @param request: API request.
 * @param response: API response.
 */
function doGetRequiredMetadata(request, response)
{
	//
	// Query database.
	//
	const result = Dictionary.getLinkedTerms(
		'_predicate_requires_metadata',
		request.body
	)

	response.send(result);                                                      // ==>

} // doGetRequiredDescriptors()

/**
 * Return list of metadata keys required by provided list of variables.
 * @param request: API request.
 * @param response: API response.
 */
function doGetRequiredMetadataKeys(request, response)
{
	//
	// Query database.
	//
	const result = Dictionary.getRequiredDescriptorKeys(
		'_predicate_requires_metadata',
		request.body
	)

	response.send(result);                                                      // ==>

} // doGetRequiredDescriptorKeys()
