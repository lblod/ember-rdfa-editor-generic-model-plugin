import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/resources-relation-card';
import CardMixin from '../../mixins/card-mixin';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { formatClassDisplay, parseJSONAPIResults, extendedRdfa } from '../../utils/json-api-to-rdfa';

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

    yield Promise.all(resources.map(async r => {
      r.relationMeta = relationMeta;
      r.display = await formatClassDisplay( query => { return this.ajax.request(query); }, await relationMeta.get('range'), r);
    }));

    this.set('resources', resources);
  }),

  async getRelationOfInterest(propLabel, domainType){
    let params = {'filter[:exact:label]': propLabel, 'include': 'domain,range', 'filter[domain][rdfa-type]': domainType};
    let results = await this.store.query('rdfs-property', params);
    return results.firstObject || {};
  },

  async queryResource(classMetaData, query){
    let queryStr = `${classMetaData.get('apiPath')}`;
    if(query){
      queryStr = `${queryStr}?${classMetaData.get('apiFilter')}=${query}`;
    }
    let results = await this.get('ajax').request(queryStr);
    results = parseJSONAPIResults(results);
    return results;
  },

  rdfaForRefer(prop, uri, typeOf, display){
    return `<span property=${prop} typeOf=${typeOf} resource=${uri}>${display}</span>`;
  },

  actions: {
    refer(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForRefer(data.relationMeta.rdfaType,
                                                                                     data.attributes.uri,
                                                                                     data.relationMeta.get('range.rdfaType'),
                                                                                      data.display));
    },

    async extend(data){
      let classMetaData = await this.rdfsClassForType(data.type);
      let rdfa = await extendedRdfa(query => { return this.ajax.request(query); }, data, classMetaData, data.relationMeta.rdfaType);
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, rdfa);
    }
  }

});
