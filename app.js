'use strict';
import toolbar from 'toolbar.module';
import print from 'print.module';
import query from 'query.module';
import search from 'search.module';
import measure from 'measure.module';
import permalink from 'permalink.module';
import 'hscesium.module';
import info from 'info.module';
import ds from 'datasource-selector.module';
import sidebar from 'sidebar.module';
import 'add-layers.module';
import bootstrapBundle from 'bootstrap/dist/js/bootstrap.bundle';
import { Tile, Group } from 'ol/layer';
import { TileWMS, WMTS, OSM, XYZ } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import View from 'ol/View';
import { transform, transformExtent } from 'ol/proj';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import pois from 'poi';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import $ from 'jquery';

var module = angular.module('hs', [
    'hs.toolbar',
    'hs.layermanager',
    'hs.query',
    'hs.search', 'hs.print', 'hs.permalink',
    'hs.datasource_selector',
    'hs.geolocation',
    'hs.cesium',
    'hs.sidebar',
    'hs.addLayers'
]);

module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function (OlMap, Core, $compile, $timeout) {
    return {
        template: Core.hslayersNgTemplate,
        link: function (scope, element) {
            $timeout(function () {
                Core.fullScreenMap(element)
            }, 0);
        }
    };
}]);

module.directive('hs.aboutproject', function () {
    function link(scope, element, attrs) {
        scope.aboutVisible = true;
    }
    return {
        template: require('./about.html'),
        link: link
    };
});

module.directive('hs.foodiezones.infoDirective', function () {
    return {
        template: require('./info.html'),
        link: function (scope, element, attrs) {
            $('#zone-info-dialog').modal('show');
        }
    };
})

module.directive('description', ['$compile', 'hs.utils.service', function ($compile, utils) {
    return {
        template: require('./description.html'),
        scope: {
            object: '=',
            url: '@'
        },
        link: function (scope, element, attrs) {
            scope.describe = function (e, attribute) {
                if (angular.element(e.target).parent().find('table').length > 0) {
                    angular.element(e.target).parent().find('table').remove();
                } else {
                    var table = angular.element('<table class="table table-striped" description object="attribute' + Math.abs(attribute.value.hashCode()) + '" url="' + attribute.value + '"></table>');
                    angular.element(e.target).parent().append(table);
                    $compile(table)(scope.$parent);
                }
            }
            if (angular.isUndefined(scope.object) && angular.isDefined(attrs.url) && typeof attrs.url == 'string') {
                scope.object = {
                    attributes: []
                };
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <' + attrs.url + '>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        if (angular.isUndefined(response.results)) return;
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            var b = response.results.bindings[i];
                            var short_name = b.p.value;
                            if (short_name.indexOf('#') > -1)
                                short_name = short_name.split('#')[1];
                            scope.object.attributes.push({
                                short_name: short_name,
                                value: b.o.value
                            });
                            if (!scope.$$phase) scope.$apply();
                        }
                    })
            }
        }
    };
}]);

function getHostname() {
    var url = window.location.href
    var urlArr = url.split("/");
    var domain = urlArr[2];
    return urlArr[0] + "//" + domain;
};

