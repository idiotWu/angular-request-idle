angular.module('ng.requestIdle', [])
    .factory('Idle', ['$timeout', '$q', function($timeout, $q){
        return function Idle(duration) {
            var deferred = $q.defer();
            var end = duration + Date.now();

            var timer = $timeout(function() {
                deferred.resolve();
            }, duration);

            Object.defineProperty(this, 'remain', {
                get: function() {
                    return end - Date.now();
                }
            });

            this.promise = deferred.promise;

            this.end = function() {
                deferred.resolve();
                $timeout.cancel(timer);
            };

            this.add = function(ms) {
                ms = parseInt(ms);

                if (isNaN(ms)) throw new TypeError('expect ms to be a number, but got ' + typeof ms);

                $timeout.cancel(timer);

                end += ms;

                timer = $timeout(function() {
                    deferred.resolve();
                }, end - Date.now());
            };
        };
    }])
    .factory('TimeManager', ['Idle', function(Idle) {
        function TimeManager() {};

        TimeManager.prototype.talloc = function(duration) {
            duration = parseInt(duration);

            duration = isNaN(duration) ? -1 >>> 1 : duration;

            var idle = this.idle = new Idle(duration);

            return idle;
        };

        TimeManager.prototype.free = function() {
            this.idle && this.idle.end();
        };

        TimeManager.prototype.errorHandler = function(err) {
            this.free();
            console.error(err);
        };

        return TimeManager;
    }])
    .factory('requestIdle', ['$q', 'TimeManager', function($q, TimeManager) {
        var currentTask = typeof $q.resolve === 'function' ? $q.resolve() : $q.when();

        function requestIdle() {
            var duration, task;

            if (typeof arguments[0] === 'function') {
                task = arguments[0];
            } else {
                duration = arguments[0];
                task = arguments[1];
            }

            var tm = new TimeManager();
            var lastTask = currentTask;
            var isReleased = false;
            var discardTask = false;

            currentTask = lastTask.then(function() {
                    task = typeof task === 'function' && task;

                    var idle = tm.talloc(duration);

                    if (isReleased) {
                        if (!discardTask && task) task(idle);
                        return;
                    }

                    if (task) task(idle);

                    return idle.promise;
                })
                .catch(tm.errorHandler.bind(tm));

            currentTask.end = function(discard) {
                isReleased = true;
                discardTask = discard;

                if (lastTask.end) lastTask.end(discard);

                tm.free();
            };
        };

        requestIdle.release = function(discard) {
            currentTask.end(discard);
        };

        return requestIdle;
    }]);