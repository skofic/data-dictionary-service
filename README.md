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

In order to use these services *The current user must have the `read` role* to consult the dictionary and the `dict` role to make any changes, such as creating and deleting.

#### Create term

Use this service to create a new term.

*The current user must have the `dict` role*.

Provide the term in the request body, if the service succeeds, [`200`], it will return the newly created term.

The service may return the following errors:

- `400`: Invalid parameter.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `409`: The term already exists.
- `500`: all other errors.

#### Create terms

Use this service to create a set of new terms.

*The current user must have the `dict` role*.

Provide an array of term records in the request body, if the service succeeds, [`200`], it will return the newly created terms. When inserting the records, the operation is executed transactionally in an all-or-nothing fashion.

The service may return the following errors:

- `400`: Invalid parameter.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `409`: The term already exists.
- `500`: all other errors.

#### Update term

Use this service to update an existing term.

*The current user must have the `dict` role*.

Provide the term global identifier in the path query parameter `key` and the fields to be updated in the request body.

If the service succeeds, [`200`], it will return the updated term record plus a property, `status`, with the operation outcome.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: Term not found.
- `500`: all other errors.

#### Delete term

Use this service to delete an existing term.

*The current user must have the `dict` role*.

Provide the term global identifier in the path query parameter `key`, if the service succeeds, [`200`], it will return the deleted term's `id`, `_key` and `_rev`.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: Term not found.
- `500`: all other errors.

#### Delete terms

Use this service to delete a set of existing terms.

*The current user must have the `dict` role*.

Provide an array of term global identifiers in the request body, if the service succeeds, [`200`], it will return the operation statistics: the number of deleted and ignored records.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Get term by key

- Use this service to retrieve a term record matching the provided global identifier.

    *The current user must have the `read` role*.

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

*The current user must have the `read` role*.

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

*The current user must have the `read` role*.

The request body contains an object that can be used to select from a set of properties:

- `start`: Start position in results.
- `limit`: Number of elements to be returned.
- `term_type`: Set `descriptor` for *descriptors*, `structure` for *structure types* or omit for *any type*.
- `_nid`: Term *namespace*, wildcard match.
- `_lid`: Term *local identifier*,wildcard match.
- `_gid`: Term *global identifier*, wildcard match.
- `_name`: Term *name*, wildcard match.
- `_aid`: List of *extended local identifiers*, exact match.
- `_pid`: List of *provider identifiers*, wildcard match.
- `_title`: Term *label or title*, provide a string with space delimited tokens.
- `_definition`: Term *definition*, provide a string with space delimited tokens.
- `_description`: Term *description*, provide a string with space delimited tokens.
- `_examples`: Term *usage examples*, provide a string with space delimited tokens.
- `_notes`: Term *notes*, provide a string with space delimited tokens.
- `_provider`: Term *provider*, provide a string with space delimited tokens.

For all *wildcard match* strings the supported wildcards are `_` to match a *single arbitrary character*, and `%` to match *any number of arbitrary characters*. Literal `%` and `_` need to be escaped with a backslash. Backslashes need to be escaped themselves.

For all *token match* fields provide a *string* with *space delimited tokens*.

Any selector can be omitted, except `start` and `limit`.

If the service succeeds, [`200`], it will return the list of matching global identifiers.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Query terms records

Use this service to retrieve the term records matching the provided selection criteria.

*The current user must have the `read` role*.

The request body contains an object that can be used to select from a set of properties:

The request body contains an object that can be used to select from a set of properties:

