import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/properties-card';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import uuidv4 from 'uuidv4';

export default Component.extend({
  layout,
  store: service(),
  init() {
    this._super(...arguments);
    this.set('errors', []);
    this.set('message', '');
    this.set('results', '');
    this.get('getAvailibleProperties').perform();
  },

  willDestroyElement() {
    this.set('errors', []);
  },

  /**
   * Region on which the card applies
   * @property location
   * @type [number,number]
   * @private
  */
  location: reads('info.location'),

  /**
   * Region on which the card applies
   * @property context
   * @type {}
   * @private
  */
  context: reads('info.context'),

  /**
   * Unique identifier of the event in the hints registry
   * @property hrId
   * @type Object
   * @private
  */
  hrId: reads('info.hrId'),

  /**
   * The RDFa editor instance
   * @property editor
   * @type RdfaEditor
   * @private
  */
  editor: reads('info.editor'),

  /**
   * Hints registry storing the cards
   * @property hintsRegistry
   * @type HintsRegistry
   * @private
  */
  hintsRegistry: reads('info.hintsRegistry'),

  getAvailibleProperties: task( function *() {
    let query = this.get('info.query').replace(/\u200B/, '').split('./')[1];
    let type = this.get('context').context[this.get('context').context.length - 1].object;
    let params = {'filter[domain][:uri:]': type, 'include': 'range'};

    if(query){
      params['filter[label]'] = query;
    }

    let results  = yield this.store.query('rdfs-property', params);
    this.set('results', results);
  }),

  rdfaForCreateProperty(label, propertyId){
    return `<div> ${label}: <div property=${propertyId}>&nbsp;</div> </div>`;
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
        this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForCreateProperty(data.label, data.uri));
        return;
      }
      this.get('editor').replaceTextWithHTML(...mappedLocation,
                                             this.rdfaForCreateRelationship(data.label, data.uri,
                                                                            data.range.get('uri'),
                                                                            data.range.get('baseUri')));
    },
    search(){
    }
  }
});
