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
const utils = require('./utils');                       // Utility functions.

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
    // Instantiate report and set value.
    //
    let report = new ValidationReport(name, value)

    //
    // Load descriptor.
    //
    const descriptor = utils.getTerm(name)
    if(descriptor === false) {
        report.status = K.error.kMSG_DESCRIPTOR_NOT_FOUND
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
    if(utils.isArray(theValue) || utils.isObject(theValue)) {
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
    if(utils.isArray(theValue)) {

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
    if(!utils.isBoolean(theValue)) {
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
    if(!utils.isInteger(theValue)) {
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
    if(!utils.isNumber(theValue)) {
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
    if(!utils.isString(theValue)) {
        theReport.status = K.error.kMSG_NOT_STRING
        return false                                                            // ==>
    }

    if(theBlock.hasOwnProperty(K.term.regexp)) {
        const regexp = new RegExp(theBlock[K.term.regexp])
        if(!theValue.match(regexp)) {
            theReport.status = K.error.kMSG_NO_REGEXP
            return false                                                        // ==>
        }
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
    //
    // Assert string.
    //
    if(!validateString(theBlock, theReport, theValue)) {
        return false                                                            // ==>
    }

    //
    // Assert record handle.
    //
    if(utils.checkDocument(theValue, theReport)) {
        return true                                                             // ==>
    }

    //
    // Set error.
    //
    theReport.status = K.error.kMSG_DOCUMENT_NOT_FOUND

    return false                                                                // ==>

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
    // Assert string.
    //
    if(!validateString(theBlock, theReport, theValue)) {
        return false                                                            // ==>
    }

    //
    // Assert it has enumeration type.
    //
    if(theBlock.hasOwnProperty(K.term.dataKind)) {

        //
        // The value is a term.
        //
        if(utils.checkTerm(theValue)) {
            return validateEnumTerm(theBlock, theReport, theValue)              // ==>
        }

        //
        // The value is an enumeration code.
        //
        return validateEnumCode(theBlock, theReport, theValue)                  // ==>

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
    // Handle term wildcard.
    // We already know that the value is a term...
    //
    if(theBlock[K.term.dataKind].includes(K.term.anyTerm)) {
        return true                                                             // ==>
    }

    //
    // Init local storage.
    //
    const collection = module.context.collection(K.collection.term.name)

    //
    // Iterate enumeration types.
    //
    for(const path of theBlock[K.term.dataKind]) {

        //
        // Skip term wildcard.
        //
        if(path == K.term.anyTerm) {
            continue                                                    // =>
        }

        //
        // Assert data kind exists.
        //
        if(!utils.checkTerm(path, theReport)) {
            theReport.value = path
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE

            return false                                                        // ==>
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
            if(theValue !== result[0]) {
                theReport.value = result[0]
                theReport.status = K.error.kMSG_VALUE_RESOLVED
            }
            return true                                                         // ==>
        }
    }

    theReport.status = K.error.kMSG_ENUM_NOT_FOUND
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
        // Init local storage.
        //
        const theCollection = module.context.collection(K.collection.term.name)

        //
        // Assert data kind exists.
        //
        if(!utils.checkTerm(path, theReport)) {
            theReport.value = path
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE

            return false                                                        // ==>
        }

        //
        // Traverse graph.
        //
        const root = theCollection.name() + '/' + path

        const result = db._query( aql`
            WITH ${theCollection}
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

    theReport.status = K.error.kMSG_TERM_NOT_FOUND
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
    //
    // Assert value is structure.
    //
    if(!utils.isObject(theValue)) {
        theReport.status = K.error.kMSG_NOT_OBJECT
        return false                                                            // ==>
    }

    //
    // Assert it has object type.
    //
    if(theBlock.hasOwnProperty(K.term.dataKind)) {

        //
        // Init local storage.
        //
        const collection = module.context.collection(K.collection.term.name)

        //
        // Validate object type.
        // We bail out if at least one type succeeds.
        //
        if(validateObjectType(theBlock, theReport,theValue, collection)) {
            return true                                                         // ==>
        }

    } else {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateObject()

/**
 * Validate object value
 * The function will return true if the value is compatible with any of the bloc's data kinds.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @param theCollection {Collection}: Terms collection.
 * @returns {boolean}: true means valid.
 */
function validateObjectType(theBlock, theReport, theValue, theCollection)
{
    //
    // Handle object type wildcard.
    //
    if(theBlock[K.term.dataKind].includes(K.term.anyObject)) {
        return true                                                             // ==>
    }

    //
    // Iterate enumeration types.
    //
    for(const kind of theBlock[K.term.dataKind]) {

        //
        // Handle object type wildcard.
        // Should succeed, since we already asserted value is a term.
        //
        if(kind == K.term.anyObject) {
            return true                                                         // ==>
        }

        //
        // Assert data kind exists.
        //
        const dataKind = utils.getTerm(kind, theReport)
        if(dataKind === false) {
            theReport.value = kind
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE

            return false                                                        // ==>
        }

        //
        // Add default values.
        //

    }

    theReport.status = K.error.kMSG_TERM_NOT_FOUND
    return false                                                                // ==>

} // validateObjectType()

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


module.exports = {
    validateDescriptor
}