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


/******************************************************************************/
/* UTILITY FUNCTIONS                                                           /*
/******************************************************************************/

/**
 * Check if document exists.
 * The function will return true if the provided handle is valid.
 * @param theHandle {String}: The document handle.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {boolean}: true if found, or false if not found.
 */
function checkDocument(theHandle,theReport = false)
{
    //
    // Check if document handle is valid.
    //
    try {
        if(db._exists(theHandle)) {
            return true                                                         // ==>
        }
    }

    //
    // Handle errors.
    //
    catch (error) {
        if(theReport !== false) {
            theReport["error"] = error
        }
    }

    return false                                                                // ==>

} // checkDocument()

/**
 * Check if term exists.
 * The function will return true if the provided value is a term.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {boolean}: The object if found, or false if not found.
 */
function checkTerm(theKey, theReport = false)
{
    //
    // Check if term exists.
    //
    try {
        if(module.context.collection(K.collection.term.name).exists(theKey)) {
            return true                                                         // ==>
        }
    }

    //
    // Handle errors.
    //
    catch (error) {
        if(theReport !== false) {
            theReport.status = K.error.kMSG_TERM_NOT_FOUND
            theReport["error"] = error
        }
    }

    return false                                                                // ==>

} // checkTerm()

/**
 * Get document.
 * The function will return the provided handleìs document or false if not found.
 * @param theHandle {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {Object/false}: The object if found, or false if not found.
 */
function getDocument(theHandle, theReport = false)
{
    //
    // Read database.
    //
    try {
        const result = db._document(theHandle)

        return result                                                           // ==>

    }

    //
    // Handle errors.
    //
    catch (error) {
        if(theReport !== false) {
            theReport["error"] = error
        }
    }

    return false                                                                // ==>

} // getDocument()

/**
 * Get term.
 * The function will return the term corresponding to the provided key, or false.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {Object/false}: The object if found, or false if not found.
 */
function getTerm(theKey, theReport = false)
{
    //
    // Read database.
    //
    try {
        const result = module.context.collection(K.collection.term.name).document(theKey)

        return result                                                           // ==>

    }

        //
        // Handle errors.
        //
    catch (error) {
        if(theReport !== false) {
            theReport.status = K.error.kMSG_TERM_NOT_FOUND
            theReport["error"] = error
        }
    }

    return false                                                                // ==>

} // getTerm()

/**
 * Get descriptor term.
 * The function will return the descriptor corresponding to the provided key, or false.
 * Note that the data block is required, but can be empty.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {Object/false}: The object if found, or false if not found.
 */
function getDescriptor(theKey, theReport = false)
{
    //
    // Get term.
    //
    const term = getTerm(theKey, theReport)
    if(term === false) {
        return false                                                            // ==>
    }

    //
    // Check data block.
    //
    if(term.hasOwnProperty(K.term.dataBlock)) {
        return term                                                             // ==>
    }

    //
    // Signal not a descriptor.
    //
    if(theReport !== false) {
        theReport.status = K.error.kMSG_NOT_DESCRIPTOR
    }

    return false                                                                // ==>

} // getDescriptor()


/******************************************************************************/
/* UTILITY ASSERTIONS                                                          /*
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
 * Check if array.
 * The function will return true if the provided value is an array.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True for arrays, false for other types.
 */
function isArray(item)
{
    return _.isArray(item)                                                      //==>

} // isArray()

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


module.exports = {
    checkDocument,
    checkTerm,

    getDocument,
    getTerm,
    getDescriptor,

    isBoolean,
    isInteger,
    isNumber,
    isString,
    isArray,
    isObject
}