/**** This file requires CampusMaps.js ***/
'use strict';
var data_cache = new Dictionary();
var global_path = [];
var nav_path = [];
var me; 
var myloc;
var watchID = null; //This is for cordovaGeolocation
var directionsDisplay = [];
var markersArray = [];

// This has to do with enabling our cross-site local django testing
function getCookie(name) {
    var cookieValue;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// This has to do with enabling our cross-site local django testing
function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
// localStorage prototype to set data expiration on setObject
Storage.prototype.setObject = function( key, value, min ) {
    var msec = min * 60 * 1000;
    var record = { value: JSON.stringify( value ), timestamp: new Date().getTime() + msec };
    this.setItem( key, JSON.stringify( record ) );
};
// localStorage prototype to check data expiration on getObject
Storage.prototype.getObject = function( key ) {
    var record = JSON.parse( this.getItem( key ) );
    if( !record ) {
        return false;
    }
    if( (new Date().getTime()) > record.timestamp ) {
        return false;
    }
    return JSON.parse( record.value );
};
/*
    This function calls the uAlberta api to get the exterior api data

    key: The buildingKey used to return exterior data
    flag: The associated api flag to call
*/
function getExteriorData( category, flag ) {
    // Show the loading popup and check if its in localStorage
    $( '#progressPopup' ).text( "Loading map" );
    $( '#progressPopup' ).popup( 'open' );
    var mobile = 'false';
    if( mobile ) {
        mobile = 'true';
    }
    var storageKey = 'GetExteriorData_c_' + category + '_f_' + flag + '_m_' + mobile;
    var storedObject = localStorage.getObject( storageKey );
    if( !storedObject ) {
        var location =  window.location.protocol + "//" + window.location.hostname +":" +window.location.port;
        //Check to see if it is cached
        $.ajax({
            type: "GET",
            dataType: "json",
            contentType: "application/json",
            timeout: 30000,
            url: location + "/api/exterior/",
            data: "category=" + category + "&flag=" + flag + "&isMobile=" + mobile,
            success: function( data ){ writeExt( storageKey , data , 1440 ); },
            error: function( jqXHR, textStatus, errorThrown ){ alert( textStatus + ', ' + errorThrown ); }
        });
    } else {
        // Draw the returned object
        drawExternal( storedObject );
    }

}
/*
    This function calls the uAlberta api to get the interior api data

    key: The buildingKey used to return interior data
    level: The building level
    subpath: This is a piggy back if we are getting the data for the path navigation
                in this case it should just hit the localStorage
*/
function getInteriorData( key, level, subpath ) {
    // Show the loading popup and check if its in localStorage
    $( '#progressPopup' ).text( "Loading Interior" );
    $( '#progressPopup' ).popup( 'open' );
    $( '#floor_selector_dropdown' ).trigger( 'collapse' );
    var storageKey = 'GetInteriorData_b_' + key + '_l_' + level;
    var storedObject = localStorage.getObject( storageKey );
    //Check to see if it is cached
    if(!storedObject) {
        var location =  window.location.protocol + "//" + window.location.hostname +":" +window.location.port;
        $.ajax({
            type:"GET",
            dataType: "json",
            contentType: "application/json",
            timeout: 30000,
            url: location + "/api/interior/",
            data: "BuildingName="+key+"&Level="+level,
            success: function(data){
                writeInt( storageKey, data, 1440, key, level ); 
                if( subpath ){
                    drawLine(subpath); 
                }               
            },
            error: function(jqXHR, textStatus, errorThrown){ alert( textStatus + ', ' + errorThrown ); }
        });
    } else {
        // Draw the returned object and path if required
        drawFloor( storedObject , key, level );
        if( subpath ){
            drawLine(subpath); 
        } 
    }
}
/*
    This function is used to send the Waypoint list to the server 
    to call against the pathfinding api and reqest a path.
*/
function queryPath(){
    //Add CSRF Protection for POST requests
    $( '#progressPopup' ).text( "Finding route" );
    $( '#progressPopup' ).popup( 'open' );
    console.log('query');
    var csrftoken = getCookie( 'csrftoken' );
    var location =  window.location.protocol + "//" + window.location.host;

    if(Waypoint.list.length < 2){
        return;
    } 

    $.ajaxSetup({
        crossDomain: false, // obviates need for sameOrigin test
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
 

    $.ajax({
        type:"POST",
        dataType: "json",
        contentType: "application/json",
        timeout: 30000,
        url: location + "/api/pathfinding/",
        data: JSON.stringify(Waypoint.waypoints),
        success: function(data){
            //add this to a global var
            console.log( data );
            if(data.status == 'ok') {
                buildDirections(data.waypoints);
            } else {
                alert(data.message);
                $( "#progressPopup" ).popup( "close" );
            }
            //drawLine(data[0]);
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert( textStatus+", "+errorThrown);
            $( '#progressPopup' ).popup( 'close' );
        }
    });
}

/* 
    This function gets the user history object from localStorage
    as specificed:
    {
        "routes": [
          [],
          []
         ],
        "accessibility":false,
        "indoors": 5
    }
*/
function getHistory() {
    var storageKey = 'user_history';
    var storedObject = localStorage.getObject( storageKey );
    // If an object is not stored in localStorage add it
    if(!storedObject) {
        storedObject = { 'routes': [], 'accessibility':false,'indoors': 5};
        updateHistory(storedObject);
    }
    return storedObject;
}
/*
    This function records the localStorage route history

    data: A route objects
*/
function updateHistory( data ) {
    var storageKey = 'user_history';
    try {
        localStorage.setObject( storageKey , data , 525949 );
    } catch(e) {
        if(e.name === 'QUOTA_EXCEEDED_ERR') {
            localStorage.clear();
            updateHistory( data );
        }
    }
}

/*
    This function records a route into the localStorage route history

    data: An a array of history route objects
*/
function recordRoute( data ) {
    var history = getHistory();
    var routes = history.routes;
    if(routes.length > 4) {
        routes.shift();
    }
    routes.push( data );
    updateHistory( history );
}
/*
    This function is a step function for loading the historical routes 
    into the buildDirections function. It also updates the recently used 
    list of routes.

    index: Index of the route in history localStorage object
*/
function buildHistoricalDirections ( index ) {
    var history = getHistory();
    var routes = history.routes.reverse();
    var route = routes[index];
    routes.splice(index,1);
    history.routes = routes.reverse();
    updateHistory(history);
    buildDirections(route);
    $('#routehistory').popup( 'close' );
}

/*
    This function fills in the route history popup to show recently used routes
*/
function showRouteHistory () {
    var list = $( '#pastpaths' );
    list.empty();
    // The list is reversed so that we can show the popup with most recent at the top
    var routes = getHistory().routes.reverse();
    var geocoder = new google.maps.Geocoder();
    // Iterate over the saved routes
    $.each( routes, function( index , route ) {
        var startPoint = route[0];
        var endPoint = route[ route.length - 1 ];
        var items = "<li data-role=\"button\" data-corners=\"false\" onclick=\"buildHistoricalDirections(" + index + ")\">";
        // Add the start point label
        if ( startPoint.Key && startPoint.Level && startPoint.Lines ) {
            var building = data_cache.lookup( startPoint.Key );
            var floor = startPoint.Level;
            for (var obj in building.levels) {
                if(building.levels[obj].FloorNumber == startPoint.Level) {
                    floor = building.levels[obj].displayName;
                }
            }
            items += "<div class=\"past_route\" id=\"historyListStart_" + index + "\">Start:<br/>";
            items += floor+ " of " + building.displayName + "</div>";
        } else if ( startPoint.Coord ) {
            // If the start label is a coordinate we need to reverse geocode it
            items += "<div class=\"past_route\"  id=\"historyListStart_" + index + "\"></div>";
            var dest = new google.maps.LatLng(startPoint.Coord.lat, startPoint.Coord.lng);
            geocoder.geocode({'latLng': dest}, function(results, status) {
                var address = "Start:<br/>";
                if (status === google.maps.GeocoderStatus.OK && results[0] ) {
                    address += results[0].formatted_address;
                } else {
                    address += "lat:" + startPoint.Coord.lat + ", lng:" + startPoint.Coord.lng;
                }
                $( '#historyListStart_' + index ).html( address );
            });
        }
        // Add the end point label
        if ( endPoint.Key && endPoint.Level && endPoint.Lines ) {
            var buildingEnd = data_cache.lookup( endPoint.Key );
            var floor = endPoint.Level;
            for (var obj in building.levels){
                if(building.levels[obj].FloorNumber == startPoint.Level) {
                    floor = building.levels[obj].displayName;
                }
            }
            items += "<div class=\"past_route\" id=\"historyListEnd_" + index + "\">End:<br/>";
            items += floor + " of " + buildingEnd.displayName + "</div>";
        } else if ( endPoint.Coord ) {
            // If the start label is a coordinate we need to reverse geocode it
            items += "<div class=\"past_route\" id=\"historyListEnd_" + index + "\"></div>";
            var  destEnd = new google.maps.LatLng(endPoint.Coord.lat, endPoint.Coord.lng);
            // The reverse gecode lookup for the label
            geocoder.geocode({ 'latLng' : destEnd }, function( results , status ) {
                var address = "End:<br/>";
                if ( status === google.maps.GeocoderStatus.OK && results[0] ) {
                    address += results[0].formatted_address;
                } else {
                    address += "lat:" + endPoint.Coord.lat + ", lng:" + endPoint.Coord.lng;
                }
                $( '#historyListEnd_' + index ).html( address );
            });
        }
        items += "</li>";
        list.append(items);
    });
    // Refresh the list view
    list.listview( 'refresh' );
    list.trigger( 'create' );
    $( '#routehistory' ).popup( 'open' );
}
/* 
    This function stores the returned external data in localStorage
    
    storageKey: The localStorage object key
    data: The data to store
    min: Tow long the data should be cached for
*/
function writeExt( storageKey, data, min ) {
    // Add the object to storage, empty it out if the localStorage is full
    try {
        localStorage.setObject( storageKey, data, min );
    } catch(e) {
        if(e.name === 'QUOTA_EXCEEDED_ERR') {
            var history = getHistory();
            localStorage.clear();
            updateHistory(history);
        }
    }
    drawExternal( data );
}

/* 
    This function stores the returned internal data in localStorage
    
    storageKey: The localStorage object key
    data: The data to store
    min: Tow long the data should be cached for
    key: The building key
    level: The building's level
*/
function writeInt( storageKey, data, min, key, level ) {
    // Add the object to storage, empty it out if the localStorage is full
    try {
        localStorage.setObject( storageKey, data, min );
    } catch(e) {
        if(e.name === 'QUOTA_EXCEEDED_ERR') {
            var history = getHistory();
            localStorage.clear();
            updateHistory(history);
        }
    }
    drawFloor( data, key, level );
}

/*
    This function uses the data returned by the external api call to
    draw the building overlays on the exterior map.

    data: JSON object from the api call
*/
function drawExternal( data ){
    var polys = data.d.Polys;
    var labels = data.d.Labels;
    var markers = data.d.Markers;
    map.clearOverlays();
    // Iterate over all the polygons (buildings)
    $.each( polys, function( i , building ) {
            var color = '#' + building.LineColor;
            var width = building.LineWidth;
            var opacity = building.LineTransparency;
            var path = building.Path;
            var pathArray =[];

            // Build the polygon to be drawn
            $.each( path, function( j, point ) {
                var lat = point.lat;
                var lng = point.lng;
                pathArray.push( new google.maps.LatLng( lat, lng ));
            });

            var polyline = new google.maps.Polygon({
                    path: pathArray,
                    strokeColor: color,
                    strokeOpacity: 1,
                    strokeWeight: width,
                    fillColor: color,
                    fillOpacity: opacity,
                    geodesic: true,
                    zIndex: 5
            });
            if(markers.length > 0) {
                markersArray.push(polyline);
            }
            // Add this building to the data_cache, which is a very simple 
            // dictionary object that doesn't distingush by campus.
            //
            // As it turns out this is really important for the building list and past routes
            // becasue we lookup the names for many buldings in both.
            if (building.BuildingKey && building.Campus && building.PolyCenter) {
                if (!data_cache.containsKey(building.BuildingKey)) {
                    data_cache.add(building.BuildingKey, { campus: building.Campus, displayName: building.Name, buildingKey: building.BuildingKey, formerName: building.FormerName, infoWindow: building.infoWindow, position: building.PolyCenter, levels: building.levels, desc: building.Description });
                }
            }
            polyline.setMap( map );
            // Click listener so that we can show our popup info window on the map when a building is clicked
            google.maps.event.addListener(polyline, 'click', function(e){
                showBuildingPopOver(e, building);
            });

    });
    // show the text labels
    $.each( labels, function( i, label ) {
        var lat = label.Coords.lat;
        var lng = label.Coords.lng;
        var txt = label.Name;
        var zoom = mobile ? 17 : 16;
        new MapLabel({
               map: map,
               minZoom: zoom,
               fontSize: 10,
               position: new google.maps.LatLng( lat, lng ),
               text: txt,
               zIndex: 1
         });
    });
    $.each( markers, function( i, marker){
            
        var myLatlng = new google.maps.LatLng(marker.Coords.lat,marker.Coords.lng);
        var mapOptions = {
            draggable: false,
            icon: marker.IconUrl, 
            visible: true,
            center: myLatlng
        }
        var mapMarker = new google.maps.Marker({
              position: myLatlng,
              map: map,
              title:marker.Name
        });
            google.maps.event.addListener(mapMarker, 'click', function(e){
                showBuildingPopOver(e, marker);
            });
        google.maps.Map.prototype.clearOverlays = function() {
            for (var i = 0; i < markersArray.length; i++ ) {
                markersArray[i].setMap(null);
            }
        };
        markersArray.push(mapMarker);

    });
   $( "#progressPopup" ).popup( "close" );
}


/*
 * This is the desktop version of geolocation
 */
function currentLocation() {
    if(!myloc) {
        myloc = new google.maps.Marker({
        clickable: false,
        icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
                    new google.maps.Size(22,22),
                    new google.maps.Point(0,18),
                    new google.maps.Point(11,11)),
                    shadow: null,
                    zIndex: 999,
                    map: map
        });
    }
    //get current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
            var me = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );
            myloc.setPosition(me);
            map.panTo(me);
            map.setZoom(16);

            var event = {
                stop: null,
                latLng: me
            };
            google.maps.event.trigger(map, 'click', event);
        });

    }

}

