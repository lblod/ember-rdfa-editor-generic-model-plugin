import Mixin from '@ember/object/mixin';
import attr from 'ember-data/attr';
import { hasMany, belongsTo } from 'ember-data/relationships';

export default Mixin.create({
  uri: attr(),
  label: attr(),
  rdfaType: attr(),
  domain: hasMany('rdfs-class', { inverse: 'properties'}),
  range: belongsTo('rdfs-class')
});
