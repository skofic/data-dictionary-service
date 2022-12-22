'use strict';

const database = require('@arangodb').db

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
        page: 4096,
        buffer: 819200,
        auth: 'AUTH',
        role: {
            admin: "admin",
            dict: "dict",
            read: "read"
        }
    },

    //
    // Tokens.
    //
    "token": {
        "ns": "_",
        "tok": "/"
    },

    //
    // Database connection.
    //
    db: database,

    //
    // Collections.
    //
    //	- name:		Collection name.
    //  - type:     Collection type: D=document, E=Edge.
    //	- index:	Collection indexes.
    //
    collection : {
        term: {
            name: module.context.configuration.collectionTerm,
            type: 'D',
            index: [
                {
                    type: 'persistent',
                    fields: ['_code._gid'],
                    name: "idx-global-identifier",
                    unique: true
                },
                {
                    type: 'persistent',
                    fields: ['_code._lid'],
                    name: "idx-local-identifier",
                    unique: false
                },
                {
                    type: 'persistent',
                    fields: ['_code._aid[*]'],
                    name: "idx-alias-identifiers",
                    unique: false,
                    sparse: true
                }
            ]
        },
        schema: {
            name: module.context.configuration.collectionEdge,
            type: 'E',
            index: [
                {
                    type: 'persistent',
                    fields: ['_path[*]', '_predicate'],
                    deduplicate: true,
                    estimates: true,
                    name: "idx-schema-path-predicate",
                    unique: false
                }
            ]
        },
        topo: {
            name: module.context.configuration.collectionTopo,
            type: 'E',
            index: [
                {
                    type: 'persistent',
                    fields: ['_path[*]', '_predicate'],
                    deduplicate: true,
                    estimates: true,
                    name: "idx-topo-path-predicate",
                    unique: false
                }
            ]
        },
        error: {
            name: module.context.configuration.collectionError,
            type: 'D'
        },
        user: {
            name: module.context.configuration.collectionUser,
            type: 'D',
            index: [
                {
                    type: 'hash',
                    fields: ['username'],
                    deduplicate: true,
                    estimates: true,
                    name: "idx-user-username",
                    unique: true
                }
            ]
        },
        session: {
            name: module.context.configuration.collectionSession,
            type: 'D'
        },
        settings: {
            name: module.context.configuration.collectionSettings,
            type: 'D'
        },
        log: {
            name: module.context.configuration.collectionLog,
            type: 'D'
        }
    },

    //
    // Directories.
    //
    //	- name:		Directory name.
    //
    directory : [
        module.context.configuration.dataDir
    ],

    //
    // Terms.
    //
    term : {
        codeBlock: "_code",
        infoBlock: "_info",
        dataBlock: "_data",
        ruleBlock: "_rule",

        dataBlockScalar: "_scalar",
        dataBlockSetScalar: "_set_scalar",
        dataBlockArray: "_array",
        dataBlockSet: "_set",
        dataBlockDict: "_dict",

        dataType: "_type",
        dataKind: "_kind",
        dataSetType: "_set_type",

        dataTypeBool: "_type_boolean",
        dataTypeInteger: "_type_integer",
        dataTypeNumber: "_type_number",
        dataTypeTimestamp: "_type_number_timestamp",
        dataTypeString: "_type_string",
        dataTypeKey: "_type_string_key",
        dataTypeHandle: "_type_string_handle",
        dataTypeEnum: "_type_string_enum",
        dataTypeObject: "_type_object",
        dataTypeGeoJson: "_type_object_geo-json",

        dataRangeElements: "_elements",
        dataRangeElementsMin: "_min-items",
        dataRangeElementsMax: "_max-items",

        dataRangeValid: "_valid-range",
        dataRangeValidMinInc: "_min-range-inclusive",
        dataRangeValidMinExc: "_min-range-exclusive",
        dataRangeValidMaxInc: "_max-range-inclusive",
        dataRangeValidMaxExc: "_max-range-exclusive",

        dataDictKeyType: "_type_key",
        dataDictionaryKey: "_dict_key",
        dataDictionaryValue: "_dict_value",

        dataRuleDefault: "_default-value",
        dataRuleRequired: "_required",
        dataRuleSelDescrOne: "_selection-descriptors_one",
        dataRuleSelDescrOneNone: "_selection-descriptors_one-none",
        dataRuleSelDescrAny: "_selection-descriptors_any",
        dataRuleSelDescrAnyOne: "_selection-descriptors_any-one",
        dataRuleSelDescrAll: "_selection-descriptors_all",

        anyTerm: "_any-term",
        anyEnum: "_any-enum",
        anyDescriptor: "_any-descriptor",
        anyObject: "_any-object",

        predicateEnum: "_predicate_enum-of",
        predicateProperty: "_predicate_property-of",
        predicateField: "_predicate_field-of",
        predicateSection: "_predicate_section-of",
        predicateBridge: "_predicate_bridge-of",
        regexp: "_regexp"
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
        kMSG_BAD_TERM_REFERENCE: {
            code: -4,
            message: {
                iso_639_3_eng: "Data kind reference not found",
                iso_639_3_ita: "Riferimento del tipo di dati non trovato",
                iso_639_3_fra: "Référence de type de données introuvable",
                iso_639_3_esp: "Referencia de tipo de datos no encontrada"
            }
        },
        kMSG_UNSUPPORTED_DATA_TYPE: {
            code: -5,
            message: {
                iso_639_3_eng: "Unsupported data type",
                iso_639_3_ita: "Tipo di dati non supportato",
                iso_639_3_fra: "Type de données non pris en charge",
                iso_639_3_esp: "Tipo de datos no admitido"
            }
        },
        kMSG_UNIMPLEMENTED_DATA_TYPE: {
            code: -6,
            message: {
                iso_639_3_eng: "Data type not implemented yet",
                iso_639_3_ita: "Tipo di dati non implementato",
                iso_639_3_fra: "Type de données pas encore pris en charge",
                iso_639_3_esp: "Tipo de datos todavía no utilizado"
            }
        },
        kMSG_DATA_KIND_NOT_ARRAY: {
            code: -7,
            message: {
                iso_639_3_eng: "Data kind not an array",
                iso_639_3_ita: "Tipo dati non è una lista",
                iso_639_3_fra: "Type de données n'est pas une liste",
                iso_639_3_esp: "Referencia de tipo de datos no es una lista"
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
        kMSG_VALUE_RESOLVED: {
            code: 1,
            message: {
                iso_639_3_eng: "Valid, resolved value is in report.",
                iso_639_3_ita: "Corretto, il valore aggiornato si trova nel rapporto.",
                iso_639_3_fra: "Correcte, la valeur résolue se trouve dans le rapport.",
                iso_639_3_esp: "Correcto, el valor resuelto se encuentra en el reporte."
            }
        },
        kMSG_TERM_NOT_FOUND: {
            code: 2,
            message: {
                iso_639_3_eng: "Term not found.",
                iso_639_3_ita: "Termine non trovato.",
                iso_639_3_fra: "Terme inconnu.",
                iso_639_3_esp: "No encontré el termino."
            }
        },
        kMSG_DESCRIPTOR_NOT_FOUND: {
            code: 3,
            message: {
                iso_639_3_eng: "Descriptor not found.",
                iso_639_3_ita: "Descrittore non trovato.",
                iso_639_3_fra: "Descripteur pas trouvé.",
                iso_639_3_esp: "No encontré el descriptor."
            }
        },
        kMSG_ENUM_NOT_FOUND: {
            code: 4,
            message: {
                iso_639_3_eng: "Enumeration not found.",
                iso_639_3_ita: "Enumerazione non trovato.",
                iso_639_3_fra: "Énumération introuvable.",
                iso_639_3_esp: "Enumeración no encontrada."
            }
        },
        kMSG_DOCUMENT_NOT_FOUND: {
            code: 5,
            message: {
                iso_639_3_eng: "Document not found.",
                iso_639_3_ita: "Documento non trovato.",
                iso_639_3_fra: "Document introuvable.",
                iso_639_3_esp: "Documento no encontrada."
            }
        },
        kMSG_NOT_DESCRIPTOR: {
            code: 6,
            message: {
                iso_639_3_eng: "Not a descriptor.",
                iso_639_3_ita: "Non è un descrittore.",
                iso_639_3_fra: "Pas un descripteur.",
                iso_639_3_esp: "No es un descriptór."
            }
        },
        kMSG_NOT_ARRAY: {
            code: 7,
            message: {
                iso_639_3_eng: "Not an array value.",
                iso_639_3_ita: "Il valore deve essere una lista.",
                iso_639_3_fra: "La valeur doit être une liste.",
                iso_639_3_esp: "Esperando una lista de valores."
            }
        },
        kMSG_DUP_SET: {
            code: 8,
            message: {
                iso_639_3_eng: "The set contains duplicate values.",
                iso_639_3_ita: "Il set contiene valori duplicati.",
                iso_639_3_fra: "L'ensemble contient des valeurs en double.",
                iso_639_3_esp: "El conjunto contiene valores duplicados."
            }
        },
        kMSG_NOT_SCALAR: {
            code: 9,
            message: {
                iso_639_3_eng: "Not a scalar value.",
                iso_639_3_ita: "Non è un valore scalare.",
                iso_639_3_fra: "Pas une valeur scalaire.",
                iso_639_3_esp: "No es un valor escalar."
            }
        },
        kMSG_NOT_BOOL: {
            code: 10,
            message: {
                iso_639_3_eng: "Not a boolean value.",
                iso_639_3_ita: "Non è un valore booleano.",
                iso_639_3_fra: "Pas une valeur booléenne.",
                iso_639_3_esp: "No es un valor booleano."
            }
        },
        kMSG_NOT_OBJECT: {
            code: 11,
            message: {
                iso_639_3_eng: "Not a structured value.",
                iso_639_3_ita: "Il valore non è una struttura.",
                iso_639_3_fra: "La valeur n'est pas une structure.",
                iso_639_3_esp: "El valor no es una estructura."
            }
        },
        kMSG_NOT_INT: {
            code: 12,
            message: {
                iso_639_3_eng: "Not an integer value.",
                iso_639_3_ita: "Il valore non è un intero.",
                iso_639_3_fra: "Pas une valeur entière.",
                iso_639_3_esp: "No es un valor entero."
            }
        },
        kMSG_NOT_NUMBER: {
            code: 13,
            message: {
                iso_639_3_eng: "Not a numeric value.",
                iso_639_3_ita: "Il valore non è numerico.",
                iso_639_3_fra: "Pas une valeur numérique.",
                iso_639_3_esp: "No es un valor numérico."
            }
        },
        kMSG_NOT_STRING: {
            code: 14,
            message: {
                iso_639_3_eng: "Not a text string value.",
                iso_639_3_ita: "Il valore non è una strings di testo.",
                iso_639_3_fra: "Pas une chaîne de charactères.",
                iso_639_3_esp: "No es un valor texto."
            }
        },
        kMSG_NOT_ENOUGH_ELEMENTS: {
            code: 15,
            message: {
                iso_639_3_eng: "Not enough elements.",
                iso_639_3_ita: "Numero di elementi insufficiente.",
                iso_639_3_fra: "Pas assez d'elements.",
                iso_639_3_esp: "No suficientes elementos."
            }
        },
        kMSG_TOO_MANY_ELEMENTS: {
            code: 16,
            message: {
                iso_639_3_eng: "Too many elements.",
                iso_639_3_ita: "Numero di elementi troppo elevato.",
                iso_639_3_fra: "Trop d'elements.",
                iso_639_3_esp: "Demaciados elementos."
            }
        },
        kMSG_BELOW_RANGE: {
            code: 17,
            message: {
                iso_639_3_eng: "Below minimum range.",
                iso_639_3_ita: "Al di sotto dell'intervallo minimo.",
                iso_639_3_fra: "Au-dessous de la plage minimale.",
                iso_639_3_esp: "Por debajo del rango mínimo."
            }
        },
        kMSG_OVER_RANGE: {
            code: 18,
            message: {
                iso_639_3_eng: "Over maximum range.",
                iso_639_3_ita: "Al di sopra della soglia minima.",
                iso_639_3_fra: "Au-dessus de la plage maximale.",
                iso_639_3_esp: "Por arriba del rango maximo."
            }
        },
        kMSG_NO_REGEXP: {
            code: 19,
            message: {
                iso_639_3_eng: "The value does not match regular expression.",
                iso_639_3_ita: "Il valore non corrisponde all'espressione regolare.",
                iso_639_3_fra: "La valeur ne correspond pas à l'expression régulière.",
                iso_639_3_esp: "El valor no coincide con la expresión regular."
            }
        },
        kMSG_NO_RULE_SECTION: {
            code: 20,
            message: {
                iso_639_3_eng: "The type does not have a rule section: it is not an object definition.",
                iso_639_3_ita: "Il tipo non ha una sezione di regole: non è una definizione di oggetto.",
                iso_639_3_fra: "Le type n'a pas de section de règle : ce n'est pas une définition d'objet.",
                iso_639_3_esp: "El tipo no tiene una sección de reglas: no es una definición de objeto."
            }
        },
        kMSG_INVALID_OBJECT: {
            code: 21,
            message: {
                iso_639_3_eng: "The value does not conform to the object definition.",
                iso_639_3_ita: "Il valore non è conforme alla definizione dell'oggetto.",
                iso_639_3_fra: "La valeur n'est pas conforme à la définition de l'objet.",
                iso_639_3_esp: "El valor no se ajusta a la definición del objeto."
            }
        },
        kMSG_REQUIRED_ONE_PROPERTY: {
            code: 22,
            message: {
                iso_639_3_eng: "The object value should include exactly one property from the selection.",
                iso_639_3_ita: "Il valore dell'oggetto dovrebbe includere esattamente una proprietà dalla selezione.",
                iso_639_3_fra: "La valeur de l'objet doit inclure exactement une propriété de la sélection.",
                iso_639_3_esp: "El valor del objeto debe incluir exactamente una propiedad de la selección."
            }
        },
        kMSG_REQUIRED_ONE_NONE_PROPERTY: {
            code: 23,
            message: {
                iso_639_3_eng: "The object value should include one or no properties from the selection.",
                iso_639_3_ita: "Il valore dell'oggetto deve includere una o nessuna proprietà dalla selezione.",
                iso_639_3_fra: "La valeur de l'objet doit inclure une ou aucune propriété de la sélection.",
                iso_639_3_esp: "El valor del objeto debe incluir una o ninguna propiedad de la selección.."
            }
        },
        kMSG_REQUIRED_ANY_PROPERTY: {
            code: 24,
            message: {
                iso_639_3_eng: "The object value should include one or more properties from the selection.",
                iso_639_3_ita: "Il valore dell'oggetto deve includere una o più proprietà dalla selezione.",
                iso_639_3_fra: "La valeur de l'objet doit inclure une ou plusieurs propriétés de la sélection.",
                iso_639_3_esp: "El valor del objeto debe incluir una o más propiedades de la selección."
            }
        },
        kMSG_REQUIRED_MORE_ONE_SELECTION: {
            code: 25,
            message: {
                iso_639_3_eng: "More than one property selected from set.",
                iso_639_3_ita: "Più di una proprietà selezionata dal set.",
                iso_639_3_fra: "Plusieurs propriétés sélectionnées dans l'ensemble.",
                iso_639_3_esp: "Más de una propiedad seleccionada del conjunto."
            }
        },
        kMSG_REQUIRED_ONE_SELECTION: {
            code: 26,
            message: {
                iso_639_3_eng: "At least one property is required.",
                iso_639_3_ita: "È richiesta almeno una proprietà.",
                iso_639_3_fra: "Au moins une propriété est requise.",
                iso_639_3_esp: "Se requiere al menos una propiedad."
            }
        },
        kMSG_REQUIRED_ALL_SELECTION: {
            code: 27,
            message: {
                iso_639_3_eng: "All properties in set are required.",
                iso_639_3_ita: "Tutte le proprietà nel set sono obbligatorie.",
                iso_639_3_fra: "Toutes les propriétés de l'ensemble sont obligatoires.",
                iso_639_3_esp: "Todas las propiedades del conjunto son obligatorias."
            }
        },
        kMSG_NOT_TIMESTAMP: {
            code: 28,
            message: {
                iso_639_3_eng: "Not a timestamp.",
                iso_639_3_ita: "Non è una data.",
                iso_639_3_fra: "Ce n'est pas une date.",
                iso_639_3_esp: "No es una fecha."
            }
        },
        kMSG_UNKNOWN_USER: {
            code: 29,
            message: {
                iso_639_3_eng: "Unknown user.",
                iso_639_3_ita: "Utente sconosciuto.",
                iso_639_3_fra: "Utilisateur inconnu.",
                iso_639_3_esp: "Usuario desconocido."
            }
        },
        kMSG_UNAUTHORISED_USER: {
            code: 30,
            message: {
                iso_639_3_eng: "Unauthorised user.",
                iso_639_3_ita: "Utente non autorizzato.",
                iso_639_3_fra: "Utilisateur pas authorisé.",
                iso_639_3_esp: "Usuario no autorizado."
            }
        },
        kMSG_DUPLICATE_USER: {
            code: 31,
            message: {
                iso_639_3_eng: "User already registered.",
                iso_639_3_ita: "Utente già registrato.",
                iso_639_3_fra: "Utilisateur déjà enregistré.",
                iso_639_3_esp: "Usuario ya existe."
            }
        },
        kMSG_MUST_LOGIN: {
            code: 32,
            message: {
                iso_639_3_eng: "You are required to log in.",
                iso_639_3_ita: "È necessario registrarsi.",
                iso_639_3_fra: "Il est nécessaire de s'enregistrer.",
                iso_639_3_esp: "Es necessario registrarse."
            }
        },
        kMSG_ROLE_REQUIRED: {
            code: 33,
            message: {
                iso_639_3_eng: "The service requires the user to have the @@@ role.",
                iso_639_3_ita: "L'utente necessita il ruolo @@@.",
                iso_639_3_fra: "L'utilisateur doit avoir le role @@@.",
                iso_639_3_esp: "El usuario necessita el permiso @@@."
            }
        },
        kMSG_NO_CURRENT_USER: {
            code: 34,
            message: {
                iso_639_3_eng: "No registered user.",
                iso_639_3_ita: "Non c'è un utente registrato.",
                iso_639_3_fra: "Pas d'utilisateur enregistré.",
                iso_639_3_esp: "No hay usuario registrado."
            }
        },
        kMSG_ERROR_CONFLICT: {
            code: 35,
            message: {
                iso_639_3_eng: "Conflict error: the record was modified before your operation.",
                iso_639_3_ita: "Errore di conflitto: il record è stato modificato prima dell'operazione.",
                iso_639_3_fra: "Erreur de conflit: la fiche a été modifiée avant votre opération.",
                iso_639_3_esp: "Error de conflicto: el registro fue modificado antes de su operación."
            }
        },
        kMSG_ERROR_DUPLICATE: {
            code: 36,
            message: {
                iso_639_3_eng: "Conflict error: existing record.",
                iso_639_3_ita: "Errore di conflitto: record esistente.",
                iso_639_3_fra: "Erreur de conflit: la fiche existe.",
                iso_639_3_esp: "Error de conflicto: el registro existe."
            }
        },
        kMSG_ERROR_BAD_PARAM: {
            code: 37,
            message: {
                iso_639_3_eng: "Invalid parameter.",
                iso_639_3_ita: "Parametro invalido.",
                iso_639_3_fra: "Paramètre invalide.",
                iso_639_3_esp: "Parametro no valido."
            }
        },
        kMSG_ERROR_MISSING_DEF_LANG: {
            code: 38,
            message: {
                iso_639_3_eng: "Missing default language description.",
                iso_639_3_ita: "Manca descrizione nella lingua base.",
                iso_639_3_fra: "Description dans la langue de default manque.",
                iso_639_3_esp: "Falta descripción en el idioma de base."
            }
        },
        kMSG_ERROR_MISSING_TERM_REFS: {
            code: 39,
            message: {
                iso_639_3_eng: "The following referenced terms do not exist: @@@.",
                iso_639_3_ita: "Riferimenti invalidi. I seguenti termini non esistono: @@@.",
                iso_639_3_fra: "Références invalides. Les termes suivants n'existent pas: @@@.",
                iso_639_3_esp: "Los siguientes términos referenciados no existen: @@@e."
            }
        },
        kMSG_NOT_DESCRIPTORS: {
            code: 40,
            message: {
                iso_639_3_eng: "The following are not descriptors: @@@.",
                iso_639_3_ita: "I riferimenti che seguono non si riferiscono a descrittori: @@@.",
                iso_639_3_fra: "Les références qui suivent ne sont pas des descripteurs: @@@.",
                iso_639_3_esp: "Los siguientes no son descriptors: @@@."
            }
        }
    }

});