/*
 *    This is the cordova mobile geolocation that
 *    follows the user
 */
function cordovaGeolocationInit() {
    if(!myloc) {
        myloc = new google.maps.Marker({
        clickable: false,
        icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
                    new google.maps.Size(22,22),
                    new google.maps.Point(0,18),
                    new google.maps.Point(11,11)),
                    shadow: null,
                    zIndex: 999,
                    map: map
        });
    watchID = navigator.geolocation.watchPosition( function( position ) {
            me = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );
        }, function( error ){
            if( watchID !== null ) {
                navigator.geolocation.clearWatch( watchID );
                watchID = null;
            }
        }, { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true});
    }
    setTimeout(function(){
        myloc.setPosition(me);
        map.panTo(me);
        map.setZoom(16); 
    }, 5000);

}

/*
    This function takes the interior data returned from the api
    and draw onto the interior canvas all the Polygons, Lines, 
    Points, and Text Objects to draw the specified level.
    
    dataObj: The returned interior data
    key: The building key of the building being drawn
    level: The floor or level in the building
*/
function drawFloor( dataObj, key, level ) {
    //Hide the Google Map and show the Interior layer
    $( '#mapCanvas' ).hide();
    $( '#interiorCanvas' ).show();
    $( '#interior_controls' ).show();
    if( mobile ){
        $( '#floor_selector_mobile' ).show();
    } else {
        $( '#floor_selector' ).show();
    }
    $( '[id^=interior_popup]' ).hide();

    // Clear the canvas and reintialize it
    $( '#interiorCanvas' ).empty();
    $( '#interiorCanvas' ).append( "<canvas id=\"interior\"></canvas>" );
    UAlberta.Maps.Interior.clearCanvas();
    UAlberta.Maps.Interior.updateInstance();
    $( '#interior' ).attr( 'height' , $( '#mainContent' ).height() ).attr( 'width' , $( '#mainContent' ).width() );
    UAlberta.Maps.Interior.initialise( 'interior', { 
                            defaultCameraRotation: 90,
                            defaultCameraPitch: 45,
                            defaultCameraRoll: 0,
                            maxFPS: 60,
                            buildingName: key,
                            level: level });
    var data = dataObj.d;
    //Load all Polygons
    $.each( data.Polys, function ( index , poly ) {
        UAlberta.Maps.Interior.addPolygon( poly.Path , poly.Triangles , poly.Options );
    });    
    //Load all Lines
    $.each( data.Lines, function ( index , lines ) {
        UAlberta.Maps.Interior.addLine( lines.Start , lines.End, lines.Options);
    });
    //Load all Points
    $.each( data.Points, function ( index , point ) { 
        UAlberta.Maps.Interior.addPoint( point.Point , point.Options );
    });
    //Load all Text
    $.each( data.Text, function ( index , text ) {
        UAlberta.Maps.Interior.addText( text.Text , text.Point, text.Options);
    });
    // Render the scene and close the loading popup
    UAlberta.Maps.Interior.camera.centerCamera(false);
    UAlberta.Maps.Interior.render(true);
    $( '#progressPopup' ).popup( 'close' );
}

