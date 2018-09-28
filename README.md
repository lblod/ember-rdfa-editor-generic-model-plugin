@lblod/ember-rdfa-editor-generic-model-plugin
==============================================================================

Plugin responsible for injecting and creating resources within a document.

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

### Installation

* `git clone <repository-url>`
* `cd ember-rdfa-editor-generic-model-plugin`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
