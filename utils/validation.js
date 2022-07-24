'use strict';

//
// Import frameworks.
//
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


/**
 * validation.js
 *
 * This file contains all functions related to data validation.
 */

/**
 * Validation Report
 *
 * This class implements the report generated after validating a descriptor.
 * The report is comprised of:
 * - An enumeration that defines the state: M: Message; W: Warning; E: Error
 * - A numeric code identifying the status.
 * - A Message explaining the status.
 * - The descriptor name.
 * - The reported value.
 */
class ValidationReport
{
    /**
     * Constructor
     * @param theDescriptor {String}: The descriptor name.
     * @param theValue {Any}: The descriptor value,defaults to null.
     * @param theStatusCode {String}: The status object code, defaults to kMSG_OK.
     */
    constructor(
        theDescriptor,
        theValue = null,
        theStatus = "kMSG_OK"
    ){
        //
        // Set data members.
        //
        this.descriptor = theDescriptor
        this.value = theValue
        this.found = false
        this.status = K.error[theStatus]
        this.error = {}
    }

} // ValidationReport

/**
 * Validate descriptor.
 * The function expects a descriptor name and its value: itwill check whether
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
    // Instantiate report.
    //
    let report = new ValidationReport(name)

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

        report.error = error

        return report                                                               // ==>
    }

    //
    // Validate descriptor.
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
    // Parse data block.
    //
    if(theBlock.hasOwnProperty(K.term.dataBlockScalar)) {
        validateScalar(theBlock[K.term.dataBlockScalar], theReport)
    } else if(theBlock.hasOwnProperty(K.term.dataBlockArray)) {
        validateArray(theBlock[K.term.dataBlockArray], theReport)
    } else if(theBlock.hasOwnProperty(K.term.dataBlockSet)) {
        validateSet(theBlock[K.term.dataBlockSet], theReport)
    } else if(theBlock.hasOwnProperty(K.term.dataBlockDict)) {
        validateDictionary(theBlock[K.term.dataBlockDict], theReport)
    } else if((Object.keys(theBlock).length !== 0) && (theBlock.constructor === Object)) {
        return
    } else {
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
    theReport.value = "IS SCALAR"

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
    theReport.value = "IS ARRAY"

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
    theReport.value = "IS SET"

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


module.exports = {
    validateDescriptor
}