- `start`: Start position in results.
- `limit`: Number of elements to be returned.
- `term_type`: Set `descriptor` for *descriptors*, `structure` for *structure types* or omit for *any type*.
- `_nid`: Term *namespace*, wildcard match.
- `_lid`: Term *local identifier*,wildcard match.
- `_gid`: Term *global identifier*, wildcard match.
- `_name`: Term *name*, wildcard match.
- `_aid`: List of *extended local identifiers*, exact match.
- `_pid`: List of *provider identifiers*, wildcard match.
- `_title`: Term *label or title*, provide a string with space delimited tokens.
- `_definition`: Term *definition*, provide a string with space delimited tokens.
- `_description`: Term *description*, provide a string with space delimited tokens.
- `_examples`: Term *usage examples*, provide a string with space delimited tokens.
- `_notes`: Term *notes*, provide a string with space delimited tokens.
- `_provider`: Term *provider*, provide a string with space delimited tokens.

For all *wildcard match* strings the supported wildcards are `_` to match a *single arbitrary character*, and `%` to match *any number of arbitrary characters*. Literal `%` and `_` need to be escaped with a backslash. Backslashes need to be escaped themselves.

For all *token match* fields provide a *string* with *space delimited tokens*.

Any selector can be omitted, except `start` and `limit`.

If the service succeeds, [`200`], it will return the list of matching term records.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

### Graphs

This set of services can be used to create and manage graph relationships. The structure is a directed graph.

Graph nodes are all terms, the link between two nodes is called an edge and has the following properties:

- `_from`: Reference of the relationship *source* node term.
- `_predicate`: Reference to a term that represents the *predicate* of the relationship.
- `_to`: Reference of the relationship *destination* node term.
- `_path`: An *array* containing the list of *term references* representing all the *root nodes* that use this relationship. These represent the *list of root nodes* that *share* the *current relationship*. 

Predicates mainly follow a *many to one path*, meaning that in general the `_from` node is the *child*, and the `_to` node is the *parent*.

In order to use these services the current user must have the `dict` role, since all the current services change the structure of the dictionary.

#### Add enumerations

Use this service to add a set of child enumerations to a parent node in a specific graph path.

*The current user must have the `dict` role*.

*Enumerations* are controlled vocabularies structured as multi-level trees. This service implies that all added elements are enumerations, not sections or bridges.

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

*The current user must have the `dict` role*.

A graph of fields represents a *form* in which you may have sections containing a set of descriptors representing data input fields. This service implies that all added elements are form input *fields*, not *sections* or *bridges*.

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

*The current user must have the `dict` role*.

*Object structures* are one level tree graphs containing the structure of an object, the parent is a term representing an object type and the children are the descriptors representing the object's child properties. This service implies that all added elements are object properties, not sections or bridges.

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

*The current user must have the `dict` role*.

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

*The current user must have the `dict` role*.

A *bridge* is a connection between two nodes, or *predicate*, which *does not identify* as an *enumeration*, *property*, *field* or *other significant predicate*. When evaluating bridge predicates, the traversal will skip the element connected by the bridge predicate and resume searching for significant predicates. Such connections are used to connect a new root to the graph of an existing one, or to point to a preferred choice.

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

### Enumerated types

This set of services can be used to query graphs that represent enumerations.

An *enumeration* is a set of *nested trees* whose *nodes* are *terms*. Enumerations are mainly used to represent *controlled vocabularies*. These controlled vocabularies can be structured as a multi-level tree, in which a child element may have its own child elements.

*Edges* are structured as follows:

- `_from`: Reference of the *relationship source node* term. This represents the *child* node.
- `_predicate`: Reference to a *term* that *represents* a the *relationship predicate*.
- `_to`: Reference of the *relationship destination node* term. This represents the *parent* node.
- `_path`: An array containing the *list of term references* representing all the *root nodes* that *use this relationship*.

The predicate can represent three distinct relationship types:

- `_predicate_enum-of`: The child is a valid enumeration element belonging to the parent.
- `_predicate_section-of`: The parent is a section, which is not a valid enumeration, but can function as a general purpose group.
- `_predicate_bridge-of`: The path starting from the parent should bypass the child and borrow all its relationships. Traversals will ignore the child node, but not its relationships.

In order to use these services the current user must have the `read` role.

