import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/resources-card';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import uuidv4 from 'uuidv4';

export default Component.extend({
  layout,
  store: service(),
  ajax: service(),
  init() {
    this._super(...arguments);
    this.set('errors', []);
    this.set('message', '');
    this.set('resources', '');
    this.get('getAvailibleResources').perform();
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

  getAvailibleResources: task( function *() {
    let classLabel = this.get('info.query').replace(/\u200B/, '').split(':')[0];
    let searchQuery = this.get('info.query').replace(/\u200B/, '').split(':')[1];
    let classMeta = yield this.getClassOfInterest.bind(this)(classLabel);
    let resources = yield this.queryResource(classMeta, searchQuery);

    resources.map(r => {
      r.classMeta = classMeta;
      r.display = this.formatResourceDisplay(r, classMeta);
    });

    this.set('resources', resources);
  }),

  formatResourceDisplay(resource, classMeta){
    let displayPropsToShow = JSON.parse(classMeta.displayProperties);
    let displayProperties = [];
    displayPropsToShow.map(p => {
      displayProperties.push(resource['attributes'][p]);
    });

    return displayProperties.join(' ');
  },

  async getClassOfInterest(classLabel){
    let params = {'filter[:exact:label]': classLabel};
    let results = await this.store.query('rdfs-class', params);
    return results.firstObject || {};
  },

  async queryResource(classMetaData, query){
    let queryStr = `${classMetaData.apiPath}`;
    if(query){
      queryStr = `${queryStr}?${classMetaData.apiFilter}=${query}`;
    };
    let results = await this.get('ajax').request(queryStr);
    results = this.get('parseJSONAPIResults')(results);
    return results;
  },

  parseJSONAPIResults(results){
    return results['data'];
  },

  rdfaForRefer(uri, typeOf, display){
    return `<span typeOf="${typeOf}" resource=${uri}>${display}</span>`;
  },

  actions: {
    refer(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForRefer(data.attributes.uri,
                                                                                      data.classMeta.uri,
                                                                                      data.display));
    },
    extend(){
    }
  }
});
