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
const objectSchema = joi.object({
    value: joi.object(),
    result: joi.object()
})
    .description('List of report statuses indexed by the validated object properties.');

const objectsSchema = joi.object({
    value: joi.array().items(joi.object()),
    result: joi.array().items(joi.object())
})
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
    .body(ValidateDescriptor, dd
        `
            **Service parameters**
            
            - \`descriptor\`: The descriptor global identifier, or document \`_key\`.
            - \`value\`: The value to be tested againts the descriptor's data definition.
            - \`language\`: The global identifier of the language in which you want the
            status message to be returned.
            
            The first two parameters are *required*, the last parameter is *optional*.
            
            The \`language\` code is used to select the *language* of the *status message*:
            - if the language code is omitted or \`all\`, the message will be returned in
            *all available languages*,
            - if the language code is *wrong*, or there is *no message in that language*,
            the message will be returned in *English*.
            
            Language codes are in the form: \`iso_639_3_\` followed by the *three letter ISO language code*.
            Use \`iso_639_3_eng\` for English.
        `
    )
    .response(200, Report, dd
        `
            **Validation status**
            
            The service will return three information items:
            - \`descriptor\`: The provided descriptor global identifier.
            - \`value\`: The descriptor value.
            - \`result\`: The status of the validation operation.
            
            The returned value, \`value\`, may be *different* than the provided value, because enumerations
            can be *resolved*: if the enumeration code is *not* a *term global identifier*, the full
            enumeration graph will be traversed and the first element whose local identifier matches the provided
            value will be considered the valid choice. Try entering \`_type\` as descriptor and \`string\` as the
            value: you will see that the value will be resolved to the full code value, \`_type_string\`.
            
            The \`result\` contains a \`status\` object which indicates the outcome of the validation.
            This status has two default elements: a \`code\` that is a numeric code, \`0\` means success,
            and a \`message\` string that describes the outcome. Depending on the eventual error, the status may
            include other properties such as:
            - \`value\`: the value that caused the error.
            - \`descriptor\`: the descriptor involved in the error.
            - \`elements\`: in case an array has too little or too much elements.
            - \`property\`: missing required property, in case of incorrect data definition.
            - \`block\`: data definition section.
            - \`type\`: unimplemented or invalid data type, or data definition section name.
            - \`set\`: list of required properties, in case one is missing.
            - \`range\`: valid range, in the case of out of range values.
            - \`regexp\`: regular expression, in case a string does not match.
            
            Additional properties may be included in the result, depending on the eventual error, or in the event
            that an enumeration was resolved:
            - \`resolved\`: It is an object whose properties represent the enumeration descriptors whose values
            have been resolved, the values contain the original provided codes, while the \`value\` will contain the
            resolved values. Try entering \`_type\` as descriptor and \`string\` as the value.
            - \`ignored\`: It is an object whose properties represent the descriptors that were not recognised.
            Unknown descriptors will not be validated, this is not considered an error, but such descriptors will
            be logged, so that it is possible to catch eventual errors. Try entering \`UNKNOWN\` as descriptor.
        `
    )
    .summary('Validate descriptor value')
    .description(dd
        `
            **Validate a descriptor's value**
            
            *Use this service if you want to check if the value of a descriptor is correct.*
            
            The service expects the descriptor global identifier and the descriptor value.
            The value will be validated against the data definition associated with the descriptor \
            and the service will return an object describing the status of the validation and eventual \
            additional information describing the outcome.
            
            Optionally, it is possible to indicate in which language the status message should be returned.
        `
    )

/**
 * Validate object.
 * The service will iterate the provided object's properties validating them.
 * It will return a dictionary whose keys correspond to the validated object's
 * properties, and the values are the validation status report.
 */
