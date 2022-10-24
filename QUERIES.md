# Queries



### Valid enum from term global identifier

Returns an array containing the valid enumeration given:

- The root vertex which should correspond to the enumeration type vertex handle.
- The enumeration type key.
- The leaf vertex which should correspond to the enumeration target vertex handle.

```
WITH terms
FOR vertex, edge, path IN 1..10
    INBOUND @root
    edges
    PRUNE @path IN edge._path AND
          edge._predicate == @predicate AND
          (edge._to == @target OR
           edge._from == @target)
    OPTIONS {
        "uniqueVertices": "path"
    }
    FILTER @path IN edge._path AND
           edge._predicate == @predicate AND
           (edge._to == @target OR
            edge._from == @target)
    RETURN vertex
```

| Parameter | Value              |
| --------- | ------------------ |
| root      | terms/iso_639_1    |
| path      | terms/iso_639_1    |
| target    | terms/iso_639_1_fr |
| predicate | _predicate_enum-of |

The query will traverse the graph stopping when 

### Valid enum from term code

Returns an array containing the valid enumeration given:

- The root vertex which should correspond to the enumeration type vertex handle.
- The enumeration type key.
- The leaf vertex which should correspond to the enumeration target vertex handle.

```
WITH dict_terms
FOR vertex, edge, path IN 1..10
    INBOUND @root
    GRAPH "schema"
    PRUNE @path IN edge._path AND
          edge._predicate == @predicate AND
          @code IN vertex._code._aid
    OPTIONS {
        "uniqueVertices": "path"
    }
    FILTER @path IN edge._path AND
           edge._predicate == @predicate AND
           @code IN vertex._code._aid
    RETURN vertex
```

| Parameter | Value                |
| --------- | -------------------- |
| root      | dict_terms/iso_639_1 |
| path      | dict_terms/iso_639_1 |
| code      | fr                   |
| predicate | _predicate_enum-of   |

