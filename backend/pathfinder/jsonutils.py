from backend.pathfinder.utils import Position


"""position is a list of utils.Position objects. 
    Notice that for this current implementation, 
    in the return Json data, y always is 2 (integer)
    """
def createJsonFromPath(positions):
    path = []
    for pos in positions:
        jsonWaypoint = {}
        jsonPos= {}
        
#       Notice the swap of z and y coordinate
        jsonPos['x'] = pos._x
        # as per request of the front end, y coordinate should be 2
        #jsonPos['y'] = pos._z
        jsonPos['y'] = 2
        jsonPos['z'] = pos._y
        jsonWaypoint["Lines"] = jsonPos
        path.append(jsonWaypoint)

    return path

def createJsonFromNodes(nodes, bKey, floor):
    jsonWaypoint = {}
    jsonWaypoint["Key"] = bKey
    jsonWaypoint["Level"] = floor
    jsonLines = []
    for node in nodes: 
        jsonPos= {}
#       Notice the swap of z and y coordinate
        jsonPos["x"] = node.getX()
        # as per request of the front end, y coordinate should be 2
        #jsonPos['y'] = pos._z
        jsonPos["y"] = 2
        jsonPos["z"] = node.getY()
        jsonLines.append(jsonPos)
    jsonWaypoint["Lines"] = jsonLines

    return jsonWaypoint
        
def createJsonFromLatLon(campusNode):
    jsonWaypoint = {}
    coord = {}
    coord["lat"] = campusNode.getY()
    coord["lng"] = campusNode.getX()
    jsonWaypoint["Coord"] = coord
    return jsonWaypoint
