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
const Session = require('../utils/sessions')
const Validator = require('../library/Validator')

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

const StatusReport = joi.object({
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

const ObjectValue = joi.object()
        .required()

const ObjectValues = joi.array()
    .items(
        joi.object()
    )
    .required()


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
    .response(200, StatusReport,
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
    .response(200, StatusReport,
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
 * Validate object.
 * The service will check the validity of the provided object.
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
            **Validate the provided object**
            
            *Use this service if you want to check if the provided object is correct.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the object in the request body.
            
            The service will iterate all object's properties, match them with \
            data dictionary descriptors and validate the property values. The \
            service will return a status report including all errors and warnings.
            
            The service also expects a series of path query parameters that provide \
            custom options governing the validation process.
        `
    )
    .queryParam('cache', ParamUseCache, ParamUseCacheDescription)
    .queryParam('miss', ParamCacheMissed, ParamCacheMissedDescription)
    .queryParam('terms', ParamExpectTerms, ParamExpectTermsDescription)
    .queryParam('types', ParamExpectType, ParamExpectTypeDescription)
    .queryParam('resolve', ParamResolve, ParamResolveDescription)
    .queryParam('resfld', ParamResolveField, ParamResolveFieldDescription)
    .queryParam('defns', ParamDefNamespace, ParamDefNamespaceDescription)
    .body(ObjectValue, dd
        `
            **Value to be validated**
            
            Provide the object to be validated.
        `
    )
    .response(200, StatusReport,
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
            **Validate the provided list of objects**
            
            *Use this service if you want to check if the provided list of objects is correct.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the array of objects in the request body.
            
            The service will scan all array elements iterating the object's \
            properties, match them with data dictionary descriptors and validate \
            the property values. The service will return a status report including \
            all errors and warnings.
            
            The service also expects a series of path query parameters that provide \
            custom options governing the validation process.
       `
    )
    .queryParam('cache', ParamUseCache, ParamUseCacheDescription)
    .queryParam('miss', ParamCacheMissed, ParamCacheMissedDescription)
    .queryParam('terms', ParamExpectTerms, ParamExpectTermsDescription)
    .queryParam('types', ParamExpectType, ParamExpectTypeDescription)
    .queryParam('resolve', ParamResolve, ParamResolveDescription)
    .queryParam('resfld', ParamResolveField, ParamResolveFieldDescription)
    .queryParam('defns', ParamDefNamespace, ParamDefNamespaceDescription)
    .body(ObjectValues, dd
        `
            **Descriptor values**
            
            Provide an array containing the list of values to be matched \
            with the provided descriptor.
        `
    )
    .response(200, StatusReport,
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
 * Perform validation of provided object.
 *
 * The service will iterate the provided object's properties matching them to
 * data dictionary descriptors and validating their values.
 *
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckObject(theRequest, theResponse)
{
    ///
    // Init local storage.
    ///
    const validator =
        new Validator(
            theRequest.body,
            '',
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

} // doCheckObject()

/**
 * The service will iterate the provided list of objects validating them
 * against the data dictionary descriptors.
 *
 * @param theRequest {Object}: Service request.
 * @param theResponse {Object}: Service response.
 */
function doCheckObjects(theRequest, theResponse)
{
    ///
    // Init local storage.
    ///
    const validator =
        new Validator(
            theRequest.body,
            '',
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

} // doCheckObjects()
