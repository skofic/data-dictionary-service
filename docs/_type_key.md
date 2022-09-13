### _type_key

------

#### Key data type

------

The data type of the dictionary key.

------

This field defines the data type of the dictionary key, it is an enumerated choice that can take the following values:

- [String](_type_string): A *character* or *text* encoded in UTF-8. The [data section](_data) can include the [regular expression](_regexp) property.
- [Key reference](_type_string_key): A [string](_type_string) representing the [global identifier](_gid) of a *document* from the *terms collection*. The [data section](_data) is *required* to include the [data kind](_kind) field which specifies the *kind of term*, these are the allowed choices:
    - [Any term](_any-term): The value can reference *any term* in the *terms collection*.
    - [Any enumeration](_any-enum): The value can reference *any term* *belonging* to a *controlled vocabulary*, this means that the *term* must be *referenced* in at least one *edge* with the [enumeration](_predicate_enum-of) [predicate](_predicate).
    - [Any structure](_any-object): The value can reference *any term* that *defines* an *object data structure*: such terms must have the [rules section](_rule) property.
    - [Any descriptor](_any-descriptor): The value can reference *any term* that *defines* a *descriptor*: such terms must have the [data section](_data) property.
- [Enumeration](_type_string_enum): A [string](_type_string) representing the [global identifier](_gid) of a *document* belonging to the *terms collection* that is part of a *controlled vocabulary*. The [data section](_data) can include the following properties: [format](_format), [unit](_unit), [unit name](_unit-name) and [regular expression](_regexp). In addition, the [data section](_data) *requires* the [data kind](_kind) field, that is *must* *specify* from which *controlled vocabulary* the value must be *chosen*.

When validating dictionary types, the *key* and *value* parts are *parsed* and *validated independently*, dictionary keys are not considered descriptors.

The [key type](_type_key) field is *required*.