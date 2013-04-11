#!/usr/bin/env python
"""Tests for the graphbuilder package.
For now, these tests aren't automated. They write .png and .raw files to
disk that can be visually verified."""
# Do this to look up two directory levels for the pathfinder package
import os, sys
pathfinder_path = os.path.join("..", "..")
sys.path.append(pathfinder_path)

from pathfinder.graphbuilder import (
	addRoomToNavGraph,
	buildConnectionGraph,
	buildFloorNavGraph,
	buildFloorPortalConnectionGraph,
	buildNavGraph,
	getNamedPolygonsFromMetaPolygons,
	polygonToGraph,
	subdivideEdges,
	graphUnion,
	union
)
from pathfinder.graphbuilder import NamedPolygon
from pathfinder.graphvisualizer import outputGraph, graphToString, outputGraphPng
from pathfinder.voronoinavgraph import _getVoronoiGraph, _getPointList
from pathfinder.CampusMapPyAPICaller import CampusMapAPICaller
from pathfinder.searchalgorithm import SearchAlgorithm
from pathfinder.graph import Graph
from pathfinder.connectiongraph import ConnectedEntity
from pathfinder.graphmanager import loadFloorNavGraph, saveFloorNavGraph

import Polygon
import unittest
import pickle

class GraphBuilderTests(unittest.TestCase):
	
	def setUp(self):
		self.polygon = Polygon.Polygon([(-20,10),(20,10),(20,-10),(-20,-10)])
		
	def testPolygonToGraph(self):
		"""Should output a 4-sided rectange with 4 nodes.
		o-------o
		|       |
		o-------o
		"""
		graph = polygonToGraph(self.polygon)
		self.assertEqual(len(graph.getNodes()), 4)
		self.assertEqual(len(graph.getEdges()), 4)
		perim = 0
		for edge in graph.getEdges():
			#print edge.getCost()
			perim += edge.getCost()
		self.assertEqual(perim, 120)
		# outputGraph(graph, None, "polygonGraph")
		
	def testSubdivideEdges(self):
		"""Should output a 6-sided rectange with 6 nodes.
		o---o---o
		|       |
		o---o---o
		"""
		# perform each step and produce output to be checked
		# subdvide edges
		graph = polygonToGraph(self.polygon)
		subdivideEdges(graph)
		self.assertEqual(len(graph.getEdges()), 6)
		self.assertEqual(len(graph.getNodes()), 6)
		# outputGraph(graph, None, "subdividedGraph")
		
		# get voronoi graph
		# get point list		
		#points = _getPointList(graph)
		#for point in points:
		#	print((point.x(), point.y()))
		
	def testGetVoronoiGraph(self):
		"""Should output what looks like 2 nodes connected by an edge,
		but is actually 4 nodes: two at each end that overlap:
		oo-----oo
		"""
		graph = polygonToGraph(self.polygon)
		subdivideEdges(graph)
		vGraph = _getVoronoiGraph(graph)
		self.assertEqual(len(vGraph.getNodes()), 4)
		self.assertEqual(len(vGraph.getEdges()), 3)
		#for node in vGraph.getNodes():
		#	print ((node.getX(), node.getY()))
		#print graphToString(vGraph)
		# outputGraph(vGraph, None, "voronoiGraph")
	
	def testBuildNavGraph(self):
		"""Should first output two nodes connected by an edge:
		o------o
		
		And then output a reverse L shape with 3 nodes and 2 edges:
		          o
		         /
		        /
		o------o
		"""
		# create a simple polygon without holes
		# run buildNavGraph() on it
		navGraph = buildNavGraph(self.polygon)
		self.assertEqual(len(navGraph.getNodes()), 2)
		self.assertEqual(len(navGraph.getEdges()), 1)
		# outputGraph(navGraph, None, "navGraph")
		# add room to navGraph
		room = Polygon.Polygon([(10,10),(10,30),(20,30),(20,10)])
		room2 = NamedPolygon("name", "refId", room)
		addRoomToNavGraph(navGraph, self.polygon, room2)
		# outputGraph(navGraph, None, "addedRoom", True, 30)
		self.assertEqual(len(navGraph.getNodes()), 3)
		self.assertEqual(len(navGraph.getEdges()), 2)
		
	def testRealBigHallway(self):
		polys = readHallwayFile("/Users/colinhunt/Dropbox/UofA/Cmput 401/Pathfinding/sub_2nd_floor_hallways.txt")
		poly1 = Polygon.Polygon(polys[0])
		poly2 = Polygon.Polygon(polys[1])
		#print poly1.nPoints()
		#print poly2.nPoints()
		Polygon.setTolerance(1)
		polygon = poly1 + poly2
		# it is fairly large so scale it down
		#polygon.scale(.1, .1)
		#print polygon.nPoints()
		graph = polygonToGraph(polygon)
		#print len(graph.getNodes())
		#print len(graph.getEdges())
		# outputGraphPng(graph, "bigHallway")
		navGraph = buildNavGraph(polygon)
		self.assertEqual(len(navGraph.getNodes()), 553)
		self.assertEqual(len(navGraph.getEdges()), 553)
		# with open("testData.txt", 'a') as f:
		# 	f.write("testRealBigHallway: nodes " + str(len(navGraph.getNodes())) + ", edges " + str(len(navGraph.getEdges())))
		# outputGraph(navGraph, None, "bigNavGraph")
		
		#try and call search algorithm on it
		nodes = list(navGraph.getNodes())
		searchAlg = SearchAlgorithm(nodes[0], nodes[len(nodes)-1])
		solution = searchAlg.search()
		self.assertIsNotNone(solution)
		# outputGraph(navGraph, solution.getNodes(), "solution")
	
