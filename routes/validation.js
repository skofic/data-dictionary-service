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
const Models = require('../models/validation_parameters.')
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

const StatusIdle = joi.object({
    status: joi.number().default(0).required()
})

const StatusIdleMany = joi.object({
    status: joi.number().default(0).required(),
    descriptor: joi.string().required(),
    valid: joi.number().required(),
    warnings: joi.number().default(0).required(),
    errors: joi.number().default(0).required()
})

const StatusObjectIdleMany = joi.object({
    status: joi.number().default(0).required(),
    valid: joi.number().required(),
    warnings: joi.number().default(0).required(),
    errors: joi.number().default(0).required()
})

const StatusResolvedMany = joi.object({
    status: joi.number().default(1).required(),
    descriptor: joi.string().required(),
    valid: joi.number().required(),
    warnings: joi.number().required(),
    errors: joi.number().default(0).required(),
    reports: joi.array().items(
        joi.object({
            status: joi.number().integer().min(-1).max(100).required(),
            report: joi.object({
                status: joi.object({
                    code: joi.number().required(),
                    message: joi.string().required()
                }).required(),
                changes: joi.object({
                    "<hash>": joi.object({
                        field: joi.string().required(),
                        original: joi.any().required(),
                        resolved: joi.any().required()
                    }).required()
                })
            }).required()
        }).required()
    ).required(),
    values: joi.array().items(joi.any()).required()
})

const StatusObjectResolvedMany = joi.object({
    status: joi.number().default(1).required(),
    valid: joi.number().required(),
    warnings: joi.number().required(),
    errors: joi.number().default(0).required(),
    reports: joi.array().items(
        joi.object({
            status: joi.number().integer().min(-1).max(100).required(),
            report: joi.object({
                status: joi.object({
                    code: joi.number().required(),
                    message: joi.string().required()
                }).required(),
                changes: joi.object({
                    "<hash>": joi.object({
                        field: joi.string().required(),
                        original: joi.any().required(),
                        resolved: joi.any().required()
                    }).required()
                })
            }).required()
        }).required()
    ).required(),
    values: joi.array().items(joi.any()).required()
})

const StatusErrorMany = joi.object({
    status: joi.number().default(-1).required(),
    descriptor: joi.string().required(),
    valid: joi.number().required(),
    warnings: joi.number().required(),
    errors: joi.number().required(),
    reports: joi.array().items(
        joi.object({
            status: joi.number().integer().min(-1).max(100).required(),
            report: joi.object({
                status: joi.object({
                    code: joi.number().required(),
                    message: joi.string().required()
                }).required(),
                descriptor: joi.string().required(),
                value: joi.any().required()
            }).required()
        }).required()
    ).required(),
    values: joi.array().items(joi.any()).required()
})

const StatusObjectErrorMany = joi.object({
    status: joi.number().default(-1).required(),
    valid: joi.number().required(),
    warnings: joi.number().required(),
    errors: joi.number().required(),
    reports: joi.array().items(
        joi.object({
            status: joi.number().integer().min(-1).max(100).required(),
            report: joi.object({
                status: joi.object({
                    code: joi.number().required(),
                    message: joi.string().required()
                }).required(),
                descriptor: joi.string().required(),
                value: joi.any().required()
            }).required()
        }).required()
    ).required(),
    values: joi.array().items(joi.any()).required()
})

const StatusResolved = joi.object({
    status: joi.number().default(1).required(),
    report: joi.object({
        status: joi.object({
            code: joi.number().default(0).required(),
            message: joi.string().required()
        }).required(),
        changes: joi.object({
            "<hash>": joi.object({
                field: joi.string().required(),
                original: joi.any().required(),
                resolved: joi.any().required()
            }).required()
        }).required()
    }).required(),
    value: joi.any().required()
})

const StatusError = joi.object({
    status: joi.number().default(-1).required(),
    report: joi.object({
        status: joi.object({
            code: joi.number().required(),
            message: joi.string().required()
        }).required(),
        descriptor: joi.string().required(),
        value: joi.any().required()
    }).required(),
    value: joi.any().required()
})

const ObjectValue = joi.object()
        .required()

