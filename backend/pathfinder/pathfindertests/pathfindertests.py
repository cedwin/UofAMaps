#!/usr/bin/env python
# Do this to look up two directory levels for the pathfinder package
import os, sys
pathfinder_path = os.path.join("..", "..")
sys.path.append(pathfinder_path)

from pathfinder import graph
from pathfinder.searchalgorithm import SearchAlgorithm
from pathfinder.graphvisualizer import outputGraph
import unittest

class TestPathFinderOnRomaniaGraph(unittest.TestCase):
	
	def setUp(self):
		self.graph = graph.Graph()
		sibiu = self.graph.addNode(graph.Position(0,12))
		rimnicu = self.graph.addNode(graph.Position(2,7))
		fagaras = self.graph.addNode(graph.Position(9,12))
		pitesti = self.graph.addNode(graph.Position(10,5))
		bucharest = self.graph.addNode(graph.Position(18,0))
		edge1 = self.graph.addEdge(sibiu, fagaras)
		edge2 = self.graph.addEdge(sibiu, rimnicu)
		edge3 = self.graph.addEdge(fagaras, bucharest)
		edge4 = self.graph.addEdge(rimnicu, pitesti)
		edge5 = self.graph.addEdge(pitesti, bucharest)
		edge1.setCost(99)
		edge2.setCost(80)
		edge3.setCost(211)
		edge4.setCost(97)
		edge5.setCost(101)
		self.correctSolution = [sibiu, rimnicu, pitesti, bucharest]
		self.sibiu = sibiu
		self.bucharest = bucharest
		outputGraph(self.graph, self.correctSolution)
		
	def runTest(self):
		finder = SearchAlgorithm(self.sibiu, self.bucharest)
		solution = finder.search()
		self.assertEqual(solution.getNodes(), self.correctSolution)
		self.assertEqual(solution.getDistance(), 80 + 97 + 101)
		
	def run2TimesTest(self):
		"Run twice with two instances to ensure independence."
		for i in range(2):
			finder = SearchAlgorithm(self.sibiu, self.bucharest)
			solution = finder.search()
			self.assertEqual(solution.getNodes(), self.correctSolution)
			self.assertEqual(solution.getDistance(), 80 + 97 + 101)

if __name__ == '__main__':
    unittest.main()
