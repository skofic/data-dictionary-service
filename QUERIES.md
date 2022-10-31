# Queries



### Path to valid enumeration from enumeration handle

Returns an array containing the valid enumeration given:

- The *root* vertex of the path.
- The *path* identifier, or enumeration type.
- The *target* leaf path vertex as term handle.
- The enumeration *predicate*.

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
    RETURN path
```

| Parameter | Value              |
| --------- | ------------------ |
| root      | terms/iso_639_1    |
| path      | terms/iso_639_1    |
| target    | terms/iso_639_1_fr |
| predicate | _predicate_enum-of |

The query will traverse the graph stopping when the target is found either as the subject or object of the relationship. The query will either return the path from the root to the target, or the target vertex. The query will return the preferred vertex in cases where the target is not a preferred enumeration.

### Path to valid enumeration from enumeration code

Returns an array containing the valid enumeration given:

- The *root* vertex of the path.
- The *path* identifier, or enumeration type.
- The target enumeration *code*.
- The enumeration *predicate*.

```
WITH terms
FOR vertex, edge, path IN 1..10
    INBOUND @root
    edges
    PRUNE @path IN edge._path AND
          edge._predicate == @predicate AND
          @code IN vertex._code._aid
    OPTIONS {
        "uniqueVertices": "path"
    }
    FILTER @path IN edge._path AND
           edge._predicate == @predicate AND
           @code IN vertex._code._aid
    RETURN path
```

| Parameter | Value              |
| --------- | ------------------ |
| root      | terms/iso_639_1    |
| path      | terms/iso_639_1    |
| code      | fr                 |
| predicate | _predicate_enum-of |

The query will traverse the graph stopping when a vertex is found matching the provided code. The query will either return the path from the root to the target, or the target vertex. The query will return the preferred vertex in cases where the code does not correspond to a preferred enumeration.

### Valid enumeration handle from target term handle

Returns an array containing the valid enumeration handle given:

- The *target* enumeration handle.
- The *path* identifier, or enumeration type.

```
FOR edge IN edges
    FILTER ( edge._to == @target OR
             edge._from == @target )
    FILTER edge._predicate == "_predicate_enum-of"
    FILTER @path IN edge._path
RETURN edge._from
```

| Parameter | Value              |
| --------- | ------------------ |
| target    | terms/iso_639_1_it |
| path      | terms/iso_639_1    |

The query will match the edge that references the target handle with the enumeration predicate and the provided path, returning the valid term handle node.

### Check enumeration from list of term handles

Returns a dictionary whose key is the provided term handle and the value is the valid handle or null, given:

- The *targets*, as a list of term handles.
- The *path* identifier, or enumeration type.

```
LET result = (
    FOR term IN @targets
    
        LET selection = (
            FOR edge IN edges
                FILTER ( edge._to == term OR
                         edge._from == term )
                FILTER edge._predicate == "_predicate_enum-of"
                FILTER @path IN edge._path
            RETURN
                edge._from
        )
    
    RETURN
        selection[0]
    )
    
RETURN
    ZIP(@targets, result)
```

| Parameter | Value                                                    |
| --------- | -------------------------------------------------------- |
| targets   | ["terms/iso_639_1_it","terms/iso_639_1_fr","terms/baba"] |
| path      | terms/iso_639_1                                          |

The query will match the edges that reference the target handles with the enumeration predicate and the provided path, returning a dictionary whose keys are the provided handles and the value are the resilved handles or null for mismatches.

### Check enumeration from list of codes

Returns a dictionary whose keys are the provided codes and the values are the valid handles or null, given:

- The *targets*, as a list of enumeration codes.
- The *path* identifier, or enumeration type.

```
LET result = (
    FOR code IN @codes
    
        LET selection = (
            FOR term IN terms
                FILTER term._code._lid == code
    
                FOR edge in edges
                    FILTER ( edge._to == term._id OR
                             edge._from == term._id )
                    FILTER edge._predicate == "_predicate_enum-of"
                    FILTER @enum IN edge._path
                RETURN edge._from )
    
    RETURN
        selection[0] )

RETURN
    ZIP(@codes, result)
```

| Parameter | Value                |
| --------- | -------------------- |
| targets   | ["it", "fr", "baba"] |
| path      | terms/iso_639_1      |

The query will match the edges whose vertices reference the provided codes with the enumeration predicate and the provided path, returning a dictionary whose keys are the provided codes and the values are the matched term handles, or null for mismatches.

