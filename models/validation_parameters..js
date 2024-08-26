'use strict'

const joi = require('joi')

/**
 * Path query parameters.
 */
const ParamDescriptor = joi.string()
	.required()
	.description(
		"**Descriptor**.\n" +
		"Provide the global identifier of the descriptor associated with the \
		provided value."
	)

const ParamUseCache = joi.boolean()
	.default(true)
	.description(
		"**Use cache**.\n" +
		"Cache all terms used in the validation procedure. This can speed the \." +
		"execution when validating large lists of values."
	)

const ParamCacheMissed = joi.boolean()
	.default(true)
	.description(
		"**Cache unresolved references**.\n" +
		"This option is only relevant if the *use cache* flag is set. If set, \
		also unresolved term references will be cached, this can be useful if \
		the data contains a large number of incorrect references with the same value."
	)

const ParamExpectTerms = joi.boolean()
	.default(true)
	.description(
		"**Expect all object properties to be part of the data dictionary**.\n\
		By default, if a property matches a descriptor, then the value must \
		conform to the descriptor's data definition; if the property does not match \
		a term in the data dictionary, then it will be ignored and assumed correct. \
		If you set this flag, all object properties *must* correspond to a descriptor, \
		failing to do so will be considered an error."
	)

const ParamExpectTypes = joi.boolean()
	.default(false)
	.description(
		"**Expect all scalar data sections to have the data type**.\n\
		By default, if a scalar data definition section is empty, we assume the \
		value can take any scalar value: if you set this flag, it means that all \
		scalar data definition sections need to indicate the data type, failing \
		to do so will be considered an error."
	)

const ParamDefNamespace = joi.boolean()
	.default(false)
	.description(
		"**Allow referencing default namespace**.\n\
		The default namespace is reserved to terms that constitute the dictionary \
		engine. User-defined terms should not reference the default namespace. \
		If this option is set, it will be possible to create terms that have the \
		*default namespace* as their namespace."
	)

const ParamSaveTerm = joi.boolean()
	.default(true)
	.description(
		"**Flag to determine whether to save the term or not**.\n\
		This option can be used when inserting or updating terms: if the flag \
		is set, if all the required validations tests pass, the term will be \
		either inserted or updated. If the flag is not set, you will get the \
		status of the validation process. This flag is useful if you just need \
		to check if the term is valid, or if you want to see if the updated term \
		structure before persisting the object to the data dictionary."
	)

const ParamResolve = joi.boolean()
	.default(false)
	.description(
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
	)

const ParamResolveField = joi.string()
	.default(
		module.context.configuration.localIdentifier
	)
	.description(
		"**Terms code section field used to resolve term references**.\n" +
		"This option is relevant if the *resolve* flag was set. This parameter \
		corresponds to the name of a property in the descriptor's code section: \
		the unresolved value will be matched against the value contained in that \
		field and if there is a *single* match, the matched term global identifier \
		will replace the provided value.\n" + "By default this parameter is set \
	    to the *local identifier*, you could set it, for instance, to the *list \
	    of official identifiers* in order to have a larger choice."
	)

///
// Status reports.
///



module.exports = {
	ParamDescriptor,
	ParamUseCache,
	ParamCacheMissed,
	ParamExpectTerms,
	ParamExpectTypes,
	ParamDefNamespace,
	ParamSaveTerm,
	ParamResolve,
	ParamResolveField
}
