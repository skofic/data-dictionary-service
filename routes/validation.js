'use strict';

//
// Imports.
//
const _ = require('lodash');
const dd = require('dedent');
const joi = require('joi');

//
// Import resources.
//
const K = require( '../utils/constants' );
const Utils = require("../utils/utils");
const Session = require('../utils/sessions')
const Validator = require('../library/Validator')
const OldValidation = require("../utils/validation");

//
// Models.
//
const DescriptorValue =
    joi.alternatives().try(
        joi.array(),
        joi.object(),
        joi.number(),
        joi.string()
    ).required()

const DescriptorValues =
    joi.array()
        .items(
            joi.alternatives().try(
                joi.array(),
                joi.object(),
                joi.number(),
                joi.string()
            ).required()
        )
        .required()

const DescriptorValueReport = joi.object({
    status: joi.boolean().required(),
    report: joi.object({
        status: joi.object({
            code: joi.number().integer().required(),
            message: joi.string().required()
        }).required(),
        descriptor: joi.string(),
        value: joi.any(),
        changes: joi.object()
    }).required(),
    value: joi.any()
}).required()


const DefinitionReport = joi.object({
    definition: joi.object().required(),
    value: joi.any().required(),
    result: joi.object().required()
})

const ValidateDescriptor = joi.object({
    descriptor: joi.string().required(),
    value: joi.any().required(),
    language: joi.string(),
})

const ValidateDefinition = joi.object({
    definition: joi.object().required(),
    value: joi.any().required(),
    language: joi.string(),
})

const ValidateObject = joi.object({
    value: joi.object().required(),
    language: joi.string()
})

const ValidateObjects = joi.object({
    value: joi.array().items(joi.object()).required(),
    language: joi.string()
})

const ValidationStatus = joi.object({
    valid: joi.array().items(joi.object()),
    warnings: joi.array().items(joi.object({
        value: joi.object(),
        status: joi.array().items(joi.object())
    })),
    errors: joi.array().items(joi.object({
        value: joi.object(),
        status: joi.array().items(joi.object())
    }))
})

const ParamDescriptor = joi.string().required()
const ParamDescriptorDescription =
    "**Descriptor**.\n" +
    "Provide the global identifier of the descriptor associated with the \
    provided value."

const ParamUseCache = joi.boolean().default(true)
const ParamUseCacheDescription =
    "**Use cache**.\n" +
    "Cache all terms used in the validation procedure. This can speed the \." +
    "execution when validating large lists of values."

const ParamCacheMissed = joi.boolean().default(true)
const ParamCacheMissedDescription =
    "**Cache unresolved references**.\n" +
    "This option is only relevant if the *use cache* flag is set. If set, \
    also unresolved term references will be cached, this can be useful if \
    the data contains a large number of incorrect references with the same value."

const ParamExpectTerms = joi.boolean().default(false)
const ParamExpectTermsDescription =
    "**Expect all object properties to be part of the data dictionary**.\n" +
    "By default, if a property matches a descriptor, then the value must \
    conform to the descriptor's data definition; if the property does not match \
    a term in the data dictionary, then it will be ignored and assumed correct. \
    If you set this flag, all object properties *must* correspond to a descriptor, \
    failing to do so will be considered an error."

const ParamExpectType = joi.boolean().default(false)
const ParamExpectTypeDescription =
    "**Expect all descriptors to have a data type**.\n" +
    "By default, an empty descriptor data definition section means that it can \
    take any value: if you set this flag, all descriptors are required to have \
    a data type."

const ParamResolve = joi.boolean().default(false)
const ParamResolveDescription =
    "**Attempt to resolve unmatched term references**.\n" +
    "This option is relevant to enumerated values. If this flag is set, when a \
    provided value *does not* resolve into a term global identifier, the value \
    will be tested against the terms code section property indicated in the \
    *resfld* parameter: if there is a single match, the original value will be \
    replaced by the matched global identifier. This way one can use the local \
    identifier as the reference and let the validator resolve the global \
    identifier.\n" + "When this happens the status code will be zero, if no \
    errors have occurred, but the response will feature a property named *changes* \
    in the status report, which contains the list of resolved values.\n" + "Be \
    aware that to successfully use this feature the local identifiers must be unique."

