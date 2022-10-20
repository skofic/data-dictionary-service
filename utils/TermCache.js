'use strict'

//
// Application.
//
const K = require( '../utils/constants' );

/**
 * Terms cache class
 *
 * This class implements a cache of term documents.
 *
 * The class can be used to check for or read terms that will be stored in a
 * cache. The class can be useful to prevent reading records that have already
 * been accessed.
 *
 * The cache is a key/value dictionary in which the key is the term `_key`
 * and the value is either `false` for unknown terms, `true` for known terms
 * and a document for cached term objects.
 *
 * Elements may either contain `true`, in which case we only checked for
 * the correctness of the key, or contain the term document.
 */
class TermCache
{
    /**
     * Constructor
     * The constructor sets the "collection" and "cache" members.
     */
    constructor()
    {
        //
        // Set data members.
        //
        this.cache = {}
        this.collection = K.db._collection(K.collection.term.name)  // Collection.

    } // constructor.

    /**
     * Check term
     * This method will return a boolean indicating whether the provided key
     * corresponds to a term key.
     * @param theKey {String}: The term `_key`.
     * @return {boolean}: `true` if key corresponds to a term.
     */
    checkTerm( theKey )
    {
        //
        // Check cache.
        // If key matches,
        // => return boolean value;
        // => return true since it must be an object.
        //
        if(this.cache.hasOwnProperty(theKey)) {
            return  !(this.cache[theKey] === false)                             // ==>
        }

        //
        // Check database.
        //
        this.cache[theKey] = this.collection.exists(theKey)

        return !(this.cache[theKey] === false)                                  // ==>

    } // checkTerm()

    /**
     * Check terms
     * This method will return a dictionary whose keys correspond to the
     * provided keys and the values will be a boolean indicating whether
     * the key corresponds to a term, `true`, or not, `false`.
     * @param theKeys {Array<String>}: List of term `_key` values to check.
     * @return {Object<String:Boolean>}: Dictionary of matched keys.
     */
    checkTerms(theKeys)
    {
        //
        // Use getTerms() method.
        //
        const result = this.getTerms(theKeys)

        return Object.keys(result).map(item => result[item] !== false)          // ==>

    } // checkTerms()

    /**
     * Return term document
     * This method will return the term corresponding to the provided key.
     * If the key matches no term, the method will return `false`.
     * @param theKey {String}: The term `_key`.
     * @return {}: Either the matched term object or `false`.
     */
    getTerm(theKey)
    {
        //
        // Try cache.
        //
        if(this.cache.hasOwnProperty(theKey)) {
            return this.cache[theKey]                                           // ==>
        }

        //
        // Load cache.
        //
        this.cache[theKey] = this.collection.exists(theKey)

        return this.cache[theKey]                                               // ==>

    } // getTerm()

    /**
     * Return term documents
     * This method will return the terms corresponding to the provided keys.
     * If the key matches no term, the method will return `false`.
     * @param theKeys {Array<String>}: List of term `_key` values to check.
     * @return {Object<String:Object>}: Dictionary of matched keys.
     */
    getTerms(theKeys)
    {
        //
        // Init local storage.
        //
        let result = {}
        const cacheKeys = Object.keys(this.cache)

        //
        // Probe cache.
        //
        const matches = theKeys.filter(item => cacheKeys.includes(item))
        const misses  = theKeys.filter(item => !cacheKeys.includes(item))

        //
        // Handle cache matches.
        //
        if(matches.length > 0) {
            Object.assign(result, ...matches.map(item => {item: !this.cache[item] === false}))
        }

        //
        // Handle cache misses.
        //
        if(misses.length > 0) {
            const processed =
                this.collection.document(misses).map(item => item.hasOwnProperty('_key') ? item : false)
                    .reduce( (result, value, index) => {
                        result[misses[index]] = value
                        return result
                    }, {})

            Object.assign(this.cache, processed)
            Object.assign(result, processed)
        }

        return result                                                           // ==>

    } // getTerms()
}

module.exports = TermCache