#### Enumeration path flat list of keys

Use this service to get the flattened list of all *node global identifiers* belonging to a specific *enumeration graph*.

*The current user must have the `read` role*.

This service can be used to retrieve the *flattened list* of all *enumeration elements* belonging to the graph whose *root* corresponds to the term global identifier provided in the `path` path query parameter.

If the service succeeds, [`200`], it will return a list of term global identifiers corresponding to all enumeration elements of the graph and root. The result will not take into account the tree structure, this means that only edges featuring predicates of `_predicate_enum-of` type will be considered.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Enumeration path flat list of terms

Use this service to get the flattened list of all *node term records* belonging to a specific *enumeration graph*.

*The current user must have the `read` role*.

This service can be used to retrieve the *flattened list* of all *enumeration element records* belonging to the graph whose *root* corresponds to the term global identifier provided in the `path` path query parameter.

If the service succeeds, [`200`], it will return a list of term records corresponding to all enumeration elements of the graph and root. The result will not take into account the tree structure, this means that only edges featuring predicates of `_predicate_enum-of` type will be considered.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Enumeration tree of keys

Use this service to get the tree of all *node term keys* belonging to a specific *enumeration graph*.

*The current user must have the `read` role*.

This service can be used to retrieve the *list of branches* belonging to the graph whose *root* corresponds to the term global identifier provided in the `path` path query parameter. You can control the depth of the traversal by providing the maximum traversal level in the `levels` path query parameter.

If the service succeeds, [`200`], it will return an *array* of all parent/predicate/child *tree branches* that comprise the graph, each element will have the following structure:

- `<parent>`: The property name is the parent node *term global identifier*, the value is:
    - `<predicate>`: The property name is the edge predicate term global identifier, the value is an array of term global identifiers that represent the parent's child nodes.

To rebuild the nested tree you should take the element whose root property corresponds to the provided `path` parameter, then recursively iterate each child member matching the elements of the returned list.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Enumeration term by code

Use this service to get an enumeration *term record* matching the provided *code* and *path*.

*The current user must have the `read` role*.

This service can be used to retrieve the *term record* matching the provided *code* in a specific *enumeration graph*.

The service expects the following path query parameters:

- `path`: The enumeration graph root term global identifier.
- `code`: The element code to match.

The service will traverse the enumeration graph until it finds a term whose identifiers list (`_aid` property) contains the provided code. If the service is successful, [`200`], it will return the matching term record.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

#### Enumeration path by code

Use this service to get an enumeration *path* matching the provided *code* and *path*.

*The current user must have the `read` role*.

This service can be used to retrieve the *path* between the *enumeration root node* and a first *term* that matches the provided *code*.

The service expects the following path query parameters:

- `path`: The enumeration graph root term global identifier.
- `code`: The element code to match.

The service will traverse the enumeration graph until it finds a term whose identifiers list (`_aid` property) contains the provided code. If there are terms, in the enumeration defined by the path parameter, that match the identifier provided in the code parameter, status [`200`], the service will return the path starting from the enumeration root element, `path` parameter, to the terms whose `_aid` property contains a match for the local identifier provided in the `code` parameter. The result is an array in which each element is an object representing a path constituted by a list of edges and a list of vertices.

- `vertices`: List of vertice terms.
- `edges`: List of edge records.
- `weights`: List of vertex weights.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

#### Enumeration term by local identifier

Use this service to get an enumeration term record matching the provided local identifier.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *term record* matching the provided *local identifier* in a specific *enumeration graph*.

The service expects the following path query parameters:

- `path`: The enumeration graph root term global identifier.
- `code`: The element local identifier to match.

The service will traverse the enumeration graph until it finds a term whose local identifier (`_lid` property) matches the provided identifier. If there is a match, [`200`], the service will return the matching term record.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

#### Enumeration path by local identifier

