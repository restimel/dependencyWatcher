self.global = {
    data: [],
    types: {},
    rootItem: [],

    getData: function(confIdx = 0) {
        var url = 'data/links.json?configuration=' + confIdx;

        console.log('getData')
        fetch(url)
            .then(response => response.json(), error => console.error('Failed to retrieve data file' + error.message))
            .then(response => {
                global.data = response;
                console.log(response)
                if (typeof self.loadData === 'function') {
                    self.loadData(global.data);
                }
            }, error => {
                global.data = null;
                console.error('Failed to parse data file' + error.message);
            });
    },
};
