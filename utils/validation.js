'use strict';

//
// Import frameworks.
//
const _ = require('lodash');                            // Lodash library.
const aql = require('@arangodb').aql;					// AQL queries.

//
// Import resources.
//
const K = require( './constants' );					    // Application constants.
const utils = require('./utils');
const dictionary = require('./dictionary');             // Dictionary functions.
const {checkEnum} = require("./utils");                 // Utility functions.


/******************************************************************************
 * Public functions
 ******************************************************************************/

/**
 * Validate descriptor.
 * The function expects a descriptor name and its value: it will check whether
 * the value corresponds to the descriptor definition.
 * @param theDescriptor {String}: Descriptor name.
 * @param theValue {Array}: Tuple: the value parent and the key to the value.
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
        theReport["ignored"].push(theDescriptor)
        return true                                                             // ==>
    }

    //
    // Validate data block.
    // Note that getDescriptor() returns a descriptor_
    // we know it has the data block.
    //
    return validateDataBlock(descriptor[K.term.dataBlock], theValue, theReport) // ==>

} // validateDescriptor()


/******************************************************************************
 * Local functions
 ******************************************************************************/

/**
 * Validate data block
 * This function will validate the provided data block
 * and return the status in the provided report.
 * The function will check if any of scalar, array, set or dictionary blocks
 * are set in the data block and run the corresponding function.
 * @param theBlock {Object}: The data block.
 * @param theValue {Array}: Tuple: the parent value and the key to the value.
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
    // Parse set scalar data block.
    //
    else if(theBlock.hasOwnProperty(K.term.dataBlockSetScalar))
    {
        return validateScalar(
            theBlock[K.term.dataBlockSetScalar], theValue, theReport)           // ==>
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
    theReport.status["required"] = [
        K.term.dataBlockScalar,     // Scalar.
        K.term.dataBlockArray,      // Array.
        K.term.dataBlockSet,        // Set.
        K.term.dataBlockDict        // Dictionary.
    ]
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
 * @param theValue: The scalar value.
 * @param theReport {ValidationReport}: The status report.
 */
function validateScalar(theBlock, theValue, theReport)
{
    //
    // Validate scalar value.
    // We assume anything except an array is a scalar.
    //
    if(!utils.isArray(theValue[0][theValue[1]])) {

        //
        // Empty scalar block means all is fair in love.
        //
        if(_.isEmpty(theBlock)) {
            return true                                                         // ==>
        }

        //
        // Parse scalar block.
        //
        return validateValue(theBlock, theValue, theReport)                     // ==>
    }

    theReport.status = K.error.kMSG_NOT_SCALAR
    theReport.status["value"] = theValue[0][theValue[1]]

    return false                                                                // ==>

} // validateScalar()

/**
 * Validate array value
 * The function expects the descriptor's array definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * Note that the leaf element of this data block can only be a scalar value.
 * @param theBlock {Object}: The array data block.
 * @param theValue: The array value.
 * @param theReport {ValidationReport}: The status report.
 */
function validateArray(theBlock, theValue, theReport)
{
    //
    // Check if value is an array.
    //
    if(utils.isArray(theValue[0][theValue[1]])) {

        //
        // Handle array constraints.
        //
        if(theBlock.hasOwnProperty(K.term.dataRangeElements)) {
            const elements = theValue[0][theValue[1]].length
            const block = theBlock[K.term.dataRangeElements]

            //
            // Minimum elements.
            //
            if(block.hasOwnProperty(K.term.dataRangeElementsMin)) {
                if(block[K.term.dataRangeElementsMin] > elements) {
                    theReport.status = K.error.kMSG_NOT_ENOUGH_ELEMENTS
                    theReport.status["elements"] = block
                    theReport.status["value"] = theValue[0][theValue[1]]

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
                    theReport.status["value"] = theValue[0][theValue[1]]

                    return false                                                // ==>
                }
            }
        }

        //
        // Skip validation if block is empty or only has elements.
        //
        if(theBlock.hasOwnProperty(K.term.dataRangeElements) || _.isEmpty(theBlock)) {
            return true                                                         // ==>
        }

        //
        // Validate array data block.
        //
        for(let i = 0; i < theValue[0][theValue[1]].length; i++) {
            if(!validateDataBlock(theBlock, [theValue[0][theValue[1]], i], theReport)) {
                return false                                                    // ==>
            }
        }
        // for(const value of theValue[0][1]) {
        //     if(!validateDataBlock(theBlock, value, theReport)) {
        //         return false                                                    // ==>
        //     }
        // }

        return true                                                             // ==>

    } // Value is array.

    theReport.status = K.error.kMSG_NOT_ARRAY
    theReport.status["value"] = theValue[0][theValue[1]]

    return false                                                                // ==>

} // validateArray()