Use this service to get an enumeration path from root to matching local identifier element.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *path* between the *enumeration root node* and a first *term* that matches the provided *local identifier*

The service expects the following path query parameters:

- `path`: The enumeration graph root term global identifier.
- `code`: The element local identifier to match.

The service will traverse the enumeration graph until it finds a term whose local identifier (`_lid` property) matches the provided code. If there is a match, status [`200`], the service will return the path starting from the enumeration root element to the term whose `_lid` property contains a match for the identifier provided in the `code` parameter. The result is an array in which each element is an object representing a path constituted by a list of edges and a list of vertices.

- `vertices`: List of vertice terms.
- `edges`: List of edge records.
- `weights`: List of vertex weights.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

#### Enumeration term by global identifier

Use this service to get an enumeration term record matching the provided global identifier.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *preferred term* record matching the provided *global identifier* in the *enumeration graph* defined by the provided *root element*.

The service expects the following path query parameters:

- `path`: The enumeration graph root term global identifier.
- `code`: The element global identifier to match.

The service will traverse the enumeration graph until it finds a term whose global identifier (`_gid` property) matches the provided identifier. If there is a match, [`200`], the service will return the matching term record.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

#### Enumeration path by global identifier

Use this service to get an enumeration path from root to matching global identifier element.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *path* between the *enumeration root node* and a first *term* that matches the provided *global identifier*

The service expects the following path query parameters:

- `path`: The enumeration graph root term global identifier.
- `code`: The element global identifier to match.

The service will traverse the enumeration graph until it finds a term whose global identifier (`_gid` property) matches the provided code. If there is a match, [`200`], the service will return the path starting from the enumeration root element to the term whose `_gid` property contains a match for the identifier provided in the `code` parameter. The result is an array in which each element is an object representing a path constituted by a list of edges and a list of vertices.

- `vertices`: List of vertice terms.
- `edges`: List of edge records.
- `weights`: List of vertex weights.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

#### Check enumeration element global identifiers

Use this service if you want to check if a list of term global identifiers belong to an enumeration.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *term global identifiers* belonging to a specific *enumeration graph* matching the provided *global identifier*.

The service expects the enumeration graph root term global identifier in the `path` path query parameter and the array of global identifiers to match in the request body.

The service will traverse the enumeration graph until it finds a term whose global identifier (`_gid` property) matches the provided identifier. If there is a match, [`200`], the service will return a key/value dictionary whose key will be the provided global identifier and the value the matched global identifier; if not, the value will be `false`. Note that matched identifiers might not match provided keys if the enumeration has a preferred element.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

#### Check enumeration element local identifiers

Use this service if you want to check if a list of term local identifiers belong to an enumeration.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *term global identifiers* belonging to a specific *enumeration graph* matching the provided *local identifiers*.

The service expects the enumeration graph root term global identifier in the `path` path query parameter and the array of local identifiers to match in the request body.

The service will traverse the enumeration graph until it finds a term whose local identifier (`_lid` property) matches the provided identifier. If there is a match, [`200`], the service will return a key/value dictionary whose key will be the provided local identifier and the value the matched global identifier; if not, the value will be `false`.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

**Note that this service will honour *preferred enumerations*, this means that if a term is matched that has a *preferred alternative*, this one will be returned, regardless if the preferred term does not belong to the provided path**.

### Linked types

This set of services can be used to query graphs that represent property requirements.

In *linked descriptor graphs* it is possible to *link* a *first descriptor* to *one or more other descriptors*, signalling that whenever the *first descriptor* is is used in a dataset, one is *required* to also *include* the *linked required descriptors* along with it. This is useful to have the complete list of variables that should be included in a dataset.

*Note that the structure is recursive, so selected required descriptors might, in turn, require other descriptors*.

In order to use these services the current user must have the `read` role.

#### Required descriptor keys

Use this service to get the flattened list of required properties.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *flattened list* of *descriptors* required by the provided *list* of *property* global identifiers.

