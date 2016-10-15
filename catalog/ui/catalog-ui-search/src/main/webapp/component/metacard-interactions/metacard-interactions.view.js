/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
/*global define*/
define([
    'wreqr',
    'marionette',
    'underscore',
    'jquery',
    './metacard-interactions.hbs',
    'js/CustomElements',
    'js/store',
    'component/router/router',
    'component/singletons/user-instance',
    'decorator/menu-navigation.decorator',
    'decorator/Decorators'
], function (wreqr, Marionette, _, $, template, CustomElements, store, router, user, MenuNavigationDecorator, Decorators) {

    return Marionette.ItemView.extend(Decorators.decorate({
        template: template,
        tagName: CustomElements.register('metacard-interactions'),
        modelEvents: {
            'change': 'render'
        },
        events: {
            'click .interaction-save': 'handleSave',
            'click .interaction-unsave': 'handleUnsave',
            'click .interaction-hide': 'handleHide',
            'click .interaction-show': 'handleShow',
            'click .interaction-expand': 'handleExpand',
            'click .interaction-share': 'handleShare',
            'click .interaction-download': 'handleDownload',
            'click .metacard-interaction': 'handleClick'
        },
        ui: {
        },
        initialize: function(){
            var currentWorkspace = store.getCurrentWorkspace();
            if (currentWorkspace) {
                this.listenTo(currentWorkspace, 'change:metacards', this.checkIfSaved);
            }
            this.listenTo(user.get('user').get('preferences'), 'change:resultBlacklist', this.checkIfBlacklisted);
        },
        onRender: function(){
            this.checkIfSaved();
            this.checkIsInWorkspace();
            this.checkIfMultiple();
            this.checkIfRouted();
            this.checkIfBlacklisted();
        },
        handleSave: function(){
            var currentWorkspace = store.getCurrentWorkspace();
            if (currentWorkspace){
                var ids = this.model.map(function(result){
                    return result.get('metacard').get('properties').get('id');
                });
                currentWorkspace.set('metacards', _.union(currentWorkspace.get('metacards'), ids));
            } else {
                //bring up modal to select workspace(s) to save to
            }
            this.checkIfSaved();
        },
        handleUnsave: function(){
            var currentWorkspace = store.getCurrentWorkspace();
            if (currentWorkspace){
                var ids = this.model.map(function(result){
                    return result.get('metacard').get('properties').get('id');
                });
                currentWorkspace.set('metacards', _.difference(currentWorkspace.get('metacards'), ids));
            }
            this.checkIfSaved();
        },
        handleHide: function(){
            var preferences = user.get('user').get('preferences');
            var ids = this.model.map(function(result){
                return result.get('metacard').get('properties').get('id');
            });
            preferences.set('resultBlacklist', _.union(preferences.get('resultBlacklist'), ids));
            preferences.savePreferences();
        },
        handleShow: function(){
            var preferences = user.get('user').get('preferences');
            var ids = this.model.map(function(result){
                return result.get('metacard').get('properties').get('id');
            });
            preferences.set('resultBlacklist', _.difference(preferences.get('resultBlacklist'), ids));
        },
        handleExpand: function(){
            var id = this.model.first().get('metacard').get('properties').get('id');
            wreqr.vent.trigger('router:navigate', {
                fragment: 'metacards/'+id,
                options: {
                    trigger: true
                }
            });
        },
        handleShare: function(){
            
        },
        handleDownload: function(){
            this.model.forEach(function(result){
                window.open(result.get('metacard').get('properties').get('resource-download-url'));
            });
        },
        handleClick: function(){
            this.$el.trigger('closeDropdown.'+CustomElements.getNamespace());
        },
        checkIfSaved: function(){
            var currentWorkspace = store.getCurrentWorkspace();
            if (currentWorkspace){
                var ids = this.model.map(function(result){
                    return result.get('metacard').get('properties').get('id');
                });
                var isSaved = true;
                ids.forEach(function(id){
                    if (currentWorkspace.get('metacards').indexOf(id) === -1){
                        isSaved = false;
                    }
                });
                this.$el.toggleClass('is-saved', isSaved);
            }
        },
        checkIsInWorkspace: function(){
            var currentWorkspace = store.getCurrentWorkspace();
            this.$el.toggleClass('in-workspace', Boolean(currentWorkspace));
        },
        checkIfMultiple: function(){
            this.$el.toggleClass('is-multiple', Boolean(this.model.length > 1));
        },
        checkIfRouted: function(){
            this.$el.toggleClass('is-routed', Boolean(router.toJSON().name === 'openMetacard'));
        },
        checkIfBlacklisted: function(){
            var pref = user.get('user').get('preferences');
            var blacklist = pref.get('resultBlacklist');
            var ids = this.model.map(function(result){
                return result.get('metacard').get('properties').get('id');
            });
            var isBlacklisted = false;
            ids.forEach(function(id){
                if (blacklist.indexOf(id) !== -1){
                    isBlacklisted = true;
                }
            });
            this.$el.toggleClass('is-blacklisted', isBlacklisted);
        },
        serializeData: function(){
            var currentWorkspace = store.getCurrentWorkspace();
            var resultJSON, workspaceJSON;
            if (this.model){
                resultJSON = this.model.toJSON()
            }
            if (currentWorkspace){
                workspaceJSON = currentWorkspace.toJSON()
            }
            var result = resultJSON[0];
            return {
                remoteResourceCached: result.isResourceLocal && result.metacard.properties['source-id'] !== 'ddf.distribution',
                result: resultJSON,
                workspace: workspaceJSON
            }
        }
    }, MenuNavigationDecorator));
});