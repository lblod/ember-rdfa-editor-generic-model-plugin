import { getOwner } from '@ember/application';
import Service from '@ember/service';
import EmberObject, { computed } from '@ember/object';
import { task } from 'ember-concurrency';
//TODO: match multiple times ~/
//TODO: pagination
//TODO: nog wat zeer irritante problemen met invislbe space enzo
//TODO: include? as parameter
//TODO: filtering on label when search is NOK -> should be URI match
//TODO: nested presentation -> e.g. mandataris (mandaat, persoon)
//TODO:  display relation

//order matters
const INJECTCONTEXTS = [
  { card: 'editor-plugins/resources-relation-card',
    pattern: /\.\/\S*:\S*/
  },
  {
    card: 'editor-plugins/resources-card',
    pattern: /\~\/\S*:\S*/
  },
  {
    card: 'editor-plugins/classes-card',
    pattern: /\~\/\S*/ //e.g  ~/foo felix -> ~/foo
  },
  {
    card: 'editor-plugins/properties-card',
    pattern:  /\.\/\S*/
  }];

/**
 * Service responsible for correct annotation of dates
 *
 * @module editor-generic-model-plugin
 * @class RdfaEditorGenericModelPlugin
 * @constructor
 * @extends EmberService
 */
const RdfaEditorGenericModelPlugin = Service.extend({
  init(){
    this._super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
  },

  /**
   * Restartable task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor) {
    if (contexts.length === 0) return [];

    const hints = [];
    contexts.forEach((context) => {
      let relevantContext = this.detectRelevantContext(context);
      if (relevantContext) {
        hintsRegistry.removeHintsInRegion(context.region, hrId, this.get('who'));
        hints.pushObjects(this.generateHintsForContext(relevantContext, context));
      }
    });
    const cards = hints.map( (hint) => this.generateCard(hrId, hintsRegistry, editor, hint));
    if(cards.length > 0){
      hintsRegistry.addHints(hrId, this.get('who'), cards);
    }
  }).restartable(),

  /**
   * Given context object, tries to detect a context the plugin can work on
   *
   * @method detectRelevantContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Object} InjectContext if found.
   *
   * @private
   */
  detectRelevantContext(context){
    return INJECTCONTEXTS.find(c => {
      return context.text.toLowerCase().match(c.pattern);
    });
  },

  /**
   * Maps location of substring back within reference location
   *
   * @method normalizeLocation
   *
   * @param {[int,int]} [start, end] Location withing string
   * @param {[int,int]} [start, end] reference location
   *
   * @return {[int,int]} [start, end] absolute location
   *
   * @private
   */
  normalizeLocation(location, reference){
    return [location[0] + reference[0], location[1] + reference[0]];
  },

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, hintsRegistry, editor, hint){
    return EmberObject.create({
      info: {
        label: this.get('who'),
        query: hint.text,
        location: hint.location,
        hrId, hintsRegistry, editor,
        context: hint.context
      },
      location: hint.location,
      card: hint.injectContext.card
    });
  },

  /**
   * Generates a hint, given a context
   *
   * @method generateHintsForContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Object} [{dateString, location}]
   *
   * @private
   */
  generateHintsForContext(injectContext, context){
    const hints = [];
    const matched = context.text.toLowerCase().match(injectContext.pattern);
    const index = matched.index;
    const text = matched[0];
    const location = this.normalizeLocation([index, index + matched[0].length], context.region);
    hints.push({context, text, location, injectContext});
    return hints;
  }
});

RdfaEditorGenericModelPlugin.reopen({
  who: 'editor-plugins/generic-model-plugin'
});
export default RdfaEditorGenericModelPlugin;
