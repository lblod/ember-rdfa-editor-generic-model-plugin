/* eslint-env node */
const existsSync = require('exists-sync');
const fs = require('fs');
const path = require('path');

const profilesFile = 'app/config/editor-profiles.js';

module.exports = {
  description: 'Adds the plugin to the default and all editor-profiles',

  normalizeEntityName() { },

  insertPluginNameAtKey( key, pluginName, afterContents="" ){
    return this.insertIntoFile(
      profilesFile,
      `    "${pluginName}",${afterContents}`,
      { after: `  ${key}: [\n` });
  },

  async afterInstall(options) {
    const pluginName = options.originBlueprintName.slice('@lblod/ember-'.length);

    if( existsSync(profilesFile) ){
      try {
        await this.insertPluginNameAtKey("all", pluginName);
        await this.insertPluginNameAtKey("default", pluginName, " "); /* the extra space here,
                                                                         makes the line different
                                                                         from the inserted line
                                                                         above.  This is makes
                                                                         insertIntoFile consider
                                                                         the lines to be different,
                                                                         and hence insert the
                                                                         contents.  Sorry for the
                                                                         somewhat uglier generated
                                                                         files. */
      } catch (err) {
        throw 'Failed to insert all contents ' + err;
      }
    } else {
      throw 'Could not insert into "all" profile';
    }

    let rootPath = options.project.addonPackages['@lblod/ember-rdfa-editor-generic-model-plugin'].path;
    let self = this;
    await this.exportModels(rootPath);
  },

  async exportModels(rootPath) {
    return this.runBlueprintFromDir('@lblod/ember-rdfa-editor-generic-model-plugin-export-models', path.join(rootPath, 'addon', 'models'), []);
  },

  async runBlueprintFromDir(blueprint, dir, filesToIgnore) {
    let blueprintTask = this.taskFor('generate-from-blueprint');

    let files = [];

    fs.readdirSync(dir).forEach(file => {
      files.push(path.parse(file).name);
    });

    files = files.filter(file => !(/(^|\/)\.[^\/\.]/g).test(file));

    files = files.filter(file => !filesToIgnore.includes(file));

    let tasks = [];

    for(let model of files){
      let options = {
        args: [blueprint, model],
        dryRun: false,
        verbose: true,
        disableAnalytics: false
      };
      await blueprintTask.run(options);
    };
  }
};
