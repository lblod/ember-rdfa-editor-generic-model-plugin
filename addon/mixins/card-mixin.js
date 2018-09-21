import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Mixin.create({
  store: service(),

  init() {
    this._super(...arguments);
    this.set('errors', []);
    this.set('message', '');
    this.set('results', '');
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

  rdfsClassForTypeLabel: async function(classType){
    let params = {'filter[:exact:label]': classType};
    let results = await this.store.query('rdfs-class', params);
    return results.firstObject || {};
  },

  rdfsClassForJsonApiType: async function(jsonApiType){
    let params = {'filter[:exact:json-api-type]': jsonApiType};
    let results = await this.store.query('rdfs-class', params);
    return results.firstObject || {};
  }
});
