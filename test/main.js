angular.module('app', ['ng.requestIdle'])
    .controller('trafficLightsCtrl', function($scope, requestIdle) {
        $scope.current = 'green';

        var infinite = function() {
            requestIdle(3000, function() {
                $scope.current = 'green';
            });
            requestIdle(500, function() {
                $scope.current = 'yellow';
            });
            requestIdle(3000, function() {
                $scope.current = 'red';
            });
            requestIdle(500, function() {
                $scope.current = 'yellow';
            });
            requestIdle(0, infinite);
        };

        infinite();
    });