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
     * @param theDescriptor {String}: The descriptor or type name.
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
    }

} // ValidationReport

module.exports = ValidationReport;