/*
    This function focuses on an exterior directions point

    index: index in global_path
*/
function focusSubPath ( index ) {
    var subPath = global_path[index];
    // Check if this is a valid exterior object
    if ( subPath.Coord && subPath.Coord.lat && subPath.Coord.lng ) {
        var interior = UAlberta.Maps.Interior;
        // Hide the interior map
        $( '#interiorCanvas' ).hide();
        $( '#interior_controls' ).hide();
        $( '#floor_selector' ).hide();
        $( '#floor_selector_mobile').hide();
        interior.clearCanvas();

        if (infowindow){
            infowindow.close();
        }
        // Pan the map to the new location
        map.clearOverlays();
        map.panTo(new google.maps.LatLng(subPath.Coord.lat,subPath.Coord.lng));
        map.setZoom(19);
        // Set the navigation bar elements
        $( '#directions_naviagation_info' ).attr( 'onclick' , "navCurrent(" + index + ");");
        $( '#directions_naviagation_back' ).attr( 'onclick' , "navBack(" + ( index - 1 ) + ");"); 
        if ( index === 0 ) {
            $( '#directions_naviagation_back' ).css('opacity', '0.2');
        } else {
            $( '#directions_naviagation_back' ).css('opacity', '1');
        }     
        $( '#directions_naviagation_fwd' ).attr( 'onclick' , "navFwd(" + ( index + 1 ) +");"); 
        if ( index === nav_path.length-1 ) {
            $( '#directions_naviagation_fwd' ).css('opacity', '0.2');
        } else {
            $( '#directions_naviagation_fwd' ).css('opacity', '1');
        }   
        $( '#directions_naviagation_info' ).text( nav_path[index] );
        $( '#directions_naviagation_info' ).trigger('create'); 
        $( '#mapCanvas' ).show();
    }
}

