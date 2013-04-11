'use strict';
var map;
var canvas = $('#mapCanvas')[0];
var infowindow = new InfoBubble({
    maxWidth:320,
    borderRadius: 10
});
var mobile;
var currentCampus;
var waypointAddedCount = 0;
var markersArray = [];
var newSort, prevSort;

                //Name, Lat, Lng, APIkey
var locations = [
                 ['North Campus',53.523676,-113.522565,1],
                 ['South Campus',53.501649,-113.534463,4],
                 ['Augustana Campus',53.01179,-112.823203,16],
                 ['Campus Saint-Jean',53.521307,-113.469173,64],
                 ['Enterprise Square',53.541537,-113.496705,512],
                 ['Calgary Center',51.048193,-114.069822,256]
                 ];
var style = [
              {
                "featureType": "poi.attraction",
                "stylers": [
                  { "visibility": "off" }
                ]
              },{
                "featureType": "landscape.man_made",
                "stylers": [
                  { "visibility": "off" }
                ]
              },{
                "featureType": "poi.business",
                "stylers": [
                  { "visibility": "off" }
                ]
              },{
                "featureType": "poi.school",
                "elementType": "labels",
                "stylers": [
                  { "visibility": "off" }
                ]
              }
            ];

function showSidebar(){
     $( '#sidebar' ).panel( 'toggle' );
}

function focusToNewLocation(lat,lng){
    map.panTo(new google.maps.LatLng(lat,lng));
    map.setZoom(15);
}

/*
    This function is called at the start. It esentailly creates the map canvas and shows it.
    It also adds the click listener to the canvas, shows the campus select popup, and 
    creates all the waypoint fields.
*/
function initialize() {
    //LatLng for UofA comp sci -- used for centering map
    //53.524582,-113.52146
    var lat = 53.524799;
    var lng = -113.520055;
    var mapOptions;

    if(mobile) {
            mapOptions = {
            zoom: 6,
            center: new google.maps.LatLng(lat,lng),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            panControl: false,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.NORMAL,
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            scaleControl: false,
            streetViewControl: false,
            styles: style
          };
    } else {
            mapOptions = {
            zoom: 6,
            center: new google.maps.LatLng(lat,lng),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            panControl: true,
            panControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.NORMAL,
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            styles: style
          };
    }

    //create map and add click listener
    map = new google.maps.Map(canvas,mapOptions);
    google.maps.Map.prototype.clearOverlays = function() {
        for (var i = 0; i < markersArray.length; i++ ) {
            markersArray[i].setMap(null);
        }
    };

    //set the listener
    google.maps.event.addListener(map, 'click', function(e) {
        placeMarker(e.latLng, map);
    });

    //show the map
    $('#mapCanvas').show();

    //show campus selection popup
    setTimeout(function(){$('#campusPopup').popup("open")}, 1000 );

    //creating the fields for waypoints
    createAllPathFields();
}

/*
    This function is called at the start and creates all the waypoint fields and shows the first 2. The 
    listener for the sortable listview also lives here. Comments for that below.
*/
function createAllPathFields() {

    var order = $("#reorderWayPointsList");

    //Depart from and destination -- always show these guys
    order.append(
        '<li id="waypoint0" data-icon="false"><a id="printWay0">Depart from</a><a id="deleteWay0" onclick="deleteWaypoint(0)" style="display:none;"></a></li><li id="waypoint1" data-icon="false"><a id="printWay1">Destination</a><a id="deleteWay1" onclick="deleteWaypoint(1)" style="display:none;"></a></li>'
    );

    //adding fields for 8 more waypoints
    for(var i=2;i<10;i++) {
        order.append('<li id="waypoint'+i+'" style="display:none;" data-icon="false"><a id="printWay'+i+'"></a><a id="deleteWay'+i+'" onclick="deleteWaypoint('+i+')" style="display:none;"></a></li>');
    }

    //list not sortable to start
    order.sortable({disabled:true});
    order.listview("refresh");

    //keeping track of the waypoints we have shown
    waypointAddedCount = 2;

    /*
        This listener will be called back when moving items around in the sortable list view. It will swap the actual waypoint
        object into the new correct position and update the rest of the waypoints accordingly
    */
    order.bind( "sortstop", function(event, ui) {
      
      order.listview('refresh');

      //new order in newSort
      newSort = order.sortable("toArray");

      //new index from the sortable
      var newIndex = ui.item.index();

      //grab the id 
      var item = newSort[newIndex];
      //console.log(item);

      //old order in prevSort -- find where the id used to be
      var oldIndex = prevSort.indexOf(item);

      //just need to swap the waypoints at oldIndex and newIndex
      Waypoint.movePoint(oldIndex, newIndex);

      //console.log("after");
      //console.log(Waypoint.list);
      //console.log(prevSort);
      //console.log(newSort);

      //update the previous sort
      prevSort = newSort;

    });
}

