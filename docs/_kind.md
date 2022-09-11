### _kind

#### Data type references

Set of data type references to which the property value must belong. The reference must be in the form of a term global identifier.

This field is a [set](_set) of [global identifiers](_gid) which reference terms that represent *root elements* of *controlled vocabularies*, *object data structures* and other kind of *graphs*. The field is relevant to the [data type](_type) of the current descriptor and is *required* and *restricted* to the [data type](_type) values:

- [Key reference](_type_string_key): the *data kind* is required and can take the following values:
    - [Any term](_any-term): The value can reference *any term* in the *terms collection*.
    - [Any enumeration](_any-enum): The value can reference *any term* *belonging* to a *controlled vocabulary*, this means that the *term* must be *referenced* in at least one *edge* with the [enumeration](_predicate_enum-of) [predicate](_predicate).
    - [Any structure](_any-object): The value can reference *any term* that *defines* an *object data structure*: such terms must have the [rules section](_rule) property.
    - [Any descriptor](_any-descriptor): The value can reference *any term* that *defines* a *descriptor*: such terms must have the [data section](_data) property.

- [Enumeration](_type_string_enum): the *data kind* is *required* to indicate the *list* of *controlled vocabularies* to which the *value* must *belong*. The set *elements* are the [global identifiers](_gid) of *terms* at the *root* of an *enumeration graph*.
- [Object](_type_object): the *data kind* is *required*, it must contain [key references](_type_string_key) to *term*s that define *data structure types*, the referenced terms *must include* the [rules section](_rule). This means that the value *must* *conform* to *at least one* of the referenced *structure definitions*. This field can contain the following values:
    - [Global identifier](_gid): It must be one or more [key references](_type_string_key) to *terms* that define a *data structure type*, the term *must include* the [rules section](_rule). This means that the value *must* be an *object* of *that type*.
    - [Any structure](_any-object): The value can be an *object* of *any type*, but its *properties* will be *parsed* and *validated*. This means that only the *constraints* at the *object level* will be *ignored*.