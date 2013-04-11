from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from django.utils import simplejson
import mimetypes
import urllib2
from pathfinder.CampusMapPyAPICaller import CampusMapAPICaller
import backend.pathfinder.graphbuilder as gbuilder
from pathfinder.searchalgorithm import SearchAlgorithm
from pathfinder.jsonutils import createJsonFromNodes, createJsonFromLatLon
from pathfinder.graphvisualizer import outputGraph
import pathfinder.graphmanager as gman
import backend.pathfinder.pathfinder as pathfinder
import backend.pathfinder.utils as utils
from backend.pathfinder.connectiongraph import EXTERIOR
import json

# from pathfinder.pathfinder import findPath

def proxy_to_exterior(request,  target_url):
    print "targeturl : " + str(target_url)
    category = request.GET.get('category')
    flag = request.GET.get('flag')
    isMobile = request.GET.get('isMobile')
    values = "{ 'parameters':{'category': '"+ category +"', 'flag': '"+ flag +"','isMobile': '"+ isMobile +"'}}"
    headers = {"content-type": "application/json"}
    try:
        req = urllib2.Request(target_url, values, headers)
        proxied_request = urllib2.urlopen(req)
        content = proxied_request.read()
    except urllib2.HTTPError as e:
        print "urllib2 http error!"
        return HttpResponse(e.msg, status=e.code, mimetype='text/plain')
    else:
        print "urllib2 http request succeed"
        return HttpResponse(content,  mimetype='application/json')

def proxy_to_interior(request,  target_url):
    buildingName = request.GET.get('BuildingName')
    level = request.GET.get('Level')
    values =  "{ 'parameters':{'BuildingName': '"+ buildingName +"', 'Level': '"+ level +"'}}"
    headers = {"content-type": "application/json"}
    try:
        req = urllib2.Request(target_url, values, headers)
        proxied_request = urllib2.urlopen(req)
        content = proxied_request.read()
    except urllib2.HTTPError as e:
        return HttpResponse(e.msg, status=e.code, mimetype='text/plain')
    else:
        return HttpResponse(content,  mimetype='application/json')


def index(request) :
    return render(request, 'frontend/CampusMaps.html')

def pathfinding(request):
    ### IMPLEMENT PATHFINDING HERE ###
    data = {}
    paths= []
    if request.method == "POST" and request.is_ajax: 
    #   Retrieve Data from request
        waypointsWithOptions = json.loads(request.raw_post_data)
    #Get Parameters here as a list of waypoints:
        waypoints = waypointsWithOptions["Waypoints"]
        options = waypointsWithOptions["Options"]
    # if (len(waypoints) > 2):
    # data["status"] = "INVALID_NUMBER_OF_WAYPOINTS"
    # data["message"] = "Only two waypoints is accepted at a time now"
    # return HttpResponse(simplejson.dumps(data), mimetype='application/json')    
    # paths = pathfinder.findPaths(waypoints)
    #Get Parameters here as a list of waypoints:
    for i in range(0, len(waypoints)-1):
        start =  waypoints[i]
        end = waypoints[i+1]
        print i
        findTwoPointPath(start, end, paths)
        if len(paths) == 0:
            data["message"] += "Path could not be found for "+ start["parent"]["Key"] + " " + start["name"] + " to " + end["parent"]["Key"] + " " + end["name"]+"\n"

    
    if len(paths) > 0:
        data["status"] = "ok"
        # data["message"] = "Path found"
        data["waypoints"] = paths
    else:
        data["status"] = "PATHNOTFOUND"
    
    
    #Return json object back to frontend
    print "returning data.."
    return HttpResponse(simplejson.dumps(data), mimetype='application/json')


def findTwoPointPath(start, end, paths):
    
    startBuilding = start["parent"]["Key"] 
    startFloor = str(start["parent"]["Level"])
    endBuilding = end["parent"]["Key"]
    endFloor = str(end["parent"]["Level"])
            
    startRoomName = start["name"]
    endRoomName = end["name"]

    print "Finding path from " + startRoomName + ", " + startBuilding + ", " + startFloor
    print " to " + endRoomName + ", " + endBuilding + ", " + endFloor

    startRefId = ""
    endRefId = ""
    
    startNode = None
    endNode = None
    solution = None 

    if startFloor == endFloor and startBuilding == endBuilding:
        startFlNavGraph = gman.loadFloorNavGraph(startBuilding, startFloor)
        startNode = startFlNavGraph.getNode(startRoomName, startRefId)
        endNode = startFlNavGraph.getNode(endRoomName, endRefId)
        assert startNode is not None and endNode is not None
        finder = SearchAlgorithm(startNode, endNode)
        
        solution = finder.search()
        if solution is not None:
            paths.append(createJsonFromNodes(solution.getNodes(), startBuilding, startFloor))        
    elif startBuilding == endBuilding:
        startBuildingGraph = gman.loadBuildingConnectionGraph(startBuilding)
        startNode = gbuilder.addRoomToBuildingGraph(startRoomName, startRefId, startFloor, startBuilding, startBuildingGraph)

        endBuildingGraph = startBuildingGraph
        endNode = gbuilder.addRoomToBuildingGraph(endRoomName, endRefId, endFloor, endBuilding, endBuildingGraph, True)

        assert startNode is not None and endNode is not None
        finder = SearchAlgorithm(startNode, endNode)        
        solution = finder.search(["Stairs", "Elevator", "Entrance", ""])
        if solution is not None:
            for buildingEdge in solution.getEdges():
                if buildingEdge.floor is not None: # building edge between rooms on same floor
                    path = buildingEdge.getPath()
                    paths.append(createJsonFromNodes(path.getNodes(), startBuilding, buildingEdge.floor))

    else: # need to search campus graph
        campusGraph = gman.loadCampusConnectionGraph(1)
        startCampusNode = gbuilder.addRoomToCampusGraph(startRoomName, startRefId, startFloor, startBuilding, campusGraph, utils.Position(-113.526666, 53.526666))

        endCampusNode = gbuilder.addRoomToCampusGraph(endRoomName, endRefId, endFloor, endBuilding, campusGraph, utils.Position(-113.524955, 53.526450), True)
        # outputGraph(campusGraph, None, "viewsCampusGraph", True, 10, 'svg', 30000)
        assert startCampusNode is not None and endCampusNode is not None
        finder = SearchAlgorithm(startCampusNode, endCampusNode, utils.zeroHeuristic)
        solution = finder.search(["Entrance"])
        if solution is not None:
            for campusEdge in solution.getEdges():
                if campusEdge.environment == EXTERIOR:
                    nodeA, nodeB = campusEdge.getEnds()
                    paths.append(createJsonFromLatLon(nodeA))
                    paths.append(createJsonFromLatLon(nodeB))
                    print "Exterior edge distance", campusEdge.getCost()
                else: # edge in a building between doors or between room and door
                    for buildingEdge in campusEdge.getPath().getEdges():
                        if buildingEdge.floor is not None: # building edge between rooms on same floor
                            path = buildingEdge.getPath()
                            print "Interior path distance for", campusEdge.environment, buildingEdge.floor, "is", path.getDistance()
                            paths.append(createJsonFromNodes(path.getNodes(), campusEdge.environment, buildingEdge.floor))

