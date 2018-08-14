import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/classes-card';
import CardMixin from '../../mixins/card-mixin';
import { task } from 'ember-concurrency';
import uuidv4 from 'uuidv4';

export default Component.extend(CardMixin, {
  layout,

  init() {
    this._super(...arguments);
    this.get('getAvailibleClasses').perform();
  },

  getAvailibleClasses: task( function *() {
    let params = {};
    let query = this.get('info.query').replace(/\u200B/, '').split('~/')[1];
    let results;
    if(query){
      params['filter[label]'] = query;
      results = yield this.store.query('rdfs-class', params);
    }
    else{
      results = yield this.store.findAll('rdfs-class');
    }
    this.set('results', results);
  }),

  rdfaForCreateInstance(label, typeOf, uriBase){
    let uri = `${uriBase}${uuidv4()}`;
    return `
       <div typeof=${typeOf} resource="${uri}">
       &nbsp;
      </div>
    `;
  },

  actions: {
    create(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForCreateInstance(data.label,
                                                                                      data.rdfaType,
                                                                                      data.baseUri));
    },
    search(){
    }
  }
});
