# Data Dictionary Services

This repository contains the [ArangoDB](https://www.arangodb.com) [Foxx micro service](https://www.arangodb.com/docs/stable/foxx.html) to manage and use the data dictionary.

## Installation

1. You must first either install [ArangoDB](https://www.arangodb.com), or have an existing database available.
2. *Create* or *select* an existing *database*.
3. In the `Services` *left tab* press the `+ Add service` button.
4. Select the `GitHub` *top tab*, set the `Repository*` field to **skofic/data-dictionary-service** and the `Version*` field to **main**; press the `Install` button.
5. An alert will be presented requesting the `Mount point` for the service, you can provide *any suitable value*, ensure the `Run setup?` checkbox is *checked*. Press the `Install` button.

At this point the service will do the following actions:

1. It will create the necessary *collections*, if not already there:
    - The *terms* document collection that will hold all terms.
    - The *edges* edge collection to store relationships between terms.
    - The *links* edge collection to keep track of term dependencies.
    - The *topo* edge collection that holds the knowledge graph.

You will see that in the `Services` *left tab* there is a *top tab* called `Settings`: this can be used to *customise* the general *settings*:

- General standards:
    - `language`: Default language ISO code: this is the code used in the data dictionary.
- Cryptographic settings:
    - `cookie`: Cookie name
    - `method`: Hashing algorithm for creating passwords.
    - `saltLength`: Length of the salt that will be generated for password hashes.
    - `secretLength`: Length of the cookie secret.
    - `timeToLive`: Cookie time to live (60 x 60 x 24 x 7).
- Collection names:
    - `collectionTerm`: Terms document collection.
    - `collectionEdge`: Relationships edge collection.
    - `collectionLink`: Dependency edge collection.
    - `collectionTopo`: Knowledge graph edge collection.
    - `collectionUser`: Users document collection.
    - `collectionSession`: Sessions document collection.
    - `collectionSettings`: Settings document collection.

Some services require users to be authenticated, for this purpose you should install the [authentication services](https://github.com/skofic/authentication-services) and follow the instructions for creating the default users.

Note that the authentication services only use the `admin` role code, tis set of services requires the following additional roles:

- `dict`: The user can create and manage data dictionary items.
- `read`: The user can use the data dictionary, but he/she cannot change its elements.

Remember this when you create the users in the authentication services.

## Documentation

The data dictionary documentation is in progress, you can go to **[THIS](https://github.com/skofic/data-dictionary-management/blob/main/docs/README.md)** page to have an idea of the principles and ideas behind this data dictionary.

## Services

The services are divided into sections, each dealing with specific elements of the data dictionary.

The provided services do not cover all aspects of the data dictionary, the rules governing the data dictionary are almost all fixed, what needs to be done is to finalise and streamline the code needed to validate the structure of the dictionary and provide services that can safely be used without compromising the integrity of the dictionary.

Also, a dedicated user interface is still missing: once it will be available it will be possible to finalise the services layer using a viable testing ground.

### Terms

This set of services can be used to create and manage terms. Terms are the building blocks used by the dictionary to represent descriptors, types, controlled vocabularies and all elements that comprise the items that constitute the data dictionary.

All terms must have the following properties:

- `_code`: An object containing all the identifiers by which the term can be referred to.
- `_info`: An object containing multilingual text fields containing the descriptions and metadata of the term.

A term containing only the above sections can be a namespace, a controlled vocabulary element, a type or a section. Other properties are needed so that aterm can have other capabilities.

A *descriptor*, a term that represents a data variable, must also have the following properties:

- `_data`: A set of fields describing the types and restrictions applying to data that can be stored in the term.

A *structure*, a term that represents an object definition, must also have the following properties:

- `_rule`: A set of fields describing the rules applying to the object type.

A term may be all of the above.

In order to use these services the current user must have the `read` role to consult the dictionary and the `dict` role to make any changes, such as creating and deleting.

#### Create term

Use this service to create a new term.

The current user must have the `dict` role.

Provide the term in the request body, if the service succeeds, [`200`], it will return the newly created term.

The service may return the following errors:

- `400`: Invalid parameter.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `409`: The term already exists.
- `500`: all other errors.

#### Create terms

Use this service to create a set of new terms.

The current user must have the `dict` role.

Provide an array of term records in the request body, if the service succeeds, [`200`], it will return the newly created terms. When inserting the records, the operation is executed transactionally in an all-or-nothing fashion.

The service may return the following errors:

- `400`: Invalid parameter.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `409`: The term already exists.
- `500`: all other errors.

#### Update term

Use this service to update an existing term.

The current user must have the `dict` role.

Provide the term global identifier in the path query parameter `key` and the fields to be updated in the request body.

If the service succeeds, [`200`], it will return the updated term record plus a property, `status`, with the operation outcome.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: Term not found.
- `500`: all other errors.

#### Delete term

Use this service to delete an existing term.

The current user must have the `dict` role.

Provide the term global identifier in the path query parameter `key`, if the service succeeds, [`200`], it will return the deleted term's `id`, `_key` and `_rev`.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: Term not found.
- `500`: all other errors.

#### Delete terms

Use this service to delete a set of existing terms.

The current user must have the `dict` role.

Provide an array of term global identifiers in the request body, if the service succeeds, [`200`], it will return the operation statistics: the number of deleted and ignored records.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Get term by key

- Use this service to retrieve a term record matching the provided global identifier.

    The current user must have the `read` role.

    The service expects two parameters:

    - `key`: It represents the term `_key`, or global identifier.
    - `lang`: The language code for the description texts; the field will be set with the default language, or pass `@` to get the result in all languages.

    If the service succeeds, [`200`], it will return the matched term record.

    The service may return the following errors:

    - `401`: No currently authenticated user.
    - `403`: User lacks required authorisation role.
    - `404`: Term not found.
    - `500`: all other errors.

#### Get terms by key

Use this service to retrieve the term records matching the provided list of global identifiers.

The current user must have the `read` role.

The service expects the following parameters:

- `lang`: The language code for the description texts; the field will be set with the default language, or pass `@` to get the result in all languages.

If the service succeeds, [`200`], it will return a key/value dictionary in which the key represents the provided term global identifier and the value the matched term record. If the identifier is not matched, the value will be `null`.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: Term not found.
- `500`: all other errors.

#### Query terms keys

Use this service to retrieve the term global identifiers matching the provided selection criteria.

The current user must have the `read` role.

The request body contains an object that can be used to select from a set of properties:

- `start`: Start position in results.
- `limit`: Number of elements to be returned.
- `term_type`: Select `descriptor` for *descriptors*, `structure` for *structure types* or any other value for *all types*.
- `_nid`: Term *namespace*.
- `_lid`: Term *local identifier*.
- `_gid`: Term *global identifier*.
- `_aid`: List of *extended local identifiers*.
- `_title`: Term *label or title*. An object whose property name must be a language code and whose value is a pattern that should match the term title in that language (string). You can add more language codes if you want.
- `_definition`: Term *definition*. An object whose property name must be a language code and whose value is a pattern that should match the term title in that language (string). You can add more language codes if you want.
- `_data`: A list of *data shapes*, `_scalar`, *scalar*; `_array`, *array*: `_set`, *unique array* and `_dict`, *key/value dictionary* are the allowed values. Any match selects.
- `_type`: A list of *data types*, if `_scalar` was indicated in `_data`.
- `_kind`: A list of *data kinds*, if `_scalar` was indicated in `_data`.

For all string fields the supported wildcards are `_` to match a *single arbitrary character*, and `%` to match *any number of arbitrary characters*. Literal `%` and `_` need to be escaped with a backslash. Backslashes need to be escaped themselves.

Any selector can be omitted, except start and limit.

If the service succeeds, [`200`], it will return the list of matching global identifiers.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Query terms records

Use this service to retrieve the term records matching the provided selection criteria.

The current user must have the `read` role.

The request body contains an object that can be used to select from a set of properties:

- `start`: Start position in results.
- `limit`: Number of elements to be returned.
- `term_type`: Select `descriptor` for *descriptors*, `structure` for *structure types* or any other value for *all types*.
- `_nid`: Term *namespace*.
- `_lid`: Term *local identifier*.
- `_gid`: Term *global identifier*.
- `_aid`: List of *extended local identifiers*.
- `_title`: Term *label or title*. An object whose property name must be a language code and whose value is a pattern that should match the term title in that language (string). You can add more language codes if you want.
- `_definition`: Term *definition*. An object whose property name must be a language code and whose value is a pattern that should match the term title in that language (string). You can add more language codes if you want.
- `_data`: A list of *data shapes*, `_scalar`, *scalar*; `_array`, *array*: `_set`, *unique array* and `_dict`, *key/value dictionary* are the allowed values. Any match selects.
- `_type`: A list of *data types*, if `_scalar` was indicated in `_data`.
- `_kind`: A list of *data kinds*, if `_scalar` was indicated in `_data`.

For all string fields the supported wildcards are `_` to match a *single arbitrary character*, and `%` to match *any number of arbitrary characters*. Literal `%` and `_` need to be escaped with a backslash. Backslashes need to be escaped themselves.

Any selector can be omitted, except start and limit.

If the service succeeds, [`200`], it will return the list of matching term records.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

### Graphs

This set of services can be used to create and manage graph relationships. The structure is a directed graph.

Graph nodes are all terms, the link between two nodes is called an edge and has the following properties:

- `_from`: Reference of the relationship source node term, which points to the destination node term.
- `_predicate`: Reference to a term that represents a specific relationship predicate.
- `_to`: Reference of the relationship destination node term.
- `_path`: An array containing the list of term references representing all the root nodes that use this relationship.

In order to use these services the current user must have the `dict` role, since all the current services change the structure of the dictionary.

#### Add enumerations

Use this service to add a set of child enumerations to a parent node in a specific graph path.

The current user must have the `dict` role.

Enumerations are controlled vocabularies structured as multi-level trees. This service implies that all added elements are enumerations, not sections or bridges.

The service expects the following object in the request body:

- `root`: The global identifier of the term that is the root of the current `_path`.
- `parent`: The global identifier of the parent node, `_to`.
- `items`: An array of term global identifiers representing the child nodes, `_from`.

If the service succeeds, [`200`], it will return an object containing the following properties:

- `inserted`: Number of newly created edges.
- `updated`: Number of existing edges in which a new element has been added to the `_path`.
- `existing`: Number of edges already containing all the necessary fields and values.

The service may return the following errors:

- `400`: Invalid reference.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Add fields

Use this service to add a set of child fields to a parent node in a specific graph path.

The current user must have the `dict` role.

A graph of fields represents a form in which you may have sections containing a set of descriptors representing data input fields. This service implies that all added elements are form input fields, not sections or bridges.

The service expects the following object in the request body:

- `root`: The global identifier of the term that is the root of the current `_path`.
- `parent`: The global identifier of the parent node, `_to`.
- `items`: An array of term global identifiers representing the child nodes, `_from`.

If the service succeeds, [`200`], it will return an object containing the following properties:

- `inserted`: Number of newly created edges.
- `updated`: Number of existing edges in which a new element has been added to the `_path`.
- `existing`: Number of edges already containing all the necessary fields and values.

The service may return the following errors:

- `400`: Invalid reference.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Add properties

Use this service to add a set of properties to a parent node in a specific graph path.

The current user must have the `dict` role.

Object structures are one level tree graphs containing the structure of an object, the parent is a term representing an object type and the children are the descriptors representing the object's child properties. This service implies that all added elements are object properties, not sections or bridges.

The service expects the following object in the request body:

- `parent`: The global identifier of the parent node, `_to`.
- `items`: An array of term global identifiers representing the child nodes, `_from`.

If the service succeeds, [`200`], it will return an object containing the following properties:

- `inserted`: Number of newly created edges.
- `updated`: Number of existing edges in which a new element has been added to the `_path`. *Note that in this case the value will always zero, since we don't have a `_path` property*.
- `existing`: Number of edges already containing all the necessary fields and values.

The service may return the following errors:

- `400`: Invalid reference.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Add sections

Use this service to add a set of child elements to a section parent node in a specific graph path.

The current user must have the `dict` role.

*Sections* are used to create *non-functional groups of elements* that can be used as subdivisions for display purposes, such as sections in a list of child enumeration elements, or sections in a form.

The service expects the following object in the request body:

- `root`: The global identifier of the term that is the root of the current `_path`.
- `parent`: The global identifier of the parent node, `_to`.
- `items`: An array of term global identifiers representing the section child nodes, `_from`.

If the service succeeds, [`200`], it will return an object containing the following properties:

- `inserted`: Number of newly created edges.
- `updated`: Number of existing edges in which a new element has been added to the `_path`.
- `existing`: Number of edges already containing all the necessary fields and values.

The service may return the following errors:

- `400`: Invalid reference.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Add bridges

Use this service to add a set of child aliases to a parent node in a specific graph path.

The current user must have the `dict` role.

A bridge is a connection between two nodes which does not identify as an enumeration, property, field or other significant predicate. When evaluating bridge predicates, the traversal will skip the element connected by the bridge predicate and resume searching for significant predicates. Such connections are used to connect a new root to the graph of an existing one, or to point to a preferred choice.

The service expects the following object in the request body:

- `root`: The global identifier of the term that is the root of the current `_path`.
- `parent`: The global identifier of the parent node, `_to`.
- `items`: An array of term global identifiers representing the bridge child nodes, `_from`.

If the service succeeds, [`200`], it will return an object containing the following properties:

- `inserted`: Number of newly created edges.
- `updated`: Number of existing edges in which a new element has been added to the `_path`.
- `existing`: Number of edges already containing all the necessary fields and values.

The service may return the following errors:

- `400`: Invalid reference.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

## The data dictionary

The dictionary is under development, there is not yet public documentation on *what it does*, *how to use it* and the business logic to make it useful, this will come in time and will be integrated into the [FORGENIUS](https://www.forgenius.eu) project.

Stay tuned...
