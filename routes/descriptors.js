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


//
// Instantiate router.
//
const createRouter = require('@arangodb/foxx/router');
const {db} = require("../utils/constants");
const router = createRouter();
module.exports = router;
router.tag('Descriptors');


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
			throw httpError(HTTP_NOT_FOUND, `Term ${descriptor} not found`)            // ==>
		}
		throw error
	}

} // getDescriptorQualificationKeys()
