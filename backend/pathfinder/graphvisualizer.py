#!/usr/bin/env python

import pydot
import backend.pathfinder.graph as graph

nodeWidth = .25
nodeHeight = nodeWidth

def outputGraph(graph, solution=None, filename=None, preserve=True, dpi=10, format='svg', scale=1):
	"""Write the graph with the solution highlighted to a png image file.
	This function translates between our graph representation and the pydot
	graph representation, sets some attributes, and then writes to a file.
	pydot handles all the work of file-writing.
	"""
	if filename is None:
		filename = 'graph'
	# create the pydot graph which will write the image
	dotGraph = getDotGraph(graph, dpi, scale)
	if solution is not None:
		for i in range(len(solution)-1):
			# iterate through all the solution nodes, edges and color them
			dotNode1 = dotGraph.get_node(str(solution[i].getIndex()))
			dotNode2 = dotGraph.get_node(str(solution[i+1].getIndex()))
			dotEdge = dotGraph.get_edge(dotNode1[0], dotNode2[0])
			if dotEdge != []:
				dotEdge[0].set_color("red")
				dotEdge[0].set_style("bold")
			if dotNode1 != []:
				dotNode1[0].set_color("green")
				dotNode1[0].set_style("filled")
				dotNode1[0].set_width(dotNode1[0].get_width() * 4)
				dotNode1[0].set_height(dotNode1[0].get_height() * 4)
			if dotNode2 != []:
				dotNode2[0].set_color("green")
				dotNode2[0].set_style("filled")
	print "writing graph to", filename
	if preserve:
		# finally, write to a svg file using neato to preserve node positions
		dotGraph.write(filename + '.' + format, prog="neato", format=format)
	else:
		print "not preserving node positions"
		dotGraph.write(filename + '.' + format, format=format)
	dotGraph.write_raw(filename + ".raw")
	
def outputGraphPng(graph, filename):
	if filename is None:
		filename = 'graph'
	dotGraph = getDotGraph(graph)
	dotGraph.write_png(filename + ".png", prog="neato")
	

def getDotGraph(graph, dpi=None, scale=1):
	print "generating dot graph"
	if dpi is None:
		dotGraph = pydot.Dot(graph_type='graph')
	else:
		dotGraph = pydot.Dot(graph_type='graph', dpi=dpi)

	for edge in graph.getEdges():
		"Create the nodes and edges in the graph."
		node1, node2 = edge.getEnds()
		name1, name2 = (str(node1.getIndex()), (str(node2.getIndex())))
		try:
			name1 = "{}|{}-{},{}-L{}".format(name1, node1.name, node1.refId, node1.building, node1.level)
			name2 = "{}|{}-{},{}-L{}".format(name2, node2.name, node2.refId, node2.building, node2.level)
		except:
			try:
				name1 = "{}|{}-{},L{}".format(name1, node1.name, node1.refId, node1.level)
				name2 = "{}|{}-{},L{}".format(name2, node2.name, node2.refId, node2.level)
			except:
				pass
			pass
		# Try and get the nodes first in case they're already added
		dotNode1 = dotGraph.get_node(name1)
		dotNode2 = dotGraph.get_node(name2)
		# Returns empty list if node does not exist yet
		if dotNode1 == []:
			# create the pydot node with the correct name and position and add it to the pydot graph
			n1pos = "%f,%f!" % (node1.getX() * scale, node1.getY() * scale)
			dotNode1 = pydot.Node(name1, pos=n1pos, height=nodeHeight, width=nodeWidth, style="filled", color="black", fontcolor="white", fontsize=22)
			dotGraph.add_node(dotNode1)
		if dotNode2 == []:
			# create the pydot node with the correct name and position and add it to the pydot graph
			n2pos = "%f,%f!" % (node2.getX() * scale, node2.getY() * scale)
			dotNode2 = pydot.Node(name2, pos=n2pos, height=nodeHeight, width=nodeWidth, style="filled", color="black", fontcolor="white", fontsize=22)
			dotGraph.add_node(dotNode2)
		# Else, pydot can return a single-element list so must get the instance out of it
		if isinstance(dotNode1, list):
			dotNode1 = dotNode1[0]
		if isinstance(dotNode2, list):
			dotNode2 = dotNode2[0]
		# create the edge between the nodes
		dotEdge = pydot.Edge(dotNode1, dotNode2, style="bold", penwidth=7, label=str(edge.getCost()))
		dotGraph.add_edge(dotEdge)
	return dotGraph

def graphToString(graph):
	dotGraph = getDotGraph(graph)
	return dotGraph.to_string()

		
def test():
	g = graph.Graph()
	n1 = g.addNode()
	n2 = g.addNode()
	n3 = g.addNode()
	e1 = g.addEdge(n1, n2)
	e2 = g.addEdge(n2, n3)
	dotGraph = pydot.Dot(graph_type='graph')
	for edge in g.getEdges():
		u, v = edge.getEnds()
		dotU = pydot.Node(str(u.getIndex()))
		dotV = pydot.Node(str(v.getIndex()))
		dotGraph.add_edge(pydot.Edge(dotU, dotV))
	dotGraph.write_png('test.png')