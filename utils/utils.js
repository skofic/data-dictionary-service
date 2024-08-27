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
            theSubject
            + K.token.tok
            + thePredicate
            + K.token.tok
            + theObject
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
    if(theTerm.hasOwnProperty(K.term.infoBlock)) {
        for(const property of Object.keys(theTerm[K.term.infoBlock])) {
            if(Validator.IsObject(theTerm[K.term.infoBlock][property])) {
                if(theTerm[K.term.infoBlock][property].hasOwnProperty(theLanguage)) {
                    const element = theTerm[K.term.infoBlock][property][theLanguage]
                    theTerm[K.term.infoBlock][property] = element

                } // Has language element.

            } // Info property is an object.

        } // Iterating info properties.

    } // Term has info block.

} // termLanguage()


module.exports = {
    getEdgeKey,
    termLanguage
}
