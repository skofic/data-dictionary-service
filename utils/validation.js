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
 * @returns {boolean}: true means valid.
 */
function validateDescriptor(theDescriptor, theValue, theReport)
{
    //
    // Save current descriptor.
    //
    theReport["current"] = theDescriptor

    //
    // Load descriptor.
    //
    const descriptor = utils.getDescriptor(theDescriptor)

    //
    // Ignore unknown descriptors.
    //
    if(descriptor === false) {
        if(!theReport.hasOwnProperty("ignored")) {
            theReport["ignored"] = [theDescriptor]
        } else {
            theReport.ignored.push(theDescriptor)
        }

        return true                                                             // ==>
    }

    //
    // Validate data block.
    //
    return validateDataBlock(descriptor[K.term.dataBlock], theValue, theReport) // ==>

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
 * @returns {boolean}: true means valid.
 */
function validateDataBlock(theBlock, theValue, theReport)
{
    //
    // Check if it has an empty data block.
    //
    if(_.isEmpty(theBlock)) {
        return true                                                             // ==>
    }

    //
    // Parse scalar data block.
    //
    if(theBlock.hasOwnProperty(K.term.dataBlockScalar))
    {
        return validateScalar(
            theBlock[K.term.dataBlockScalar], theValue, theReport)              // ==>
    }

    //
    // Parse array data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockArray))
    {
        return validateArray(
            theBlock[K.term.dataBlockArray], theValue, theReport)               // ==>
    }

    //
    // Parse set data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockSet))
    {
        return validateSet(
            theBlock[K.term.dataBlockSet], theValue, theReport)                 // ==>
    }

    //
    // Parse dictionary data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockDict))
    {
        return validateDictionary(
            theBlock[K.term.dataBlockDict], theValue, theReport)                // ==>
    }

    //
    // Invalid data block.
    //
    theReport.status = K.error.kMSG_BAD_DATA_BLOCK
    theReport.status["block"] = theBlock
    return false                                                                // ==>

} // validateDataBlock()

/******************************************************************************/
/* DATA BLOCK FUNCTIONS                                                       /*
/******************************************************************************/

/**
 * Validate scalar value
 * The function expects the descriptor's scalar definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The scalar data block.
 * @param theValue {Any}: The scalar value.
 * @param theReport {ValidationReport}: The status report.
 */
function validateScalar(theBlock, theValue, theReport)
{
    //
    // Validate scalar value.
    // We assume anything except an array is a scalar.
    //
    if(!utils.isArray(theValue)) {

        //
        // Empty scalar block means all is fair in love.
        //
        if(_.isEmpty(theBlock)) {
            return true                                                         // ==>
        }

        //
        // Parse scalar block.
        //
        return  validateValue(theBlock, theValue, theReport)                    // ==>
    }

    theReport.status = K.error.kMSG_NOT_SCALAR
    theReport.status["value"] = theValue

    return false                                                                // ==>

} // validateScalar()

/**
 * Validate array value
 * The function expects the descriptor's array definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * Note that the leaf element of this data block can only be a scalar value.
 * @param theBlock {Object}: The array data block.
 * @param theValue {Any}: The array value.
 * @param theReport {ValidationReport}: The status report.
 */
function validateArray(theBlock, theValue, theReport)
{
    //
    // Check if value is an array.
    //
    if(utils.isArray(theValue)) {

        //
        // Handle array constraints.
        //
        if(theBlock.hasOwnProperty(K.term.dataRangeElements)) {
            const elements = theValue.length
            const block = theBlock[K.term.dataRangeElements]

            //
            // Minimum elements.
            //
            if(block.hasOwnProperty(K.term.dataRangeElementsMin)) {
                if(block[K.term.dataRangeElementsMin] > elements) {
                    theReport.status = K.error.kMSG_NOT_ENOUGH_ELEMENTS
                    theReport.status["elements"] = block
                    theReport.status["value"] = theValue

                    return false                                                // ==>
                }
            }

            //
            // Maximum elements.
            //
            if(block.hasOwnProperty(K.term.dataRangeElementsMax)) {
                if(block[K.term.dataRangeElementsMax] < elements) {
                    theReport.status = K.error.kMSG_TOO_MANY_ELEMENTS
                    theReport.status["elements"] = block
                    theReport.status["value"] = theValue

                    return false                                                // ==>
                }
            }
        }

        //
        // Validate array data block.
        //
        for(const value of theValue) {
            if(!validateDataBlock(theBlock, value, theReport)) {
                return false                                                    // ==>
            }
        }

        return true                                                             // ==>

    } // Value is array.

    theReport.status = K.error.kMSG_NOT_ARRAY
    theReport.status["value"] = theValue

    return false                                                                // ==>

} // validateArray()

/**
 * Validate set value
 * The function expects the descriptor's set definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The set data block.
 * @param theValue {Any}: The set value.
 * @param theReport {ValidationReport}: The status report.
 */
function validateSet(theBlock, theValue, theReport)
{
    //
    // Perform array validation.
    //
    if(!validateArray(theBlock, theValue, theReport)) {
        return false                                                            // ==>
    }

    //
    // Check for duplicates.
    //
    const test = new Set(theValue)
    if(test.size !== theValue.length) {
        theReport.status = K.error.kMSG_DUP_SET
        theReport.status["value"] = theValue

        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateSet()

/**
 * Validate dictionary value
 * The function expects the descriptor's dictionary definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The dictionary value.
 * @param theReport {ValidationReport}: The status report.
 */
function validateDictionary(theBlock, theValue, theReport)
{
    //
    // Check data dictionary key block.
    //
    if(! theBlock.hasOwnProperty(K.term.dataDictionaryKey)) {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
        theReport.status["property"] = K.term.dataDictionaryKey
        theReport.status["block"] = theBlock

        return false                                                            // ==>
    }

    //
    // Check data dictionary value block.
    //
    if(!theBlock.hasOwnProperty(K.term.dataDictionaryValue)) {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
        theReport.status["property"] = K.term.dataDictionaryValue
        theReport.status["block"] = theBlock

        return false                                                            // ==>
    }

    //
    // Iterate dictionary by key.
    //
    for(const key of Object.keys(theValue)) {

        //
        // Validate key.
        //
        if(!validateValue(theBlock[K.term.dataDictionaryKey], key, theReport)) {
            return false                                                        // ==>
        }

        //
        // Validate value.
        //
        if(!validateDataBlock(theBlock[K.term.dataDictionaryValue], theValue[key], theReport)) {
            return false                                                        // ==>
        }
    }

    return true                                                                 // ==>

} // validateDictionary()

/**
 * Validate data value
 * The function will validate the value provided in the report structure according
 * to the data type defined in the provided descriptor data block.
 * The value is expected to be .
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateValue(theBlock, theValue, theReport)
{
    //
    // Get type definition.
    //
    let type = null
    if(theBlock.hasOwnProperty(K.term.dataType)) {
        type = K.term.dataType
    }
    else if(theBlock.hasOwnProperty(K.term.dataDictKeyType)) {
        type = K.term.dataDictKeyType
    } else {

        //
        // Missing data type means any value will do.
        //
        return true                                                             // ==>
    }

    //
    // Parse by type.
    //
    switch(theBlock[type]) {

        // Boolean.
        case K.term.dataTypeBool:
            return validateBoolean(theBlock, theValue, theReport)               // ==>

        // Integer.
        case K.term.dataTypeInteger:
            return validateInteger(theBlock, theValue, theReport)               // ==>

        // Float.
        case K.term.dataTypeNumber:
            return validateNumber(theBlock, theValue, theReport)                // ==>

        // String.
        case K.term.dataTypeString:
            return validateString(theBlock, theValue, theReport)                // ==>

        // Object.
        case K.term.dataTypeObject:
            return validateObject(theBlock, theValue, theReport)                // ==>

        // Enumeration.
        case K.term.dataTypeEnum:
            return validateEnum(theBlock, theValue, theReport)                  // ==>

        // Record reference.
        case K.term.dataTypeRecord:
            return validateRecord(theBlock, theValue, theReport)                // ==>

        // Timestamp.
        case K.term.dataTypeTimestamp:
            return true                                                         // ==>

        // GeoJSON.
        case K.term.dataTypeGeoJson:
            return true                                                         // ==>

        // Unsupported.
        default:
            theReport.status = K.error.kMSG_UNSUPPORTED_DATA_TYPE
            theReport.status["type"] = theBlock[type]

            return false                                                        // ==>

    } // Parse type.

} // validateValue()

/**
 * Validate boolean value
 * The function will return true if the reported value is a boolean.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateBoolean(theBlock, theValue, theReport)
{
    //
    // Assert boolean value.
    //
    if(!utils.isBoolean(theValue)) {
        theReport.status = K.error.kMSG_NOT_BOOL
        theReport.status["value"] = theValue

        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateBoolean()

/**
 * Validate integer value
 * The function will return true if the reported value is an integer.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateInteger(theBlock, theValue, theReport)
{
    //
    // Assert integer value.
    //
    if(!utils.isInteger(theValue)) {
        theReport.status = K.error.kMSG_NOT_INT
        theReport.status["value"] = theValue

        return false                                                            // ==>
    }

    //
    // Validate value range.
    //
    return validateRange(theBlock, theValue, theReport)                         // ==>

} // validateInteger()

/**
 * Validate number value
 * The function will return true if the reported value is a float or integer.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateNumber(theBlock, theValue, theReport)
{
    //
    // Assert numeric value.
    //
    if(!utils.isNumber(theValue)) {
        theReport.status = K.error.kMSG_NOT_NUMBER
        theReport.status["value"] = theValue

        return false                                                            // ==>
    }

    //
    // Validate value range.
    //
    return validateRange(theBlock, theValue, theReport)                         // ==>

} // validateNumber()

/**
 * Validate string value
 * The function will return true if the reported value is a string.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateString(theBlock, theValue, theReport)
{
    //
    // Assert string value.
    //
    if(!utils.isString(theValue)) {
        theReport.status = K.error.kMSG_NOT_STRING
        theReport.status["value"] = theValue

        return false                                                            // ==>
    }

    //
    // Validate regular expression.
    //
    return validateRegexp(theBlock, theValue, theReport)                        // ==>

} // validateString()

/**
 * Validate record value
 * The function will return true if the reported value is a record handle.
 * Note that we assume the reference document to exist.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The handle to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateRecord(theBlock, theValue, theReport)
{
    //
    // Assert string.
    //
    if(!validateString(theBlock, theValue, theReport)) {
        return false                                                            // ==>
    }

    //
    // Assert record handle.
    //
    if(!utils.checkDocument(theValue, theReport)) {
        theReport.status = K.error.kMSG_DOCUMENT_NOT_FOUND
        theReport.status["value"] = theValue

        return false                                                            // ==>
    }

    return true                                                                 // ==>

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
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateEnum(theBlock, theValue, theReport)
{
    //
    // Assert string.
    //
    if(!validateString(theBlock, theValue, theReport)) {
        return false                                                            // ==>
    }

    //
    // Assert enumeration type.
    //
    if(!theBlock.hasOwnProperty(K.term.dataKind)) {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
        theReport.status["block"] = theBlock

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
        // Traverse enumeration graph.
        //
        return validateEnumTerm(theBlock, theValue, theReport)                  // ==>
    }

    //
    // Value is an enumeration code.
    //
    return validateEnumCode(theBlock, theValue, theReport)                      // ==>

} // validateEnum()

/**
 * Validate enumeration key value
 * The function will return true if the reported term key value is an enumeration
 * belonging to the enumeration type.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateEnumTerm(theBlock, theValue, theReport)
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
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE
            theReport.status["type"] = enumType

            return false                                                        // ==>
        }

        //
        // Handle root is same as target.
        // In this case we would bet the first level of rootìs elements,
        // for that reason we force the value as a code, instead.
        //
        if(enumType === theValue) {
            return validateEnumCode(theBlock, theValue, theReport)              // ==>
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

    theReport.status = K.error.kMSG_TERM_NOT_FOUND
    theReport.status["value"] = theValue

    return false                                                                // ==>

} // validateEnumTerm()

/**
 * Validate enumeration key value
 * The function will return true if the reported term key value is an enumeration
 * belonging to the enumeration type.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateEnumCode(theBlock, theValue, theReport)
{
    //
    // Init local storage.
    //
    const collection = module.context.collection(K.collection.term.name)

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
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE
            theReport.status["type"] = enumType

            return false                                                        // ==>
        }

        //
        // Init query parameters.
        //
        const root = collection.name() + '/' + enumType

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

    theReport.status = K.error.kMSG_ENUM_NOT_FOUND
    theReport.status["value"] = theValue
    return false                                                                // ==>

} // validateEnumCode()

/**
 * Validate object value
 * The function will return true if the reported value is an object.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateObject(theBlock, theValue, theReport)
{
    //
    // Assert value is structure.
    //
    if(!utils.isObject(theValue)) {
        theReport.status = K.error.kMSG_NOT_OBJECT
        theReport.status["value"] = theValue

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
        return validateObjectTypes(theBlock, theValue, theReport)               // ==>
    }

    theReport.status = K.error.kMSG_BAD_DATA_BLOCK
    theReport.status["block"] = theBlock

    return false                                                                // ==>

} // validateObject()

/**
 * Validate descriptor object data types
 * The function will return true if the value is compatible with any of the bloc's data kinds.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateObjectTypes(theBlock, theValue, theReport)
{
    //
    // Iterate enumeration types.
    //
    for(const objectType of theBlock[K.term.dataKind]) {

        //
        // Assert and get object type.
        //
        const dataKind = utils.getTerm(objectType, theReport)
        if(dataKind === false) {
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE
            theReport.status["type"] = objectType

            return false                                                        // ==>
        }

        //
        // Assert kind is object definition.
        //
        if(!dataKind.hasOwnProperty(K.term.dataRule)) {
            theReport.status = K.error.kMSG_NO_RULE_SECTION
            theReport.status["type"] = objectType

            return false                                                        // ==>
        }

        //
        // Validate data kind value.
        //
        if(validateObjectType(dataKind[K.term.dataRule], theValue, theReport)) {
            return true                                                         // ==>
        }
    }

    return false                                                                // ==>

} // validateObjectTypes()

/**
 * Validate object given data kind
 * The function will return true if the value is compatible with any of the bloc's data kinds.
 * @param theBlock {Object}: The object definition rule.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateObjectType(theBlock, theValue, theReport)
{
    //
    // Deep copy value - to add default values.
    //
    let value = JSON.parse(JSON.stringify(theValue))

    //
    // Add default values.
    //
    if(theBlock.hasOwnProperty(K.term.dataRuleDefault)) {

        //
        // Add missing default values.
        //
        value = {
            ...theBlock[K.term.dataRuleDefault],
            ...value
        }
    }

    //
    // Validate object structure.
    //
    if(!validateObjectStructure(theBlock, value, theReport)) {
        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateObjectType()

/**
 * Validate object structure.
 * The function will return true if the structure is valid.
 * @param theBlock {Object}: The object definition rule.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateObjectStructure(theBlock, theValue, theReport)
{
    //
    // Handle required.
    //
    if(!validateObjectRequired(theBlock, theValue, theReport)) {
        return false                                                            // ==>
    }

    //
    // Traverse object.
    //
    for(const [descriptor, value] of Object.entries(theValue)) {
        if(!validateDescriptor(descriptor, value, theReport)) {
            return false
        }
    }

    return true                                                                 // ==>

} // validateObjectStructure()

/**
 * Validate object required properties.
 * The function will return true if the structure contains all required properties.
 * @param theBlock {Object}: The object definition rule.
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateObjectRequired(theBlock, theValue, theReport)
{
    //
    // Check required.
    //
    if(theBlock.hasOwnProperty(K.term.dataRuleRequired)) {

        //
        // Init local storage.
        //
        const rule = theBlock[K.term.dataRuleRequired]
        const keys = Object.keys(theValue)

        //
        // Check should contain one descriptor from the set.
        //
        if(rule.hasOwnProperty(K.term.dataRuleSelDescrOne)) {
            const set = rule[K.term.dataRuleSelDescrOne]
             if(_.intersection(keys, set) !== 1) {
                theReport.status = K.error.kMSG_REQUIRED_ONE_PROPERTY
                 theReport.status["value"] = theValue
                 theReport.status["set"] = set

                return false                                                    // ==>
            }
        }

        //
        // Check should contain one descriptor from the set or none.
        //
        if(rule.hasOwnProperty(K.term.dataRuleSelDescrOneNone)) {
            const set = rule[K.term.dataRuleSelDescrOneNone]
            if(_.intersection(keys, set) > 1) {
                theReport.status = K.error.kMSG_REQUIRED_ONE_NONE_PROPERTY
                theReport.status["value"] = theValue
                theReport.status["set"] = set

                return false                                                    // ==>
            }
        }

        //
        // Check should contain one or more descriptors from the set.
        //
        if(rule.hasOwnProperty(K.term.dataRuleSelDescrAny)) {
            const set = rule[K.term.dataRuleSelDescrAny]
            if(_.intersection(keys, set) === 0) {
                theReport.status = K.error.kMSG_REQUIRED_ANY_PROPERTY
                theReport.status["value"] = theValue
                theReport.status["set"] = set

                return false                                                    // ==>
            }
        }

        //
        // Check should contain one or no descriptors from each set in the list
        // and at least one entry in the result.
        //
        if(rule.hasOwnProperty(K.term.dataRuleSelDescrAnyOne)) {

            if(value.keys().length === 0) {
                theReport.status = K.error.kMSG_REQUIRED_ONE_SELECTION

                return false                                                    // ==>
            }

            for(const element in rule[K.term.dataRuleSelDescrAnyOne]) {
                if(_.intersection(keys, element) > 1) {
                    theReport.status = K.error.kMSG_REQUIRED_MORE_ONE_SELECTION
                    theReport.status["value"] = theValue
                    theReport.status["set"] = element

                    return false                                                // ==>
                }
            }
        }

        //
        // Check should contain all descriptors from the set.
        //
        if(rule.hasOwnProperty(K.term.dataRuleSelDescrAll)) {
            const set = rule[K.term.dataRuleSelDescrAll]
            if(_.intersection(keys, set).length !== set.length) {
                theReport.status = K.error.kMSG_REQUIRED_ALL_SELECTION
                theReport.status["value"] = theValue
                theReport.status["set"] = set

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
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateRange(theBlock, theValue, theReport)
{
    //
    // Check if we have a range.
    //
    if(theBlock.hasOwnProperty(K.term.dataRangeValid)) {
        const range = theBlock[K.term.dataRangeValid]

        //
        // Minimum inclusive.
        //
        if(range.hasOwnProperty(K.term.dataRangeValidMinInc)) {
            if(theValue < range[K.term.dataRangeValidMinInc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                theReport.status["value"] = theValue
                theReport.status["range"] = range

                return false                                                    // ==>
            }
        }

        //
        // Minimum exclusive.
        //
        if(range.hasOwnProperty(K.term.dataRangeValidMinExc)) {
            if(theValue <= range[K.term.dataRangeValidMinExc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                theReport.status["value"] = theValue
                theReport.status["range"] = range

                return false                                                    // ==>
            }
        }

        //
        // Maximum inclusive.
        //
        if(range.hasOwnProperty(K.term.dataRangeValidMaxInc)) {
            if(theValue > range[K.term.dataRangeValidMaxInc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                theReport.status["value"] = theValue
                theReport.status["range"] = range

                return false                                                    // ==>
            }
        }

        //
        // Maximum exclusive.
        //
        if(range.hasOwnProperty(K.term.dataRangeValidMaxExc)) {
            if(theValue >= range[K.term.dataRangeValidMaxExc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                theReport.status["value"] = theValue
                theReport.status["range"] = range

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
 * @param theValue {Any}: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateRegexp(theBlock, theValue, theReport)
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
            theReport.status["value"] = theValue
            theReport.status["regexp"] = theBlock[K.term.regexp]
            return false                                                        // ==>
        }
    }

    return true                                                                 // ==>

} // validateRegexp()


module.exports = {
    validateDescriptor
}