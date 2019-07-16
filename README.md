@lblod/ember-rdfa-editor-generic-model-plugin
==============================================================================

Plugin responsible for injecting and creating resources within a document.


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install @lblod/ember-rdfa-editor-generic-model-plugin
```


Usage
------------------------------------------------------------------------------

Plugin responsible for injecting and creating resources within a document.

Currently it starts matching

* ~/classType:searchTermWithNoSpaces
* ~/classType:"searchTerm With Spaces"

* ./property:searchTermWithNoSpaces
* ./property:"searchTerm With Spaces"


TODOS
-------------------------------------------------------------------------------
* think about inverse relations...
* match multiple '~/' of './' at the same time in the same context
* pagination handling
   * cards should have 'next/previous'
   * in disaplay mode, if has-many -> walk all results...
* cleaning of parsing string
* include? as parameter (not sure)
* datamodel is still not ok -> a property has a name within the namespace of a class. Revist this...
* fix representation has-many e.g. ['persoon.is-aangesteld-als[].mandaat.label']
* specify data type in property
* parsing of start command should match ~/personen:"van den berghe"
* display labels should vary in function of the shown property e.g:
  * starting from mandataris the label should be "Naam, Voornaam, Mandaat (label)"
  * but if you include a mandataris in persoon, the mandataris should just have "Mandaat (label)"
* general clean up of code
* strip nasty chars




Contributing
------------------------------------------------------------------------------
See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
