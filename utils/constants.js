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
        term: {
            name: 'terms',
            type: 'D'
        },
        schema: {
            name: 'schemas',
            type: 'E'
        },
        topo: {
            name: 'topos',
            type: 'E'
        },
        log: {
            name: 'logs',
            type: 'D'
        }
    },

    //
    // Errors.
    //
    // Errors have a key, code and multilingual message.
    //
    error : {
        kMSG_OK: {
            code: 0,
            message: {
                iso_639_3_eng: "OK",
                iso_639_3_ita: "Corretto",
                iso_639_3_fra: "Correcte",
                iso_639_3_esp: "Correcto"
            }
        },
        kMSG_NOT_FOUND: {
            code: 1,
            message: {
                iso_639_3_eng: "Not found.",
                iso_639_3_ita: "Non trovato.",
                iso_639_3_fra: "Pas trouvé.",
                iso_639_3_esp: "No encontré."
            }
        },
        kMSG_NOT_DESCRIPTOR: {
            code: 2,
            message: {
                iso_639_3_eng: "Not a descriptor.",
                iso_639_3_ita: "Non è un descrittore.",
                iso_639_3_fra: "Pas un descripteur.",
                iso_639_3_esp: "No es un descriptór."
            }
        }
    }

});
