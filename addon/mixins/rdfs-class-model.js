import Mixin from '@ember/object/mixin';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';

export default Mixin.create({
  uri: attr(),
  label: attr(),
  description: attr(),
  apiPath: attr(),
  displayProperties: attr(),
  baseUri: attr(),
  apiFilter: attr(),
  properties: hasMany('rdfs-property', { inverse:  'domain' })
});
