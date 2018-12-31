const configuration = {
    version: '0.6.0',
    centerOnSelected: true,
    maxItemOptionsList: 50,
    workspaces: [],
    performance: false,
    performanceLog: new Map(),
    perfStart: function(label) {
        if (!this.performance) return;
        const currentTime = performance.now();
        console.time(label);
        let log = this.performanceLog.get(label);
        if (!log) {
            log = {label: label, timers: []};
            this.performanceLog.set(label, log);
        }
        if (log.timers.length % 2 === 1) {
            console.warn('Start again ' + label);
            log.timers.pop();
        }
        log.timers.push(currentTime);
    },
    perfEnd: function(label) {
        if (!this.performance) return;
        const currentTime = performance.now();
        console.timeEnd(label);
        let log = this.performanceLog.get(label);
        if (!log || log.timers % 2 === 0) {
            console.warn(label + ' not started');
            return;
        }
        log.timers.push(currentTime);
    },
    save: function() {
        localStorage.setItem('configuration', JSON.stringify({
            centerOnSelected: this.centerOnSelected,
            performance: this.performance,
            workspaces: this.workspaces,
        }));
    },
};

Object.assign(configuration, JSON.parse(localStorage.getItem('configuration')));

export default configuration;
