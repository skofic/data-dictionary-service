'use strict';

//
// Import resources.
//
const K = require( '../utils/constants' );              // Application constants.


/**
 * Validation Report
 *
 * This class implements the report generated after validating a descriptor.
 * The report is comprised of:
 * - descriptor: Top level descriptor name.
 * - type: Eventual
 * - value: Top level descriptor's value.
 * - status: Validation status object.
 * - current: The last property name that triggered an error.
 * - Other properties used to describe the validation status.
 */
class ValidationReport
{
    /**
     * Constructor
     * @param theDescriptor {String}: The descriptor or type name.
     * @param theValue {Any}: The descriptor value.
     * @param theType {String}: The descriptor type,if relevant
     * @param theStatus {String}: The status object code, defaults to kMSG_OK.
     * @param theError {Error}: The eventual error object.
     */
    constructor(
        theDescriptor,
        theValue,
        theType = null,
        theStatus = "kMSG_OK",
        theError= null
    ){
        //
        // Set data parameters.
        //
        this.descriptor = theDescriptor
        this.value = theValue
        this.status = K.error[theStatus]
    }

} // ValidationReport

module.exports = ValidationReport;
