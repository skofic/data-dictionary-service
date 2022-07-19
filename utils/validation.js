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
    } catch (error) {
        if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
            report.status = K.error.kMSG_NOT_FOUND
        } else {
            report.status = K.error.kMSG_ERROR
        }
        report.error = error
    }

    return report                                                               // ==>

} // validateDescriptor()


module.exports = {
    validateDescriptor
}