router.post('object', doCheckObject, 'object')
    .body(ValidateObject, dd
        `
            **Service parameters**
                
            - \`value\`: The object to be validated.
            - \`language\`: The global identifier of the language in which you want the \
            status message to be returned.
            
            The \`value\` is required and the \`language\` is optional. \
            The value must be an object whose properties will be validated, \
            please refer to the *"Validate descriptor value"* service \
            for information on how to use the \`language\` parameter.
        `
    )
    .response(200, objectSchema, dd
        `
            **Validation status**
            
            The service will return two information items:
            - \`value\`: The validated object.
            - \`result\`: The status of the validation operation.
            
            The \`value\` may be different from what was provided: please refer to the \
            *"Validate descriptor value"* service for more information.
            
            The \`result\` will be an object whose properties match the provided object's \
            top level properties, and whose value will be the \`result\` of the \
            *"Validate descriptor value"* service: each property of \`value\` will be \
            processed as if it was a descriptor.
            
            Please refer to the descriptor validation service for more information on \
            the format of each individual status.
        `
    )
    .summary('Validate an object')
    .description(dd
        `
            **Validate an object**
            
            *Use this service if you want to check if the the contents of a generic object are correct.*
            
            The service will treat the provided object as a set of descriptors and values. \
            It will scan each top level property of the object and process its value \
            as if the property name is the descriptor. Only properties that match descriptor \
            global identifiers will be validated. The result of the operation will be a \
            dictionary whose keys will match the top level property names in the object, \
            and whose values will be the status report corresponding to the key.
            
            Please refer to the *"Validate descriptor value"* service for more information \
            on the format of the individual status reports.
            
            Optionally, it is possible to indicate in which language the status messages should be returned.
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
    .body(ValidateObjects, dd
        `
            **Service parameters**
                
            - \`value\`: List of objects to be validated.
            - \`language\`: The global identifier of the language in which you want the \
            status message to be returned.
            
            The \`value\` is required and the \`language\` is optional. \
            The value should contain the list of objects to be validated, \
            please refer to the *"Validate descriptor value"* service \
            for information on how to use the \`language\` parameter.
            
            Each object will be validated using the same strategy as the \
            *Validate object* service.
        `
    )
    .response(200, objectsSchema, dd
        `
            **Validation status**
            
            The service will return two information items:
            - \`value\`: The list of validated objects.
            - \`result\`: The status of the validation operation.
            
            The \`value\` objects may be different from what was provided: please refer to the \
            *"Validate object"* service for more information.
            
            The \`result\` will be an array in which each element will contain the validation \
            status for the corresponding element of the provided \`value\`. This means that \
            index \`3\` of the \`result\` array will be the validation status for the element \
            with index \`3\` in the \`value\` parameter.
            
            Please refer to the object validation service for more information on \
            the format of each individual status.
        `
    )
    .summary('Validate list of objects')
    .description(dd
        `
            **Validate a list of objects**
            
            *Use this service if you want to validate a list of objects.*
            
            The service will treat each element of the provided array as a generic object \
            to be validated. It will iterate each element of the provided list, validate \
            the contents of the object, and return a list of status reports whose position \
            matches the position of the corresponding object in the provided objects list.
            
            Please refer to the *"Validate object"* service for more information \
            on the format of the individual status reports.
            
            Optionally, it is possible to indicate in which language the status messages should be returned.
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
    // Perform validation.
    //
    let report = checkDescriptor(
        theRequest.body.descriptor,
        theRequest.body,
        "value",
        theRequest.body.language
    )

    //
    // Remove descriptor from report.
    //
    if(report.hasOwnProperty("descriptor")) {
        delete report["descriptor"]
    }

    theResponse.send({
        "descriptor": theRequest.body.descriptor,
        "value": theRequest.body["value"],
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
    // Iterate object properties.
    //
    let report = checkObject(theRequest.body.value, theRequest.body.language)

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
    //
    // Init local storage.
    //
    let report = []

    //
    // Iterate array.
    //
    for(let i = 0; i < theRequest.body.value.length; i++) {

        //
        // Iterate object properties.
        //
        let status = checkObject(theRequest.body.value[i], theRequest.body.language)

        //
        // Handle all OK.
        //
        if(_.isEmpty(status)) {
            status = K.error.kMSG_OK
        }

        //
        // Add status.
        //
        report.push(status)
    }

    theResponse.send({
        "value": theRequest.body.value,
        "result": report
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
    setLanguage(report, theLanguage)

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
        // Remove top level descriptor from report.
        //
        if(report.hasOwnProperty("descriptor")) {
            delete report["descriptor"]
        }

        //
        // Add to result.
        //
        result[property] = report
    }

    return result                                                               // ==>

} // checkObject()

//
// UTILITY FUNCTIONS
//

/**
 * Set default language if necessary
 * The function will set the status message in the required language,
 * the logic works as follows:
 * - If the language was not provided, English will be set by default.
 * - If `all` was provided, the status will return the message in all registered languages.
 * - If the provided language is a valid `iso_639_3` global identifier and the message exists
 * in that language, the message will be set in that language.
 * - If the provided language was not found, it will default to the English message.
 *
 * This will occur only if the report has the status block.
 * @param theReport {Object}: Validation report object, expected to have status.
 * @param theLanguage {String}: Language code, defaults to English.
 */
function setLanguage(theReport, theLanguage = 'iso_639_3_eng')
{
    //
    // Skip all languages.
    //
    if(theLanguage !== 'all') {

        //
        // Check if report has status.
        //
        if(theReport.hasOwnProperty('status')) {

            //
            // Ensure status message is an object.
            //
            if(utils.isObject(theReport.status.message)) {

                //
                // Match language code.
                //
                if(theReport.status.message.hasOwnProperty(theLanguage)) {
                    theReport.status.message = theReport.status.message[theLanguage]
                } else {
                    theReport.status.message = theReport.status.message['iso_639_3_eng']
                }
            }
        }
    }

} // setLanguage()
