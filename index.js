angular.module('ng.requestIdle', [])
    .factory('TimeManager', ['$timeout', '$q', function($timeout, $q) {
        function Idle(tm) {
            var deferred = $q.defer();

            this.promise = deferred.promise;

            this.end = function(v) {
                deferred.resolve(v);
                tm.free();
            };
        };

        function TimeManager(duration) {
            duration = parseInt(duration);

            this.duration = isNaN(duration) ? -1 >>> 1 : duration;
        };

        TimeManager.prototype.talloc = function() {
            var idle = new Idle(this);

            this.timer = $timeout(idle.end.bind(idle), this.duration);

            return idle;
        };

        TimeManager.prototype.free = function() {
            $timeout.cancel(this.timer);
        };

        TimeManager.prototype.errorHandler = function(err) {
            this.free();

            console.error(err);
        };

        return TimeManager;
    }])
    .factory('requestIdle', ['$q', 'TimeManager', function($q, TimeManager) {
        var lastTask = typeof $q.resolve === 'function' ? $q.resolve() : $q.when();

        return function requestIdle() {
            var duration, task;

            if (typeof arguments[0] === 'function') {
                task = arguments[0];
            } else {
                duration = arguments[0];
                task = arguments[1];
            }

            var tm = new TimeManager(duration);

            var currentTask = lastTask.then(function() {
                    var idle = tm.talloc();

                    if (typeof task === 'function') task(idle);

                    return idle.promise;
                })
                .catch(tm.errorHandler.bind(tm));

            lastTask = currentTask;

            return currentTask;
        };
    }]);