const ParamResolveField = joi.string().default(module.context.configuration.localIdentifier)
const ParamResolveFieldDescription =
    "**Terms code section field used to resolve term references**.\n" +
    "This option is relevant if the *resolve* flag was set. This parameter \
    corresponds to the name of a property in the descriptor's code section: \
    the unresolved value will be matched against the value contained in that \
    field and if there is a *single* match, the matched term global identifier \
    will replace the provided value.\n" + "By default this parameter is set \
    to the *local identifier*, you could set it, for instance, to the *list \
    of official identifiers* in order to have a larger choice."

const ParamDefNamespace = joi.boolean().default(false)
const ParamDefNamespaceDescription =
    "**Allow referencing default namespace**.\n" +
    "The default namespace is reserved to terms that constitute the dictionary \
    engine. User-defined terms should not reference the default namespace. \
    If this option is set, it will be possible to create terms that have the \
    *default namespace* as their namespace."

//
// Instantiate router.
//
const createRouter = require('@arangodb/foxx/router');
const ErrorModel = require("../models/error_generic");
const Models = require("../models/generic_models");
const router = createRouter();
module.exports = router;
router.tag('Validation services');


/**
 * Validate descriptor value.
 * The service will check the validity of the provided value according to the
 * provided descriptor.
 */
