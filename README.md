node-tree-surgeon
=================
[![Build Status](https://travis-ci.org/i-e-b/node-tree-surgeon.svg?branch=master)](https://travis-ci.org/i-e-b/node-tree-surgeon) [![Coverage Status](https://img.shields.io/coveralls/i-e-b/node-tree-surgeon.svg)](https://coveralls.io/r/i-e-b/node-tree-surgeon?branch=master)

Tools for editing tree structures using a relational model.

### General purpose:

Trees are represented internally with two sets: (relational structure)

* Relations: `[{"Parent":id, "Child":id, "Kind":any, ...}, ...]`
* Nodes: `[{... your data ... }, ...]`

Functions given to split a POJO into this structure, and merge the structure into a POJO.

Names of object tree parts, as used below:
```javascript
{ // this object is the parent, it has one property "I" = "am parent"

    "I" : "am parent", // properties (whose values are not objects) remain
                       //   on the containing object.

    "Kind" : // properties (whose values are objects) become relationships.
             // The key becomes the kind of the relation.
    {
        // this object is the child
        "Property" : "Value"
    }
}
```

Properties with array values are treated one of two ways:
```javascript
{
    "JustAProperty" : ["hello", 1,2,3], // first element is NOT an object.
                                        // Entire array is a single value,
                                        //   one of the parent's properties
    "OneToMany" : [
        {"child":1}, // First element is an object. All elements are
                     //   considered children of the parent. Kind is 'OneToMany'
        {"child":2}  // There is no way to express many-to-one, and
                     //   putting this in the relational structure is not supported.
    ]
}
```

### Operations on POJO structure:

Assuming `var tree = require('tree-surgeon');`

#### Input

- [x] decompose -- turn a normal js object tree into the relational structure
      
      `tree.decompose(obj, excludedKinds, relationDecorator, useEmptyRelations);`
      - `obj` The object to be decomposed for relational operations. This should be a simple object, as returned by `JSON.parse`
      - `excludedKinds` An array of property names. These properties and their sub-trees will not be decomposed
      - `relationDecorator` A function to read node as they are decomposed and inject data into the relations table. This data can be used in subsequent operations.
      - `useEmptyRelations` Bool, default false. If `true`, empty arrays will be treated as object nodes with no children.
      
      Returns a relational structure.

### Operations on the relational structure:

Assuming
```
    var tree = require('tree-surgeon');
    var relational = tree.decompose(my_object);
```

#### Output

- [x] compose -- convert a relational structure back into a plain object. Any manipulations of the relational structure will take effect.
      
      `relational.compose()` or `tree.compose(relational)`
      
      This is the fastest output function.
- [x] render -- pass each node through a function, and each kind name through a function and compose tree from the results. Manipulations of the relational structure will take effect, and both property names and object contents can be manipulated during output.
      
      `relational.render(renderNodeFunc, renderKindFunc)`
      - `renderNodeFunc` function that takes (node, path, id) and returns the rendered object contents
      - `renderKindFunc` function that takes (kind, path) and returns the output property name
- [x] harvest -- return an object of composed sub-trees by kind, keyed by a parent node value
      
      `relational.harvest(kind, idSelector)`
      - `kind` the target property names to extract
      - `idSelector` a function that takes the object nodes and returns a unique new property name
- [x] gather -- return an array of sub-trees
    - [x] gatherByKind -- subtrees selected by property name
          
          `relational.gatherByKind(kind)`
          - `kind` the target property names to extract
    - [x] gatherByNode -- subtrees selected by a function
          
          `relational.gatherByNode(selector)`
          - `selector` function that takes a node and returns `bool`. The subtrees of node that result in `true` will be returned.

#### Navigation

- [x] parentIdOf -- get parent ID from child ID, or `null` if not found
      
      `relational.parentIdOf(childId)`
      - `childId` the ID of a node
      returns the parent ID, or `null` if this was the root node
- [x] getChildrenOf -- get an array of node IDs for the given parent ID
      
      `relational.getChildrenOf(parentId)`
      - `parentId` the ID of a node
      returns an array of all child nodes' IDs. Returns empty array if a leaf node was passed.
- [x] getChildrenByKindOf - get an array of child node IDs for a given parent where the child is a specified type. Kind can be a string, or a `where` predicate on the relationship (an object with exact value matches)
      
      `relational.getChildrenByKindOf(parentId, kind)`
      - `parentId` the ID of a node
      - `kind` selector for the children to be included
         - string: pick children with a matching property name
         - object: pick children whose relation object matches properties on the selector object
         - function: given the relation object, pick where the function returns `true`
- [x] getNode -- return the node data for a given ID
      
      `relational.getNode(id)`
      - `id` the ID of a node
- [x] getPathOf -- give the `Kind` path for a given node ID
      
      `relational.getPathOf(nodeId)`
      - `nodeId` the ID of a node
- [x] forEachByKind -- given a `Kind` execute the supplied function for all nodes of that kind. Kind can be a string, or a `where` predicate
      
      `relational.forEachByKind(kind, actionFunc)`
      - `kind` selector for the children to be included
         - string: pick children with a matching property name
         - object: pick children whose relation object matches properties on the selector object
         - function: given the relation object, pick where the function returns `true`
      - `actionFunc` function of `(node, id)` to execute for each matching node. Any return is ignored. Any changes made to the node data is retained.

#### Manipulation

- [ ] Normalise -- removes any relationships or nodes that are not reachable from the root, but keeps node and relation indexes consistent.
      
      `relational.normalise()`
- [x] prune -- remove subtrees by relationship kind. Kind can be a string, or a `where` predicate on the relationship (an object with exact value matches)
      
      `relational.prune(kind)`
      - `kind` property name or relation match to remove.
    - [x] pruneAfter -- remove subtrees by relationship kind, but keep the immediate children. Kind can be a string, or a `where` predicate
          
          `relational.pruneAfter(kind)`
          - `kind` property name or relation match. The children of matches will be removed
    - [x] pruneAllBut -- remove subtrees that **don't** match a set of kinds. Supports only array of string kinds.
          
          `relational.pruneAllBut(kind)`
          - `kind` property name or relation match. All non-matching relations will be removed
- [x] chop -- remove subtrees by data predicate
      
      `relational.chop(filterFunc)`
      - `filterFunc` function of `(node, id)`. If this returns a truthy value, node will be removed, else node will be kept

    - [x] chopAfter -- remove subtrees by data predicate, but keep the matched children
          
          `relational.chopAfter(filterFunc)`
          - `filterFunc` function of `(node, id)`. If this returns a truthy value, all children of the matched node will be removed

    - [x] chopByKind -- remove subtrees of a specified 'kind' by data predicate. Kind can be a string, or a `where` predicate
          
          `relational.chopByKind(kind, filterFunc)`
          - `kind` property name or relation match. Matched nodes will be included in the filter
          - `filterFunc` function of `(node, id)`. If this returns a truthy value, node will be removed, else node will be kept
    - [x] chopChildless -- remove nodes which have no children (ie. leaves) by data predicate
          
          `relational.chopChildless(filterFunc)`
          - `filterFunc` function of `(node, id)`. All leaf nodes will be passed to this function. If this returns a truthy value, node will be removed.
    - [x] chopNodesByIds -- remove nodes and their subtrees by their IDs
          
          `relational.chopNodesByIds(ids)`
          - `ids` an array of node ids. All these nodes and their subtrees will be removed.
- MergeUp -- remove a relationship and one node by merging data from child to parent. Subtree remains
    - [x] mergeUpByKind -- select merge targets by relationship kind. Kind can be a string or a `where` predicate
    - [x] mergeUpByNode -- select merge targets by applying a predicate to nodes
- MergeDown -- remove a relationship and one node by merging data from parent to child. Subtree remains
    - [x] mergeDownByKind -- select merge targets by relationship kind. Kind can be a string or a `where` predicate
    - [x] mergeDownByNode -- select merge targets by applying a predicate to nodes
- [ ] Fuse -- remove a node by merging into it's parent and child (by supplied function)
    - [ ] fuseAway -- remove a node by connecting it's parents to it's children, losing the data in the selected nodes
        - [ ] fuseAwayByNode
        - [ ] fuseAwayByKind
    - [x] fuseByNode -- remove a node picked by a predicate on that node
    - [x] fuseByKind -- remove a node picked by kind. Kind can be a string or a `where` predicate
    - [ ] graft -- insert new subtrees
- [ ] disconnect -- the opposite of Fuse, place a new node between a parent and child
- [ ] fork -- move some of the values of a node into a new or existing sibling
- [ ] move -- move some of the values of a node into an existing sibling, or do nothing
- [x] flipRelationship -- given a parent kind, a child kind, and an equality function for children; swap parents⇔children, grouping children by equality. The new child kind can be a string or a `where` predicate, but the new parent kind can only be a string.
- [x] reverseByRelation -- 
- [ ] editPath -- given a path of kinds and a func node→node, replace data at those paths
- [x] reduce -- reduce objects to a single value from inside them, by kind or node predicate (` {a:[{x:1},{x:2}]} -> {a:[1,2]} `)
- [x] editByKind -- given a `kind` name and an editor function, change all immediate children of that kind. Kind can be a string or a `where` predicate
- [x] removeEmptyNodes -- recursively remove nodes which contain only `null` or `undefined`. This can remove entire subtrees that contain only empty children


Note:
* To run istanbul on Windows, use `istanbul cover C:\Users\[username]\AppData\Roaming\npm\node_modules\mocha\bin\_mocha -- -R spec`

Todo:
* optimisations
* a good way to find subtrees based on paths, and perform operations based on results
* bring `.d.ts` file up-to-date with available features
* syntax should allow chaining of functions
* extend with `kind` *and* `predicate` functions
* some way of mutating kind when fusing/merging?
