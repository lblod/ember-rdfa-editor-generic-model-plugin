import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/classes-card';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import uuidv4 from 'uuidv4';

export default Component.extend({
  layout,
  ajax: service(),
  init() {
    this._super(...arguments);
    this.set('errors', []);
    this.set('message', '');
    this.set('clasess', '');
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
    let filter = this.get('info.query').replace(/\u200B/, '');
    let query = `/classes?filter[label]=${filter}`;
    let results  = yield this.get('ajax').request(filter ? query : '/classes');
    results = this.get('parseJSONAPIResults')(results);
    this.set('classes', results);
  }),

  parseJSONAPIResults(results){
    return results['data'];
  },

  rdfaForCreateInstance(label, typeOf, uriBase){
    let uri = `${uriBase}${uuidv4()}`;
    return `
       <div typeof=${typeOf} resource="${uri}">
        [geeft eigenschappen voor een "${label}" op]
      </div>
    `;
  },

  actions: {
    create(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-card');
      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForCreateInstance(data.attributes.label,
                                                                                      data.attributes['s-prefix'],
                                                                                      data.attributes['s-url']));
    },
    search(){
    }
  }
});
