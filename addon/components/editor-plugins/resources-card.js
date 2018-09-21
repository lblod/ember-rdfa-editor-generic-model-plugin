import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/resources-card';
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
    let classLabel = preParsedString.split(':')[0];
    let searchQuery = preParsedString.split(':')[1];
    let classMeta = yield this.rdfsClassForTypeLabel(classLabel);
    let resources = yield this.queryResource(classMeta, searchQuery);

    yield Promise.all(resources.map(async r => {
      r.classMeta = classMeta;
      r.display = await formatClassDisplay( query => { return this.ajax.request(query); }, classMeta, r);
    }));

    this.set('resources', resources);
  }),

  async queryResource(classMetaData, query){
    let queryStr = `${classMetaData.apiPath}`;
    if(query){
      queryStr = `${queryStr}?${classMetaData.apiFilter}=${query}`;
    }
    let results = await this.get('ajax').request(queryStr);
    results = parseJSONAPIResults(results);
    return results;
  },

  rdfaForRefer(uri, typeOf, display){
    return `<span typeOf="${typeOf}" resource=${uri}>${display}</span>`;
  },

  actions: {
    refer(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForRefer(data.attributes.uri,
                                                                                      data.classMeta.rdfaType,
                                                                                      data.display));
    },
    async extend(data){
      let rdfa = await extendedRdfa(query => { return this.ajax.request(query); }, data, data.classMeta);
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, rdfa);
    }
  }
});
