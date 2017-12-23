(function() {
    'use strict';

    Vue.component('column', {
        props: {
            width: Number
        },
        data: function() {
            return {
                margin: 5, // space between all items (items and wire)
                wiresSpace: 60, // default space between items (to draw wires between them)
                gridX: 60, // space between columns
            };
        },
        computed: {

        },
        methods: {
            
        },
        template: ``
    });

    Vue.component('columns', {
        props: [],
        data: function() {
            return {
                columns: {},
                columnsOrder: [],
                columnWidth: 150, // default width of a column
            };
        },
        computed: {

        },
        methods: {
            changeWidth: function(index, width) {
                //TODO
            }
        },
        template: ``
    });

})();