router.post(
    'descriptor/value',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckDescriptorValue(request, response)
        }
    },
    'descriptor-value'
)
    .summary('Validate value by descriptor')
    .description(dd
        `
            **Validate a value associated to a descriptor**
            
            *Use this service if you want to check if the value of a descriptor is correct.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the descriptor's global identifier as a path \
            query parameter and the value, associated to the descriptor, in the \
            request body.
            
            The service will check if the value corresponds to the data definition \
            of the descriptor and return a status report.
            
            The service also expects a series of path query parameters that provide \
            custom options governing the validation process.
        `
    )
    .queryParam('descriptor', ParamDescriptor, ParamDescriptorDescription)
    .queryParam('cache', ParamUseCache, ParamUseCacheDescription)
    .queryParam('miss', ParamCacheMissed, ParamCacheMissedDescription)
    .queryParam('terms', ParamExpectTerms, ParamExpectTermsDescription)
    .queryParam('types', ParamExpectType, ParamExpectTypeDescription)
    .queryParam('resolve', ParamResolve, ParamResolveDescription)
    .queryParam('resfld', ParamResolveField, ParamResolveFieldDescription)
    .queryParam('defns', ParamDefNamespace, ParamDefNamespaceDescription)
    .body(DescriptorValue, dd
        `
            **Descriptor value**
            
            Provide the value associated to the descriptor, it can be of any type.
        `
    )
    .response(200, DescriptorValueReport,
        "**Validation status**\n" +
        "\n" +
        "The service will return the following information items:\n" +
        "\n" +
        "- `status`: A boolean indicating the operation status: `true` means \
        *OK*, `false` means *ERROR*.\n" +
        "- `report`: The status report:\n" +
        "  - `status`: The status of the operation:\n" +
        "    - `code`: The status code,`0` means no errors, any other value means \
        an error occurred. Note that although you may receive a zero status code, \
        you may have resolved values, in this case the `report` will include a \
        `changes` field listing the updated values.\n" +
        "    - `message`: The status message in the default language.\n" +
        "  - `descriptor`: In case of an error, this will hold the descriptor global \
        identifier of the incorrect field.\n" +
        "  - `value`: The incorrect value.\n" +
        "  - *other fields*: There may be other fields depending on the kind and scope \
        of the error.\n" +
        "  - `changes`: An object listing the eventual resolved values. Each entry is \
        indexed by the MD5 hash of the descriptor, old and new values.\n" +
        "    - `field`: A reference to the descriptor.\n" +
        "    - `original`: Original value.\n" +
        "    - `resolved`: Resolved value.\n" +
        "- `value`: The eventual updated value, if there were resolved references.\n"
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Validate descriptor values.
 * The service will check the validity of the provided list of values according
 * to the provided descriptor: each value element will be tested with the
 * provided descriptor
 */
router.post(
    'descriptor/values',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckDescriptorValues(request, response)
        }
    },
    'descriptor-values'
)
    .summary('Validate values by descriptor')
    .description(dd
        `
            **Validate a list of values associated to a single descriptor**
            
            *Use this service if you want to check if a list of values \
            all are valid for the provided descriptor.
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the descriptor's global identifier as a path \
            query parameter and the values array, associated to the descriptor, \
            in the request body.
            
            The service will check if each value in the array corresponds to \
            the data definition of the descriptor and return a status report.
            
            The service also expects a series of path query parameters that provide \
            custom options governing the validation process.
        `
    )
    .queryParam('descriptor', ParamDescriptor, ParamDescriptorDescription)
    .queryParam('cache', ParamUseCache, ParamUseCacheDescription)
    .queryParam('miss', ParamCacheMissed, ParamCacheMissedDescription)
    .queryParam('terms', ParamExpectTerms, ParamExpectTermsDescription)
    .queryParam('types', ParamExpectType, ParamExpectTypeDescription)
    .queryParam('resolve', ParamResolve, ParamResolveDescription)
    .queryParam('resfld', ParamResolveField, ParamResolveFieldDescription)
    .queryParam('defns', ParamDefNamespace, ParamDefNamespaceDescription)
    .body(DescriptorValues, dd
        `
            **Descriptor values**
            
            Provide an array containing the list of values to be matched \
            with the provided descriptor.
        `
    )
    .response(200, DescriptorValueReport,
        "**Validation status**\n" +
        "\n" +
        "The service will return the following information items:\n" +
        "\n" +
        "- `status`: A boolean indicating the operation status: `true` means \
        *OK*, `false` means *ERROR*.\n" +
        "- `report`: The status report:\n" +
        "  - `status`: The status of the operation:\n" +
        "    - `code`: The status code,`0` means no errors, any other value means \
        an error occurred. Note that although you may receive a zero status code, \
        you may have resolved values, in this case the `report` will include a \
        `changes` field listing the updated values.\n" +
        "    - `message`: The status message in the default language.\n" +
        "  - `descriptor`: In case of an error, this will hold the descriptor global \
        identifier of the incorrect field.\n" +
        "  - `value`: The incorrect value.\n" +
        "  - *other fields*: There may be other fields depending on the kind and scope \
        of the error.\n" +
        "  - `changes`: An object listing the eventual resolved values. Each entry is \
        indexed by the MD5 hash of the descriptor, old and new values.\n" +
        "    - `field`: A reference to the descriptor.\n" +
        "    - `original`: Original value.\n" +
        "    - `resolved`: Resolved value.\n" +
        "- `value`: The eventual updated value, if there were resolved references.\n"
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Validate descriptor.
 * The service will check whether the provided value corresponds to the provided
 * descriptor.
 */
router.post(
    'descriptor',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckDescriptorValue(request, response)
        }
    },
    'descriptor'
)
    .summary('Validate value by descriptor')
    .description(dd
        `
            **Validate a value associated to a descriptor**
            
            *Use this service if you want to check if the value of a descriptor is correct.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the descriptor global identifier and the descriptor value.
            The value will be validated against the data definition associated with the descriptor \
            and the service will return an object describing the status of the validation and eventual \
            additional information describing the outcome.
            
            Optionally, it is possible to indicate in which language the status message should be returned.
        `
    )
    .body(ValidateDescriptor, dd
        `
            **Service parameters**
            
            - \`descriptor\`: The descriptor global identifier.
            - \`value\`: The value to be tested against the descriptor's data definition.
            - \`language\`: The \`iso_396_3\` language for status messages.
            
            The first two parameters are *required*, the last parameter is *optional*.
            
            The \`language\` code is used to select the *language* of the *status message*:
            - if the language code is \`all\`, the message will be returned in
            *all available languages*,
            - if the language code is *wrong*, or there is *no message in that language*,
            the message will be returned in *English*.
            
            Language codes are in the form: \`iso_639_3_\` followed by the *three letter ISO language code*.
            Use \`iso_639_3_eng\` for English.
        `
    )
    .response(200, DescriptorValueReport, dd
        `
            **Validation status**
            
            The service will return three information items:
            - \`valid\`: List of valid data elements.
            - \`warnings\`: List of warning reports.
            - \`errors\`: List of error reports.
            
            Warning and error reports are objects with two elements:
            - \`value\`: The data element value.
            - \`status\`: The list of status messages one per property.
            
            Each data element is processed separately: if the data is valid, the data element will \
            be stored in the \`valid\` report property; if there is at least one error, the data element \
            and all the corresponding status reports will be stored in the \`errors\` report property; \
            if there is at least one warning, the data element and all the corresponding status reports \
            will be stored in the \`warnings\` report property.
            
            The returned value, \`value\`, may be *different* than the provided value, because enumerations
            can be *resolved*: if the enumeration code is *not* a *term global identifier*, the full
            enumeration graph will be traversed and the first element whose local identifier matches the provided
            value will be considered the valid choice. Try entering \`_type\` as descriptor and \`string\` as the
            value: you will see that the value will be resolved to the full code value, \`_type_string\`.
            
            The \`status\` objects indicate the outcome of the validation, they record any warning or error.
            This status has two default elements: a \`code\` that is a numeric code, \`0\` means success,
            and a \`message\` string that describes the outcome. Depending on the eventual error, the status may
            include other properties such as:
            - \`value\`: the value that caused the error.
            - \`descriptor\`: the descriptor involved in the error.
            - \`elements\`: in case an array has too little or too much elements.
            - \`property\`: missing required property, in case of incorrect data definition.
            - \`block\`: data definition section.
            - \`type\`: unimplemented or invalid data type, or data definition section name.
            - \`required\`: list of required properties, in case one is missing.
            - \`range\`: valid range, in the case of out of range values.
            - \`regexp\`: regular expression, in case a string does not match.
            
            Additional properties may be included in the result, depending on the eventual error, or in the event
            that an enumeration was resolved:
            - \`resolved\`: It is an object whose properties represent the enumeration descriptors whose values
            have been resolved, the values contain the original provided codes, while the \`value\` will contain the
            resolved values. Try entering \`_type\` as descriptor and \`string\` as the value.
            - \`ignored\`: It is an object whose properties represent the descriptors that were not recognised.
            Unknown descriptors will not be validated, this is not considered an error, but such descriptors will
            be logged, so that it is possible to catch eventual errors. Try entering \`UNKNOWN\` as descriptor.
            - \`error\`: In the event of unexpected database errors, this property will host the specific \
            error message generated by the database engine.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Validate data definition.
 * The service will check whether the provided value corresponds to the provided data section.
 */
router.post(
    'definition',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckDefinition(request, response)
        }
    },
    'definition'
)
    .summary('Validate value by data definition')
    .description(dd
        `
            **Validate a value associated to a data definition**
            
            *Use this service if you want to check if the value of a data definition is correct.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the data definition object in the form of the \`_data\` contents of
            a descriptor term, and the value to be validated.
            
            The value will be validated against the provided data definition \
            and the service will return an object describing the status of the validation and eventual \
            additional information describing the outcome.
            
            Optionally, it is possible to indicate in which language the status message should be returned.
        `
    )
    .body(ValidateDefinition, dd
        `
            **Service parameters**
            
            - \`definition\`: The \`_data\` section of a descriptor.
            - \`value\`: The value to be tested against the data definition.
            - \`language\`: The \`iso_396_3\` language for status messages.
            
            The first two parameters are *required*, the last parameter is *optional*.
            
            The \`definition\` parameter is an object that represents the \`_data\` section 
            of a descriptor term. You can use this to test data definitions against values. 
            The object contents are expected to be at the top level, so the first property 
            will have to indicate whether the value is a scalar, array, etc.
            
            The \`language\` code is used to select the *language* of the *status message*:
            - if the language code is \`all\`, the message will be returned in
            *all available languages*,
            - if the language code is *wrong*, or there is *no message in that language*,
            the message will be returned in *English*.
            
            Language codes are in the form: \`iso_639_3_\` followed by the *three letter ISO language code*.
            Use \`iso_639_3_eng\` for English.
        `
    )
    .response(200, DefinitionReport, dd
        `
            **Validation status**
            
            The service will return three information items:
            - \`definition\`: The provided descriptor global identifier.
            - \`value\`: The descriptor value.
            - \`result\`: The status of the validation operation.
            
            The returned value, \`value\`, may be *different* than the provided value, because enumerations
            can be *resolved*: if the enumeration code is *not* a *term global identifier*, the full
            enumeration graph will be traversed and the first element whose local identifier matches the
            provided value will be considered the valid choice. Try entering \`_type\` as descriptor
            and \`string\` as the value: you will see that the value will be resolved to the full code
            value, \`_type_string\`.
            
            The \`result\` contains a \`status\` object which indicates the outcome of the validation.
            This status has two default elements: a \`code\` that is a numeric code, \`0\` means success,
            and a \`message\` string that describes the outcome. Depending on the eventual error, 
            the status may include other properties such as:
            - \`value\`: the value that caused the error.
            - \`descriptor\`: the descriptor involved in the error.
            - \`elements\`: in case an array has too little or too much elements.
            - \`property\`: missing required property, in case of incorrect data definition.
            - \`block\`: data definition section.
            - \`type\`: unimplemented or invalid data type, or data definition section name.
            - \`required\`: list of required properties, in case one is missing.
            - \`range\`: valid range, in the case of out of range values.
            - \`regexp\`: regular expression, in case a string does not match.
            
            Additional properties may be included in the result, depending on the eventual error, or in the event
            that an enumeration was resolved:
            - \`resolved\`: It is an object whose properties represent the enumeration descriptors whose values
            have been resolved, the values contain the original provided codes, while the \`value\` will contain the
            resolved values. Try entering \`_type\` as descriptor and \`string\` as the value.
            - \`ignored\`: It is an object whose properties represent the descriptors that were not recognised.
            Unknown descriptors will not be validated, this is not considered an error, but such descriptors will
            be logged, so that it is possible to catch eventual errors. Try entering \`UNKNOWN\` as descriptor.
            - \`error\`: In the event of unexpected database errors, this property will host the specific \
            error message generated by the database engine.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Validate object properties.
 * The service will check the validity of the provided object's properties.
 * MILKO - Need to check.
 */
router.post(
    'object',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckObject(request, response)
        }
    },
    'object'
)
    .summary('Validate object')
    .description(dd
        `
            **Validate object properties**
            
            *Use this service if you want to check if the properties of the provided object correct.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects an object in the \`value\` parameter whose properties are expected
            to be descriptor names. Properties that do not correspond to known descriptors will be
            ignored - *considered valid*.
            
            Optionally, it is possible to indicate in which language the status message should be returned.
        `
    )
    .body(ValidateObject, dd
        `
            **Service parameters**
            
            - \`value\`: The object to be validated.
            - \`language\`: The \`iso_396_3\` language for status messages.
            
            The first parameter is *required*, the second parameter is *optional*.
            
            The \`value\` parameter is the object to be validated. The service will iterate
            each property/value pair, considering the property as a descriptor and the value
            as its value. Properties that do not correspond to known descriptors will be
            ignored.
            
            The \`language\` code is used to select the *language* of the *status message*:
            - if the language code is \`all\`, the message will be returned in
            *all available languages*,
            - if the language code is *wrong*, or there is *no message in that language*,
            the message will be returned in *English*.
            
            Language codes are in the form: \`iso_639_3_\` followed by the *three letter ISO language code*.
            Use \`iso_639_3_eng\` for English.
        `
    )
    .response(200, joi.object(), dd
        `
            **Validation status**
            
            The service will return three information items:
            - \`value\`: The descriptor value.
            - \`result\`: The status of the validation operation.
            
            The returned value, \`value\`, may be *different* than the provided value, because enumerations
            can be *resolved*: if the enumeration code is *not* a *term global identifier*, the full
            enumeration graph will be traversed and the first element whose local identifier matches the
            provided value will be considered the valid choice. Try entering \`_type\` as descriptor
            and \`string\` as the value: you will see that the value will be resolved to the full code
            value, \`_type_string\`.
            
            The \`result\` contains a \`status\` object which indicates the outcome of the validation.
            This status has two default elements: a \`code\` that is a numeric code, \`0\` means success,
            and a \`message\` string that describes the outcome. Depending on the eventual error, 
            the status may include other properties such as:
            - \`value\`: the value that caused the error.
            - \`descriptor\`: the descriptor involved in the error.
            - \`elements\`: in case an array has too little or too much elements.
            - \`property\`: missing required property, in case of incorrect data definition.
            - \`block\`: data definition section.
            - \`type\`: unimplemented or invalid data type, or data definition section name.
            - \`required\`: list of required properties, in case one is missing.
            - \`range\`: valid range, in the case of out of range values.
            - \`regexp\`: regular expression, in case a string does not match.
            
            Additional properties may be included in the result, depending on the eventual error, or in the event
            that an enumeration was resolved:
            - \`resolved\`: It is an object whose properties represent the enumeration descriptors whose values
            have been resolved, the values contain the original provided codes, while the \`value\` will contain the
            resolved values. Try entering \`_type\` as descriptor and \`string\` as the value.
            - \`ignored\`: It is an object whose properties represent the descriptors that were not recognised.
            Unknown descriptors will not be validated, this is not considered an error, but such descriptors will
            be logged, so that it is possible to catch eventual errors. Try entering \`UNKNOWN\` as descriptor.
            - \`error\`: In the event of unexpected database errors, this property will host the specific \
            error message generated by the database engine.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Validate objects.
 * The service will iterate the provided array of objects and validate them.
 * It will return an object with three arrays:
 * - valid: The list of valid data elements.
 * - warnings: The list of warnings.
 * - errors: The list of errors
 */
router.post(
    'objects',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckObjects(request, response)
        }
    },
    'objects'
)
    .summary('Validate list of objects')
    .description(dd
        `
            **Validate objects**
            
            *Use this service if you want to validate a list of objects.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service will treat each element of the provided array as a generic object \
            to be validated. It will iterate each element of the provided list, validate \
            the contents of the object, and return a list of status reports whose position \
            matches the position of the corresponding object in the provided objects list.
            
            Please refer to the *"Validate object"* service for more information \
            on the format of the individual status reports.
            
            Optionally, it is possible to indicate in which language the status messages should be returned.
        `
    )
    .body(ValidateObjects, dd
        `
            **Service parameters**
                
            - \`value\`: List of objects to be validated.
            - \`language\`: The global identifier of the language in which you want the \
            status message to be returned.
            
            The \`value\` is required and the \`language\` is optional. \
            The value should contain the list of objects to be validated, \
            please refer to the *"Validate descriptor value"* service \
            for information on how to use the \`language\` parameter.
            
            Each object will be validated using the same strategy as the \
            *Validate object* service.
        `
    )
    .response(200, ValidationStatus, dd
        `
            **Validation status**
            
            The service will return two information items:
            - \`value\`: The list of validated objects.
            - \`result\`: The status of the validation operation.
            
            The \`value\` objects may be different from what was provided: please refer to the \
            *"Validate object"* service for more information.
            
            The \`result\` will be an array in which each element will contain the validation \
            status for the corresponding element of the provided \`value\`. This means that \
            index \`3\` of the \`result\` array will be the validation status for the element \
            with index \`3\` in the \`value\` parameter.
            
            Please refer to the object validation service for more information on \
            the format of each individual status.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )


//
// Main functions.
//

/**
 * Perform validation of provided descriptor and value.
 *
 * The service will check if the provided value is compatible with the provided
 * descriptor.
 *
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckDescriptorValue(theRequest, theResponse)
{
    ///
    // Init local storage.
    ///
    const validator =
        new Validator(
            theRequest.body,
            theRequest.queryParams.descriptor,
            false,
            theRequest.queryParams.cache,
            theRequest.queryParams.miss,
            theRequest.queryParams.terms,
            theRequest.queryParams.types,
            theRequest.queryParams.resolve,
            theRequest.queryParams.defns,
            theRequest.queryParams.resfld
        )

    //
    // Perform validation.
    //
    const status = validator.validate()

    ///
    // Handle status.
    ///
    if(validator.report.status.code === 0) {
        if (validator.report.hasOwnProperty('changes')) {
            theResponse.send({
                status: status,
                report: validator.report,
                value: validator.value
            })                                                          // ==>
        } else {
            theResponse.send({
                status: status,
                report: validator.report
            })                                                          // ==>
        }
    } else {
        theResponse.send({
            status: status,
            report: validator.report,
            value: validator.value
        })                                                              // ==>
    }

} // doCheckDescriptorValue()

/**
 * Perform validation of provided descriptor and list of values.
 *
 * The service will check if each of the provided values is compatible
 * with the provided descriptor.
 *
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckDescriptorValues(theRequest, theResponse)
{
    ///
    // Init local storage.
    ///
    const validator =
        new Validator(
            theRequest.body,
            theRequest.queryParams.descriptor,
            true,
            theRequest.queryParams.cache,
            theRequest.queryParams.miss,
            theRequest.queryParams.terms,
            theRequest.queryParams.types,
            theRequest.queryParams.resolve,
            theRequest.queryParams.defns,
            theRequest.queryParams.resfld
        )

    //
    // Perform validation.
    //
    const status = validator.validate()

    ///
    // Iterate statuses.
    ///
    const reports = []
    for(let i = 0; i < validator.report.length; i++) {
        if(validator.report[i].hasOwnProperty('changes')) {
            reports.push({
                report: validator.report[i],
                value: validator.value[i]
            })
        } else if(validator.report[i].status.code !== 0) {
            reports.push({
                report: validator.report[i],
                value: validator.value[i]
            })
        }
    }

    theResponse.send({
        status: status,
        reports: reports
    })

} // doCheckDescriptorValues()

/**
 * Perform validation of provided data definition and value.
 *
 * The service will return an object with the following properties:
 * - definition: The descriptor name.
 * - value: The tested value, may be updated with resolved enumerations.
 * - result: The status of the validation.
 *
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckDefinition(theRequest, theResponse)
{
    //
    // Perform validation.
    //
    let report = OldValidation.checkDefinition(
        theRequest.body.definition,
        theRequest.body,
        "value",
        theRequest.body.language
    )

    //
    // Remove descriptor from report.
    //
    if(report.hasOwnProperty("descriptor")) {
        delete report["descriptor"]
    }

    theResponse.send({
        "definition": theRequest.body.definition,
        "value": theRequest.body["value"],
        "result": report
    })

} // doCheckDefinition()

/**
 * Perform validation of provided list of objects.
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckObject(theRequest, theResponse)
{
    //
    // Parse provided object.
    //
    let report = OldValidation.checkObject(theRequest.body.value, theRequest.body.language)

    //
    // Check for errors.
    //
    // for(const item of Object.values(report)) {
    //     if((item.status.code !== 0) && (item.status.code !== 1)) {
    //         theResponse.status(400)
    //         break
    //     }
    // }

    theResponse.send({
        "value": theRequest.body.value,
        "result": report
    })                                                                          // ==>

} // doCheckObject()

/**
 * Perform validation of provided list of objects.
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckObjects(theRequest, theResponse)
{
    //
    // Check objects.
    //
    const report = OldValidation.checkObjects(theRequest.body.value, theRequest.body.language)

    //
    // Handle errors.
    //
    // if(report.hasOwnProperty('errors')) {
    //     theResponse.status(400)
    // }

    theResponse.send(report)                                                    // ==>

} // doCheckObjects()