/*
    This function draws a polyline on the interior canvas

    data: JSON object containing a .Lines array property
*/
function drawLine ( data ) {
    var options = { 'lineColor' : "#FF0000" , 'lineThickness' : 3};
    var interior = UAlberta.Maps.Interior;
    var a = {'x':data.Lines[0].x,'y':10,'z':data.Lines[0].z};
    interior.addImage('static/css/img/marker_greenA.png', a, 20, 34, options);
    $.each(data.Lines, function(index, value) {
        var start = value;
        var end = data.Lines[index+1];
        if(end){
           interior.addLine( start , end , options );
        }

    });
    var b = {'x':data.Lines[data.Lines.length-1].x,'y':10,'z':data.Lines[data.Lines.length-1].z};
    interior.addImage('static/css/img/marker_greenB.png', b, 20, 34, options);
    interior.render(true);
    setTimeout(interior.render, 200); 
}
/*
    This is the parsing function for buildDirections Coord objects
    It iterates over the waypoints and sends coordinates in the 
    same path to getExtRoute()
    
    input: An array of directions objects
*/
function drawExtPath ( input ) {
    var data = [];
    if(infowindow) {
       infowindow.close(); 
    }
    map.clearOverlays();

    $.each(input, function(index, obj){
        if(obj.Coord) {
            data.push(obj.Coord);
        } else {
            getExtRoute(data);
            data = [];
        }
    });
    getExtRoute(data);
}
/*
    This function takes a list of parsed Coord objects
    from drawExtPath and calls the google directions service.
    The returned path is added to the map.

    data: An array of Coord Objects
*/
function getExtRoute ( data ) {
    if( data.length > 1 ) {
        var umeGMaps = window.google.maps;
        var display = new umeGMaps.DirectionsRenderer(),
        travelMode = umeGMaps.TravelMode.WALKING,
        directionsService = new umeGMaps.DirectionsService(),
        length = data.length,
        waypnt = [],
        start = new google.maps.LatLng( data[0].lat , data[0].lng),
        end = new google.maps.LatLng( data[ length - 1 ].lat , data[ length - 1 ].lng);

        display.setMap(map);
        directionsDisplay.push(display);
        //Check if we have waypoints
        if (length > 2) {
            for(var i = 1; i < length - 2 ; i++){
                waypnt.push({
                      location: google.maps.LatLng(data[i].lat, data[i].lng),
                      stopover:true
                  });
            }
        }
        //Build the request and add a successful request to the map
        var request = {
            origin: start,
            waypoints: waypnt,
            destination: end,
            travelMode: travelMode
        };
        directionsService.route( request , function ( result, status ) {
            if ( status === umeGMaps.DirectionsStatus.OK ) {
                display.setDirections( result );
            }
        });
    }
}
/*
    This function launches the interior maps to draw a sub path, 
    it is called by the directions list element 
    where the index is the index in global_path
*/
function drawSubPath ( index ) {
    var subPath = global_path[index];
    if (subPath) {
        // Check for a valid interior object, launch the interior if it is. 
        if ( subPath.Key && subPath.Level && subPath.Lines ) {
            UAlberta.Maps.Exterior.launchInterior( subPath.Key, subPath.Level, '', subPath );
            // seet the navigation bar onclicks and information
            $( '#directions_naviagation_info' ).attr( 'onclick', "navCurrent(" + index + ");");
            $( '#directions_naviagation_back' ).attr( 'onclick' , "navBack(" + ( index - 1 ) + ");");       
            if ( index === 0 ) {
                $( '#directions_naviagation_back' ).css('opacity', '0.2');
            } else {
                $( '#directions_naviagation_back' ).css('opacity', '1');
            }     
            $( '#directions_naviagation_fwd' ).attr( 'onclick' , "navFwd(" + ( index + 1 ) +");"); 
            if ( index === nav_path.length-1 ) {
                $( '#directions_naviagation_fwd' ).css('opacity', '0.2');
            } else {
                $( '#directions_naviagation_fwd' ).css('opacity', '1');
            }  
            $( '#directions_naviagation_info' ).text(nav_path[index]);
            $( '#directions_naviagation_info' ).trigger( 'create' ); 
        }
    }
}

