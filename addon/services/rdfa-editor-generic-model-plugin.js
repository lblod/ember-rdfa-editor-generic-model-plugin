import Service from '@ember/service';
import EmberObject from '@ember/object';
import { task } from 'ember-concurrency';

//order matters
const INJECTCONTEXTS = [
  { card: 'editor-plugins/resources-relation-card',
    //matches ./class:searchterm  and  ./class:"searchterm and ./class:"search term"
    pattern: /\.\/\S*:((".*")|(".*[^"])|(\S*))/
  },
  {
    card: 'editor-plugins/resources-card',
    pattern: /~\/\S*:((".*")|(".*[^"])|(\S*))/
  },
  {
    card: 'editor-plugins/classes-card',
    pattern: /~\/\S*/ //e.g  ~/foo felix -> ~/foo
  },
  {
    card: 'editor-plugins/properties-card',
    pattern:  /\.\/\S*/
  }];

/**
 * Service responsible for detecting special string to trigger the meta-model to insert Rdfa
 *
 *
 * ---------------------------------------------------
 * CODE REVIEW NOTES
 * ---------------------------------------------------
 *
 *  INTERACTION PATTERNS
 *  --------------------
 *  For all incoming contexts, check is a special string pattern (something like "~/besluit") is detected. Highlight this text and add a hint.
 *  When clicked, the highlighted text will be used in the card to query the meta model.
 *  On insert, the highlighted text is replaced with HTML.
 *
 *  POTENTIAL ISSUES/TODO
 *  ---------------------
 *  TODO: eventually reconsider the restarable task. (but since all sync code, this should not affect the hints generation)
 * ---------------------------------------------------
 * END CODE REVIEW NOTES
 * ---------------------------------------------------
 *
 * @module editor-generic-model-plugin
 * @class RdfaEditorGenericModelPlugin
 * @constructor
 * @extends EmberService
 */
const RdfaEditorGenericModelPlugin = Service.extend({
  init(){
    this._super(...arguments);
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
  }),

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
      return (context.text || '').toLowerCase().match(c.pattern);
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
    const matched = (context.text || '').toLowerCase().match(injectContext.pattern);
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