The service expects an *array* of *term global identifiers* in the *request body* that represent the *main descriptors selection*. If the service is successful, [`200`], it will return the *additional descriptors* that *must be added* to the *provided list*, in the form of *term global identifiers*.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Required descriptor records

Use this service to get the flattened list of required property records.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *flattened list* of *descriptor records* required by the provided *list* of *property* global identifiers.

The service expects an *array* of *term global identifiers* in the *request body* that represent the *main descriptors selection*. If the service is successful, [`200`], it will return the *additional descriptor records* that *must be added* to the *provided list*, in the form of *term global identifiers*.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

### Descriptor types

This set of services can be used to query graphs that are related to descriptor terms.

A descriptor is a term that is the metadata of a variable. This means that such terms contain a `_data` section that define the data type of the values the variable can hold.

Descriptors may represent controlled vocabularies and object types: this set of services allow traversing those graphs using the descriptor global identifier, rather than the type terms used in their `_data` section.

In order to use these services the current user must have the `read` role.

#### Descriptor enumeration flat list of keys

Use this service to get the flattened list of elements of the provided descriptor enumeration.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *flattened list* of *term global identifiers* belonging to the *provided descriptor enumeration*, this implies that the *provided descriptor must be a controlled vocabulary*.

*Enumerations* are *a graph of nested trees* that represent *controlled vocabularies* whose *elements* are *terms*. At the *root* of the graph is a *term* that represents the *type* or *definition* of this *controlled vocabulary*: the `path` parameter is the *global identifier* of this *term*.

The service expects the global identifier of the descriptor as the query path parameter, `key`.

If the service is successful, [`200`], it will return the list of all the enumeration elements belonging to the provided descriptor. The elements are returned as term global identifiers.

Note that no hierarchy or order is maintained, it is a flat list of term global identifiers. Also, only items representing active elements of the enumeration will be selected: this means that terms used as sections or bridges will not be returned.

The service may return the following errors:

- `204`: The provided descriptor is not an enumeration.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: The provided term reference is not a descriptor.
- `500`: all other errors.

#### Descriptor enumeration flat list of records

Use this service to get the flattened list of elements of the provided descriptor enumeration.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *flattened list* of *term records* belonging to the *provided descriptor enumeration*, this implies that the *provided descriptor must be a controlled vocabulary*.

*Enumerations* are *a graph of nested trees* that represent *controlled vocabularies* whose *elements* are *terms*. At the *root* of the graph is a *term* that represents the *type* or *definition* of this *controlled vocabulary*: the `path` parameter is the *global identifier* of this *term*.

The service expects the global identifier of the descriptor as the query path parameter, `key`.

If the service is successful, [`200`], it will return the list of all the enumeration elements belonging to the provided descriptor. The elements are returned as term records.

Note that no hierarchy or order is maintained, it is a flat list of term records. Also, only items representing active elements of the enumeration will be selected: this means that terms used as sections or bridges will not be returned.

The service may return the following errors:

- `204`: The provided descriptor is not an enumeration.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: The provided term reference is not a descriptor.
- `500`: all other errors.

#### Descriptor enumeration tree of keys

Use this service to get an enumeration tree of element global identifiers.

*In order to use this service, the current user must have the `read` role*.

This service can be used to retrieve the *list of trees* of *term global identifiers* belonging to the *provided descriptor enumeration*, this implies that the *provided descriptor must be a controlled vocabulary*..

*Enumerations* are *a graph of nested trees* that represent *controlled vocabularies* whose *elements* are *terms*. At the *root* of the graph is a *term* that represents the *type* or *definition* of this *controlled vocabulary*: the `path` parameter is the *global identifier* of this *term*.

The service expects the following path query parameters:

- `key`: the descriptor global identifier.
- `levels`: the number of nested tree levels to traverse.

If the service is successful, [`200`], it will return an *array* of all *parent/predicate/child tree branches* that comprise the graph, each element will have the following structure:

