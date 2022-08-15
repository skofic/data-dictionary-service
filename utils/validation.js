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
 * @param theDescriptor {String}: Descriptor name.
 * @param theValue {Any}: Descriptor value.
 * @param theReport {ValidationReport}: Status report.
  */
function validateDescriptor(theDescriptor, theValue, theReport)
{
    //
    // Load descriptor.
    //
    const descriptor = utils.getTerm(theDescriptor)
    if(descriptor !== false) {

        //
        // Check data block.
        //
        if(descriptor.hasOwnProperty(K.term.dataBlock)) {

            //
            // Validate data.
            //
            validateDataBlock(descriptor[K.term.dataBlock], theValue, theReport)
        }

        //
        // Missing data block.
        //
        else {
            theReport.status = K.error.kMSG_NO_DATA_BLOCK
        }
    }

    //
    // Unknown descriptor.
    //
    else {
        theReport.status = K.error.kMSG_DESCRIPTOR_NOT_FOUND
    }

} // validateDescriptor()

/**
 * Validate data block
 * This function will validate the provided data block
 * and return the status in the provided report.
 * The function will check if any of scalar, array, set or dictionary blocks
 * are set in the data block and run the corresponding function.
 * @param theBlock {Object}: The data block.
 * @param theValue {Any}: The descriptor's value.
 * @param theReport {ValidationReport}: The status report.
 */
function validateDataBlock(theBlock, theValue, theReport)
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
    // Validate scalar value.
    // We assume anything except an array is a scalar.
    //
    if(!utils.isArray(theValue)) {
        validateValue(theBlock, theReport, theValue)
    }

    //
    // Set error.
    //
    else {
        theReport.status = K.error.kMSG_NOT_SCALAR
    }

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
    // Check for data type.
    //
    if(theBlock.hasOwnProperty(K.term.dataType)) {

        //
        // Parse by type.
        //
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
                return true                                                     // ==>

            // GeoJSON.
            case K.term.dataTypeGeoJson:
                return true                                                     // ==>

            // Unsupported.
            default:
                theReport.status = K.error.kMSG_UNSUPPORTED_DATA_TYPE
                theReport.status["type"] = theBlock[K.term.dataType]

                return false                                                    // ==>
        }

    }

    //
    // Missing data type means any value will do.
    //
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
    //
    // Assert boolean value.
    //
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
    //
    // Assert integer value.
    //
    if(!utils.isInteger(theValue)) {
        theReport.status = K.error.kMSG_NOT_INT
        return false                                                            // ==>
    }

    //
    // Validate value range.
    //
    return validateRange(theBlock, theReport, theValue)                         // ==>

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
    //
    // Assert numeric value.
    //
    if(!utils.isNumber(theValue)) {
        theReport.status = K.error.kMSG_NOT_NUMBER
        return false                                                            // ==>
    }

    //
    // Validate value range.
    //
    return validateRange(theBlock, theReport, theValue)                         // ==>

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
    //
    // Assert string value.
    //
    if(!utils.isString(theValue)) {
        theReport.status = K.error.kMSG_NOT_STRING
        return false                                                            // ==>
    }

    //
    // Validate regular expression.
    //
    return validateRegexp(theBlock, theReport, theValue)                        // ==>

} // validateString()