/*
    This function is used when the user clicks Get Directions. If there are not at least 2 
    waypoints selected we dont want to calculate the path, just show a popup telling the user
    to select some more waypoints
*/
function gatherRouteInfo() {
    clearDirections();
    if(Waypoint.list.length >= 2) {
        queryPath(Waypoint.list);
    }else{
        $( "#progressPopup" ).text('Please select more waypoints');
        $( "#progressPopup" ).popup( 'open' );
        setTimeout(function(){$( "#progressPopup" ).popup( 'close' )}, 1300);
    }
    
}

/*
    This function is called when the user click "Edit Waypoints". It will make the listview sortable, hide and show the different 
    buttons for user direction. Show the split view, aka the x's at the end of eachwaypoint. It also hides the options if they are 
    showing
*/
function reorderCurrentPath() {

    var list = Waypoint.list;
    var po = $(".pathOptions");
    var curr = po.attr("class");
    var order = $("#reorderWayPointsList");

    //console.log("reorder now");
    //console.log(list);

    //setting the previous array when starting the sorting
    prevSort = order.sortable("toArray");

    //make the list sortable if we have more than 1 waypoint
    if(list.length>1){
        order.sortable({disabled:false});
    }

    //hide show options & edit waypoints & get directions
    //show clear path & done
    $("#finishedEditing").show();
    $("#clearCurrentRoute").show();
    $("#expandPathOptions").hide();
    $("#expandEditWaypoints").hide();
    $("#getDirections").hide();

    //add the split view to the list view aka the x's at the end
    enableSplitView("open");

    //hide the options if they are showing
    if(curr !== "pathOptions ui-screen-hidden") {
        po.attr("class", "pathOptions ui-screen-hidden");
    }
}

/*
    This function either shows or hides the x's at the end of each waypoint
    Input: type -- either "Open" or "Close"
*/
function enableSplitView(type) {

    var length = $("#reorderWayPointsList").sortable("toArray").length;

    var testL = Waypoint.list.length;

    for(var i=0;i<testL;i++){

        if(type==="open") {
            $("#deleteWay"+i).show();
        }else{
            $("#deleteWay"+i).hide();
        }
    }
}

/*
    This function is called when the user clicks done after editing waypoints. It shows and hides different
    buttons for user direction. Makes the listview unsortable and then takes away the x's at the end of
    each waypoint
*/
function finishedEditingWaypoints() {

    var order = $("#reorderWayPointsList");

    //show options & edit waypoints & get directions
    //hide clear path and done
    $("#finishedEditing").hide();
    $("#clearCurrentRoute").hide();
    $("#expandPathOptions").show();
    $("#expandEditWaypoints").show();
    $("#getDirections").show();

    //make the list unsortable
    order.sortable({disabled:true});

    //take away all the x's
    enableSplitView("close");
}

/*
    This function is called when the user clicks the x at the end of a waypoint. It removes the waypoint
    and updates the view and actual waypoint objects accordingly
    Input: index - the index of the waypoint to remove
*/
function deleteWaypoint(index) {

    //remove the waypoint and decrease the waypoint added count
    Waypoint.removePoint(index);
    waypointAddedCount--;

    //empty the list, re-create all the fields and then populate them
    $( '#reorderWayPointsList' ).empty();
    createAllPathFields();
    fillCurrentWaypoints();

    //showing both sides of the split view 
    for (var i = Waypoint.list.length - 1; i >= 0; i--) {
        $("#waypoint"+i).show();
        $("#deleteWay"+i).show();
    }
}

