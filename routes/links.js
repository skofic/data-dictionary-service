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
const Utils = require('../utils/utils')
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
router.tag('Linked types');


//
// TRAVERSE SERVICES
//

/**
 * Return required descriptor keys of provided descriptors list.
 * The service will return the list of required descriptor keys of the provided list
 * of descriptors. Only the required descriptors will be returned.
 */
router.post(
	'required/keys',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doGetRequiredDescriptorKeys(request, response)
		}
	},
	'get-required-descriptor-keys'
)
	.summary('Get list of required descriptor keys')
	.description(dd
		`
**Return list of required term keys**

*Use this service if you want to get the full list of term keys of an initial selection.*

***To use this service, the current user must have the \`read\` role.***

The service expects a list of descriptor global identifiers. The service will return the list of additional descriptors required by the provided list.

This service is used when compiling a dataset: provide the list of *descriptor global identifiers* that you want to *include* in the *dataset* and the service will return the eventual *additional descriptor global identifiers* that *must* be *included* in the *dataset*.

The additional descriptors are variables such as date, identifiers and related variables that are required to make sense of the provided list of descriptors.

You can try providing \`chr_EffPopSize\` to get the list of additional descriptors you should add to a dataset that features the \`chr_EffPopSize\` descriptor.        `
	)
	.body(Models.StringArrayModel, dd
		`
            **Service parameters**
            
            - \`body\`: The POST body should contain an array with the list of descriptor *global identifiers* to check.
        `
	)
	.response(200, [joi.string()], dd
		`
            **Check status**
            
            The service will return a list of *descriptor global identifiers* to be added to the provided descriptors list.
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
 * Return required descriptors of provided descriptors list.
 * The service will return the list of required descriptors of the provided list
 * of descriptors. Only the required descriptors will be returned.
 */
router.post(
	'required/terms',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			doGetRequiredDescriptors(request, response)
		}
	},
	'get-required-descriptors'
)
	.summary('Get list of required descriptor terms')
	.description(dd
		`
**Return list of required descriptors**

*Use this service if you want to get the full list of terms of an initial selection.*

***To use this service, the current user must have the \`read\` role.***

The service expects a list of descriptor global identifiers. The service will return the list of additional descriptors required by the provided list.

This service is used when compiling a dataset: provide the list of *descriptor global identifiers* that you want to *include* in the *dataset* and the service will return the eventual *additional descriptor global identifiers* that *must* be *included* in the *dataset*.

The additional descriptors are variables such as date, identifiers and related variables that are required to make sense of the provided list of descriptors.

You can try providing \`chr_EffPopSize\` to get the list of additional descriptors you should add to a dataset that features the \`chr_EffPopSize\` descriptor.        `
	)
	.body(Models.StringArrayModel, dd
		`
            **Service parameters**
            
            - \`body\`: The POST body should contain an array with the list of descriptor *global identifiers* to check.
        `
	)
	.response(200, joi.object(), dd
		`
            **Check status**
            
            The service will return a list of *descriptors* to be added to the provided descriptors list.
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
 * Return list of descriptors required by provided list of variables.
 * @param request: API request.
 * @param response: API response.
 */
function doGetRequiredDescriptors(request, response)
{
	//
	// Query database.
	//
	const result = Dictionary.getRequiredDescriptors(
		request.body
	)

	response.send(result);                                                      // ==>

} // doGetRequiredDescriptors()

/**
 * Return list of descriptor keys required by provided list of variables.
 * @param request: API request.
 * @param response: API response.
 */
function doGetRequiredDescriptorKeys(request, response)
{
	//
	// Query database.
	//
	const result = Dictionary.getRequiredDescriptorKeys(
		request.body
	)

	response.send(result);                                                      // ==>

} // doGetRequiredDescriptorKeys()
