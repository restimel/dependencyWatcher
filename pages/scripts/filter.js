(function() {
    var elFilter = document.getElementById('filterArea');
    var elFilterBtn = document.getElementById('filterButton');
    var elSearch = document.getElementById('search');
    var elDataList = document.getElementById('itemsDataList');
    var loadDataOrig = self.loadData;

    function createOption(itemName) {
        var option = document.createElement('option');
        option.value = itemName;
        option.textContent = itemName;
        return option;
    }

    function loadData() {
        elDataList.html = '';
        if (global.data) {
            global.data.forEach(item=>elDataList.appendChild(createOption(item.name)));
        }
    }

    function applyFilter(name) {
        // elSearch.value = name;
        getItem(name);
    }

    function searchItem(name) {
        return global.data.find(o=>o.name===name);
    }

    function getItem(name) {
        var item = searchItem(name);
        if (item) {
            displayDetails(item, null, true);
        }
    }

    elSearch.oninput = function(evt) {
        getItem(evt.currentTarget.value);
    };

    elFilterBtn.onclick = function() {
        console.log('TODO dialog filter')
    };

    if (typeof loadDataOrig === 'function') {
        self.loadData = function() {
            loadDataOrig.apply(this, arguments);
            loadData();
        };
    } else {
        self.loadData = loadData;
    }

    self.searchItem = searchItem;
    self.applyFilter = applyFilter;
})();