class TestBuildingNavGraph(unittest.TestCase):
	
	def setUp(self):
		self.caller = CampusMapAPICaller()
		self.caller.getFloorJsonFromServer("CAB", "1")
		self.rooms = self.caller.getRooms()
		self.hallways = self.caller.getHallways()
		# self.hallway = union(getNamedPolygonsFromMetaPolygons(self.hallways))
		self.portals = self.caller.getPortals()
		spaces = [self.rooms, self.portals]
		# outputGraph(polygonToGraph(self.hallway), None, "hallwayGraph")
		
	def testAddPortals(self):
		self.flNavGraph = buildFloorNavGraph(self.hallways, [self.portals])
# 		self.assertEqual(len(self.flNavGraph.getNodes()), 823)
# 		self.assertEqual(len(self.flNavGraph.getEdges()), 1529)
		# with open("testData.txt", 'a') as f:
		# 	f.write("testAddPortals: nodes " + str(len(self.flNavGraph.getNodes())) + ", edges " + str(len(self.flNavGraph.getEdges())))
		# outputGraph(self.flNavGraph, None, "testAddPortals")

	def testAddRooms(self):
# 		outputGraph(self.flNavGraph, None, "testAddRoomsTrib4", False, 50)
		self.flNavGraph = buildFloorNavGraph(self.hallways, self.rooms.values(),[],[])
# 		self.assertEqual(len(self.flNavGraph.getNodes()), 829)
# 		self.assertEqual(len(self.flNavGraph.getEdges()), 3074)		
		# with open("testData.txt", 'a') as f:
		# 	f.write("testAddRooms: nodes " + str(len(self.flNavGraph.getNodes())) + ", edges " + str(len(self.flNavGraph.getEdges())))
 		outputGraph(self.flNavGraph, None, "testAddRoomsTri", False, 50)
		outputGraph(self.flNavGraph, None, "testAddRoomsTri")

	def testFindPath(self):
		room1Name = "155"
		room2Name = "Booster Juice  Extreme Pita"
		testRooms = []
		# for room in self.rooms:
		# 	if room.getName() == room1Name or room.getName() == room2Name:
		# 		testRooms.append(room)
		testRooms.append(self.rooms[room1Name, 0])
		testRooms.append(self.rooms[room2Name, 0])
		print len(testRooms)
		assert(len(testRooms) == 2)
		self.flNavGraph = buildFloorNavGraph(self.hallways, [testRooms])
		self.assertEqual(len(self.flNavGraph.getNodes()), 821)
		self.assertEqual(len(self.flNavGraph.getEdges()), 1184)		
		# with open("testData.txt", 'a') as f:
		# 	f.write("testFindPath: nodes " + str(len(self.flNavGraph.getNodes())) + ", edges " + str(len(self.flNavGraph.getEdges())))
		# try getting two rooms and finding a path
		room1Node = self.flNavGraph.getNode(room1Name, "")
		room2Node = self.flNavGraph.getNode(room2Name, "")
		finder = SearchAlgorithm(room1Node, room2Node)
		solution = finder.search()
		print len(solution.getNodes())
		self.assertEqual(len(solution.getNodes()), 123)
		self.assertEqual(len(solution.getEdges()), 122)		
		# with open("testData.txt", 'a') as f:
		# 	f.write("testFindPath solution: nodes " + str(len(solution.getNodes())) + ", edges " + str(len(solution.getEdges())))
		# outputGraph(self.flNavGraph, solution.getNodes(), "testFindPath")
		# outputGraph(solution, None, "testFindPathSolution")
		
