/**
 * Helper function to create a Label for a resours.
 * (Takes into account some formating constrained defined in the metaModel)
 *
 * @method formatClassDisplay
 * @param {Function} function(path), async function returning JSON API (used to GET relations)
 * @param {Object} JSON API hash representing resource (e.g. mandataris)
 * @param {String} e.g. 'is-bestuurlijke-alias-van.gebruikte-voornaam'
 *
 * @return {String} matched value (e.g. Tom)
 *
 * @public
 */
const formatClassDisplay = async function formatClassDisplay(relationCaller, rdfsClassMeta, resource){
  let displayPropsToShow = JSON.parse(rdfsClassMeta.displayProperties || '[]');
  let displayProperties = [];
  await Promise.all(displayPropsToShow.map(async p => {
    let propValue = await fetchNestedAttrValue(relationCaller, resource, p);
    displayProperties.push(propValue);
  }));

  return displayProperties.join(' ');
};

/**
 * From a JSON API resource, fetch a property value, which can be nested.
 * The most last element in path should point to a plain property.
 *
 * TODO: if relation points to has-many, this won't work (e.g. 'persoon.is-aangesteld-als.beleidsdomein')
 * @method fetchNestedAttrValue
 * @param {Function} function(path), async function returning JSON API (used to GET relations)
 * @param {Object} JSON API hash representing resource (e.g. mandataris)
 * @param {String} e.g. 'is-bestuurlijke-alias-van.gebruikte-voornaam'
 *
 * @return {String} matched value (e.g. Tom)
 *
 * @public
 */
const fetchNestedAttrValue = async function fetchNestedAttrValue(callRelation, resource, propertyPath){
  let attrNames = propertyPath.split('.');

  if(attrNames.length == 0 || Object.keys(resource).length == 0)
    return '';

  let attrName = attrNames[0];

  if(!(attrName in resource['attributes']) && !resource['relationships'][attrName])
    return '';

  if(attrName in resource['attributes'])
    return resource['attributes'][attrName];

  let updatedResource = parseJSONAPIResults(await callRelation(resource['relationships'][attrName].links.related));

  return fetchNestedAttrValue(callRelation, updatedResource, attrNames.slice(1).join('.'));
};

/**
 * Basic JSON api hash parsing.
 */
const parseJSONAPIResults = function parseJSONAPIResults(results){
  return results['data'];
};

/**
 * Helper to serialize attribute content to RDFA.
 * @method attributePropertyToRdfa
 * @param {Object} rdfsProperty
 * @param {Object} JSON API hash representing resource (e.g. mandataris)
 *
 * @return {String} RDFA representation of attribute
 *
 * @private
 */
const attributePropertyToRdfa = function attributePropertyToRdfa(attributeMeta, resource){
  let datatypeIfProvided = attributeMeta.get('range.rdfaType') ? `datatype=${attributeMeta.get('range.rdfaType')}`:'';
  return `<div>
            ${attributeMeta.get('label')}
              <div property=${attributeMeta.get('rdfaType')} ${datatypeIfProvided}>
                ${resource.attributes[attributeMeta.label]}
              </div>
          </div>`;
};

/**
 * Helper to serialize relation content to RDFA. Only as reference.
 * @method relationPropertyToRdfaReference
 * @param {Object} the propertyMeta object
 * @param {Object} the target of propertyMeta (rangeMeta)
 * @param {Object} the target resource of the relation
 * @param {String} the label
 *
 * @return {String} RDFA representation of property
 *
 * @private
 */
const relationPropertyToRdfaReference = function relationPropertyToRdfaReference(propertyMeta, relationMeta, relationResource, relationResourceDisplayLabel){
  return `<div property=${propertyMeta.get('rdfaType')}
               typeOf=${relationMeta.get('rdfaType')}
               resource=${relationResource.attributes.uri}>
            ${relationResourceDisplayLabel}
          </div>`;
};


