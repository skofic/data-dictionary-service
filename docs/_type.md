### _type

------

#### Data type

------

The data type of the descriptor's value.

------

The *data type* defines the *type* that the *value* or *values* held by the *descriptor* should have. This type applies to the *scalar dimension* of the *value*, this means that, in the case of an *array*, the type *applies* to the *array elements*.

These are the possible values:

- [Boolean](_type_boolean): *True* or *false* value. No other [data section](_data) properties are expected.
- [Integer](_type_integer): *Numeric discrete* value. The [data section](_data) can include the following properties: [unit](_unit), [unit name](_unit-name), [range](_range), [valid range](_valid-range) and [normal range](_normal-range).
- [Numeric](_type_number): *Numeric discrete* or *continuous* value; will be considered a *floating point number*. The [data section](_data) can include the following properties: [unit](_unit), [unit name](_unit-name), [range](_range), [valid range](_valid-range) and [normal range](_normal-range).
- [Time-stamp](_type_number_timestamp): A [numeric](_type_number) Unix Timestamp, it is used to indicate a *precise moment in time*. The [data section](_data) can include the following properties: [range](_range), [valid range](_valid-range) and [normal range](_normal-range).
- [String](_type_string): A *character* or *text* encoded in UTF-8. The [data section](_data) can include the following properties: [format](_format), [unit](_unit), [unit name](_unit-name) and [regular expression](_regexp).
- [Key reference](_type_string_key): A [string](_type_string) representing the [global identifier](_gid) of a *document* from the *terms collection*. The [data section](_data) is *required* to include the [data kind](_kind) field which specifies the *kind of term*, these are the allowed choices:
    - [Any term](_any-term): The value can reference *any term* in the *terms collection*.
    - [Any enumeration](_any-enum): The value can reference *any term* *belonging* to a *controlled vocabulary*, this means that the *term* must be *referenced* in at least one *edge* with the [enumeration](_predicate_enum-of) [predicate](_predicate).
    - [Any structure](_any-object): The value can reference *any term* that *defines* an *object data structure*: such terms must have the [rules section](_rule) property.
    - [Any descriptor](_any-descriptor): The value can reference *any term* that *defines* a *descriptor*: such terms must have the [data section](_data) property.
- [Document handle](_type_string_handle): A [string](_type_string) representing the [document handle](_id) of a *record* belonging to *any collection*. No other [data section](_data) properties are expected.
- [Enumeration](_type_string_enum): A [string](_type_string) representing the [global identifier](_gid) of a *document* belonging to the *terms collection* that is part of a *controlled vocabulary*. The [data section](_data) can include the following properties: [format](_format), [unit](_unit), [unit name](_unit-name) and [regular expression](_regexp). In addition, the [data section](_data) *requires* the [data kind](_kind) field, that is *must* *specify* from which *controlled vocabulary* the value must be *chosen*.
- [Object](_type_object): An *object data structure*. The [data section](_data) is required to contain the [data kind](_kind) field, and these are the allowed choices:
    - *A [global identifier](_gid)*: It must be one or more [key references](_type_string_key) to *terms* that define a *data structure type*, the term *must include* the [rules section](_rule). This means that the value *must* be an *object* of *that type*.
    - [Any structure](_any-object): The value can be an *object* of *any type*, but its *properties* will be *parsed* and *validated*. This means that only the *constraints* at the *object level* will be *ignored*.
- [GeoJSON](_type_geo-json): An *object data structure* representing a *geographic structure* encoded in the [GeoJSON](https://geojson.org) data format. No other [data section](_data) properties are expected.

If the [data type](_type) is *omitted*, it means that the *value* can be of *any scalar type*.

