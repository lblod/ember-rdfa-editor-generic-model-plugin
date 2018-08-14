const formatClassDisplay = async function formatClassDisplay(queryCaller, rdfsClass, resource){
  let displayPropsToShow = JSON.parse(rdfsClass.displayProperties || '[]');
  let displayProperties = [];
  await Promise.all(displayPropsToShow.map(async p => {
    let attrNames = p.split('.'); //expects persoon.is-bestuurlijke-alias-van
    let propValue = await fetchNestedAttrValue(queryCaller, resource, attrNames);
    displayProperties.push(propValue);
  }));

  return displayProperties.join(' ');
};

const fetchNestedAttrValue = async function fetchNestedAttrValue(queryCaller, resource, attrNames){
  //TODO: fix has-many
  if(attrNames.length == 0 || Object.keys(resource).length == 0)
    return '';
  let attrName = attrNames[0];
  if(attrName in resource['attributes'])
    return resource['attributes'][attrName];

  let updatedResource = parseJSONAPIResults(await queryCaller(resource['relationships'][attrName].links.related));

  return fetchNestedAttrValue(queryCaller, updatedResource, attrNames.slice(1));
};

const parseJSONAPIResults = function parseJSONAPIResults(results){
  return results['data'];
};

const extendedRdfa = async function extendedRdfa(queryCaller, resourceData, classMeta, prop){
  //get properties from class
  let properties = await classMeta.get('properties');

  //make difference between attributes
  let attributes = [];
  let relations = [];
  await Promise.all(properties.map(async p => {
    if(!(await p.range).isPrimitive)
      relations.push(p);
    else
      attributes.push(p);
  }));

  //start query
  let query = `${classMeta.apiPath}/${resourceData.id}`;
  let result = parseJSONAPIResults(await queryCaller(query));

  //serialize attributes
  //TODO: dataType
  let rdfaProps = attributes.map(p => {
    return `<div> ${p.get('label')}: <div property=${p.get('rdfaType')}> ${result.attributes[p.label]}</div> </div>`;
  }).join('');

  //serialize relations
  let rdfaRels = (await Promise.all(relations.map(async r => {
    //find included data for property
    let relData = parseJSONAPIResults(await queryCaller(result.relationships[r.label].links.related));
    //TODO: hasMANY!!
    let relMetaData = await r.range;

    let displayLabel = await formatClassDisplay(queryCaller, relMetaData, relData);

    return `${r.label}: <span property=${r.rdfaType} typeOf=${relMetaData.uri} resource=${relData.attributes.uri}>${displayLabel}</span>`;
  }))).join('');

  if(prop){
    return `<div property=${prop} typeOf="${classMeta.rdfaType}" resource=${result.attributes['uri']}>
            ${rdfaProps}
            ${rdfaRels}
          </div>`;
  }

  return `<div typeOf="${classMeta.rdfaType}" resource=${result.attributes['uri']}>
            ${rdfaProps}
            ${rdfaRels}
          </div>`;
};

export {
  formatClassDisplay,
  fetchNestedAttrValue,
  parseJSONAPIResults,
  extendedRdfa

}
