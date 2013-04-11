#!/usr/bin/env python
import backend.pathfinder.graph as graph
from backend.pathfinder.graph import Position
import unittest

class TestGraphConstructor(unittest.TestCase):
	
	def runTest(self):
		g = graph.Graph()
		self.assertEqual(len(g.getNodes()), 0)
		self.assertEqual(len(g.getEdges()), 0)

class TestAddRemoveNodes(unittest.TestCase):
	
	def runTest(self):
		g = graph.Graph()
		node1 = g.addNode()
		self.assertEqual(len(g.getNodes()), 1)
		self.assertEqual(node1.getIndex(), 0)
		node2 = g.addNode()
		self.assertEqual(len(g.getNodes()), 2)
		self.assertEqual(node2.getIndex(), 1)
		self.assertTrue(node1 in g.getNodes())
		self.assertTrue(node2 in g.getNodes())
		g.removeNode(node1)
		self.assertTrue(node1 not in g.getNodes())
		self.assertEqual(len(g.getNodes()), 1)
		g.removeNode(node2)
		self.assertTrue(node2 not in g.getNodes())
		self.assertEqual(len(g.getNodes()), 0)
		
		
class TestAddEdges(unittest.TestCase):
	
	def setUp(self):
		self.g = graph.Graph()
		self.node1 = self.g.addNode()
		self.node2 = self.g.addNode()
		self.node3 = self.g.addNode()
		self.node4 = self.g.addNode()
	
	def testAddEdge(self):
		edge1 = self.g.addEdge(self.node1, self.node2)
		self.assertEqual(edge1.getIndex(), 0)
		self.assertEqual(len(self.g.getEdges()), 1)
		self.assertTrue(edge1 in self.g.getEdges())
		edge2 = self.g.addEdge(self.node3, self.node4)
		self.assertEqual(edge2.getIndex(), 1)
		self.assertEqual(len(self.g.getEdges()), 2)
		self.assertTrue(edge2 in self.g.getEdges())
		
	def testEdgeGetEnds(self):
		edge = self.g.addEdge(self.node1, self.node2)
		ends = set(edge.getEnds())
		nodes = set([self.node1, self.node2])
		self.assertTrue(ends == nodes)
		self.assertTrue(self.node1 in ends)
		self.assertTrue(self.node2 in ends)
		
	def testNodeGetNeighbors(self):
		self.assertEqual(len(self.node1.getNeighbors()), 0)
		edge1 = self.g.addEdge(self.node1, self.node2)
		edge2 = self.g.addEdge(self.node1, self.node3)
		self.assertEqual(len(self.node1.getNeighbors()), 2)
		neighbors = self.node1.getNeighbors()
		self.assertTrue(self.node2 in neighbors)
		self.assertTrue(self.node3 in neighbors)
		self.assertTrue(self.node1 not in neighbors)
		self.assertTrue(self.node4 not in neighbors)
		self.g.removeEdge(edge1)
		self.assertEqual(len(self.node1.getNeighbors()), 1)
		neighbors = self.node1.getNeighbors()
		self.assertTrue(self.node2 not in neighbors)
		self.assertTrue(self.node3 in neighbors)
		
class TestGetEdgeMethods(unittest.TestCase):
	
	def setUp(self):
		self.g = graph.Graph()
		self.node1 = self.g.addNode()
		self.node2 = self.g.addNode()
		self.node3 = self.g.addNode()
		self.node4 = self.g.addNode()
		self.edge1 = self.g.addEdge(self.node1, self.node2)
		self.edge2 = self.g.addEdge(self.node3, self.node4)
		
	def testGetEdge(self):
		edgeA = self.g.getEdge(self.node1, self.node2)
		self.assertTrue(edgeA is self.edge1)
		edgeB = self.g.getEdge(self.node3, self.node4)
		self.assertTrue(edgeB is self.edge2)
		edgeC = self.g.getEdge(self.node1, self.node4)
		self.assertIsNone(edgeC)
		
	def testNodeGetEdgeTo(self):
		edgeA = self.node1.getEdgeTo(self.node2)
		self.assertIs(edgeA, self.edge1)
		edgeB = self.node2.getEdgeTo(self.node1)
		self.assertIs(edgeA, edgeB, self.edge1)
		
class TestEdgeIntersection(unittest.TestCase):
	
	def setUp(self):
		g = graph.Graph()
		self.nodeA = g.addNode(Position(2,2))
		self.nodeB = g.addNode(Position(-2,-2))
		self.nodeC = g.addNode(Position(-2,2))
		self.nodeD = g.addNode(Position(2,-2))
		self.edge1 = g.addEdge(self.nodeA, self.nodeB)
		self.edge2 = g.addEdge(self.nodeC, self.nodeD)
		self.g = g
		
	def testPerpendicularIntersection(self):
		self.assertTrue(self.edge1.intersects(self.edge2))
		self.assertTrue(self.edge2.intersects(self.edge1))
		
	def testParallelNonIntersection(self):
		self.nodeD.setPosition(Position(2,6))
		self.assertFalse(self.edge1.intersects(self.edge2))
		self.assertFalse(self.edge2.intersects(self.edge1))
		
	def testNonParallelNonIntersection(self):
		self.nodeD.setPosition(Position(2,5))
		self.assertFalse(self.edge1.intersects(self.edge2))
		self.assertFalse(self.edge2.intersects(self.edge1))
		
	def testSharedNodeNonIntersection(self):
		edge3 = self.g.addEdge(self.nodeC, self.nodeA)
		self.assertFalse(self.edge1.intersects(edge3))
		self.assertFalse(edge3.intersects(self.edge1))
				
	def testShallowIntersection(self):
		self.nodeC.setPosition(Position(-1.5,-2))
		self.nodeD.setPosition(Position(1.5, 2))
		self.assertTrue(self.edge1.intersects(self.edge2))
		self.assertTrue(self.edge2.intersects(self.edge1))
		
	def testVerticalIntersection(self):
		self.nodeC.setPosition(Position(0,2))
		self.nodeD.setPosition(Position(0,-2))
		self.assertTrue(self.edge1.intersects(self.edge2))
		self.assertTrue(self.edge2.intersects(self.edge1))
		
	def testHorizontalIntersection(self):
		self.nodeC.setPosition(Position(-2,0))
		self.nodeD.setPosition(Position(2,0))
		self.assertTrue(self.edge1.intersects(self.edge2))
		self.assertTrue(self.edge2.intersects(self.edge1))
		
	def testVerticalParallelNonIntersection(self):
		self.nodeA.setPosition(Position(1,2))
		self.nodeB.setPosition(Position(1,-2))
		self.nodeC.setPosition(Position(0,2))
		self.nodeD.setPosition(Position(0,-2))
		self.assertFalse(self.edge1.intersects(self.edge2))
		self.assertFalse(self.edge2.intersects(self.edge1))

	def testHorizontalParallelNonIntersection(self):
		self.nodeA.setPosition(Position(-2,1))
		self.nodeB.setPosition(Position(2,1))
		self.nodeC.setPosition(Position(-2,0))
		self.nodeD.setPosition(Position(2,0))
		self.assertFalse(self.edge1.intersects(self.edge2))
		self.assertFalse(self.edge2.intersects(self.edge1))
		
	def testOverlappingNonIntersection(self):
		self.nodeC.setPosition(Position(2,2))
		self.nodeD.setPosition(Position(-2,-2))
		self.assertFalse(self.edge1.intersects(self.edge2))
		self.assertFalse(self.edge2.intersects(self.edge1))
		

if __name__ == '__main__':
    unittest.main()