/* 
    This function removes the directions in the directions sidebar,
    it also removes all the drawn pathways and hides the navigation bar
*/
function clearDirections () {
    var interior = UAlberta.Maps.Interior;
    //Hide the interior canvas and floor selectors
    $( '#interiorCanvas' ).hide();
    $( '#interior_controls' ).hide();
    $( '#floor_selector' ).hide();
    $( '#floor_selector_mobile' ).hide();
    interior.clearCanvas();

    // refocus the exterior maps and clear any paths 
    if (map){
        map.setZoom(16);
        map.clearOverlays(); 
    }
    if ( directionsDisplay ){
        $.each( directionsDisplay , function( index , display ){
            display.setMap( null );
        });
    }
    directionsDisplay = [];
    // Hide the nav bar
    $( '#directions_naviagation' ).css( 'display' , 'none' );
    $( '#mapCanvas' ).css( 'bottom' , '0em' );
    $( '#interiorCanvas' ).css( 'bottom' , '0em' );
    $( '#mapCanvas' ).show();

    global_path = [];
    nav_path = [];
    // Empty the direction list, add a dummy and rebuild it
    var list = $( '#directionsList' );
    list.empty();
    list.append("<li><a href=\"#\" ><div style=\"white-space:normal;\">No directions loaded</div></a></li>");
    list.listview( 'refresh' );
}
/*
    This function takes in a list of returned data from the server and 
    parses it to build the sidebar directions and naviagation bar

    data: Array of JSON objects
*/
function buildDirections ( data ) {
    global_path = data; 
    /* BEGIN REMOVE */
    // TEST DATA
    // data = global_path =[ {"Key":"ath", "Level": "2", "Lines":[
    //                             {"x":70,"y":2,"z":5},
    //                             {"x":-30,"y":2,"z":5},
    //                             {"x":-30,"y":2,"z":370},
    //                             {"x":-50,"y":2,"z":370}
    //                             ]
    //                     },
    //                     {"Coord":{"lat":53.526699,"lng":-113.526497}},
    //                     {"Coord":{"lat":53.526706,"lng": -113.525033}},
    //                     {"Key":"cab", "Level": "1", "Lines":[
    //                                     {"x":-360,"y":2,"z":420},
    //                                     {"x":-280,"y":2,"z":420},
    //                                     {"x":-280,"y":2,"z":0},
    //                                     {"x":-220,"y":2,"z":0}
    //                                 ]
    //                     },
    //                     {"Coord":{"lat":53.527942,"lng":-113.524586}},
    //                     {"Coord":{"lat":53.528032,"lng": -113.521594}}
    //                     ];
    /* END REMOVE */
    //Save the route in the local history
    recordRoute(data);
    
    /* Empty out any current route */
    var list = $( '#directionsList' );
    var geocoder = new google.maps.Geocoder();
    list.empty();

    // Iterate over the returned directions
    $.each( global_path , function( index , point ) {
        nav_path.push(index);
        var items = ""; 
        // Interior direction point
        if ( point.Key && point.Level && point.Lines) {
            // lookup the building name and create the html markup
            var building = data_cache.lookup( point.Key );
            var floor = point.Level;
            for (var obj in building.levels) {
                if(building.levels[obj].FloorNumber == point.Level) {
                    floor = building.levels[obj].displayName;
                }
            }
            var name =  floor+" of "+building.displayName;

            items += "<li id=\"dirList_" + index + "\"><a href=\"#\" onclick=\"drawSubPath(" + index + ")\" >";
            items += "<div id=\"directions_" + index + "\" style=\"white-space:normal;\">";

            items += name;
            nav_path[index] = name;
        } else 
        // Coordinate direction point
        if ( point.Coord ) {
            var dest = new google.maps.LatLng( point.Coord.lat , point.Coord.lng );

            items += "<li id=\"dirList_"+index+"\"><a href='#' onclick=\"focusSubPath("+index+")\" >";
            items += "<div id=\"directions_"+index+"\" style=\"white-space:normal;\">";

            //Reverse geocode the coordinate to get a dispaly name
            geocoder.geocode( { 'latLng' : dest }, function( results , status ) {
                var address;
                if (status === google.maps.GeocoderStatus.OK && results[0]) {
                    address = results[0].formatted_address;
                } else {
                    //If the geocodeer fails display the lat/lng numbers
                    address = "Lat:" + point.Coord.lat + ", Lng:" + point.Coord.lng;
                }
                $( '#directions_' + index ).text( address );
                $( '#directions_' + index ).trigger( 'create' );
                nav_path[index] = address;
            });
            //Draw the paths on the exterior
        }
        items += "</div></a></li>";
        list.append(items);
    });
    list.listview( 'refresh' );
    // Need to draw any exterior paths on the map
    drawExtPath( global_path );
    // Collapse or expand the correct sidebar headings
    $( '#directionsCollapsible' ).trigger( 'expand' );
    $( '#campusSelectCollapse' ).trigger( 'collapse' );
    $( '#createPathDropDown' ).trigger( 'collapse' );
    $( '#createPathDropDown' ).trigger( 'collapse' );
    $( '#progressPopup' ).popup( 'close' );
    //Scroll to the directions list
    location.hash = '#directionsCollapsible';
    //This click handler styles the currently active directions
    $("#directionsCollapsible ul li a").click(function () {
        $( '#directionsCollapsible ul li a' ).each( function () {
            var p = $( this ).parent();
            $( p ).removeClass( 'ui-btn-active' );
        });
        var p = $( this ).parent();
        $( p ).addClass( 'ui-btn-active' );
    });
    //This block builds up all the naviagtion bar, its css and intial onclicks
    $( '#directions_naviagation' ).css( 'display' , 'inline' );
    $( '#mapCanvas' ).css( 'bottom' , '2.813em' );
    $( '#interiorCanvas' ).css( 'bottom' , '2.813em' );
    $( '#directions_naviagation_info' ).text( nav_path[0] );
    $( '#directions_naviagation_info' ).trigger( 'create' );
    $( '#directions_naviagation_info' ).attr( 'onclick' , 'navCurrent(0);' );
    $( '#directions_naviagation_back' ).attr( 'onclick' , 'navBack(-1);' );
    $( '#directions_naviagation_back' ).css('opacity', '0.2');
    if ( global_path.length < 2 ) {
        $( '#directions_naviagation_fwd' ).css('opacity', '0.2');
    } else {
        $( '#directions_naviagation_fwd' ).css('opacity', '1');
    }         
    $( '#directions_naviagation_fwd' ).attr( 'onclick' , 'navFwd(1);' ); 
    $( '#dirList_0 a' ).trigger('click');
    //On mobile we jump right into the path navigation        
    if(mobile) {
        $( '#sidebar' ).panel( 'close' );                 
    }
}
/*
    These functions handle the on screen route navigation
    by triggering the coresponding click in the sidebar 
    directions list 

    index: The index in the global_path[] and nav_path[]
*/
//Called when the back button is clicked
function navBack ( index ) {
    //base index
    if(index < 0) {
        return;
    }
    $( '#dirList_' + index + ' a' ).trigger( 'click' );
}
//Called when the forward button is clicked
function navFwd ( index ) {
    //furthest index 
    if( index > global_path.length ) {
        return;
    }
    $( '#dirList_' + index + ' a' ).trigger( 'click' ); 
}
//Called when the current name is clicked
function navCurrent ( index ) {
    $( '#dirList_' + index + ' a' ).trigger( 'click' );
}