/**
 * Validate record value
 * The function will return true if the reported value is a record handle.
 * Note that we assume the reference document to exist.
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
    // Assert enumeration type.
    //
    if(!theBlock.hasOwnProperty(K.term.dataKind)) {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
        return false                                                            // ==>
    }

    //
    // Value is a term key.
    //
    if(utils.checkTerm(theValue, theReport)) {

        //
        // Assume valid if term wildcard in among data kinds.
        // Note that the enumeration type wildcard should be the only element in the data kinds.
        //
        if(theBlock[K.term.dataKind].includes(K.term.anyTerm)) {
            return true                                                         // ==>
        }

        //
        // Validate enumeration graphs.
        //
        return validateEnumTerm(theBlock, theReport, theValue)                  // ==>
    }

    //
    // Value is an enumeration code.
    //
    return validateEnumCode(theBlock, theReport, theValue)                      // ==>

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
    const collection = module.context.collection(K.collection.term.name)

    //
    // Iterate enumeration types.
    // We already know that the block contains the data kinds...
    // We bail out if at least one type succeeds or fails.
    //
    for(const enumType of theBlock[K.term.dataKind]) {

        //
        // Assert enumeration type exists.
        //
        if(!utils.checkTerm(enumType, theReport)) {
            theReport.value = enumType
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE

            return false                                                        // ==>
        }

        //
        // Init query parameters.
        //
        let root = collection.name() + '/' + enumType
        let target = collection.name() + '/' + theValue

        //
        // Traverse graph.
        //
        const result = db._query( aql`
            WITH ${collection}
            FOR vertex, edge, path IN 1..10
                INBOUND ${root}
                GRAPH "schema"
                PRUNE ${enumType} IN edge._path AND
                      edge._predicate == ${K.term.predicateEnum} AND
                      (edge._to == ${target} OR
                        edge._from == ${target})
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${enumType} IN edge._path AND
                       edge._predicate == ${K.term.predicateEnum} AND
                       (edge._to == ${target} OR
                        edge._from == ${target})
            RETURN vertex._key
        `).toArray()

        //
        // Found at least one element.
        //
        if(result.length > 0) {

            //
            // Handle resolved value.
            //
            if(theValue !== result[0]) {
                theReport["resolved"] = result[0]
                theReport.status = K.error.kMSG_VALUE_RESOLVED
            }

            return true                                                         // ==>

        } // Found a match.

    } // Iterating enumeration types.

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
    // Init local storage.
    //
    const theCollection = module.context.collection(K.collection.term.name)

    //
    // Iterate enumeration types.
    // We bail out if at least one type succeeds or fails.
    //
    for(const enumType of theBlock[K.term.dataKind]) {

        //
        // Skip term wildcard.
        // We know value is not a term, so we ignore the value...
        // Note that the term wildcard should be the only element of the data kinds,
        // in that case this would have been already resolved by the caller.
        //
        if(enumType === K.term.anyTerm) {
            continue                                                    // =>
        }

        //
        // Assert data kind exists.
        //
        if(!utils.checkTerm(enumType, theReport)) {
            theReport.value = enumType
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE

            return false                                                        // ==>
        }

        //
        // Init query parameters.
        //
        const root = theCollection.name() + '/' + enumType

        //
        // Traverse graph.
        //
        const result = db._query( aql`
            WITH ${theCollection}
            FOR vertex, edge, path IN 1..10
                INBOUND ${root}
                GRAPH "schema"
                PRUNE ${enumType} IN edge._path AND
                      edge._predicate == ${K.term.predicateEnum} AND
                      ${theValue} IN vertex._code._aid
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${enumType} IN edge._path AND
                       edge._predicate == ${K.term.predicateEnum} AND
                      ${theValue} IN vertex._code._aid
            RETURN vertex._key
        `).toArray()

        //
        // Found at least one element.
        //
        if(result.length > 0) {

            //
            // Handle resolved value.
            //
            theReport["resolved"] = result[0]
            theReport.status = K.error.kMSG_VALUE_RESOLVED

            return true                                                         // ==>

        } // Found a match.

    } // Iterating enumeration types.

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
        // Assume valid if object wildcard in among data kinds.
        // Note that the object type wildcard should be the only element in the data kinds.
        //
        if(theBlock[K.term.dataKind].includes(K.term.anyObject)) {
            return true                                                         // ==>
        }

        //
        // Validate object type.
        // We bail out if at least one type succeeds.
        //
        return validateObjectTypes(theBlock, theReport, theValue)               // ==>
    }

    theReport.status = K.error.kMSG_BAD_DATA_BLOCK
    return false                                                                // ==>

} // validateObject()

/**
 * Validate descriptor object data types
 * The function will return true if the value is compatible with any of the bloc's data kinds.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateObjectTypes(theBlock, theReport, theValue)
{
    //
    // Handle object type wildcard.
    // We know the block has the data kind...
    // Note that the object type wildcard should be the only element in the data kinds.
    //
    if(theBlock[K.term.dataKind].includes(K.term.anyObject)) {
        return true                                                             // ==>
    }

    //
    // Iterate enumeration types.
    //
    for(const objectType of theBlock[K.term.dataKind]) {

        //
        // Assert and get object type.
        //
        const dataKind = utils.getTerm(objectType, theReport)
        if(dataKind === false) {
            theReport.value = objectType
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE

            return false                                                        // ==>
        }

        //
        // Assert kind is object definition.
        //
        if(!dataKind.hasOwnProperty(K.term.dataRule)) {
            theReport.value = objectType
            theReport.status = K.error.kMSG_NO_RULE_SECTION

            return false                                                        // ==>
        }

        //
        // Validate data kind value.
        //
        if(validateObjectType(dataKind[K.term.dataRule], theReport, theValue)) {
            return true                                                         // ==>
        }
    }

    theReport.status = K.error.kMSG_INVALID_OBJECT
    return false                                                                // ==>

} // validateObjectTypes()

/**
 * Validate object given data kind
 * The function will return true if the value is compatible with any of the bloc's data kinds.
 * @param theRule {Object}: The object definition rule.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateObjectType(theRule, theReport, theValue)
{
    //
    // Deep copy value - to add default values.
    //
    let value = JSON.parse(JSON.stringify(theValue))

    //
    // Add default values.
    //
    if(theRule.hasOwnProperty(K.term.dataRuleDefault)) {

        //
        // Add missing default values.
        //
        value = {
            ...theRule[K.term.dataRuleDefault],
            ...value
        }
    }

    //
    // Validate object structure.
    //
    if(!validateObjectStructure(theRule, theReport, value)) {
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateObjectType()

/**
 * Validate object structure.
 * The function will return true if the structure is valid.
 * @param theRule {Object}: The object definition rule.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateObjectStructure(theRule, theReport, theValue)
{
    //
    // Handle required.
    //
    if(!validateObjectRequired(theRule, theReport, theValue)) {
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateObjectStructure()

/**
 * Validate object required properties.
 * The function will return true if the structure contains all required properties.
 * @param theRule {Object}: The object definition rule.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateObjectRequired(theRule, theReport, theValue)
{
    //
    // Check required.
    //
    if(theRule.hasOwnProperty(K.term.dataRuleRequired)) {

        //
        // Init local storage.
        //
        let currentRule = theRule[K.term.dataRuleRequired]

        //
        // Check should contain one descriptor from the set.
        //
        if(theRule[K.term.dataRuleRequired].hasOwnProperty(K.term.dataRuleSelDescrOne)) {
            if(_.intersection(theValue.keys(), theRule[K.term.dataRuleRequired][K.term.dataRuleSelDescrOne]) !== 1) {
                theReport["set"] = theRule[K.term.dataRuleRequired][K.term.dataRuleSelDescrOne]
                theReport.status = K.error.kMSG_REQUIRED_ONE_PROPERTY

                return false                                                    // ==>
            }
        }
    }

    return true                                                                 // ==>

} // validateObjectStructure()

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
    //
    // Check if we have a range.
    //
    if(theBlock.hasOwnProperty(K.term.dataRangeValid)) {

        //
        // Minimum inclusive.
        //
        if(theBlock[K.term.dataRangeValid].hasOwnProperty(K.term.dataRangeValidMinInc)) {
            if(theValue < theBlock[K.term.dataRangeValid][K.term.dataRangeValidMinInc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                return false                                                    // ==>
            }
        }

        //
        // Minimum exclusive.
        //
        if(theBlock[K.term.dataRangeValid].hasOwnProperty(K.term.dataRangeValidMinExc)) {
            if(theValue <= theBlock[K.term.dataRangeValid][K.term.dataRangeValidMinExc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                return false                                                    // ==>
            }
        }

        //
        // Maximum inclusive.
        //
        if(theBlock[K.term.dataRangeValid].hasOwnProperty(K.term.dataRangeValidMaxInc)) {
            if(theValue > theBlock[K.term.dataRangeValid][K.term.dataRangeValidMaxInc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                return false                                                    // ==>
            }
        }

        //
        // Maximum exclusive.
        //
        if(theBlock[K.term.dataRangeValid].hasOwnProperty(K.term.dataRangeValidMaxExc)) {
            if(theValue >= theBlock[K.term.dataRangeValid][K.term.dataRangeValidMaxExc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                return false                                                    // ==>
            }
        }
    }

    return true                                                                 // ==>

} // validateRange()

/**
 * Validate regular expression
 * The function will return true if the string value matches the regular expression.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theReport {ValidationReport}: The status report.
 * @param theValue {Any}: The value to test.
 * @returns {boolean}: true means valid.
 */
function validateRegexp(theBlock, theReport, theValue)
{
    //
    // Check if we have a regular expression.
    //
    if (theBlock.hasOwnProperty(K.term.regexp)) {

        //
        // Instantiate regular expression.
        //
        const regexp = new RegExp(theBlock[K.term.regexp])

        //
        // Match value.
        //
        if (!theValue.match(regexp)) {
            theReport.status = K.error.kMSG_NO_REGEXP
            theReport.status["regexp"] = theBlock[K.term.regexp]
            return false                                                        // ==>
        }
    }

    return true                                                                 // ==>

} // validateRegexp()


module.exports = {
    validateDescriptor
}