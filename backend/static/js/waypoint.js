/** Waypoints class

    This is a JQuery/JSON script designed to track and add waypoints
    to a list that can be easily sent as a JSON object in a POST
    request to a server for pathfinding.

    Waypoint JSON object types.
    Waypoints[]
        Building; {"Building":{"Key":"sub", "name":"SUB"}}
            Key: This is a the building key used in the UofA Campus maps API calls
        Room;  {"Room":{"name":"121 Subway", "parent":{"Key":"sub","Level":"1", "Name":"SUB"}}
            Room: The room name, which can be used as a key withing a building
            Parent: This is equivalent to a building object
        Coordinate;  {"Coord":{"lat":0,"lng":0}}
            Coord: This is an object which contains a latitude and longitude cooridinate
    Options
        accessibility: Handicap or wheelchair accesabile options
        indoors: The level of how indoors the route should be, 1 - 10. 5 is normal.

**/


var Waypoint = (function () {

    var _waypoints = {"Waypoints":[],"Options":{"accessibility":false, "indoors": 5}},
    endPoint = false,
    _add = {
        room: function(obj) {
            if ( obj.name && obj.parent) {
                if (obj.parent.Key && obj.parent.Level ) {
                    _waypoints.Waypoints.push(obj);
                } else {
                    //Their might be a way to find this data, will leave unimplemented for now
                }
            }
        },

        building: function(obj) {
            if ( obj.Key  && obj.name) {
                _waypoints.Waypoints.push(obj);
            }
        },

        coord: function(obj){
            if( obj.lat && obj.lng ) {
                _waypoints.Waypoints.push(obj);
            }
        }
    },

    _options = {
        setHandicap: function(enabled){
            _waypoints.Options.accessibility = enabled;
        },

        setIndoors: function(level){
            if(level > 0 && level < 11) {
                _waypoints.Options.indoors = level;
            }
        }
    };


    //Uses a JSON object and adds it to the waypoints
    function add( obj ){
        //Most detailed lat long
        if( obj.Coord ) {
            _add.coord( obj.Coord );
        //Next most detailed is a room
        } else if ( obj.Room ) {
            _add.room( obj.Room );
        //Least detailed is a building
        } else if( obj.Building ) {
            _add.building( obj.Building );
        }

    }

    //Removes the Object at index
    function remove( index ) {
        _waypoints.Waypoints.splice(index, 1);
    }

    // Needed to reorder the waypoints
    function move( oldIndex, newIndex ) {
        waypoint = _waypoints.Waypoints.splice(oldIndex, 1);
        _waypoints.Waypoints.splice(newIndex, 0, waypoint[0]);
    }

	function from( obj ) {
		add(obj);
		var st = _waypoints.Waypoints.length-1;
		move(st, 0);

	}


    //josh changed the name of this function because it didnt make sense
    //it used to be called addWayPoint but was implemented to be the to function
    //as far as i can see no calls were made to this so nothing broke
	function to( obj ) {
		add(obj);
		if(_waypoints.length > 2) {
			var st = _waypoints.Waypoints.length - 1;
			move(st, st-1);

        }
        endPoint = true;
	}
	
	function reset() {

		//_waypoints = {"Waypoints":[],"Options":{"accessibility":false, "indoors": 5}};
        _waypoints.Waypoints = [];
	}

    return {
        addPoint: add,
        removePoint: remove,
        Options: {
            handicap: _options.setHandicap,
            indoorLevel: _options.setIndoors
        },
        destinationFrom: from,
        destinationTo: to,
        //addWaypoint: addWaypoint,
        movePoint: move,
        list: _waypoints.Waypoints,
        waypoints: _waypoints,
        reset: reset
    }

}(Waypoint || {}, jQuery));