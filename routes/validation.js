'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');

//
// Models.
//
const Report = require(('../models/report'))
const ValidateDescriptor = require(('../models/validateDescriptor'))

//
// Functions.
//
const validation = require("../utils/validation");

//
// Constants.
//
const collection_terms = module.context.collection('terms');

//
// Error constants.
//
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

//
// Instantiate router.
//
const router = createRouter();
module.exports = router;

//
// Set router tags.
//
router.tag('validation');


/**
 * Validate descriptor.
 * The service will check whether the provided value corresponds to the provided
 * descriptor.
 */
router.post('descriptor', checkDescriptor, 'descriptor')
    .body(ValidateDescriptor, "Descriptor name and descriptor value.")
    .response(200, Report, "Validation status.")
    .summary('Validate descriptor value')
    .description(dd
        `
            Provided a descriptor global identifier and a value, the service will determine if the pair are valid.
        `
    );


//
// Functions.
//
function checkDescriptor(request, response)
{
    //
    // Get parameters.
    //
    const req = request.body

    //
    // Query database.
    //
    const result = validation.validateDescriptor(req.descriptor, req.value)

    response.send(result);                                              // ==>

} // getAllEnumerations()
