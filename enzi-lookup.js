angular.module('enzi-lookup', [])
.controller('testEnziLookup', ['$scope', function ($scope) {
	//$scope.records = [{ Id: 1, Name: 'Test 1' }, { Id: 2, Name: 'Test 2' }, { Id: 3, Name: 'Test 3' }, { Id: 4, Name: 'Test 4' }];
	//$scope.selected = $scope.records[2];
	$scope.getdata = function (onsuccess) {
		$scope.records = [{ Id: 1, Name: 'Test 1' }, { Id: 2, Name: 'Test 2' }, { Id: 3, Name: 'Test 3' }, { Id: 4, Name: 'Test 4' }];
		$scope.selected = $scope.records[2];
		onsuccess($scope.records, $scope.selected);
	}

	$scope.onselected = function (record) {
		alert(record.Name);
	}
}])
.directive('enziLookup', function () {
    var enziLookup = {
        scope:{
            callback: '&',
            records: '='
        },
        styles: '<style>.autocomplete{position: relative;} .autocomplete input.focussed + .datalist{display:block;} .datalist{display: none;position: absolute; left: 0; top: 35px; z-index: 1000;max-height: 500px;overflow-y: scroll;} .list-group-item {min-width: 200px;} .list-group-item{}</style>',
		templateInternal: '\
            <div class="autocomplete" id="{{lookupId}}" ><input class="search form-control" placeholder="{{attrs.placeholder}}" type="text" ng-model="enziLookup.enteredtext.{{lookupId}}" ng-change="enziLookup.onChange()" ng-model-options="{ debounce : 1000 }" ng-focus="enziLookup.onfocus($event)"\
            ng-blur="enziLookup.onblur($event)" ng-keydown="enziLookup.onkeydown($event)" />\
            <div class="datalist list-group">\
            <a class="list-group-item" ng-hide="{{attrs.records}} && {{attrs.records}}.length" >No records found</a>\
            <a class="list-group-item" ng-click="enziLookup.onclick(r, $event)" id="{{r.{{attrs.key}}}}" ng-class="{active: enziLookup.selectedIndex.{{lookupId}} == $index}" href="#" \
            ng-repeat="r in {{attrs.records}} | filter:enziLookup.enteredtext.{{lookupId}} as filteredRecords" ng-mouseover="enziLookup.onitemmouseover($event, $index)" ng-mouseout="enziLookup.onitemmouseout($event)">\
            {{{{attrs.labeltemplate}}}}</a>\
            </div>\
            </div>',
        controller: ['$scope', '$filter', '$rootScope', '$attrs', '$element', '$compile', function ($scope, $filter, $rootScope, $attrs, $element, $compile) {
			var template = enziLookup.templateInternal;
			if (!$scope.enziLookup) {
				template = enziLookup.styles + enziLookup.templateInternal;
				$scope.enziLookup = {
					enteredtext: {},
					attrs: {},
					selectedIndex: {},
					setSelected: function (id, elementId) {
						if (id && $scope[$scope.enziLookup.attrs[elementId].records]) {
							var matchedRecords = $filter('filter')($scope[$scope.enziLookup.attrs[elementId].records], { Id: id }, 'strict');
							if (matchedRecords.length > 0) {
								$scope.enziLookup.enteredtext[elementId] = matchedRecords[0][$scope.enziLookup.attrs[elementId].label];
								eval('$scope.' + $scope.enziLookup.attrs[elementId].ngModel + ' = id');
							}
						}
					},
					onChange: function (event) {
					    angular.forEach($scope.enziLookup.enteredtext, function (value, key) {
					        $scope.callback({ searchText: value });
					    });
					},
					onfocus: function (event) { $(event.target).addClass('focussed'); },
					onblur: function (event) { setTimeout(function () { $(event.target).removeClass('focussed') }, 200); },
					onkeydown: function (event) {
						$(event.target).addClass('focussed');
						switch (event.keyCode) {
							//Down key
							case 40:
								var lookupId = $(event.target).parents('.autocomplete').attr('id');
								var recordCount = $filter('filter')($scope[$scope.enziLookup.attrs[lookupId].records], $scope.enziLookup.enteredtext[lookupId]).length;
								if ($scope.enziLookup.selectedIndex[lookupId] < recordCount - 1)
									++$scope.enziLookup.selectedIndex[lookupId];
								else
									$scope.enziLookup.selectedIndex[lookupId] = recordCount - 1;
								event.preventDefault();
								break;
								//Up key
							case 38:
								var lookupId = $(event.target).parents('.autocomplete').attr('id');
								var recordCount = $filter('filter')($scope[$scope.enziLookup.attrs[lookupId].records], $scope.enziLookup.enteredtext[lookupId]).length;
								if ($scope.enziLookup.selectedIndex[lookupId] > 0)
									--$scope.enziLookup.selectedIndex[lookupId];
								event.preventDefault();
								break;
								//Enter key
							case 13:
								$(event.target).removeClass('focussed');
								var lookupId = $(event.target).parents('.autocomplete').attr('id');
								var record = $filter('filter')($scope[$scope.enziLookup.attrs[lookupId].records], $scope.enziLookup.enteredtext[lookupId])[$scope.enziLookup.selectedIndex[lookupId]];
								$scope.enziLookup.setSelected(record[$scope.enziLookup.attrs[lookupId].key], lookupId);
								event.preventDefault();
								break;
						}
					},

					onclick: function (record, event) {
						event.preventDefault();
						var lookupId = $(event.target).parents('.autocomplete').attr('id');
						$scope.enziLookup.setSelected(record[$attrs.key], lookupId);
					},

					onitemmouseover: function (event, index) {
						var lookupId = $(event.target).parents('.autocomplete').attr('id');
						$scope.enziLookup.selectedIndex[lookupId] = index;
					},

					onitemmouseout: function (event) {
					},
				}
			}

			if (!$attrs.records || !$attrs.label || !$attrs.key) {
				console.error('Attributes [records, label, key] are required.');
				return;
			}

			
			angular.forEach($attrs, function (value, key) {
				var find = RegExp('{{attrs\.' + key + '}}', 'g');
				template = template.replace(find, value);
			})

			template = template.replace('{{attrs.labeltemplate}}', ($attrs.template) ? $attrs.template : 'r.' + $attrs.label);

			var lookupId = 'k' + Math.random(36).toString().substr(2, 9);
			var find = RegExp('{{lookupId}}', 'g');
			template = template.replace(find, lookupId);
			$scope.enziLookup.enteredtext[lookupId] = '';
			$scope.enziLookup.attrs[lookupId] = $attrs;
			$scope.enziLookup.selectedIndex[lookupId] = -1;

			var element = angular.element(template);
			$element.append(element);
			$compile(element)($scope);


			$scope.$watch($attrs.records, function (newValue, oldValue) {
				$scope.enziLookup.setSelected(eval('$scope.' + $attrs.ngModel), lookupId);
			}, true)

			$scope.$watch($attrs.ngModel, function (newValue, oldValue) {
				$scope.enziLookup.setSelected(newValue, lookupId);
			})

			$scope.$watch('enziLookup.enteredtext.' + lookupId + '', function (newValue, oldValue) {
				if (!newValue) {
					eval('$scope.' + $scope.enziLookup.attrs[lookupId].ngModel + ' = \'\'');
				}
			})
		}]
	}
	return enziLookup;
})