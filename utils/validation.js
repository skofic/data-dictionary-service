'use strict';

//
// Import frameworks.
//
const _ = require('lodash');                            // Lodash library.
const db = require('@arangodb').db;						// Database object.
const aql = require('@arangodb').aql;					// AQL queries.
const errors = require('@arangodb').errors;             // ArangoDB errors.
const status = require('statuses');                     // Status codes.
const httpError = require('http-errors');               // HTTP errors.

//
// Import resources.
//
const K = require( './constants' );					    // Application constants.

//
// Set constants.
//
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

//
// Import classes.
//
const ValidationReport = require('../models/ValidationReport')


/**
 * Validate descriptor.
 * The function expects a descriptor name and its value: it will check whether
 * the value corresponds to the descriptor definition.
 * @param name {String}: Descriptor name.
 * @param value {Any}: Descriptor value.
 * @returns {ValidationReport}: A report describing the validation status.
 */
function validateDescriptor(name, value)
{
    //
    // Init local storage.
    //
    const terms = module.context.collection(K.collection.term.name);
    let descriptor = {}

    //
    // Instantiate report and set value.
    //
    let report = new ValidationReport(name, value)

    //
    // Load descriptor.
    //
    try {
        descriptor = terms.document(name)
        report.found = (
            (Object.keys(descriptor).length !== 0) &&
            (descriptor.constructor === Object)
        )
    } catch (error) {
        if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
            report.status = K.error.kMSG_NOT_FOUND
        } else {
            report.status = K.error.kMSG_ERROR
        }

        report["error"] = error

        return report                                                           // ==>
    }

    //
    // Validate data.
    //
    if(descriptor.hasOwnProperty(K.term.dataBlock)) {
        validateDataBlock(descriptor[K.term.dataBlock], report)
    } else {
        report.status = K.error.kMSG_NO_DATA_BLOCK
        return report                                                           // ==>
    }

    return report                                                               // ==>

} // validateDescriptor()

/**
 * Validate data block
 * This function will validate the provided data block
 * and return the status in the provided report.
 * The function will check if any of scalar, array, set or dictionary blocks
 * are set in the data block and run the corresponding function.
 * @param theBlock {Object}: The data block.
 * @param theReport {ValidationReport}: The status report
 */
function validateDataBlock(theBlock, theReport)
{
    //
    // Parse scalar data block.
    //
    if(theBlock.hasOwnProperty(K.term.dataBlockScalar))
    {
        validateScalar(theBlock[K.term.dataBlockScalar], theReport)
    }

    //
    // Parse array data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockArray))
    {
        validateArray(theBlock[K.term.dataBlockArray], theReport)
    }

    //
    // Parse set data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockSet))
    {
        validateSet(theBlock[K.term.dataBlockSet], theReport)
    }

    //
    // Parse dictionary data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockDict))
    {
        validateDictionary(theBlock[K.term.dataBlockDict], theReport)
    }

    //
    // Parse empty data block.
    //
    else if((Object.keys(theBlock).length === 0) && (theBlock.constructor === Object))
    {
        return                                                                  // ==>
    }

    //
    // Invalid data block.
    //
    else
    {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
    }

} // validateDataBlock()

/******************************************************************************/
/* DATA BLOCK FUNCTIONS                                                       /*
/******************************************************************************/

/**
 * Validate scalar value
 * The function expects the descriptor's scalar definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The scalar data block.
 * @param theReport {ValidationReport}: The status report.
 */
function validateScalar(theBlock, theReport)
{
    //
    // Check if value is scalar.
    //
    if(isArray((theReport.value) || isObject(theReport.value))) {
        theReport.status = K.error.kMSG_NOT_SCALAR
        return                                                                  // ==>
    }

    //
    // Parse data type.
    //
    validateValue(theBlock,theReport, theReport.value)

} // validateScalar()

/**
 * Validate array value
 * The function expects the descriptor's array definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The array data block.
 * @param theReport {ValidationReport}: The status report.
 */
function validateArray(theBlock, theReport)
{
    //
    // Check if value is an array.
    //
    if(isArray(theReport.value)) {

        //
        // Handle array constraints.
        //
        if(theBlock.hasOwnProperty(K.term.dataRangeElements)) {
            if(theBlock.hasOwnProperty(K.term.dataRangeElementsMin)) {
                if(theBlock[K.term.dataRangeElements][K.term.dataRangeElementsMin] > theReport.value.length) {
                    theReport.status = K.error.kMSG_NOT_ENOUGH_ELEMENTS
                    return                                                      // ==>
                }
            }
            if(theBlock.hasOwnProperty(K.term.dataRangeElementsMax)) {
                if(theBlock[K.term.dataRangeElements][K.term.dataRangeElementsMax] < theReport.value.length) {
                    theReport.status = K.error.kMSG_TOO_MANY_ELEMENTS
                    return                                                      // ==>
                }
            }
        }

        //
        // Validate array values.
        //
        for(let value of theReport.value) {
            if(!validateValue(theBlock, theReport, value)) {
                theReport.status["value"] = value
                return                                                          // ==>
            }
        }

    } else {
        theReport.status = K.error.kMSG_NOT_ARRAY
    }

} // validateArray()

