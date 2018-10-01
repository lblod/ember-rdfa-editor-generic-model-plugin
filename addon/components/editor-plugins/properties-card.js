import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/properties-card';
import CardMixin from '../../mixins/card-mixin';
import { task } from 'ember-concurrency';
import uuidv4 from 'uuidv4';
import {
  attributePropertyToRdfa,
  relationPropertyToRdfaReference
} from '../../utils/json-api-to-rdfa';

export default Component.extend(CardMixin, {
  layout,

  init() {
    this._super(...arguments);
    this.get('getAvailibleProperties').perform();
  },

  getAvailibleProperties: task( function *() {
    let query = this.get('info.query').replace(/\u200B/, '').split('./')[1];
    let type = this.get('context').context[this.get('context').context.length - 1].object;
    let params = {'filter[domain][rdfa-type]': type, 'include': 'range'};

    if(query){
      params['filter[label]'] = query;
    }

    let results  = yield this.store.query('rdfs-property', params);
    this.set('results', results);
  }),

  actions: {
    async create(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');

      if(data.range.get('isPrimitive')){
        this.get('editor').replaceTextWithHTML(...mappedLocation, attributePropertyToRdfa(data));
        return;
      }
      this.get('editor').replaceTextWithHTML(...mappedLocation,
                                             relationPropertyToRdfaReference(data,
                                                                             data.range,
                                                                             {attributes: {uri: `${data.range.get('baseUri')}${uuidv4()}`}}
                                                                            ));
    },
    search(){
      alert('Not implemented yet, type e.g. ./is-bestuurlijke-alias-van:alain');
    }
  }
});
