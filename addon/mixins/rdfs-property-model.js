import Mixin from '@ember/object/mixin';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';

export default Mixin.create({
  uri: attr(),
  label: attr(),
  domain: hasMany('rdfs-class', { inverse: 'properties'}),
  range: hasMany('rdfs-class')
});
