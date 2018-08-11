import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/resources-relation-card';
import CardMixin from '../../mixins/card-mixin';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';

import uuidv4 from 'uuidv4';

export default Component.extend(CardMixin, {
  layout,
  ajax: service(),
  init() {
    this._super(...arguments);
    this.get('getAvailibleResources').perform();
  },

  getAvailibleResources: task( function *() {
    let preParsedString = this.get('info.query').replace(/\u200B/, '').split('/')[1];
    let propLabel = preParsedString.split(':')[0];
    let searchQuery = preParsedString.split(':')[1];
    let domainType = this.get('context').context[this.get('context').context.length - 1].object;
    let relationMeta = yield this.getRelationOfInterest(propLabel, domainType);
    let resources = yield this.queryResource(relationMeta.range, searchQuery);

    resources.map(r => {
      r.relationMeta = relationMeta;
      r.display = this.formatResourceDisplay(r, relationMeta.range);
    });

    this.set('resources', resources);
  }),

  formatResourceDisplay(resource, classMeta){
    let displayPropsToShow = JSON.parse(classMeta.get('displayProperties'));
    let displayProperties = [];
    displayPropsToShow.map(p => {
      displayProperties.push(resource['attributes'][p]);
    });

    return displayProperties.join(' ');
  },

  async getRelationOfInterest(propLabel, domainType){
    let params = {'filter[:exact:label]': propLabel, 'include': 'domain,range', 'filter[domain][:uri:]': domainType};
    let results = await this.store.query('rdfs-property', params);
    return results.firstObject || {};
  },

  async queryResource(classMetaData, query){
    let queryStr = `${classMetaData.get('apiPath')}`;
    if(query){
      queryStr = `${queryStr}?${classMetaData.get('apiFilter')}=${query}`;
    };
    let results = await this.get('ajax').request(queryStr);
    results = this.get('parseJSONAPIResults')(results);
    return results;
  },

  parseJSONAPIResults(results){
    return results['data'];
  },

  rdfaForRefer(prop, uri, typeOf, display){
    return `<span property=${prop} typeOf=${typeOf} resource=${uri}>${display}</span>`;
  },

  actions: {
    refer(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForRefer(data.relationMeta.uri,
                                                                                     data.attributes.uri,
                                                                                     data.relationMeta.get('range.uri'),
                                                                                      data.display));
    },
    extend(){
    }
  }
});
