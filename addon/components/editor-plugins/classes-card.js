import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/classes-card';
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
    this.get('getAvailibleClasses').perform();
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

  getAvailibleClasses: task( function *() {
    let params = {};
    let query = this.get('info.query').replace(/\u200B/, '');
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
                                                                                      data.uri,
                                                                                      data.baseUri));
    },
    search(){
    }
  }
});
