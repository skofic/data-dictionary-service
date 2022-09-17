'use strict';

//
// Imports.
//
const _ = require('lodash');
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
// Import resources.
//
const K = require( '../utils/constants' );

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
router.post('object', doCheckObject, 'object')
    .body(ValidateObject, "Object value to validate.")
    .response(200, objectSchema, "Validation status by property.")
    .summary('Validate an object')
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
router.post('objects', doCheckObjects, 'objects')
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
 *
 * The service will return an object with the following properties:
 * - descriptor: The descriptor name.
 * - value: The tested value, may be updated with resolved enumerations.
 * - result: The status of the validation.
 *
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckDescriptor(theRequest, theResponse)
{
    //
    // Init local storage.
    //
    let descriptor = theRequest.body.descriptor
    let value = theRequest.body
    let index = "value"
    const language = theRequest.body.hasOwnProperty("language")
                   ? theRequest.body.language
                   : 'all'

    //
    // Perform validation.
    //
    let report = checkDescriptor(descriptor, value, index, language)

    theResponse.send({
        "descriptor": descriptor,
        "value": value[index],
        "result": report
    })

} // doCheckDescriptor()

/**
 * Perform validation of provided object.
 *
 * The service will return an object with the following properties:
 * - value: The tested object, may be updated with resolved enumerations.
 * - result: Validation status, may have the following formats:
 * an object with the same properties as the provided value and with the validation
 * status as values. Correct values with no warnings will be omitted. If that is the case
 * of all properties, the result will be a single succesful status.
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckObject(theRequest, theResponse)
{
    //
    // Init local storage.
    //
    const language = theRequest.body.hasOwnProperty("language")
        ? theRequest.body.language
        : 'all'

    //
    // Iterate object properties.
    //
    let report = checkObject(theRequest.body.value, language)

    //
    // Handle all OK.
    //
    if(_.isEmpty(report)) {
        report = K.error.kMSG_OK
    }

    theResponse.send({
        "value": theRequest.body.value,
        "result": report
    })                                                                          // ==>

} // doCheckObject()

/**
 * Perform validation of provided list of objects.
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckObjects(theRequest, theResponse)
{
    theResponse.send({
        "value": "NOTHING",
        "status": "TO BE DEVELOPED"
    })                                                                          // ==>

} // doCheckObjects()


//
// Functions.
//

/**
 * Validate descriptor.
 * @param theDescriptor {String}: Descriptor.
 * @param theValue: Descriptor value parent.
 * @param theIndex {String}: Value property name.
 * @param theLanguage {String}: Response language enum, defaults to english.
 * @return {Object}: The validation status object.
 */
function checkDescriptor(theDescriptor, theValue, theIndex, theLanguage = 'iso_639_3_eng')
{
    //
    // Init report.
    //
    let report = new ValidationReport(theDescriptor)

    //
    // Validate descriptor.
    //
    const valid = validation.validateDescriptor(
        theDescriptor,
        [theValue, theIndex],
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
    if(report.hasOwnProperty("resolved")) {
        if(Object.keys(report.resolved).length === 0) {
            delete report.resolved
        }
    }

    //
    // Set language.
    //
    if(theLanguage !== "all") {
        if(utils.isObject(report.status.message)) {
            if(report.status.message.hasOwnProperty(theLanguage)) {
                report.status.message = report.status.message[theLanguage]
            } else {
                report.status.message = report.status.message['iso_639_3_eng']
            }
        }
    }

    return report                                                               // ==>

} // checkDescriptor()

/**
 * Validate object.
 * @param theValue: Object value.
 * @param theLanguage {String}: Response language enum, defaults to english.
 * @return {Object}: The validation status object.
 */
function checkObject(theValue, theLanguage = 'iso_639_3_eng')
{
    //
    // Init local storage.
    //
    let result = {}

    //
    // Iterate object properties.
    //
    for(const property in theValue) {

        //
        // Validate current descriptor.
        //
        let report = checkDescriptor(property, theValue, property, theLanguage)

        //
        // Remove top level descriptor.
        //
        delete report.descriptor

        //
        // Add to result.
        //
        if( (report.status.code !== 0) ||
            report.hasOwnProperty("resolved") ||
            report.hasOwnProperty("ignored")) {
            result[property] = report
        }
    }

    return result                                                               // ==>

} // checkObject()
