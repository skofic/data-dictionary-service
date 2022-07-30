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
    // Terms.
    //
    term : {
        codeBlock: "_code",
        dataBlock: "_data",

        dataBlockScalar: "_scalar",
        dataBlockArray: "_array",
        dataBlockSet: "_set",
        dataBlockDict: "_dict",

        dataType: "_type",

        dataTypeBool: "_type_boolean",
        dataTypeInteger: "_type_integer",
        dataTypeNumber: "_type_number",
        dataTypeString: "_type_string",
        dataTypeEnum: "_type_enum",
        dataTypeRecord: "_type_record",
        dataTypeTimestamp: "_type_timestamp",
        dataTypeGeoJson: "_type_geo-json",
        dataTypeObject: "_type_object"

    },

    //
    // Errors.
    //
    // Errors have a key, code and multilingual message.
    //
    error : {
        kMSG_ERROR: {
            code: -1,
            message: {
                iso_639_3_eng: "Untracked error",
                iso_639_3_ita: "Errore indeterminato",
                iso_639_3_fra: "Erreur inconnue",
                iso_639_3_esp: "Error no conoscido"
            }
        },
        kMSG_NO_DATA_BLOCK: {
            code: -2,
            message: {
                iso_639_3_eng: "Descriptor missing data block",
                iso_639_3_ita: "Il descrittore non ha il blocco dati",
                iso_639_3_fra: "Le descripteur manque de son bloc data",
                iso_639_3_esp: "El descriptor falta su bloque datos"
            }
        },
        kMSG_BAD_DATA_BLOCK: {
            code: -3,
            message: {
                iso_639_3_eng: "Data block is missing a required property",
                iso_639_3_ita: "Il blocco dati non ha una proprietà richiesta",
                iso_639_3_fra: "Le bloc données n'a pas une proprieté requise",
                iso_639_3_esp: "El bloque datos falta una propriedad"
            }
        },
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
        },
        kMSG_NOT_ARRAY: {
            code: 3,
            message: {
                iso_639_3_eng: "Not an array value.",
                iso_639_3_ita: "Il valore deve essere una lista.",
                iso_639_3_fra: "La valeur doit être une liste.",
                iso_639_3_esp: "Esperando una lista de valores."
            }
        },
        kMSG_DUP_SET: {
            code: 4,
            message: {
                iso_639_3_eng: "The set contains duplicate values.",
                iso_639_3_ita: "Il set contiene valori duplicati.",
                iso_639_3_fra: "L'ensemble contient des valeurs en double.",
                iso_639_3_esp: "El conjunto contiene valores duplicados."
            }
        },
        kMSG_NOT_SCALAR: {
            code: 5,
            message: {
                iso_639_3_eng: "Not a scalar value.",
                iso_639_3_ita: "Non è un valore scalare.",
                iso_639_3_fra: "Pas une valeur scalaire.",
                iso_639_3_esp: "No es un valor escalar."
            }
        },
        kMSG_NOT_BOOL: {
            code: 6,
            message: {
                iso_639_3_eng: "Not a boolean value.",
                iso_639_3_ita: "Non è un valore booleano.",
                iso_639_3_fra: "Pas une valeur booléenne.",
                iso_639_3_esp: "No es un valor booleano."
            }
        },
        kMSG_NOT_OBJECT: {
            code: 7,
            message: {
                iso_639_3_eng: "Not a structured value.",
                iso_639_3_ita: "Il valore non è una struttura.",
                iso_639_3_fra: "La valeur n'est pas une structure.",
                iso_639_3_esp: "El valor no es una estructura."
            }
        },
        kMSG_NOT_INT: {
            code: 8,
            message: {
                iso_639_3_eng: "Not an integer value.",
                iso_639_3_ita: "Il valore non è un intero.",
                iso_639_3_fra: "Pas une valeur entière.",
                iso_639_3_esp: "No es un valor entero."
            }
        },
        kMSG_NOT_NUMBER: {
            code: 9,
            message: {
                iso_639_3_eng: "Not a numeric value.",
                iso_639_3_ita: "Il valore non è numerico.",
                iso_639_3_fra: "Pas une valeur numérique.",
                iso_639_3_esp: "No es un valor numérico."
            }
        },
        kMSG_NOT_STRING: {
            code: 10,
            message: {
                iso_639_3_eng: "Not a text string value.",
                iso_639_3_ita: "Il valore non è una strings di testo.",
                iso_639_3_fra: "Pas une chaîne de charactères.",
                iso_639_3_esp: "No es un valor texto."
            }
        }
    }

});
