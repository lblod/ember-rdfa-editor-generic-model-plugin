import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/resources-card';
import CardMixin from '../../mixins/card-mixin';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

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
    let classMeta = yield this.getClassOfInterest(classLabel);
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

  async rdfaForExtend(resourceData, classMeta){
    //get properties from class
    let properties = await classMeta.get('properties');
    let props = [];
    let relations = [];
    await Promise.all(properties.map(async p => {
      if(!(await p.range).isPrimitive)
        relations.push(p);
      else
        props.push(p);
    }));

    //start query
    let query = `${classMeta.apiPath}/${resourceData.id}`;
    let result = this.parseJSONAPIResults(await this.get('ajax').request(query));

    //serialize props
    let rdfaProps = props.map(p => {
      return `<div> ${p.get('label')}: <div property=${p.get('uri')}> ${result.attributes[p.label]}</div> </div>`;
    }).join('');

    //serialize relations
    let rdfaRels = (await Promise.all(relations.map(async r => {
      //find included data for property
      let relData = this.parseJSONAPIResults(await this.ajax.request(result.relationships[r.label].links.related));
      //TODO: hasMANY!!
      let relMetaData = await r.range;

      let displayLabel = this.formatResourceDisplay(relData, relMetaData);

      return `${r.label}: <span property=${r.uri} typeOf=${relMetaData.uri} resource=${relData.attributes.uri}>${displayLabel}</span>`;
    }))).join('');

    return `<div typeOf="${classMeta.uri}" resource=${result.attributes['uri']}>
              ${rdfaProps}
              ${rdfaRels}
            </div>`;
  },

  actions: {
    refer(data){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, this.rdfaForRefer(data.attributes.uri,
                                                                                      data.classMeta.uri,
                                                                                      data.display));
    },
    async extend(data){
      let rdfa = await this.rdfaForExtend(data, data.classMeta);
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/generic-model-plugin');
      this.get('editor').replaceTextWithHTML(...mappedLocation, rdfa);
    }
  }
});