/*
    This function is called when a new destination is added to the waypoint list. If we have
    more than 2 waypoints already we want to show another field. Expand the list, fill the
    waypoints and focus to correct location
    Input - type -> not used in newer versions
*/
function updateCreatePathFieldFrom(type) {

    var cp = $("#createPathDropDown");
    var list = Waypoint.list;
    var length = list.length;

    //show an extra field and increase the waypointAddedCount
    if(length > 2) {
     
        $("#waypoint"+waypointAddedCount).show();
        ++waypointAddedCount;
        $("#reorderWayPointsList").listview("refresh");
    }

    $( '#reorderWayPointsList' ).trigger( 'expand' );
    fillCurrentWaypoints();
    location.hash = "#reorderWayPointsList";
}

/*
    This function fills the fields for all current waypoints. It gets the current order of the 
    listview which is used for printing the waypoints. It then loops through each waypoint and 
    prints to the correct label.
*/
function fillCurrentWaypoints() {

    var list = Waypoint.list;
    var length = list.length;

    var currentOrder = $("#reorderWayPointsList").sortable("toArray");
    var geocoder = new google.maps.Geocoder();

    $.each(list, function(i, point) {

        var val = currentOrder[i].slice(-1);
        var field = $("#printWay"+val);
        //console.log(point);

        //if the point is lat and lng use the geocoder
        if(point.lat && point.lng) {
            var dest = new google.maps.LatLng(point.lat, point.lng);
            geocoder.geocode({'latLng': dest}, function(results, status) {

                var tmp = "";

                if (status === google.maps.GeocoderStatus.OK && results[0]) {
                    tmp = results[0].formatted_address;
                } else {
                    tmp = "lat:" + point.lat + ", lng:" + point.lng;
                }

                //setting the text of the label
                $("#printWay"+i).text(tmp);

            });

        //if point is a key use the name
        }else if(point.Key) {
            field.text(point.name);

        //else it is a room - use name and parent name
        }else {
            field.text(point.name + " " + point.parent.Name);
        }

    });

    $("#reorderWayPointsList").listview("refresh");
}

/*
    This function is called when the create path is expanded and fills the waypoints
*/
$( "#createPathDropDown" ).on({
    expand: function() {
        fillCurrentWaypoints();
    }
});

/*
    This function is called when "Show Options" is clicked. If it is hidden then
    show and vice versa. Also change the button from Show Options to Hide Options
*/
function showMorePathOptions() {

    var po = $(".pathOptions");
    var curr = po.attr("class");
    var linkText = $("#expandPathOptions .ui-btn-text");
 
    //if the options are currently hidden show them, focus to it, and change the button
    if(curr ==="pathOptions ui-screen-hidden") {
        po.attr("class", "pathOptions");
        location.hash = "";
        location.hash = "poShow";
        $("#collapsePathOptions").show();
        $("#expandPathOptions").hide();
    }else {
        po.attr("class", "pathOptions ui-screen-hidden");
        $("#collapsePathOptions").hide();
        $("#expandPathOptions").show();
    }
}

/*
    This function clears the current path. It also re-draws all the waypoint fields.
*/
function clearCurrentPath() {

    //delete all the waypoints and reset the count
    Waypoint.list.splice(0,Waypoint.list.length);
    waypointAddedCount = 0;
    //console.log(Waypoint.list);

    //empty the current waypoint list on the screen and re-draw and fill it
    $( '#reorderWayPointsList' ).empty();
    createAllPathFields();
    fillCurrentWaypoints();
    for (var i = Waypoint.list.length - 1; i >= 0; i--) {
        $("#waypoint"+i).show();
        $("#deleteWay"+i).show();
    }

    //cleared the path should be done editing waypoints
    finishedEditingWaypoints();
}

/*
    This function is called when a position on the map is clicked. It will focus to the location,
    show an info window with the geocoded location and the ability to add it to the waypoint list
    Input:  position - the position clicked
            map - the map object clicked on
*/
function placeMarker( position, map ) {

    var printAddy = "";
    var latlng = new google.maps.LatLng(position.lat(), position.lng());
    var currentLength = Waypoint.list.length;
    var geocoder = new google.maps.Geocoder();

    //add a destination 
    var addDestination =  '<div class="bubbleContainer_options_link" > ' +
                            '<a href="javascript:void(0)" class="bubbleContainer_options_directions" onclick="UAlberta.Maps.Exterior.Directions.setWaypointDestination('+position.lat()+','+position.lng()+');"><i></i>Add a destination</a> ' +
                        '</div> ';

    //use the geocoder to get the addy of the location
    geocoder.geocode({'latLng': latlng}, function(results, status) {
        var currAddyHolder = "";
        if (status === google.maps.GeocoderStatus.OK) {
            printAddy = results[0].formatted_address;
            //console.log(currAddyHolder);
        } else {
            printAddy = "lat:" + position.lat() + " lng:" + position.lng();
        }

        //could add more options above but just using destination 
        var bubbleToShow = addDestination;

        map.panTo(position);
        infowindow.setContent('<div class="bubbleContainer clearfix">' +
            '<div class="bubbleContainer_header"> ' +
                '<h1>Coordinate</h1><br />' +
                '<h3>'+printAddy+'</h3>'+
                '<div class="bubbleContainer_options"> ' + bubbleToShow +
                '</div> ' +
            '</div> ' +
        '</div>');
        infowindow.setPosition(position);
        infowindow.open(map);
    });
}