- `<parent>`: The property name is the parent node *term global identifier*, the value is:
    - `<predicate>`: The property name is the edge predicate term global identifier, the value is an array of term global identifiers that represent the parent's child nodes.

To rebuild the nested tree you should take the element whose root property corresponds to the provided `key` parameter, then recursively iterate each child member matching the elements of the returned list.

The service may return the following errors:

- `204`: The provided descriptor is not an enumeration.
- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `404`: The provided term reference is not a descriptor.
- `500`: all other errors.

#### Descriptor categories

Use this service to get the summary of qualifications for the provided list of descriptors.

*In order to use this service, the current user must have the `read` role*.

The service expects a *list of descriptor global identifiers* in the *request body* and will return the list of *classes*, *domains*, *tags* and *subjects* associated with the *provided descriptors list*.

If the service is successful, [`200`], it will return the following structure:

- `classes`: List of class, `_class`, entries featured by the provided list of descriptors.
- `domains`: List of domain, `_domain`, entries featured by the provided list of descriptors.
- `tags`: List of tag, `_tag`, entries featured by the provided list of descriptors.
- `subjects`: List of subject, `_subject`, entries featured by the provided list of descriptors.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

### Validation

This set of services can be used to verify the correctness of values associated to descriptors.

Use these services when you want to assert if data values satisfy the corresponding descriptor data section rules.

#### Validate value by descriptor

Use this service to check a data value matched to a descriptor.

*In order to use this service, the current user must have the `read` role*.

**Validation is still in beta**.

This service can be used to *check* if a *data value* matches the *rules* of a *descriptor*. The value will be validated against the data definition associated with the descriptor and the service will return an object describing the status of the validation and eventual additional information describing the outcome.

Optionally, it is possible to indicate in which language the status message should be returned.

The service expects the following properties in the request body:

- `descriptor`: The descriptor global identifier.
- `value`: The value to be tested against the descriptor's data definition.
- `language`: The `iso_396_3` language code for status messages.

The first two parameters are required, the last parameter is optional.

The `language` code is used to select the language of the status message:

- if the language code is `all`, the message will be returned in
all available languages,
- if the language code is wrong, or there is no message in that language,
the message will be returned in English.

Language codes are in the form: `iso_639_3_` followed by the three letter ISO language code.
Use `iso_639_3_eng` for English.

If the service is successful, [`200`], it will return the following properties:

- `descriptor`: The provided descriptor global identifier.
- `value`: The tested value.
- `result`: The status, including the code and message.

Warning and error reports are objects with two elements:

- `value`: The data element value.
- `status`: The list of status messages one per property.

Each data element is processed separately: if the data is valid, the data element will be stored in the `valid` report property; if there is at least one error, the data element and all the corresponding status reports will be stored in the `errors` report property; if there is at least one warning, the data element and all the corresponding status reports will be stored in the `warnings` report property.

The returned value, `value`, may be different than the provided value, because enumerations
can be resolved: if the enumeration code is not a term global identifier, the full
enumeration graph will be traversed and the first element whose local identifier matches the provided
value will be considered the valid choice. Try entering `_type` as descriptor and `string` as the
value: you will see that the value will be resolved to the full code value, `_type_string`.

The `status` objects indicate the outcome of the validation, they record any warning or error.
This status has two default elements: a `code` that is a numeric code, `0` means success,
and a `message` string that describes the outcome. Depending on the eventual error, the status may
include other properties such as:

- `value`: the value that caused the error.
- `descriptor`: the descriptor involved in the error.
- `elements`: in case an array has too little or too much elements.
- `property`: missing required property, in case of incorrect data definition.
- `block`: data definition section.
- `type`: unimplemented or invalid data type, or data definition section name.
- `required`: list of required properties, in case one is missing.
- `range`: valid range, in the case of out of range values.
- `regexp`: regular expression, in case a string does not match.