const ObjectValues = joi.array()
    .items(
        joi.object()
    )
    .required()


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
            
            *Note: if you provide terms to this service, ensure all required \
            properties have been provided: fields such as official identifiers \
            will not be automatically fixed by the service and will be considered \
            correct. Use the terms insert or insert many services with the \`save\` \
            parameter unset to validate terms that have not yet been saved.*
        `
    )
    .queryParam('descriptor', Models.ParamDescriptor)
    .queryParam('cache', Models.ParamUseCache)
    .queryParam('miss', Models.ParamCacheMissed)
    .queryParam('terms', Models.ParamExpectTerms)
    .queryParam('types', Models.ParamExpectTypes)
    .queryParam('defns', Models.ParamDefNamespace)
    .queryParam('resolve', Models.ParamResolve)
    .queryParam('resfld', Models.ParamResolveField)
    .body(DescriptorValue, dd
        `
            **Descriptor value**
            
            Provide the value associated to the descriptor, it can be of any type.
        `
    )
    .response(200, StatusIdle, dd`
        **Idle validation status**
        
        This response will be returned if the validation did not return any \
        errors or warnings.
        
        The returned value will be an object with a single property, \`status\` \
        that will have a value of *zero*.
    `)
    .response(202, StatusResolved, dd`
        **Resolved validation status**
        
        This response will be returned if the \`resolve\` option is set and there \
        was a value that was resolved. The validation passed, but there were \
        modifications to the original value, which means that modifications are \
        needed to the value.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The validation status which will be the number *one*.
        - \`report\`: The validation report:
          - \`status\`: The status report:
            - \`code\`: The status code, that will be *zero*.
            - \`message\`: The status report message.
          - \`changes\`: The list of resolved values:
            - *hash*: This will be a hash used to disambiguate and group \
                      resolved values.
              - \`field\`: The property name.
              - \`original\`: The original value.
              - \`resolved\`: The resolved value.
        - \`value\`: The provided value with modifications applied.
    `)
    .response(400, StatusError, dd`
        **Error validation status**
        
        This response will be returned if the validation failed.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The validation status which will be the number *minus one*.
        - \`report\`: The validation report:
          - \`status\`: The status report:
            - \`code\`: The status code, that will be *non-zero*.
            - \`message\`: The status report message describing the error.
          - \`descriptor\`: The property name that has the error.
          - \`value\`: The value that caused the error.
        - \`value\`: The originally provided value.
    `)
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
            
            The service will only return status and values of items that had \
            resolved values, or items that were incorrect. The returned global \
            status will be *zero* only if all items were correct; *one* if at \
            least one item had resolved values and no items were incorrect; \
            *minus one* if there was at least one error.
        `
    )
    .queryParam('descriptor', Models.ParamDescriptor)
    .queryParam('cache', Models.ParamUseCache)
    .queryParam('miss', Models.ParamCacheMissed)
    .queryParam('terms', Models.ParamExpectTerms)
    .queryParam('types', Models.ParamExpectTypes)
    .queryParam('defns', Models.ParamDefNamespace)
    .queryParam('resolve', Models.ParamResolve)
    .queryParam('resfld', Models.ParamResolveField)
    .body(DescriptorValues, dd
        `
            **Descriptor values**
            
            Provide an array containing the list of values to be validated \
            using the provided descriptor definitions.
        `
    )
    .response(200, StatusIdleMany, dd`
        **No errors**
        
        This response will be returned if *all the validations* did not return \
        an error and did not resolve any values.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The status of the whole operation, will be *zero*.
        - \`descriptor\`: The descriptor that was passed to the service.
        - \`valid\`: The number of valid items, all in this case.
        - \`warnings\`: The number of items that had resolved values, none in this case.
        - \`errors\`: The number of incorrect items, none in this case.
        
        The list of provided items will not be returned in this case.
    `)
    .response(202, StatusResolvedMany, dd`
        **Resolved values**
        
        This response will be returned if *all the validations* did not return \
        an error and did not resolve any values.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The status of the whole operation, will be *zero*.
        - \`descriptor\`: The descriptor that was passed to the service.
        - \`valid\`: The number of valid items.
        - \`warnings\`: The number of items that had resolved values.
        - \`errors\`: The number of incorrect items, none in this case.
        - \`reports\`: An array of status reports:
          - \`status\`: The status for the item.
          - \`report\`: An object containing the status report for the item:
            - \`status\`: The status record for the item:
              - \`code\`: The status code for the item, will be *zero*.
              - \`message\`: The status message for the item.
            - \`changes\`: The list of resolved values for the item.
              - *hash*: This will be a hash used to disambiguate and group \
                        resolved values.
              - \`field\`: The property name.
              - \`original\`: The original value.
              - \`resolved\`: The resolved value.
        - \`values\`: The list of values corresponding to the reports.
        
        The service will only return the items that had resolved values.
    `)
    .response(400, StatusErrorMany, dd`
        **Invalid parameter**
        
        This response will be returned if *at least one error* was returned.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The status of the whole operation, will be *minus one*.
        - \`descriptor\`: The descriptor that was passed to the service.
        - \`valid\`: The number of valid items.
        - \`warnings\`: The number of items that had resolved values.
        - \`errors\`: The number of incorrect items.
        - \`reports\`: An array of status reports:
          - \`status\`: The status for the item.
          - \`report\`: An object containing the status report for the item:
            - \`status\`: The status record for the item:
              - \`code\`: The status code for the item.
              - \`message\`: The status message for the item.
            - \`changes\`: The list of resolved values for the item.
              - *hash*: This will be a hash used to disambiguate and group \
                        resolved values.
              - \`field\`: The property name.
              - \`original\`: The original value.
              - \`resolved\`: The resolved value.
            - \`descriptor\`: The descriptor that was passed to the service.
            - \`value\`: The value that triggered the error.
        - \`values\`: The list of values corresponding to the reports.
        
        The service will only return incorrect items and items that had resolved values.
    `)
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
    .queryParam('cache', Models.ParamUseCache)
    .queryParam('miss', Models.ParamCacheMissed)
    .queryParam('terms', Models.ParamExpectTerms)
    .queryParam('types', Models.ParamExpectTypes)
    .queryParam('defns', Models.ParamDefNamespace)
    .queryParam('resolve', Models.ParamResolve)
    .queryParam('resfld', Models.ParamResolveField)
    .body(ObjectValue, dd
        `
            **Value to be validated**
            
            Provide the object to be validated.
        `
    )
    .response(200, StatusIdle, dd`
        **Idle validation status**
        
        This response will be returned if the validation did not return any \
        errors or warnings.
        
        The returned value will be an object with a single property, \`status\` \
        that will have a value of *zero*.
    `)
    .response(202, StatusResolved, dd`
        **Resolved validation status**
        
        This response will be returned if the \`resolve\` option is set and there \
        was a value that was resolved. The validation passed, but there were \
        modifications to the original value, which means that modifications are \
        needed to the value.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The validation status which will be the number *one*.
        - \`report\`: The validation report:
          - \`status\`: The status report:
            - \`code\`: The status code, that will be *zero*.
            - \`message\`: The status report message.
          - \`changes\`: The list of resolved values:
            - *hash*: This will be a hash used to disambiguate and group \
                      resolved values.
              - \`field\`: The property name.
              - \`original\`: The original value.
              - \`resolved\`: The resolved value.
        - \`value\`: The provided value with modifications applied.
    `)
    .response(400, StatusError, dd`
        **Error validation status**
        
        This response will be returned if the validation failed.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The validation status which will be the number *minus one*.
        - \`report\`: The validation report:
          - \`status\`: The status report:
            - \`code\`: The status code, that will be *non-zero*.
            - \`message\`: The status report message describing the error.
          - \`changes\`: The list of eventual resolved values:
            - *hash*: This will be a hash used to disambiguate and group \
                      resolved values.
              - \`field\`: The property name.
              - \`original\`: The original value.
              - \`resolved\`: The resolved value.
          - \`descriptor\`: The property name that has the error.
          - \`value\`: The value that caused the error.
        - \`value\`: The originally provided value.
    `)
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
    .queryParam('cache', Models.ParamUseCache)
    .queryParam('miss', Models.ParamCacheMissed)
    .queryParam('terms', Models.ParamExpectTerms)
    .queryParam('types', Models.ParamExpectTypes)
    .queryParam('defns', Models.ParamDefNamespace)
    .queryParam('resolve', Models.ParamResolve)
    .queryParam('resfld', Models.ParamResolveField)
    .body(ObjectValues, dd
        `
            **Descriptor values**
            
            Provide an array containing the list of objects to be validated.
        `
    )
    .response(200, StatusObjectIdleMany, dd`
        **No errors**
        
        This response will be returned if *all the validations* did not return \
        an error and did not resolve any values.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The status of the whole operation, will be *zero*.
        - \`valid\`: The number of valid items, all in this case.
        - \`warnings\`: The number of items that had resolved values, none in this case.
        - \`errors\`: The number of incorrect items, none in this case.
        
        The list of provided objects will not be returned in this case.
    `)
    .response(202, StatusObjectResolvedMany, dd`
        **Resolved values**
        
        This response will be returned if *all the validations* did not return \
        an error and did not resolve any values.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The status of the whole operation, will be *zero*.
        - \`valid\`: The number of valid objects.
        - \`warnings\`: The number of objects that had resolved values.
        - \`errors\`: The number of incorrect objects, none in this case.
        - \`reports\`: An array of status reports:
          - \`status\`: The status for the item.
          - \`report\`: An object containing the status report for the item:
            - \`status\`: The status record for the item:
              - \`code\`: The status code for the item, will be *zero*.
              - \`message\`: The status message for the item.
            - \`changes\`: The list of resolved values for the item.
              - *hash*: This will be a hash used to disambiguate and group \
                        resolved values.
              - \`field\`: The property name.
              - \`original\`: The original value.
              - \`resolved\`: The resolved value.
        - \`values\`: The list of values corresponding to the reports.
        
        The service will only return the items that had resolved values.
    `)
    .response(400, StatusObjectErrorMany, dd`
        **Invalid parameter**
        
        This response will be returned if *at least one error* was returned.
        
        The returned value will be an object with the following properties:
        
        - \`status\`: The status of the whole operation, will be *minus one*.
        - \`valid\`: The number of valid items.
        - \`warnings\`: The number of items that had resolved values.
        - \`errors\`: The number of incorrect items.
        - \`reports\`: An array of status reports:
          - \`status\`: The status for the item.
          - \`report\`: An object containing the status report for the item:
            - \`status\`: The status record for the item:
              - \`code\`: The status code for the item.
              - \`message\`: The status message for the item.
            - \`changes\`: The list of resolved values for the item.
              - *hash*: This will be a hash used to disambiguate and group \
                        resolved values.
              - \`field\`: The property name.
              - \`original\`: The original value.
              - \`resolved\`: The resolved value.
            - \`descriptor\`: The descriptor that was passed to the service.
            - \`value\`: The value that triggered the error.
        - \`values\`: The list of values corresponding to the reports.
        
        The service will only return incorrect items and items that had resolved values.
    `)
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
    switch(status)
    {
        case 0:
            theResponse.status(200)
            theResponse.send({ status })
            break
        
        case 1:
            theResponse.status(202)
            theResponse.send({
                status: status,
                report: validator.report,
                value: validator.value
            })
            break
        
        case -1:
            theResponse.status(400)
            theResponse.send({
                status: status,
                report: validator.report,
                value: validator.value
            })
            break
        
        default:
            throw new Error(`Unknown validation status: ${status}`)     // ==>
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
    
    //
    // Collect statistics.
    //
    const values = []
    const reports = []
    validator.report.forEach( (report, index) => {
        if(report.status.code !== 0 || report.hasOwnProperty('changes')) {
            reports.push({
                status: (report.status.code !== 0) ? -1 : 1,
                report: report
            })
            values.push(validator.value[index])
       }
    })
    
    ///
    // Set HTTP status.
    ///
    switch(status) {
        case -1:
            theResponse.status(400)
            theResponse.send({
                status,
                descriptor: theRequest.queryParams.descriptor,
                valid: validator.valid,
                warnings: validator.warnings,
                errors: validator.errors,
                reports,
                values
            })
            break
        
        case 0:
            theResponse.status(200)
            theResponse.send({
                status,
                descriptor: theRequest.queryParams.descriptor,
                valid: validator.valid,
                warnings: validator.warnings,
                errors: validator.errors
            })
            break
        case 1:
            theResponse.status(202)
            theResponse.send({
                status,
                descriptor: theRequest.queryParams.descriptor,
                valid: validator.valid,
                warnings: validator.warnings,
                errors: validator.errors,
                reports,
                values
            })
            break
        
        default:
            throw new Error(`Unknown validation status: ${status}`)     // ==>
    }

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
    //
    // Perform validation.
    //
    const status = validator.validate()
    switch(status)
    {
        case 0:
            theResponse.status(200)
            theResponse.send({ status })
            break
        
        case 1:
            theResponse.status(202)
            theResponse.send({
                status: status,
                report: validator.report,
                value: validator.value
            })
            break
        
        case -1:
            theResponse.status(400)
            theResponse.send({
                status: status,
                report: validator.report,
                value: validator.value
            })
            break
        
        default:
            throw new Error(`Unknown validation status: ${status}`)     // ==>
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
    
    //
    // Collect statistics.
    //
    const values = []
    const reports = []
    validator.report.forEach( (report, index) => {
        if(report.status.code !== 0 || report.hasOwnProperty('changes')) {
            reports.push({
                status: (report.status.code !== 0) ? -1 : 1,
                report: report
            })
            values.push(validator.value[index])
        }
    })
    
    ///
    // Set HTTP status.
    ///
    switch(status) {
        case -1:
            theResponse.status(400)
            theResponse.send({
                status,
                descriptor: theRequest.queryParams.descriptor,
                valid: validator.valid,
                warnings: validator.warnings,
                errors: validator.errors,
                reports,
                values
            })
            break
        
        case 0:
            theResponse.status(200)
            theResponse.send({
                status,
                descriptor: theRequest.queryParams.descriptor,
                valid: validator.valid,
                warnings: validator.warnings,
                errors: validator.errors
            })
            break
        case 1:
            theResponse.status(202)
            theResponse.send({
                status,
                descriptor: theRequest.queryParams.descriptor,
                valid: validator.valid,
                warnings: validator.warnings,
                errors: validator.errors,
                reports,
                values
            })
            break
        
        default:
            throw new Error(`Unknown validation status: ${status}`)     // ==>
    }

} // doCheckObjects()
