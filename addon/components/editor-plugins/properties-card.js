import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/properties-card';
import CardMixin from '../../mixins/card-mixin';
import { task } from 'ember-concurrency';
import uuidv4 from 'uuidv4';

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

  rdfaForCreateProperty(label, propertyId, rdfaType){
    return `<div> ${label}: <div property=${propertyId} datatype=${rdfaType}>&nbsp;</div> </div>`;
  },

  rdfaForCreateRelationship(label, propertyId, typeOf, uriBase){
    let uri = `${uriBase}${uuidv4()}`;
    return `
       ${label}
       <div property=${propertyId} typeof=${typeOf} resource="${uri}">
       &nbsp;
      </div>
    `;
  },

  actions: {
    async create(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');

      if(data.range.get('isPrimitive')){
        this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForCreateProperty(data.label, data.rdfaType, data.get('range.rdfaType')));
        return;
      }
      this.get('editor').replaceTextWithHTML(...mappedLocation,
                                             this.rdfaForCreateRelationship(data.label, data.rdfaType,
                                                                            data.range.get('rdfaType'),
                                                                            data.range.get('baseUri')));
    },
    search(){
      alert('Not implemented yet, type e.g. ./is-bestuurlijke-alias-van:alain');
    }
  }
});