/*
 * This function dynamically builds the list of campus
 * buildings for the sidebar.
 */
function appendToBuildingsList () {

    var list = [];

    //get the campus's building names from the data_cache
    for (var i = 0; i < data_cache.length(); i++) {
        var data = data_cache.lookup(data_cache.lookupKey(i));
        list.push("<li><a href=\"javascript:void(0);\" onclick=\"buildingListClick("+ i +");\"><div style=\"white-space:normal;\">" + data.displayName + "</div></a></li>");
    }

    // sort the new list items
    list.sort( function( a, b ) {
      var valA = $( a ).text(),
          valB = $( b ).text();
       if ( valA < valB ) { return -1; }
       if ( valA > valB ) { return 1; }
       return 0;
    });

    // clear old campus data, if any
    $( '#buildingSelection' ).empty();

    // add the new campus buildings to the LV
    $.each( list, function( i, li ) {
        $( '#buildingSelection').append( li );
    });

    // refresh the LV
    $( '#buildingSelection' ).listview( 'refresh' );
}

/*
 * This function launches the popover event
 * over a building when clicked in the building
 * list.
 */
function buildingListClick ( index ) {

    //Hide interior map
    $( '#interior_controls' ).hide();
    $( '#floor_selector' ).hide();
    $( '#floor_selector_mobile' ).hide();
    $( '#mapCanvas' ).show();

    //get the position of the building
    var data = data_cache.lookup(data_cache.lookupKey(index));
    var lat = data.position.lat;
    var lng = data.position.lng;

    //generate objects for the popover
    var building = {
        Description: data.desc
    };

    var event = {
        stop: null,
        latLng: new google.maps.LatLng(lat,lng)
    };

    //launch the popover
    showBuildingPopOver(event, building);

    //hide the sidebar, if mobile
    if(mobile) {
        $( '#sidebar' ).panel( 'close' );
    }
}


