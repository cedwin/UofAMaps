/**
 * Created with JetBrains WebStorm.
 * User: Dean
 * Date: 07/08/12
 * Time: 3:26 PM
 * To change this template use File | Settings | File Templates.
 */

// Build out the Name space if it doesn't all ready exist
var UAlberta = UAlberta != undefined ? UAlberta : {};
UAlberta.Maps = UAlberta.Maps != undefined ? UAlberta.Maps : {};

// Load the google earth libraries from google
if(google) {
    google.load('earth', '1');
}

UAlberta.Maps.Exterior = function (exterior, $) {
    'use strict';
    /* A Short cut to the google maps object */
    var umeGMaps = window.google.maps,
    // If the device is a mobile phone or not. Set in the initilize function
        _isMobile = false,

        _isInitialized = false,

        _campusSelected = false,
    // The current zoom level of the map
        _zoomLevel = 15,
    // The currently selected campus
        _campus = "",
    // If currently in Interior mode
        _isInterior = false,
    // The currently active building in interior view
        _activeBuilding = "",
    // The currently active building floor in interior view
        _activeFloor = 0,
    // The height of the header portion of the site
        _headerHeight = 0,

    /*  All Constant values for the U of A Mapping application */
        _constants = {
            host_url: window.location.protocol + "//" + window.location.hostname + "/",
            image_path: '~/media/uofa2/Maps/Images/',
            pdf_path: '~/media/uofa2/Maps/pdf/',
            map_containerId: "",
            map_campusDescriptionContainerId: "",
            map_styleOptions: [
                /* Style options for the map */
                {featureType: "administrative.locality", elementType: "all", stylers: [
                    { visibility: "off" }
                ]
                },
                { featureType: "administrative.neighborhood", elementType: "all", stylers: [
                    { visibility: "off" }
                ]
                },
                { featureType: "administrative.land_parcel", elementType: "all", stylers: [
                    { visibility: "off" }
                ]
                },
                { featureType: "landscape.man_made", elementType: "all", stylers: [
                    { visibility: "off" }
                ]
                },
                { featureType: "poi", elementType: "all", stylers: [
                    { visibility: "off" }
                ]
                },
                { featureType: "poi.park", elementType: "all", stylers: [
                    { visibility: "on" }
                ]
                },
                { featureType: "water", elementType: "all", stylers: [
                    { visibility: "simplified" }
                ]
                },
                { featureType: "road.highway", elementType: "all", stylers: [
                    { saturation: -45 }
                ]
                },
                { featureType: "road.arterial", elementType: "all", stylers: [
                    { saturation: -45 }
                ]
                }
            ],
            map_options: {
                zoom: 6,
                center: new umeGMaps.LatLng(52.597528, -115.136719),
                mapTypeControlOptions: { style: umeGMaps.MapTypeControlStyle.DROPDOWN_MENU, mapTypeIds: ['uab', umeGMaps.MapTypeId.SATELLITE] },
                zoomControlOptions: { style: umeGMaps.ZoomControlStyle.SMALL, position: umeGMaps.ControlPosition.RIGHT_TOP },
                panControlOptions: { position: umeGMaps.ControlPosition.RIGHT_TOP },
                streetViewControlOptions: { position: umeGMaps.ControlPosition.RIGHT_TOP }
            },
            map_mapTypeId: 'uab',
            clusterDistance: 50, /* The distance in pixels that clustering will take affect. */
            earthOffset: 268435456, /* Half of the earth circumference in pixels at zoom level 21. */
            earthRadius: 268435456 / Math.PI, /* The radius of the earth */
            label_textSize: 20, /* The size of the labels text */
            label_textColor: '#75A57A', /* The colour of the lables text */
            label_textStrokeColor: '#005108', /* The colour of the outline for the labels text */
            label_minZoom: 7, /* The zoom level to start showing the lables */
            label_maxZoom: 14, /* The zoom level to stop showing the labels */
            label_building_textSize: 10, /* The size of the labels text */
            label_building_textColor: '#000000', /* The colour of the lables text */
            label_building_textStrokeColor: '#FFFFFF', /* The colour of the outline for the labels text */
            label_building_minZoom: 16, /* The zoom level to start showing the lables */
            label_building_maxZoom: 25, /* The zoom level to stop showing the labels */
            markers_minZoom: 0, /* The zoom level to start showing the markers */
            markers_maxZoom: 21, /* The zoom level to stop showing the markers */

            /* Configurable Options */
            showCampusLabels: true,
            showBuildingLabels: true
        },

        _quickFindIcons = {
            iconHeight: 43,
            maxIcons: 10,
            minPixelsRequired: 350,
            iconsToShow: 10,
            currentOffset: 0,
            maxOffset: 0,
            numberOfLayers: 0,

            initialize: function () {
                //Quick Finds Responsiveness - To set how many icons are visible based on browser height
                _quickFindIcons.update();

                _quickFindIcons.maxOffset = _quickFindIcons.iconHeight * _quickFindIcons.numberOfLayers;

                $("#leftNav_quickFinds_viewPort_next").click(function () {
                    _quickFindIcons.scroll(1);
                });
                $("#leftNav_quickFinds_viewPort_prev").click(function () {
                    _quickFindIcons.scroll(-1);
                });
            },

            update: function () {
                if (_isMobile) {
                    return;
                }
                var available = $(window).height() - _quickFindIcons.minPixelsRequired;

                if ($("#leftMenu_campusSelect").is(":visible")) {
                    available -= $("#leftMenu_campusSelect").height();
                }
                if (available <= _quickFindIcons.iconHeight) {
                    _quickFindIcons.iconsToShow = 1;
                } else {
                    _quickFindIcons.iconsToShow = Math.floor(available / _quickFindIcons.iconHeight);

                    if (_quickFindIcons.iconsToShow > _quickFindIcons.maxIcons) {
                        _quickFindIcons.iconsToShow = _quickFindIcons.maxIcons;
                    }
                }

                $(".leftNav_quickFinds_viewPort").css("height", (_quickFindIcons.iconsToShow * _quickFindIcons.iconHeight) + "px");

                var visibleHeight = available - 138;
                $("#leftNav_buildings").find('div.leftMenu_list_container > ul').each(function () {
                    if (this.scrollHeight > available) {
                        $(this).css("height", visibleHeight + "px");
                    }
                });

                if ($("#leftNav_searchResults > div")[0].scrollHeight > available) {
                    $("#leftNav_searchResults > div").css("height", available);
                }
            },

            scroll: function (dir) {
                //Next
                if (dir > 0) {
                    _quickFindIcons.currentOffset = _quickFindIcons.currentOffset - (_quickFindIcons.iconsToShow * _quickFindIcons.iconHeight);
                }
                //Previous
                else if (dir < 0) {
                    _quickFindIcons.currentOffset = _quickFindIcons.currentOffset + (_quickFindIcons.iconsToShow * _quickFindIcons.iconHeight);
                }
                if (_quickFindIcons.currentOffset <= _quickFindIcons.maxOffset * -1) {
                    _quickFindIcons.currentOffset = 0;
                }

                if (_quickFindIcons.currentOffset > _quickFindIcons.iconHeight) {
                    var diff = _quickFindIcons.numberOfLayers % _quickFindIcons.iconsToShow;
                    if (diff == 0) {
                        diff = _quickFindIcons.iconsToShow;
                    }
                    _quickFindIcons.currentOffset = (_quickFindIcons.maxOffset - (diff * _quickFindIcons.iconHeight)) * -1;
                }

                $(".leftNav_quickFinds_icons").children().animate({ top: _quickFindIcons.currentOffset }, 400);

            }
        },

        _map = null,

        _googleEarth = null,

        _browserDetection = {
            //Supported browser versions as per Googles docs for their maps API
            minIE: 7,
            minFireFox: 3,
            minSafari: 4,
            minChrome: 0,

            unsupportedMessage: "Hold on. It looks like you might have an older version of your web browser. Be sure to use the latest version to enjoy all the features on the UAlberta map.",

            isBrowserSupportedMaps: function () {
                //Browser detection based on googles recomendations. Feature detection would be better but not supported by the maps API yet
                return !(($.browser.msie && $.browser.version < _browserDetection.minIE) ||
                    ($.browser.mozilla && $.browser.version < _browserDetection.minFireFox));
            },

            isBrowserSupportedInterior: function () {
                var elem = document.createElement('canvas');
                return !!(elem.getContext && elem.getContext('2d'));
            }
        },

        _cities = {
            

        },

        _layers = {

            layerList: [],


            addNewLayer: function (category, flag, options) {
                if (_isMobile) {
                    for (var i = 0; i < _layers.layerList.length; i++) {
                        var l = _layers.layerList[i];
                        if (l.key == "campus_outlines" || l.key == "building_outlines" || l.key == "search_results" || l.key == options.layerKey) {
                            continue;
                        }
                        _layers.removeLayer(l.key);
                        $(".quickFinds_icons > li > a").each(function () {
                            $(this).attr("class", $(this).attr("class").replace("_active", ""));
                        });
                    }
                    $("#f_quickFinds_select").hide();
                    $("#footer_quickFinds").removeClass("btn_selected");
                }
                _dataLoader.loadJSONObject(category, flag, options);
                _analytics.itemClick("quick_finds", options.layerKey);
            },

            createLayer: function (options) {
                var newLayer = {};
                newLayer.key = options.layerKey ? options.layerKey : "newLayer_" + new Date().getTime();
                newLayer.displayName = options.displayName ? options.displayName : "New Layer";
                newLayer.url = "";
                newLayer.delay = options.delay ? options.delay : 0;
                newLayer.display = options.display != undefined ? options.display : true;
                newLayer.creationDate = Math.round(new Date().getTime() / 1000);
                newLayer.useCluster = options.useCluster != undefined ? options.useCluster : true;
                newLayer.titleAsDesc = options.titleAsDesc != undefined ? options.titleAsDesc : false;
                newLayer.markerScale = options.markerScale ? options.markerScale : new umeGMaps.Size(24, 24);
                newLayer.markers = new Array();
                newLayer.masterMarkerList = new Array();
                newLayer.clusteredMarkers = new Array();
                newLayer.cloneMarkers = function () {
                    var len = this.masterMarkerList.length;
                    var newList = new Array();
                    while (len--) {
                        var oM = this.masterMarkerList[len];
                        var m = new umeGMaps.Marker({ position: oM.getPosition(), icon: oM.getIcon(), flat: oM.getFlat() });
                        m.layerKey = this.key;
                        m.markerKey = oM.markerKey;
                        m.display = oM.display;
                        m.description = oM.description;
                        m.actionId = oM.actionId;
                        if (oM.infoWindow != null) {
                            m.infoWindow = new InfoBubble({ content: oM.infoWindow.getContent(), maxWidth: 755 });
                        }
                        newList.push(m);
                    }
                    return newList;
                };
                newLayer.lineList = new Array();
                newLayer.polyList = new Array();
                newLayer.overlayList = new Array();
                newLayer.legend = options.legend ? options.legend : [];
                newLayer.runMarkerUpdate = options.runMarkerUpdate != undefined ? options.runMarkerUpdate : true;
                newLayer.googleKML = null;
                newLayer.labels = new Array();

                return newLayer;
            },

            addLayer: function (layer) {
                var index = -1;
                for (var i = _layers.layerList.length - 1; i >= 0; i--) {
                    if (_layers.layerList[i].key == layer.key) {
                        index = i;
                        break;
                    }
                }
                if (index == -1)
                    _layers.layerList.push(layer);
                else
                    _layers.layerList[index] = layer;
            },

            removeLayer: function (layerKey) {
                var toRemove = _layers.getLayer(layerKey);
                if (toRemove) {
                    _layers.hideLayer(toRemove);
                    toRemove.masterMarkerList = [];
                    toRemove.markers = [];
                    toRemove.clusteredMarkers = [];
                    toRemove.lineList = [];
                    toRemove.polyList = [];
                    toRemove.overlayList = [];
                    var layerIndex = -1;
                    for (var i = _layers.layerList.length - 1; i >= 0; i--) {
                        if (_layers.layerList[i].key == layerKey) {
                            layerIndex = i;
                            break;
                        }
                    }
                    if (layerIndex >= 0) {
                        _layers.layerList.splice(layerIndex, 1);
                    }
                }
            },

            getLayer: function (key) {
                for (var x = _layers.layerList.length - 1; x >= 0; x--) {
                    if (_layers.layerList[x].key == key) {
                        return _layers.layerList[x];
                    }
                }
                return null;
            },

            toggleLegened: function (show, layer) {
                if (layer.legend.length == 0 || (show && $('#' + layer.key + '_legend').length > 0)) {
                    return;
                }
                if (show) {
                    var html = "<div id='" + layer.key + "_legend' class='item_legend'><ul>";
                    for (var i = 0; i < layer.legend.length; i++) {
                        html += "<li><img src='" + _constants.host_url + layer.legend[i].icon + "' height='24px' width='24px' alt='" + layer.legend[i].displayName + "' /> " + layer.legend[i].displayName + "</li>";
                    }
                    html += "</ul></div>";
                    $("#legended").append(html);
                    if ($("#legended").find("li").length > 1) {
                        $("#legended").show();
                    }
                }
                else {
                    $('#' + layer.key + '_legend').remove();
                    if ($("#legended").find("li").length <= 1) {
                        $("#legended").hide();
                    }
                }
            },

            displayLayer: function (layer, skipCluster) {
                if (_isInterior) {

                    return;
                }
                layer.display = true;
                _layers.toggleLegened(true, layer);
                if (layer.googleKML != null) {
                    layer.googleKML.setMap(_map);
                }
                else {
                    if (!skipCluster) {
                        _cluster.clusterMarkers(layer);
                    }

                    var bounds = _map.getBounds(), i;

                    for (i = layer.clusteredMarkers.length - 1; i >= 0; i--) {
                        if (bounds.contains(layer.clusteredMarkers[i].center) && !layer.clusteredMarkers[i].display) {
                            layer.clusteredMarkers[i].centerMarker.setMap(_map);
                            layer.clusteredMarkers[i].display = true;
                            umeGMaps.event.addListener(layer.clusteredMarkers[i].centerMarker, 'click', function (event) {
                                var layer = _layers.getLayer(this.layerKey);
                                var clusterItem = _cluster.getClusterItem(layer, this.markerKey);
                                if (clusterItem != null) {
                                    _layers.hideInfoWindows();
                                    _cluster.dimLayer();
                                    _cluster.unclusterCluster(clusterItem, layer, layer.displayName, event);
                                }
                            });
                        }
                    }
                    for (i = layer.markers.length - 1; i >= 0; i--) {
                        if (bounds.contains(layer.markers[i].getPosition()) && !layer.markers[i].display) {
                            layer.markers[i].setMap(_map);
                            layer.markers[i].display = true;
                            umeGMaps.event.addListener(layer.markers[i], 'click', function () {
                                _layers.hideInfoWindows();
                                if (this.infoWindow != null) {
                                    this.infoWindow.open(_map, this);
                                }
                                else if (this.description != "") {
                                    this.infoWindow = new InfoBubble({ content: this.description, maxWidth: 500 });
                                    this.infoWindow.open(_map, this);
                                }
                            });
                        }
                    }
                    for (i = layer.lineList.length - 1; i >= 0; i--) {
                        layer.lineList[i].setMap(_map);
                    }
                    for (i = layer.polyList.length - 1; i >= 0; i--) {
                        layer.polyList[i].setMap(_map);
                        if (layer.polyList[i].label) {
                            layer.polyList[i].label.setMap(_map);
                        }
                    }
                    for (i = layer.overlayList.length - 1; i >= 0; i--) {
                        layer.overlayList[i].setMap(_map);
                    }
                    for (i = layer.labels.length - 1; i >= 0; i--) {
                        layer.labels[i].setMap(_map);
                    }
                }
            },

            hideLayer: function (layer) {
                layer.display = false;
                _layers.toggleLegened(false, layer);
                if (layer.googleKML != null) {
                    layer.googleKML.setMap(null);
                }
                var mapType = _map.getMapTypeId(), i;
                for (i = layer.markers.length - 1; i >= 0; i--) {
                    layer.markers[i].setMap(null);
                    if (layer.markers[i].infoWindow != null) {
                        layer.markers[i].infoWindow.close();
                    }
                }
                for (i = layer.clusteredMarkers.length - 1; i >= 0; i--) {
                    layer.clusteredMarkers[i].centerMarker.setMap(null);
                }
                for (i = layer.lineList.length - 1; i >= 0; i--) {
                    layer.lineList[i].setMap(null);
                }
                for (i = layer.polyList.length - 1; i >= 0; i--) {
                    layer.polyList[i].setMap(null);
                    if (layer.polyList[i].label) {
                        layer.polyList[i].label.setMap(null);
                    }
                }
                for (i = layer.overlayList.length - 1; i >= 0; i--) {
                    layer.overlayList[i].setMap(null);
                }
                for (i = layer.labels.length - 1; i >= 0; i--) {
                    layer.labels[i].setMap(null);
                }
                if (_googleEarth != null && mapType == 'GoogleEarthAPI') {
                    _googleEarth.refreshEarth();
                }
            },

            hideInfoWindows: function () {
                for (var i = _layers.layerList.length - 1; i >= 0; i--) {
                    var x = 0, layer = _layers.layerList[i];
                    for (x = layer.markers.length - 1; x >= 0; x--) {
                        if (layer.markers[x].infoWindow != null) {
                            layer.markers[x].infoWindow.close();
                        }
                    }
                    for (x = layer.polyList.length - 1; x >= 0; x--) {
                        if (layer.polyList[x].infoWindow) {
                            layer.polyList[x].infoWindow.close();
                        }
                    }
                }
            },

            toggleLayer: function (layer) {
                var cssClass = "leftNav_quickLinks_" + layer.key;
                if (layer.display) {
                    _layers.hideLayer(layer);
                    $("." + cssClass + "_active").attr("class", cssClass);
                } else {
                    _layers.displayLayer(layer, false);
                    $("." + cssClass).attr("class", cssClass + "_active");
                }
            },

            layerUpdate: function () {
                var zoomChange = false;
                if (_zoomLevel != _map.getZoom()) {
                    zoomChange = true;
                    _zoomLevel = _map.getZoom();
                }

                for (var l = _layers.layerList.length - 1; l >= 0; l--) {
                    if (!_layers.layerList[l].runMarkerUpdate) {
                        continue;
                    }
                    if (_layers.layerList[l].display) {
                        var ignoreCluster = true;
                        if (zoomChange) {
                            ignoreCluster = false;
                            this.hideLayer(_layers.layerList[l]);
                        }
                        if (_zoomLevel > _constants.markers_minZoom && _zoomLevel < _constants.markers_maxZoom) {
                            this.displayLayer(_layers.layerList[l], ignoreCluster);
                        }
                    }
                }

                if (zoomChange) {
                    _campuses.processLabels();
                    _cities.render();

                    if(_zoomLevel == 20){

                        $.ajax({
                            type: "POST",
                            url: window.location.protocol + "//" + window.location.hostname + "static/css/maps/img/fun.txt",
                            dataType: "json",
                            contentType: "application/json",
                            timeout: _dataLoader.timeout,
                            success: function (data) {
                                _dataLoader.ajaxSuccess(data, {layerKey:"creators",useCluster:false,markerScale:new umeGMaps.Size(30, 30)});
                            },
                            error: function () {}
                        });
                    }
                    else{
                        _layers.removeLayer("creators");
                    }
                }
            },

            updateInfoWindow: function (name, link) {
                var item = $(".bubbleContainer_content");
                if(item.is(":visible")){
                    $(".bubbleContainer_options_info_active").attr("class", "bubbleContainer_options_info");
                    item.hide();    
                    infowindow.update($(".bubbleContainer_header").height() + 20);
                } else {
                    $(".bubbleContainer_options_info").attr("class", "bubbleContainer_options_info_active");
                    item.show();
                    // item.css("height")
                    infowindow.update(item.height() + $(".bubbleContainer_header").height() + 20);
                }
                
            }
        },

        _cluster = {

            clusterMarkers: function (layer) {
                if (layer.display == false)
                    return;

                var singleMarkers = new Array();
                var clustered = new Array();
                var markers = layer.cloneMarkers(); //Get a clone of the markers in the layer

                while (markers.length) {
                    var marker = markers.pop();
                    var markerPos = marker.getPosition();
                    var cluster = new Array();

                    var i = markers.length;
                    var markerIconUrl = marker.getIcon().url;
                    // Compare the marker to all the remaining markers
                    if (layer.useCluster) {
                        while (i--) {
                            var targetPos = markers[i].getPosition();
                            var pixels = _cluster.pixelDistance(markerPos.lat(), markerPos.lng(), targetPos.lat(), targetPos.lng(), _map.getZoom());
                            var iconUrl = markers[i].getIcon().url;

                            if (_constants.clusterDistance > pixels && markerIconUrl == iconUrl) {
                                cluster.push(markers[i]);
                                markers.splice(i, 1);
                            }
                        }
                    }

                    if (cluster.length > 0) {
                        cluster.push(marker);
                        var clusterCenter = _cluster.getCenterOfCluster(cluster);
                        //Scale the icon up depending on the size of the cluster
                        var scale = 24;
                        var numberMarkers = cluster.length;
                        if (numberMarkers <= 5) {
                            scale = 28;
                        }
                        else if (numberMarkers > 5 && numberMarkers <= 10) {
                            scale = 32;
                        }
                        else if (numberMarkers > 10 && numberMarkers <= 20) {
                            scale = 36;
                        }
                        else if (numberMarkers > 20 && numberMarkers <= 50) {
                            scale = 40;
                        }
                        else if (numberMarkers > 50 && numberMarkers <= 100) {
                            scale = 44;
                        }
                        else if (numberMarkers > 100) {
                            scale = 48;
                        }
                        var centerMarker = new umeGMaps.Marker({ position: clusterCenter, icon: { url: markerIconUrl, size: new umeGMaps.Size(scale, scale), scaledSize: new umeGMaps.Size(scale, scale) }, flat: true });
                        centerMarker.markerKey = clustered.length;
                        centerMarker.layerKey = layer.key;
                        clustered.push({ markers: cluster, center: clusterCenter, centerMarker: centerMarker, display: false });
                    }
                    else {
                        singleMarkers.push(marker);
                    }
                }

                layer.markers = singleMarkers;
                layer.clusteredMarkers = clustered;
            },

            pixelDistance: function (lat1, lon1, lat2, lon2, zoom) {
                var x1 = _cluster.lonToX(lon1);
                var y1 = _cluster.latToY(lat1);

                var x2 = _cluster.lonToX(lon2);
                var y2 = _cluster.latToY(lat2);

                return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2)) >> (21 - zoom);
            },

            lonToX: function (lon) {
                return Math.round(_constants.earthOffset - _constants.earthRadius * lon * Math.PI / 180);
            },

            latToY: function (lat) {
                return Math.round(_constants.earthOffset - _constants.earthRadius * Math.log((1 + Math.sin(lat * Math.PI / 180)) / (1 - Math.sin(lat * Math.PI / 180))) / 2);
            },

            getCenterOfCluster: function (cluster) {
                var tLat = 0;
                var tLon = 0;
                for (var i = cluster.length - 1; i >= 0; i--) {
                    var pos = cluster[i].getPosition();
                    tLat += pos.lat();
                    tLon += pos.lng();
                }

                tLat = tLat / cluster.length;
                tLon = tLon / cluster.length;

                return new umeGMaps.LatLng(tLat, tLon);
            },

            getClusterItem: function (layer, clusterKey) {
                if (layer != null) {
                    if (layer.clusteredMarkers[clusterKey])
                        return layer.clusteredMarkers[clusterKey];
                }
                return null;
            },

            unclusterCluster: function (cluster, layer, serviceName) {
                var html = "";
                for (var i = cluster.markers.length - 1; i >= 0; i--) {
                    html += "<div class='ums_cluserData_panel_item'>" + cluster.markers[i].description + "</div><hr class='ums_cluserData_panel_hr' />";
                }
                $("#cluster_box_content").html(html);
                $("#cluster_box_heading > span").html(serviceName + " ( " + cluster.markers.length + " )");
            },

            dimLayer: function () {
                $("#campus_select_dimmer").show();
                $("#campus_select").hide();
                $("#cluster_box").show();
            },

            removeDimLayer: function () {
                $("#campus_select_dimmer").hide();
            }

        },

        _directions = {
            directionsDisplay: new umeGMaps.DirectionsRenderer(),
            directionsService: new umeGMaps.DirectionsService(),
            travelMode: umeGMaps.TravelMode.WALKING,

            initialize: function () {
                //Auto Complete
                $('input#directionsA').autocomplete({
                    source: _directions.autoComplete,
                    select: _directions.autoCompleteClick
                });
                $('input#directionsB').autocomplete({
                    source: _directions.autoComplete,
                    select: _directions.autoCompleteClick
                });

                $('input#directionsA').keyup(function (evt) {
                    if (evt.keyCode == 13) {
                        evt.preventDefault();
                        _directions.processDirections();
                        return false;
                    }
                    $('input#directionsA_position').val('');
                });
                $('input#directionsB').keyup(function (evt) {
                    if (evt.keyCode == 13) {
                        evt.preventDefault();
                        _directions.processDirections();
                        return false;
                    }
                    $('input#directionsB_position').val('');
                });

                //Directions Clear
                $("#directionsClear").click(function () {
                    _directions.clearDirections();
                });
            },

            processDirections: function () {
                var start = $('#directionsA').val();
                var end = $('#directionsB').val();
                var startPos = $('#directionsA_position').val();
                var endPos = $('#directionsB_position').val();
                if (startPos != "") {
                    start = startPos;
                }
                if (endPos != "") {
                    end = endPos;
                }

                if (start != "" && end != "") {
                    var request = {
                        origin: start,
                        destination: end,
                        travelMode: _directions.travelMode
                    };

                    _directions.directionsService.route(request, function (result, status) {
                        if (status == umeGMaps.DirectionsStatus.OK) {
                            _directions.directionsDisplay.setMap(_map);
                            _directions.directionsDisplay.setDirections(result);
                            if (_directions.travelMode == umeGMaps.TravelMode.DRIVING) {
                                _directions.directionsDisplay.setPanel($("#leftNav_directions_panel")[0]);
                            }
                        }
                    });
                    if (_isMobile) {
                        $("#footer_directions").click();
                    }

                    _analytics.itemClick("directions", _directions.travelMode == umeGMaps.TravelMode.DRIVING ? "driving" : _directions.travelMode == umeGMaps.TravelMode.WALKING ? "walking" : "biking");
                }
            },

            clearDirections: function () {
                _directions.directionsDisplay.setMap(null);
                _directions.directionsDisplay.setPanel(null);
                $('input#directionsA').val('');
                $('input#directionsB').val('');
                $('input#directionsA_position').val('');
                $('input#directionsB_position').val('');
            },

            toggleTravelMode: function (type, button) {
                if (type == 'car') {
                    _directions.travelMode = umeGMaps.TravelMode.DRIVING;
                } else if (type == 'walking') {
                    _directions.travelMode = umeGMaps.TravelMode.WALKING;
                    _directions.directionsDisplay.setPanel(null);
                } else if (type == 'bicycling') {
                    _directions.travelMode = umeGMaps.TravelMode.BICYCLING;
                    _directions.directionsDisplay.setPanel(null);
                }

                _directions.processDirections();
                $(".map_directions_type").each(function () {
                    $(this).removeClass('selected');
                });
                $(button).parent().addClass('selected');
            },

            setDestination: function (buidlingName) {
                var buildname = data_cache.lookup(buidlingName).displayName;
                var building = {"Building":{"Key":buidlingName, "name":buildname}};
                Waypoint.addPoint(building);
                $( "#progressPopup" ).text('Added building to the route');
                $( "#progressPopup" ).popup( 'open' );
                setTimeout(function(){$( "#progressPopup" ).popup( 'close' )}, 1300);
                //setTimeout(function(){infowindow.close()}, 1301);
                infowindow.close();
                //console.log(Waypoint.list);

                updateCreatePathFieldFrom("building");
            },

            setWaypointDestination: function (lat, lng) {
                var coord = {"Coord":{"lat":lat,"lng":lng}};
                Waypoint.addPoint(coord);
                //console.log(Waypoint.list);
                $( "#progressPopup" ).text('Added destination to the route');
                $( "#progressPopup" ).popup( 'open' );
                setTimeout(function(){$( "#progressPopup" ).popup( 'close' )}, 1300);
                //setTimeout(function(){infowindow.close()}, 1301);
                infowindow.close();
                updateCreatePathFieldFrom("waypoint");


            },

            //starting waypoint functionality not currently used -- March 27/13
            setStartingWaypoint: function(lat, lng) {
                var coord = {"Coord":{"lat":lat,"lng":lng}};
                Waypoint.destinationFrom(coord);
                //console.log(Waypoint.list);
                $( "#progressPopup" ).text('Added starting waypoint to the route');
                $( "#progressPopup" ).popup( 'open' );
                setTimeout(function(){$( "#progressPopup" ).popup( 'close' )}, 1300);
                //setTimeout(function(){infowindow.close()}, 1301);
                infowindow.close();
                updateCreatePathFieldFrom("start");




            },

            //ending waypoint functionality not currently used -- March 27/13
            setEndingWaypoint: function(lat, lng) {
                var coord = {"Coord":{"lat":lat,"lng":lng}};
                Waypoint.destinationTo(coord);
                //console.log(Waypoint.list);
                $( "#progressPopup" ).text('Added ending waypoint to the route');
                $( "#progressPopup" ).popup( 'open' );
                setTimeout(function(){$( "#progressPopup" ).popup( 'close' )}, 1300);
                //setTimeout(function(){infowindow.close()}, 1301);
                infowindow.close();
                updateCreatePathFieldFrom("end");
            },
		

            setMarkerDestination: function (display, lat, lng) {
                var coord = {"Coord":{"lat":lat,"lng":lng}};
                Waypoint.addPoint(coord);
                //console.log(Waypoint.list);
                $( "#progressPopup" ).text('Added destination to the route');
                $( "#progressPopup" ).popup( 'open' );
                setTimeout(function(){$( "#progressPopup" ).popup( 'close' )}, 1300);
                //setTimeout(function(){infowindow.close()}, 1301);
                infowindow.close();
                updateCreatePathFieldFrom("waypoint");
            },

            autoComplete: function (term, responce) {
                var numberOfResults = 6;
                var res = new Array();
                _layers.buildingLinks.sortKeys();
                for (var i = 0; i < _layers.buildingLinks.length(); i++) {
                    var data = _layers.buildingLinks.lookup(_layers.buildingLinks.lookupKey(i)),
                        ll = data.position.lat + "," + data.position.lng;
                    if (term.term.length < 2) {
                        if (data.displayName.toLowerCase().indexOf(term.term.toLowerCase()) == 0) {
                            res.push({ label: data.displayName, value: ll });
                        }
                    }
                    else {
                        if (data.displayName.toLowerCase().indexOf(term.term.toLowerCase()) != -1) {
                            res.push({ label: data.displayName, value: ll });
                        }
                    }
                    if (res.length == numberOfResults) {
                        break;
                    }
                }
                responce(res);
            },

            autoCompleteClick: function (event, ui) {
                var id = $(this).attr("id");
                $('#' + id).val(ui.item.label);
                $('#' + id + '_position').val(ui.item.value);
                return false;
            },

            generateLink: function () {
                var link = generateLink(false);
                var a = encodeURIComponent($('#directionsA').val()),
                    b = encodeURIComponent($('#directionsB').val()),
                    aPos = encodeURIComponent($('#directionsA_position').val()),
                    bPos = encodeURIComponent($('#directionsB_position').val());

                link += "&dirA=" + a + "&dirB=" + b + "&dirAPos=" + aPos + "&dirBPos=" + bPos + "&travel=" + _directions.travelMode;
                $('#directionsLinkBox').show().css({ "width": "0", "height": "0", "margin-left": "10px" });
                $('#directionsLinkBox').animate({
                    width: "220px",
                    height: "50px"
                }, 400);
                $('#directionsLinkBox > input').val(link);
            }
        },

        _dataLoader = {

            activeLoadingBars: [],

            //The URL to the web service to load the data from
            hostUrl: window.location.protocol + "//" + window.location.hostname + "/WebService/Maps/UWSDataService.asmx/GetExteriorData",

            timeout: 30000,

            toggleLoadingBar: function (show, name) {
                var id = name.replace(/ /g, "_").replace(/'/g, "").replace("(", "").replace(")", "") + "_loadingBar";
                if (show) {
                    _dataLoader.activeLoadingBars.push(name);
                    $("#loading_bar_area").append("<div id='" + id + "' style='display: none;' class='loading_bar'><img src='~/media/uofa2/Maps/Images/arrow-loader.gif' /> Loading the " + name + " Layer.</div>");
                    $("#" + id).fadeIn("slow");
                } else {
                    $("#" + id).fadeOut("slow", function () {
                        $("#" + id).remove();
                    });
                    _dataLoader.activeLoadingBars.splice($.inArray(name, _dataLoader.activeLoadingBars), 1);
                }
            },

            toggleErrorBar: function () {
                $('#error_bar').fadeIn('medium', function () {
                    setTimeout(function () {
                        $('#error_bar').fadeOut("medium");
                    }, 5000);
                });
            },

            loadJSONObject: function (category, flag, options) {

                if (options.layerKey != "building_outlines") {
                    var layer = _layers.getLayer(options.layerKey);
                    if (layer != null) {
                        _layers.toggleLayer(layer);
                        return;
                    }
                } else {
                    _layers.removeLayer("building_outlines");
                }

                _dataLoader.toggleLoadingBar(true, options.displayName);
                $.ajax({
                    type: "POST",
                    url: _dataLoader.hostUrl,
                    dataType: "json",
                    contentType: "application/json",
                    timeout: _dataLoader.timeout,
                    data: _dataLoader.toJSON({ category: category, flag: flag, interior: _isInterior, buildingKey: _activeBuilding, floor: _activeFloor, isMobile: _isMobile }),
                    success: function (data) {
                        _dataLoader.ajaxSuccess(data, options);
                        if (options.layerKey == "building_outlines") {
                            if (_campusSelected) {
                                $("#buildingList_" + _campus).click();
                            }
                        }
                    },
                    error: function () {
                        _dataLoader.ajaxError(options.displayName);
                    }
                });
            },

            //Converts a javascript object into a JSON string
            toJSON: function (obj) {
                var JSON;
                if (JSON && JSON.stringify) {
                    return "{ \"parameters\":" + JSON.stringify(obj) + "}";
                }
                else {
                    return "{ \"parameters\":" + $.toJSON(obj) + "}";
                }
            },

            ajaxSuccess: function (data, options) {
                //Make sure data is not null and the data object has our results
                if (!data && !data.d) {
                    _dataLoader.toggleLoadingBar(false, options.displayName);
                    _dataLoader.toggleErrorBar();
                    return;
                }
                data = data.d;
                //Make sure the data type is what we are expecting
                if (!data.__type && data.__type != "UAlberta.WebService.Maps.Data.InteriorReturn") {
                    _dataLoader.toggleLoadingBar(false, options.displayName);
                    _dataLoader.toggleErrorBar();
                    return;
                }

                var layer = _layers.createLayer(options), newBuildingLinks = new Dictionary();

                var i = 0;

                //Markers
                if (data.Markers) {
                    for (i = 0; i < data.Markers.length; i++) {
                        var marker = data.Markers[i],
                            iconImage = _constants.host_url + marker.IconUrl,
                            clickable = false,
                            infoWindow = null;

                        if (marker.Description != "") {
                            clickable = true;
                        }

                        var newMarker = new umeGMaps.Marker({ position: new umeGMaps.LatLng(marker.Coords.lat, marker.Coords.lng), icon: { url: iconImage, scaledSize: layer.markerScale }, flat: true, clickable: clickable });
                        newMarker.layerKey = layer.key;
                        newMarker.markerKey = layer.masterMarkerList.length;
                        newMarker.display = false;
                        newMarker.description = marker.Description;
                        newMarker.infoWindow = infoWindow;
                        layer.masterMarkerList.push(newMarker);
                    }
                }

                //Lines
                if (data.Lines) {
                    for (i = 0; i < data.Lines.length; i++) {
                        var line = data.Lines[i], path = [];
                        path.push(new umeGMaps.LatLng(line.Start.lat, line.Start.lng));
                        path.push(new umeGMaps.LatLng(line.End.lat, line.End.lng));
                        var o = line.Transparency / 255;
                        layer.lineList.push(new umeGMaps.Polyline({ clickable: false, path: path, strokeWeight: line.Width, strokeColor: "#" + line.Color, strokeOpacity: o }));
                    }
                }

                //Poly Lines
                if (data.PolyLines) {
                    for (i = 0; i < data.PolyLines.length; i++) {
                        var polyLine = data.PolyLines[i], path = [];
                        for (var x = 0; x < polyLine.Path.length; x++) {
                            path.push(new umeGMaps.LatLng(polyLine.Path[x].lat, polyLine.Path[x].lng));
                        }

                        if (path.length > 0) {
                            var o = polyLine.LineTransparency / 255;
                            layer.lineList.push(new umeGMaps.Polyline({ clickable: false, path: path, strokeWeight: polyLine.LineWidth, strokeColor: "#" + polyLine.LineColor, strokeOpacity: o }));
                        }
                    }
                }

                //Polygons
                if (data.Polys) {
                    for (i = 0; i < data.Polys.length; i++) {
                        var poly = data.Polys[i], path = [];
                        for (var x = 0; x < poly.Path.length; x++) {
                            path.push(new umeGMaps.LatLng(poly.Path[x].lat, poly.Path[x].lng));
                        }

                        if (path.length > 0) {
                            var lo = poly.LineTransparency / 255,
                                fo = poly.PolyTransparency / 255;
                            var pol = new umeGMaps.Polygon({ paths: path, strokeWeight: poly.LineWidth, fillColor: "#" + poly.PolyColor, fillOpacity: fo, strokeColor: "#" + poly.LineColor, strokeOpacity: lo });
                            pol.infoWindow = null;

                            if (poly.Description != "" || (layer.titleAsDesc && poly.Name != "")) {
                                pol.description = poly.Description != "" ? poly.Description : "<div class='ums_bubble_container clearfix'><div class='description-container'><h1>" + poly.Name + "</h1></div></div>";
                                pol.layer = layer;
                                pol.name = poly.Name;

                                umeGMaps.event.addListener(pol, 'click', function (event) {
                                    _layers.hideInfoWindows();
                                    var point = null;
                                    if (event) {
                                        point = event.latLng;
                                    }
                                    if (this.infoWindow == null) {
                                        this.infoWindow = new InfoBubble({ content: this.description, shawdowStyle: 1 });
                                        var data = _layers.buildingLinks.lookup(this.buildingKey);
                                        if (data) {
                                            data.infoWindow = this.infoWindow;
                                        }
                                    }
                                    this.infoWindow.setPosition(point);
                                    this.infoWindow.open(_map);
                                });
                            }

                            //Do Building Key and Former Name Lists
                            if (poly.BuildingKey && poly.Campus && poly.PolyCenter) {
                                pol.buildingKey = poly.BuildingKey;
                                pol.PolyCenter = poly.PolyCenter;
                                pol.Campus = poly.Campus;
                                if (newBuildingLinks.containsKey(poly.Campus)) {
                                    newBuildingLinks.lookup(poly.Campus).add(poly.BuildingKey, { campus: poly.Campus, displayName: poly.Name, buildingKey: poly.BuildingKey, formerName: poly.FormerName, infoWindow: pol.infoWindow, position: pol.PolyCenter, levels: poly.levels });
                                } else {
                                    var building = new Dictionary();
                                    building.add(poly.BuildingKey, { campus: poly.Campus, buildingKey: poly.BuildingKey, displayName: poly.Name, formerName: poly.FormerName, infoWindow: pol.infoWindow, position: pol.PolyCenter, levels: poly.levels });
                                    newBuildingLinks.add(poly.Campus, building);
                                }
                            }

                            layer.polyList.push(pol);
                        }
                    }
                }


                //Labels
                if (data.Labels) {
                    for (i = 0; i < data.Labels.length; i++) {
                        var label = data.Labels[i];
                        layer.labels.push(new MapLabel({
                            text: label.Name,
                            position: new umeGMaps.LatLng(label.Coords.lat, label.Coords.lng),
                            origin: new umeGMaps.LatLng(label.Coords.lat, label.Coords.lng),
                            fontSize: _constants.label_building_textSize,
                            fontColor: _constants.label_building_textColor,
                            strokeColor: _constants.label_building_textStrokeColor,
                            minZoom: _constants.label_building_minZoom,
                            maxZoom: _constants.label_building_maxZoom,
                            className: "ums_mapBuildingLabel",
                            id: ("bl_" + label.Coords.lat + "" + label.Coords.lng).replace(/\./g, "").replace(/-/g, ""),
                            ismobile: _isMobile
                        }));
                    }
                }

                _layers.addLayer(layer);

                if (layer.display) {
                    _layers.displayLayer(layer, false);
                    $("." + "leftNav_quickLinks_" + layer.key).attr("class", "leftNav_quickLinks_" + layer.key + "_active");
                }

                _dataLoader.addBuildingLinks(newBuildingLinks);

                _dataLoader.toggleLoadingBar(false, options.displayName);
            },

            ajaxError: function (name) {
                _dataLoader.toggleLoadingBar(false, name);
                _dataLoader.toggleErrorBar();
            },

            addBuildingLinks: function (linkList) {
                if (linkList.length() == 0) {
                    return;
                }
                var divID = _isMobile ? "#f_buildings_select" : "#leftNav_buildings";
                for (var i = 0; i < linkList.length(); i++) {
                    var campusKey = linkList.lookupKey(i), data = linkList.lookup(campusKey), list = "";
                    if (!_isMobile) {
                        list = "<li><span><a href='javascript:void(0);' class='buildingList collapsed' id='buildingList_" + campusKey.replace(" ", "_").replace("-", "_").toLowerCase() + "'>" + linkList.lookupKey(i) + "</a></span><div class='leftMenu_list_container'><ul style='display:none;'>";
                    }

                    for (var x = 0; x < data.length(); x++) {
                        var key = data.lookupKey(x), building = data.lookup(key);
                        list += "<li><a href='javascript:void(0);' onclick='UAlberta.Maps.Exterior.focusBuilding(\"" + building.buildingKey + "\");'>" + building.displayName + "</a></li>";
                        _layers.buildingLinks.add(key, building);
                    }

                    if (!_isMobile) {
                        list += "</ul></div></li>";
                        $(divID + " > ul").append(list);
                    } else {
                        $(divID + " > ul").html(list);
                    }

                }
                if (!_isMobile) {
                    $(".buildingList").click(function () {
                        $(divID).find(".buildingList").not(this).removeClass("expanded").addClass("collapsed").parent().parent().find('> div > ul').slideUp("fast");
                        $(this).toggleClass("expanded").toggleClass("collapsed").parent().parent().find('> div > ul').slideToggle("fast", function () {
                            var available = $(window).height() - _quickFindIcons.minPixelsRequired;
                            var visibleHeight = available - 138;
                            if (this.scrollHeight > available) {
                                $(this).css("height", visibleHeight + "px");
                            }
                        });
                    });
                }
            }
        },

        _interior = {
            /*    launchInterior:
             *    This has been re built to handle our own interface better.
             *    It creates and updates the two floor selectors (mobile and desktop) 
             *    It also calls our own API call function getInteriorData from mapping.js
             *
             */

            launchInterior: function (buildingKey, startingLevel, extrudeName, subpath) {

                if(!startingLevel) {
                    startingLevel = 1;
                }
                getInteriorData(buildingKey, startingLevel, subpath);
                mobile = $(window).width() < 800;
                var building = data_cache.lookup(buildingKey);
                 $("[id^=interior_popup]").hide();
                // if (mobile) {
                    $("#floor_sel").empty();
                    var class_sel = "";
                    $.each(building.levels, function(index, floor) {
                        if(startingLevel == floor.FloorNumber) {
                            class_sel = 'ui-btn-active';
                            $('#floor_selector_dropdown h2 span .ui-btn-text').text(floor.displayName);
                        } else {
                            class_sel = "";
                        }
                        var name = "floor-item-"+index;
                        var nameRadio = "floor-choice-"+index;
                        var item = "<li id='"+name+"' data-mini='true' class='"+class_sel+"'' data-corners=\"false\" data-theme='a'><a>"+floor.displayName +"</a></li>";
                        $("#floor_sel").append(item);
                        $("#"+name).click(function(){
                            $( "[id^=floor-item]" ).removeClass('ui-btn-active');
                            getInteriorData(buildingKey, floor.FloorNumber);
                            $("#"+name).addClass('ui-btn-active');
                            $('#floor_selector_dropdown h2 span .ui-btn-text').text(floor.displayName);
                            $('#'+nameRadio).trigger('click');
                            $.each($("fieldset#floor_selector_field  input[type='radio']"), function(i, value) {
                                if(value.name == nameRadio) {
                                    $( '#'+value.name ).attr("checked", true);
                                } else {
                                    $( '#'+value.name ).attr("checked", false);
                                }                          
                                $( "#"+value.name ).checkboxradio().checkboxradio("refresh");
                            });
                        });
                    });
                    $("#floor_sel").trigger('create');
                    $("#floor_sel").listview('refresh');
                // } else {
                    $("fieldset#floor_selector_field").empty();
                    $.each(building.levels, function(index, floor) {
                        var name = "floor-choice-"+index;
                        var nameDrop = "floor-item-"+index;
                        $("fieldset#floor_selector_field").append('<input type="radio" name="'+name+'" id="'+name+'" value="'+floor.FloorNumber+'" >');
                        $("fieldset#floor_selector_field").append('<label for="'+name+'">'+floor.displayName +'</label>');
                        $("#"+name).bind( "change", function(event, ui) {
                            getInteriorData( buildingKey, $(this).val() );
                            $.each($("fieldset#floor_selector_field  input[type='radio']"), function(index, value) {
                                if(value.name != name) {
                                    $( '#'+value.name ).attr("checked", false);
                                    $( "#"+value.name ).checkboxradio().checkboxradio("refresh");
                                }                          
                            });
                            $( "[id^=floor-item]" ).removeClass('ui-btn-active');
                            $("#"+nameDrop).addClass('ui-btn-active');
                            $('#floor_selector_dropdown h2 span .ui-btn-text').text(floor.displayName);
                        });
                        $( "#"+name ).checkboxradio().checkboxradio("refresh");
                    });   
                    $.each($("fieldset#floor_selector_field  input[type='radio']"), function(index, value) {
                            if(value.value == startingLevel) {
                                $( '#'+value.name ).attr("checked", true);
                                $( "#"+value.name ).checkboxradio().checkboxradio("refresh");
                            }                          
                        });
                    $( "#radio-choice-0" ).attr("checked", true);
                    $( "#radio-choice-0" ).checkboxradio().checkboxradio("refresh");
                    $( "#floor_selector" ).trigger('create');
            },

            switchBuilding: function (buildingKey) {
                _activeBuilding = buildingKey;
                _activeFloor = 1;
                var data = _layers.buildingLinks.lookup(buildingKey),
                    dispName = data ? data.displayName : buildingKey.toUpperCase();
                UAlberta.Maps.Interior.clearCanvas();
                UAlberta.Maps.Interior.updateInstance();
                UAlberta.Maps.Interior.importBuildingData(buildingKey, "1", dispName, true);
                _interior.addLevels(buildingKey);
                $("#interior_conrtols_floorSelector > ul > li > a").removeClass("active");
                $("#floor_1").addClass("active");
                if (_isMobile) {
                    $("#f_interiorBuildings").hide();
                    $("#footer_interior > a").removeClass("btn_selected");
                    $("#interior_selectedBuilding").html(dispName).parent().show();
                    $("#footer_floor").html("Floor 1");
                } else {
                    $("#leftNav_selectedBuilding").html(dispName);
                }
                $("#interior_popup_contContain").parent().remove();
            },

            addLevels: function (buildingKey) {
                $("#interior_conrtols_floorSelector > ul").html("");
                var data = _layers.buildingLinks.lookup(buildingKey);
                for (var i = 0; i < data.levels.length; i++) {
                    $("#interior_conrtols_floorSelector > ul").append("<li><a id='floor_" + data.levels[i].FloorNumber + "' href='javascript:void(0);' onclick='UAlberta.Maps.Exterior.switchLevel( \"" + buildingKey + "\", \"" + data.levels[i].FloorNumber + "\");'>" + data.levels[i].displayName + "</a></li>");
                }
            },

            switchLevel: function (buildingKey, level) {
                _activeBuilding = buildingKey;
                _activeFloor = level;
                var data = _layers.buildingLinks.lookup(buildingKey);
                UAlberta.Maps.Interior.clearCanvas();
                UAlberta.Maps.Interior.updateInstance();
                UAlberta.Maps.Interior.importBuildingData(buildingKey, level.toString(), data.displayName, false);
                $("#interior_conrtols_floorSelector > ul > li > a").removeClass("active");
                $("#floor_" + level).addClass("active");
                if (_isMobile) {
                    $("#interior_conrtols_floorSelector").hide();
                    $("#footer_interior > a").removeClass("btn_selected");
                    $("#footer_floor").html("Floor " + level.toString().replace("-", "B"));
                }
                $("#interior_popup_contContain").parent().remove();
                _analytics.itemClick(data.campus + "_" + buildingKey + "_switchLevel", "floor_" + level);
            },

            closeInterior: function () {
                _analytics.itemClick(_activeBuilding + "_close", "close_interior");
                UAlberta.Maps.Interior.clearCanvas();
                $("#interior_canvas").hide();
                $("#map_canvas").show();
                focusBuilding(_activeBuilding, true);
                _isInterior = false;
                _activeBuilding = "";
                _activeFloor = 0;
                if (_isMobile) {
                    $("#footer_interior").hide();
                    $("#footer_exterior").show();
                    $("#interior_selectedBuilding").html("").parent().hide();
                    $(".clearSearch").show();
                } else {
                    $("#leftMenu").show();
                    $("#leftMenu_collapse").parent().css("left", 301);
                    $("#leftMenu_collapse").parent().removeClass("leftMenu_expand").addClass("leftMenu_collapse");
                    $("#leftMenu_interior").hide();
                    if ($(".item_legend").length > 1) {
                        $("#legended").show();
                    } else if ($(".item_legend").length == 1) {
                        if ($(".item_legend > ul > li").length > 1) {
                            $("#legended").show();
                        }
                    }
                }
                $("#interior_controls").hide();
                $("#interior_popup_contContain").parent().remove();
            }
        },

        _search = {

            hostUrl: window.location.protocol + "//" + window.location.hostname + "/WebService/Maps/UWSDataService.asmx/SearchMap",

            ajaxRequests: [],

            minCharacters: 3,

            requestInProgress: false,

            changeSinceLastRequest: false,

            displayAfterRequest: false,

            results: [],

            initialize: function () {
                $("#txtSearchTerms").keyup(function (evt) {
                    evt.preventDefault();
                    if (evt.keyCode == 13) {
                        if (_search.requestInProgress) {
                            for (var i = 0; i < _search.ajaxRequests.length; i++) {
                                _search.ajaxRequests[i].abort();
                            }
                            _search.ajaxRequests = [];
                        }
                        _search.displayAfterRequest = true;
                        _search.processSearch($("#txtSearchTerms").val());
                        return false;
                    }
                    else if (evt.keyCode > 8 && evt.keyCode <= 45) {
                        return false;
                    }
                    _search.processSearch($("#txtSearchTerms").val());
                    return false;
                });

                $("#btnSearch").click(function (evt) {
                    evt.preventDefault();
                    if (_search.requestInProgress) {
                        for (var i = 0; i < _search.ajaxRequests.length; i++) {
                            _search.ajaxRequests[i].abort();
                        }
                        _search.ajaxRequests = [];
                    }
                    _search.displayAfterRequest = true;
                    _search.processSearch($("#txtSearchTerms").val());
                    return false;
                });
            },

            processSearch: function (term) {
                $("#instantSearchResults > ul").html("");
                if (term.length < _search.minCharacters || !_campusSelected) {
                    _search.results = [];
                    $("#instantSearchResults").hide();
                    return;
                }

                //Building Search (done locally)
                var buildingMatches = [], terms = term.split(" ");

                for (var i = _layers.buildingLinks.length() - 1; i >= 0; i--) {
                    var key = _layers.buildingLinks.lookupKey(i), data = _layers.buildingLinks.lookup(key);

                    for (var z = 0; z < terms.length; z++) {
                        var contFormerName = data.formerName.toLowerCase().indexOf(jQuery.trim(terms[z].toLowerCase())) != -1;
                        if (data.displayName.toLowerCase().indexOf(jQuery.trim(terms[z].toLowerCase())) != -1 || contFormerName) {
                            var disp = data.displayName;
                            if (contFormerName) {
                                disp += "<span class='buildingFormerName'>Formerly " + data.formerName + "</span>";
                            }
                            buildingMatches.push({
                                display: disp,
                                type: "b",
                                parent: data.buildingKey
                            });
                            break;
                        }
                    }
                }

                if (buildingMatches.length > 0) {
                    buildingMatches = buildingMatches.splice(0, 10);
                    buildingMatches.sort(function (a, b) { return a.display - b.display; });
                    var html = "";
                    for (var x = buildingMatches.length - 1; x >= 0; x--) {
                        html += "<li><a href='javascript:void(0);' onclick='UAlberta.Maps.Exterior.searchResultClick(\"" + buildingMatches[x].type + "\",\"" + buildingMatches[x].parent + "\")'>" + buildingMatches[x].display + "</a></li>"
                    }
                    $("#instantSearchResults > ul").append(html);
                }

                $("#instantSearchResults > ul").append("<li id='searchLoading'><img src='~/media/uofa2/Maps/Images/search-loader.gif' /></li>");
                $("#instantSearchResults").show();
                $("#search_noResults").remove();

                //Layer and Room search (hits up server)
                if (!_search.requestInProgress) {
                    _search.loadSearch(term);
                    _search.changeSinceLastRequest = false;
                } else {
                    _search.changeSinceLastRequest = true;
                }
            },

            loadSearch: function (term) {
                _search.requestInProgress = true;
                _search.ajaxRequests.push($.ajax({
                    type: "POST",
                    url: _search.hostUrl,
                    dataType: "json",
                    contentType: "application/json",
                    timeout: _dataLoader.timeout,
                    data: _dataLoader.toJSON({ term: term, interior: _isInterior, buildingKey: _activeBuilding, floor: _activeFloor }),
                    success: function (data) {
                        _search.ajaxSuccess(data);
                    },
                    error: function () {
                    },
                    complete: function () {
                        _search.requestInProgress = false;
                        if (_search.changeSinceLastRequest) {
                            _search.processSearch($("#txtSearchTerms").val());
                        }
                    }
                }));
            },

            ajaxSuccess: function (data) {
                //Make sure data is not null and the data object has our results
                if (!data && !data.d) {
                    return;
                }
                data = data.d;
                //Make sure the data type is what we are expecting
                if (!data.__type && data.__type != "UAlberta.WebService.Maps.Data.SearchReturn") {
                    return;
                }
                $("#searchLoading").remove();
                _search.results = data.results;

                var html = "";
                for (var i = 0; i < _search.results.length; i++) {
                    var id = _search.results[i].type != "r" ? '"' + _search.results[i].action + '"' : "",
                        action = _search.results[i].type != "r" ? '"' + _search.results[i].action + '"' : _search.results[i].action;
                    html += "<li class='searchResult_item'><a href='javascript:void(0);' id='" + id + "' onclick='UAlberta.Maps.Exterior.searchResultClick(\"" + _search.results[i].type + "\",\"" + _search.results[i].parent + "\"," + action + ", true);'>" + _search.results[i].display + "</a></li>"
                }

                if (_search.results.length == 0 && $("#instantSearchResults > ul").html() == "") {
                    html += "<li id='search_noResults'>No Results Found</li>"
                }

                $("#instantSearchResults > ul").append(html);
                $("#instantSearchResults").show();

                if ($("#instantSearchResults > ul").height() > $("#instantSearchResults").height()) {
                    $("#instantSearchResults").css({ "overflow-y": "auto" });
                }

                if (_search.displayAfterRequest) {
                    _search.displayResults();
                    _search.displayAfterRequest = false;
                }
            },

            ajaxError: function () {
                $("#instantSearchResults").html("").hide();
                _dataLoader.toggleErrorBar();
            },

            resultClick: function (type, parent, action, instant) {
                switch (type) {
                    case "b":
                        if (_isInterior) {
                            _interior.closeInterior();
                        }
                        focusBuilding(parent);
                        break;
                    case "l":
                        if (instant) {
                            var curLayer = _layers.getLayer("search_results");
                            if (curLayer != null) {
                                _search.clearResults(false);
                            }
                        }
                        for (var i = 0; i < _search.results.length; i++) {
                            var res = _search.results[i];
                            if (res.type == type && res.parent == parent && res.action == action) {
                                var sLayer = _layers.getLayer("search_results");
                                if (sLayer) {
                                    for (var x = sLayer.markers.length - 1; x >= 0; x--) {
                                        var mark = sLayer.markers[x];
                                        if (mark.actionId == action) {
                                            umeGMaps.event.trigger(mark, 'click');
                                            break;
                                        }
                                    }
                                } else {
                                    _search.displayResults(action);
                                    sLayer = _layers.getLayer("search_results");
                                    if (sLayer && sLayer.markers.length > 0) {
                                        umeGMaps.event.trigger(sLayer.markers[0], 'click');
                                    }
                                }
                                break;
                            }
                        }
                        break;
                    case "r":
                        focusBuilding(parent);
                        UAlberta.Maps.Interior.clearCanvas();
                        _interior.launchInterior(parent, action.floor, action.name);
                        break;
                    default:
                        //TODO: Log error with search result click that has no process
                        break;
                }
                $("#instantSearchResults").hide();
            },

            displayResults: function (action) {
                if (_search.results.length == 0) {
                    return;
                }
                var curLayer = _layers.getLayer("search_results");
                if (curLayer != null) {
                    _search.clearResults(false);
                }
                var nLayer = _layers.createLayer({ layerKey: "search_results", displayName: "Search Results", useCluster: false, display: true });
                for (var i = 0; i < _search.results.length; i++) {

                    if (_search.results[i].type == "l") {
                        if (action != undefined) {
                            if (action != _search.results[i].action) {
                                continue;
                            }
                        }

                        var marker = _search.results[i].Marker,
                            iconImage = _constants.host_url + marker.IconUrl,
                            clickable = false,
                            infoWindow = null;

                        if (marker.Description != "") {
                            clickable = true;
                        }

                        var newMarker = new umeGMaps.Marker({ position: new umeGMaps.LatLng(marker.Coords.lat, marker.Coords.lng), icon: { url: iconImage, scaledSize: nLayer.markerScale }, flat: true, clickable: clickable });
                        newMarker.layerKey = nLayer.key;
                        newMarker.markerKey = nLayer.masterMarkerList.length;
                        newMarker.display = false;
                        newMarker.description = marker.Description;
                        newMarker.infoWindow = infoWindow;
                        newMarker.actionId = _search.results[i].action;
                        nLayer.masterMarkerList.push(newMarker);
                    }
                }
                if (nLayer.masterMarkerList.length > 0) {
                    _layers.addLayer(nLayer);
                    _layers.displayLayer(nLayer, false);
                }

                if (_isMobile) {
                    $("<a href='javascript:void(0);'class='clearSearch'><i></i>Clear Results</a>").appendTo("#form1");
                    $(".clearSearch").click(function () {
                        _search.clearResults(true);
                    });
                } else {
                    $("#searchLoading").hide();
                    $("#instantSearchResults, #leftNav_quickFinds, #leftNav_buildings, #leftNav_directions, #interior_conrtols_floorSelector").hide();
                    $("#leftMenu .btn-group > a, #leftMenu_interior .btn-group > a").removeClass("btn_selected");
                    if (action == undefined) {
                        $("#leftNav_searchResults > div").html($("#instantSearchResults").html().replace(/, true\)/g, ", false)"));
                    } else {
                        $("#leftNav_searchResults > div").html($("#" + action).parent().html());
                    }
                    $("#leftNav_interior_searchResults > div").html($("#leftNav_searchResults > div").html());
                    $("#leftNav_interior_searchResults").show();
                    $("#leftNav_searchResults").show();
                }
            },

            hideResults: function () {
                $("#leftNav_searchResults > div, #leftNav_interior_searchResults > div").hide();
                $("#leftNav_searchResults_link, #leftNav_interior_searchResults_link").addClass("collapsed");
                $("#interior_conrtols_floorSelector,#leftNav_quickFinds").show();
                $("#leftNav_searchResults_link,#leftNav_interior_searchResults_link").click(function () {
                    $("#instantSearchResults, #leftNav_quickFinds, #leftNav_buildings, #leftNav_directions, #interior_conrtols_floorSelector").hide();
                    $("#leftMenu .btn-group > a, #leftMenu_interior .btn-group > a").removeClass("btn_selected");
                    $("#leftNav_searchResults > div, #leftNav_interior_searchResults > div").show();
                    $("#leftNav_searchResults_link, #leftNav_interior_searchResults_link").removeClass("collapsed");
                });
            },

            clearResults: function (clearResults) {
                if (clearResults) {
                    _search.results = [];
                }
                if (_isMobile) {
                    $(".clearSearch").remove();
                }
                else {
                    $("#leftNav_searchResults > div, #leftNav_interior_searchResults > div").html("");
                    $("#leftNav_searchResults, #leftNav_interior_searchResults").hide();
                    $("#leftNav_buildings, #interior_conrtols_floorSelector").show();
                    $("#leftNav_buildings_btn, #leftNav_floors_btn_int").addClass("btn_selected");
                }
                _layers.removeLayer("search_results");
                $("#txtSearchTerms").val("");
            }
        },

        _urlParameterFunctions = {

            regesterEvent: function (mapEvent, callBack, close) {
                umeGMaps.event.addListenerOnce(_map, mapEvent, callBack);
                if (close) {
                    $("#campus_select_close").click();
                }
            },

            setMapCenter: function (center) {
                _map.setCenter(center);
            },

            setMapZoom: function (zoom) {
                _map.setZoom(zoom);
            },

            setCampus: function (campus) {
                if (_isMobile) {
                    $("#" + campus).click();
                }
            },

            addEventMarker: function (lat, lng, loc, content) {
                var p = new umeGMaps.LatLng(lat, lng),
                    m = new umeGMaps.Marker({ map: _map, position: p, flat: true, clickable: true, icon: { url: _constants.host_url + _constants.image_path + "Icons/icon_events.png"} });
                umeGMaps.event.addListener(m, 'click', function () {
                    if (this.infoWindow != null) {
                        this.infoWindow.open(_map, this);
                    }
                    else {
                        this.infoWindow = new InfoBubble({ content: content, maxWidth: 755 });
                        this.infoWindow.open(_map, this);
                    }
                });
                centerMap(p, 16);
                $('#directionsB').val(loc);
                $('#directionsB_position').val(lat + "," + lng);
                $('#leftNav_directions_btn').click();
            },

            addGeneralMarker: function (lat, lng, title) {
                var p = new umeGMaps.LatLng(lat, lng),
                    m = new umeGMaps.Marker({ map: _map, position: p, title: title });
                umeGMaps.event.addListener(m, 'click', function () {
                    if (this.infoWindow != null) {
                        this.infoWindow.open(_map, this);
                    }
                    else {
                        this.infoWindow = new InfoBubble({ content: "<div class='bubbleContainer_layer clearfix'><h2>" + title + "</h2></div>", maxWidth: 755 });
                        this.infoWindow.open(_map, this);
                    }
                });
                centerMap(p, 16);
            },

            setUpDirections: function (a, b, aPos, bPos, t) {
                $('#directionsA').val(a);
                $('#directionsB').val(b);
                $('#directionsA_position').val(aPos);
                $('#directionsB_position').val(bPos);
                _directions.travelMode = t;
                _directions.processDirections();

                if (!_isMobile) {
                    $('#leftNav_directions_btn').click();
                }
            }
        },

        _print = {

            printMap: function () {
                window.open(generateLink(false) + "&print=1", "print", "location=0,height=800,width=740,status=1,toolbar=1,menubar=1,scrollbars=1,resizable=1");
                _analytics.itemClick(_campus + "_general", "print");
            },

            createPrintablePage: function () {
                $('#map_canvas').height(700).width(700).css({ 'position': 'absolute', 'top': '50px', 'margin': '20px', 'float': 'none', 'border': '1px solid #444444' }).appendTo('body');
                $('#form1').hide();
                $('<a href=\"javascript:void(0)\" class=\"btn\" onclick=\"window.print();\">Print</a>').appendTo('body').css({ 'position': 'absolute', 'top': '20px', 'left': '674px' });
                $('<img src="static/css/custom/maps/img/print-logo.png" alt="University of Alberta" />').appendTo('body').css({ 'position': 'absolute', 'top': '10px', 'left': '20px' });
                $(window).unbind('resize');
                umeGMaps.event.trigger(_map, 'resize');
            }
        },

        _analytics = {

            itemClick: function (parent, item) {
                _gaq.push(['default._trackEvent', parent.replace(/_/g," ").toLowerCase(), item.replace(/_/g," ").toLowerCase(), '', 0, false]);
            }
        };


    function elementSizeUpdate() {
        var bHeight = $(window).height() - _headerHeight,
            bWidth = $('body').width();
        if (!_isMobile) {
            $("#leftMenu").css("height", bHeight - 42);
            $("#leftMenu_interior").css("height", bHeight - 42);
            _quickFindIcons.update();
            $("#leftNav_directions_panel").css("max-height", bHeight - 450);
        }
        $("#instantSearchResults").css({ "max-height": bHeight });
        $("#campus_select_dimmer").css({ "height": bHeight, "width": bWidth });
        $("#map_canvas").css({ "height": bHeight, "width": bWidth });
        $("#interior_canvas").attr("height", bHeight).attr("width", bWidth);
        if (_isInterior) {
            UAlberta.Maps.Interior.updateInstance();
            UAlberta.Maps.Interior.render();
        }
        umeGMaps.event.trigger('resize');
    }

    function closeOpenWindows() {
        $("#campus_select_dimmer").hide();
        $("#instantSearchResults").hide();
        $(".header_quicklinks_popup").hide();
        if (_isMobile) {
            $("#f_campus_select, #f_quickFinds_select, #f_buildings_select, #f_directions, #f_interiorBuildings, #f_legend, #interior_conrtols_floorSelector").hide();
            $("#footer_exterior").find("a").removeClass("btn_selected");
            $("#footer_interior").find("a").removeClass("btn_selected");
        }
    }

    function initialize(mapContainerId, isMobile, numberOfLayers) {
        _constants.map_containerId = mapContainerId;
        _isMobile = isMobile;
        _quickFindIcons.numberOfLayers = numberOfLayers;

        if (!_browserDetection.isBrowserSupportedMaps()) {
            displayMessage(_browserDetection.unsupportedMessage);
        }

        _headerHeight = $(".header").height();

        if (window.orientation != undefined) {
            $(window).bind('orientationchange', function (evt) {
                evt.preventDefault();
                elementSizeUpdate();
            });
        }
        else {
            $(window).resize(function () {
                elementSizeUpdate();
            });
        }
        elementSizeUpdate();


        //Custom Map Style
        var styledMapOptions = { name: "UAlberta" };
        var uabMapType = new umeGMaps.StyledMapType(_constants.map_styleOptions, styledMapOptions);

        if (_isMobile) {
            _constants.map_options.zoomControlOptions.position = umeGMaps.ControlPosition.LEFT_TOP;
            _constants.map_options.streetViewControl = false;
            _constants.map_options.panControl = false;
            _constants.label_building_minZoom = 17;
        }

        //Map Object
        _map = new umeGMaps.Map(document.getElementById(_constants.map_containerId), _constants.map_options);
        _map.mapTypes.set(_constants.map_mapTypeId, uabMapType);
        _map.setMapTypeId(_constants.map_mapTypeId);

        //Earth Object (if installed)
        if (window.google.earth.isSupported() && window.google.earth.isInstalled()) {
            _googleEarth = new GoogleEarth(_map);
        }

        //Map Events
        umeGMaps.event.addListener(_map, 'bounds_changed', function () { _layers.layerUpdate(); });
        umeGMaps.event.addListener(_map, 'click', function () { closeOpenWindows(); });

        //Dim Layer Evnets
        $("#cluster_box").click(function (evt) { evt.stopPropagation(); });
        $("#campus_select").click(function (evt) { evt.stopPropagation(); });

        if (_isMobile) {
            //Exterior Footer
            $("#footer_campus").click(function () {
                $("#f_campus_select").slideToggle("fast", function () { if ($("#f_campus_select").is(":visible")) $("#footer_campus").addClass("btn_selected"); });
                $("#f_quickFinds_select, #f_buildings_select, #f_directions").hide();
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });
            $("#footer_quickFinds").click(function () {
                $("#f_quickFinds_select").slideToggle("fast", function () { if ($("#f_quickFinds_select").is(":visible")) $("#footer_quickFinds").addClass("btn_selected"); });
                $("#f_campus_select, #f_buildings_select, #f_directions").hide();
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });
            $("#footer_buildings").click(function () {
                $("#f_buildings_select").slideToggle("fast", function () { if ($("#f_buildings_select").is(":visible")) $("#footer_buildings").addClass("btn_selected"); });
                $("#f_campus_select, #f_quickFinds_select, #f_directions").hide();
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });
            $("#footer_directions").click(function () {
                $("#f_directions").slideToggle("fast", function () { if ($("#f_directions").is(":visible")) $("#footer_directions").addClass("btn_selected"); });
                $("#f_campus_select, #f_quickFinds_select, #f_buildings_select").hide();
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });

            //Interior Footer
            $("#footer_floor").click(function () {
                $("#interior_conrtols_floorSelector").slideToggle("fast", function () { if ($("#interior_conrtols_floorSelector").is(":visible")) $("#footer_floor").addClass("btn_selected"); });
                $("#f_interiorBuildings, #f_legend").hide();
                $("#footer_interior").find("a").removeClass("btn_selected");
            });
            $("#footer_legend").click(function () {
                $("#f_legend").slideToggle("fast", function () { if ($("#f_legend").is(":visible")) $("#footer_legend").addClass("btn_selected"); });
                $("#f_interiorBuildings, #interior_conrtols_floorSelector").hide();
                $("#footer_interior").find("a").removeClass("btn_selected");
            });
            $("#footer_interiorBuildings").click(function () {
                $("#f_interiorBuildings").slideToggle("fast", function () { if ($("#f_interiorBuildings").is(":visible")) $("#footer_interiorBuildings").addClass("btn_selected"); });
                $("#f_legend, #interior_conrtols_floorSelector").hide();
                $("#footer_interior").find("a").removeClass("btn_selected");
            });
            $("#footer_exit").click(function () {
                _interior.closeInterior();
                $("#f_interiorBuildings, #f_legend, #interior_conrtols_floorSelector").hide();
                $("#footer_interior").find("a").removeClass("btn_selected");
            });

            //Menu Minimizers
            $("#f_campus_select_min").click(function () {
                $("#f_campus_select").slideToggle("fast");
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });
            $("#f_quickFinds_select_min").click(function () {
                $("#f_quickFinds_select").slideToggle("fast");
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });
            $("#f_buildings_select_min").click(function () {
                $("#f_buildings_select").slideToggle("fast");
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });
            $("#f_directions_min").click(function () {
                $("#f_directions").slideToggle("fast");
                $("#footer_exterior").find("a").removeClass("btn_selected");
            });
            $("#interior_conrtols_floorSelector_min").click(function () {
                $("#interior_conrtols_floorSelector").slideToggle("fast");
                $("#footer_interior").find("a").removeClass("btn_selected");
            });
            $("#f_legend_min").click(function () {
                $("#f_legend").slideToggle("fast");
                $("#footer_interior").find("a").removeClass("btn_selected");
            });
            $("#f_interiorBuildings_min").click(function () {
                $("#f_interiorBuildings").slideToggle("fast");
                $("#footer_interior").find("a").removeClass("btn_selected");
            });
        }
        else {
            //add listener for street view visible change
            var streetView = _map.getStreetView();
            umeGMaps.event.addListener(streetView, 'visible_changed', function () {
                if (_isInitialized && _campusSelected) {
                    var leftMenuVisible = $("#leftMenu_collapse").parent().is(":visible");
                    if (streetView.getVisible()) {
                        if (leftMenuVisible) {
                            $("#leftMenu, .leftMenu_collapse_wrapper").hide();
                        }
                        else {
                            $(".leftMenu_collapse_wrapper").hide();
                        }
                    }
                    else {
                        if (!leftMenuVisible) {
                            $("#leftMenu, .leftMenu_collapse_wrapper").show();
                        }
                        else {
                            $(".leftMenu_collapse_wrapper").show();
                        }
                    }
                }
            });

            //Left Nav Campus Collapse/Expand
            $("#leftNav_selectedCampus").click(function () {
                $("#leftMenu_campusSelect").slideToggle("medium", function () {
                    elementSizeUpdate();
                });
                $("#leftNav_selectedCampus").toggleClass("expanded").toggleClass("collapsed");
            });

            //Left Nav Tab Selectors
            $("#leftNav_quickFinds_btn").click(function () {
                _search.hideResults();
                $("#leftNav_quickFinds").fadeIn('slow');
                $("#leftNav_buildings,#leftNav_directions").hide();
                $("#leftMenu .btn-group > a").removeClass("btn_selected");
                $("#leftNav_quickFinds_btn").addClass("btn_selected");
            });

            $("#leftNav_buildings_btn").click(function () {
                _search.hideResults();
                $("#leftNav_quickFinds,#leftNav_directions").hide();
                $("#leftNav_buildings").fadeIn('slow');
                $("#leftMenu .btn-group > a").removeClass("btn_selected");
                $("#leftNav_buildings_btn").addClass("btn_selected");
            });

            $("#leftNav_directions_btn").click(function () {
                _search.hideResults();
                $("#leftNav_quickFinds,#leftNav_buildings").hide();
                $("#leftNav_directions").fadeIn('slow');
                $("#leftMenu .btn-group > a").removeClass("btn_selected");
                $("#leftNav_directions_btn").addClass("btn_selected");
            });

            //Interior Tabs
            //$("#leftNav_quickFinds_btn_int").click(function () {
            //    $("#leftNav_quickFinds_int").fadeIn('slow');
            //    $("#interior_conrtols_floorSelector").hide();
            //    $("#leftMenu_interior .btn-group > a").removeClass("btn_selected");
            //    $("#leftNav_quickFinds_btn_int").addClass("btn_selected");
            //});

            $("#leftNav_floors_btn_int").click(function () {
                _search.hideResults();
                $("#interior_conrtols_floorSelector").fadeIn('slow');
                //$("#leftNav_quickFinds_int").hide();
                $("#leftMenu_interior .btn-group > a").removeClass("btn_selected");
                $("#leftNav_floors_btn_int").addClass("btn_selected");
            });

            $("#leftNav_exit_btn").click(function () {
                _interior.closeInterior();
            });

            //Left Nav Building (interior) Collapse/Expand
            $("#leftNav_selectedBuilding").click(function () {
                $("#leftNav_interiorBuildingList").slideToggle("medium", function () {
                });
                $("#leftNav_selectedBuilding").toggleClass("expanded").toggleClass("collapsed");
            });


            //Collapse Button for the left menu
            $("#leftMenu_collapse").click(function () {
                if ($("#leftMenu").is(":hidden") && !_isInterior) {
                    $("#leftMenu").show('slide', { direction: 'left' }, 400);
                    $("#leftMenu_collapse").parent().animate({ left: '+=301' }, 400);
                    $("#legended").animate({ left: '+=301' }, 400);
                }
                else if ($("#leftMenu_interior").is(":hidden") && _isInterior) {
                    $("#leftMenu_interior").show('slide', { direction: 'left' }, 400);
                    $("#leftMenu_collapse").parent().animate({ left: '+=301' }, 400);
                    $("#legended").animate({ left: '+=301' }, 400);
                }
                else {
                    if (!_isInterior)
                        $("#leftMenu").hide('slide', { direction: 'left' }, 400);
                    else
                        $("#leftMenu_interior").hide('slide', { direction: 'left' }, 400);
                    $("#leftMenu_collapse").parent().animate({ left: '-=301' }, 400);
                    $("#legended").animate({ left: '-=301' }, 400);
                }
                $("#leftMenu_collapse").parent().toggleClass("leftMenu_collapse").toggleClass("leftMenu_expand");
            });

            //Search results clear button
            $("#search_clear, #search_clear_int").click(function () {
                _search.clearResults(true);
            });

            //Initialize all of the quick find area functionality
            _quickFindIcons.initialize();
        }

        //Add Click event for close button on cluster box
        $("#campus_select_close").click(function () {
            $("#campus_select_dimmer").hide();
        });

        $("#cluster_box_close").click(_cluster.removeDimLayer);

        //Interior Exit Button
        $("#interior_conrtols_exit > a").click(_interior.closeInterior);

        //Cities
        _cities.initialize();

        //Campus Select Options
        _campuses.initialize();

        //Initialize the directions functionality
        _directions.initialize();

        if (_browserDetection.isBrowserSupportedInterior()) {
            //Initialize the interior view
            UAlberta.Maps.Interior.initialise("interior_canvas", { isMobile: isMobile, defaultCameraRotation: 120, defaultCameraPitch: 35, defaultCameraRoll: 0, maxFPS: 30 });
        }

        //Initialize the search
        _search.initialize();

        //Key Press functionality
        $(document).keypress(processKeyPress);

        //Maps is initialized
        _isInitialized = true;

    }

    function processKeyPress(evt) {
        var evt = (evt) ? evt : ((event) ? event : null);
        if (evt.keyCode == 13) { evt.preventDefault(); return false; }
        if (evt.keyCode == 27) { evt.preventDefault(); closeOpenWindows(); return false; }
        return true;
    }

    function centerMap(location, newZoom) {
        _map.setCenter(location);
        _map.setZoom(newZoom);

        if (_googleEarth != null && _map.getMapTypeId() == 'GoogleEarthAPI') {
            _googleEarth.refreshEarth(location.lat(), location.lng(), newZoom);
        }
    }

    function focusBuilding(buildingKey, ignoreAnalytics) {
        var layer = _layers.getLayer("building_outlines"), campus = "no_campus";
        if (layer) {
            for (var i = layer.polyList.length - 1; i >= 0; i--) {
                var poly = layer.polyList[i];
                if (poly.buildingKey == buildingKey) {
                    campus = poly.Campus;
                    var pos = new umeGMaps.LatLng(poly.PolyCenter.lat, poly.PolyCenter.lng);
                    _map.setCenter(pos);
                    _map.setZoom(17);
                    umeGMaps.event.trigger(poly, 'click', { latLng: pos });
                    if (_googleEarth != null && _map.getMapTypeId() == 'GoogleEarthAPI') {
                        _googleEarth.refreshEarth(pos.lat(), pos.lng(), 18);
                    }
                    break;
                }
            }
            if (_isMobile) {
                $("#f_buildings_select").hide();
                $("#footer_exterior").find("a").removeClass("btn_selected");
            }
            if (!ignoreAnalytics) {
                _analytics.itemClick(campus + "_buildings", buildingKey)
            }
        }
    }

    function generateLink(building) {
        var url = _constants.host_url;
        if (!building) {
            var center = _map.getCenter();
            var l = center.lat() + "," + center.lng();
            var z = _map.getZoom();

            var c = "";
            for (var i = _layers.layerList.length - 1; i >= 0; i--) {
                if (_layers.layerList[i].display && _layers.layerList[i].key.indexOf('building') == -1 && _layers.layerList[i].key != "campus_outlines") {
                    if (c != "") {
                        c += ",";
                    }
                    c += _layers.layerList[i].key;
                }
            }
            url += "?l=" + l + "&z=" + z + "&c=" + c + "&campus=" + _campus;
        }
        else {
            var data = _layers.buildingLinks.lookup(building);
            if (data) {
                url += "?b=" + data.buildingKey;
            }
        }
        return url;
    }

    function createMapLink() {
        $('#generalLinkBox').show().css({ "width": "0", "height": "0" });
        $('#generalLinkBox').animate({
            width: "220px",
            height: "50px"
        }, 400);
        $('#generalLinkBox > input').val(generateLink(false));
    }

    function displayMessage(message) {
        if ($("#message_popup_wrapper").length > 0) {
            return;
        }
        $("<div id='message_popup_wrapper'><div id='message_popup'><a href='javascript:void(0)' id='message_popup_close'></a>" + message + "</div></div>").hide().appendTo("body > form").fadeIn("fast");
        $("#message_popup_close").click(function () {
            $("#message_popup").fadeOut("fast", function () { $("#message_popup_wrapper").remove(); });
        });
    }

    return {
        initialise: initialize,
        focusBuilding: focusBuilding,
        addNewLayer: _layers.addNewLayer,
        createMapLink: createMapLink,
        printMap: _print.printMap,
        createPrintablePage: _print.createPrintablePage,
        updateInfoWindow: _layers.updateInfoWindow,
        Directions: {
            process: _directions.processDirections,
            clear: _directions.clearDirections,
            toggleTravelMode: _directions.toggleTravelMode,
            setDestination: _directions.setDestination,
            setStartingWaypoint: _directions.setStartingWaypoint,
            setEndingWaypoint: _directions.setEndingWaypoint,
            setWaypointDestination: _directions.setWaypointDestination,
            setMarkerDestination: _directions.setMarkerDestination,
            generateLink: _directions.generateLink
        },
        launchInterior: _interior.launchInterior,
        switchBuilding: _interior.switchBuilding,
        switchLevel: _interior.switchLevel,
        loadingBarToggle: _dataLoader.toggleLoadingBar,
        errorBarToggle: _dataLoader.toggleErrorBar,
        searchResultClick: _search.resultClick,
        urlParameterFunctions: {
            registerEvent: _urlParameterFunctions.regesterEvent,
            setCenter: _urlParameterFunctions.setMapCenter,
            setZoom: _urlParameterFunctions.setMapZoom,
            addEventMarker: _urlParameterFunctions.addEventMarker,
            addGeneralMarker: _urlParameterFunctions.addGeneralMarker,
            setUpDirections: _urlParameterFunctions.setUpDirections,
            setCampus: _urlParameterFunctions.setCampus
        },
        closeOpenWindows: closeOpenWindows
    }
} (UAlberta.Maps.Exterior || {}, jQuery);