module.value('config', {
    cesiumBase: './node_modules/cesium/Build/Cesium/',
    cesiumAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA',
    terrain_providers: [{
        title: 'Local terrain',
        url: 'http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmp1g/',
        active: false
    }, {
        title: 'EU-DEM',
        url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
        active: true
    }],
    default_layers: [
        new Tile({
            source: new OSM(),
            title: "OpenStreetMap",
            base: true,
            visible: false,
            minimumTerrainLevel: 15
        }),
        new Tile({
            title: "Corine land cover (WMS)",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/olu/european_openlandusemap.map',
                params: {
                    LAYERS: 'corine',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 9
                },
                crossOrigin: null
            }),
            minResolution: 2.388657133911758,
            path: 'Open-Land-Use Map',
            visible: false,
            opacity: 0.7
        }),
        new Tile({
            title: "Open-Land-Use (WMS)",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/olu/openlandusemap.map',
                params: {
                    LAYERS: 'olu_bbox_srid',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 15,
                    VERSION: '1.1.1',
                    CRS: 'EPSG:4326',
                    FROMCRS: 'EPSG:4326'
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/openlandusemap.map&service=WMS&request=GetLegendGraphic&layer=olu_bbox_srid&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            path: 'Open-Land-Use Map',
            visible: true,
            opacity: 0.7
        }),
        new Tile({
            title: "Yield potential Rostenice",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                params: {
                    LAYERS: 'yield_potential',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 14
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=yield_potential&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: false,
            opacity: 0.7
        }),
        new Tile({
            title: "Road segments of Open Transport Map vizualized by their average daily traffic volumes",
            source: new TileWMS({
                url: 'http://gis.lesprojekt.cz/wms/transport/open_transport_map',
                params: {
                    LAYERS: 'roads__traffic_volumes',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html",
                    minimumTerrainLevel: 12
                },
                crossOrigin: null
            }),
            legends: ['http://gis.lesprojekt.cz/wms/transport/open_transport_map?service=WMS&request=GetLegendGraphic&layer=roads__traffic_volumes&version=1.3.0&format=image/png&sld_version=1.1.0'],
            maxResolution: 8550,
            visible: false,
            opacity: 0.7
        }),
        pois.createPoiLayer()
    ],
    project_name: 'erra/map',
    datasources: [{
        title: "Datasets",
        url: "http://otn-dev.intrasoft-intl.com/otnServices-1.0/platform/ckanservices/datasets",
        language: 'eng',
        type: "ckan",
        download: true
    }, {
        title: "Services",
        url: "http://cat.ccss.cz/csw/",
        language: 'eng',
        type: "micka",
        code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
    }, {
        title: "Hub layers",
        url: "http://opentnet.eu/php/metadata/csw/",
        language: 'eng',
        type: "micka",
        code_list_url: 'http://opentnet.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
    }],
    hostname: {
        "default": {
            "title": "Default",
            "type": "default",
            "editable": false,
            "url": getHostname()
        }
    },
    'catalogue_url': "/php/metadata/csw",
    'compositions_catalogue_url': "/php/metadata/csw",
    status_manager_url: '/wwwlibs/statusmanager2/index.php',
    default_view: new View({
        center: [1208534.8815206578, 5761821.705531779],
        zoom: 16,
        units: "m"
    })
});

module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config', '$rootScope', 'hs.utils.service', '$sce',
    function ($scope, $compile, $element, Core, hs_map, config, $rootScope, utils, $sce) {
        var map;
        $scope.Core = Core;

        Core.singleDatasources = true;
        Core.panelEnabled('compositions', true);
        Core.panelEnabled('status_creator', false);
        $scope.Core.setDefaultPanel('layermanager');

        $rootScope.$on('map.loaded', function () {
            map = hs_map.map;
            map.on('moveend', extentChanged);
        });

        pois.init($scope, $compile);

        function extentChanged() {
            var bbox = map.getView().calculateExtent(map.getSize());
            //pois.getPois(map, utils, [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[2], bbox[3]], [bbox[0], bbox[3]]]);
        }

        $rootScope.$on('map.sync_center', function (e, center, bounds) {
            pois.getPois(map, utils, bounds);
        })

        function createAboutDialog() {
            var el = angular.element('<div hs.aboutproject></div>');
            document.getElementById("hs-dialog-area").appendChild(el[0]);
            $compile(el)($scope);
        }
        createAboutDialog();

        $scope.showInfo = function (entity) {
            var id, obj_type;
            if (entity.properties.poi) {
                id = entity.properties.poi.getValue();
                obj_type = 'Point of interest'
            }
            $scope.zone = {
                id: $sce.trustAsHtml(),
                attributes: [],
                links: [],
                obj_type: obj_type
            };
            describeOlu(id, function () {
                if (!$scope.$$phase) $scope.$apply();
            });
        }

        function describeOlu(id, callback) {
            var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <' + id + '>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
            $.ajax({
                url: utils.proxify(q)
            })
                .done(function (response) {
                    if (angular.isUndefined(response.results)) return;
                    for (var i = 0; i < response.results.bindings.length; i++) {
                        var b = response.results.bindings[i];
                        var short_name = b.p.value;
                        if (short_name.indexOf('#') > -1)
                            short_name = short_name.split('#')[1];
                        $scope.zone.attributes.push({
                            short_name: short_name,
                            value: b.o.value
                        });
                    }
                    getLinksTo(id, callback);
                })
        }

        function getLinksTo(id, callback) {
            var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX geof: <http://www.opengis.net/def/function/geosparql/> PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> PREFIX poi: <http://www.openvoc.eu/poi#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT * WHERE {?obj <http://www.opengis.net/ont/geosparql#hasGeometry> ?obj_geom. ?obj_geom geo:asWKT ?Coordinates . FILTER(bif:st_may_intersect (?Coordinates, ?wkt)). { SELECT ?wkt WHERE { <' + id + '> geo:hasGeometry ?geometry. ?geometry geo:asWKT ?wkt.} } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
            $.ajax({
                url: utils.proxify(q)
            })
                .done(function (response) {
                    for (var i = 0; i < response.results.bindings.length; i++) {
                        var b = response.results.bindings[i];
                        $scope.zone.links.push({
                            url: b.obj.value
                        });
                    }
                    callback();
                })
        }

        $scope.$on('infopanel.updated', function (event) { });
    }
]);

