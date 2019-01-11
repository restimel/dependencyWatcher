
Vue.directive('focus', {
    inserted: function (el) {
        el.focus();
        setTimeout(() => {
            el.focus();
        }, 10);
    },
});