Additional properties may be included in the result, depending on the eventual error, or in the event
that an enumeration was resolved:

- `resolved`: It is an object whose properties represent the unresolved enumeration terms. Try entering `_type` as descriptor and `string` as the value: the top level `value` will hold the resolved value, while the `value` array in this object will hold the provided enumeration code.
- `ignored`: It is an object whose properties represent the descriptors that were not recognised.
Unknown descriptors will not be validated, this is not considered an error, but such descriptors will
be logged, so that it is possible to catch eventual errors. Try entering `UNKNOWN` as descriptor.
- `error`: In the event of unexpected database errors, this property will host the specific error message generated by the database engine.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Validate value by data definition

Use this service to check a data value matched to a descriptor data definition.

*In order to use this service, the current user must have the `read` role*.

**Validation is still in beta**.

This service can be used to *check* if a *data value* matches the provided *data definition*.

The service expects the following properties in the request body:

- `definition`: The `_data` section of a descriptor term record.
- `value`: The value to be tested against the data definition.
- `language`: The `iso_396_3` language code for status messages.

The first two parameters are required, the last parameter is optional.

The `definition` parameter is an object that represents the `_data` section
of a descriptor term. You can use this to test data definitions against values.

The `language` code is used to select the language of the status messages:

- if the language code is `all`, the message will be returned in
all available languages,
- if the language code is wrong, or there is no message in that language,
the message will be returned in English.

Language codes are in the form: `iso_639_3_` followed by the three letter ISO language code.
Use `iso_639_3_eng` for English.

If the service is successful, [`200`], it will return the following properties:

- `definition`: The provided `_data` section of a descriptor.
- `value`: The tested value.
- `result`: The status, including the code and message.

The returned value, `value`, may be different than the provided value, because enumerations
can be resolved: if the enumeration code is not a term global identifier, the full
enumeration graph will be traversed and the first element whose local identifier matches the provided
value will be considered the valid choice. Try entering `_type` as descriptor and `string` as the
value: you will see that the value will be resolved to the full code value, `_type_string`.

The `status` objects indicate the outcome of the validation, they record any warning or error.
This status has two default elements: a `code` that is a numeric code, `0` means success,
and a `message` string that describes the outcome. Depending on the eventual error, the status may
include other properties such as:

- `value`: the value that caused the error.
- `descriptor`: the descriptor involved in the error.
- `elements`: in case an array has too little or too much elements.
- `property`: missing required property, in case of incorrect data definition.
- `block`: data definition section.
- `type`: unimplemented or invalid data type, or data definition section name.
- `required`: list of required properties, in case one is missing.
- `range`: valid range, in the case of out of range values.
- `regexp`: regular expression, in case a string does not match.

Additional properties may be included in the result, depending on the eventual error, or in the event
that an enumeration was resolved:

- `resolved`: It is an object whose properties represent the unresolved enumeration terms. Try entering `_type` as descriptor and `string` as the value: the top level `value` will hold the resolved value, while the `value` array in this object will hold the provided enumeration code.
- `ignored`: It is an object whose properties represent the descriptors that were not recognised.
Unknown descriptors will not be validated, this is not considered an error, but such descriptors will
be logged, so that it is possible to catch eventual errors. Try entering `UNKNOWN` as descriptor.
- `error`: In the event of unexpected database errors, this property will host the specific error message generated by the database engine.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Validate object

Use this service to check the provided object.

*In order to use this service, the current user must have the `read` role*.

**Validation is still in beta**.

This service can be used to *check* the *properties* of the provided *object*. It will *scan all properties* and *validate* any property that *corresponds* to a *descriptor* of the *data dictionary*.

The service expects the following properties in the request body:

- `value`: The object to be validated.
- `language`: The `iso_396_3` language code for status messages.

The `language` code is used to select the language of the status messages:

