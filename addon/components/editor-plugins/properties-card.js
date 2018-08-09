import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/properties-card';
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
    let filter = `filter[label]=${this.get('info.query').replace(/\u200B/, '')}`;
    let type = this.get('context').context[this.get('context').context.length - 1].object;
    let baseQuery = `/properties?include=range&filter[domain][s-prefix]=${type}`;
    let query = `/properties?include=range&${filter}&filter[domain][s-prefix]=${type}`;
    let results  = yield this.get('ajax').request(this.get('info.query') ? query : baseQuery);
    results = this.get('parseJSONAPIResults')(results);
    this.set('classes', results);
  }),

  parseJSONAPIResults(results){
    return results['data'];
  },

  rdfaForCreateProperty(label, propertyId){
    return `<div> ${label}: <span property=${propertyId}>[geef waarde op]</span> </div>`;
  },

  rdfaForCreateRelationship(label, propertyId, typeOf, uriBase){
    let uri = `${uriBase}${uuidv4()}`;
    return `
       <div property=${propertyId} typeof=${typeOf} resource="${uri}">
        [geeft eigenschappen voor een "${label}" op]
      </div>
    `;
  },

  actions: {
    async create(data){
      //TODO: cleanup
      let rel;
      if(data.relationships.range.data){
        let res = await this.get('ajax').request(`/classes/${data.relationships.range.data.id}`);
        rel = this.get('parseJSONAPIResults')(res);
      }

      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-card');

      if(rel){
              this.get('editor').replaceTextWithHTML(...mappedLocation,
                                               this.rdfaForCreateRelationship(data.attributes.label,
                                                                              data.attributes['s-prefix'],
                                                                              rel['attributes']['s-prefix'],
                                                                              rel['attributes']['s-url']));
        return;
      }

      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForCreateProperty(data.attributes.label,
                                                                                      data.attributes['s-prefix']));
    },
    search(){
    }
  }
});
