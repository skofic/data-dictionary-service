### _code

------

#### Identification section

------

This object groups all properties whose function is to identify terms in the data dictionary.

------

All terms *require* this object property which features the following identifiers:

- [Namespace](_nid): The namespace is the [global identifier](_gid) of a *term* that is used to *disambiguate* [local identifiers](_lid). This can be used to allow several terms to share the same [code](_lid). This property is *optional*.
- [Local identifier](_lid): A *code* that *uniquely identifies* the *term* within its [namespace](_nid). This property is *required*.
- [Global identifier](_gid): The *concatenation* of [namespace](_nid) and [local](_lid) identifiers, joined by a *separator token*, this *constitutes* the *unique identifier* of the *term*. This property is *required* and its value will be copied to the [document key](_key).
- [Identifier codes](_aid): List of all relevant *code identifiers* related to the term *including* the [local identifier](_lid).
- [Provider identifiers](_pid): List of *code identifiers* assigned to the *term* by *data providers*.
- [Name](_name): *Local*, *native* or *original name* assigned to the term. This property is *optional* and should be *only* used if such information is *relevant*.
- [Regular expression](_regexp): This property can be used to *apply* a *validation pattern* to the [local identifier](_lid), it is an *optional* property.

This object section groups all the relevant information needed to identigy terms using codes.

------

```json
{
	"_code": {
		"_nid": "iso_3166_1",
		"_lid": "ITA",
		"_gid": "iso_3166_1_ITA",
		"_aid": ["ITA", "IT"],
		"_name": "Italia",
    "_regexp": "[A-Z]{3,3}"
	}
}
```

This snippet holds the following information:

- [Namespace](_nid): `iso_3166_1` represents the [ISO](https://www.iso.org/home.html) [countries](https://www.iso.org/iso-3166-country-codes.html) standard, this means that all the [local identifiers](_lid) of terms which feature this namespace are assumed to *belong* to [that](https://en.wikipedia.org/wiki/ISO_3166-1) standard.
- [Local identifier](_lid): `ITA` is the term *local identifier* or *code*. Within the `iso_3166_1` [namespace](_nid), only *this* term can have this local identifier *code*.
- [Global identifier](_gid): `iso_3166_1_ITA` is the *combination* of the [namespace](_nid), `iso_3166_1`, with the [local identifier](_lid), `ITA`, *joined* by the *underscore*, `_`, token. This represents the *unique identifier* of the *term*, meaning that there can *only be one term* featuring this [unique identifier](_gid).
- [All identifiers](_aid): this *set* of *codes* collects all *local identifiers* that *can be used* to *select* the *current term*. This is a *list* of *acronyms* that can safely be *associated* with the *term*. The [local identifier](_lid) *must* be *included*. This means that `Italy` can be identified both with the *2-character* code `IT`, or with the *3-character* code `ITA`.
- [Name](_name): In *this case* it *makes sense* to include the *original name* of the term, which, is `Italia`, *Italy* in *Italian*. *This information should only be included if relevant*.
- [Regular expression](_regex): This represents a *pattern* to which the [local identifier](_lid) *must conform*. There is already a *regular expression* that *restricts all local identifiers*, the current [field](_regex) can be used to *further restrict* the *pattern*.

