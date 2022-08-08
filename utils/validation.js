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
            report.status = K.error.kMSG_DESCRIPTOR_NOT_FOUND
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
        validateDataBlock(descriptor[K.term.dataBlock], report, value)
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
 * @param theValue {Any}: The descriptor's value.
 */
function validateDataBlock(theBlock, theReport, theValue)
{
    //
    // Parse scalar data block.
    //
    if(theBlock.hasOwnProperty(K.term.dataBlockScalar))
    {
        validateScalar(theBlock[K.term.dataBlockScalar], theReport, theValue)
    }

    //
    // Parse array data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockArray))
    {
        validateArray(theBlock[K.term.dataBlockArray], theReport, theValue)
    }

    //
    // Parse set data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockSet))
    {
        validateSet(theBlock[K.term.dataBlockSet], theReport, theValue)
    }

    //
    // Parse dictionary data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockDict))
    {
        validateDictionary(theBlock[K.term.dataBlockDict], theReport, theValue)
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
 * @param theValue {Any}: The scalar value.
 */
function validateScalar(theBlock, theReport, theValue)
{
    //
    // Check if value is scalar.
    //
    if(isArray(theValue) || isObject(theValue)) {
        theReport.status = K.error.kMSG_NOT_SCALAR
        return                                                                  // ==>
    }

    //
    // Parse data type.
    //
    validateValue(theBlock, theReport, theValue)

} // validateScalar()

/**
 * Validate array value
 * The function expects the descriptor's array definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The array data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The array value.
 */
function validateArray(theBlock, theReport, theValue)
{
    //
    // Check if value is an array.
    //
    if(isArray(theValue)) {

        //
        // Handle array constraints.
        //
        if(theBlock.hasOwnProperty(K.term.dataRangeElements)) {
            if(theBlock.hasOwnProperty(K.term.dataRangeElementsMin)) {
                if(theBlock[K.term.dataRangeElements][K.term.dataRangeElementsMin] > theValue.length) {
                    theReport.status = K.error.kMSG_NOT_ENOUGH_ELEMENTS
                    return                                                      // ==>
                }
            }
            if(theBlock.hasOwnProperty(K.term.dataRangeElementsMax)) {
                if(theBlock[K.term.dataRangeElements][K.term.dataRangeElementsMax] < theValue.length) {
                    theReport.status = K.error.kMSG_TOO_MANY_ELEMENTS
                    return                                                      // ==>
                }
            }
        }

        //
        // Validate array values.
        //
        for(let value of theValue) {
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
 * @param theValue {Any}: The set value.
 */
function validateSet(theBlock, theReport, theValue)
{
    //
    // Perform array validation.
    //
    validateArray(theBlock, theReport, theValue)
    if(theReport.status.code !== 0) {
        return                                                                  // ==>
    }

    //
    // Check for duplicates.
    //
    if(new Set(theValue).size !== theValue.length) {
        theReport.status = K.error.kMSG_DUP_SET
    }

} // validateSet()

/**
 * Validate dictionary value
 * The function expects the descriptor's dictionary definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The dictionary value.
 */
function validateDictionary(theBlock, theReport,theValue)
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
                return validateObject(theBlock, theReport, theValue)            // ==>

            // Enumeration.
            case K.term.dataTypeEnum:
                return validateEnum(theBlock, theReport, theValue)              // ==>
                break

            // Record reference.
            case K.term.dataTypeRecord:
                return validateRecord(theBlock, theReport, theValue)            // ==>

            // Timestamp.
            case K.term.dataTypeTimestamp:
                break

            // GeoJSON.
            case K.term.dataTypeGeoJson:
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

    if(!validateRange(theBlock, theReport, theValue)) {
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

    if(!validateRange(theBlock, theReport, theValue)) {
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

/**
 * Validate record value
 * The function will return true if the reported value is a record handle.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The handle to test.
 * @returns {boolean}: true means valid.
 */
function validateRecord(theBlock, theReport, theValue)
{
    if(!isString(theValue)) {
        theReport.status = K.error.kMSG_NOT_STRING
        return false                                                            // ==>
    }

    try {
        if(db._exists(theValue)) {
            return true                                                         // ==>
        }

    } catch (error) {
        theReport["error"] = error
    }

    theReport.status = K.error.kMSG_NOT_FOUND
    return false                                                            // ==>

} // validateRecord()

/**
 * Validate enumeration value
 * The function will return true if the reported value is an enumeration.
 * The function will perform the following checks:
 * - Assert the value is a string.
 * - Assert value has a corresponding type.
 * - Check is the value is a term.
 *     - If that is the case, locate the term in the graph.
 *     - If that is not the case, locate the code in the graph.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateEnum(theBlock, theReport, theValue)
{
    //
    // Init local storage.
    //
    const terms = module.context.collection(K.collection.term.name);

    if(!isString(theValue)) {
        theReport.status = K.error.kMSG_NOT_STRING
        return false                                                            // ==>
    }

    if(theBlock.hasOwnProperty(K.term.dataKind)) {

        if(terms.exists(theValue)) {
            return validateEnumTerm(theBlock, theReport, theValue)              // ==>
        } else {
            return validateEnumCode(theBlock, theReport, theValue)              // ==>
        }

    } else {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
        return false                                                            // ==>
    }

} // validateEnum()

/**
 * Validate enumeration key value
 * The function will return true if the reported term key value is an enumeration
 * belonging to the enumeration type.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateEnumTerm(theBlock, theReport, theValue)
{
    //
    // Init local storage.
    //
    const collection = module.context.collection(K.collection.term.name);

    //
    // Iterate enumeration types.
    //
    for(const path of theBlock[K.term.dataKind]) {

        //
        // Handle term wildcard.
        // Should succeed, since we already asserted value is a term.
        //
        if(path == K.term.anyTerm) {
            return true                                                         // ==>
        }

        //
        // Traverse graph.
        //
        let root = collection.name() + '/' + path
        let target = collection.name() + '/' + theValue

        const result = db._query( aql`
            WITH ${collection}
            FOR vertex, edge, path IN 1..10
                INBOUND ${root}
                GRAPH "schema"
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${K.term.predicateEnum} AND
                      (edge._to == ${target} OR
                        edge._from == ${target})
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${K.term.predicateEnum} AND
                       (edge._to == ${target} OR
                        edge._from == ${target})
            RETURN vertex._key
        `).toArray()

        if(result.length > 0) {
            theReport.value = result[0]
            theReport.status = K.error.kMSG_VALUE_RESOLVED
            return true                                                         // ==>
        }
    }

    theReport.status = K.error.kMSG_NOT_FOUND
    return false                                                                // ==>

} // validateEnumTerm()

/**
 * Validate enumeration key value
 * The function will return true if the reported term key value is an enumeration
 * belonging to the enumeration type.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateEnumCode(theBlock, theReport, theValue)
{
    //
    // Init local storage.
    //
    const collection = module.context.collection(K.collection.term.name);

    //
    // Iterate enumeration types.
    //
    for(const path of theBlock[K.term.dataKind]) {

        //
        // Skip term wildcard.
        // We know value is not a term.
        //
        if(path == K.term.anyTerm) {
            continue                                                    // =>
        }

        //
        // Traverse graph.
        //
        const root = collection.name() + '/' + path

        const result = db._query( aql`
            WITH ${collection}
            FOR vertex, edge, path IN 1..10
                INBOUND ${root}
                GRAPH "schema"
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${K.term.predicateEnum} AND
                      ${theValue} IN vertex._code._aid
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${K.term.predicateEnum} AND
                      ${theValue} IN vertex._code._aid
            RETURN vertex._key
        `).toArray()

        if(result.length > 0) {
            theReport.value = result[0]
            theReport.status = K.error.kMSG_VALUE_RESOLVED
            return true                                                         // ==>
        }
    }

    theReport.status = K.error.kMSG_NOT_FOUND
    return false                                                                // ==>

} // validateEnumCode()

/**
 * Validate object value
 * The function will return true if the reported value is an object.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateObject(theBlock, theReport, theValue)
{
    if(!isObject(theValue)) {
        theReport.status = K.error.kMSG_NOT_OBJECT
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateObject()

/**
 * Validate range
 * The function will return true if the value is within the valid range.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateRange(theBlock, theReport, theValue)
{
    if(theBlock.hasOwnProperty(K.term.dataRangeValid)) {
        const block = theBlock[K.term.dataRangeValid]
        if(block.hasOwnProperty(K.term.dataRangeValidMinInc)) {
            if(value < block[K.term.dataRangeValidMinInc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                return false                                                    // ==>
            }
        }
        if(block.hasOwnProperty(K.term.dataRangeValidMinExc)) {
            if(value <= block[K.term.dataRangeValidMinExc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                return false                                                    // ==>
            }
        }
        if(block.hasOwnProperty(K.term.dataRangeValidMaxInc)) {
            if(value > block[K.term.dataRangeValidMaxInc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                return false                                                    // ==>
            }
        }
        if(block.hasOwnProperty(K.term.dataRangeValidMaxExc)) {
            if(value >= block[K.term.dataRangeValidMaxExc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                return false                                                    // ==>
            }
        }
    }

    return true                                                                 // ==>

} // validateRange()

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