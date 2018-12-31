export default function shortestPath(items, item1, item2) {
    const costMax = 2 ** 31;
    const costItems = new Map();

    const listDone = new Map();
    const listTodo = new Map();
    const costBucket = new Map();

    function getCost(itemName) {
        let cost = costItems.get(itemName);

        if (!cost) {
            const item = items.get(itemName);
            if (!item) {
                return costMax;
            }
            cost = item.dependencies.length * 1 + item.requiredBy.length * 10 + 1;
            costItems.set(itemName, cost);
        }

        return cost;
    }

    function getNextItem() {
        const bucketId = Array.from(costBucket.keys()).sort((a, b) => a - b)[0];
        const node = costBucket.get(bucketId)[0];
        removeCostNode(node);
        listTodo.delete(node.name);
        listDone.set(node.name, node);
        return node;
    }

    function searchNextNodes(node) {
        node.item.dependencies.forEach(subItem => addNode(subItem, node));
        node.item.requiredBy.forEach(subItem => addNode(subItem, node));
    }

    function addCostNode(node) {
        const nodeCost = node.cost;
        let bucket = costBucket.get(nodeCost);

        if (!bucket) {
            bucket = [];
            costBucket.set(nodeCost, bucket);
        }

        bucket.push(node);
    }

    function removeCostNode(node) {
        const nodeCost = node.cost;
        const bucket = costBucket.get(nodeCost);
        if (bucket.length <= 1) {
            costBucket.delete(nodeCost);
        }
        bucket.splice(bucket.indexOf(node), 1);
    }

    function addNode(itemName, parentNode = {cost: 0}) {
        if (listDone.has(itemName)) {
            return;
        }
        const cost = parentNode.cost + getCost(itemName);
        let node = listTodo.get(itemName);
        if (node) {
            if (node.cost <= cost) {
                return;
            }
            removeCostNode(node);
            node.cost = cost;
            node.parent = parentNode;
            addCostNode(node);
            return;
        }
        node = {
            cost: cost,
            name: itemName,
            item: items.get(itemName),
            parent: parentNode,
        };
        addCostNode(node);
        listTodo.set(itemName, node);
    }

    function isTarget(node) {
        return node.name === item2;
    }

    function getPath(node, list = []) {
        if (node.parent) {
            list.push(node.name);
            return getPath(node.parent, list);
        }
        return list;
    }

    addNode(item1);
    let notFinished = true;
    const result = [];
    let costLimit = Infinity;
    while(notFinished && listTodo.size) {
        const node = getNextItem();
        if (node.cost > costLimit) {
            notFinished = false;
            console.log('→', node.cost, costLimit)
        }
        if (isTarget(node)) {
            result.push(node);
            if (!Number.isFinite(costLimit)) {
                costLimit = node.cost * 30.5;
            }
            console.log(node.cost, costLimit)
        } else  if (notFinished) {
            searchNextNodes(node); // isTarget should be managed here
        }
    }

    return result.map(r => getPath(r).reverse());
}
