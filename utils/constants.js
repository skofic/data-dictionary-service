'use strict';

/**
 * Constants
 *
 * This module exports all required constants:
 *
 *    - environment:	Environment constants.
 *    - error:          Error objects.
 */
module.exports = Object.freeze({

    //
    // Environment.
    //
    environment: {
        auth : {
            // path		 : '/data/auth.json',
            algo		 : 'HS384'
        },
        language		 : "iso_639_3_eng",
        page			 : 4096,
        buffer			 : 819200,
        msg_sep			 : ' '
    },

    //
    // Collections.
    //
    //	- name:		Collection name.
    //  - type:     Collection type: D=document, E=Edge.
    //	- index:	Collection indexes.
    //
    collection : {
        term	: {
            name : 'terms',
            type : 'D',
            index: []
        },
        schema	: {
            name : 'schemas',
            type : 'E',
            index: []
        },
        topo	: {
            name : 'topos',
            type : 'E',
            index: []
        },
        log	: {
            name : 'logs',
            type : 'D',
            index: []
        },

    //
    // Errors.
    //
    // Errors have a key, code and multilingual message.
    //
    error : {
        kNOT_FOUND: {
            code: 1,
            message: {
                iso_639_3_eng: "Not found.",
                iso_639_3_ita: "Non trovato.",
                iso_639_3_fra: "Pas trouvé.",
                iso_639_3_esp: "No encontré."
            }
        }
    }

});
