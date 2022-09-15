'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const createRouter = require('@arangodb/foxx/router');

//
// Models.
//
const Report = require(('../models/report'))
const ValidateDescriptor = require(('../models/validateDescriptor'))
const ValidateObject = require(('../models/validateObject'))
const ValidateObjects = require(('../models/validateObjects'))

//
// Constants.
//
const objectSchema = joi.object()
    .description('List of report statuses indexed by the validated object properties.');
const objectsSchema = joi.array()
    .description('List of report statuses indexed by the array index of the validated list.');

//
// Functions.
//
const utils = require("../utils/utils");
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
router.post('descriptor', doCheckDescriptor, 'descriptor')
    .body(ValidateDescriptor, "Descriptor name and descriptor value.")
    .response(200, Report, "Validation status.")
    .summary('Validate descriptor value')
    .description(dd
        `
            Provided a descriptor global identifier and a value, the service will determine if the pair are valid.
        `
    );

/**
 * Validate object.
 * The service will iterate the provided object's properties validating them.
 * It will return a dictionary whose keys correspond to the validated object's
 * properties, and the values are the validation status report.
 */
router.post('object', checkObject, 'object')
    .body(ValidateObject, "Object value to validate.")
    .response(200, objectSchema, "Validation status by property.")
    .summary('Validate list of objects')
    .description(dd
        `
            The service will iterate the provided object's properties validating them.
            It will return a dictionary whose keys correspond to the validated object's
            properties, and the values are the validation status report.
        `
    );

/**
 * Validate objects.
 * The service will iterate the provided array of objects and validate them.
 * It will return an array of same length as the provided array, whose elements
 * will be dictionaries whose keys correspond to the validated object's
 * properties, and the values are the validation status report.
 */
router.post('objects', checkObjects, 'objects')
    .body(ValidateObjects, "List of objects to validate.")
    .response(200, objectsSchema, "List of validation status dictionaries.")
    .summary('Validate list of objects')
    .description(dd
        `
            The service will iterate the provided array of objects and validate them.
            It will return an array of same length as the provided array, whose elements
            will be dictionaries whose keys correspond to the validated object's
            properties, and the values are the validation status report.
        `
    );


//
// Main functions.
//

/**
 * Perform validation of provided descriptor and value.
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckDescriptor(theRequest, theResponse)
{
    //
    // Maybe check language and request parameters here?
    // MILKO -
    //

    //
    // Perform validation.
    //
    const report = checkDescriptor(theRequest.body)

    theResponse.send(report)                                                    // ==>

} // doCheckDescriptor()

/**
 * Perform validation of provided object.
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckObject(theRequest, theResponse)
{
    //
    // Maybe check language and request parameters here?
    // MILKO -
    //

    //
    // Init local storage.
    //
    let result = {}

    //
    // Iterate object properties.
    //
    for(const property in theRequest.body) {

        //
        // Init loop storage.
        //
        let body = {
            "descriptor": property,
            "value": theRequest.body[property]
        }
        if(theRequest.body.hasOwnProperty("language")) {
            body["language"] = theRequest.body.language
        }

        //
        // Validate descriptor.
        //
        let report = checkDescriptor(body)

        //
        // Remove top level descriptor.
        //
        delete report.descriptor

        //
        // Delete value.
        //
        if(!report.hasOwnProperty("resolved")) {
            delete report.value
        }

        //
        // Add to result.
        //
        result[property] = report
    }

    theResponse.send(result)                                                    // ==>

} // doCheckObject()


//
// Functions.
//

/**
 * Validate descriptor.
 * @param theRequestBody: 'descriptor' and 'value' in object.
 * @return {Object}: The validation report.
 */
function checkDescriptor(theRequestBody)
{
    //
    // Init report.
    //
    let report = new ValidationReport(
        theRequestBody.descriptor,
        theRequestBody.value
    )

    //
    // Validate descriptor.
    //
    const valid = validation.validateDescriptor(
        theRequestBody.descriptor,
        [report, "value"],
        report
    )

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

    //
    // Set language.
    //
    if(theRequestBody.hasOwnProperty("language")) {
        if(report.status.message.hasOwnProperty(theRequestBody.language)) {
            report.status.message = report.status.message[theRequestBody.language]
        }
    }

    return report                                                               // ==>

} // checkDescriptor()

/**
 * Validate object.
 * @param request: Object to validate.
 * @param response: Object with status report for each property.
 * */
function checkObject(request, response)
{
    //
    // Init local storage.
    //
    let result = {}

    //
    // Iterate object properties.
    //
    for(const property in request.body.value) {

        //
        // Init report.
        //
        let report = new ValidationReport(property, request.body.value[property])

        //
        // Validate descriptor.
        //
        const valid = validation.validateDescriptor(property, [report, "value"], report)

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

        //
        // Remove top level descriptor.
        //
        delete report.descriptor

        //
        // Delete value.
        //
        if(!report.hasOwnProperty("resolved")) {
            delete report.value
        }

        //
        // Handle language.
        //
        if(request.body.hasOwnProperty("language")) {
            if(report.status.message.hasOwnProperty(request.body.language)) {
                report.status.message = report.status.message[request.body.language]
            }
        }

        //
        // Add to result.
        //
        result[property] = report
    }

    response.send(result)                                                       // ==>

} // checkObject()

/**
 * Validate objects list.
 * @param request: List of objects to validate.
 * @param response: List of object validation statuses.
 * */
function checkObjects(request, response)
{

} // checkObjects()
