'use strict';

//
// Imports.
//
const dd = require('dedent');
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
// Types.
//
const ValidationReport = require('../models/ValidationReport')

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
    // Init report.
    //
    let report = new ValidationReport(req.descriptor, req.value)

    //
    // Query database.
    //
    const valid = validation.validateDescriptor(req.descriptor, [report, "value"], report)

    //
    // Move leaf descriptor in status on error.
    //
    if(!valid) {
        if(report.hasOwnProperty("status")) {
            if(report.hasOwnProperty("current")) {
                report.status["descriptor"] = report["current"]
            }
        }
    }

    //
    // Delete leaf descriptor from report.
    //
    if(report.hasOwnProperty("current")) {
        delete report["current"]
    }

    //
    // Convert ignored to set.
    //
    if(report.ignored.length > 0) {
        report.ignored = [...new Set(report.ignored)]
    } else {
        delete report.ignored
    }

    //
    // Remove resolved if empty.
    //
    if(Object.keys(report.resolved).length === 0) {
        delete report.resolved
    }

    response.send(report)                                                       // ==>

} // getAllEnumerations()
