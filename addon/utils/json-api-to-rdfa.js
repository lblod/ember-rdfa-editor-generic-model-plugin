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
  //TODO: has-many will fail now
  if(attrNames.length == 0 || Object.keys(resource).length == 0)
    return '';
  let attrName = attrNames[0];

  if(!(attrName in resource['attributes']) && !resource['relationships'][attrName])
    return '';

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

  //make difference between attributes and relations
  let attributes = [];
  let relations = [];
  await Promise.all(properties.map(async p => {
    if(!(await p.range).isPrimitive)
      relations.push(p);
    else
      attributes.push(p);
  }));

  //start query to fetch resource
  let query = `${classMeta.apiPath}/${resourceData.id}`;
  let result = parseJSONAPIResults(await queryCaller(query));

  //serialize attributes
  //TODO: add dataType to property
  let rdfaProps = attributes.map(p => {
    return `<div> ${p.get('label')}: <div property=${p.get('rdfaType')}> ${result.attributes[p.label]}</div> </div>`;
  }).join('');

  //serialize relations (will be references to)
  let rdfaRels = (await Promise.all(relations.map(async r => {
    //find included resource for property
    let relData = parseJSONAPIResults(await queryCaller(result.relationships[r.label].links.related));

    if(!relData)
      return '';

    //handle as if everything is has many
    let relMetaData = await r.range;
    if(!Array.isArray(relData)){
      relData = [ relData ];
    }

    let labels = await Promise.all(relData.map(async rel => {
      let displayLabel = await formatClassDisplay(queryCaller, relMetaData, rel);
      return `<span property=${r.rdfaType} typeOf=${relMetaData.rdfaType} resource=${rel.attributes.uri}>${displayLabel}</span> <br /> <br />`;
    }));

    return `<div> ${r.label} <div>${labels.join(" ")}</div> </div>`;

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
