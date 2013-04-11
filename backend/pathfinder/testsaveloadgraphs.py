from backend.pathfinder.graphmanager import (
	saveFloorNavGraph,
	loadFloorNavGraph,
	loadBuildingConnectionGraph,
	loadCampusConnectionGraph
)
from backend.pathfinder.graphvisualizer import outputGraph
from backend.pathfinder.graphupdatetools import (
	updateDbFloorNavGraph, 
	updateDbBuildingConnectionGraph,
	updateDbCampusConnectionGraph
)
# import graph
import unittest

# CCIS, 2
# SUB, 2
# SUB, 1

class TestSaveGraphs(unittest.TestCase):

	def setUp(self):
		# should reset the test database here and populate with some
		# data
		pass
 
	def test0_SaveNavGraph(self):
		# self.assertTrue(updateDbFloorNavGraph("ATH", "1"))
		# self.assertTrue(updateDbFloorNavGraph("ATH", "2"))
		# self.assertTrue(updateDbFloorNavGraph("SUB", "1"))
		self.assertTrue(updateDbFloorNavGraph("SUB", "-1"))
		# self.assertTrue(updateDbFloorNavGraph("ATH", "3"))
		# self.assertTrue(updateDbFloorNavGraph("ATH", "4"))

	def test1_SaveBuildingGraph(self):
		# self.assertTrue(updateDbBuildingConnectionGraph("ATH", ["1", "2"]))
		self.assertTrue(updateDbBuildingConnectionGraph("SUB", ["1", "-1"]))

	# def test2_SaveCampusGraph(self):
	# 	self.assertTrue(updateDbCampusConnectionGraph("North Campus"))

class TestLoadGraphs(unittest.TestCase):

	def test0_LoadNavGraph(self):
		# assume we already have some graphs saved into the database
		navGraph = loadFloorNavGraph("sub", "2")
		self.assertIsNotNone(navGraph)
		print len(navGraph.getNodes())
		print len(navGraph.getEdges())
		outputGraph(navGraph, None, "testLoadNavGraphSUB2")
		# navGraph = loadFloorNavGraph("ATH", "2")
		# self.assertIsNotNone(navGraph)
		# outputGraph(navGraph, None, "testLoadNavGraphATH2")
		# navGraph = loadFloorNavGraph("SUB", "1")
		# self.assertIsNotNone(navGraph)
		# outputGraph(navGraph, None, "testLoadNavGraphSUB")

	def test1_LoadBuildingGraph(self):
		# conGraph = loadBuildingConnectionGraph("ATH")
		# outputGraph(conGraph, None, "testLoadBldgGraphATH", False, 50)
		conGraph = loadBuildingConnectionGraph("SUB")
		
		print "checking bldg connection graph.."
		for node in conGraph.getNodes():
			for neighbor in node.getNeighbors():
				assert(neighbor.getEdgeTo(node) is not None)
				
		print len(conGraph.getNodes())
		print len(conGraph.getEdges())		
		outputGraph(conGraph, None, "testLoadBldgGraphSUB", False, 50)

	def test2_LoadCampusGraph(self):
		campGraph = loadCampusConnectionGraph(1)
		outputGraph(campGraph, None, "testLoadCampusConnectionGraph2", True, 50, 'jpg', 10000)
		# outputGraph(campGraph, None, "testLoadCampusConnectionGraph2", False, 50)

if __name__ == '__main__':
    unittest.main()