/**
 * Helper group all target resources from a relation, serialized as RDFA.
 * @method relationPropertyToRdfaReference
 * @param {Object} the propertyMeta object
 * @param {Array} Array containg RDFA strings of resources
 *
 * @return {String} RDFA representation of the relation resource
 *
 * @private
 */
const relationPropertyResourcesToRdfa = function relationPropertyResourcesToRdfa(propertyMeta, rdfaRelationResources){
    return `<div>
              ${propertyMeta.get('label')}
              <div>
                ${rdfaRelationResources.join(" ")}
              </div>
            </div>`;
};


/**
 * Helper group all Rdfa-props and Rdfa-relations of resource to Rdfa
 * @method resourceToRdfa
 * @param {Object} the metaData model from resource
 * @param {Object} the resource
 * @param {Array} Array containg RDFA strings of attributes
 * @param {Array} Array containg RDFA strings of relations
 * @param {String} [OPTIONAL] if the the resource belongs to a property, provid the ref of the property
 *
 * @return {String} RDFA representation of the resource
 *
 * @private
 */
const resourceToRdfa = function resourceToRdfa(classMeta, resource, rdfaProps, rdfaRels, propertyRef){
    if(propertyRef){
    return `<div property=${propertyRef} typeOf="${classMeta.rdfaType}" resource=${resource.attributes['uri']}>
              ${rdfaProps}
              ${rdfaRels}
            </div>`;
  }

  return `<div typeOf="${classMeta.rdfaType}" resource=${resource.attributes['uri']}>
            ${rdfaProps}
            ${rdfaRels}
          </div>`;
};

/**
 * Expands resource to RDFA. Relations of the resource will contain only a reference.
 * @method resourceToRdfa
 * @param {Function}  function(path), async function returning JSON API to get Relations
 * @param {Object} the JSON representation of the resource
 * @param {Object} the DSObject classMeta info of the resource
 * @param {String} [OPTIONAL] if the the resource belongs to a property, provid the ref of the property
 *
 * @return {String} RDFA representation of the resource
 *
 * @public
 */
const extendedRdfa = async function extendedRdfa(callRelation, resourceData, classMeta, propertyRef){
  //get properties from class
  let properties = await classMeta.get('properties');

  //make difference between attributes and relations
  let attributesMeta = [];
  let relationsMeta = [];
  await Promise.all(properties.map(async p => {
    if(!(await p.range).isPrimitive)
      relationsMeta.push(p);
    else
      attributesMeta.push(p);
  }));

  //start query to fetch resource
  let query = `${classMeta.apiPath}/${resourceData.id}`;
  let resource = parseJSONAPIResults(await callRelation(query));

  //serialize attributes
  let rdfaProps = attributesMeta
        .filter(attrMeta => resource.attributes[attrMeta.label])
        .map(attrMeta => { return attributePropertyToRdfa(attrMeta, resource); })
        .join('');

  //serialize relations
  let rdfaRels = (await Promise.all(relationsMeta.map(async propertyMeta => {

    //fetch included resource for property
    let relationResources = parseJSONAPIResults(await callRelation(resource.relationships[propertyMeta.label].links.related));

    if(!relationResources || relationResources.length == 0)
      return '';

    //handle as if everything is has many
    if(!Array.isArray(relationResources)){
      relationResources = [ relationResources ];
    }

    let targetRelationMeta = await propertyMeta.range;

    //start serializing
    let rdfaRelationResources = await Promise.all(relationResources.map(async relationResource =>{
      let resourceLabel = await formatClassDisplay(callRelation, targetRelationMeta, relationResource);
      return relationPropertyToRdfaReference(propertyMeta, targetRelationMeta, relationResource, resourceLabel);
    } ));

    return relationPropertyResourcesToRdfa(propertyMeta, rdfaRelationResources);

  }))).join('');

  return resourceToRdfa(classMeta, resource, rdfaProps, rdfaRels, propertyRef);
};

export {
  formatClassDisplay,
  fetchNestedAttrValue,
  parseJSONAPIResults,
  extendedRdfa,
  relationPropertyToRdfaReference
}