/**
 * Validate set value
 * The function expects the descriptor's set definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The set data block.
 * @param theValue: The set value.
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
    const test = new Set(theValue[0][theValue[1]])
    if(test.size !== theValue[0][theValue[1]].length) {
        theReport.status = K.error.kMSG_DUP_SET
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateSet()

/**
 * Validate dictionary
 * The function expects the descriptor's dictionary definition and the value,
 * it should ensure the value is valid and return the converted value if successful.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The dictionary value.
 * @param theReport {ValidationReport}: The status report.
 * @returns {Boolean}: True means valid.
 */
function validateDictionary(theBlock, theValue, theReport)
{
    //
    // Assert value is structure.
    //
    if(!utils.isObject(theValue[0][theValue[1]])) {
        theReport.status = K.error.kMSG_NOT_OBJECT
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    //
    // Check data dictionary key block.
    //
    if(!theBlock.hasOwnProperty(K.term.dataDictionaryKey)) {
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
    // Prevent scalar data type in dictionary blocks.
    //
    if(theBlock[K.term.dataDictionaryKey].hasOwnProperty(K.term.dataType)) {
        theReport.status = K.error.kMSG_UNSUPPORTED_DATA_TYPE
        theReport.status["property"] = K.term.dataType
        theReport.status["block"] = theBlock

        return false                                                            // ==>
    }

    //
    // Get list of dictionary keys.
    //
    const props = Object.keys(theValue[0][theValue[1]])

    //
    // Preload enumerations and keys.
    //
    if(theBlock[K.term.dataDictionaryKey][K.term.dataDictKeyType] === K.term.dataTypeString
    || theBlock[K.term.dataDictionaryKey][K.term.dataDictKeyType] === K.term._type_string_key) {
        utils.loadCache(props)
    }

    //
    // Load dictionary keys.
    //
    let keys = {}
    for(const key of props) {
        keys[key] = key
    }

    //
    // Iterate dictionary by key.
    //
    for(const key of props) {

        //
        // Validate key.
        //
        if(!validateValue(theBlock[K.term.dataDictionaryKey], [keys, key], theReport)) {
            return false                                                        // ==>
        }

        //
        // Validate value.
        //
        if(!validateDataBlock(theBlock[K.term.dataDictionaryValue], [theValue[0][theValue[1]], key], theReport)) {
            return false                                                        // ==>
        }
    }

    //
    // Handle resolved enumeration keys.
    //
    for(const key of Object.keys(keys)) {

        //
        // Key changed.
        //
        if(keys[key] !== key) {

            //
            // Clone old key value in new key.
            //
            theValue[0][theValue[1]][keys[key]] = JSON.parse(JSON.stringify(theValue[0][theValue[1]][key]))

            //
            // Delete old key value.
            //
            delete theValue[0][theValue[1]][key]
        }
    }

    return true                                                                 // ==>

} // validateDictionary()

/**
 * Validate data value
 * The function will validate the scalar value provided in the report structure according
 * to the data type defined in the provided descriptor data block.
 * The value is expected to be .
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateValue(theBlock, theValue, theReport)
{
    //
    // Determine data type.
    //
    let type = null
    //
    // First intercept dictionary key type.
    //
    if(theBlock.hasOwnProperty(K.term.dataDictKeyType)) {
        type = K.term.dataDictKeyType
    }
    //
    // Second intercept scalar value type.
    //
    else if(theBlock.hasOwnProperty(K.term.dataSetType)) {
        type = K.term.dataSetType
    }
    //
    // Second intercept scalar value type.
    //
    else if(theBlock.hasOwnProperty(K.term.dataType)) {
        type = K.term.dataType
    }
    //
    // If both are missing, any data type is good.
    //
    else {
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

        // Timestamp.
        case K.term.dataTypeTimestamp:
            return validateTimestamp(theBlock, theValue, theReport)             // ==>

        // String.
        case K.term.dataTypeString:
            return validateString(theBlock, theValue, theReport)                // ==>

        // Document key.
        case K.term.dataTypeKey:
            return validateKey(theBlock, theValue, theReport)                   // ==>

        // Document handle.
        case K.term.dataTypeHandle:
            return validateHandle(theBlock, theValue, theReport)                // ==>

        // Enumeration.
        case K.term.dataTypeEnum:
            return validateEnum(theBlock, theValue, theReport)                  // ==>

        // Object.
        case K.term.dataTypeObject:
            return validateObject(theBlock, theValue, theReport)                // ==>

        // GeoJSON.
        case K.term.dataTypeGeoJson:
            theReport.status = K.error.kMSG_UNIMPLEMENTED_DATA_TYPE
            theReport.status["type"] = theBlock[type]
            return false                                                        // ==>

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
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateBoolean(theBlock, theValue, theReport)
{
    //
    // Assert boolean value.
    //
    if(!utils.isBoolean(theValue[0][theValue[1]])) {
        theReport.status = K.error.kMSG_NOT_BOOL
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateBoolean()

/**
 * Validate integer value
 * The function will return true if the reported value is an integer.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateInteger(theBlock, theValue, theReport)
{
    //
    // Assert integer value.
    //
    if(!utils.isInteger(theValue[0][theValue[1]])) {
        theReport.status = K.error.kMSG_NOT_INT
        theReport.status["value"] = theValue[0][theValue[1]]

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
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateNumber(theBlock, theValue, theReport)
{
    //
    // Assert numeric value.
    //
    if(!utils.isNumber(theValue[0][theValue[1]])) {
        theReport.status = K.error.kMSG_NOT_NUMBER
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    //
    // Validate value range.
    //
    return validateRange(theBlock, theValue, theReport)                         // ==>

} // validateNumber()

/**
 * Validate timestamp value
 * If the value is a number, the function will assume it is a unix time,
 * if the value is a string, the function will try to interpret it as a date:
 * if the operation succeeds, the function will return true.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateTimestamp(theBlock, theValue, theReport)
{
    //
    // Handle numbers.
    //
    if(utils.isNumber(theValue[0][theValue[1]])) {
        return validateRange(theBlock, theValue, theReport)                     // ==>
    }

    //
    // Handle string.
    //
    if(utils.isString(theValue[0][theValue[1]])) {
        const timestamp = new Date(theValue[0][theValue[1]])
        if(!isNaN(timestamp.valueOf())) {
            theValue[0][theValue[1]] = timestamp.valueOf()

            return validateRange(theBlock, theValue, theReport)                 // ==>
        }
    }

    theReport.status = K.error.kMSG_NOT_TIMESTAMP
    theReport.status["value"] = theValue[0][theValue[1]]

    return false                                                                // ==>

} // validateTimestamp()

/**
 * Validate string value
 * The function will return true if the reported value is a string.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @param doRegexp {Boolean}: If true it is a string (default), if false an enumeration.
 * @returns {boolean}: true means valid.
 */
function validateString(theBlock, theValue, theReport, doRegexp = true)
{
    //
    // Assert string value.
    //
    if(!utils.isString(theValue[0][theValue[1]])) {
        theReport.status = K.error.kMSG_NOT_STRING
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    //
    // Validate regular expression.
    //
    if(doRegexp) {
        return validateRegexp(theBlock, theValue, theReport)                    // ==>
    }

    return true                                                                 // ==>

} // validateString()

/**
 * Validate document term key
 * The function will return true if the reported value is a terms document _key.
 * Note that we assume the reference document to exist.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The handle to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateKey(theBlock, theValue, theReport)
{
    //
    // Assert string.
    //
    if(!validateString(
        theBlock,
        theValue,
        theReport,
        (theBlock[K.term.dataTypeKey] !== K.term.dataTypeEnum))
    ) {
        return false                                                            // ==>
    }

    //
    // Skip empty namespace.
    //
    if(theValue[0][theValue[1]].length === 0) {
        return true                                                             // =>
    }

    //
    // Assert terms record key.
    //
    const term = utils.getTerm(theValue[0][theValue[1]], theReport)
    if(term === false) {
        theReport.status = K.error.kMSG_TERM_NOT_FOUND
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    //
    // Handle data kind.
    //
    if(theBlock.hasOwnProperty(K.term.dataKind)) {

        //
        // Ensure data kind is an array.
        //
        if(!utils.isArray(theBlock[K.term.dataKind])) {
            theReport.status = K.error.kMSG_DATA_KIND_NOT_ARRAY
            theReport.status["kind"] = theBlock[K.term.dataKind]

            return false                                                        // ==>
        }

        //
        // Iterate data kinds.
        //
        for(const enumType of theBlock[K.term.dataKind]) {
            switch(enumType) {

                case K.term.anyTerm:
                    return true                                                 // ==>

                case K.term.anyEnum:
                    return checkEnum(term._key, theReport)                      // ==>

                case K.term.anyObject:
                    if(term.hasOwnProperty(K.term.ruleBlock)) {
                        return true                                             // ==>
                    }
                    theReport.status = K.error.kMSG_NO_RULE_SECTION
                    theReport.status["value"] = term._key
                    return false                                                // ==>

                case K.term.anyDescriptor:
                    if(term.hasOwnProperty(K.term.dataBlock)) {
                        return true                                             // ==>
                    }
                    theReport.status = K.error.kMSG_DESCRIPTOR_NOT_FOUND
                    theReport.status["value"] = term._key
                    return false                                                // ==>
            }
        }
    }

    return true                                                                 // ==>

} // validateKey()

/**
 * Validate document handle
 * The function will return true if the reported value is a document handle.
 * Note that we assume the reference document to exist.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The handle to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateHandle(theBlock, theValue, theReport)
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
    if(!utils.checkDocument(theValue[0][theValue[1]], theReport)) {
        theReport.status = K.error.kMSG_DOCUMENT_NOT_FOUND
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    return true                                                                 // ==>

} // validateHandle()

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
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateEnum(theBlock, theValue, theReport)
{
    //
    // Assert string.
    //
    if(!validateString(theBlock, theValue, theReport, false)) {
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
    // Assert data kind is an array.
    //
    if(!utils.isArray(theBlock[K.term.dataKind])) {
        theReport.status = K.error.kMSG_DATA_KIND_NOT_ARRAY
        theReport.status["kind"] = theBlock[K.term.dataKind]

        return false                                                            // ==>
    }

    //
    // Value is a term key.
    //
    if(utils.checkTerm(theValue[0][theValue[1]], theReport)) {

        //
        // Assume valid if term wildcard in among data kinds.
        // Note that the enumeration type wildcard should be the only element in the data kinds.
        // In any case, we check for correct values and exit with success, if not we continue.
        //
        if(theBlock[K.term.dataKind].includes(K.term.anyTerm)) {
            return true                                                         // ==>
        }

        //
        // Handle any enumeration.
        //
        if(theBlock[K.term.dataKind].includes(K.term.anyEnum)) {
            if(utils.checkEnum(theValue[0][theValue[1]], theReport)) {
                return true                                                     // ==>
            }
        }

        //
        // Handle any descriptor.
        //
        if(theBlock[K.term.dataKind].includes(K.term.anyDescriptor)) {
            if(utils.checkDescriptor(theValue[0][theValue[1]], theReport)) {
                return true                                                     // ==>
            }
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
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateEnumTerm(theBlock, theValue, theReport)
{
    //
    // Assert data kind is an array.
    //
    if(!utils.isArray(theBlock[K.term.dataKind])) {
        theReport.status = K.error.kMSG_DATA_KIND_NOT_ARRAY
        theReport.status["kind"] = theBlock[K.term.dataKind]

        return false                                                            // ==>
    }

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
        // In this case we would bet the first level of root elements,
        // for that reason we force the value as a code, instead.
        //
        if(enumType === theValue[0][theValue[1]]) {
            return validateEnumCode(theBlock, theValue, theReport)              // ==>
        }

        //
        // Traverse graph.
        //
        const result = dictionary.matchEnumerationTermKey(enumType, theValue[0][theValue[1]])

        //
        // Found at least one element.
        //
        if(result.length > 0) {

            //
            // Handle resolved value.
            //
            if(theValue[0][theValue[1]] !== result[0]) {
                utils.reportResolved(theValue[1], theValue[0][theValue[1]], theReport)
                theValue[0][theValue[1]] = result[0]
                // theReport.status = K.error.kMSG_VALUE_RESOLVED
            }

            return true                                                         // ==>

        } // Found a match.

    } // Iterating enumeration types.

    theReport.status = K.error.kMSG_TERM_NOT_FOUND
    theReport.status["value"] = theValue[0][theValue[1]]

    return false                                                                // ==>

} // validateEnumTerm()

/**
 * Validate enumeration key value
 * The function will return true if the reported term key value is an enumeration
 * belonging to the enumeration type.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateEnumCode(theBlock, theValue, theReport)
{
    //
    // Assert data kind is an array.
    //
    if(!utils.isArray(theBlock[K.term.dataKind])) {
        theReport.status = K.error.kMSG_DATA_KIND_NOT_ARRAY
        theReport.status["kind"] = theBlock[K.term.dataKind]

        return false                                                            // ==>
    }

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
        // Traverse graph.
        //
        const result = dictionary.matchEnumerationCodeKey(enumType, theValue[0][theValue[1]])

        //
        // Found at least one element.
        //
        if(result.length > 0) {

            //
            // Handle resolved value.
            //
            utils.reportResolved(theValue[1], theValue[0][theValue[1]], theReport)
            theValue[0][theValue[1]] = result[0]
            // MILKO - Disable to set zero status code.
            theReport.status = K.error.kMSG_VALUE_RESOLVED

            return true                                                         // ==>

        } // Found a match.

    } // Iterating enumeration types.

    theReport.status = K.error.kMSG_ENUM_NOT_FOUND
    theReport.status["value"] = theValue[0][theValue[1]]
    return false                                                                // ==>

} // validateEnumCode()

/**
 * Validate object value
 * The function will return true if the reported value is an object.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateObject(theBlock, theValue, theReport)
{
    //
    // Assert value is structure.
    // Global error: not an object.
    //
    if(!utils.isObject(theValue[0][theValue[1]])) {
        theReport.status = K.error.kMSG_NOT_OBJECT
        theReport.status["value"] = theValue[0][theValue[1]]

        return false                                                            // ==>
    }

    //
    // Assert object type.
    // Object type requires data kind.
    //
    if(!theBlock.hasOwnProperty(K.term.dataKind)) {
        theReport.status = K.error.kMSG_BAD_DATA_BLOCK
        theReport.status["block"] = theBlock

        return false                                                            // ==>
    }

    //
    // Assert data kind is an array.
    //
    if(!utils.isArray(theBlock[K.term.dataKind])) {
        theReport.status = K.error.kMSG_DATA_KIND_NOT_ARRAY
        theReport.status["kind"] = theBlock[K.term.dataKind]

        return false                                                            // ==>
    }

    //
    // Supports any object type.
    //
    if(!theBlock[K.term.dataKind].includes(K.term.anyObject)) {
        return validateObjectTypes(theBlock, theValue, theReport)               // ==>
    }

    //
    // Requires specific object types.
    //
    else {

        //
        // Iterate object properties.
        //
        for(const [type, _] of Object.entries(theValue[0][theValue[1]])) {

            if(validateDescriptor(type, [theValue[0][theValue[1]], type], theReport)) {
                return true                                                     // ==>
            }
        }
    }

    return false                                                                // ==>

} // validateObject()

/**
 * Validate descriptor object data types
 * The function will return true if the value is compatible with any of the bloc's data kinds.
 * !!! Note that we assume the data block has data kinds. !!!
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue: The value to test.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateObjectTypes(theBlock, theValue, theReport)
{
    //
    // Assert data kind is an array.
    //
    if(!utils.isArray(theBlock[K.term.dataKind])) {
        theReport.status = K.error.kMSG_DATA_KIND_NOT_ARRAY
        theReport.status["kind"] = theBlock[K.term.dataKind]

        return false                                                            // ==>
    }

    //
    // Iterate enumeration types.
    //
    for(const objectType of theBlock[K.term.dataKind]) {

        //
        // Get data kind term.
        //
        const dataKind = utils.getTerm(objectType, theReport)
        if(dataKind === false) {
            theReport.status = K.error.kMSG_BAD_TERM_REFERENCE
            theReport.status["type"] = objectType

            //
            // Fatal error.
            //
            return false                                                        // ==>
        }

        //
        // Assert kind is object definition.
        // Fatal error.
        //
        if(!dataKind.hasOwnProperty(K.term.ruleBlock)) {
            theReport.status = K.error.kMSG_NO_RULE_SECTION
            theReport.status["type"] = objectType

            //
            // Fatal error.
            //
            return false                                                        // ==>
        }

        //
        // Add default values.
        //
        let defaults = []
        if(dataKind[K.term.ruleBlock].hasOwnProperty(K.term.dataRuleDefault)) {

            //
            // Add missing default values.
            //
            // theValue[0][theValue[1]] = {
            //     ...dataKind[K.term.ruleBlock][K.term.dataRuleDefault],
            //     ...theValue[0][theValue[1]]
            // }

            //
            // Iterate default values.
            //
            for(const [key, value] of Object.entries(dataKind[K.term.ruleBlock][K.term.dataRuleDefault])) {

                //
                // Handle missing default.
                //
                if(!theValue[0][theValue[1]].hasOwnProperty(key)) {

                    //
                    // Save property name for later.
                    //
                    defaults.push(key)

                    //
                    // Set default value.
                    //
                    theValue[0][theValue[1]][key] = value

                } // Value is missing default.

            } // Iterating default values.

        } // Has default values.

        //
        // Validate required.
        //
        if(!validateObjectRequired(dataKind[K.term.ruleBlock], theValue, theReport)) {

            //
            // Remove defaults.
            //
            for(const key of defaults) {
                delete theValue[0][theValue[1]][key]
            }

            continue                                                    // =>
        }

        //
        // Traverse object.
        //
        let status = true
        for(const [descriptor, _] of Object.entries(theValue[0][theValue[1]])) {

            //
            // Validate descriptor.
            //
            if(!validateDescriptor(descriptor, [theValue[0][theValue[1]], descriptor], theReport)) {
                status = false
                break                                                   // =>
            }

        } // Iterating object properties.

        //
        // Handle all properties valid.
        //
        if(status) {
            return true                                                         // ==>
        }

        //
        // Remove eventual defaults.
        //
        for(const key of defaults) {
            delete theValue[0][theValue[1]][key]
        }

    } // Iterating object kinds.

    return false                                                                // ==>

} // validateObjectTypes()

/**
 * Validate object required properties.
 * The function will return true if the structure contains all required properties.
 * @param theBlock {Object}: The object definition rule.
 * @param theValue {Array}: The value to test: [0] parent value, [1] index to value.
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
        const keys = Object.keys(theValue[0][theValue[1]])

        //
        // Check should contain one descriptor from the set.
        //
        if(rule.hasOwnProperty(K.term.dataRuleSelDescrOne)) {
            const set = rule[K.term.dataRuleSelDescrOne]
             if(_.intersection(keys, set) !== 1) {
                theReport.status = K.error.kMSG_REQUIRED_ONE_PROPERTY
                 theReport.status["value"] = theValue[0][theValue[1]]
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
                theReport.status["value"] = theValue[0][theValue[1]]
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
                theReport.status["value"] = theValue[0][theValue[1]]
                theReport.status["set"] = set

                return false                                                    // ==>
            }
        }

        //
        // Check should contain one or no descriptors from each set in the list
        // and at least one entry in the result.
        //
        if(rule.hasOwnProperty(K.term.dataRuleSelDescrAnyOne)) {

            if(Object.keys(theValue[0][theValue[1]]).length === 0) {
                theReport.status = K.error.kMSG_REQUIRED_ONE_SELECTION

                return false                                                    // ==>
            }

            for(const element in rule[K.term.dataRuleSelDescrAnyOne]) {
                if(_.intersection(keys, element) > 1) {
                    theReport.status = K.error.kMSG_REQUIRED_MORE_ONE_SELECTION
                    theReport.status["value"] = theValue[0][theValue[1]]
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
                theReport.status["value"] = theValue[0][theValue[1]]
                theReport.status["set"] = set

                return false                                                    // ==>
            }
        }
    }

    return true                                                                 // ==>

} // validateObjectRequired()

/**
 * Validate range
 * The function will return true if the value is within the valid range.
 * Array values are passed to this function individually.
 * @param theBlock {Object}: The dictionary data block.
 * @param theValue {Array}: The value to test: [0] parent value, [1] index to value.
 * @param theReport {ValidationReport}: The status report.
 * @returns {boolean}: true means valid.
 */
function validateRange(theBlock, theValue, theReport)
{
    //
    // Check if we have a range.
    //
    if(theBlock.hasOwnProperty(K.term.dataRangeValid)) {
        const value = theValue[0][theValue[1]]
        const range = theBlock[K.term.dataRangeValid]

        //
        // Minimum inclusive.
        //
        if(range.hasOwnProperty(K.term.dataRangeValidMinInc)) {
            if(value < range[K.term.dataRangeValidMinInc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                theReport.status["value"] = value
                theReport.status["range"] = range

                return false                                                    // ==>
            }
        }

        //
        // Minimum exclusive.
        //
        if(range.hasOwnProperty(K.term.dataRangeValidMinExc)) {
            if(value <= range[K.term.dataRangeValidMinExc]) {
                theReport.status = K.error.kMSG_BELOW_RANGE
                theReport.status["value"] = value
                theReport.status["range"] = range

                return false                                                    // ==>
            }
        }

        //
        // Maximum inclusive.
        //
        if(range.hasOwnProperty(K.term.dataRangeValidMaxInc)) {
            if(value > range[K.term.dataRangeValidMaxInc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                theReport.status["value"] = value
                theReport.status["range"] = range

                return false                                                    // ==>
            }
        }

        //
        // Maximum exclusive.
        if(range.hasOwnProperty(K.term.dataRangeValidMaxExc)) {
            if(value >= range[K.term.dataRangeValidMaxExc]) {
                theReport.status = K.error.kMSG_OVER_RANGE
                theReport.status["value"] = value
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
 * @param theValue: The value to test.
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
        if (!theValue[0][theValue[1]].match(regexp)) {
            theReport.status = K.error.kMSG_NO_REGEXP
            theReport.status["property"] = theValue[1]
            theReport.status["value"] = theValue[0][theValue[1]]
            theReport.status["regexp"] = theBlock[K.term.regexp]

            return false                                                        // ==>
        }
    }

    return true                                                                 // ==>

} // validateRegexp()


module.exports = {
    validateDescriptor,
    validateDataBlock,

    validateScalar,
    validateArray,
    validateSet,
    validateDictionary,

    validateValue,

    validateBoolean,
    validateInteger,
    validateNumber,
    validateTimestamp,
    validateString
}