/*
    This function is used when a campus is selected. It focuses to the location, sets the 
    dictionary, and populates the building list.
    Input: index - the index of the campus selected
*/ 
function campusSelect(index){

    $("#buildingSelectCollapse").trigger("collapse");
    $( '#interiorCanvas' ).hide();
    $( '#interior_controls' ).hide();
    $( '#floor_selector' ).hide();
    $( '#floor_selector_mobile' ).hide();
    $( '#mapCanvas' ).show();

    currentCampus = index;
    var location = locations[index];
    var lat = location[1];
    var lng = location[2];
    var flag = location[3];
    focusToNewLocation(lat,lng);
    if($(window).width() < 800) {
        $( '#sidebar' ).panel( 'close' );
    }
    data_cache = new Dictionary();
    getExteriorData(0,flag);
    appendToBuildingsList();
    //collapse the campus select after selecting
    $("#campusSelectCollapse").trigger("collapse");

}

/*
    This function is called when the user selects a building. It the shows an info window with
    some options to user can select.
    Input:  event -
            building -
*/
function showBuildingPopOver(event, building) {

    //Show popover
    map.panTo(event.latLng);
    // var infowindow = new google.maps.InfoWindow();
    infowindow.setContent(building.Description);
    infowindow.setPosition(event.latLng);
    infowindow.open(map);
    //this will then call a function to draw the specified level
}

/*
    This function is called when the document is ready. It creates and draws the
    controls on the screen. It sets listener for certain items. More comments below
*/
$( document ).ready(ready);

function ready() {

    var interior = UAlberta.Maps.Interior;
    mobile = $(window).width() < 800;

    //the click function for exit on the interior controls
    $( '#interior_controls_exit' ).click(function() {
        $( '#interiorCanvas' ).hide();
        $( '#interior_controls' ).hide();
        $( '#floor_selector' ).hide();
        $( '#floor_selector_mobile' ).hide();
        interior.clearCanvas();

        map.setZoom(16);
        $( '#mapCanvas' ).show();
    });

    $( '#interior_controls_draw' ).click(function() {
         var location =  window.location.protocol + "//" + window.location.hostname +":" +window.location.port;
            $.ajax({
                type:"GET",
                dataType: "json",
                contentType: "application/json",
                timeout: 30000,
                url: location + "/api/pathfinding/",
                //data: Add parameters here...,
                success: function(data){ drawLine(data); },
                error: function(jqXHR, textStatus, errorThrown){alert(textStatus);}
            });
    });
    
    //just making sure the panel stays open correctly
    $('#mainPage').on( "swiperight", function( e ) {
           if(!mobile){
               $('#sidebar').panel( 'open' );
           }
    });

    $('#mainPage').on( "swipeleft", function( e ) {
            if(!mobile){
               $('#sidebar').panel( 'open' );
           }
    });

    //ignoring the escape key to handle weird functionality
    $('#mainPage').on( "keyup.panel", function( e ) {
           if(!mobile && e.which === 27){
               $('#sidebar').panel( 'open' );
           }
    });

    // Pan controls
    var panAmount = 20;
    $( '#interior_controls_panUp' ).click(function() {
        interior.camera.panCameraY(panAmount);
    });

    $( '#interior_controls_panDown' ).click(function() {
        interior.camera.panCameraY(-panAmount);
    });

    $( '#interior_controls_panleft' ).click(function() {
        interior.camera.panCameraX(panAmount);
    });

    $( '#interior_controls_panRight' ).click(function() {
        interior.camera.panCameraX(-panAmount);
    });

    // Rotate controls
    var rotate = 20*(Math.PI/180);
    $( '#interior_controls_rotateLeft' ).click(function() {
        interior.camera.rotateCamera(-rotate);
    });

    $( '#interior_controls_rotateRight' ).click(function() {
        interior.camera.rotateCamera(rotate);
    });

    // Zoom controls
    var zoom = 50;
    $( '#interior_controls_ZoomIn' ).click(function() {
        interior.camera.zoomCamera(-zoom);
    });

    $( '#interior_controls_ZoomOut' ).click(function() {
        interior.camera.zoomCamera(zoom);
    });

    //making sure to set the route preferences and keep the data around
    $( '#handiCheckBox' ).click( function(){
        var history = getHistory();
        if( $(this).is(':checked') ){
            history.accessibility = true;
        } else {
            history.accessibility = false;
        }
        updateHistory(history);
    });
    $("input[name=routePrefs]").bind( "change", function(event, ui) {
        var history = getHistory();
        if( $(this).is(':checked') ) {
            history.indoors = $(this).val();
        } 
        updateHistory(history);
    });

    //getting the route preferences and setting them
    var history = getHistory();
    $( '#handiCheckBox' ).prop('checked', history.accessibility);
    $( '#handiCheckBox' ).checkboxradio( 'refresh' );
    $( "input[name=routePrefs][value=" + history.indoors + "]" ).attr('checked', true).checkboxradio( 'refresh' );
}

