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


export {
  formatClassDisplay,
  fetchNestedAttrValue,
  parseJSONAPIResults

}
