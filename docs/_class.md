### _class

------

#### Data classification

------

This enumerated value indicates to which class or category the descriptor's value belongs.

------

The class can be selected from the following choices:

- [Category](_class_category): The value is *categorical*.
- [Reference](_class_reference): The value is a *reference* to another item.
- [Identifier](_class_identifier): The value is an *identifier*.
- [Quantity](_class_quantity): The value represents an *observed quantity*.
- [Calculated quantity](_class_quantity_calculated): The value represents a quantity *calculated* from a *set of observations*.
- [Averaged quantity](_class_quantity_averaged): The value represents a quantity *averaging* a *range* of *observations*.
- [Time](_class_time): The value represents a point in a time series.

The property can be used to *group descriptors* according to the *function* of the *value*.

*This classification applies to scalar values*.