$( '#sidebar' ).ready( loadSidebar );

function phoneGap(){
    ready();
    loadSidebar();
}

function loadSidebar(){
    $( "#sidebar" ).on( "panelbeforeopen", function( event, ui ) {
        // var width = $(window).width();
        if(mobile) {
            $( "#sticky" ).css('transform', 'translate3d(17em,0,0)');
        } else {
            $( "#sticky" ).css('left', '17em');
        }
    } );
    $( "#sidebar" ).on( "panelbeforeclose", function( event, ui ) {
        // var width = $(window).width();
        if(mobile) {
            $( "#sticky" ).css('transform', 'translate3d(0,0,0)');
        }
        $( "#sticky" ).css('left', '0em');
    });
    if(mobile) {
        $( '.listheadertext' ).css('display','none');
        $( '#sidebar' ).panel( 'close' );
        $( '#logo' ).attr( 'src', 'static/css/img/logo-reverse-small.svg');
    } else {
        $( '.listheadertext' ).css('display','block');
        $( '#sidebar' ).panel( 'open' );
        $( '#logo' ).attr( 'src', 'static/css/img/logo-reverse.svg');
    }
    clearDirections();
}

/*
    This function deals with a window resize. 800 is the threshold for detecting a mobile screen.
*/
$(window).resize( function(){

    //just changed from desktop to mobile
    if(!mobile && $(window).width() < 800) {
        $( '#sidebar' ).panel( 'close' );
        if($( '#floor_selector' ).is(":visible") ) {
            $( '#floor_selector' ).hide();
            $( '#floor_selector_mobile' ).show();
        }
        setTimeout(resizeInterior, 1000);
    }
    if(mobile && $(window).width() >= 800) {
        if($( '#floor_selector_mobile' ).is(":visible") ) {
            $( '#floor_selector_mobile' ).hide();
            $( '#floor_selector' ).show();            
        }
        $( '#sidebar' ).panel( 'close' );
        setTimeout(resizeInterior, 1000);
    }
    mobile = $(window).width() < 800;
    if(mobile) {
        $( '.listheadertext' ).css('display','none');
        $( '#logo' ).attr( 'src', 'static/css/img/logo-reverse-small.svg');
    } else {
        $( '.listheadertext' ).css('display','block');
        $( '#sidebar' ).panel( 'open' );
        $( '#logo' ).attr( 'src', 'static/css/img/logo-reverse.svg');
        // $('#directions_naviagation').css('display','none');
        $('#mapCanvas').css('bottom', '0em');
        $('#interiorCanvas').css('bottom', '0em');
    }
    resizeInterior();
});

/*
    This function just resizes map
*/
function resizeInterior() {
    $( "#interior" ).attr( "height" , $(window).height() ).attr( "width" , $( '#mainContent' ).width());
    UAlberta.Maps.Interior.updateInstance();
    UAlberta.Maps.Interior.render(true);
}