#	def testAddMultipleRooms(self):
#		print "building floor nav graph"
#		print len(self.hallways)
#		print len(self.portals)
#		self.flNavGraph = buildFloorNavGraph(self.hallways, spaces)
#		
class TestConnectionGraphs(unittest.TestCase):
	
	def setUp(self):
		self.building = "CAB"
		self.levels = ["1", "2"]
		self.portalsByLevel = {}
		for level in self.levels:
			caller = CampusMapAPICaller()
			caller.getFloorJsonFromServer(self.building, level)
			rooms = caller.getRooms()
			hallways = caller.getHallways()
			# hallway = union(getNamedPolygonsFromMetaPolygons(hallways))
			self.portalsByLevel[level] = caller.getPortals()
			flNavGraph = buildFloorNavGraph(hallways, [self.portalsByLevel[level]])
			# outputGraph(flNavGraph, None, "testConnectionGraphsLevel" + level + "NavGraph")
			saveFloorNavGraph(self.building, level, flNavGraph)
			# self.assertEqual(len(self.portals), 4)
			# spaces = [self.rooms, self.portals]
			# flNavGraph = loadFloorNavGraph(self.building, self.level)
			# if flNavGraph is None:
			# 	flNavGraph = buildFloorNavGraph(self.hallways, [self.portals])
			# 	outputGraph(flNavGraph, None, "testConnectionGraphsFlNavGraph")
			# 	saveFloorNavGraph(self.building, self.level, flNavGraph)

	def testBuildFloorPortalConnectionGraph(self):
		print "building connection graph"
#		<pathfinder.graph.Node object at 0x103051bd0>
#Elevator,e2
#<pathfinder.graph.Node object at 0x10304f6d0>
#Stairs,s4
		# outputGraph(self.flNavGraph, None, "floorNavGraph")
		#nodeA = self.flNavGraph.getNode("Elevator", "e2")
		#nodeB = self.flNavGraph.getNode("Stairs", "s4")
		#searchAlg = SearchAlgorithm(nodeA, nodeB)
		#searchAlg.search()
		building = "CAB"
		level = "1"
		self.connectedPortals = []
		for portal in self.portalsByLevel["1"]:
			self.connectedPortals.append(ConnectedEntity(portal, building, level))
		connectionGraph = Graph()
		buildConnectionGraph(connectionGraph, self.connectedPortals)
		# outputGraph(connectionGraph, None, "testBuildFloorPortalConnectionGraph", False, None)
		self.assertEqual(len(connectionGraph.getNodes()), 4)
		self.assertEqual(len(connectionGraph.getEdges()), 6)
		
	def testBuildBuildingPortalConnectionGraph(self):
		print "building building connection graph"
		self.connectedPortals = []
		for level in self.levels:
			for portal in self.portalsByLevel[level]:
				self.connectedPortals.append(ConnectedEntity(portal, self.building, level))
		connectionGraph = Graph()
		buildConnectionGraph(connectionGraph, self.connectedPortals)
		# outputGraph(connectionGraph, None, "testBuildBuildingPortalConnectionGraph", False, None)

		# try to find a path now
		nameA, refIdA, levelA = "Elevator", "e1", "1"
		nameB, refIdB, levelB = "Stairs", "s3", "2"
		nodeA = connectionGraph.getNode(nameA, refIdA, levelA)
		nodeB = connectionGraph.getNode(nameB, refIdB, levelB)
		finder = SearchAlgorithm(nodeA, nodeB)
		path = finder.search()
		self.assertEqual(len(path.getNodes()), 3)
		self.assertEqual(len(path.getEdges()), 2)		
		# with open("testData.txt", 'a') as f:
		# 	f.write("testBuildBuildingPortalConnectionGraph path: nodes " + str(len(path.getNodes())) + ", edges " + str(len(path.getEdges())))
		# outputGraph(path, None, "testPathInConnectionGraph", False, None)
		# for i, edge in enumerate(path.getEdges()):
			# outputGraph(edge.path, None, "path%d" % (i))

class TestSaveLoadNavGraphs(unittest.TestCase):

	def runTest(self):
		building = "CAB"
		level = "1"
		caller = CampusMapAPICaller()
		caller.getFloorJsonFromServer(building, level)
		portals = caller.getPortals()
		hallways = caller.getHallways()
		flNavGraph = buildFloorNavGraph(hallways, [portals])
		sys.setrecursionlimit(50000)
		with open(building + level + "navGraph.txt", 'w') as f:
			pickle.dump(flNavGraph, f)
		# print flNavGraphString





def readHallwayFile(filePath):
	f = open(filePath, 'r')
	polys = []
	poly = []
	for line in f:
		line = line.rstrip()
		if line == "":
			#print "blank"
			polys.append(poly)
			poly = []
			continue
		(xCoord, comma, zCoord) = line.partition(",")
		poly.append((xCoord, zCoord))
	return polys
				
if __name__ == '__main__':
    unittest.main()