- if the language code is `all`, the message will be returned in
all available languages,
- if the language code is wrong, or there is no message in that language,
the message will be returned in English.

Language codes are in the form: `iso_639_3_` followed by the three letter ISO language code.
Use `iso_639_3_eng` for English.

If the service is successful, [`200`], it will return two properties:

- `value`: The tested value.
- `result`: A *key/value dictionary* in which the key is the name of any property that was considered by the parser, and the value is a `status` property with the status of the operation.

The `status` objects indicate the outcome of the validation, they record any success, warning or error.
This status has two default elements: a `code` that is a numeric code, `0` means success,
and a `message` string that describes the outcome. Depending on the eventual error, the status may
include other properties such as:

- `value`: the value that caused the error.
- `descriptor`: the descriptor involved in the error.
- `elements`: in case an array has too little or too much elements.
- `property`: missing required property, in case of incorrect data definition.
- `block`: data definition section.
- `type`: unimplemented or invalid data type, or data definition section name.
- `required`: list of required properties, in case one is missing.
- `range`: valid range, in the case of out of range values.
- `regexp`: regular expression, in case a string does not match.

Additional properties may be included in the result, depending on the eventual error, or in the event
that an enumeration was resolved:

- `resolved`: It is an object whose properties represent the unresolved enumeration terms. Try entering `_type` as descriptor and `string` as the value: the top level `value` will hold the resolved value, while the `value` array in this object will hold the provided enumeration code.
- `ignored`: It is an object whose properties represent the descriptors that were not recognised.
Unknown descriptors will not be validated, this is not considered an error, but such descriptors will
be logged, so that it is possible to catch eventual errors. Try entering `UNKNOWN` as descriptor.
- `error`: In the event of unexpected database errors, this property will host the specific error message generated by the database engine.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

#### Validate objects

Use this service to check the provided list of objects.

*In order to use this service, the current user must have the `read` role*.

**Validation is still in beta**.

Use this service to check a list provided objects.

*In order to use this service, the current user must have the `read` role*.

**Validation is still in beta*+.

This service can be used to *check* the *properties* of the provided list of *objects*. It will *scan all properties* and *validate* any property that *corresponds* to an *element of the data dictionary*.

The service expects the following properties in the request body:

- `value`: An array containing the objects to be validated.
- `language`: The `iso_396_3` language code for status messages.

The `language` code is used to select the language of the status messages:

- if the language code is `all`, the message will be returned in
all available languages,
- if the language code is wrong, or there is no message in that language,
the message will be returned in English.

Language codes are in the form: `iso_639_3_` followed by the three letter ISO language code.
Use `iso_639_3_eng` for English.

If the service is successful, [`200`], it will return three properties:

- `valid`: An array containing the list of valid objects.
- `warnings`: An array containing the report for objects containing warnings, such as resolved values.
- `errors`: An array containing the report for objects containing errors.

The elements returned for warnings and errors are structured as follows:

- `value`: The tested value, with eventual resolved enumerations.
- `status`: An array of status reports.

The `status` objects indicate the outcome of the validation, they record any warning or error.
This status has two default elements: a `code` that is a numeric code, `0` means success,
and a `message` string that describes the outcome. Depending on the eventual error, the status may
include other properties such as:

- `value`: the value that caused the error.
- `descriptor`: the descriptor involved in the error.
- `elements`: in case an array has too little or too much elements.
- `property`: missing required property, in case of incorrect data definition.
- `block`: data definition section.
- `type`: unimplemented or invalid data type, or data definition section name.
- `required`: list of required properties, in case one is missing.
- `range`: valid range, in the case of out of range values.
- `regexp`: regular expression, in case a string does not match.

The service may return the following errors:

- `401`: No currently authenticated user.
- `403`: User lacks required authorisation role.
- `500`: all other errors.

## Progress

This is a work in progress, so expect this document to grow and change over time.

## Licence

Copyright (c) 2023 Milko Škofič

License: Apache 2
