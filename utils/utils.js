'use strict';

//
// Import frameworks.
//
const _ = require('lodash');                            // Lodash library.
const aql = require('@arangodb').aql;					// AQL queries.
const crypto = require('@arangodb/crypto')              // Cryptographic utilities.

//
// Import resources.
//
const K = require( './constants' )  // Application constants.
const Validator = require("../library/Validator")   // Utils.


/******************************************************************************/
/* UTILITY FUNCTIONS                                                           /*
/******************************************************************************/

/**
 * Return edge key.
 * This function will return the edge _key using the provided parameters.
 * @param theSubject {String}: The `_from` document handle.
 * @param thePredicate {String}: The predicate global identifier.
 * @param theObject {String}: The `_to` document handle.
 * @return {String}: The edge _key.
 */
function getEdgeKey(theSubject, thePredicate, theObject)
{
    const key =
        crypto.md5(
            theSubject +
            K.token.tok +
            thePredicate +
            K.token.tok +
            theObject
        )

    return key                                                                  // ==>

} // getEdgeKey()

/**
 * Return term in provided language
 * The function expects a term and a valid language code,
 * it will return the _info properties in the provided language.
 * If an _info element does not have the provided language,
 * the function will return the element as-is.
 * Note that the modifications are performed on the original object.
 * @param theTerm {Object}: The term.
 * @param theLanguage {String}: A valid language code.
 * @return {Object}: The term with info in the provided language.
 */
function termLanguage(theTerm, theLanguage)
{
    //
    // Check if the term has info.
    //
    if(theTerm.hasOwnProperty(module.context.configuration.sectionInfo)) {
        for(const property of Object.keys(theTerm[module.context.configuration.sectionInfo])) {
            if(Validator.IsObject(theTerm[module.context.configuration.sectionInfo][property])) {
                if(theTerm[module.context.configuration.sectionInfo][property].hasOwnProperty(theLanguage)) {
                    const element = theTerm[module.context.configuration.sectionInfo][property][theLanguage]
                    theTerm[module.context.configuration.sectionInfo][property] = element

                } // Has language element.

            } // Info property is an object.

        } // Iterating info properties.

    } // Term has info block.

} // termLanguage()

/**
 * The method will return `true` if the provided value is an empty object.
 *
 * @param theValue {Array|Object|Number|String}: The value to test.
 *
 * @return {Boolean}: `true` if empty object, `false` if anything else.
 */
function isEmptyObject(theValue)
{
    if (typeof theValue === 'object' && theValue !== null) {
        return Object.keys(theValue).length === 0                   // ==>
    }
    
    return false                                                    // ==>
    
} // isEmptyObject()

/**
 * The method will merge source into target.
 * Note: theSource cannot have enumerable properties in its prototype chain.
 *
 * @param theSource {Object}: The object to merge.
 * @param theTarget {Object}: The merged object.
 *
 * @return {Object}: The merged object.
 */
// TODO: Must review well!.
function recursiveMergeObjects(theSource, theTarget)
{
    Object.keys(source).forEach(key => {
        if (source[key] === null) {
            delete target[key];
        } else if (isObject(source[key])) {
            if (!target[key]) {
                target[key] = {};
            }
            recursiveMergeObjects(target[key], source[key]);
        } else if (source[key] !== undefined) {
            target[key] = source[key];
        }
    });
    return target;

} // recursiveMergeObjects()


module.exports = {
    getEdgeKey,
    termLanguage,
    isEmptyObject
}