/**
 * Validate set value
 * The function expects the descriptor's set definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The set data block.
 * @param theReport {ValidationReport}: The status report.
 */
function validateSet(theBlock, theReport)
{
    //
    // Check if value is a set.
    //
    if(isArray(theReport.value)) {

        //
        // Check for duplicates.
        //
        if(new Set(theReport.value).size === theReport.value.length) {

            //
            // Handle data type,
            // if missing we assume any data type,
            // thus no validation necessary.
            //
            if(theBlock.hasOwnProperty(K.term.dataType)) {
                for(let value of theReport.value) {
                    if(!validateValue(theBlock, theReport, value)) {
                        theReport.status["value"] = value
                        return                                                  // ==>
                    }
                }
            }

        } else {
            theReport.status = K.error.kMSG_DUP_SET
        }
    } else {
        theReport.status = K.error.kMSG_NOT_ARRAY
    }

} // validateSet()

/**
 * Validate dictionary value
 * The function expects the descriptor's dictionary definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 */
function validateDictionary(theBlock, theReport)
{
    theReport.value = "IS DICTIONARY"

} // validateDictionary()

/**
 * Validate data value
 * The function will validate the value provided in the report structure according
 * to the data type defined in the provided descriptor data block.
 * The value is expected to be .
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateValue(theBlock, theReport, theValue)
{
    //
    // Parse by type.
    //
    if(theBlock.hasOwnProperty(K.term.dataType)) {
        switch(theBlock[K.term.dataType]) {
            // Boolean.
            case K.term.dataTypeBool:
                return validateBoolean(theBlock, theReport, theValue)           // ==>

            // Integer.
            case K.term.dataTypeInteger:
                return validateInteger(theBlock, theReport, theValue)           // ==>

            // Float.
            case K.term.dataTypeNumber:
                return validateNumber(theBlock, theReport, theValue)            // ==>

            // String.
            case K.term.dataTypeString:
                return validateString(theBlock, theReport, theValue)            // ==>

            // Object.
            case K.term.dataTypeObject:
                break

            case K.term.dataTypeEnum:
                break
            case K.term.dataTypeGeoJson:
                break
            case K.term.dataTypeRecord:
                break
            case K.term.dataTypeTimestamp:
                break
        }

        if(theReport.status.code !== 0) {
            return false                                                        // ==>
        }
    }

    return true                                                                 // ==>

} // validateValue()

/**
 * Validate boolean value
 * The function will return true if the reported value is a boolean.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateBoolean(theBlock, theReport, theValue)
{
    if(!isBoolean(theValue)) {
        theReport.status = K.error.kMSG_NOT_BOOL
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateBoolean()

/**
 * Validate integer value
 * The function will return true if the reported value is an integer.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateInteger(theBlock, theReport, theValue)
{
    if(!isInteger(theValue)) {
        theReport.status = K.error.kMSG_NOT_INT
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateInteger()

/**
 * Validate number value
 * The function will return true if the reported value is a float or integer.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateNumber(theBlock, theReport, theValue)
{
    if(!isNumber(theValue)) {
        theReport.status = K.error.kMSG_NOT_NUMBER
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateNumber()

/**
 * Validate string value
 * The function will return true if the reported value is a string.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateString(theBlock, theReport, theValue)
{
    if(!isString(theValue)) {
        theReport.status = K.error.kMSG_NOT_STRING
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateString()

/******************************************************************************/
/* UTILITY FUNCTIONS                                                          /*
/******************************************************************************/

/**
 * Check if boolean.
 * The function will return true if the provided value is a boolean.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if boolean.
 */
function isBoolean(item)
{
    return _.isBoolean(item)                                                    // ==>

} // isBoolean()

/**
 * Check if integer.
 * The function will return true if the provided value is an integer.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if integer.
 */
function isInteger(item)
{
    return _.isInteger(item)                                                    // ==>

} // isInteger()

/**
 * Check if numeric.
 * The function will return true if the provided value is a numeric.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if numeric.
 */
function isNumber(item)
{
    return _.isNumber(item)                                                     // ==>

} // isNumber()

/**
 * Check if string.
 * The function will return true if the provided value is a string.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if string.
 */
function isString(item)
{
    return _.isString(item)                                                     // ==>

} // isString()

/**
 * Check if object.
 * The function will return true if the provided value is an object.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True for objects, false for other types.
 */
function isObject(item)
{
    return _.isPlainObject(item)                                                // ==>

} // isObject()

/**
 * Check if array.
 * The function will return true if the provided value is an array.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True for arrays, false for other types.
 */
function isArray(item)
{
    return _.isArray(item)                                                      //==>

} // isArray()


module.exports = {
    validateDescriptor
}