/**
 * @license
 *
 * Copyright 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Map Label.
 *
 * @author Luke Mahe (lukem@google.com),
 *         Chris Broadfoot (cbro@google.com)
 */

/**
 * Creates a new Map Label
 * @constructor
 * @extends google.maps.OverlayView
 * @param {Object.<string, *>=} opt_options Optional properties to set.
 */
function MapLabel(opt_options) {
  this.set('fontFamily', 'sans-serif');
  this.set('fontSize', 12);
  this.set('fontColor', '#000000');
  this.set('strokeWeight', 4);
  this.set('strokeColor', '#ffffff');
  this.set('align', 'center');

  this.set('zIndex', 1e3);

  this.setValues(opt_options);
}
MapLabel.prototype = new google.maps.OverlayView;

window['MapLabel'] = MapLabel;

function toMultiLine(text){
    var textArr = new Array();
    text = text.replace(/\n\r?/g, '<br/>');
    textArr = text.split("<br/>");
    return textArr;
}

/** @inheritDoc */
MapLabel.prototype.changed = function(prop) {
  switch (prop) {
    case 'fontFamily':
    case 'fontSize':
    case 'fontColor':
    case 'strokeWeight':
    case 'strokeColor':
    case 'align':
    case 'text':
      return this.drawCanvas_();
    case 'maxZoom':
    case 'minZoom':
    case 'position':
      return this.draw();
  }
};

/**
 * Draws the label to the canvas 2d context.
 * @private
 */
MapLabel.prototype.drawCanvas_ = function() {
  var canvas = this.canvas_;
  if (!canvas) return;

  var style = canvas.style;
  style.zIndex = /** @type number */(this.get('zIndex'));

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = this.get('strokeColor');
  ctx.fillStyle = this.get('fontColor');
  ctx.font = this.get('fontSize') + 'px' + this.get('fontFamily');


  //ctx.font = this.get('fontSize') + 'px ' + this.get('fontFamily');

  var strokeWeight = Number(this.get('strokeWeight'));

  var text = this.get('text');
  if (text) {

    var textArr = toMultiLine(text);
    var length = '';
    var fontsize = this.get('fontSize');
    var verticalOffset = fontsize+3;
    for (var i = 0; textArr.length > i; i++) {
        if(textArr[i].length > length.length) {
          length = textArr[i];
        }
        if (strokeWeight) {
          ctx.lineWidth = strokeWeight;
          ctx.strokeText(textArr[i], strokeWeight, verticalOffset);
        }
        ctx.fillText(textArr[i], strokeWeight, verticalOffset);
        verticalOffset += fontsize;
    };
    var textMeasure = ctx.measureText(length);
    var textWidth = textMeasure.width + strokeWeight;
    style.marginLeft = this.getMarginLeft_(textWidth) + 'px';
    // Bring actual text top in line with desired latitude.
    // Cheaper than calculating height of text.
    style.marginTop =  textArr.length*-0.4 +'em';
  }
};

/**
 * @inheritDoc
 */
MapLabel.prototype.onAdd = function() {
  var canvas = this.canvas_ = document.createElement('canvas');
  var style = canvas.style;
  style.position = 'absolute';

  var ctx = canvas.getContext('2d');
  ctx.lineJoin = 'round';
  ctx.textBaseline = 'top';

  this.drawCanvas_();

  var panes = this.getPanes();
  if (panes) {
    panes.overlayImage.appendChild(canvas);
  }
};
MapLabel.prototype['onAdd'] = MapLabel.prototype.onAdd;

/**
 * Gets the appropriate margin-left for the canvas.
 * @private
 * @param {number} textWidth  the width of the text, in pixels.
 * @return {number} the margin-left, in pixels.
 */
MapLabel.prototype.getMarginLeft_ = function(textWidth) {
  switch (this.get('align')) {
    case 'left':
      return 0;
    case 'right':
      return -textWidth;
  }
  return textWidth / -2;
};

/**
 * @inheritDoc
 */
MapLabel.prototype.draw = function() {
  var projection = this.getProjection();

  if (!projection) {
    // The map projection is not ready yet so do nothing
    return;
  }

  if (!this.canvas_) {
    // onAdd has not been called yet.
    return;
  }

  var latLng = /** @type {google.maps.LatLng} */ (this.get('position'));
  if (!latLng) {
    return;
  }
  var pos = projection.fromLatLngToDivPixel(latLng);

  var style = this.canvas_.style;
  var mapZoom = map.getZoom();

  style['top'] = pos.y + 'px';
  style['left'] = pos.x + 'px';
  style['visibility'] = this.getVisible_();
};
MapLabel.prototype['draw'] = MapLabel.prototype.draw;

/**
 * Get the visibility of the label.
 * @private
 * @return {string} blank string if visible, 'hidden' if invisible.
 */
MapLabel.prototype.getVisible_ = function() {
  var minZoom = /** @type number */(this.get('minZoom'));
  var maxZoom = /** @type number */(this.get('maxZoom'));

  if (minZoom === undefined && maxZoom === undefined) {
    return '';
  }

  var map = this.getMap();
  if (!map) {
    return '';
  }

  var mapZoom = map.getZoom();
  if (mapZoom < minZoom || mapZoom > maxZoom) {
    return 'hidden';
  }
  return '';
};

/**
 * @inheritDoc
 */
MapLabel.prototype.onRemove = function() {
  var canvas = this.canvas_;
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
};
MapLabel.prototype['onRemove'] = MapLabel.prototype.onRemove;